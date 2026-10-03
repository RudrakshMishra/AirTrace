"""Tests for PDF report generation."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from airtrace.reports.pdf import generate_ward_summary_pdf


def test_generate_ward_summary_pdf():
    """Test generating a ward summary PDF bytes output."""
    ward_state = {
        "aqi_est": 185,
        "aqi_category": "Moderate",
        "dominant_source": "traffic",
        "source_shares": {
            "traffic": 0.45,
            "fire": 0.15,
            "dust": 0.20,
            "industry": 0.10,
            "other": 0.10,
        },
        "confidence_score": 75,
        "evidence": {
            "signals": ["High NO2 concentrations", "Morning rush hour correlation"],
        },
    }

    actions = [
        {
            "department": "Traffic Police",
            "text_en": "Deploy traffic personnel to clear bottleneck intersections.",
            "status": "pending",
        },
        {
            "department": "Municipal Corporation",
            "text_en": "Deploy mechanical sweepers on arterial roads.",
            "status": "in_progress",
        },
    ]

    end_date = datetime.now(UTC)
    start_date = end_date - timedelta(days=7)

    pdf_bytes = generate_ward_summary_pdf(
        ward_name="MP Nagar Ward 45",
        ward_id="bhopal_45",
        city_name="Bhopal",
        ward_state=ward_state,
        actions=actions,
        start_date=start_date,
        end_date=end_date,
    )

    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1000
    # PDF files start with %PDF-
    assert pdf_bytes.startswith(b"%PDF-")
