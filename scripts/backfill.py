"""Backfill historical data for DEMO_MODE.

Fetches past N days of data from all sources and populates the cache directory.
This allows DEMO_MODE to run the full pipeline without network calls.
"""

from __future__ import annotations

import argparse
import sys

from airtrace.config import load_cities_config
from airtrace.ingest import cams, cpcb, firms, openaq, weather
from airtrace.logging import get_logger, setup_logging

logger = get_logger(__name__)


def backfill_city(city_id: str, days: int = 14) -> dict[str, int]:
    """Backfill historical data for one city.

    Args:
        city_id: City identifier
        days: Number of days to backfill

    Returns:
        Dict with counts per source
    """
    cities = load_cities_config()
    city = cities.get(city_id)

    if not city:
        raise ValueError(f"Unknown city: {city_id}")

    logger.info(f"Backfilling {days} days for {city_id}")

    counts = {}

    # OpenAQ - fetch latest (historical API access may be limited)
    try:
        data = openaq.fetch_latest_readings(city_id, city["bbox"], limit=5000)
        counts["openaq"] = len(data.get("results", []))
        logger.info(f"OpenAQ: {counts['openaq']} readings")
    except Exception as e:
        logger.error(f"OpenAQ failed: {e}")
        counts["openaq"] = 0

    # CPCB fallback
    if counts.get("openaq", 0) == 0:
        try:
            data = cpcb.fetch_latest_readings(city_id, city["name"], limit=1000)
            counts["cpcb"] = len(data.get("records", []))
            logger.info(f"CPCB: {counts['cpcb']} readings")
        except Exception as e:
            logger.error(f"CPCB failed: {e}")
            counts["cpcb"] = 0

    # FIRMS - supports historical data
    try:
        fire_bbox = city.get("fire_bbox", city["bbox"])
        data = firms.fetch_recent_fires(city_id, fire_bbox, days=min(days, 10))
        counts["firms"] = len(data.get("results", []))
        logger.info(f"FIRMS: {counts['firms']} fires")
    except Exception as e:
        logger.error(f"FIRMS failed: {e}")
        counts["firms"] = 0

    # Weather - forecast only (no historical API)
    try:
        lat, lon = city["centre"]
        data = weather.fetch_weather(city_id, lat, lon)
        records = weather.normalize_weather(data, lat, lon)
        counts["weather"] = len(records)
        logger.info(f"Weather: {counts['weather']} records")
    except Exception as e:
        logger.error(f"Weather failed: {e}")
        counts["weather"] = 0

    # CAMS - forecast only
    try:
        lat, lon = city["centre"]
        data = cams.fetch_air_quality(city_id, lat, lon)
        records = cams.normalize_air_quality(data, lat, lon)
        counts["cams"] = len(records)
        logger.info(f"CAMS: {counts['cams']} records")
    except Exception as e:
        logger.error(f"CAMS failed: {e}")
        counts["cams"] = 0

    return counts


def main() -> None:
    """CLI entry point for backfill script."""
    parser = argparse.ArgumentParser(description="Backfill historical data for DEMO_MODE")
    parser.add_argument("--city", help="Specific city to backfill (or all cities)")
    parser.add_argument("--days", type=int, default=14, help="Number of days to backfill")

    args = parser.parse_args()

    setup_logging()

    cities = load_cities_config()

    if args.city:
        if args.city not in cities:
            logger.error(f"Unknown city: {args.city}")
            sys.exit(1)
        city_ids = [args.city]
    else:
        city_ids = list(cities.keys())

    logger.info(f"Starting backfill for {len(city_ids)} cities, {args.days} days")

    results = {}
    for city_id in city_ids:
        try:
            counts = backfill_city(city_id, args.days)
            results[city_id] = counts
        except Exception as e:
            logger.error(f"City backfill failed: {city_id} - {e}")
            results[city_id] = {}

    # Summary
    print("\n=== Backfill Summary ===")
    for city_id, counts in results.items():
        print(f"\n{city_id}:")
        for source, count in counts.items():
            print(f"  {source}: {count} records")

    print("\nBackfill complete. Set DEMO_MODE=true to use cached data.")


if __name__ == "__main__":
    main()
