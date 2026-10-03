"""CPCB (Central Pollution Control Board) data feed via data.gov.in.

Fallback connector for Indian government air quality data when OpenAQ is unavailable.
"""

from __future__ import annotations

import contextlib
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
    """Return cache file path for CPCB response."""
    cache_dir = DATA_DIR / "cache" / "cpcb"
    cache_dir.mkdir(parents=True, exist_ok=True)
    ts_str = timestamp.strftime("%Y%m%d_%H%M%S")
    return cache_dir / f"{city_id}_{ts_str}.json"


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    reraise=True,
)
def _fetch_with_retry(url: str, headers: dict[str, str], params: dict[str, Any]) -> dict[str, Any]:
    """Fetch from CPCB API with retries and timeout."""
    with httpx.Client(timeout=15.0) as client:
        response = client.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()


def fetch_latest_readings(
    city_id: str,
    city_name: str,
    limit: int = 100,
) -> dict[str, Any]:
    """Fetch latest air quality readings for a city from CPCB via data.gov.in.

    Args:
        city_id: City identifier
        city_name: City name for CPCB API
        limit: Maximum number of readings to fetch

    Returns:
        Raw CPCB API response with records

    Raises:
        httpx.HTTPError: If API request fails after retries
    """
    settings = get_settings()
    timestamp = datetime.now(UTC)

    # DEMO_MODE: read from cache
    if settings.demo_mode:
        cache_files = sorted(
            (DATA_DIR / "cache" / "cpcb").glob(f"{city_id}_*.json"),
            reverse=True,
        )
        if cache_files:
            logger.info(
                "DEMO_MODE: reading CPCB from cache",
                extra={"city_id": city_id, "file": str(cache_files[0])},
            )
            with open(cache_files[0]) as f:
                return json.load(f)
        logger.warning(
            "DEMO_MODE: no cached CPCB data found",
            extra={"city_id": city_id},
        )
        return {"records": []}

    # Live mode: fetch from API
    # Note: The actual CPCB API endpoint may vary; this is a placeholder
    url = "https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69"
    headers = {"api-key": settings.data_gov_in_key}
    params = {
        "format": "json",
        "filters[city]": city_name,
        "limit": limit,
    }

    logger.info(
        "Fetching CPCB readings",
        extra={"city_id": city_id, "city_name": city_name},
    )

    try:
        data = _fetch_with_retry(url, headers, params)

        # Save raw response to cache
        cache_path = _get_cache_path(city_id, timestamp)
        with open(cache_path, "w") as f:
            json.dump(data, f, indent=2)

        logger.info(
            "CPCB fetch complete",
            extra={"city_id": city_id, "rows": len(data.get("records", []))},
        )

        return data

    except httpx.HTTPError as e:
        logger.error(
            "CPCB fetch failed",
            extra={"city_id": city_id, "error": str(e)},
        )
        raise


def normalize_reading(raw: dict[str, Any]) -> dict[str, Any] | None:
    """Normalize CPCB record to our schema.

    Args:
        raw: Single record from CPCB API

    Returns:
        Normalized reading dict or None if invalid
    """
    try:
        # CPCB structure varies; this is a common pattern
        station_id = raw.get("station") or raw.get("station_id")
        timestamp_str = raw.get("last_update") or raw.get("timestamp")

        if not all([station_id, timestamp_str]):
            return None

        # Parse timestamp (format may vary)
        try:
            timestamp = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            return None

        # Extract pollutant values
        pollutants = {}
        for key in ["pm25", "pm2.5", "pm10", "no2", "so2", "co", "o3"]:
            val = raw.get(key)
            if val is not None:
                with contextlib.suppress(ValueError, TypeError):
                    pollutants[key.replace(".", "")] = float(val)

        if not pollutants:
            return None

        return {
            "station_id": str(station_id),
            "timestamp": timestamp,
            "pollutants": pollutants,
            "source": "cpcb",
        }

    except (KeyError, ValueError, TypeError) as e:
        logger.warning(
            "Failed to normalize CPCB reading",
            extra={"error": str(e), "raw": raw},
        )
        return None
