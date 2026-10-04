"""OpenAQ v3 API connector for station readings.

Fetches latest measurements from OpenAQ v3 API with caching and DEMO_MODE support.
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
    """Return cache file path for OpenAQ response."""
    cache_dir = DATA_DIR / "cache" / "openaq"
    cache_dir.mkdir(parents=True, exist_ok=True)
    ts_str = timestamp.strftime("%Y%m%d_%H%M%S")
    return cache_dir / f"{city_id}_{ts_str}.json"


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    reraise=True,
)
def _fetch_with_retry(url: str, headers: dict[str, str], params: dict[str, Any]) -> dict[str, Any]:
    """Fetch from OpenAQ with retries and timeout."""
    with httpx.Client(timeout=15.0) as client:
        response = client.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()


def fetch_latest_readings(
    city_id: str,
    bbox: list[float],
    limit: int = 1000,
) -> dict[str, Any]:
    """Fetch latest air quality readings for a city from OpenAQ v3.

    Args:
        city_id: City identifier
        bbox: Bounding box [min_lon, min_lat, max_lon, max_lat]
        limit: Maximum number of readings to fetch

    Returns:
        Raw OpenAQ v3 API response with results

    Raises:
        httpx.HTTPError: If API request fails after retries
    """
    settings = get_settings()
    timestamp = datetime.now(UTC)

    # DEMO_MODE: read from cache
    if settings.demo_mode:
        cache_files = sorted(
            (DATA_DIR / "cache" / "openaq").glob(f"{city_id}_*.json"),
            reverse=True,
        )
        if cache_files:
            logger.info(
                "DEMO_MODE: reading OpenAQ from cache",
                extra={"city_id": city_id, "file": str(cache_files[0])},
            )
            with open(cache_files[0]) as f:
                return json.load(f)
        logger.warning(
            "DEMO_MODE: no cached OpenAQ data found",
            extra={"city_id": city_id},
        )
        return {"meta": {}, "results": []}

    # Live mode: fetch from API
    url = "https://api.openaq.org/v3/measurements"
    headers = {"X-API-Key": settings.openaq_api_key}
    params = {
        "bbox": ",".join(map(str, bbox)),
        "limit": limit,
        "order_by": "datetime",
        "sort_order": "desc",
    }

    logger.info(
        "Fetching OpenAQ readings",
        extra={"city_id": city_id, "bbox": bbox},
    )

    try:
        data = _fetch_with_retry(url, headers, params)

        # Save raw response to cache
        cache_path = _get_cache_path(city_id, timestamp)
        with open(cache_path, "w") as f:
            json.dump(data, f, indent=2)

        logger.info(
            "OpenAQ fetch complete",
            extra={"city_id": city_id, "rows": len(data.get("results", []))},
        )

        return data

    except httpx.HTTPError as e:
        logger.error(
            "OpenAQ fetch failed",
            extra={"city_id": city_id, "error": str(e)},
        )
        raise


def normalize_reading(raw: dict[str, Any]) -> dict[str, Any] | None:
    """Normalize OpenAQ v3 measurement to our schema.

    Args:
        raw: Single measurement from OpenAQ v3 API

    Returns:
        Normalized reading dict or None if invalid
    """
    try:
        # OpenAQ v3 structure: {location_id, parameter, value, unit, datetime, ...}
        location_id = raw.get("location_id")
        parameter = raw.get("parameter", {}).get("name") if isinstance(
            raw.get("parameter"), dict
        ) else raw.get("parameter")
        value = raw.get("value")
        dt_str = raw.get("datetime")

        if not all([location_id, parameter, value, dt_str]):
            return None

        # Parse timestamp
        timestamp = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))

        # Map parameter names to our fields
        param_map = {
            "pm25": "pm25",
            "pm2.5": "pm25",
            "pm10": "pm10",
            "no2": "no2",
            "so2": "so2",
            "co": "co",
            "o3": "o3",
        }

        field = param_map.get(parameter.lower())
        if not field:
            return None

        return {
            "station_id": str(location_id),
            "timestamp": timestamp,
            "parameter": field,
            "value": float(value),
            "source": "openaq",
        }

    except (KeyError, ValueError, TypeError) as e:
        logger.warning(
            "Failed to normalize OpenAQ reading",
            extra={"error": str(e), "raw": raw},
        )
        return None
