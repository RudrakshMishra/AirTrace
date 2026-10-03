"""Tests for geometry helper functions."""

from __future__ import annotations

import pytest

from airtrace.engine.geo import (
    angle_diff,
    bearing_deg,
    destination_point,
    haversine_km,
    is_upwind,
    point_in_polygon,
)


def test_haversine_km_known_distance():
    """Test haversine distance with known coordinates."""
    # Bhopal to Indore (approx 170 km)
    bhopal_lat, bhopal_lon = 23.2599, 77.4126
    indore_lat, indore_lon = 22.7196, 75.8577

    distance = haversine_km(bhopal_lat, bhopal_lon, indore_lat, indore_lon)
    assert 165 < distance < 175  # Within reasonable range


def test_haversine_km_same_point():
    """Distance from a point to itself is zero."""
    assert haversine_km(23.0, 77.0, 23.0, 77.0) == pytest.approx(0.0, abs=0.001)


def test_bearing_deg_north():
    """Bearing due north is 0 degrees."""
    bearing = bearing_deg(23.0, 77.0, 24.0, 77.0)
    assert bearing == pytest.approx(0.0, abs=1.0)


def test_bearing_deg_east():
    """Bearing due east is 90 degrees."""
    bearing = bearing_deg(23.0, 77.0, 23.0, 78.0)
    assert bearing == pytest.approx(90.0, abs=1.0)


def test_bearing_deg_south():
    """Bearing due south is 180 degrees."""
    bearing = bearing_deg(24.0, 77.0, 23.0, 77.0)
    assert bearing == pytest.approx(180.0, abs=1.0)


def test_bearing_deg_west():
    """Bearing due west is 270 degrees."""
    bearing = bearing_deg(23.0, 78.0, 23.0, 77.0)
    assert bearing == pytest.approx(270.0, abs=1.0)


def test_angle_diff_small():
    """Small angle difference."""
    assert angle_diff(10.0, 20.0) == pytest.approx(10.0)
    assert angle_diff(20.0, 10.0) == pytest.approx(10.0)


def test_angle_diff_wraparound():
    """Angle difference wrapping around 0/360."""
    # 350° to 10° is 20°, not 340°
    assert angle_diff(350.0, 10.0) == pytest.approx(20.0)
    assert angle_diff(10.0, 350.0) == pytest.approx(20.0)


def test_angle_diff_opposite():
    """Opposite bearings are 180° apart."""
    assert angle_diff(0.0, 180.0) == pytest.approx(180.0)
    assert angle_diff(90.0, 270.0) == pytest.approx(180.0)


def test_is_upwind_fire_due_north_wind_from_north():
    """Fire due north of ward with wind from north: upwind."""
    ward_lat, ward_lon = 23.0, 77.0
    fire_lat, fire_lon = 24.0, 77.0  # Due north
    wind_from_deg = 0.0  # Wind from north

    assert is_upwind(ward_lat, ward_lon, fire_lat, fire_lon, wind_from_deg)


def test_is_upwind_fire_due_north_wind_from_south():
    """Fire due north of ward with wind from south: NOT upwind."""
    ward_lat, ward_lon = 23.0, 77.0
    fire_lat, fire_lon = 24.0, 77.0  # Due north
    wind_from_deg = 180.0  # Wind from south

    assert not is_upwind(ward_lat, ward_lon, fire_lat, fire_lon, wind_from_deg)


def test_is_upwind_fire_northeast_wind_from_north():
    """Fire northeast of ward with wind from north: within 30° cone."""
    ward_lat, ward_lon = 23.0, 77.0
    fire_lat, fire_lon = 23.5, 77.5  # Northeast (bearing ~45°)
    wind_from_deg = 45.0  # Wind from NE

    assert is_upwind(ward_lat, ward_lon, fire_lat, fire_lon, wind_from_deg, cone_half_angle=30.0)


def test_is_upwind_fire_east_wind_from_north():
    """Fire due east with wind from north: NOT within 30° cone."""
    ward_lat, ward_lon = 23.0, 77.0
    fire_lat, fire_lon = 23.0, 78.0  # Due east (bearing 90°)
    wind_from_deg = 0.0  # Wind from north

    # 90° away from 0° is outside the 30° cone
    assert not is_upwind(ward_lat, ward_lon, fire_lat, fire_lon, wind_from_deg, cone_half_angle=30.0)


def test_is_upwind_wraparound():
    """Upwind check wraps around 0/360 correctly."""
    ward_lat, ward_lon = 23.0, 77.0
    fire_lat, fire_lon = 23.3, 76.8  # Northwest (bearing ~340°)
    wind_from_deg = 350.0  # Wind from NNW

    # 340° is within 30° of 350° (10° apart)
    assert is_upwind(ward_lat, ward_lon, fire_lat, fire_lon, wind_from_deg, cone_half_angle=30.0)


def test_point_in_polygon_inside():
    """Point inside a polygon."""
    # Simple square: (0,0), (0,2), (2,2), (2,0)
    polygon = [(0.0, 0.0), (0.0, 2.0), (2.0, 2.0), (2.0, 0.0)]
    assert point_in_polygon(1.0, 1.0, polygon)


def test_point_in_polygon_outside():
    """Point outside a polygon."""
    polygon = [(0.0, 0.0), (0.0, 2.0), (2.0, 2.0), (2.0, 0.0)]
    assert not point_in_polygon(3.0, 3.0, polygon)


def test_point_in_polygon_on_edge():
    """Point on edge of polygon (implementation-dependent, may vary)."""
    polygon = [(0.0, 0.0), (0.0, 2.0), (2.0, 2.0), (2.0, 0.0)]
    # Ray casting may or may not count edge - just check it doesn't crash
    result = point_in_polygon(1.0, 0.0, polygon)
    assert isinstance(result, bool)


def test_point_in_polygon_too_few_points():
    """Polygon with fewer than 3 points is invalid."""
    assert not point_in_polygon(1.0, 1.0, [(0.0, 0.0), (1.0, 1.0)])


def test_destination_point_north():
    """Destination point traveling north."""
    lat, lon = 23.0, 77.0
    # Travel ~111 km north (approximately 1 degree of latitude)
    dest_lat, dest_lon = destination_point(lat, lon, 111.0, 0.0)

    assert dest_lat == pytest.approx(24.0, abs=0.05)
    assert dest_lon == pytest.approx(77.0, abs=0.05)


def test_destination_point_east():
    """Destination point traveling east."""
    lat, lon = 23.0, 77.0
    # Travel ~100 km east
    dest_lat, dest_lon = destination_point(lat, lon, 100.0, 90.0)

    assert dest_lat == pytest.approx(23.0, abs=0.05)
    assert dest_lon > lon  # Should move east


def test_destination_point_roundtrip():
    """Travel forward and backward returns to origin."""
    lat, lon = 23.0, 77.0
    distance_km = 50.0
    bearing = 45.0  # Northeast

    # Go forward
    dest_lat, dest_lon = destination_point(lat, lon, distance_km, bearing)

    # Come back (opposite bearing)
    back_lat, back_lon = destination_point(dest_lat, dest_lon, distance_km, (bearing + 180) % 360)

    assert back_lat == pytest.approx(lat, abs=0.01)
    assert back_lon == pytest.approx(lon, abs=0.01)


def test_comprehensive_fire_upwind_scenario():
    """Comprehensive test: fire cluster upwind with strong wind gives dominant fire signal."""
    # Bhopal ward centroid
    ward_lat, ward_lon = 23.2599, 77.4126

    # Multiple fires northwest of Bhopal (bearing ~315°)
    fires = [
        (23.5, 77.0, 150.0),  # (lat, lon, FRP)
        (23.6, 76.9, 200.0),
        (23.7, 76.8, 180.0),
    ]

    # Wind from northwest (315°)
    wind_from_deg = 315.0

    upwind_count = 0
    for fire_lat, fire_lon, _frp in fires:
        if is_upwind(ward_lat, ward_lon, fire_lat, fire_lon, wind_from_deg, cone_half_angle=30.0):
            distance_km = haversine_km(ward_lat, ward_lon, fire_lat, fire_lon)
            # Fire is within reasonable distance and upwind
            if distance_km < 400:
                upwind_count += 1

    # At least 2 of the 3 fires should be upwind
    assert upwind_count >= 2
