"""Historical replay script for AirTrace MP.

Simulates hourly ingestion and pipeline execution across a time window.
Useful for local demos, model validation, and testing database state progression.
"""

from __future__ import annotations

import argparse
import sys
import time
from datetime import UTC, datetime, timedelta

from airtrace.config import get_settings, load_cities_config
from airtrace.db import get_session_factory
from airtrace.engine.pipeline import run_pipeline_for_city
from airtrace.ingest.runner import run_ingestion_for_city
from airtrace.logging import get_logger, setup_logging

logger = get_logger(__name__)


def replay_city(
    city_id: str,
    start_time: datetime,
    end_time: datetime,
    step_hours: int = 1,
    run_ingest: bool = False,
    delay_seconds: float = 0.0,
) -> list[dict]:
    """Replay pipeline steps for a city across a historical time window.

    Args:
        city_id: City identifier
        start_time: Start timestamp (UTC)
        end_time: End timestamp (UTC)
        step_hours: Step interval in hours
        run_ingest: Whether to trigger ingestion before running the pipeline
        delay_seconds: Pause between hourly replay steps

    Returns:
        List of execution summary dictionaries
    """
    settings = get_settings()
    session_factory = get_session_factory(settings.database_url)
    results = []

    current_time = start_time
    total_steps = int((end_time - start_time).total_seconds() // (step_hours * 3600)) + 1
    step = 0

    logger.info(
        f"Replaying {city_id} from {start_time.isoformat()} to {end_time.isoformat()} "
        f"({total_steps} steps, interval={step_hours}h)"
    )

    while current_time <= end_time:
        step += 1
        step_summary = {
            "step": step,
            "city_id": city_id,
            "timestamp": current_time.isoformat(),
            "status": "pending",
        }

        try:
            with session_factory() as session:
                if run_ingest:
                    logger.info(f"[{step}/{total_steps}] Ingesting data for {city_id} at {current_time.isoformat()}")
                    ingest_counts = run_ingestion_for_city(session, city_id)
                    step_summary["ingest"] = ingest_counts

                logger.info(f"[{step}/{total_steps}] Running pipeline for {city_id} at {current_time.isoformat()}")
                pipe_res = run_pipeline_for_city(session, city_id, timestamp=current_time)
                step_summary["pipeline"] = pipe_res
                step_summary["status"] = "success"

        except Exception as e:
            logger.error(f"Replay step failed at {current_time.isoformat()}: {e}", exc_info=True)
            step_summary["status"] = "failed"
            step_summary["error"] = str(e)

        results.append(step_summary)

        if delay_seconds > 0 and current_time < end_time:
            time.sleep(delay_seconds)

        current_time += timedelta(hours=step_hours)

    return results


def main() -> None:
    """CLI entry point for pipeline replay."""
    parser = argparse.ArgumentParser(description="Replay AirTrace MP hourly pipeline across a historical window")
    parser.add_argument("--city", help="Specific city identifier (e.g. bhopal, indore, singrauli)")
    parser.add_argument("--hours", type=int, default=24, help="Number of past hours to replay (default: 24)")
    parser.add_argument("--step-hours", type=int, default=1, help="Interval between steps in hours (default: 1)")
    parser.add_argument("--delay", type=float, default=0.0, help="Delay in seconds between steps (default: 0)")
    parser.add_argument("--ingest", action="store_true", help="Run ingestion prior to pipeline at each step")

    args = parser.parse_args()

    setup_logging()

    cities = load_cities_config()
    if args.city:
        if args.city not in cities:
            logger.error(f"Unknown city: {args.city}. Available: {list(cities.keys())}")
            sys.exit(1)
        city_ids = [args.city]
    else:
        city_ids = list(cities.keys())

    now = datetime.now(UTC)
    start_time = now - timedelta(hours=args.hours)

    print("\n=== AirTrace MP Historical Replay ===")
    print(f"Cities: {', '.join(city_ids)}")
    print(f"Time window: {start_time.strftime('%Y-%m-%d %H:%M UTC')} -> {now.strftime('%Y-%m-%d %H:%M UTC')}")
    print(f"Step interval: {args.step_hours}h | Ingest: {args.ingest} | Delay: {args.delay}s\n")

    for city_id in city_ids:
        print(f"--- Replaying {city_id.upper()} ---")
        results = replay_city(
            city_id=city_id,
            start_time=start_time,
            end_time=now,
            step_hours=args.step_hours,
            run_ingest=args.ingest,
            delay_seconds=args.delay,
        )
        successful = sum(1 for r in results if r["status"] == "success")
        print(f"Completed {successful}/{len(results)} steps successfully for {city_id}.\n")

    print("Replay run completed.")


if __name__ == "__main__":
    main()
