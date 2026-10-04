"""LLM natural language explanation route."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from airtrace.api.deps import CurrentUser, DBSession
from airtrace.api.schemas import ExplainRequest, ExplainResponse
from airtrace.llm.explain import generate_ward_explanation
from airtrace.logging import get_logger
from airtrace.models import Ward, WardState

logger = get_logger(__name__)

router = APIRouter(tags=["explain"])


@router.post("/explain", response_model=ExplainResponse)
async def explain_ward_state(
    request: ExplainRequest,
    db: DBSession,
    current_user: CurrentUser,
) -> ExplainResponse:
    """Generate natural language explanation of ward air quality state and source attribution."""
    # Check city access
    user_city_id = current_user.get("city_id")
    ward_city = request.ward_id.split("_")[0]
    if current_user.get("role") != "state_admin" and user_city_id and user_city_id != ward_city:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. You can only access data for city: {user_city_id}",
        )

    # Fetch ward
    ward = db.query(Ward).filter(Ward.id == request.ward_id).first()
    if not ward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ward not found: {request.ward_id}",
        )

    # Fetch latest ward state
    latest_state = (
        db.query(WardState)
        .filter(WardState.ward_id == request.ward_id)
        .order_by(WardState.timestamp.desc())
        .first()
    )

    if not latest_state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No air quality data available for ward: {request.ward_id}",
        )

    ward_state_dict = {
        "aqi_est": latest_state.aqi_est,
        "aqi_category": latest_state.aqi_category,
        "dominant_source": latest_state.dominant_source,
        "source_shares": latest_state.source_shares or {},
        "confidence_score": latest_state.confidence_score,
        "confidence_reasons": latest_state.confidence_reasons or [],
        "trap_flag": latest_state.trap_flag,
        "ventilation_index": latest_state.ventilation_index,
        "evidence": latest_state.evidence or {},
    }

    explanation_text = generate_ward_explanation(
        ward_name=ward.name,
        ward_state=ward_state_dict,
        question=request.question,
        lang=request.lang,
    )

    return ExplainResponse(
        ward_id=request.ward_id,
        explanation=explanation_text,
        lang=request.lang,
    )
