"""Public API routes (no authentication required)."""

from __future__ import annotations

import hashlib
import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, status

from airtrace.api.deps import DBSession
from airtrace.api.schemas import (
    HealthResponse,
    ReportRequest,
    SubscribeRequest,
    WardAdviceResponse,
)
from airtrace.logging import get_logger
from airtrace.models import Report, Subscriber, Ward, WardState

logger = get_logger(__name__)

router = APIRouter(tags=["public"])


@router.get("/health", response_model=HealthResponse)
@router.get("/public/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        timestamp=datetime.now(UTC),
        version="0.1.0",
    )


@router.get("/public/wards/{ward_id}/advice", response_model=WardAdviceResponse)
async def get_ward_advice(
    ward_id: str,
    db: DBSession,
    lang: str = "en",
) -> WardAdviceResponse:
    """Get public-facing air quality advice for a ward.

    Args:
        ward_id: Ward identifier
        db: Database session
        lang: Language code (en or hi)

    Returns:
        Ward advice with AQI, dominant source, and citizen recommendations
    """
    # Fetch ward
    ward = db.query(Ward).filter(Ward.id == ward_id).first()
    if not ward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ward not found: {ward_id}",
        )

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

    # Set ward name based on language
    ward_name = ward.name_hi or ward.name if lang == "hi" else ward.name

    return WardAdviceResponse(
        ward_id=ward_id,
        ward_name=ward_name,
        ward_name_hi=ward.name_hi,
        timestamp=latest_state.timestamp,
        aqi_est=latest_state.aqi_est,
        aqi_category=latest_state.aqi_category,
        dominant_source=latest_state.dominant_source,
        advice_en=_generate_advice_english(
            latest_state.aqi_category,
            latest_state.dominant_source,
            latest_state.trap_flag,
        ),
        advice_hi=_generate_advice_hindi(
            latest_state.aqi_category,
            latest_state.dominant_source,
            latest_state.trap_flag,
        ),
        confidence_band=latest_state.confidence_band,
    )


@router.post("/public/subscribe", status_code=status.HTTP_201_CREATED)
async def subscribe_to_alerts(
    request: SubscribeRequest,
    db: DBSession,
) -> dict[str, str]:
    """Subscribe to air quality alerts for a ward.

    Args:
        request: Subscription details
        db: Database session

    Returns:
        Confirmation message with subscription ID
    """
    # Verify ward exists
    ward = db.query(Ward).filter(Ward.id == request.ward_id).first()
    if not ward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ward not found: {request.ward_id}",
        )

    # Hash phone number if provided (privacy)
    phone_hash = None
    if request.phone_number:
        phone_hash = hashlib.sha256(request.phone_number.encode()).hexdigest()

    # Create subscriber
    subscriber_id = str(uuid.uuid4())
    subscriber = Subscriber(
        id=subscriber_id,
        ward_id=request.ward_id,
        phone_hash=phone_hash,
        telegram_chat_id=request.telegram_username,
        channel=request.channel,
        consent_at=datetime.now(UTC),
        is_active=True,
    )

    db.add(subscriber)
    db.commit()

    logger.info(
        "Subscription created",
        extra={
            "subscriber_id": subscriber_id,
            "ward_id": request.ward_id,
            "channel": request.channel,
        },
    )

    return {
        "message": "Subscription successful",
        "subscriber_id": subscriber_id,
        "ward_id": request.ward_id,
    }


@router.post("/public/reports", status_code=status.HTTP_201_CREATED)
async def submit_pollution_report(
    request: ReportRequest,
    db: DBSession,
) -> dict[str, str]:
    """Submit a citizen pollution report.

    Args:
        request: Report details
        db: Database session

    Returns:
        Confirmation with report ID
    """
    report_id = str(uuid.uuid4())
    report = Report(
        id=report_id,
        ward_id=request.ward_id,
        submitted_by="anonymous",
        report_type=request.report_type,
        description=request.description,
        location_lat=request.location_lat,
        location_lon=request.location_lon,
        status="pending",
    )

    db.add(report)
    db.commit()

    logger.info(
        "Report submitted",
        extra={
            "report_id": report_id,
            "ward_id": request.ward_id,
            "type": request.report_type,
        },
    )

    return {
        "message": "Report submitted successfully",
        "report_id": report_id,
    }


def _generate_advice_english(aqi_category: str, dominant_source: str, is_trap: bool) -> str:
    """Generate citizen advice text in English."""
    base_advice = {
        "Good": "Air quality is satisfactory. Outdoor activities are safe for all groups.",
        "Satisfactory": "Air quality is acceptable. Sensitive individuals should consider limiting prolonged outdoor exertion.",
        "Moderate": "Air quality is unhealthy for sensitive groups. Children, elderly, and those with respiratory conditions should reduce outdoor activities.",
        "Poor": "Air quality is unhealthy. Everyone should reduce prolonged outdoor exertion. Wear N95 masks if going out.",
        "Very Poor": "Air quality is very unhealthy. Avoid outdoor activities. Keep windows closed. Use air purifiers indoors.",
        "Severe": "Air quality is hazardous. Stay indoors. Avoid all physical activity outdoors. Seek medical attention if experiencing breathing difficulties.",
    }

    advice = base_advice.get(aqi_category, "Air quality data unavailable.")

    # Add source-specific advice
    if dominant_source == "fire" and aqi_category in ("Poor", "Very Poor", "Severe"):
        advice += " Smoke from agricultural fires is affecting air quality."
    elif dominant_source == "traffic" and is_trap:
        advice += " Vehicular emissions are trapped due to low wind conditions."
    elif dominant_source == "dust":
        advice += " High dust levels detected. Avoid outdoor activities during peak hours."

    return advice


def _generate_advice_hindi(aqi_category: str, dominant_source: str, is_trap: bool) -> str:
    """Generate citizen advice text in Hindi."""
    base_advice = {
        "Good": "वायु गुणवत्ता संतोषजनक है। सभी के लिए बाहरी गतिविधियाँ सुरक्षित हैं।",
        "Satisfactory": "वायु गुणवत्ता स्वीकार्य है। संवेदनशील व्यक्तियों को लंबे समय तक बाहरी परिश्रम सीमित करना चाहिए।",
        "Moderate": "वायु गुणवत्ता संवेदनशील समूहों के लिए अस्वास्थ्यकर है। बच्चों, बुजुर्गों और श्वसन रोगियों को बाहरी गतिविधियाँ कम करनी चाहिए।",
        "Poor": "वायु गुणवत्ता अस्वास्थ्यकर है। सभी को लंबे समय तक बाहरी परिश्रम कम करना चाहिए। बाहर जाते समय N95 मास्क पहनें।",
        "Very Poor": "वायु गुणवत्ता बहुत अस्वास्थ्यकर है। बाहरी गतिविधियों से बचें। खिड़कियां बंद रखें। घर के अंदर एयर प्यूरीफायर का उपयोग करें।",
        "Severe": "वायु गुणवत्ता खतरनाक है। घर के अंदर रहें। बाहर शारीरिक गतिविधियों से बचें। सांस लेने में कठिनाई होने पर चिकित्सा सहायता लें।",
    }

    advice = base_advice.get(aqi_category, "वायु गुणवत्ता डेटा उपलब्ध नहीं है।")

    # Add source-specific advice
    if dominant_source == "fire" and aqi_category in ("Poor", "Very Poor", "Severe"):
        advice += " कृषि आग के धुएं से वायु गुणवत्ता प्रभावित हो रही है।"
    elif dominant_source == "traffic" and is_trap:
        advice += " कम हवा की स्थिति के कारण वाहन उत्सर्जन फंस रहा है।"
    elif dominant_source == "dust":
        advice += " उच्च धूल स्तर का पता चला है। चरम घंटों के दौरान बाहरी गतिविधियों से बचें।"

    return advice
