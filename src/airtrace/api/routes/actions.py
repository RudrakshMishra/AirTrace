"""Municipal action management routes."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, status

from airtrace.api.deps import CurrentUser, DBSession, RequireOfficer
from airtrace.api.schemas import ActionResponse, ActionUpdateRequest
from airtrace.logging import get_logger
from airtrace.models import Action, AuditLog

logger = get_logger(__name__)

router = APIRouter(prefix="/actions", tags=["actions"])


@router.get("/", response_model=list[ActionResponse])
async def list_actions(
    db: DBSession,
    current_user: CurrentUser,
    city_id: str | None = None,
    ward_id: str | None = None,
    status_filter: str | None = None,
    limit: int = 100,
) -> list[ActionResponse]:
    """List actions with optional filtering."""
    query = db.query(Action).order_by(Action.timestamp.desc())

    if ward_id:
        query = query.filter(Action.ward_id == ward_id)
    elif city_id:
        query = query.filter(Action.ward_id.like(f"{city_id}_%"))

    user_city_id = current_user.get("city_id")
    if current_user.get("role") != "state_admin" and user_city_id:
        query = query.filter(Action.ward_id.like(f"{user_city_id}_%"))

    if status_filter:
        query = query.filter(Action.status == status_filter)

    results = query.limit(limit).all()

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


@router.patch("/{action_id}", response_model=ActionResponse)
async def update_action_status(
    action_id: str,
    request: ActionUpdateRequest,
    db: DBSession,
    current_user: RequireOfficer,
) -> ActionResponse:
    """Update action status and assignment (officer+ role required)."""
    action = db.query(Action).filter(Action.id == action_id).first()
    if not action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Action not found: {action_id}",
        )

    # City check for non-state_admin
    user_city_id = current_user.get("city_id")
    ward_city = action.ward_id.split("_")[0]
    if current_user.get("role") != "state_admin" and user_city_id and user_city_id != ward_city:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Action belongs to city: {ward_city}",
        )

    old_status = action.status
    action.status = request.status
    if request.assigned_to is not None:
        action.assigned_to = request.assigned_to

    # Write audit log entry
    audit_entry = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.get("user_id"),
        action="update_action",
        resource_type="action",
        resource_id=action_id,
        details={
            "old_status": old_status,
            "new_status": request.status,
            "assigned_to": request.assigned_to,
        },
        created_at=datetime.now(UTC),
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(action)

    logger.info(
        "Action updated",
        extra={
            "action_id": action_id,
            "user_id": current_user.get("user_id"),
            "new_status": request.status,
        },
    )

    return ActionResponse(
        id=action.id,
        ward_id=action.ward_id,
        timestamp=action.timestamp,
        source_type=action.source_type,
        department=action.department,
        text_en=action.text_en,
        text_hi=action.text_hi,
        status=action.status,
    )
