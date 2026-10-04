"""Ventilation index and pollution trap detection.

Computes ventilation coefficient (BLH * wind speed) and identifies
inversion/stagnation conditions that trap pollutants near the surface.
"""

from __future__ import annotations

from typing import Any


def compute_ventilation_coefficient(
    blh_m: float | None,
    wind_speed_ms: float | None,
) -> float | None:
    """Compute ventilation coefficient (m2/s).

    Ventilation coefficient = Boundary Layer Height (m) * Wind Speed (m/s)

    Args:
        blh_m: Boundary layer height in meters
        wind_speed_ms: Wind speed in meters per second

    Returns:
        Ventilation coefficient in m2/s or None if missing data
    """
    if blh_m is None or wind_speed_ms is None or blh_m < 0 or wind_speed_ms < 0:
        return None
    return round(blh_m * wind_speed_ms, 1)


def is_pollution_trap(
    ventilation_history: list[float | None],
    pm25_history: list[float | None],
    threshold_m2s: float = 2000.0,
    min_consecutive_hours: int = 6,
) -> tuple[bool, dict[str, Any]]:
    """Determine if atmospheric conditions form a pollution trap.

    Trap rule:
    Ventilation coefficient below threshold (e.g. 2000 m2/s) for 6+ consecutive hours
    AND PM2.5 has an increasing trend over the window.

    Args:
        ventilation_history: List of hourly ventilation coefficients (oldest to newest)
        pm25_history: List of hourly PM2.5 readings (oldest to newest)
        threshold_m2s: Low ventilation threshold (default 2000 m2/s)
        min_consecutive_hours: Minimum duration in hours (default 6)

    Returns:
        (is_trap, evidence_dict)
    """
    if len(ventilation_history) < min_consecutive_hours:
        return False, {
            "reason": "insufficient_history",
            "consecutive_low_vent_hours": 0,
            "pm25_rising": False,
        }

    # Check last N hours of ventilation
    recent_vent = ventilation_history[-min_consecutive_hours:]
    low_vent_count = 0

    for v in reversed(recent_vent):
        if v is not None and v < threshold_m2s:
            low_vent_count += 1
        else:
            break

    is_low_vent = low_vent_count >= min_consecutive_hours

    # Check PM2.5 trend over the window
    recent_pm25 = [p for p in pm25_history[-min_consecutive_hours:] if p is not None]
    pm25_rising = False

    if len(recent_pm25) >= 2:
        # Simple trend: latest > earliest, or positive slope
        pm25_rising = recent_pm25[-1] > recent_pm25[0]

    is_trap = is_low_vent and pm25_rising

    evidence = {
        "consecutive_low_vent_hours": low_vent_count,
        "threshold_m2s": threshold_m2s,
        "latest_ventilation": ventilation_history[-1] if ventilation_history else None,
        "pm25_rising": pm25_rising,
        "pm25_start": recent_pm25[0] if recent_pm25 else None,
        "pm25_end": recent_pm25[-1] if recent_pm25 else None,
        "is_trap": is_trap,
    }

    return is_trap, evidence
