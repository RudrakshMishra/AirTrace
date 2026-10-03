"""Unit tests for pipeline orchestration and AQI calculation."""

from __future__ import annotations

from airtrace.engine import aqi, pipeline


def test_aqi_pm25_breakpoints():
    """Test CPCB PM2.5 AQI sub-index calculation."""
    # Good: 0-30 µg/m³ → 0-50 AQI
    sub = aqi.calculate_sub_index(15.0, aqi.PM25_BREAKPOINTS)
    assert sub == 25  # Linear interpolation

    # Moderate: 61-90 µg/m³ → 101-200 AQI
    sub = aqi.calculate_sub_index(75.0, aqi.PM25_BREAKPOINTS)
    assert 101 <= sub <= 200


def test_aqi_overall_max_rule():
    """Test that overall AQI takes the maximum sub-index."""
    # PM2.5 at 100 (Satisfactory), PM10 at 200 (Moderate) → Moderate
    aqi_val, category = aqi.calculate_aqi(pm25=55.0, pm10=150.0)
    assert aqi_val is not None
    assert category == "Moderate"


def test_aqi_categories():
    """Test AQI category thresholds."""
    assert aqi.get_aqi_category(40) == "Good"
    assert aqi.get_aqi_category(80) == "Satisfactory"
    assert aqi.get_aqi_category(150) == "Moderate"
    assert aqi.get_aqi_category(250) == "Poor"
    assert aqi.get_aqi_category(350) == "Very Poor"
    assert aqi.get_aqi_category(450) == "Severe"


def test_aqi_none_handling():
    """Test AQI with missing pollutant data."""
    aqi_val, category = aqi.calculate_aqi(pm25=None, pm10=None)
    assert aqi_val is None
    assert category == "Unknown"

    # With one pollutant available
    aqi_val, category = aqi.calculate_aqi(pm25=100.0, pm10=None)
    assert aqi_val is not None
    assert category in ["Good", "Satisfactory", "Moderate", "Poor", "Very Poor", "Severe"]


def test_pipeline_station_data_structure():
    """Test that station data structure matches expected format."""
    # Mock station data
    station = {
        "station_id": "test_001",
        "lat": 23.25,
        "lon": 77.40,
        "pm25": 50.0,
        "pm10": 100.0,
        "no2": 40.0,
        "so2": 10.0,
        "co": 1.5,
        "o3": 60.0,
    }

    # Verify all required keys present
    required_keys = ["lat", "lon", "pm25", "pm10", "no2", "so2", "co"]
    for key in required_keys:
        assert key in station


def test_compute_ward_state_structure():
    """Test that compute_ward_state returns expected keys."""
    from datetime import UTC, datetime

    ward = {
        "id": "bhopal_w001",
        "centroid_lat": 23.25,
        "centroid_lon": 77.40,
        "pop_density": 10000.0,
        "n_schools": 5,
        "n_hospitals": 2,
        "road_density_km": 3.5,
        "industrial_area_km2": 0.2,
    }

    stations = [
        {"lat": 23.20, "lon": 77.40, "pm25": 50.0, "pm10": 100.0, "no2": 40.0, "so2": 10.0, "co": 1.5, "o3": 60.0}
    ]

    fires = []

    weather = {
        "wind_from_deg": 270.0,
        "wind_speed_ms": 2.5,
        "blh_m": 800.0,
        "temp_c": 28.0,
        "rh_pct": 45.0,
        "precip_mm": 0.0,
    }

    cams = {"pm25": 45.0, "pm10": 90.0, "no2": 35.0, "so2": 8.0, "co": 1.2, "o3": 55.0}

    model_cfg = {
        "model_version": "0.1.0",
        "fire": {"saturation_K": 500.0},
        "ventilation": {"trap_threshold": 2000.0},
    }

    result = pipeline.compute_ward_state(
        ward=ward,
        stations=stations,
        fires=fires,
        weather=weather,
        cams_data=cams,
        model_cfg=model_cfg,
        timestamp=datetime.now(UTC),
        ventilation_history=[],
        pm25_history=[],
    )

    # Check all expected keys are present
    expected_keys = [
        "ward_id",
        "timestamp",
        "pm25_est",
        "pm10_est",
        "aqi_est",
        "aqi_category",
        "dominant_source",
        "source_shares",
        "confidence_score",
        "confidence_band",
        "confidence_reasons",
        "ventilation_index",
        "trap_flag",
        "risk_score",
        "vulnerability_score",
        "evidence",
        "model_version",
    ]

    for key in expected_keys:
        assert key in result, f"Missing key: {key}"

    # Check types
    assert isinstance(result["source_shares"], dict)
    assert isinstance(result["confidence_reasons"], list)
    assert isinstance(result["trap_flag"], bool)
    assert result["model_version"] == "0.1.0"
