"""Geometry and geospatial helper functions.

Pure functions with no database or network dependencies.
"""

from __future__ import annotations

import math
from collections.abc import Sequence


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance in km between two lat/lon points.

    Args:
        lat1, lon1: First point coordinates in degrees
        lat2, lon2: Second point coordinates in degrees

    Returns:
        Distance in kilometers
    """
    R = 6371.0  # Earth radius in km

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def bearing_deg(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate initial bearing from point 1 to point 2 in degrees (0-360).

    0° = North, 90° = East, 180° = South, 270° = West.

    Args:
        lat1, lon1: Start point coordinates in degrees
        lat2, lon2: End point coordinates in degrees

    Returns:
        Bearing in degrees [0, 360)
    """
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    dlon_rad = math.radians(lon2 - lon1)

    y = math.sin(dlon_rad) * math.cos(lat2_rad)
    x = math.cos(lat1_rad) * math.sin(lat2_rad) - math.sin(lat1_rad) * math.cos(
        lat2_rad
    ) * math.cos(dlon_rad)

    bearing_rad = math.atan2(y, x)
    bearing_deg_val = math.degrees(bearing_rad)

    # Normalize to [0, 360)
    return (bearing_deg_val + 360) % 360


def angle_diff(a: float, b: float) -> float:
    """Calculate the smallest angle difference between two bearings in degrees.

    Args:
        a: First bearing in degrees
        b: Second bearing in degrees

    Returns:
        Absolute angle difference in degrees [0, 180]
    """
    diff = abs(a - b) % 360
    return min(diff, 360 - diff)


def is_upwind(
    ward_lat: float,
    ward_lon: float,
    fire_lat: float,
    fire_lon: float,
    wind_from_deg: float,
    cone_half_angle: float = 30.0,
) -> bool:
    """Check if a fire is upwind of a ward given wind direction.

    Wind convention: wind_from_deg is the direction the wind comes FROM.
    A fire is upwind if the bearing from ward to fire is within the wind cone.

    Args:
        ward_lat, ward_lon: Ward centroid coordinates
        fire_lat, fire_lon: Fire coordinates
        wind_from_deg: Wind direction in degrees (0=N, 90=E, 180=S, 270=W)
        cone_half_angle: Half-angle of wind cone in degrees (default 30)

    Returns:
        True if fire is upwind of the ward
    """
    bearing_to_fire = bearing_deg(ward_lat, ward_lon, fire_lat, fire_lon)
    diff = angle_diff(bearing_to_fire, wind_from_deg)
    return diff <= cone_half_angle


def point_in_polygon(lat: float, lon: float, polygon: Sequence[tuple[float, float]]) -> bool:
    """Check if a point is inside a polygon using ray casting algorithm.

    Args:
        lat: Point latitude
        lon: Point longitude
        polygon: List of (lat, lon) tuples forming a closed polygon

    Returns:
        True if point is inside polygon
    """
    if len(polygon) < 3:
        return False

    inside = False
    n = len(polygon)

    for i in range(n):
        j = (i + 1) % n
        lat_i, lon_i = polygon[i]
        lat_j, lon_j = polygon[j]

        # Ray casting: check if horizontal ray from point crosses edge
        if ((lon_i > lon) != (lon_j > lon)) and (
            lat < (lat_j - lat_i) * (lon - lon_i) / (lon_j - lon_i) + lat_i
        ):
            inside = not inside

    return inside


def destination_point(
    lat: float, lon: float, distance_km: float, bearing_deg_val: float
) -> tuple[float, float]:
    """Calculate destination point given start point, distance and bearing.

    Useful for back-trajectory calculations.

    Args:
        lat: Start latitude in degrees
        lon: Start longitude in degrees
        distance_km: Distance to travel in kilometers
        bearing_deg_val: Bearing in degrees (0=N, 90=E, etc.)

    Returns:
        (lat, lon) tuple of destination point
    """
    R = 6371.0  # Earth radius in km

    lat_rad = math.radians(lat)
    lon_rad = math.radians(lon)
    bearing_rad = math.radians(bearing_deg_val)
    d_R = distance_km / R

    lat2_rad = math.asin(
        math.sin(lat_rad) * math.cos(d_R)
        + math.cos(lat_rad) * math.sin(d_R) * math.cos(bearing_rad)
    )

    lon2_rad = lon_rad + math.atan2(
        math.sin(bearing_rad) * math.sin(d_R) * math.cos(lat_rad),
        math.cos(d_R) - math.sin(lat_rad) * math.sin(lat2_rad),
    )

    return (math.degrees(lat2_rad), math.degrees(lon2_rad))
