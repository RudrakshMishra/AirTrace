"""Alert routes for municipal officials and officers."""

from __future__ import annotations

from fastapi import APIRouter

from airtrace.api.deps import CurrentUser, DBSession
from airtrace.api.schemas import AlertResponse
from airtrace.logging import get_logger
from airtrace.models import Alert

logger = get_logger(__name__)

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/", response_model=list[AlertResponse])
@router.get("", response_model=list[AlertResponse])
async def list_alerts(
    db: DBSession,
    current_user: CurrentUser,
    city_id: str | None = None,
    ward_id: str | None = None,
    is_active: bool | None = None,
    limit: int = 100,
) -> list[AlertResponse]:
    """List alerts with optional filtering."""
    query = db.query(Alert).order_by(Alert.timestamp.desc())

    if ward_id:
        query = query.filter(Alert.ward_id == ward_id)
    elif city_id:
        query = query.filter(Alert.ward_id.like(f"{city_id}_%"))

    user_city_id = current_user.get("city_id")
    if current_user.get("role") != "state_admin" and user_city_id:
        query = query.filter(Alert.ward_id.like(f"{user_city_id}_%"))

    if is_active is not None:
        query = query.filter(Alert.is_active.is_(is_active))

    results = query.limit(limit).all()

    return [
        AlertResponse(
            id=alert.id,
            ward_id=alert.ward_id,
            timestamp=alert.timestamp,
            alert_type=alert.alert_type,
            severity=alert.severity,
            text_en=alert.text_en,
            text_hi=alert.text_hi,
            is_active=alert.is_active,
        )
        for alert in results
    ]
