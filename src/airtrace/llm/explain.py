"""Natural language explanation generation using Claude."""

from __future__ import annotations

import json
from typing import Any

from airtrace.config import get_settings
from airtrace.logging import get_logger

logger = get_logger(__name__)

EXPLAIN_SYSTEM_PROMPT = """You are an air quality domain expert explaining AirTrace MP source apportionment findings to municipal officials and citizens.
AirTrace MP estimates ward-level AQI using physics-guided spatial interpolation and source attribution.
Explain the findings clearly, transparently, and objectively:
1. Explain WHY a source is dominant based on the provided evidence (wind, fires, traffic, weather).
2. Clarify that source shares are "likely contributing sources" from models, not chemical certainty.
3. Recommend practical municipal actions or citizen precautions based on the dominant source and risk level.
4. If Hindi is requested, respond in fluent, professional Hindi suitable for municipal communications.
Keep responses concise (under 250 words) and actionable."""


def generate_ward_explanation(
    ward_name: str,
    ward_state: dict[str, Any],
    question: str,
    lang: str = "en",
) -> str:
    """Generate a natural language explanation of ward air quality state.

    Args:
        ward_name: Name of the ward
        ward_state: Complete ward state dictionary
        question: User's question or specific prompt
        lang: Language (en or hi)

    Returns:
        Explanation text
    """
    settings = get_settings()
    if not settings.anthropic_api_key:
        return _fallback_explanation(ward_name, ward_state, lang)

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

        # Context summary for LLM
        context = {
            "ward_name": ward_name,
            "aqi": ward_state.get("aqi_est"),
            "category": ward_state.get("aqi_category"),
            "dominant_source": ward_state.get("dominant_source"),
            "source_shares": ward_state.get("source_shares"),
            "confidence_score": ward_state.get("confidence_score"),
            "confidence_reasons": ward_state.get("confidence_reasons"),
            "trap_flag": ward_state.get("trap_flag"),
            "ventilation_index": ward_state.get("ventilation_index"),
            "evidence": ward_state.get("evidence"),
        }

        prompt = f"""Context for {ward_name}:
{json.dumps(context, indent=2, default=str)}

User Question: {question}
Language requested: {lang}

Please provide an explanation."""

        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=500,
            system=EXPLAIN_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        return response.content[0].text

    except Exception as e:
        logger.error(
            "Failed to generate LLM explanation, using fallback",
            extra={"error": str(e)},
        )
        return _fallback_explanation(ward_name, ward_state, lang)


def _fallback_explanation(
    ward_name: str,
    ward_state: dict[str, Any],
    lang: str,
) -> str:
    """Deterministic fallback explanation when Anthropic API is unavailable."""
    aqi = ward_state.get("aqi_est", "unknown")
    category = ward_state.get("aqi_category", "Unknown")
    dominant = ward_state.get("dominant_source", "general sources")
    confidence = ward_state.get("confidence_score", 0)

    if lang == "hi":
        return (
            f"{ward_name} के लिए अनुमानित AQI {aqi} ({category}) है। "
            f"प्राथमिक स्रोत {dominant} ({confidence}% विश्वास) पाया गया है। "
            f"यह अनुमान मौसम संबंधी कारकों और नजदीकी निगरानी स्टेशनों पर आधारित है।"
        )
    else:
        return (
            f"The estimated AQI for {ward_name} is {aqi} ({category}). "
            f"The primary contributing source is likely {dominant} "
            f"with a model confidence of {confidence}%. "
            f"This estimate is based on spatial interpolation and meteorological evidence."
        )
