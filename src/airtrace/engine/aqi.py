"""CPCB Indian National Air Quality Index (AQI) calculation.

Pure functions for computing AQI sub-indices and categories according to
Central Pollution Control Board (CPCB) standards.
"""

from __future__ import annotations

# Breakpoints: (C_low, C_high, I_low, I_high)
PM25_BREAKPOINTS = [
    (0.0, 30.0, 0, 50),
    (30.1, 60.0, 51, 100),
    (60.1, 90.0, 101, 200),
    (90.1, 120.0, 201, 300),
    (120.1, 250.0, 301, 400),
    (250.1, 500.0, 401, 500),
]

PM10_BREAKPOINTS = [
    (0.0, 50.0, 0, 50),
    (50.1, 100.0, 51, 100),
    (100.1, 250.0, 101, 200),
    (250.1, 350.0, 201, 300),
    (350.1, 430.0, 301, 400),
    (430.1, 500.0, 401, 500),
]


def calculate_sub_index(conc: float | None, breakpoints: list[tuple[float, float, int, int]]) -> int | None:
    """Calculate sub-index for a single pollutant using linear interpolation.

    Args:
        conc: Pollutant concentration in µg/m³
        breakpoints: List of (C_low, C_high, I_low, I_high) tuples

    Returns:
        Integer AQI sub-index or None
    """
    if conc is None or conc < 0:
        return None

    # Cap at maximum breakpoint ceiling
    max_c = breakpoints[-1][1]
    val = min(conc, max_c)

    for c_low, c_high, i_low, i_high in breakpoints:
        if c_low <= val <= c_high:
            if c_high == c_low:
                return i_low
            sub = i_low + ((i_high - i_low) / (c_high - c_low)) * (val - c_low)
            return round(sub)

    # If above top bracket (e.g. > 500)
    return 500


def get_aqi_category(aqi: int | None) -> str:
    """Get CPCB AQI health category.

    Args:
        aqi: Integer AQI value (0-500)

    Returns:
        Category string: 'Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor', 'Severe', or 'Unknown'
    """
    if aqi is None:
        return "Unknown"
    if aqi <= 50:
        return "Good"
    if aqi <= 100:
        return "Satisfactory"
    if aqi <= 200:
        return "Moderate"
    if aqi <= 300:
        return "Poor"
    if aqi <= 400:
        return "Very Poor"
    return "Severe"


def calculate_aqi(pm25: float | None = None, pm10: float | None = None) -> tuple[int | None, str]:
    """Calculate overall AQI and category based on PM2.5 and PM10.

    Args:
        pm25: PM2.5 concentration in µg/m³
        pm10: PM10 concentration in µg/m³

    Returns:
        (aqi_value, aqi_category)
    """
    sub_pm25 = calculate_sub_index(pm25, PM25_BREAKPOINTS)
    sub_pm10 = calculate_sub_index(pm10, PM10_BREAKPOINTS)

    indices = [idx for idx in (sub_pm25, sub_pm10) if idx is not None]
    if not indices:
        return None, "Unknown"

    overall_aqi = max(indices)
    category = get_aqi_category(overall_aqi)
    return overall_aqi, category
