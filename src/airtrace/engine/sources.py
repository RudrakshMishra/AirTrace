"""Pollution source scoring engine (Fire, Traffic, Dust, Industry, Other).

Pure functions implementing the mathematical formulation defined in CLAUDE.md.
"""

from __future__ import annotations

import math
from typing import Any

from airtrace.engine.geo import haversine_km, is_upwind


def logistic(x: float, k: float = 0.05, x0: float = 50.0) -> float:
    """Standard logistic function bounded between 0.0 and 1.0.

    Args:
        x: Input value (e.g., pollutant concentration in µg/m³)
        k: Steepness of curve
        x0: Midpoint value where logistic = 0.5

    Returns:
        Value between 0.0 and 1.0
    """
    try:
        return 1.0 / (1.0 + math.exp(-k * (x - x0)))
    except OverflowError:
        return 0.0 if (x - x0) < 0 else 1.0


def score_fire_source(
    ward_lat: float,
    ward_lon: float,
    fires: list[dict[str, Any]],
    wind_from_deg: float,
    wind_speed_kmh: float,
    pm25: float | None = None,
    pm10: float | None = None,
    co: float | None = None,
    k_fire: float = 500.0,
    max_distance_km: float = 400.0,
    max_plume_time_hours: float = 36.0,
    cone_half_angle: float = 30.0,
) -> tuple[float, dict[str, Any]]:
    """Compute biomass burning / fire score for a ward.

    Formulation:
    For each fire within max_distance_km (400km) and plume travel time <= 36h:
        w = FRP * exp(-d / 150) * min(wind_kmh / 10, 1.5)
    Sum all w for fires in the upwind cone (within 30 deg of wind_from_deg).
    score = 1.0 - exp(-sum_w / K)
    Multiply by 1.2 if PM2.5/PM10 > 0.6 and CO is elevated (CO > 1.0 mg/m3).

    Args:
        ward_lat: Ward centroid latitude
        ward_lon: Ward centroid longitude
        fires: List of fire detections ({lat, lon, frp, confidence})
        wind_from_deg: Direction wind is coming FROM (0-360)
        wind_speed_kmh: Wind speed in km/h
        pm25: Estimated PM2.5 (optional boost)
        pm10: Estimated PM10 (optional boost)
        co: Estimated CO (optional boost)
        k_fire: Scale constant from model config
        max_distance_km: Max search radius (400 km)
        max_plume_time_hours: Max plume transit time (36 h)
        cone_half_angle: Half-angle for upwind cone (30 deg)

    Returns:
        (raw_fire_score, evidence_dict)
    """
    effective_wind_speed = max(wind_speed_kmh, 1.0)
    contributing_fires = []
    sum_w = 0.0

    for fire in fires:
        f_lat = fire.get("lat")
        f_lon = fire.get("lon")
        frp = float(fire.get("frp", 0.0))

        if f_lat is None or f_lon is None or frp <= 0:
            continue

        dist_km = haversine_km(ward_lat, ward_lon, f_lat, f_lon)
        if dist_km > max_distance_km:
            continue

        plume_time = dist_km / effective_wind_speed
        if plume_time > max_plume_time_hours:
            continue

        # Check if fire is upwind
        if not is_upwind(ward_lat, ward_lon, f_lat, f_lon, wind_from_deg, cone_half_angle):
            continue

        # Weight calculation: FRP * exp(-d / 150) * min(wind_kmh / 10, 1.5)
        wind_factor = min(effective_wind_speed / 10.0, 1.5)
        w = frp * math.exp(-dist_km / 150.0) * wind_factor
        sum_w += w

        contributing_fires.append({
            "lat": f_lat,
            "lon": f_lon,
            "frp": frp,
            "dist_km": round(dist_km, 1),
            "weight": round(w, 2),
        })

    # Base score
    raw_score = 1.0 - math.exp(-sum_w / k_fire)

    # Secondary ratio check: PM2.5/PM10 > 0.6 + elevated CO -> 1.2x boost
    ratio_boost = False
    if pm25 is not None and pm10 is not None and pm10 > 0:
        ratio = pm25 / pm10
        if ratio > 0.6 and (co is None or co > 1.0):
            raw_score = min(raw_score * 1.2, 1.0)
            ratio_boost = True

    evidence = {
        "upwind_fire_count": len(contributing_fires),
        "sum_fire_weight": round(sum_w, 2),
        "ratio_boost": ratio_boost,
        "wind_from_deg": wind_from_deg,
        "wind_speed_kmh": wind_speed_kmh,
        "top_contributing_fires": sorted(contributing_fires, key=lambda x: x["weight"], reverse=True)[:5],
    }

    return round(raw_score, 4), evidence


def score_traffic_source(
    no2: float | None,
    co: float | None,
    hour_ist: int,
    road_density_factor: float = 0.5,
    is_low_ventilation: bool = False,
) -> tuple[float, dict[str, Any]]:
    """Compute vehicular traffic pollution score.

    Formulation:
    Mean of logistic(NO2), logistic(CO), rush_hour_factor, road_density_factor.
    Rush-hour factor: 1.0 for 08-11 and 17-21 IST, else 0.4.
    Multiply by 1.3 if low ventilation / stagnation is detected.

    Args:
        no2: NO2 concentration in µg/m³
        co: CO concentration in mg/m³
        hour_ist: Hour of day in Indian Standard Time (0-23)
        road_density_factor: Normalized road density near ward (0.0 to 1.0)
        is_low_ventilation: Whether low ventilation / trap flag is active

    Returns:
        (raw_traffic_score, evidence_dict)
    """
    # Logistic transformations (midpoint NO2 ~ 40 µg/m3, CO ~ 1.5 mg/m3)
    no2_score = logistic(no2, k=0.05, x0=40.0) if no2 is not None else 0.3
    co_score = logistic(co, k=1.0, x0=1.5) if co is not None else 0.3

    # Rush-hour factor (08:00-11:00 and 17:00-21:00 IST)
    is_rush_hour = (8 <= hour_ist <= 11) or (17 <= hour_ist <= 21)
    rush_factor = 1.0 if is_rush_hour else 0.4

    # Mean of factors
    factors = [no2_score, co_score, rush_factor, max(0.0, min(1.0, road_density_factor))]
    mean_score = sum(factors) / len(factors)

    # Ventilation trap multiplier
    if is_low_ventilation:
        mean_score = min(mean_score * 1.3, 1.0)

    evidence = {
        "no2": no2,
        "no2_score": round(no2_score, 3),
        "co": co,
        "co_score": round(co_score, 3),
        "hour_ist": hour_ist,
        "is_rush_hour": is_rush_hour,
        "rush_factor": rush_factor,
        "road_density_factor": road_density_factor,
        "low_ventilation_boost": is_low_ventilation,
    }

    return round(mean_score, 4), evidence


def score_dust_source(
    pm10: float | None,
    pm25: float | None,
    humidity_pct: float | None,
    rain_last_48h_mm: float = 0.0,
    hour_ist: int = 12,
    near_construction: bool = False,
) -> tuple[float, dict[str, Any]]:
    """Compute road/construction dust pollution score.

    Formulation:
    logistic(PM10) x coarse_factor x dryness x daytime_factor
    + small boost near construction polygons (+0.10).

    Coarse factor is high when PM2.5/PM10 < 0.4.
    Dryness factor is high when no rain in 48h and low relative humidity (< 40%).
    Daytime factor is higher during active hours (06:00-18:00 IST).

    Args:
        pm10: PM10 concentration in µg/m³
        pm25: PM2.5 concentration in µg/m³
        humidity_pct: Relative humidity percentage (0-100)
        rain_last_48h_mm: Total precipitation in past 48h (mm)
        hour_ist: Hour of day in IST (0-23)
        near_construction: Whether ward intersects construction landuse

    Returns:
        (raw_dust_score, evidence_dict)
    """
    # 1. PM10 magnitude
    pm10_val = pm10 if pm10 is not None else 50.0
    pm10_score = logistic(pm10_val, k=0.03, x0=100.0)

    # 2. Coarse particle factor (coarse = PM10 - PM2.5)
    if pm10 is not None and pm25 is not None and pm10 > 0:
        ratio = pm25 / pm10
        # If fine ratio < 0.4, coarse dust dominates
        if ratio < 0.4:
            coarse_factor = 1.0
        elif ratio < 0.6:
            coarse_factor = 0.7
        else:
            coarse_factor = 0.3
    else:
        coarse_factor = 0.5

    # 3. Dryness factor
    rel_hum = humidity_pct if humidity_pct is not None else 50.0
    if rain_last_48h_mm > 2.0:
        dryness_factor = 0.2  # Wet ground suppresses dust
    elif rel_hum < 35.0:
        dryness_factor = 1.0
    elif rel_hum < 60.0:
        dryness_factor = 0.7
    else:
        dryness_factor = 0.4

    # 4. Daytime factor (construction and traffic resuspension peak during daytime)
    daytime_factor = 1.0 if (6 <= hour_ist <= 18) else 0.5

    # Combined score
    raw_score = pm10_score * coarse_factor * dryness_factor * daytime_factor

    # Construction proximity boost
    if near_construction:
        raw_score = min(raw_score + 0.10, 1.0)

    evidence = {
        "pm10": pm10,
        "pm25": pm25,
        "pm10_score": round(pm10_score, 3),
        "coarse_factor": coarse_factor,
        "dryness_factor": dryness_factor,
        "daytime_factor": daytime_factor,
        "near_construction": near_construction,
    }

    return round(raw_score, 4), evidence


def score_industry_source(
    so2: float | None,
    upwind_industry_count_5km: int = 0,
    hourly_variance_so2: float | None = None,
    singrauli_power_plants_upwind: int = 0,
) -> tuple[float, dict[str, Any]]:
    """Compute industrial emissions source score.

    Formulation:
    logistic(SO2) x upwind_industrial_proximity_factor x steadiness_factor
    In Singrauli, also boosted by configured upwind thermal power plants / mines.

    Args:
        so2: SO2 concentration in µg/m³
        upwind_industry_count_5km: Count of industrial units within 5km upwind
        hourly_variance_so2: Variance of SO2 over past hours (industry has steady baseload)
        singrauli_power_plants_upwind: Count of major power plants/mines upwind

    Returns:
        (raw_industry_score, evidence_dict)
    """
    # 1. SO2 level (SO2 is a primary tracer for coal combustion and heavy industry)
    so2_val = so2 if so2 is not None else 10.0
    so2_score = logistic(so2_val, k=0.08, x0=25.0)

    # 2. Industrial proximity factor (0 to 1)
    if upwind_industry_count_5km >= 3:
        proximity_factor = 1.0
    elif upwind_industry_count_5km >= 1:
        proximity_factor = 0.7
    else:
        proximity_factor = 0.3

    # 3. Steadiness factor (industrial emissions are constant 24/7)
    # Low variance -> high steadiness
    steadiness_factor = 0.8
    if hourly_variance_so2 is not None:
        if hourly_variance_so2 < 15.0:
            steadiness_factor = 1.0
        elif hourly_variance_so2 > 50.0:
            steadiness_factor = 0.6

    raw_score = so2_score * proximity_factor * steadiness_factor

    # Singrauli power plants / coal mines special boost
    if singrauli_power_plants_upwind > 0:
        raw_score = min(raw_score + 0.20 * min(singrauli_power_plants_upwind, 3), 1.0)

    evidence = {
        "so2": so2,
        "so2_score": round(so2_score, 3),
        "upwind_industry_count_5km": upwind_industry_count_5km,
        "proximity_factor": proximity_factor,
        "singrauli_power_plants_upwind": singrauli_power_plants_upwind,
    }

    return round(raw_score, 4), evidence


def apportion_sources(
    fire_score: float,
    traffic_score: float,
    dust_score: float,
    industry_score: float,
    floor_other: float = 0.12,
) -> dict[str, float]:
    """Normalize raw scores to percentage shares (sum = 100%).

    Always maintains a small floor for 'other' unmodeled background sources (10-15%).

    Args:
        fire_score: Raw biomass fire score (0 to 1)
        traffic_score: Raw vehicular traffic score (0 to 1)
        dust_score: Raw dust score (0 to 1)
        industry_score: Raw industry score (0 to 1)
        floor_other: Baseline share floor for other sources (default 0.12 = 12%)

    Returns:
        Dict of source shares in percent (e.g. {'fire': 45.2, 'traffic': 25.1, ...})
    """
    raw_scores = {
        "fire": max(0.0, fire_score),
        "traffic": max(0.0, traffic_score),
        "dust": max(0.0, dust_score),
        "industry": max(0.0, industry_score),
        "other": max(0.05, floor_other),
    }

    total = sum(raw_scores.values())
    if total <= 0:
        return {"fire": 0.0, "traffic": 25.0, "dust": 25.0, "industry": 25.0, "other": 25.0}

    # Normalize to percentages
    shares = {k: round((v / total) * 100.0, 1) for k, v in raw_scores.items()}

    # Ensure exact 100% sum
    diff = 100.0 - sum(shares.values())
    shares["other"] = round(shares["other"] + diff, 1)

    return shares
