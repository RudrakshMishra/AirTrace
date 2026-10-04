"""FastAPI application with all routes and middleware."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from airtrace.api.routes import actions, admin, alerts, explain, public, reports, wards
from airtrace.config import get_settings


def create_app() -> FastAPI:
    """Build and return the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="AirTrace MP",
        description="Air quality source apportionment API for Madhya Pradesh",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_tags=[
            {"name": "public", "description": "Public endpoints (no authentication)"},
            {"name": "wards", "description": "Ward and cell data (authenticated)"},
            {"name": "actions", "description": "Municipal action management (officer+)"},
            {"name": "alerts", "description": "Alert notifications (authenticated)"},
            {"name": "reports", "description": "PDF summary reports (authenticated)"},
            {"name": "explain", "description": "LLM natural language explanation (authenticated)"},
            {"name": "admin", "description": "Admin operations (state_admin role)"},
        ],
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins.split(","),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(public.router, prefix="/api/v1")
    app.include_router(wards.router, prefix="/api/v1")
    app.include_router(actions.router, prefix="/api/v1")
    app.include_router(alerts.router, prefix="/api/v1")
    app.include_router(reports.router, prefix="/api/v1")
    app.include_router(explain.router, prefix="/api/v1")
    app.include_router(admin.router, prefix="/api/v1")

    return app


app = create_app()
