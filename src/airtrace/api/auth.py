"""Clerk JWT authentication and authorization for FastAPI.

Verifies Clerk-issued JWTs, extracts user identity and role claims.
"""

from __future__ import annotations

import time
from typing import Any

import httpx
from jose import jwt
from jose.exceptions import JWTError

from airtrace.config import get_settings
from airtrace.logging import get_logger

logger = get_logger(__name__)

# Cache JWKS for 1 hour
_jwks_cache: dict[str, Any] = {}
_jwks_cache_time: float = 0.0
JWKS_CACHE_TTL = 3600.0


def fetch_jwks() -> dict[str, Any]:
    """Fetch Clerk JWKS (JSON Web Key Set) with 1-hour cache.

    Returns:
        JWKS dict with keys array
    """
    global _jwks_cache, _jwks_cache_time

    now = time.time()
    if _jwks_cache and (now - _jwks_cache_time) < JWKS_CACHE_TTL:
        return _jwks_cache

    settings = get_settings()
    if not settings.clerk_jwks_url:
        logger.warning("CLERK_JWKS_URL not configured")
        return {"keys": []}

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(settings.clerk_jwks_url)
            response.raise_for_status()
            jwks = response.json()

        _jwks_cache = jwks
        _jwks_cache_time = now
        logger.info("JWKS fetched and cached", extra={"key_count": len(jwks.get("keys", []))})
        return jwks

    except Exception as e:
        logger.error("JWKS fetch failed", extra={"error": str(e)})
        return {"keys": []}


def verify_clerk_token(token: str) -> dict[str, Any] | None:
    """Verify Clerk JWT and return decoded claims.

    Args:
        token: JWT string from Authorization header

    Returns:
        Decoded claims dict or None if invalid
    """
    settings = get_settings()

    if not settings.clerk_issuer:
        logger.warning("CLERK_ISSUER not configured, skipping verification")
        return None

    try:
        jwks = fetch_jwks()
        if not jwks.get("keys"):
            logger.error("No JWKS keys available")
            return None

        # Decode and verify JWT
        # python-jose automatically selects the right key from JWKS based on kid header
        claims = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            issuer=settings.clerk_issuer,
            options={
                "verify_signature": True,
                "verify_aud": False,  # Clerk tokens don't always have aud
                "verify_iat": True,
                "verify_exp": True,
                "verify_nbf": True,
                "verify_iss": True,
            },
        )

        # Optional: verify authorized party if configured
        if settings.clerk_authorized_parties:
            azp = claims.get("azp")
            allowed_parties = [p.strip() for p in settings.clerk_authorized_parties.split(",")]
            if azp not in allowed_parties:
                logger.warning("Token azp not in authorized parties", extra={"azp": azp})
                return None

        logger.debug("Token verified", extra={"sub": claims.get("sub")})
        return claims

    except JWTError as e:
        logger.warning("JWT verification failed", extra={"error": str(e)})
        return None
    except Exception as e:
        logger.error("Token verification error", extra={"error": str(e)})
        return None


def extract_user_info(claims: dict[str, Any]) -> dict[str, Any]:
    """Extract user identity and role from Clerk JWT claims.

    Clerk stores custom metadata in the token's public_metadata field.
    We expect: { "role": "viewer|officer|moderator|city_admin|state_admin", "cityId": "bhopal" }

    Args:
        claims: Decoded JWT claims

    Returns:
        Dict with user_id, email, name, role, city_id
    """
    # Standard Clerk claims
    user_id = claims.get("sub")  # Clerk user ID
    email = claims.get("email")
    name = claims.get("name") or claims.get("given_name", "")

    # Custom metadata from session token template
    metadata = claims.get("public_metadata", {})
    role = metadata.get("role", "viewer")
    city_id = metadata.get("cityId")

    return {
        "user_id": user_id,
        "email": email,
        "name": name,
        "role": role,
        "city_id": city_id,
    }


def check_role_permission(user_role: str, required_role: str) -> bool:
    """Check if user's role meets the required role level.

    Hierarchy:
    - viewer: read-only
    - officer: viewer + action updates
    - moderator: officer + report management
    - city_admin: moderator + own-city admin endpoints
    - state_admin: full access

    Args:
        user_role: User's role from JWT
        required_role: Minimum required role

    Returns:
        True if user has sufficient permissions
    """
    role_levels = {
        "viewer": 1,
        "officer": 2,
        "moderator": 3,
        "city_admin": 4,
        "state_admin": 5,
    }

    user_level = role_levels.get(user_role, 0)
    required_level = role_levels.get(required_role, 0)

    return user_level >= required_level
