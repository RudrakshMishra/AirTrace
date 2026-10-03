"""Smoke tests for the scaffold."""

from __future__ import annotations


def test_config_loads():
    """Config module loads without error."""
    from airtrace.config import load_cities_config, load_model_config

    cities = load_cities_config()
    assert "bhopal" in cities
    assert "indore" in cities
    assert "singrauli" in cities

    model = load_model_config()
    assert "fire" in model
    assert "traffic" in model
    assert "model_version" in model


def test_model_yaml_constants():
    """All engine constants are present in model.yaml."""
    from airtrace.config import load_model_config

    cfg = load_model_config()
    assert cfg["fire"]["max_distance_km"] == 400
    assert cfg["fire"]["saturation_K"] == 50.0
    assert cfg["interpolation"]["idw_power"] == 2
    assert cfg["confidence"]["base"] == 100
    assert cfg["ventilation"]["trap_consecutive_hours"] == 6


def test_cities_yaml():
    """Cities config has required fields."""
    from airtrace.config import load_cities_config

    cities = load_cities_config()
    for city_key in ("bhopal", "indore", "singrauli"):
        c = cities[city_key]
        assert "name" in c
        assert "name_hi" in c
        assert "centre" in c
        assert "bbox" in c
        assert "fire_bbox" in c
        assert len(c["bbox"]) == 4
        assert len(c["centre"]) == 2


def test_health_endpoint():
    """The /health endpoint returns ok."""
    from fastapi.testclient import TestClient

    from airtrace.api.main import app

    client = TestClient(app)
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
