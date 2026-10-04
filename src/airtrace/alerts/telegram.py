"""Telegram alert dispatcher for air quality warnings."""

from __future__ import annotations

from datetime import UTC, datetime

import httpx

from airtrace.config import get_settings
from airtrace.logging import get_logger

logger = get_logger(__name__)

# Telegram Bot API base URL
TELEGRAM_API = "https://api.telegram.org/bot{token}"


def send_telegram_message(
    chat_id: str,
    text: str,
    token: str | None = None,
    parse_mode: str = "HTML",
) -> bool:
    """Send a message via Telegram Bot API (synchronous).

    Args:
        chat_id: Telegram chat ID or username
        text: Message text
        token: Bot token (falls back to settings)
        parse_mode: Message format (HTML or Markdown)

    Returns:
        True if sent successfully
    """
    bot_token = token or get_settings().telegram_bot_token
    if not bot_token:
        logger.warning("Telegram bot token not configured, skipping alert")
        return False

    url = f"{TELEGRAM_API.format(token=bot_token)}/sendMessage"

    try:
        with httpx.Client(timeout=15.0) as client:
            response = client.post(
                url,
                json={
                    "chat_id": chat_id,
                    "text": text,
                    "parse_mode": parse_mode,
                    "disable_web_page_preview": True,
                },
            )

            if response.status_code == 200:
                logger.info(
                    "Telegram message sent",
                    extra={"chat_id": chat_id},
                )
                return True
            else:
                logger.error(
                    "Telegram API error",
                    extra={
                        "chat_id": chat_id,
                        "status": response.status_code,
                        "body": response.text[:200],
                    },
                )
                return False

    except httpx.TimeoutException:
        logger.error(
            "Telegram API timeout",
            extra={"chat_id": chat_id},
        )
        return False
    except httpx.HTTPError as e:
        logger.error(
            "Telegram HTTP error",
            extra={"chat_id": chat_id, "error": str(e)},
        )
        return False


def dispatch_alerts_to_subscribers(
    session,
    ward_id: str,
    alerts: list[dict],
    lang: str = "en",
) -> dict[str, int]:
    """Send alerts to all active subscribers of a ward.

    Args:
        session: SQLAlchemy session
        ward_id: Ward identifier
        alerts: List of alert dicts with text_en/text_hi
        lang: Default language for subscribers

    Returns:
        Summary dict with sent/failed counts
    """
    from airtrace.models import Alert, Subscriber

    if not alerts:
        return {"sent": 0, "failed": 0, "skipped": 0}

    # Fetch active subscribers for this ward
    subscribers = (
        session.query(Subscriber)
        .filter(Subscriber.ward_id == ward_id, Subscriber.is_active.is_(True))
        .all()
    )

    if not subscribers:
        logger.info(
            "No subscribers for ward",
            extra={"ward_id": ward_id, "alert_count": len(alerts)},
        )
        return {"sent": 0, "failed": 0, "skipped": 0}

    sent = 0
    failed = 0
    skipped = 0

    for alert in alerts:
        # Persist alert record
        alert_record = Alert(
            id=f"alert_{ward_id}_{datetime.now(UTC).strftime('%Y%m%d%H%M%S')}_{alert['alert_type']}",
            ward_id=ward_id,
            timestamp=datetime.now(UTC),
            alert_type=alert["alert_type"],
            severity=alert["severity"],
            text_en=alert["text_en"],
            text_hi=alert["text_hi"],
            evidence=alert.get("evidence", ""),
            is_active=True,
        )
        session.add(alert_record)

        for subscriber in subscribers:
            if subscriber.channel == "telegram" and subscriber.telegram_chat_id:
                # Choose language based on subscriber preference or default
                text = alert.get("text_hi", alert["text_en"]) if lang == "hi" else alert["text_en"]
                success = send_telegram_message(subscriber.telegram_chat_id, text)
                if success:
                    sent += 1
                else:
                    failed += 1
            else:
                skipped += 1

    session.commit()

    logger.info(
        "Alert dispatch complete",
        extra={
            "ward_id": ward_id,
            "alerts": len(alerts),
            "sent": sent,
            "failed": failed,
            "skipped": skipped,
        },
    )

    return {"sent": sent, "failed": failed, "skipped": skipped}
