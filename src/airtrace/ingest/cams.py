"""Open-Meteo Air Quality (CAMS) connector.

Fetches modeled air quality data from CAMS (Copernicus Atmosphere Monitoring Service).
Used as gap-fill when station data is unavailable.
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
    """Return cache file path for CAMS response."""
    cache_dir = DATA_DIR / "cache" / "cams"
    cache_dir.mkdir(parents=True, exist_ok=True)
    ts_str = timestamp.strftime("%Y%m%d_%H%M%S")
    return cache_dir / f"{city_id}_{ts_str}.json"


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    reraise=True,
)
def _fetch_with_retry(url: str, params: dict[str, Any]) -> dict[str, Any]:
    """Fetch from Open-Meteo Air Quality with retries and timeout."""
    with httpx.Client(timeout=15.0) as client:
        response = client.get(url, params=params)
        response.raise_for_status()
        return response.json()


def fetch_air_quality(
    city_id: str,
    lat: float,
    lon: float,
) -> dict[str, Any]:
    """Fetch modeled air quality from Open-Meteo CAMS.

    Args:
        city_id: City identifier
        lat: Latitude
        lon: Longitude

    Returns:
        Raw Open-Meteo Air Quality API response

    Raises:
        httpx.HTTPError: If API request fails after retries
    """
    settings = get_settings()
    timestamp = datetime.now(UTC)

    # DEMO_MODE: read from cache
    if settings.demo_mode:
        cache_files = sorted(
            (DATA_DIR / "cache" / "cams").glob(f"{city_id}_*.json"),
            reverse=True,
        )
        if cache_files:
            logger.info(
                "DEMO_MODE: reading CAMS from cache",
                extra={"city_id": city_id, "file": str(cache_files[0])},
            )
            with open(cache_files[0]) as f:
                return json.load(f)
        logger.warning(
            "DEMO_MODE: no cached CAMS data found",
            extra={"city_id": city_id},
        )
        return {"hourly": {}}

    # Live mode: fetch from API
    url = "https://air-quality-api.open-meteo.com/v1/air-quality"
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": [
            "pm10",
            "pm2_5",
            "carbon_monoxide",
            "nitrogen_dioxide",
            "sulphur_dioxide",
            "ozone",
        ],
        "forecast_days": 2,
        "timezone": "UTC",
    }

    logger.info(
        "Fetching CAMS air quality data",
        extra={"city_id": city_id, "lat": lat, "lon": lon},
    )

    try:
        data = _fetch_with_retry(url, params)

        # Save raw response to cache
        cache_path = _get_cache_path(city_id, timestamp)
        with open(cache_path, "w") as f:
            json.dump(data, f, indent=2)

        logger.info(
            "CAMS fetch complete",
            extra={"city_id": city_id},
        )

        return data

    except httpx.HTTPError as e:
        logger.error(
            "CAMS fetch failed",
            extra={"city_id": city_id, "error": str(e)},
        )
        raise


def normalize_air_quality(
    raw: dict[str, Any],
    lat: float,
    lon: float,
) -> list[dict[str, Any]]:
    """Normalize Open-Meteo CAMS data to our schema.

    Args:
        raw: Open-Meteo Air Quality API response
        lat: Location latitude
        lon: Location longitude

    Returns:
        List of hourly air quality records
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
                "pm25": hourly.get("pm2_5", [])[i] if i < len(hourly.get("pm2_5", [])) else None,
                "pm10": hourly.get("pm10", [])[i] if i < len(hourly.get("pm10", [])) else None,
                "no2": hourly.get("nitrogen_dioxide", [])[i] if i < len(hourly.get("nitrogen_dioxide", [])) else None,
                "so2": hourly.get("sulphur_dioxide", [])[i] if i < len(hourly.get("sulphur_dioxide", [])) else None,
                "co": hourly.get("carbon_monoxide", [])[i] if i < len(hourly.get("carbon_monoxide", [])) else None,
                "o3": hourly.get("ozone", [])[i] if i < len(hourly.get("ozone", [])) else None,
                "source": "cams",
            }

            records.append(record)

        return records

    except (KeyError, ValueError, TypeError) as e:
        logger.warning(
            "Failed to normalize CAMS data",
            extra={"error": str(e)},
        )
        return []
