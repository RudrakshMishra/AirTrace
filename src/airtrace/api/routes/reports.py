"""PDF and analytical report generation routes."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, HTTPException, Response, status

from airtrace.api.deps import CurrentUser, DBSession
from airtrace.logging import get_logger
from airtrace.models import Action, City, Ward, WardState
from airtrace.reports.pdf import generate_ward_summary_pdf

logger = get_logger(__name__)

router = APIRouter(prefix="/report", tags=["reports"])


@router.get("/pdf/{ward_id}")
async def get_ward_summary_pdf_report(
    ward_id: str,
    db: DBSession,
    current_user: CurrentUser,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> Response:
    """Generate single-page PDF summary for a ward."""
    # Check city access
    user_city_id = current_user.get("city_id")
    ward_city = ward_id.split("_")[0]
    if current_user.get("role") != "state_admin" and user_city_id and user_city_id != ward_city:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. You can only access data for city: {user_city_id}",
        )

    # Fetch ward
    ward = db.query(Ward).filter(Ward.id == ward_id).first()
    if not ward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ward not found: {ward_id}",
        )

    # Fetch city
    city = db.query(City).filter(City.id == ward.city_id).first()
    city_name = city.name if city else ward.city_id.title()

    # Fetch latest ward state
    latest_state = (
        db.query(WardState)
        .filter(WardState.ward_id == ward_id)
        .order_by(WardState.timestamp.desc())
        .first()
    )

    if not latest_state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No air quality data available for ward: {ward_id}",
        )

    # Fetch recent actions
    actions = (
        db.query(Action)
        .filter(Action.ward_id == ward_id)
        .order_by(Action.timestamp.desc())
        .limit(5)
        .all()
    )

    actions_dicts = [
        {
            "department": act.department,
            "text_en": act.text_en,
            "status": act.status,
        }
        for act in actions
    ]

    ward_state_dict = {
        "aqi_est": latest_state.aqi_est,
        "aqi_category": latest_state.aqi_category,
        "dominant_source": latest_state.dominant_source,
        "source_shares": latest_state.source_shares or {},
        "confidence_score": latest_state.confidence_score,
        "evidence": latest_state.evidence or {},
    }

    report_end = end_date or datetime.now(UTC)
    report_start = start_date or (report_end - timedelta(days=7))

    pdf_bytes = generate_ward_summary_pdf(
        ward_name=ward.name,
        ward_id=ward.id,
        city_name=city_name,
        ward_state=ward_state_dict,
        actions=actions_dicts,
        start_date=report_start,
        end_date=report_end,
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="airtrace_{ward_id}_summary.pdf"',
        },
    )
