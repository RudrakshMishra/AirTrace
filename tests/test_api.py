"""Integration tests for FastAPI routes."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from airtrace.api.main import create_app
from airtrace.models import Action, Alert, Base, City, Ward, WardState


# Module-scoped test engine and data
@pytest.fixture(scope="module")
def test_engine():
    """Create in-memory test database engine (shared across module)."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)

    # Seed test data once
    TestSessionLocal = sessionmaker(bind=engine)
    session = TestSessionLocal()

    city = City(
        id="bhopal",
        name="Bhopal",
        name_hi="भोपाल",
        state="MP",
        lat=23.2599,
        lon=77.4126,
        bbox={},
    )
    session.add(city)

    ward = Ward(
        id="ward_001",
        city_id="bhopal",
        name="Test Ward",
        name_hi="परीक्षण वार्ड",
        geometry={"type": "Point", "coordinates": [77.41, 23.26]},
    )
    session.add(ward)

    ward_state = WardState(
        id=str(uuid.uuid4()),
        ward_id="ward_001",
        timestamp=datetime.now(UTC),
        aqi_est=85,
        pm25_est=45.0,
        pm10_est=90.0,
        aqi_category="Moderate",
        dominant_source="traffic",
        source_shares={
            "traffic": 0.35,
            "fire": 0.10,
            "dust": 0.15,
            "industry": 0.08,
            "other": 0.32,
        },
        confidence_score=68,
        confidence_band="Medium",
        confidence_reasons=["Nearest station 4 km", "Top two sources within 10 pts"],
        ventilation_index=1200.0,
        trap_flag=False,
        risk_score=51.0,
        vulnerability_score=0.6,
        evidence={"signals": ["NO2 elevated", "CO elevated", "rush hour"]},
        model_version="v0.1.0",
    )
    session.add(ward_state)

    action = Action(
        id="act_001",
        ward_id="ward_001",
        timestamp=datetime.now(UTC),
        source_type="traffic",
        department="Traffic Police",
        text_en="Deploy traffic marshals.",
        text_hi="यातायात मार्शल तैनात करें।",
        status="pending",
        evidence="High traffic congestion during rush hours.",
    )
    session.add(action)

    alert = Alert(
        id="alt_001",
        ward_id="ward_001",
        timestamp=datetime.now(UTC),
        alert_type="severe_aqi",
        severity="high",
        text_en="High AQI detected.",
        text_hi="उच्च वायु गुणवत्ता सूचकांक।",
        is_active=True,
    )
    session.add(alert)

    session.commit()
    session.close()

    yield engine

    engine.dispose()


@pytest.fixture(scope="module")
def client(test_engine):
    """Create FastAPI test client with test database."""
    from airtrace.api import deps

    app = create_app()

    # Override dependency to use test engine
    def override_get_db():
        TestSessionLocal = sessionmaker(bind=test_engine)
        db: Session = TestSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[deps.get_db] = override_get_db

    with TestClient(app) as c:
        yield c


@pytest.fixture
def mock_clerk_token():
    """Mock Clerk JWT token verification."""
    with patch("airtrace.api.deps.verify_clerk_token") as mock_verify:
        mock_verify.return_value = {
            "sub": "user_123",
            "email": "test@example.com",
            "public_metadata": {
                "role": "state_admin",
                "cityId": "bhopal",
            },
        }
        yield mock_verify


# ============================================================================
# Public Routes Tests
# ============================================================================


def test_health_check(client):
    """Test /api/v1/public/health endpoint."""
    response = client.get("/api/v1/public/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == "0.1.0"
    assert "timestamp" in data


def test_get_ward_advice_english(client):
    """Test /api/v1/public/wards/{ward_id}/advice endpoint (English)."""
    response = client.get("/api/v1/public/wards/ward_001/advice?lang=en")

    assert response.status_code == 200
    data = response.json()
    assert data["ward_id"] == "ward_001"
    assert data["ward_name"] == "Test Ward"
    assert data["aqi_est"] == 85
    assert data["aqi_category"] == "Moderate"
    assert data["dominant_source"] == "traffic"
    assert "sensitive groups" in data["advice_en"].lower()
    assert data["confidence_band"] == "Medium"


def test_get_ward_advice_hindi(client):
    """Test /api/v1/public/wards/{ward_id}/advice endpoint (Hindi)."""
    response = client.get("/api/v1/public/wards/ward_001/advice?lang=hi")

    assert response.status_code == 200
    data = response.json()
    assert data["ward_name"] == "परीक्षण वार्ड"
    assert "संवेदनशील" in data["advice_hi"]


def test_get_ward_advice_not_found(client):
    """Test advice endpoint with non-existent ward."""
    response = client.get("/api/v1/public/wards/nonexistent/advice")

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_subscribe_to_alerts(client):
    """Test /api/v1/public/subscribe endpoint."""
    payload = {
        "ward_id": "ward_001",
        "channel": "telegram",
        "telegram_username": "@testuser",
    }

    response = client.post("/api/v1/public/subscribe", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["message"] == "Subscription successful"
    assert data["ward_id"] == "ward_001"
    assert "subscriber_id" in data


def test_subscribe_invalid_ward(client):
    """Test subscription with invalid ward."""
    payload = {
        "ward_id": "invalid_ward",
        "channel": "sms",
        "phone_number": "+919876543210",
    }

    response = client.post("/api/v1/public/subscribe", json=payload)

    assert response.status_code == 404


def test_submit_pollution_report(client):
    """Test /api/v1/public/reports endpoint."""
    payload = {
        "ward_id": "ward_001",
        "report_type": "smoke",
        "description": "Heavy smoke near industrial area",
        "location_lat": 23.26,
        "location_lon": 77.41,
    }

    response = client.post("/api/v1/public/reports", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["message"] == "Report submitted successfully"
    assert "report_id" in data


# ============================================================================
# Authenticated Routes Tests (Wards)
# ============================================================================


def test_get_wards_unauthorized(client):
    """Test /api/v1/wards/ without authentication."""
    response = client.get("/api/v1/wards/?city_id=bhopal")

    assert response.status_code == 401


def test_get_wards_authorized(client, mock_clerk_token):
    """Test /api/v1/wards/ with valid authentication."""
    headers = {"Authorization": "Bearer valid_token"}
    response = client.get("/api/v1/wards/?city_id=bhopal", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_get_ward_detail_authorized(client, mock_clerk_token):
    """Test /api/v1/wards/{ward_id} with authentication."""
    headers = {"Authorization": "Bearer valid_token"}
    response = client.get("/api/v1/wards/ward_001", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["ward_id"] == "ward_001"
    assert data["aqi_est"] == 85
    assert data["pm25_est"] == 45.0
    assert data["dominant_source"] == "traffic"


def test_get_ward_actions_authorized(client, mock_clerk_token):
    """Test /api/v1/wards/{ward_id}/actions with authentication."""
    headers = {"Authorization": "Bearer valid_token"}
    response = client.get("/api/v1/wards/ward_001/actions", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_get_recent_fires_authorized(client, mock_clerk_token):
    """Test /api/v1/wards/fires/recent with authentication."""
    headers = {"Authorization": "Bearer valid_token"}
    response = client.get("/api/v1/wards/fires/recent?city_id=bhopal", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


# ============================================================================
# Actions, Alerts, PDF Report & Explain Tests
# ============================================================================


def test_list_actions_authorized(client, mock_clerk_token):
    """Test GET /api/v1/actions/ with authentication."""
    headers = {"Authorization": "Bearer valid_token"}
    response = client.get("/api/v1/actions/", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["id"] == "act_001"


def test_update_action_status_authorized(client, mock_clerk_token):
    """Test PATCH /api/v1/actions/{action_id} with officer role."""
    headers = {"Authorization": "Bearer valid_token"}
    payload = {"status": "in_progress", "assigned_to": "officer_1"}

    response = client.patch(
        "/api/v1/actions/act_001",
        json=payload,
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "act_001"
    assert data["status"] == "in_progress"


def test_list_alerts_authorized(client, mock_clerk_token):
    """Test GET /api/v1/alerts/ with authentication."""
    headers = {"Authorization": "Bearer valid_token"}
    response = client.get("/api/v1/alerts/", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["id"] == "alt_001"


def test_get_ward_summary_pdf_report(client, mock_clerk_token):
    """Test GET /api/v1/report/pdf/{ward_id}."""
    headers = {"Authorization": "Bearer valid_token"}
    response = client.get("/api/v1/report/pdf/ward_001", headers=headers)

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 500
    assert response.content.startswith(b"%PDF-")


def test_explain_ward_state(client, mock_clerk_token):
    """Test POST /api/v1/explain endpoint."""
    headers = {"Authorization": "Bearer valid_token"}
    payload = {
        "ward_id": "ward_001",
        "question": "Why is the AQI moderate?",
        "lang": "en",
    }

    response = client.post("/api/v1/explain", json=payload, headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["ward_id"] == "ward_001"
    assert "explanation" in data
    assert len(data["explanation"]) > 0


# ============================================================================
# Admin Routes Tests
# ============================================================================


def test_trigger_ingestion_unauthorized(client):
    """Test /api/v1/admin/ingest/run without authentication."""
    payload = {"city_id": "bhopal"}
    response = client.post("/api/v1/admin/ingest/run", json=payload)

    assert response.status_code == 401


def test_trigger_ingestion_authorized(client, mock_clerk_token):
    """Test /api/v1/admin/ingest/run with state_admin role."""
    headers = {"Authorization": "Bearer valid_token"}
    payload = {"city_id": "bhopal"}

    with patch("airtrace.api.routes.admin.run_ingestion_for_city") as mock_ingest:
        mock_ingest.return_value = {
            "stations": 5,
            "readings": 120,
            "fires": 3,
            "weather": 1,
        }

        response = client.post(
            "/api/v1/admin/ingest/run",
            json=payload,
            headers=headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["city_id"] == "bhopal"
        assert "counts" in data


def test_trigger_pipeline_authorized(client, mock_clerk_token):
    """Test /api/v1/admin/pipeline/run with state_admin role."""
    headers = {"Authorization": "Bearer valid_token"}

    with patch("airtrace.api.routes.admin.run_pipeline_for_city") as mock_pipeline:
        mock_pipeline.return_value = {
            "wards_processed": 10,
            "actions_generated": 45,
        }

        response = client.post(
            "/api/v1/admin/pipeline/run?city_id=bhopal",
            headers=headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"


def test_recompute_historical_authorized(client, mock_clerk_token):
    """Test /api/v1/admin/recompute endpoint."""
    headers = {"Authorization": "Bearer valid_token"}
    payload = {
        "city_id": "bhopal",
        "start_timestamp": datetime.now(UTC).isoformat(),
    }

    response = client.post(
        "/api/v1/admin/recompute",
        json=payload,
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert "status" in data


# ============================================================================
# Authorization Tests
# ============================================================================


def test_insufficient_role_permissions(client):
    """Test endpoint access with insufficient role."""
    with patch("airtrace.api.deps.verify_clerk_token") as mock_verify:
        mock_verify.return_value = {
            "sub": "user_456",
            "email": "viewer@example.com",
            "public_metadata": {
                "role": "viewer",
                "cityId": "bhopal",
            },
        }

        headers = {"Authorization": "Bearer viewer_token"}
        payload = {"city_id": "bhopal"}

        response = client.post(
            "/api/v1/admin/ingest/run",
            json=payload,
            headers=headers,
        )

        assert response.status_code == 403
        assert "Insufficient permissions" in response.json()["detail"]


def test_invalid_bearer_token_format(client):
    """Test invalid Authorization header format."""
    headers = {"Authorization": "InvalidFormat token123"}
    response = client.get("/api/v1/wards/?city_id=bhopal", headers=headers)

    assert response.status_code == 401
    assert "Invalid Authorization header" in response.json()["detail"]


def test_expired_token(client):
    """Test with expired JWT token."""
    with patch("airtrace.api.deps.verify_clerk_token") as mock_verify:
        mock_verify.return_value = None

        headers = {"Authorization": "Bearer expired_token"}
        response = client.get("/api/v1/wards/?city_id=bhopal", headers=headers)

        assert response.status_code == 401
        assert "Invalid or expired token" in response.json()["detail"]
