"""FastAPI dependencies for database sessions, authentication, and authorization."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from airtrace.api.auth import check_role_permission, extract_user_info, verify_clerk_token
from airtrace.db import get_session_factory
from airtrace.logging import get_logger

logger = get_logger(__name__)


def get_db() -> Session:
    """Dependency that provides a database session.

    Yields:
        SQLAlchemy Session
    """
    session_factory = get_session_factory()
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
) -> dict[str, str]:
    """Dependency that extracts and verifies the current user from JWT.

    Args:
        authorization: Authorization header with Bearer token

    Returns:
        User info dict with user_id, email, name, role, city_id

    Raises:
        HTTPException: 401 if token is missing or invalid
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Extract Bearer token
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format. Expected: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1]

    # Verify token
    claims = verify_clerk_token(token)
    if not claims:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Extract user info
    user_info = extract_user_info(claims)
    return user_info


def require_role(required_role: str):
    """Dependency factory that checks if user has required role level.

    Args:
        required_role: Minimum role required (viewer, officer, moderator, city_admin, state_admin)

    Returns:
        Dependency function that validates role
    """

    async def _check_role(
        current_user: Annotated[dict[str, str], Depends(get_current_user)],
    ) -> dict[str, str]:
        user_role = current_user.get("role", "viewer")

        if not check_role_permission(user_role, required_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required role: {required_role}, your role: {user_role}",
            )

        return current_user

    return _check_role


def require_city_access(allow_state_admin: bool = True):
    """Dependency factory that checks if user can access a specific city's data.

    Args:
        allow_state_admin: Whether state_admin can bypass city restriction (default True)

    Returns:
        Dependency function that validates city access
    """

    async def _check_city_access(
        city_id: str,
        current_user: Annotated[dict[str, str], Depends(get_current_user)],
    ) -> dict[str, str]:
        user_role = current_user.get("role", "viewer")
        user_city_id = current_user.get("city_id")

        # State admin has access to all cities
        if allow_state_admin and user_role == "state_admin":
            return current_user

        # City admin and below must match city
        if user_city_id != city_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. You can only access data for city: {user_city_id}",
            )

        return current_user

    return _check_city_access


# Typed dependencies for common use
DBSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[dict[str, str], Depends(get_current_user)]
RequireOfficer = Annotated[dict[str, str], Depends(require_role("officer"))]
RequireModerator = Annotated[dict[str, str], Depends(require_role("moderator"))]
RequireCityAdmin = Annotated[dict[str, str], Depends(require_role("city_admin"))]
RequireStateAdmin = Annotated[dict[str, str], Depends(require_role("state_admin"))]
