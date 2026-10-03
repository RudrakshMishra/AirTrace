"""Ingestion runner - orchestrates all data sources.

Fetches from all sources, normalizes, upserts to database, and records run metadata.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from airtrace.config import load_cities_config
from airtrace.ingest import cams, cpcb, firms, openaq, weather
from airtrace.logging import get_logger
from airtrace.models import BeIngestRun, Fire, Reading, Station

logger = get_logger(__name__)


def run_ingestion_for_city(
    session: Session,
    city_id: str,
) -> dict[str, int]:
    """Run full ingestion pipeline for a city.

    Args:
        session: Database session
        city_id: City identifier

    Returns:
        Dict with row counts per source
    """
    cities = load_cities_config()
    city = cities.get(city_id)

    if not city:
        raise ValueError(f"Unknown city: {city_id}")

    logger.info("Starting ingestion", extra={"city_id": city_id})

    counts = {}
    lon_c, lat_c = city["centre"]

    # 1. OpenAQ station readings
    try:
        run = BeIngestRun(
            source="openaq",
            city_id=city_id,
            started_at=datetime.now(UTC),
            status="running",
        )
        session.add(run)
        session.commit()

        data = openaq.fetch_latest_readings(city_id, city["bbox"])
        results = data.get("results", [])

        stations_map: dict[str, dict] = {}
        readings_map: dict[str, dict] = {}

        for item in results:
            st_id = item.get("location_id") or item.get("location") or f"{city_id}_station_1"
            st_name = item.get("location") or f"Station {st_id}"
            coords = item.get("coordinates", {})
            st_lat = coords.get("latitude") if isinstance(coords, dict) else None
            st_lon = coords.get("longitude") if isinstance(coords, dict) else None

            if st_lat is None or st_lon is None:
                st_lat, st_lon = lat_c, lon_c

            if st_id not in stations_map:
                stations_map[st_id] = {
                    "id": str(st_id),
                    "city_id": city_id,
                    "name": str(st_name),
                    "source": "openaq",
                    "lat": float(st_lat),
                    "lon": float(st_lon),
                    "is_active": True,
                }

            dt_str = item.get("datetime")
            try:
                dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00")) if dt_str else datetime.now(UTC)
            except Exception:
                dt = datetime.now(UTC)

            param = item.get("parameter", {})
            p_name = param.get("name") if isinstance(param, dict) else str(param)
            p_val = item.get("value")

            r_key = f"{st_id}_{dt.isoformat()}"
            if r_key not in readings_map:
                readings_map[r_key] = {
                    "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, r_key)),
                    "station_id": str(st_id),
                    "timestamp": dt,
                    "source": "openaq",
                }
            if p_name and p_val is not None:
                clean_pname = p_name.lower().replace(".", "").replace("-", "")
                if clean_pname in ["pm25", "pm10", "no2", "so2", "co", "o3"]:
                    readings_map[r_key][clean_pname] = float(p_val)

        for st_data in stations_map.values():
            session.merge(Station(**st_data))

        for r_data in readings_map.values():
            session.merge(Reading(**r_data))

        session.commit()

        run.finished_at = datetime.now(UTC)
        run.status = "success"
        run.rows_fetched = len(results)
        run.rows_upserted = len(readings_map)
        session.commit()

        counts["openaq"] = len(results)
        logger.info("OpenAQ complete", extra={"city_id": city_id, "rows": len(results)})

    except Exception as e:
        run.status = "error"
        run.error = str(e)
        run.finished_at = datetime.now(UTC)
        session.commit()
        logger.error("OpenAQ failed", extra={"city_id": city_id, "error": str(e)})
        counts["openaq"] = 0

    # 2. CPCB fallback (only if OpenAQ failed or returned nothing)
    if counts.get("openaq", 0) == 0:
        try:
            run = BeIngestRun(
                source="cpcb",
                city_id=city_id,
                started_at=datetime.now(UTC),
                status="running",
            )
            session.add(run)
            session.commit()

            data = cpcb.fetch_latest_readings(city_id, city["name"])
            records = data.get("records", [])

            for rec in records:
                norm = cpcb.normalize_reading(rec)
                if norm:
                    st_id = norm.get("station_id")
                    st_name = norm.get("station_name", f"CPCB Station {st_id}")
                    st_lat = norm.get("lat", lat_c)
                    st_lon = norm.get("lon", lon_c)
                    session.merge(
                        Station(
                            id=str(st_id),
                            city_id=city_id,
                            name=str(st_name),
                            source="cpcb",
                            lat=float(st_lat),
                            lon=float(st_lon),
                            is_active=True,
                        )
                    )
                    r_id = f"{st_id}_{norm['timestamp'].isoformat()}"
                    session.merge(
                        Reading(
                            id=str(uuid.uuid5(uuid.NAMESPACE_DNS, r_id)),
                            station_id=str(st_id),
                            timestamp=norm["timestamp"],
                            pm25=norm.get("pm25"),
                            pm10=norm.get("pm10"),
                            no2=norm.get("no2"),
                            so2=norm.get("so2"),
                            co=norm.get("co"),
                            o3=norm.get("o3"),
                            source="cpcb",
                        )
                    )

            session.commit()

            run.finished_at = datetime.now(UTC)
            run.status = "success"
            run.rows_fetched = len(records)
            run.rows_upserted = len(records)
            session.commit()

            counts["cpcb"] = len(records)
            logger.info("CPCB complete", extra={"city_id": city_id, "rows": len(records)})

        except Exception as e:
            run.status = "error"
            run.error = str(e)
            run.finished_at = datetime.now(UTC)
            session.commit()
            logger.error("CPCB failed", extra={"city_id": city_id, "error": str(e)})
            counts["cpcb"] = 0

    # 3. FIRMS fire detections (use fire_bbox for upwind areas)
    try:
        run = BeIngestRun(
            source="firms",
            city_id=city_id,
            started_at=datetime.now(UTC),
            status="running",
        )
        session.add(run)
        session.commit()

        fire_bbox = city.get("fire_bbox", city["bbox"])
        data = firms.fetch_recent_fires(city_id, fire_bbox, days=1)
        results = data.get("results", [])

        for f_item in results:
            try:
                f_lat = float(f_item.get("latitude", 0.0))
                f_lon = float(f_item.get("longitude", 0.0))
                f_frp = float(f_item.get("frp", 0.0)) if f_item.get("frp") else 0.0
                f_bright = float(f_item.get("brightness", 0.0)) if f_item.get("brightness") else 0.0
                f_conf = str(f_item.get("confidence", "nominal"))
                f_sat = str(f_item.get("satellite", "VIIRS"))
                acq_d = f_item.get("acq_date")
                acq_t = f_item.get("acq_time", "0000")
                if acq_d:
                    dt_str = f"{acq_d}T{acq_t[:2]}:{acq_t[2:4]}:00+00:00"
                    acq_dt = datetime.fromisoformat(dt_str)
                else:
                    acq_dt = datetime.now(UTC)

                fire_id = f"fire_{f_lat:.4f}_{f_lon:.4f}_{acq_dt.strftime('%Y%m%d%H%M')}"
                fire_row = Fire(
                    id=fire_id,
                    lat=f_lat,
                    lon=f_lon,
                    brightness=f_bright,
                    frp=f_frp,
                    confidence=f_conf,
                    acq_date=acq_dt,
                    satellite=f_sat,
                    source="firms",
                )
                session.merge(fire_row)
            except Exception as fe:
                logger.warning("Failed to parse fire record", extra={"error": str(fe)})

        session.commit()

        run.finished_at = datetime.now(UTC)
        run.status = "success"
        run.rows_fetched = len(results)
        run.rows_upserted = len(results)
        session.commit()

        counts["firms"] = len(results)
        logger.info("FIRMS complete", extra={"city_id": city_id, "rows": len(results)})

    except Exception as e:
        run.status = "error"
        run.error = str(e)
        run.finished_at = datetime.now(UTC)
        session.commit()
        logger.error("FIRMS failed", extra={"city_id": city_id, "error": str(e)})
        counts["firms"] = 0

    # 4. Weather (city center)
    try:
        run = BeIngestRun(
            source="weather",
            city_id=city_id,
            started_at=datetime.now(UTC),
            status="running",
        )
        session.add(run)
        session.commit()

        data = weather.fetch_weather(city_id, lat_c, lon_c)
        records = weather.normalize_weather(data, lat_c, lon_c)

        run.finished_at = datetime.now(UTC)
        run.status = "success"
        run.rows_fetched = len(records)
        run.rows_upserted = len(records)
        session.commit()

        counts["weather"] = len(records)
        logger.info("Weather complete", extra={"city_id": city_id, "rows": len(records)})

    except Exception as e:
        run.status = "error"
        run.error = str(e)
        run.finished_at = datetime.now(UTC)
        session.commit()
        logger.error("Weather failed", extra={"city_id": city_id, "error": str(e)})
        counts["weather"] = 0

    # 5. CAMS modeled air quality
    try:
        run = BeIngestRun(
            source="cams",
            city_id=city_id,
            started_at=datetime.now(UTC),
            status="running",
        )
        session.add(run)
        session.commit()

        data = cams.fetch_air_quality(city_id, lat_c, lon_c)
        records = cams.normalize_air_quality(data, lat_c, lon_c)

        run.finished_at = datetime.now(UTC)
        run.status = "success"
        run.rows_fetched = len(records)
        run.rows_upserted = len(records)
        session.commit()

        counts["cams"] = len(records)
        logger.info("CAMS complete", extra={"city_id": city_id, "rows": len(records)})

    except Exception as e:
        run.status = "error"
        run.error = str(e)
        run.finished_at = datetime.now(UTC)
        session.commit()
        logger.error("CAMS failed", extra={"city_id": city_id, "error": str(e)})
        counts["cams"] = 0

    logger.info("Ingestion complete", extra={"city_id": city_id, "counts": counts})

    return counts


def run_ingestion_all_cities(session: Session) -> dict[str, dict[str, int]]:
    """Run ingestion for all configured cities.

    Args:
        session: Database session

    Returns:
        Dict mapping city_id to source counts
    """
    cities = load_cities_config()
    results = {}

    for city_id in cities:
        try:
            counts = run_ingestion_for_city(session, city_id)
            results[city_id] = counts
        except Exception as e:
            logger.error(
                "City ingestion failed",
                extra={"city_id": city_id, "error": str(e)},
            )
            results[city_id] = {}

    return results
