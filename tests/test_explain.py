"""Tests for LLM explanation generation and fallback."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from airtrace.llm.explain import _fallback_explanation, generate_ward_explanation


def test_fallback_explanation_english():
    """Test deterministic English fallback explanation."""
    ward_state = {
        "aqi_est": 210,
        "aqi_category": "Poor",
        "dominant_source": "fire",
        "source_shares": {
            "fire": 0.55,
            "traffic": 0.20,
            "dust": 0.15,
            "industry": 0.05,
            "other": 0.05,
        },
        "confidence_score": 82,
        "trap_flag": False,
        "ventilation_index": 1800.0,
        "confidence_reasons": ["Direct upwind fire plumes within 100km"],
    }

    text = _fallback_explanation("Arera Colony", ward_state, lang="en")
    assert "Arera Colony" in text
    assert "210" in text
    assert "Poor" in text
    assert "fire" in text
    assert "82%" in text


def test_fallback_explanation_hindi():
    """Test deterministic Hindi fallback explanation."""
    ward_state = {
        "aqi_est": 210,
        "aqi_category": "Poor",
        "dominant_source": "fire",
        "source_shares": {
            "fire": 0.55,
            "traffic": 0.20,
            "dust": 0.15,
            "industry": 0.05,
            "other": 0.05,
        },
        "confidence_score": 82,
        "trap_flag": True,
        "ventilation_index": 800.0,
        "confidence_reasons": ["कृषि आग"],
    }

    text = _fallback_explanation("अरेरा कॉलोनी", ward_state, lang="hi")
    assert "अरेरा कॉलोनी" in text
    assert "210" in text
    assert "fire" in text
    assert "82%" in text


def test_generate_ward_explanation_with_api_key():
    """Test LLM explanation with mocked Anthropic client."""
    ward_state = {
        "aqi_est": 150,
        "aqi_category": "Moderate",
        "dominant_source": "traffic",
        "source_shares": {"traffic": 0.6},
        "confidence_score": 70,
    }

    with patch("airtrace.llm.explain.get_settings") as mock_settings:
        mock_settings.return_value.anthropic_api_key = "test_anthropic_key"

        with patch("anthropic.Anthropic") as mock_anthropic:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_content_block = MagicMock()
            mock_content_block.text = "Air quality in Bhopal Ward is moderate mainly due to vehicular traffic."
            mock_response.content = [mock_content_block]
            mock_client.messages.create.return_value = mock_response
            mock_anthropic.return_value = mock_client

            result = generate_ward_explanation(
                ward_name="Bhopal Ward",
                ward_state=ward_state,
                question="Why is AQI high?",
                lang="en",
            )

            assert "Air quality in Bhopal Ward" in result
