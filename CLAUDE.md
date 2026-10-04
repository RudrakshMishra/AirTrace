## Project
AirTrace MP backend. It ingests air quality, fire, and weather data for Madhya Pradesh cities (Bhopal, Indore, Singrauli first), estimates ward-level AQI, scores probable pollution sources with confidence, computes pollution-trap and vulnerability-weighted risk, generates rule-based actions and alerts, and exposes an API. The Next.js frontend already reads the shared PostgreSQL database directly through its own data layer, so the backend's main job is **to fill that database hourly** plus provide a few API endpoints (explain, report PDF, alerts, reports).

## Stack (do not substitute)
Python 3.11+, FastAPI, Uvicorn, SQLAlchemy 2.x (sync is fine), Pydantic v2, pandas, numpy, geopandas, shapely, pyproj, httpx, APScheduler (in-process scheduler, no Redis/Celery), tenacity (retries), python-jose or PyJWT with JWKS for Clerk JWT verification, python-telegram-bot, reportlab or weasyprint for PDF, anthropic SDK (optional explain), pytest, ruff, uv or pip + venv. PostgreSQL 16 with PostGIS via Docker Compose.

## Database ownership (important)
The **frontend's Drizzle schema is the source of truth** for these tables: cities, wards, stations, readings, fires, ward_state, actions, alerts, subscribers, reports, users, audit_log. Mirror them as SQLAlchemy models with identical names and columns. **Do not create or alter those tables with backend migrations.** If a column is missing, tell me instead of changing it. The backend may add its own tables with Alembic prefixed `be_` (for example `be_ingest_runs`, `be_raw_cache_index`, `be_model_config`).

## Rules for the agent
1. Be economical: smallest change that works, no unrelated refactors, do not re-read files you just wrote.
2. Every phase ends with passing `pytest -q` and `ruff check .`. Fix failures before stopping. Summarise in 10 lines max, list changed files, and give me the exact commands to run.
3. No secrets in code. Read from `.env`; keep `.env.example` with all variable names and no values.
4. Type hints everywhere. Pure functions for engine logic (no DB or network inside `engine/`), so they are testable.
5. Every external API call: timeout (15 s), retries with backoff, raw response saved to `data/cache/{source}/{UTC-timestamp}.json`, and an `be_ingest_runs` row (source, started, finished, status, rows, error).
6. **DEMO_MODE=true** must run the whole pipeline from cached files with a fixed timestamp and no internet. Build this from the start.
7. All times stored as UTC; convert to IST (Asia/Kolkata) only for display or rush-hour logic.
8. Never claim chemical certainty. Source shares are "likely contributing sources". Always store `model_version` and the evidence JSON.
9. Every write that a user triggers writes an `audit_log` row.
10. Log with the standard `logging` module in JSON-friendly format, no print statements.

## Data sources (verify endpoints and terms before use)
- Stations and readings: OpenAQ v3 (API key header `X-API-Key`), CPCB feed via data.gov.in as fallback.
- Fires: NASA FIRMS VIIRS 375 m (MAP_KEY). Keep confidence nominal/high only. Bounding box: MP plus neighbouring Maharashtra, Gujarat, Rajasthan, UP, Chhattisgarh upwind areas.
- Weather: Open-Meteo forecast API (no key): wind speed/direction at 10 m, boundary layer height, precipitation, temperature, relative humidity; sample on a grid of about 25 km over each city's surroundings.
- Modeled air quality (gap-fill): Open-Meteo Air Quality (CAMS).
- Static layers: OSM via Overpass (major roads, industrial/construction landuse, schools, hospitals) stored as GeoJSON in `data/static/{city}/`. Never query Overpass during demos.
- Ward polygons: `data/static/{city}/wards.geojson` supplied by me; if missing, generate a 1 km grid with the `h3` library.
- Population: WorldPop raster aggregated per ward (script, run once).

## Engine specification (implement exactly, make constants configurable in `config/model.yaml`)
**Wind convention:** wind direction = direction the wind comes FROM. A fire matters if the bearing from ward centroid to the fire is within 30 degrees of that direction.
**Fire score:** for each fire within 400 km and plume travel time (distance / wind speed) under 36 h: `w = FRP * exp(-d/150) * min(wind_kmh/10, 1.5)`; sum, then `score = 1 - exp(-sum/K)` with K from config. Multiply by 1.2 if PM2.5/PM10 > 0.6 and CO is elevated. Phase 3b upgrade: hourly back-trajectory using past wind and count fires within 15 km of the path.
**Traffic:** mean of logistic(NO2), logistic(CO), rush-hour factor (1.0 for 08-11 and 17-21 IST, else 0.4), road-density factor within 1 km; times 1.3 if ventilation is low.
**Dust:** logistic(PM10) x coarse factor (high when PM2.5/PM10 < 0.4) x dryness (no rain in 48 h, low humidity) x daytime factor; small boost near construction polygons.
**Industry:** logistic(SO2) x upwind industrial proximity within 5 km x steadiness (low hourly variance). In Singrauli also use configured power-plant and mine points.
**Other:** floor 0.10 to 0.15.
**Shares:** normalise raw scores to percentages.
**Confidence (0-100):** start 100; minus up to 25 for nearest station over 10 km or missing data; minus up to 20 if top two sources within 10 points; minus 15 if weather older than 3 h; minus 15 if signals conflict; bonus for a clear dominant source with multiple supporting signals. Bands: High over 70, Medium 40 to 70, Low under 40. Store a list of reason strings.
**Interpolation:** inverse-distance weighting (power 2) from nearest 3 to 5 stations per ward, blended `0.7*IDW + 0.3*CAMS`. If no station within 25 km use CAMS only and force Low confidence.
**Ventilation:** BLH (m) x wind (m/s). Trap flag when below configured threshold for 6 or more consecutive hours and PM2.5 is rising.
**Vulnerability:** `0.35*norm(pop_density) + 0.25*norm(schools) + 0.25*norm(hospitals) + 0.15*norm(deprivation proxy)`; drop the last term if no official data. `risk = norm(pm25_est) * vulnerability`.
**Actions (deterministic rules, not LLM):** dominant fire and confidence 50+ -> alert upwind district authorities and advise citizens; dust -> sprinkling and cover-norm enforcement; traffic with trap flag -> heavy-vehicle diversion and transport boost; industry -> inspection of units within 5 km upwind; high risk -> prioritise schools and hospitals. Each action stores the evidence string, department, text in English and Hindi.

## API (FastAPI, `/api/v1`, OpenAPI docs at `/docs`)
Public: `GET /health`, `GET /public/wards/{id}/advice?lang=hi|en`, `POST /public/reports`, `POST /public/subscribe`.
Authenticated (Clerk JWT): `GET /cells`, `GET /cell/{id}`, `GET /timeline/{id}`, `GET /fires`, `GET /wind`, `GET /priority`, `POST /explain`, `GET /report/pdf/{ward_id}`, `PATCH /actions/{id}`, `GET /alerts`, `POST /admin/ingest/run`, `POST /admin/recompute`.
Role rules from Clerk JWT claims (`role`, `cityId` taken from public metadata, mapped into the session token template): viewer read; officer plus actions; moderator plus reports; city_admin plus own-city admin; state_admin all.

## Environment variables (.env.example)
`DATABASE_URL`, `DEMO_MODE`, `OPENAQ_API_KEY`, `FIRMS_MAP_KEY`, `DATA_GOV_IN_KEY`, `ANTHROPIC_API_KEY` (optional), `TELEGRAM_BOT_TOKEN` (optional), `CLERK_JWKS_URL`, `CLERK_ISSUER`, `CLERK_AUTHORIZED_PARTIES`, `CORS_ORIGINS=http://localhost:3000`, `TIMEZONE=Asia/Kolkata`

## Folder layout
```
airtrace-backend/
  CLAUDE.md  README.md  docker-compose.yml  pyproject.toml  .env.example
  config/model.yaml  config/cities.yaml
  data/cache/  data/static/{bhopal,indore,singrauli}/
  scripts/ (fetch_osm.py, build_grid.py, aggregate_population.py, backfill.py, replay.py)
  src/airtrace/
    config.py  db.py  models.py  logging.py
    ingest/ (openaq.py, cpcb.py, firms.py, weather.py, cams.py, runner.py)
    engine/ (geo.py, sources.py, confidence.py, ventilation.py, interpolate.py,
             vulnerability.py, actions.py, pipeline.py)
    api/ (main.py, deps.py, auth.py, routes/*.py, schemas.py)
    alerts/ (rules.py, telegram.py, templates.py)
    reports/pdf.py
    llm/explain.py
    scheduler.py
  tests/
```
