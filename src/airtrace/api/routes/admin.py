"""Admin routes for triggering ingestion and pipeline operations."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, HTTPException, status

from airtrace.api.deps import DBSession, RequireStateAdmin
from airtrace.api.schemas import AdminIngestRequest, AdminRecomputeRequest
from airtrace.config import load_cities_config
from airtrace.engine.pipeline import run_pipeline_for_city
from airtrace.ingest.runner import run_ingestion_all_cities, run_ingestion_for_city
from airtrace.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/ingest/run")
async def trigger_ingestion(
    request: AdminIngestRequest,
    db: DBSession,
    current_user: RequireStateAdmin,
) -> dict[str, Any]:
    """Manually trigger data ingestion run.

    Args:
        request: Ingestion parameters
        db: Database session
        current_user: Authenticated state admin

    Returns:
        Ingestion results summary
    """
    logger.info(
        "Manual ingestion triggered",
        extra={
            "user_id": current_user.get("user_id"),
            "city_id": request.city_id,
            "sources": request.sources,
        },
    )

    if request.city_id:
        # Single city ingestion
        counts = run_ingestion_for_city(db, request.city_id)
        return {
            "status": "completed",
            "city_id": request.city_id,
            "counts": counts,
        }
    else:
        # All cities ingestion
        results = run_ingestion_all_cities(db)
        return {
            "status": "completed",
            "cities": results,
        }


@router.post("/pipeline/run")
async def trigger_pipeline(
    city_id: str,
    db: DBSession,
    current_user: RequireStateAdmin,
) -> dict[str, Any]:
    """Manually trigger pipeline run for a city.

    Args:
        city_id: City identifier
        db: Database session
        current_user: Authenticated state admin

    Returns:
        Pipeline results summary
    """
    cities = load_cities_config()
    if city_id not in cities:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown city: {city_id}",
        )

    logger.info(
        "Manual pipeline triggered",
        extra={
            "user_id": current_user.get("user_id"),
            "city_id": city_id,
        },
    )

    result = run_pipeline_for_city(db, city_id, datetime.now(UTC))

    return {
        "status": "completed",
        "result": result,
    }


@router.post("/recompute")
async def recompute_historical(
    request: AdminRecomputeRequest,
    db: DBSession,
    current_user: RequireStateAdmin,
) -> dict[str, Any]:
    """Recompute pipeline for historical time range.

    Args:
        request: Recompute parameters
        db: Database session
        current_user: Authenticated state admin

    Returns:
        Recompute summary
    """
    logger.info(
        "Historical recompute triggered",
        extra={
            "user_id": current_user.get("user_id"),
            "city_id": request.city_id,
            "start": request.start_timestamp.isoformat(),
        },
    )

    # This is a placeholder - full implementation would iterate over timestamps
    # and re-run pipeline with historical data
    return {
        "status": "not_implemented",
        "message": "Historical recompute coming in Phase 8",
    }
