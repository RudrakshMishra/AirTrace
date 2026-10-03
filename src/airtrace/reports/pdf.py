"""PDF report generator for ward air quality summaries."""

from __future__ import annotations

import io
from datetime import UTC, datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from airtrace.logging import get_logger

logger = get_logger(__name__)


def generate_ward_summary_pdf(
    ward_name: str,
    ward_id: str,
    city_name: str,
    ward_state: dict,
    actions: list[dict],
    start_date: datetime,
    end_date: datetime,
) -> bytes:
    """Generate a 1-page PDF summary for a ward.

    Args:
        ward_name: Name of the ward
        ward_id: Ward identifier
        city_name: City name
        ward_state: Latest ward state dictionary
        actions: List of municipal actions
        start_date: Report start timestamp
        end_date: Report end timestamp

    Returns:
        PDF content as bytes
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()
    story = []

    # Title
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Heading1"],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=6,
    )
    story.append(Paragraph("AirTrace MP - Air Quality Summary Report", title_style))

    # Subtitle
    subtitle_style = ParagraphStyle(
        "CustomSubtitle",
        parent=styles["Normal"],
        fontSize=11,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=12,
    )
    date_str = f"{start_date.strftime('%d %b %Y')} to {end_date.strftime('%d %b %Y')}"
    story.append(Paragraph(f"{ward_name} ({ward_id}), {city_name} | Period: {date_str}", subtitle_style))
    story.append(Spacer(1, 12))

    # Current Status Box
    aqi = ward_state.get("aqi_est", "N/A")
    category = ward_state.get("aqi_category", "Unknown")
    dominant_source = ward_state.get("dominant_source", "Unknown").title()
    confidence = ward_state.get("confidence_score", "N/A")

    status_data = [
        [
            Paragraph("<b>Estimated AQI</b>", styles["Normal"]),
            Paragraph("<b>Category</b>", styles["Normal"]),
            Paragraph("<b>Dominant Source</b>", styles["Normal"]),
            Paragraph("<b>Confidence</b>", styles["Normal"]),
        ],
        [
            Paragraph(f"<font size=16><b>{aqi}</b></font>", styles["Normal"]),
            Paragraph(f"<b>{category}</b>", styles["Normal"]),
            Paragraph(f"{dominant_source}", styles["Normal"]),
            Paragraph(f"{confidence}%", styles["Normal"]),
        ],
    ]

    status_table = Table(status_data, colWidths=[120, 140, 140, 140])
    status_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#0f172a")),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#94a3b8")),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ])
    )
    story.append(status_table)
    story.append(Spacer(1, 16))

    # Source Apportionment Breakdown
    story.append(Paragraph("<b>Source Apportionment Breakdown</b>", styles["Heading2"]))
    story.append(Spacer(1, 6))

    shares = ward_state.get("source_shares", {})
    sources_data = [
        [
            Paragraph("<b>Source</b>", styles["Normal"]),
            Paragraph("<b>Contribution (%)</b>", styles["Normal"]),
            Paragraph("<b>Key Supporting Evidence</b>", styles["Normal"]),
        ]
    ]

    for source_key, pct in shares.items():
        evidence_text = _get_source_evidence_summary(source_key, ward_state)
        sources_data.append([
            Paragraph(source_key.title(), styles["Normal"]),
            Paragraph(f"{pct * 100:.1f}%", styles["Normal"]),
            Paragraph(evidence_text, styles["Normal"]),
        ])

    sources_table = Table(sources_data, colWidths=[120, 100, 320])
    sources_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f8fafc")),
            ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#334155")),
            ("ALIGN", (0, 0), (1, -1), "LEFT"),
            ("ALIGN", (1, 0), (1, -1), "CENTER"),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ])
    )
    story.append(sources_table)
    story.append(Spacer(1, 16))

    # Municipal Actions
    story.append(Paragraph("<b>Recommended Municipal Actions</b>", styles["Heading2"]))
    story.append(Spacer(1, 6))

    if actions:
        actions_data = [
            [
                Paragraph("<b>Department</b>", styles["Normal"]),
                Paragraph("<b>Action Item</b>", styles["Normal"]),
                Paragraph("<b>Status</b>", styles["Normal"]),
            ]
        ]

        for act in actions[:5]:  # Limit to 5 for single page
            actions_data.append([
                Paragraph(act.get("department", "General"), styles["Normal"]),
                Paragraph(act.get("text_en", "No description"), styles["Normal"]),
                Paragraph(act.get("status", "pending").title(), styles["Normal"]),
            ])

        actions_table = Table(actions_data, colWidths=[120, 340, 80])
        actions_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f8fafc")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#334155")),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ])
        )
        story.append(actions_table)
    else:
        story.append(Paragraph("No active municipal actions for this period.", styles["Normal"]))

    story.append(Spacer(1, 16))

    # Footer/Disclaimer
    disclaimer_style = ParagraphStyle(
        "Disclaimer",
        parent=styles["Normal"],
        fontSize=8,
        textColor=colors.HexColor("#94a3b8"),
        leading=10,
    )
    story.append(
        Paragraph(
            "<b>Disclaimer:</b> Source attribution estimates are generated by physics-guided statistical "
            "models and represent likely contributing sources, not chemical certainty. "
            f"Generated by AirTrace MP on {datetime.now(UTC).strftime('%Y-%m-%d %H:%M UTC')}.",
            disclaimer_style,
        )
    )

    doc.build(story)
    return buffer.getvalue()


def _get_source_evidence_summary(source: str, ward_state: dict) -> str:
    """Generate a brief evidence summary string for a source."""
    summaries = {
        "fire": "Upwind agricultural fires detected within 400km trajectory",
        "traffic": "Elevated NO2/CO, rush hour coincidence, road density",
        "dust": "Elevated coarse PM (PM10 > PM2.5), low humidity, dry surface",
        "industry": "Elevated SO2, upwind industrial proximity (<5km)",
    }
    return summaries.get(source, "Regional background and uncharacterized sources")
