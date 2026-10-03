"""Confidence scoring engine (0-100) with explainable reasoning.

Evaluates data density, station proximity, signal consistency, and source separation.
Categorizes into High (>70), Medium (40-70), and Low (<40) confidence bands.
"""

from __future__ import annotations


def calculate_confidence(
    nearest_station_km: float | None,
    source_shares: dict[str, float],
    weather_age_hours: float = 0.0,
    signals_conflict: bool = False,
    has_cams_fallback_only: bool = False,
) -> tuple[int, str, list[str]]:
    """Compute confidence score (0-100), band, and list of reason strings.

    Rules defined in CLAUDE.md:
    - Start at 100.
    - If no station within 25 km (CAMS only), force Low confidence (<40) and cap at 35.
    - Minus up to 25 if nearest station is over 10 km or missing data.
    - Minus up to 20 if top two sources are within 10 percentage points of each other (source ambiguity).
    - Minus 15 if weather data is older than 3 hours.
    - Minus 15 if pollutant signals conflict (e.g. high fire score with low PM2.5).
    - Bonus +10 (capped at 100) if clear dominant source (>50% share).

    Bands:
    - High: > 70
    - Medium: 40 to 70
    - Low: < 40

    Args:
        nearest_station_km: Distance in km to nearest ground air quality monitor
        source_shares: Dict of normalized source shares (sums to 100%)
        weather_age_hours: Age of latest meteorological data in hours
        signals_conflict: Whether physical sensor signals conflict
        has_cams_fallback_only: True if only satellite/model CAMS was used

    Returns:
        (confidence_score, confidence_band, list_of_reasons)
    """
    reasons: list[str] = []

    # Case 1: CAMS only (no ground stations nearby) -> forced low confidence
    if has_cams_fallback_only or nearest_station_km is None or nearest_station_km > 25.0:
        reasons.append("No ground monitoring station within 25km (using satellite/CAMS model only)")
        return 35, "Low", reasons

    score = 100.0

    # 1. Station proximity penalty (up to -25)
    if nearest_station_km > 10.0:
        penalty = min(25.0, (nearest_station_km - 10.0) * 1.5)
        score -= penalty
        reasons.append(f"Nearest ground station is {nearest_station_km:.1f} km away (-{int(penalty)} pts)")
    else:
        reasons.append(f"Ground monitoring station within {nearest_station_km:.1f} km (+high local fidelity)")

    # 2. Source separation / ambiguity penalty (up to -20)
    sorted_shares = sorted(source_shares.items(), key=lambda x: x[1], reverse=True)
    if len(sorted_shares) >= 2:
        top_diff = sorted_shares[0][1] - sorted_shares[1][1]
        if top_diff < 10.0:
            penalty = 20.0 * (1.0 - (top_diff / 10.0))
            score -= penalty
            reasons.append(
                f"Source ambiguity: top two sources ({sorted_shares[0][0]}: {sorted_shares[0][1]}%, "
                f"{sorted_shares[1][0]}: {sorted_shares[1][1]}%) within {top_diff:.1f}% (-{int(penalty)} pts)"
            )
        elif sorted_shares[0][1] >= 50.0:
            # Clear dominant source bonus
            score = min(100.0, score + 10.0)
            reasons.append(f"Clear dominant source detected: {sorted_shares[0][0]} ({sorted_shares[0][1]}%)")

    # 3. Weather staleness penalty (-15)
    if weather_age_hours > 3.0:
        score -= 15.0
        reasons.append(f"Meteorological data is {weather_age_hours:.1f}h old (-15 pts)")

    # 4. Conflicting signals penalty (-15)
    if signals_conflict:
        score -= 15.0
        reasons.append("Conflicting sensor readings detected across pollutant tracers (-15 pts)")

    final_score = int(max(0.0, min(100.0, round(score))))

    # Determine band
    if final_score > 70:
        band = "High"
    elif final_score >= 40:
        band = "Medium"
    else:
        band = "Low"

    return final_score, band, reasons
