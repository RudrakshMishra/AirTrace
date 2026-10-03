"""APScheduler-based background scheduler for hourly ingestion and pipeline runs.

Runs in-process, no Redis/Celery required.
"""

from __future__ import annotations

import signal
import sys
from datetime import UTC, datetime

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger

from airtrace.config import get_settings, load_cities_config
from airtrace.db import get_session_factory
from airtrace.engine.pipeline import run_pipeline_for_city
from airtrace.ingest.runner import run_ingestion_for_city
from airtrace.logging import get_logger

logger = get_logger(__name__)


def hourly_job():
    """Main hourly job: ingest data and run pipeline for all cities."""
    settings = get_settings()
    cities = load_cities_config()
    session_factory = get_session_factory(settings.database_url)

    timestamp = datetime.now(UTC)
    logger.info("Hourly job start", extra={"timestamp": timestamp.isoformat()})

    for city_id in cities:
        try:
            with session_factory() as session:
                # Step 1: Ingest data
                logger.info("Starting ingestion", extra={"city_id": city_id})
                ingest_counts = run_ingestion_for_city(session, city_id)
                logger.info("Ingestion complete", extra={"city_id": city_id, "counts": ingest_counts})

                # Step 2: Run pipeline
                logger.info("Starting pipeline", extra={"city_id": city_id})
                pipeline_result = run_pipeline_for_city(session, city_id, timestamp)
                logger.info("Pipeline complete", extra={"city_id": city_id, "result": pipeline_result})

        except Exception as e:
            logger.error(
                "Hourly job failed for city",
                extra={"city_id": city_id, "error": str(e)},
                exc_info=True,
            )

    logger.info("Hourly job complete", extra={"timestamp": timestamp.isoformat()})


def start_scheduler():
    """Start the APScheduler blocking scheduler with hourly cron trigger."""
    logger.info("Starting AirTrace MP scheduler")

    scheduler = BlockingScheduler(timezone="UTC")

    # Run at minute 5 past every hour (avoid the :00 rush)
    scheduler.add_job(
        hourly_job,
        trigger=CronTrigger(minute=5, timezone="UTC"),
        id="hourly_pipeline",
        name="Hourly ingestion and pipeline",
        replace_existing=True,
    )

    # Graceful shutdown on SIGINT/SIGTERM
    def shutdown_handler(signum, frame):
        logger.info("Shutdown signal received", extra={"signal": signum})
        scheduler.shutdown(wait=True)
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)

    logger.info("Scheduler configured, starting...")
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler stopped")


if __name__ == "__main__":
    start_scheduler()
