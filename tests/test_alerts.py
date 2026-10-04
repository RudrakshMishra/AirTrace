"""Tests for alert rules, dispatch, and routes."""

from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

from airtrace.alerts.rules import (
    evaluate_alerts,
    generate_alert_text,
    should_alert_fire_plume,
    should_alert_severity,
    should_alert_trap,
)
from airtrace.alerts.telegram import dispatch_alerts_to_subscribers, send_telegram_message
from airtrace.models import Subscriber


def test_should_alert_fire_plume():
    """Test fire plume detection alerting rule."""
    ward_state_fire = {
        "dominant_source": "fire",
        "confidence_score": 75,
        "aqi_category": "Poor",
        "aqi_est": 220,
    }
    trigger, alert_type, severity = should_alert_fire_plume(ward_state_fire, confidence_threshold=50)
    assert trigger is True
    assert alert_type == "fire_plume"
    assert severity == "high"

    ward_state_low_conf = {
        "dominant_source": "fire",
        "confidence_score": 40,
        "aqi_category": "Poor",
        "aqi_est": 220,
    }
    trigger, _, _ = should_alert_fire_plume(ward_state_low_conf, confidence_threshold=50)
    assert trigger is False


def test_should_alert_trap():
    """Test atmospheric trap alerting rule."""
    ward_state_trap = {
        "trap_flag": True,
        "dominant_source": "traffic",
        "aqi_est": 180,
    }
    history = [150.0] * 6
    trigger, alert_type, severity = should_alert_trap(ward_state_trap, history, trap_hours=6)
    assert trigger is True
    assert alert_type == "trap"
    assert severity == "high"


def test_should_alert_severity():
    """Test severe AQI alerting rule."""
    ward_state_severe = {
        "aqi_category": "Severe",
        "aqi_est": 420,
        "dominant_source": "industry",
        "vulnerability_score": 0.8,
    }
    trigger, alert_type, severity = should_alert_severity(ward_state_severe, vulnerability_weight=0.7)
    assert trigger is True
    assert alert_type == "severity"
    assert severity == "severe"


def test_generate_alert_text():
    """Test bilingual alert text generation."""
    text_en, text_hi = generate_alert_text(
        alert_type="fire_plume",
        severity="high",
        ward_name="Bhopal Ward 1",
        ward_name_hi="भोपाल वार्ड 1",
        aqi=250,
        dominant_source="fire",
    )
    assert "HIGH ALERT" in text_en
    assert "Smoke from agricultural fires" in text_en
    assert "कृषि आग" in text_hi


def test_evaluate_alerts_aggregation():
    """Test comprehensive alert evaluation for a ward."""
    ward_state = {
        "dominant_source": "fire",
        "confidence_score": 80,
        "aqi_category": "Severe",
        "aqi_est": 410,
        "trap_flag": True,
        "vulnerability_score": 0.85,
    }
    history = [200.0] * 6
    alerts = evaluate_alerts(
        ward_state=ward_state,
        ward_name="Bhopal Central",
        ward_name_hi="भोपाल सेंट्रल",
        ventilation_history=history,
    )
    assert len(alerts) >= 2
    types = [a["alert_type"] for a in alerts]
    assert "fire_plume" in types
    assert "trap" in types
    assert "severity" in types


def test_send_telegram_message():
    """Test telegram message sending with mocked httpx."""
    with patch("httpx.Client.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"ok": True}
        mock_post.return_value = mock_response

        success = send_telegram_message(
            chat_id="12345",
            text="Test Alert",
            token="dummy_token",
        )
        assert success is True
        mock_post.assert_called_once()


def test_dispatch_alerts_to_subscribers():
    """Test alert dispatch to active subscribers."""
    mock_session = MagicMock()
    subscriber = Subscriber(
        id="sub_1",
        ward_id="ward_001",
        telegram_chat_id="123456",
        channel="telegram",
        is_active=True,
        consent_at=datetime.now(UTC),
    )
    mock_session.query.return_value.filter.return_value.all.return_value = [subscriber]

    with patch("airtrace.alerts.telegram.send_telegram_message") as mock_send:
        mock_send.return_value = True

        alerts = [
            {
                "alert_type": "severity",
                "severity": "severe",
                "text_en": "Critical alert",
                "text_hi": "गंभीर चेतावनी",
            }
        ]

        stats = dispatch_alerts_to_subscribers(
            session=mock_session,
            ward_id="ward_001",
            alerts=alerts,
            lang="en",
        )

        assert stats["sent"] == 1
        assert stats["failed"] == 0
        assert stats["skipped"] == 0
