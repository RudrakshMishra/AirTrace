"""Inverse distance weighting (IDW) interpolation and CAMS blending.

Pure functions for spatial interpolation of air quality readings across wards.
"""

from __future__ import annotations

from typing import Any

from airtrace.engine.geo import haversine_km


def idw_interpolate_point(
    lat: float,
    lon: float,
    stations: list[dict[str, Any]],
    parameter: str = "pm25",
    power: float = 2.0,
    k_nearest: int = 5,
    max_distance_km: float = 50.0,
) -> tuple[float | None, float | None]:
    """Interpolate a single point using Inverse Distance Weighting.

    Args:
        lat: Target latitude
        lon: Target longitude
        stations: List of station dicts with 'lat', 'lon', and parameter reading
        parameter: Parameter key to interpolate (e.g., 'pm25', 'pm10')
        power: IDW distance power (default 2.0)
        k_nearest: Max number of nearest stations to use (default 5)
        max_distance_km: Max search radius in km

    Returns:
        (interpolated_value, min_distance_km) or (None, None) if no stations
    """
    valid_stations = []
    for s in stations:
        val = s.get(parameter)
        s_lat = s.get("lat")
        s_lon = s.get("lon")
        if val is not None and s_lat is not None and s_lon is not None:
            dist = haversine_km(lat, lon, s_lat, s_lon)
            if dist <= max_distance_km:
                valid_stations.append((dist, val))

    if not valid_stations:
        return None, None

    # Sort by distance
    valid_stations.sort(key=lambda x: x[0])
    selected = valid_stations[:k_nearest]

    # Check for exact colocation (dist < 100m)
    for dist, val in selected:
        if dist < 0.1:
            return float(val), dist

    # IDW formula: sum(w_i * val_i) / sum(w_i) where w_i = 1 / dist^power
    weights = [1.0 / (dist**power) for dist, _ in selected]
    total_weight = sum(weights)

    if total_weight == 0:
        return None, None

    weighted_val = sum(w * val for w, (_, val) in zip(weights, selected, strict=True))
    min_dist = selected[0][0]

    return round(weighted_val / total_weight, 2), round(min_dist, 2)


def blend_idw_cams(
    idw_val: float | None,
    cams_val: float | None,
    min_station_dist_km: float | None,
    max_station_radius_km: float = 25.0,
    idw_weight: float = 0.7,
    cams_weight: float = 0.3,
) -> tuple[float | None, str]:
    """Blend IDW station interpolation with CAMS modeled air quality.

    Rule:
    - If no station within max_station_radius_km (25 km), use CAMS only.
    - If station available, blend: idw_weight*IDW + cams_weight*CAMS.
    - If CAMS unavailable, fallback to IDW only.

    Args:
        idw_val: IDW interpolated value from ground stations
        cams_val: CAMS modeled air quality value
        min_station_dist_km: Distance to nearest ground station
        max_station_radius_km: Max radius for ground stations (25 km)
        idw_weight: Weight for ground station IDW (default 0.7)
        cams_weight: Weight for CAMS model (default 0.3)

    Returns:
        (blended_value, method_used)
    """
    # Case 1: No ground station within max radius -> CAMS only
    if min_station_dist_km is None or min_station_dist_km > max_station_radius_km or idw_val is None:
        if cams_val is not None:
            return round(cams_val, 2), "cams_only"
        return None, "none"

    # Case 2: Ground station available, but no CAMS -> IDW only
    if cams_val is None:
        return round(idw_val, 2), "idw_only"

    # Case 3: Blend IDW + CAMS
    blended = (idw_weight * idw_val) + (cams_weight * cams_val)
    return round(blended, 2), "blended_idw_cams"


def interpolate_wards_air_quality(
    wards: list[dict[str, Any]],
    stations: list[dict[str, Any]],
    cams_data: dict[str, Any] | None = None,
    parameters: list[str] | None = None,
) -> list[dict[str, Any]]:
    """Estimate air quality parameters for all wards.

    Args:
        wards: List of ward features/dicts with 'id', 'centroid_lat', 'centroid_lon'
        stations: List of ground station readings
        cams_data: CAMS modeled values dict (e.g. {'pm25': 45.0, 'pm10': 80.0, ...})
        parameters: List of parameters to interpolate (default: ['pm25', 'pm10', 'no2', 'so2', 'co', 'o3'])

    Returns:
        List of dicts with estimated pollutant values per ward
    """
    if parameters is None:
        parameters = ["pm25", "pm10", "no2", "so2", "co", "o3"]

    results = []

    for ward in wards:
        props = ward.get("properties", ward)
        w_id = props.get("id") or props.get("ward_id")
        c_lat = props.get("centroid_lat")
        c_lon = props.get("centroid_lon")

        ward_estimates: dict[str, Any] = {
            "ward_id": w_id,
            "centroid_lat": c_lat,
            "centroid_lon": c_lon,
            "estimates": {},
            "nearest_station_km": None,
        }

        if c_lat is None or c_lon is None:
            results.append(ward_estimates)
            continue

        min_overall_dist = None

        for param in parameters:
            idw_val, min_dist = idw_interpolate_point(c_lat, c_lon, stations, parameter=param)

            if min_dist is not None and (min_overall_dist is None or min_dist < min_overall_dist):
                min_overall_dist = min_dist

            cams_val = cams_data.get(param) if cams_data else None

            blended_val, method = blend_idw_cams(
                idw_val=idw_val,
                cams_val=cams_val,
                min_station_dist_km=min_dist,
            )

            ward_estimates["estimates"][param] = {
                "value": blended_val,
                "method": method,
                "idw_value": idw_val,
                "cams_value": cams_val,
                "station_dist_km": min_dist,
            }

        ward_estimates["nearest_station_km"] = min_overall_dist
        results.append(ward_estimates)

    return results
