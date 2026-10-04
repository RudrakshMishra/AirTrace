"""Alert generation rules based on ward state thresholds."""

from __future__ import annotations

from airtrace.logging import get_logger

logger = get_logger(__name__)


def should_alert_fire_plume(
    ward_state: dict,
    confidence_threshold: int = 50,
) -> tuple[bool, str, str]:
    """Determine if fire plume alert should be sent.

    Args:
        ward_state: Current ward state dict
        confidence_threshold: Minimum confidence to alert

    Returns:
        Tuple of (should_alert, alert_type, severity)
    """
    if ward_state["dominant_source"] != "fire":
        return False, "", ""

    confidence = ward_state["confidence_score"]
    aqi = ward_state["aqi_est"] or 0

    if confidence < confidence_threshold:
        return False, "", ""

    if aqi >= 250:
        return True, "fire_plume", "severe"
    elif aqi >= 120:
        return True, "fire_plume", "high"
    elif aqi >= 90:
        return True, "fire_plume", "moderate"

    return False, "", ""


def should_alert_trap(
    ward_state: dict,
    ventilation_history: list[float | None],
    trap_hours: int = 6,
) -> tuple[bool, str, str]:
    """Determine if atmospheric trap alert should be sent.

    Args:
        ward_state: Current ward state dict
        ventilation_history: Last N hours of ventilation coefficients
        trap_hours: Consecutive hours threshold

    Returns:
        Tuple of (should_alert, alert_type, severity)
    """
    if not ward_state["trap_flag"]:
        return False, "", ""

    # Check if trap has persisted for threshold hours
    if len(ventilation_history) < trap_hours:
        return False, "", ""

    aqi = ward_state["aqi_est"] or 0

    if aqi >= 120:
        return True, "trap", "high"
    elif aqi >= 90:
        return True, "trap", "moderate"

    return False, "", ""


def should_alert_severity(
    ward_state: dict,
    vulnerability_weight: float = 0.7,
) -> tuple[bool, str, str]:
    """Determine if high-risk severity alert should be sent.

    Args:
        ward_state: Current ward state dict
        vulnerability_weight: Weight for vulnerability in risk calculation

    Returns:
        Tuple of (should_alert, alert_type, severity)
    """
    aqi = ward_state["aqi_est"] or 0
    vulnerability = ward_state.get("vulnerability_score", 0.5)

    # Composite risk considering vulnerability
    risk = (aqi / 500.0) * (1 - vulnerability_weight) + vulnerability * vulnerability_weight

    if risk >= 0.75:
        return True, "severity", "severe"
    elif risk >= 0.6 and aqi >= 120:
        return True, "severity", "high"

    return False, "", ""


def generate_alert_text(
    alert_type: str,
    severity: str,
    ward_name: str,
    ward_name_hi: str,
    aqi: int,
    dominant_source: str,
) -> tuple[str, str]:
    """Generate bilingual alert text.

    Args:
        alert_type: fire_plume, trap, severity
        severity: severe, high, moderate
        ward_name: Ward name (English)
        ward_name_hi: Ward name (Hindi)
        aqi: Current AQI estimate
        dominant_source: Dominant pollution source

    Returns:
        Tuple of (text_en, text_hi)
    """
    severity_label_en = {
        "severe": "SEVERE",
        "high": "HIGH",
        "moderate": "MODERATE",
    }[severity]

    severity_label_hi = {
        "severe": "गंभीर",
        "high": "उच्च",
        "moderate": "मध्यम",
    }[severity]

    if alert_type == "fire_plume":
        text_en = (
            f"🔥 {severity_label_en} ALERT - {ward_name}\n\n"
            f"Smoke from agricultural fires is affecting air quality. "
            f"AQI: {aqi} ({get_aqi_category(aqi)}).\n\n"
            f"Actions:\n"
            f"• Stay indoors, keep windows closed\n"
            f"• Wear N95 masks if going outside\n"
            f"• Vulnerable groups avoid outdoor activities\n"
            f"• Use air purifiers indoors if available"
        )
        text_hi = (
            f"🔥 {severity_label_hi} चेतावनी - {ward_name_hi or ward_name}\n\n"
            f"कृषि आग के धुएं से वायु गुणवत्ता प्रभावित हो रही है। "
            f"AQI: {aqi} ({get_aqi_category_hi(aqi)})।\n\n"
            f"कार्रवाई:\n"
            f"• घर के अंदर रहें, खिड़कियां बंद रखें\n"
            f"• बाहर जाते समय N95 मास्क पहनें\n"
            f"• संवेदनशील समूह बाहरी गतिविधियों से बचें\n"
            f"• यदि उपलब्ध हो तो घर में एयर प्यूरीफायर का उपयोग करें"
        )

    elif alert_type == "trap":
        text_en = (
            f"🌫️ {severity_label_en} ALERT - {ward_name}\n\n"
            f"Atmospheric inversion is trapping pollution. "
            f"AQI: {aqi} ({get_aqi_category(aqi)}).\n\n"
            f"Actions:\n"
            f"• Reduce outdoor activities\n"
            f"• Avoid morning peak hours (7-10 AM)\n"
            f"• Postpone heavy exertion\n"
            f"• Keep vulnerable individuals indoors"
        )
        text_hi = (
            f"🌫️ {severity_label_hi} चेतावनी - {ward_name_hi or ward_name}\n\n"
            f"वायुमंडलीय उलटाव प्रदूषण को फंसा रहा है। "
            f"AQI: {aqi} ({get_aqi_category_hi(aqi)})।\n\n"
            f"कार्रवाई:\n"
            f"• बाहरी गतिविधियाँ कम करें\n"
            f"• सुबह के चरम घंटे (7-10 AM) से बचें\n"
            f"• भारी परिश्रम स्थगित करें\n"
            f"• संवेदनशील व्यक्तियों को घर के अंदर रखें"
        )

    elif alert_type == "severity":
        source_label_en = {
            "fire": "agricultural fires",
            "traffic": "vehicular emissions",
            "dust": "suspended dust",
            "industry": "industrial emissions",
            "other": "multiple sources",
        }.get(dominant_source, "pollution")

        source_label_hi = {
            "fire": "कृषि आग",
            "traffic": "वाहन उत्सर्जन",
            "dust": "निलंबित धूल",
            "industry": "औद्योगिक उत्सर्जन",
            "other": "कई स्रोत",
        }.get(dominant_source, "प्रदूषण")

        text_en = (
            f"⚠️ {severity_label_en} ALERT - {ward_name}\n\n"
            f"Dangerously high pollution levels from {source_label_en}. "
            f"AQI: {aqi} ({get_aqi_category(aqi)}).\n\n"
            f"URGENT Actions:\n"
            f"• Stay indoors immediately\n"
            f"• Close all windows and doors\n"
            f"• Cancel outdoor activities\n"
            f"• Seek medical help if breathing difficulty"
        )
        text_hi = (
            f"⚠️ {severity_label_hi} चेतावनी - {ward_name_hi or ward_name}\n\n"
            f"{source_label_hi} से खतरनाक उच्च प्रदूषण स्तर। "
            f"AQI: {aqi} ({get_aqi_category_hi(aqi)})।\n\n"
            f"तत्काल कार्रवाई:\n"
            f"• तुरंत घर के अंदर रहें\n"
            f"• सभी खिड़कियां और दरवाजे बंद करें\n"
            f"• बाहरी गतिविधियाँ रद्द करें\n"
            f"• सांस लेने में कठिनाई होने पर चिकित्सा सहायता लें"
        )

    else:
        text_en = f"Alert for {ward_name}: AQI {aqi}"
        text_hi = f"{ward_name_hi or ward_name} के लिए चेतावनी: AQI {aqi}"

    return text_en, text_hi


def get_aqi_category(aqi: int | None) -> str:
    """Get AQI category label (English)."""
    if aqi is None:
        return "Unknown"
    if aqi <= 50:
        return "Good"
    elif aqi <= 100:
        return "Satisfactory"
    elif aqi <= 200:
        return "Moderate"
    elif aqi <= 300:
        return "Poor"
    elif aqi <= 400:
        return "Very Poor"
    else:
        return "Severe"


def get_aqi_category_hi(aqi: int | None) -> str:
    """Get AQI category label (Hindi)."""
    if aqi is None:
        return "अज्ञात"
    if aqi <= 50:
        return "अच्छा"
    elif aqi <= 100:
        return "संतोषजनक"
    elif aqi <= 200:
        return "मध्यम"
    elif aqi <= 300:
        return "खराब"
    elif aqi <= 400:
        return "बहुत खराब"
    else:
        return "गंभीर"


def evaluate_alerts(
    ward_state: dict,
    ward_name: str,
    ward_name_hi: str,
    ventilation_history: list[float | None],
) -> list[dict]:
    """Evaluate all alert rules and return alerts to send.

    Args:
        ward_state: Current ward state dict
        ward_name: Ward name (English)
        ward_name_hi: Ward name (Hindi)
        ventilation_history: Recent ventilation coefficients

    Returns:
        List of alert dicts with type, severity, text_en, text_hi
    """
    alerts = []

    # Fire plume alert
    should_alert, alert_type, severity = should_alert_fire_plume(ward_state)
    if should_alert:
        text_en, text_hi = generate_alert_text(
            alert_type,
            severity,
            ward_name,
            ward_name_hi,
            ward_state["aqi_est"],
            ward_state["dominant_source"],
        )
        alerts.append({
            "alert_type": alert_type,
            "severity": severity,
            "text_en": text_en,
            "text_hi": text_hi,
        })

    # Trap alert
    should_alert, alert_type, severity = should_alert_trap(ward_state, ventilation_history)
    if should_alert:
        text_en, text_hi = generate_alert_text(
            alert_type,
            severity,
            ward_name,
            ward_name_hi,
            ward_state["aqi_est"],
            ward_state["dominant_source"],
        )
        alerts.append({
            "alert_type": alert_type,
            "severity": severity,
            "text_en": text_en,
            "text_hi": text_hi,
        })

    # Severity alert
    should_alert, alert_type, severity = should_alert_severity(ward_state)
    if should_alert:
        text_en, text_hi = generate_alert_text(
            alert_type,
            severity,
            ward_name,
            ward_name_hi,
            ward_state["aqi_est"],
            ward_state["dominant_source"],
        )
        alerts.append({
            "alert_type": alert_type,
            "severity": severity,
            "text_en": text_en,
            "text_hi": text_hi,
        })

    return alerts
