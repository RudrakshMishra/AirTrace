"""CLI entry point for AirTrace MP backend."""

from __future__ import annotations

import argparse
import sys


def main() -> None:
    """Parse CLI arguments and dispatch commands."""
    parser = argparse.ArgumentParser(prog="airtrace", description="AirTrace MP backend CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    # serve
    serve_p = sub.add_parser("serve", help="Start the API server")
    serve_p.add_argument("--host", default="0.0.0.0")
    serve_p.add_argument("--port", type=int, default=8000)

    # ingest
    ingest_p = sub.add_parser("ingest", help="Run ingestion for a city")
    ingest_p.add_argument("--city", required=True)

    # compute
    compute_p = sub.add_parser("compute", help="Run engine pipeline for a city")
    compute_p.add_argument("--city", required=True)

    # replay
    replay_p = sub.add_parser("replay", help="Replay pipeline for past hours")
    replay_p.add_argument("--city", required=True)
    replay_p.add_argument("--hours", type=int, default=72)

    # backfill
    backfill_p = sub.add_parser("backfill", help="Backfill data for past days")
    backfill_p.add_argument("--days", type=int, default=14)
    backfill_p.add_argument("--city", default=None, help="Specific city or all")

    args = parser.parse_args()

    # Lazy imports to avoid loading everything for --help
    from airtrace.logging import setup_logging

    setup_logging()

    if args.command == "serve":
        import uvicorn

        uvicorn.run("airtrace.api.main:app", host=args.host, port=args.port, reload=True)
    elif args.command == "ingest":
        from airtrace.db import get_session_factory
        from airtrace.ingest.runner import run_ingestion_for_city

        SessionFactory = get_session_factory()
        with SessionFactory() as session:
            counts = run_ingestion_for_city(session, args.city)
            print(f"\nIngestion complete for {args.city}:")
            for source, count in counts.items():
                print(f"  {source}: {count} records")
    elif args.command == "compute":
        # Will be implemented in Phase 5
        sys.exit("compute: not yet implemented")
    elif args.command == "replay":
        # Will be implemented in Phase 5
        sys.exit("replay: not yet implemented")
    elif args.command == "backfill":
        from scripts.backfill import backfill_city

        if args.city:
            counts = backfill_city(args.city, args.days)
            print(f"\nBackfill complete for {args.city}:")
            for source, count in counts.items():
                print(f"  {source}: {count} records")
        else:
            from airtrace.config import load_cities_config

            cities = load_cities_config()
            for city_id in cities:
                counts = backfill_city(city_id, args.days)
                print(f"\n{city_id}:")
                for source, count in counts.items():
                    print(f"  {source}: {count} records")


if __name__ == "__main__":
    main()
