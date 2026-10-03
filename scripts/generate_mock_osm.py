"""Generate sample OSM static layers (roads, industrial, schools, hospitals) for offline demos and testing."""

from __future__ import annotations

import json

from airtrace.config import DATA_DIR, load_cities_config


def generate_mock_osm_layers(city_id: str, city: dict) -> None:
    """Generate minimal valid GeoJSON static layers for a city."""
    city_dir = DATA_DIR / "static" / city_id
    city_dir.mkdir(parents=True, exist_ok=True)

    lat, lon = city["centre"]

    # 1. Roads (LineStrings)
    roads = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {"highway": "primary", "name": "Main Ring Road"},
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [lon - 0.05, lat - 0.05],
                        [lon + 0.05, lat - 0.05],
                        [lon + 0.05, lat + 0.05],
                        [lon - 0.05, lat + 0.05],
                        [lon - 0.05, lat - 0.05],
                    ],
                },
            },
            {
                "type": "Feature",
                "properties": {"highway": "trunk", "name": "Highway North-South"},
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [lon, lat - 0.1],
                        [lon, lat + 0.1],
                    ],
                },
            },
        ],
    }

    # 2. Industrial landuse (Polygons)
    industrial = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {"landuse": "industrial", "name": "Industrial Area Phase 1"},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [lon + 0.03, lat + 0.02],
                        [lon + 0.06, lat + 0.02],
                        [lon + 0.06, lat + 0.05],
                        [lon + 0.03, lat + 0.05],
                        [lon + 0.03, lat + 0.02],
                    ]],
                },
            },
            {
                "type": "Feature",
                "properties": {"landuse": "construction", "name": "Metro Construction Site"},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [lon - 0.02, lat - 0.01],
                        [lon - 0.01, lat - 0.01],
                        [lon - 0.01, lat],
                        [lon - 0.02, lat],
                        [lon - 0.02, lat - 0.01],
                    ]],
                },
            },
        ],
    }

    # 3. Schools (Points)
    schools = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {"amenity": "school", "name": "City Model School"},
                "geometry": {"type": "Point", "coordinates": [lon + 0.01, lat + 0.01]},
            },
            {
                "type": "Feature",
                "properties": {"amenity": "school", "name": "Public High School"},
                "geometry": {"type": "Point", "coordinates": [lon - 0.02, lat + 0.02]},
            },
            {
                "type": "Feature",
                "properties": {"amenity": "school", "name": "Greenwood School"},
                "geometry": {"type": "Point", "coordinates": [lon + 0.02, lat - 0.02]},
            },
        ],
    }

    # 4. Hospitals (Points)
    hospitals = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {"amenity": "hospital", "name": "District General Hospital"},
                "geometry": {"type": "Point", "coordinates": [lon - 0.01, lat - 0.01]},
            },
            {
                "type": "Feature",
                "properties": {"amenity": "hospital", "name": "City Multi-speciality Hospital"},
                "geometry": {"type": "Point", "coordinates": [lon + 0.02, lat + 0.03]},
            },
        ],
    }

    for name, data in [("roads", roads), ("industrial", industrial), ("schools", schools), ("hospitals", hospitals)]:
        path = city_dir / f"{name}.geojson"
        with open(path, "w") as f:
            json.dump(data, f, indent=2)


def main() -> None:
    cities = load_cities_config()
    for city_id, city in cities.items():
        generate_mock_osm_layers(city_id, city)
        print(f"Generated mock OSM layers for {city_id}")


if __name__ == "__main__":
    main()
