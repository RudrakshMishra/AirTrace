"""NASA FIRMS (Fire Information for Resource Management System) connector.

Fetches active fire detections from VIIRS 375m resolution data.
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


def _get_cache_path(region: str, timestamp: datetime) -> Path:
    """Return cache file path for FIRMS response."""
    cache_dir = DATA_DIR / "cache" / "firms"
    cache_dir.mkdir(parents=True, exist_ok=True)
    ts_str = timestamp.strftime("%Y%m%d_%H%M%S")
    return cache_dir / f"{region}_{ts_str}.json"


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    reraise=True,
)
def _fetch_with_retry(url: str) -> list[dict[str, Any]]:
    """Fetch from FIRMS with retries and timeout."""
    with httpx.Client(timeout=15.0) as client:
        response = client.get(url)
        response.raise_for_status()

        # FIRMS returns CSV by default; parse it
        lines = response.text.strip().split("\n")
        if not lines:
            return []

        headers = lines[0].split(",")
        results = []
        for line in lines[1:]:
            values = line.split(",")
            if len(values) == len(headers):
                results.append(dict(zip(headers, values, strict=True)))

        return results


def fetch_recent_fires(
    region: str,
    bbox: list[float],
    days: int = 1,
) -> dict[str, Any]:
    """Fetch recent fire detections for a region from NASA FIRMS VIIRS 375m.

    Args:
        region: Region identifier (e.g., city name or "mp_upwind")
        bbox: Bounding box [min_lon, min_lat, max_lon, max_lat]
        days: Number of past days to fetch (1-10)

    Returns:
        Dict with results list and metadata

    Raises:
        httpx.HTTPError: If API request fails after retries
    """
    settings = get_settings()
    timestamp = datetime.now(UTC)

    # DEMO_MODE: read from cache
    if settings.demo_mode:
        cache_files = sorted(
            (DATA_DIR / "cache" / "firms").glob(f"{region}_*.json"),
            reverse=True,
        )
        if cache_files:
            logger.info(
                "DEMO_MODE: reading FIRMS from cache",
                extra={"region": region, "file": str(cache_files[0])},
            )
            with open(cache_files[0]) as f:
                return json.load(f)
        logger.warning(
            "DEMO_MODE: no cached FIRMS data found",
            extra={"region": region},
        )
        return {"results": [], "bbox": bbox, "days": days}

    # Live mode: fetch from API
    # FIRMS VIIRS 375m uses MAP_KEY and area parameter
    map_key = settings.firms_map_key

    # Format bbox as "min_lon,min_lat,max_lon,max_lat"
    area_str = ",".join(map(str, bbox))

    # FIRMS URL format: source/MAP_KEY/VIIRS_SNPP_NRT/world/days/bbox
    url = (
        f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/"
        f"{map_key}/VIIRS_SNPP_NRT/world/{days}/{area_str}"
    )

    logger.info(
        "Fetching FIRMS fire detections",
        extra={"region": region, "bbox": bbox, "days": days},
    )

    try:
        results = _fetch_with_retry(url)

        # Filter to nominal/high confidence only
        filtered = [
            r for r in results
            if r.get("confidence", "").lower() in ("nominal", "high", "n", "h")
        ]

        data = {
            "results": filtered,
            "bbox": bbox,
            "days": days,
            "timestamp": timestamp.isoformat(),
        }

        # Save raw response to cache
        cache_path = _get_cache_path(region, timestamp)
        with open(cache_path, "w") as f:
            json.dump(data, f, indent=2)

        logger.info(
            "FIRMS fetch complete",
            extra={
                "region": region,
                "total_fires": len(results),
                "filtered_fires": len(filtered),
            },
        )

        return data

    except httpx.HTTPError as e:
        logger.error(
            "FIRMS fetch failed",
            extra={"region": region, "error": str(e)},
        )
        raise


def normalize_fire(raw: dict[str, Any]) -> dict[str, Any] | None:
    """Normalize FIRMS fire detection to our schema.

    Args:
        raw: Single fire detection from FIRMS CSV

    Returns:
        Normalized fire dict or None if invalid
    """
    try:
        lat = float(raw.get("latitude", 0))
        lon = float(raw.get("longitude", 0))
        brightness = float(raw.get("brightness", 0))
        frp = float(raw.get("frp", 0))  # Fire Radiative Power in MW
        confidence = raw.get("confidence", "").lower()

        # Parse acquisition date and time
        acq_date = raw.get("acq_date")  # YYYY-MM-DD
        acq_time = raw.get("acq_time")  # HHMM

        if not all([lat, lon, acq_date, acq_time]):
            return None

        # Combine date and time into datetime
        dt_str = f"{acq_date} {acq_time[:2]}:{acq_time[2:]}:00"
        acq_datetime = datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S").replace(tzinfo=UTC)

        # Map confidence
        confidence_map = {"n": "nominal", "h": "high", "nominal": "nominal", "high": "high"}
        conf = confidence_map.get(confidence, "nominal")

        return {
            "lat": lat,
            "lon": lon,
            "brightness": brightness,
            "frp": frp,
            "confidence": conf,
            "acq_date": acq_datetime,
            "satellite": raw.get("satellite", "VIIRS"),
            "source": "firms",
        }

    except (KeyError, ValueError, TypeError) as e:
        logger.warning(
            "Failed to normalize FIRMS fire",
            extra={"error": str(e), "raw": raw},
        )
        return None
