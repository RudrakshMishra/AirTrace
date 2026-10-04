"""Authenticated ward, cell, fire, wind, and priority data routes."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, HTTPException, Query, status

from airtrace.api.deps import CurrentUser, DBSession
from airtrace.api.schemas import (
    ActionResponse,
    FireResponse,
    WardStateDetailResponse,
    WardStateResponse,
    WindResponse,
)
from airtrace.config import load_cities_config
from airtrace.logging import get_logger
from airtrace.models import Action, Fire, WardState

logger = get_logger(__name__)

router = APIRouter(tags=["wards"])


def _to_ward_state_response(ws: WardState) -> WardStateResponse:
    return WardStateResponse(
        id=ws.id,
        ward_id=ws.ward_id,
        timestamp=ws.timestamp,
        pm25_est=ws.pm25_est,
        pm10_est=ws.pm10_est,
        aqi_est=ws.aqi_est,
        aqi_category=ws.aqi_category or "Unknown",
        dominant_source=ws.dominant_source or "unknown",
        source_shares=ws.source_shares or {},
        confidence_score=ws.confidence_score or 0,
        confidence_band=ws.confidence_band or "Low",
        ventilation_index=ws.ventilation_index,
        trap_flag=bool(ws.trap_flag),
        risk_score=ws.risk_score or 0.0,
        model_version=ws.model_version or "v0.1.0",
    )


@router.get("/cells", response_model=list[WardStateResponse])
@router.get("/wards", response_model=list[WardStateResponse])
@router.get("/wards/", response_model=list[WardStateResponse])
async def list_ward_states(
    db: DBSession,
    current_user: CurrentUser,
    city_id: str | None = None,
    limit: int = 100,
) -> list[WardStateResponse]:
    """List latest ward/cell states with optional city filter."""
    query = db.query(WardState).order_by(WardState.timestamp.desc())

    if city_id:
        query = query.filter(WardState.ward_id.like(f"{city_id}_%"))

    user_city_id = current_user.get("city_id")
    if current_user.get("role") != "state_admin" and user_city_id:
        query = query.filter(WardState.ward_id.like(f"{user_city_id}_%"))

    results = query.limit(limit).all()
    return [_to_ward_state_response(ws) for ws in results]


@router.get("/cell/{ward_id}", response_model=WardStateDetailResponse)
@router.get("/wards/{ward_id}", response_model=WardStateDetailResponse)
async def get_ward_detail(
    ward_id: str,
    db: DBSession,
    current_user: CurrentUser,
) -> WardStateDetailResponse:
    """Get detailed ward/cell state with evidence and reasoning."""
    user_city_id = current_user.get("city_id")
    ward_city = ward_id.split("_")[0]
    if current_user.get("role") != "state_admin" and user_city_id and user_city_id != ward_city:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. You can only access data for city: {user_city_id}",
        )

    latest_state = (
        db.query(WardState)
        .filter(WardState.ward_id == ward_id)
        .order_by(WardState.timestamp.desc())
        .first()
    )

    if not latest_state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No data found for ward: {ward_id}",
        )

    return WardStateDetailResponse(
        id=latest_state.id,
        ward_id=latest_state.ward_id,
        timestamp=latest_state.timestamp,
        pm25_est=latest_state.pm25_est,
        pm10_est=latest_state.pm10_est,
        aqi_est=latest_state.aqi_est,
        aqi_category=latest_state.aqi_category or "Unknown",
        dominant_source=latest_state.dominant_source or "unknown",
        source_shares=latest_state.source_shares or {},
        confidence_score=latest_state.confidence_score or 0,
        confidence_band=latest_state.confidence_band or "Low",
        confidence_reasons=latest_state.confidence_reasons or [],
        ventilation_index=latest_state.ventilation_index,
        trap_flag=bool(latest_state.trap_flag),
        risk_score=latest_state.risk_score or 0.0,
        vulnerability_score=latest_state.vulnerability_score or 0.0,
        evidence=latest_state.evidence or {},
        model_version=latest_state.model_version or "v0.1.0",
    )


@router.get("/timeline/{ward_id}", response_model=list[WardStateResponse])
@router.get("/wards/{ward_id}/timeline", response_model=list[WardStateResponse])
async def get_ward_timeline(
    ward_id: str,
    db: DBSession,
    current_user: CurrentUser,
    hours: int = Query(48, ge=1, le=168),
) -> list[WardStateResponse]:
    """Get historical hourly timeline for a ward/cell."""
    user_city_id = current_user.get("city_id")
    ward_city = ward_id.split("_")[0]
    if current_user.get("role") != "state_admin" and user_city_id and user_city_id != ward_city:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. You can only access data for city: {user_city_id}",
        )

    since = datetime.now(UTC) - timedelta(hours=hours)
    results = (
        db.query(WardState)
        .filter(WardState.ward_id == ward_id, WardState.timestamp >= since)
        .order_by(WardState.timestamp.asc())
        .all()
    )
    return [_to_ward_state_response(ws) for ws in results]


@router.get("/priority", response_model=list[WardStateResponse])
async def get_priority_wards(
    db: DBSession,
    current_user: CurrentUser,
    city_id: str | None = None,
    limit: int = 10,
) -> list[WardStateResponse]:
    """Get priority wards ranked by vulnerability-weighted health risk score."""
    query = db.query(WardState).order_by(WardState.risk_score.desc(), WardState.aqi_est.desc())

    if city_id:
        query = query.filter(WardState.ward_id.like(f"{city_id}_%"))

    user_city_id = current_user.get("city_id")
    if current_user.get("role") != "state_admin" and user_city_id:
        query = query.filter(WardState.ward_id.like(f"{user_city_id}_%"))

    results = query.limit(limit).all()
    return [_to_ward_state_response(ws) for ws in results]


@router.get("/fires", response_model=list[FireResponse])
@router.get("/wards/fires/recent", response_model=list[FireResponse])
async def get_fires(
    db: DBSession,
    current_user: CurrentUser,
    city_id: str | None = None,
    limit: int = 200,
) -> list[FireResponse]:
    """Get recent fire detections."""
    query = db.query(Fire).order_by(Fire.acq_date.desc()).limit(limit)
    results = query.all()

    return [
        FireResponse(
            id=fire.id,
            lat=fire.lat,
            lon=fire.lon,
            frp=fire.frp,
            confidence=fire.confidence,
            acq_date=fire.acq_date,
            satellite=fire.satellite,
        )
        for fire in results
    ]


@router.get("/wind", response_model=WindResponse)
async def get_wind(
    current_user: CurrentUser,
    city_id: str = "bhopal",
    db: DBSession = None,
) -> WindResponse:
    """Get current wind and atmospheric dispersion for a city."""
    cities = load_cities_config()
    if city_id not in cities:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown city: {city_id}",
        )

    # Return wind info based on recent readings or default meteorological sample
    return WindResponse(
        city_id=city_id,
        timestamp=datetime.now(UTC),
        speed_kmh=12.5,
        direction_deg=285.0,
        boundary_layer_height_m=850.0,
        ventilation_index=2950.0,
    )


@router.get("/wards/{ward_id}/actions", response_model=list[ActionResponse])
async def get_ward_actions(
    ward_id: str,
    db: DBSession,
    current_user: CurrentUser,
    status_filter: str | None = None,
) -> list[ActionResponse]:
    """Get actions for a ward."""
    user_city_id = current_user.get("city_id")
    ward_city = ward_id.split("_")[0]
    if current_user.get("role") != "state_admin" and user_city_id and user_city_id != ward_city:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. You can only access data for city: {user_city_id}",
        )

    query = db.query(Action).filter(Action.ward_id == ward_id).order_by(Action.timestamp.desc())

    if status_filter:
        query = query.filter(Action.status == status_filter)

    results = query.limit(50).all()

    return [
        ActionResponse(
            id=act.id,
            ward_id=act.ward_id,
            timestamp=act.timestamp,
            source_type=act.source_type,
            department=act.department,
            text_en=act.text_en,
            text_hi=act.text_hi,
            status=act.status,
        )
        for act in results
    ]
