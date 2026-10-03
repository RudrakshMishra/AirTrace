"""Tests for static data scripts and files."""

from __future__ import annotations

import json

from scripts import aggregate_population, build_grid, fetch_osm

from airtrace.config import DATA_DIR, load_cities_config


def test_build_overpass_query():
    """Test Overpass query construction."""
    bbox = [77.25, 23.10, 77.55, 23.40]
    query = fetch_osm.build_overpass_query(bbox, "Bhopal")

    assert "highway" in query
    assert "landuse" in query
    assert "school" in query
    assert "hospital" in query
    assert "23.1,77.25,23.4,77.55" in query


def test_overpass_to_geojson():
    """Test conversion of Overpass elements to GeoJSON."""
    sample_osm = {
        "elements": [
            {
                "type": "node",
                "id": 101,
                "lat": 23.25,
                "lon": 77.41,
                "tags": {"amenity": "school", "name": "Test School"},
            },
            {
                "type": "node",
                "id": 1,
                "lat": 23.20,
                "lon": 77.40,
            },
            {
                "type": "node",
                "id": 2,
                "lat": 23.21,
                "lon": 77.41,
            },
            {
                "type": "way",
                "id": 201,
                "nodes": [1, 2],
                "tags": {"highway": "primary", "name": "Test Road"},
            },
        ],
    }

    geojson = fetch_osm.overpass_to_geojson(sample_osm, "all")
    assert geojson["type"] == "FeatureCollection"
    assert len(geojson["features"]) == 2

    # Check node feature
    node_feat = next(f for f in geojson["features"] if f["properties"]["osm_type"] == "node")
    assert node_feat["geometry"]["type"] == "Point"
    assert node_feat["properties"]["amenity"] == "school"

    # Check way feature
    way_feat = next(f for f in geojson["features"] if f["properties"]["osm_type"] == "way")
    assert way_feat["geometry"]["type"] == "LineString"
    assert way_feat["properties"]["highway"] == "primary"


def test_filter_by_tag():
    """Test filtering GeoJSON features by tags."""
    geojson = {
        "type": "FeatureCollection",
        "features": [
            {"type": "Feature", "properties": {"amenity": "school"}},
            {"type": "Feature", "properties": {"amenity": "hospital"}},
            {"type": "Feature", "properties": {"highway": "primary"}},
        ],
    }

    schools = fetch_osm.filter_by_tag(geojson, "amenity", ["school"])
    assert len(schools["features"]) == 1
    assert schools["features"][0]["properties"]["amenity"] == "school"


def test_h3_grid_generation():
    """Test H3 grid generation for a city."""
    city = {
        "name": "Test City",
        "bbox": [77.35, 23.20, 77.45, 23.30],
        "centre": [23.25, 77.40],
    }

    geojson = build_grid.generate_h3_grid_for_city("test_city", city, resolution=8)

    assert geojson["type"] == "FeatureCollection"
    assert len(geojson["features"]) > 0

    first = geojson["features"][0]
    assert first["properties"]["city_id"] == "test_city"
    assert "centroid_lat" in first["properties"]
    assert "centroid_lon" in first["properties"]
    assert first["geometry"]["type"] == "Polygon"


def test_population_aggregation():
    """Test population estimation."""
    feature = {
        "type": "Feature",
        "properties": {
            "centroid_lat": 23.25,
            "centroid_lon": 77.41,
            "area_km2": 0.74,
        },
    }

    pop, density = aggregate_population.estimate_synthetic_population(
        feature,
        "bhopal",
        [23.25, 77.41],
    )

    assert pop > 0
    assert density > 0
    assert density <= 15000


def test_static_files_exist_and_valid():
    """Verify that all required static layers exist for all configured cities."""
    cities = load_cities_config()
    required_layers = ["wards.geojson", "roads.geojson", "industrial.geojson", "schools.geojson", "hospitals.geojson"]

    for city_id in cities:
        city_dir = DATA_DIR / "static" / city_id
        assert city_dir.exists(), f"Static dir missing for {city_id}"

        for layer in required_layers:
            layer_path = city_dir / layer
            assert layer_path.exists(), f"Layer {layer} missing for {city_id}"

            with open(layer_path) as f:
                data = json.load(f)
                assert data["type"] == "FeatureCollection"
                assert "features" in data
