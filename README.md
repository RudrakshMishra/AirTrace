# AirTrace MP — Backend

Air quality ingestion, source apportionment, and API for Madhya Pradesh cities.

## Prerequisites

- Python 3.11+
- Docker & Docker Compose
- API keys: OpenAQ, NASA FIRMS (see `.env.example`)

## Quick start

```bash
# 1. Start PostGIS
docker compose up -d

# 2. Create venv and install
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/Mac: source .venv/bin/activate
pip install -e ".[dev]"

# 3. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and keys

# 4. Run be_ table migrations
alembic upgrade head

# 5. Load static data (OSM, wards, population)
python scripts/fetch_osm.py
python scripts/aggregate_population.py

# 6. Backfill historical data (powers DEMO_MODE)
python -m airtrace.cli backfill --days 14

# 7. Replay to fill ward_state for the frontend timeline
python -m airtrace.cli replay --city bhopal --hours 72

# 8. Start the server
python -m airtrace.cli serve
# API at http://localhost:8000/docs
```

## DEMO_MODE

Set `DEMO_MODE=true` in `.env`. The pipeline reads from `data/cache/` instead of
making network calls. Requires a prior backfill to populate the cache.

## Connecting the frontend

Both the frontend and backend share the **same PostgreSQL database**. The
frontend's Drizzle schema owns the shared tables; run the frontend migrations
first. Point both `DATABASE_URL` values at the same database. Set
`CORS_ORIGINS=http://localhost:3000` (or your frontend URL) in `.env`.

## Clerk JWT setup

In the Clerk dashboard, create a session token template that includes `role`
and `cityId` from public metadata. Copy the JWKS URL and issuer into `.env`.

## Tests

```bash
pytest -q
ruff check .
```
