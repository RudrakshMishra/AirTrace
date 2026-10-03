"""Unit tests for engine algorithms (interpolation, sources, confidence, ventilation, vulnerability, actions)."""

from __future__ import annotations

import pytest

from airtrace.engine import actions, confidence, interpolate, sources, ventilation, vulnerability


def test_idw_interpolate_point():
    """Test IDW spatial interpolation."""
    stations = [
        {"lat": 23.20, "lon": 77.40, "pm25": 50.0},
        {"lat": 23.30, "lon": 77.40, "pm25": 100.0},
    ]

    # Exactly in between
    val, dist = interpolate.idw_interpolate_point(23.25, 77.40, stations, parameter="pm25")
    assert val is not None
    assert val == pytest.approx(75.0, abs=1.0)
    assert dist is not None


def test_blend_idw_cams():
    """Test blending of ground IDW and satellite CAMS."""
    # Near station: 0.7 * IDW + 0.3 * CAMS
    blended, method = interpolate.blend_idw_cams(
        idw_val=100.0,
        cams_val=50.0,
        min_station_dist_km=5.0,
    )
    assert blended == pytest.approx(85.0)  # 0.7*100 + 0.3*50 = 85.0
    assert method == "blended_idw_cams"

    # Far from station (>25km): CAMS only
    blended_far, method_far = interpolate.blend_idw_cams(
        idw_val=100.0,
        cams_val=50.0,
        min_station_dist_km=30.0,
    )
    assert blended_far == 50.0
    assert method_far == "cams_only"


def test_ventilation_coefficient_and_trap():
    """Test ventilation index and pollution trap detection."""
    coeff = ventilation.compute_ventilation_coefficient(blh_m=500.0, wind_speed_ms=2.0)
    assert coeff == 1000.0

    # Low ventilation for 6 hours + rising PM2.5
    vent_hist = [1200.0, 1100.0, 950.0, 800.0, 750.0, 700.0]
    pm25_hist = [40.0, 50.0, 65.0, 80.0, 95.0, 110.0]

    is_trap, evidence = ventilation.is_pollution_trap(vent_hist, pm25_hist, threshold_m2s=2000.0)
    assert is_trap is True
    assert evidence["is_trap"] is True
    assert evidence["pm25_rising"] is True


def test_score_fire_source_upwind():
    """Test fire source score when fires are in the upwind cone."""
    fires = [
        {"lat": 24.0, "lon": 77.0, "frp": 300.0, "confidence": "high"},
    ]

    # Fire is to North-West, wind is coming FROM North-West (315 deg)
    score, evidence = sources.score_fire_source(
        ward_lat=23.25,
        ward_lon=77.40,
        fires=fires,
        wind_from_deg=315.0,
        wind_speed_kmh=15.0,
        pm25=120.0,
        pm10=150.0,  # ratio 0.8 > 0.6
    )

    assert score > 0.0
    assert evidence["upwind_fire_count"] == 1


def test_score_traffic_source_rush_hour():
    """Test traffic source scoring during peak rush hour."""
    score_rush, ev_rush = sources.score_traffic_source(
        no2=60.0,
        co=2.5,
        hour_ist=9,  # Morning rush hour 08-11
        road_density_factor=0.8,
        is_low_ventilation=True,
    )

    score_off, _ = sources.score_traffic_source(
        no2=20.0,
        co=0.8,
        hour_ist=14,  # Off-peak afternoon
        road_density_factor=0.8,
        is_low_ventilation=False,
    )

    assert score_rush > score_off
    assert ev_rush["is_rush_hour"] is True


def test_apportion_sources_sum_100():
    """Test that source shares normalize to exactly 100%."""
    shares = sources.apportion_sources(
        fire_score=0.8,
        traffic_score=0.4,
        dust_score=0.2,
        industry_score=0.1,
    )

    assert pytest.approx(sum(shares.values()), abs=0.01) == 100.0
    assert shares["fire"] > shares["traffic"]
    assert "other" in shares


def test_confidence_scoring_bands():
    """Test confidence scoring, deductions, and band thresholds."""
    # High confidence: close station, clear dominant source
    score_high, band_high, _ = confidence.calculate_confidence(
        nearest_station_km=3.0,
        source_shares={"fire": 65.0, "traffic": 15.0, "dust": 10.0, "industry": 5.0, "other": 5.0},
        weather_age_hours=0.5,
    )
    assert score_high > 70
    assert band_high == "High"

    # Low confidence: CAMS only (no ground station)
    score_low, band_low, _ = confidence.calculate_confidence(
        nearest_station_km=35.0,
        source_shares={"fire": 35.0, "traffic": 30.0, "dust": 20.0, "industry": 10.0, "other": 5.0},
        has_cams_fallback_only=True,
    )
    assert score_low < 40
    assert band_low == "Low"


def test_vulnerability_and_risk():
    """Test vulnerability index and composite risk computation."""
    vuln, breakdown = vulnerability.calculate_ward_vulnerability(
        pop_density=10000.0,
        school_count=5,
        hospital_count=2,
    )

    assert 0.0 < vuln < 1.0
    assert "norm_population_density" in breakdown

    risk, category = vulnerability.calculate_risk(pm25_estimate=150.0, vulnerability_score=vuln)
    assert 0.0 <= risk <= 1.0
    assert category in ["Critical", "High", "Moderate", "Low"]


def test_generate_actions():
    """Test rule-based action generation in English and Hindi."""
    actions_list = actions.generate_actions_for_ward(
        ward_id="bhopal_w001",
        city_id="bhopal",
        dominant_source="fire",
        source_shares={"fire": 60.0, "traffic": 15.0, "dust": 10.0, "industry": 5.0, "other": 10.0},
        confidence_score=75,
        is_trap=False,
        risk_category="High",
        evidence={"fire": {"upwind_fire_count": 8}},
    )

    assert len(actions_list) >= 1
    fire_action = next(a for a in actions_list if a["evidence"]["source"] == "fire")
    assert "पराली" in fire_action["text_hi"]
    assert "Biomass" in fire_action["text_en"]
    assert fire_action["department"] is not None
