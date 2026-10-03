"""Open-Meteo weather API connector.

Fetches weather data (wind, boundary layer height, precipitation, temperature, humidity).
"""

from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from airtrace.config import DATA_DIR, get_settings
from airtrace.logging import get_logger

logger = get_logger(__name__)


def _get_cache_path(city_id: str, timestamp: datetime) -> Path:
    """Return cache file path for weather response."""
    cache_dir = DATA_DIR / "cache" / "weather"
    cache_dir.mkdir(parents=True, exist_ok=True)
    ts_str = timestamp.strftime("%Y%m%d_%H%M%S")
    return cache_dir / f"{city_id}_{ts_str}.json"


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    reraise=True,
)
def _fetch_with_retry(url: str, params: dict[str, Any]) -> dict[str, Any]:
    """Fetch from Open-Meteo with retries and timeout."""
    with httpx.Client(timeout=15.0) as client:
        response = client.get(url, params=params)
        response.raise_for_status()
        return response.json()


def fetch_weather(
    city_id: str,
    lat: float,
    lon: float,
) -> dict[str, Any]:
    """Fetch current and forecast weather from Open-Meteo.

    Args:
        city_id: City identifier
        lat: Latitude
        lon: Longitude

    Returns:
        Raw Open-Meteo API response

    Raises:
        httpx.HTTPError: If API request fails after retries
    """
    settings = get_settings()
    timestamp = datetime.now(UTC)

    # DEMO_MODE: read from cache
    if settings.demo_mode:
        cache_files = sorted(
            (DATA_DIR / "cache" / "weather").glob(f"{city_id}_*.json"),
            reverse=True,
        )
        if cache_files:
            logger.info(
                "DEMO_MODE: reading weather from cache",
                extra={"city_id": city_id, "file": str(cache_files[0])},
            )
            with open(cache_files[0]) as f:
                return json.load(f)
        logger.warning(
            "DEMO_MODE: no cached weather data found",
            extra={"city_id": city_id},
        )
        return {"hourly": {}}

    # Live mode: fetch from API
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": [
            "temperature_2m",
            "relative_humidity_2m",
            "precipitation",
            "wind_speed_10m",
            "wind_direction_10m",
            "boundary_layer_height",
        ],
        "forecast_days": 2,
        "timezone": "UTC",
    }

    logger.info(
        "Fetching weather data",
        extra={"city_id": city_id, "lat": lat, "lon": lon},
    )

    try:
        data = _fetch_with_retry(url, params)

        # Save raw response to cache
        cache_path = _get_cache_path(city_id, timestamp)
        with open(cache_path, "w") as f:
            json.dump(data, f, indent=2)

        logger.info(
            "Weather fetch complete",
            extra={"city_id": city_id},
        )

        return data

    except httpx.HTTPError as e:
        logger.error(
            "Weather fetch failed",
            extra={"city_id": city_id, "error": str(e)},
        )
        raise


def normalize_weather(
    raw: dict[str, Any],
    lat: float,
    lon: float,
) -> list[dict[str, Any]]:
    """Normalize Open-Meteo weather data to our schema.

    Args:
        raw: Open-Meteo API response
        lat: Location latitude
        lon: Location longitude

    Returns:
        List of hourly weather records
    """
    try:
        hourly = raw.get("hourly", {})
        times = hourly.get("time", [])

        if not times:
            return []

        records = []
        for i, time_str in enumerate(times):
            timestamp = datetime.fromisoformat(time_str.replace("Z", "+00:00"))

            record = {
                "lat": lat,
                "lon": lon,
                "timestamp": timestamp,
                "temperature_c": hourly.get("temperature_2m", [])[i] if i < len(hourly.get("temperature_2m", [])) else None,
                "humidity_pct": hourly.get("relative_humidity_2m", [])[i] if i < len(hourly.get("relative_humidity_2m", [])) else None,
                "precipitation_mm": hourly.get("precipitation", [])[i] if i < len(hourly.get("precipitation", [])) else None,
                "wind_speed_ms": hourly.get("wind_speed_10m", [])[i] if i < len(hourly.get("wind_speed_10m", [])) else None,
                "wind_direction_deg": hourly.get("wind_direction_10m", [])[i] if i < len(hourly.get("wind_direction_10m", [])) else None,
                "blh_m": hourly.get("boundary_layer_height", [])[i] if i < len(hourly.get("boundary_layer_height", [])) else None,
                "source": "open_meteo",
            }

            # Convert wind speed from m/s to km/h for consistency
            if record["wind_speed_ms"] is not None:
                record["wind_speed_kmh"] = record["wind_speed_ms"] * 3.6

            records.append(record)

        return records

    except (KeyError, ValueError, TypeError) as e:
        logger.warning(
            "Failed to normalize weather data",
            extra={"error": str(e)},
        )
        return []
