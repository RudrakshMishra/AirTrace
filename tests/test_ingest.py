"""Unit tests for ingestion connectors with fixture responses."""

from __future__ import annotations

from datetime import datetime
from unittest.mock import patch

import pytest

from airtrace.ingest import cams, firms, openaq, weather

# === Test Fixtures ===

OPENAQ_FIXTURE = {
    "meta": {"found": 2},
    "results": [
        {
            "location_id": "station_1",
            "parameter": {"name": "pm25"},
            "value": 45.2,
            "unit": "µg/m³",
            "datetime": "2026-10-03T06:00:00Z",
        },
        {
            "location_id": "station_1",
            "parameter": {"name": "pm10"},
            "value": 85.1,
            "unit": "µg/m³",
            "datetime": "2026-10-03T06:00:00Z",
        },
    ],
}

FIRMS_CSV_RESPONSE = """latitude,longitude,brightness,frp,confidence,acq_date,acq_time,satellite
23.5,77.0,320.5,150.2,nominal,2026-10-03,0600,VIIRS
23.6,76.9,315.8,200.5,high,2026-10-03,0700,VIIRS
23.7,76.8,310.2,180.3,low,2026-10-03,0800,VIIRS"""

WEATHER_FIXTURE = {
    "hourly": {
        "time": ["2026-10-03T06:00", "2026-10-03T07:00"],
        "temperature_2m": [28.5, 29.2],
        "relative_humidity_2m": [65, 62],
        "precipitation": [0.0, 0.0],
        "wind_speed_10m": [3.5, 4.2],
        "wind_direction_10m": [270, 275],
        "boundary_layer_height": [1200, 1350],
    }
}

CAMS_FIXTURE = {
    "hourly": {
        "time": ["2026-10-03T06:00", "2026-10-03T07:00"],
        "pm2_5": [42.1, 45.3],
        "pm10": [78.5, 82.1],
        "nitrogen_dioxide": [55.2, 58.1],
        "sulphur_dioxide": [15.3, 16.2],
        "carbon_monoxide": [1.8, 1.9],
        "ozone": [65.3, 68.1],
    }
}


# === OpenAQ Tests ===


def test_openaq_normalize_reading():
    """Test OpenAQ reading normalization."""
    raw = OPENAQ_FIXTURE["results"][0]
    normalized = openaq.normalize_reading(raw)

    assert normalized is not None
    assert normalized["station_id"] == "station_1"
    assert normalized["parameter"] == "pm25"
    assert normalized["value"] == 45.2
    assert normalized["source"] == "openaq"
    assert isinstance(normalized["timestamp"], datetime)


def test_openaq_normalize_reading_invalid():
    """Test OpenAQ normalization with invalid data."""
    result = openaq.normalize_reading({"invalid": "data"})
    assert result is None


@patch("airtrace.ingest.openaq._fetch_with_retry")
@patch("airtrace.ingest.openaq.get_settings")
def test_openaq_fetch_live_mode(mock_settings, mock_fetch):
    """Test OpenAQ fetch in live mode."""
    mock_settings.return_value.demo_mode = False
    mock_settings.return_value.openaq_api_key = "test_key"
    mock_fetch.return_value = OPENAQ_FIXTURE

    result = openaq.fetch_latest_readings("bhopal", [77.25, 23.10, 77.55, 23.40])

    assert result == OPENAQ_FIXTURE
    assert mock_fetch.called


# === FIRMS Tests ===


def test_firms_normalize_fire():
    """Test FIRMS fire detection normalization."""
    raw = {
        "latitude": "23.5",
        "longitude": "77.0",
        "brightness": "320.5",
        "frp": "150.2",
        "confidence": "nominal",
        "acq_date": "2026-10-03",
        "acq_time": "0600",
        "satellite": "VIIRS",
    }

    normalized = firms.normalize_fire(raw)

    assert normalized is not None
    assert normalized["lat"] == 23.5
    assert normalized["lon"] == 77.0
    assert normalized["frp"] == 150.2
    assert normalized["confidence"] == "nominal"
    assert normalized["source"] == "firms"
    assert isinstance(normalized["acq_date"], datetime)


def test_firms_normalize_fire_invalid():
    """Test FIRMS normalization with invalid data."""
    result = firms.normalize_fire({"invalid": "data"})
    assert result is None


@patch("airtrace.ingest.firms._fetch_with_retry")
@patch("airtrace.ingest.firms.get_settings")
def test_firms_fetch_filters_confidence(mock_settings, mock_fetch):
    """Test FIRMS filters to nominal/high confidence."""
    mock_settings.return_value.demo_mode = False
    mock_settings.return_value.firms_map_key = "test_key"

    # Mock CSV response
    mock_fetch.return_value = [
        {
            "latitude": "23.5",
            "longitude": "77.0",
            "brightness": "320.5",
            "frp": "150.2",
            "confidence": "nominal",
            "acq_date": "2026-10-03",
            "acq_time": "0600",
            "satellite": "VIIRS",
        },
        {
            "latitude": "23.6",
            "longitude": "76.9",
            "brightness": "315.8",
            "frp": "200.5",
            "confidence": "low",
            "acq_date": "2026-10-03",
            "acq_time": "0700",
            "satellite": "VIIRS",
        },
    ]

    result = firms.fetch_recent_fires("bhopal", [75.0, 21.0, 80.0, 26.0], days=1)

    # Should filter out "low" confidence
    assert len(result["results"]) == 1
    assert result["results"][0]["confidence"] == "nominal"


# === Weather Tests ===


def test_weather_normalize():
    """Test weather data normalization."""
    records = weather.normalize_weather(WEATHER_FIXTURE, 23.2599, 77.4126)

    assert len(records) == 2
    assert records[0]["lat"] == 23.2599
    assert records[0]["lon"] == 77.4126
    assert records[0]["temperature_c"] == 28.5
    assert records[0]["wind_speed_ms"] == 3.5
    assert records[0]["wind_speed_kmh"] == pytest.approx(3.5 * 3.6)
    assert records[0]["blh_m"] == 1200
    assert records[0]["source"] == "open_meteo"
    assert isinstance(records[0]["timestamp"], datetime)


def test_weather_normalize_empty():
    """Test weather normalization with empty data."""
    records = weather.normalize_weather({"hourly": {}}, 23.0, 77.0)
    assert records == []


# === CAMS Tests ===


def test_cams_normalize():
    """Test CAMS air quality normalization."""
    records = cams.normalize_air_quality(CAMS_FIXTURE, 23.2599, 77.4126)

    assert len(records) == 2
    assert records[0]["lat"] == 23.2599
    assert records[0]["lon"] == 77.4126
    assert records[0]["pm25"] == 42.1
    assert records[0]["pm10"] == 78.5
    assert records[0]["no2"] == 55.2
    assert records[0]["so2"] == 15.3
    assert records[0]["co"] == 1.8
    assert records[0]["o3"] == 65.3
    assert records[0]["source"] == "cams"
    assert isinstance(records[0]["timestamp"], datetime)


def test_cams_normalize_empty():
    """Test CAMS normalization with empty data."""
    records = cams.normalize_air_quality({"hourly": {}}, 23.0, 77.0)
    assert records == []
