"""Pydantic v2 request and response schemas for FastAPI."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

# --- Response Models ---


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = Field(..., description="Service status")
    timestamp: datetime = Field(..., description="Current server time")
    version: str = Field(..., description="API version")


class WardAdviceResponse(BaseModel):
    """Public ward advice response."""

    ward_id: str
    ward_name: str
    ward_name_hi: str | None = None
    timestamp: datetime
    aqi_est: int | None
    aqi_category: str
    dominant_source: str
    advice_en: str
    advice_hi: str
    confidence_band: str


class WardStateResponse(BaseModel):
    """Ward state summary for authenticated users."""

    id: str
    ward_id: str
    timestamp: datetime
    pm25_est: float | None
    pm10_est: float | None
    aqi_est: int | None
    aqi_category: str
    dominant_source: str
    source_shares: dict[str, float]
    confidence_score: int
    confidence_band: str
    ventilation_index: float | None
    trap_flag: bool
    risk_score: float
    model_version: str


class WardStateDetailResponse(WardStateResponse):
    """Detailed ward state with evidence and reasoning."""

    confidence_reasons: list[str]
    vulnerability_score: float
    evidence: dict


class ActionResponse(BaseModel):
    """Municipal action recommendation."""

    id: str
    ward_id: str
    timestamp: datetime
    source_type: str
    department: str
    text_en: str
    text_hi: str
    status: str
    priority: str | None = None


class FireResponse(BaseModel):
    """Fire detection point."""

    id: str
    lat: float
    lon: float
    frp: float | None
    confidence: str
    acq_date: datetime
    satellite: str | None


class AlertResponse(BaseModel):
    """Active alert."""

    id: str
    ward_id: str
    timestamp: datetime
    alert_type: str
    severity: str
    text_en: str
    text_hi: str
    is_active: bool


class ExplainResponse(BaseModel):
    """LLM explanation response."""

    ward_id: str
    explanation: str
    lang: str


class WindResponse(BaseModel):
    """Wind and atmospheric dispersion data."""

    city_id: str
    timestamp: datetime
    speed_kmh: float
    direction_deg: float
    boundary_layer_height_m: float | None = None
    ventilation_index: float | None = None


# --- Request Models ---


class SubscribeRequest(BaseModel):
    """Public subscription request."""

    ward_id: str = Field(..., description="Ward to subscribe to")
    phone_number: str | None = Field(None, description="Phone number for SMS (hashed)")
    telegram_username: str | None = Field(None, description="Telegram username")
    channel: str = Field(..., description="Notification channel: telegram or sms")


class ReportRequest(BaseModel):
    """Public pollution report submission."""

    ward_id: str | None = None
    report_type: str = Field(..., description="Type: smoke, dust, odor, other")
    description: str = Field(..., min_length=10, max_length=500)
    location_lat: float | None = None
    location_lon: float | None = None


class ActionUpdateRequest(BaseModel):
    """Update action status (officer+)."""

    status: str = Field(..., description="pending, acknowledged, completed")
    assigned_to: str | None = None


class ExplainRequest(BaseModel):
    """Request LLM explanation of a ward's state."""

    ward_id: str
    question: str = Field(..., min_length=5, max_length=200, description="Natural language question")
    lang: str = Field("en", description="Response language: en or hi")


class AdminIngestRequest(BaseModel):
    """Trigger manual ingestion run."""

    city_id: str | None = Field(None, description="Specific city or all if None")
    sources: list[str] | None = Field(None, description="Specific sources or all if None")


class AdminRecomputeRequest(BaseModel):
    """Trigger pipeline recompute for a time range."""

    city_id: str
    start_timestamp: datetime
    end_timestamp: datetime | None = None
