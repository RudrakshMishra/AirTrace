"""Pipeline orchestration: ingestion → interpolation → scoring → actions → database upserts.

Connects all engine components into the hourly processing flow.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

from airtrace.config import load_cities_config, load_model_config
from airtrace.engine import (
    actions,
    aqi,
    confidence,
    interpolate,
    sources,
    ventilation,
    vulnerability,
)
from airtrace.ingest import cams, weather
from airtrace.logging import get_logger
from airtrace.models import Action, Fire, Reading, Station, WardState

logger = get_logger(__name__)


def fetch_ground_stations_with_readings(
    session: Session,
    city_id: str,
    timestamp: datetime,
) -> list[dict[str, Any]]:
    """Fetch active ground stations with their latest readings for a city.

    Args:
        session: Database session
        city_id: City identifier
        timestamp: Current processing timestamp

    Returns:
        List of station dicts with lat, lon, pm25, pm10, no2, so2, co, o3
    """
    # Query stations and join with latest readings (within last 2 hours)
    stations_query = (
        session.query(Station)
        .filter(Station.city_id == city_id, Station.is_active == True)  # noqa: E712
        .all()
    )

    station_data = []
    for st in stations_query:
        # Get latest reading for this station
        latest_reading = (
            session.query(Reading)
            .filter(Reading.station_id == st.id)
            .order_by(Reading.timestamp.desc())
            .first()
        )

        if latest_reading:
            station_data.append({
                "station_id": st.id,
                "lat": st.lat,
                "lon": st.lon,
                "pm25": latest_reading.pm25,
                "pm10": latest_reading.pm10,
                "no2": latest_reading.no2,
                "so2": latest_reading.so2,
                "co": latest_reading.co,
                "o3": latest_reading.o3,
                "timestamp": latest_reading.timestamp,
            })

    return station_data


def fetch_active_fires(
    session: Session,
    city_id: str,
    timestamp: datetime,
    lookback_hours: int = 36,
) -> list[dict[str, Any]]:
    """Fetch recent fires from database.

    Args:
        session: Database session
        city_id: City identifier (not used yet, fires are regional)
        timestamp: Current processing timestamp
        lookback_hours: How many hours back to fetch

    Returns:
        List of fire dicts with lat, lon, frp, confidence, acq_date
    """
    from datetime import timedelta

    cutoff = timestamp - timedelta(hours=lookback_hours)

    fires_query = (
        session.query(Fire)
        .filter(Fire.acq_date >= cutoff)
        .all()
    )

    return [
        {
            "lat": f.lat,
            "lon": f.lon,
            "frp": f.frp or 0.0,
            "confidence": f.confidence or "nominal",
            "acq_date": f.acq_date,
        }
        for f in fires_query
    ]


def fetch_latest_weather(city_id: str) -> dict[str, Any]:
    """Fetch latest weather data for a city (mock or live).

    Returns:
        Weather dict with wind_from_deg, wind_speed_ms, blh_m, temp_c, rh_pct, precip_mm
    """
    cities = load_cities_config()
    city = cities.get(city_id)
    if not city:
        return {}

    lat, lon = city["centre"]

    try:
        data = weather.fetch_weather(city_id, lat, lon)
        records = weather.normalize_weather(data, lat, lon)
        if records:
            return records[0]  # Most recent hour
    except Exception as e:
        logger.error("Weather fetch failed", extra={"city_id": city_id, "error": str(e)})

    return {}


def fetch_latest_cams(city_id: str) -> dict[str, float]:
    """Fetch latest CAMS modeled air quality for a city.

    Returns:
        Dict with pm25, pm10, no2, so2, co, o3
    """
    cities = load_cities_config()
    city = cities.get(city_id)
    if not city:
        return {}

    lat, lon = city["centre"]

    try:
        data = cams.fetch_air_quality(city_id, lat, lon)
        records = cams.normalize_air_quality(data, lat, lon)
        if records:
            rec = records[0]
            return {
                "pm25": rec.get("pm25"),
                "pm10": rec.get("pm10"),
                "no2": rec.get("no2"),
                "so2": rec.get("so2"),
                "co": rec.get("co"),
                "o3": rec.get("o3"),
            }
    except Exception as e:
        logger.error("CAMS fetch failed", extra={"city_id": city_id, "error": str(e)})

    return {}


def compute_ward_state(
    ward: dict[str, Any],
    stations: list[dict[str, Any]],
    fires: list[dict[str, Any]],
    weather: dict[str, Any],
    cams_data: dict[str, float],
    model_cfg: dict[str, Any],
    timestamp: datetime,
    ventilation_history: list[float | None],
    pm25_history: list[float | None],
) -> dict[str, Any]:
    """Compute full state for a single ward.

    Args:
        ward: Ward dict with id, centroid_lat, centroid_lon, pop_density, n_schools, n_hospitals, road_density_km, industrial_area_km2
        stations: List of station readings
        fires: List of recent fires
        weather: Weather dict
        cams_data: CAMS modeled values
        model_cfg: Model configuration
        timestamp: Processing timestamp
        ventilation_history: Last N hours of ventilation indices for trap detection
        pm25_history: Last N hours of PM2.5 for trap detection

    Returns:
        Ward state dict ready for database upsert
    """
    ward_id = ward.get("id")
    c_lat = ward.get("centroid_lat")
    c_lon = ward.get("centroid_lon")

    # 1. Spatial interpolation
    ward_air = interpolate.interpolate_wards_air_quality(
        wards=[ward],
        stations=stations,
        cams_data=cams_data,
    )[0]

    pm25_est = ward_air["estimates"].get("pm25", {}).get("value")
    pm10_est = ward_air["estimates"].get("pm10", {}).get("value")
    no2_est = ward_air["estimates"].get("no2", {}).get("value")
    so2_est = ward_air["estimates"].get("so2", {}).get("value")
    co_est = ward_air["estimates"].get("co", {}).get("value")
    nearest_station_km = ward_air.get("nearest_station_km")

    # 2. AQI calculation
    aqi_val, aqi_cat = aqi.calculate_aqi(pm25_est, pm10_est)

    # 3. Ventilation index
    blh_m = weather.get("blh_m")
    wind_speed_ms = weather.get("wind_speed_ms")
    vent_coeff = ventilation.compute_ventilation_coefficient(blh_m, wind_speed_ms)

    # Append current ventilation and PM2.5 to history
    vent_hist = [*ventilation_history, vent_coeff][-6:]
    pm25_hist = [*pm25_history, pm25_est][-6:]

    is_trap, trap_evidence = ventilation.is_pollution_trap(vent_hist, pm25_hist)

    # 4. Source scoring
    wind_from_deg = weather.get("wind_from_deg", 0.0)
    wind_speed_kmh = (wind_speed_ms or 0.0) * 3.6

    fire_score, fire_ev = sources.score_fire_source(
        ward_lat=c_lat,
        ward_lon=c_lon,
        fires=fires,
        wind_from_deg=wind_from_deg,
        wind_speed_kmh=wind_speed_kmh,
        pm25=pm25_est,
        pm10=pm10_est,
        co=co_est,
        k_fire=model_cfg["fire"]["saturation_K"],
    )

    hour_ist = timestamp.astimezone(__import__("zoneinfo").ZoneInfo("Asia/Kolkata")).hour
    traffic_score, traffic_ev = sources.score_traffic_source(
        no2=no2_est,
        co=co_est,
        hour_ist=hour_ist,
        road_density_factor=min(1.0, (ward.get("road_density_km", 0.0) / 5.0)),
        is_low_ventilation=(vent_coeff or 9999) < model_cfg["ventilation"]["trap_threshold"],
    )

    dust_score, dust_ev = sources.score_dust_source(
        pm10=pm10_est,
        pm25=pm25_est,
        humidity_pct=weather.get("rh_pct"),
        rain_last_48h_mm=weather.get("precip_mm", 0.0),
        hour_ist=hour_ist,
        near_construction=(ward.get("industrial_area_km2", 0.0) > 0.1),
    )

    industry_score, industry_ev = sources.score_industry_source(
        so2=so2_est,
        upwind_industry_count_5km=int(ward.get("industrial_area_km2", 0.0) * 2),  # proxy
    )

    source_shares = sources.apportion_sources(
        fire_score=fire_score,
        traffic_score=traffic_score,
        dust_score=dust_score,
        industry_score=industry_score,
    )

    dominant_source = max(source_shares.items(), key=lambda x: x[1])[0]

    # 5. Confidence scoring
    has_cams_fallback = ward_air["estimates"]["pm25"]["method"] == "cams_only"
    conf_score, conf_band, conf_reasons = confidence.calculate_confidence(
        nearest_station_km=nearest_station_km,
        source_shares=source_shares,
        weather_age_hours=0.0,  # Assume fresh
        signals_conflict=False,  # TODO: implement conflict detection
        has_cams_fallback_only=has_cams_fallback,
    )

    # 6. Vulnerability and risk
    vuln_score, vuln_breakdown = vulnerability.calculate_ward_vulnerability(
        pop_density=ward.get("pop_density"),
        school_count=ward.get("n_schools", 0),
        hospital_count=ward.get("n_hospitals", 0),
    )

    risk_score, _risk_cat = vulnerability.calculate_risk(pm25_est, vuln_score)

    # 7. Evidence bundle
    evidence = {
        "interpolation": ward_air["estimates"],
        "fire": fire_ev,
        "traffic": traffic_ev,
        "dust": dust_ev,
        "industry": industry_ev,
        "ventilation": trap_evidence,
        "vulnerability": vuln_breakdown,
    }

    return {
        "ward_id": ward_id,
        "timestamp": timestamp,
        "pm25_est": pm25_est,
        "pm10_est": pm10_est,
        "aqi_est": aqi_val,
        "aqi_category": aqi_cat,
        "dominant_source": dominant_source,
        "source_shares": source_shares,
        "confidence_score": conf_score,
        "confidence_band": conf_band,
        "confidence_reasons": conf_reasons,
        "ventilation_index": vent_coeff,
        "trap_flag": is_trap,
        "risk_score": risk_score,
        "vulnerability_score": vuln_score,
        "evidence": evidence,
        "model_version": model_cfg.get("model_version", "unknown"),
    }


def generate_and_upsert_actions(
    session: Session,
    ward_state: dict[str, Any],
    ward_state_id: str,
) -> int:
    """Generate rule-based actions and upsert to database.

    Args:
        session: Database session
        ward_state: Computed ward state dict
        ward_state_id: ID of the ward_state row

    Returns:
        Number of actions generated
    """
    city_id = ward_state["ward_id"].split("_")[0]  # Extract city from ward_id

    actions_list = actions.generate_actions_for_ward(
        ward_id=ward_state["ward_id"],
        city_id=city_id,
        dominant_source=ward_state["dominant_source"],
        source_shares=ward_state["source_shares"],
        confidence_score=ward_state["confidence_score"],
        is_trap=ward_state["trap_flag"],
        risk_category=ward_state["evidence"].get("vulnerability", {}).get("risk_category", "Low"),
        evidence=ward_state["evidence"],
    )

    for act in actions_list:
        action_row = Action(
            id=str(uuid.uuid4()),
            ward_id=ward_state["ward_id"],
            ward_state_id=ward_state_id,
            timestamp=ward_state["timestamp"],
            source_type=act["evidence"]["source"],
            department=act["department"],
            text_en=act["text_en"],
            text_hi=act["text_hi"],
            evidence=str(act["evidence"]),
            status="pending",
        )
        session.merge(action_row)

    return len(actions_list)


def run_pipeline_for_city(
    session: Session,
    city_id: str,
    timestamp: datetime | None = None,
) -> dict[str, Any]:
    """Run the full hourly pipeline for a city.

    Args:
        session: Database session
        city_id: City identifier
        timestamp: Processing timestamp (defaults to now UTC)

    Returns:
        Pipeline result summary
    """
    if timestamp is None:
        timestamp = datetime.now(UTC)

    logger.info("Pipeline start", extra={"city_id": city_id, "timestamp": timestamp.isoformat()})

    model_cfg = load_model_config()

    # 1. Fetch all inputs
    stations = fetch_ground_stations_with_readings(session, city_id, timestamp)
    fires = fetch_active_fires(session, city_id, timestamp)
    weather_data = fetch_latest_weather(city_id)
    cams_data = fetch_latest_cams(city_id)

    logger.info(
        "Inputs fetched",
        extra={
            "city_id": city_id,
            "stations": len(stations),
            "fires": len(fires),
            "weather_available": bool(weather_data),
            "cams_available": bool(cams_data),
        },
    )

    # 2. Load wards for this city (from database or static GeoJSON)
    from airtrace.models import Ward

    wards_query = session.query(Ward).filter(Ward.city_id == city_id).all()
    wards = [
        {
            "id": w.id,
            "centroid_lat": w.centroid_lat,
            "centroid_lon": w.centroid_lon,
            "pop_density": w.pop_density,
            "n_schools": w.n_schools,
            "n_hospitals": w.n_hospitals,
            "road_density_km": w.road_density_km,
            "industrial_area_km2": w.industrial_area_km2,
        }
        for w in wards_query
    ]

    if not wards:
        logger.warning("No wards found", extra={"city_id": city_id})
        return {"city_id": city_id, "wards_processed": 0, "actions_generated": 0}

    # 3. For each ward: compute state and upsert
    wards_processed = 0
    actions_generated = 0

    # TODO: fetch ventilation history from database for trap detection
    # For now, use empty history
    vent_history: list[float | None] = []
    pm25_history: list[float | None] = []

    for ward in wards:
        try:
            ward_state = compute_ward_state(
                ward=ward,
                stations=stations,
                fires=fires,
                weather=weather_data,
                cams_data=cams_data,
                model_cfg=model_cfg,
                timestamp=timestamp,
                ventilation_history=vent_history,
                pm25_history=pm25_history,
            )

            # Upsert ward_state
            ward_state_id = str(uuid.uuid4())
            ws_row = WardState(
                id=ward_state_id,
                ward_id=ward_state["ward_id"],
                timestamp=ward_state["timestamp"],
                pm25_est=ward_state["pm25_est"],
                pm10_est=ward_state["pm10_est"],
                aqi_est=ward_state["aqi_est"],
                aqi_category=ward_state["aqi_category"],
                dominant_source=ward_state["dominant_source"],
                source_shares=ward_state["source_shares"],
                confidence_score=ward_state["confidence_score"],
                confidence_band=ward_state["confidence_band"],
                confidence_reasons=ward_state["confidence_reasons"],
                ventilation_index=ward_state["ventilation_index"],
                trap_flag=ward_state["trap_flag"],
                risk_score=ward_state["risk_score"],
                vulnerability_score=ward_state["vulnerability_score"],
                evidence=ward_state["evidence"],
                model_version=ward_state["model_version"],
            )
            session.merge(ws_row)
            session.commit()

            # Generate and upsert actions
            n_actions = generate_and_upsert_actions(session, ward_state, ward_state_id)
            actions_generated += n_actions

            wards_processed += 1

        except Exception as e:
            logger.error(
                "Ward processing failed",
                extra={"city_id": city_id, "ward_id": ward["id"], "error": str(e)},
            )
            session.rollback()

    logger.info(
        "Pipeline complete",
        extra={
            "city_id": city_id,
            "wards_processed": wards_processed,
            "actions_generated": actions_generated,
        },
    )

    return {
        "city_id": city_id,
        "timestamp": timestamp.isoformat(),
        "wards_processed": wards_processed,
        "actions_generated": actions_generated,
    }
