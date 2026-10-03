"""Fetch static OSM data via Overpass API.

Fetches major roads, industrial/construction landuse, schools, and hospitals
for each configured city and saves as GeoJSON.

Run once to populate data/static/{city}/ directories.
"""

from __future__ import annotations

import argparse
import json
import sys
import time

import httpx

from airtrace.config import DATA_DIR, load_cities_config
from airtrace.logging import get_logger, setup_logging

logger = get_logger(__name__)

OVERPASS_URL = "https://overpass-api.de/api/interpreter"


def build_overpass_query(bbox: list[float], city_name: str) -> str:
    """Build Overpass QL query for city features.

    Args:
        bbox: [min_lon, min_lat, max_lon, max_lat]
        city_name: City name for logging

    Returns:
        Overpass QL query string
    """
    # Bbox format for Overpass: south,west,north,east
    south, west, north, east = bbox[1], bbox[0], bbox[3], bbox[2]
    bbox_str = f"{south},{west},{north},{east}"

    query = f"""[out:json][timeout:60];
(
  // Major roads (motorway, trunk, primary, secondary)
  way["highway"~"^(motorway|trunk|primary|secondary)$"]({bbox_str});

  // Industrial and construction landuse
  way["landuse"~"^(industrial|construction)$"]({bbox_str});
  relation["landuse"~"^(industrial|construction)$"]({bbox_str});

  // Schools
  node["amenity"="school"]({bbox_str});
  way["amenity"="school"]({bbox_str});
  relation["amenity"="school"]({bbox_str});

  // Hospitals
  node["amenity"="hospital"]({bbox_str});
  way["amenity"="hospital"]({bbox_str});
  relation["amenity"="hospital"]({bbox_str});
);
out body;
>;
out skel qt;
"""
    return query


def overpass_to_geojson(
    osm_data: dict,
    feature_type: str,
) -> dict:
    """Convert Overpass JSON to GeoJSON FeatureCollection.

    Args:
        osm_data: Raw Overpass API response
        feature_type: One of "roads", "industrial", "schools", "hospitals"

    Returns:
        GeoJSON FeatureCollection
    """
    features = []

    nodes = {n["id"]: (n["lon"], n["lat"]) for n in osm_data.get("elements", []) if n["type"] == "node"}

    for elem in osm_data.get("elements", []):
        if elem["type"] == "node" and "tags" in elem:
            # Point feature
            geometry = {
                "type": "Point",
                "coordinates": [elem["lon"], elem["lat"]],
            }
            features.append({
                "type": "Feature",
                "geometry": geometry,
                "properties": {
                    "osm_id": elem["id"],
                    "osm_type": "node",
                    **elem.get("tags", {}),
                },
            })

        elif elem["type"] == "way" and "tags" in elem:
            # LineString or Polygon
            coords = []
            for node_id in elem.get("nodes", []):
                if node_id in nodes:
                    coords.append(nodes[node_id])

            if len(coords) < 2:
                continue

            # Closed way = Polygon, open = LineString
            is_closed = coords[0] == coords[-1] if len(coords) > 2 else False
            geometry = {
                "type": "Polygon" if is_closed else "LineString",
                "coordinates": [coords] if is_closed else coords,
            }

            features.append({
                "type": "Feature",
                "geometry": geometry,
                "properties": {
                    "osm_id": elem["id"],
                    "osm_type": "way",
                    **elem.get("tags", {}),
                },
            })

    return {
        "type": "FeatureCollection",
        "features": features,
    }


def filter_by_tag(geojson: dict, tag_key: str, tag_values: list[str] | None = None) -> dict:
    """Filter GeoJSON features by tag.

    Args:
        geojson: GeoJSON FeatureCollection
        tag_key: OSM tag key to filter on
        tag_values: Optional list of allowed values (if None, just check key exists)

    Returns:
        Filtered GeoJSON FeatureCollection
    """
    filtered = []
    for feature in geojson.get("features", []):
        props = feature.get("properties", {})
        if tag_key in props and (tag_values is None or props[tag_key] in tag_values):
            filtered.append(feature)

    return {
        "type": "FeatureCollection",
        "features": filtered,
    }


def fetch_osm_for_city(city_id: str, city: dict) -> dict[str, int]:
    """Fetch OSM data for one city and save as GeoJSON files.

    Args:
        city_id: City identifier
        city: City config dict with bbox

    Returns:
        Dict with feature counts per layer
    """
    logger.info(f"Fetching OSM data for {city_id}")

    bbox = city["bbox"]
    query = build_overpass_query(bbox, city["name"])

    # Query Overpass API
    try:
        with httpx.Client(timeout=90.0) as client:
            response = client.post(OVERPASS_URL, data={"data": query})
            response.raise_for_status()
            osm_data = response.json()

    except httpx.HTTPError as e:
        logger.error(f"Overpass API request failed: {e}")
        raise

    # Convert to GeoJSON
    all_features = overpass_to_geojson(osm_data, "all")

    # Split by feature type
    roads = filter_by_tag(
        all_features,
        "highway",
        ["motorway", "trunk", "primary", "secondary"],
    )
    industrial = filter_by_tag(all_features, "landuse", ["industrial", "construction"])
    schools = filter_by_tag(all_features, "amenity", ["school"])
    hospitals = filter_by_tag(all_features, "amenity", ["hospital"])

    # Save to data/static/{city}/
    city_dir = DATA_DIR / "static" / city_id
    city_dir.mkdir(parents=True, exist_ok=True)

    layers = {
        "roads": roads,
        "industrial": industrial,
        "schools": schools,
        "hospitals": hospitals,
    }

    counts = {}
    for layer_name, geojson in layers.items():
        file_path = city_dir / f"{layer_name}.geojson"
        with open(file_path, "w") as f:
            json.dump(geojson, f, indent=2)
        count = len(geojson["features"])
        counts[layer_name] = count
        logger.info(f"{city_id}/{layer_name}: {count} features saved to {file_path}")

    return counts


def main() -> None:
    """CLI entry point for OSM fetching script."""
    parser = argparse.ArgumentParser(description="Fetch OSM data for cities")
    parser.add_argument("--city", help="Specific city to fetch (or all cities)")
    parser.add_argument(
        "--delay",
        type=int,
        default=2,
        help="Delay in seconds between cities (be nice to Overpass)",
    )

    args = parser.parse_args()

    setup_logging()

    cities = load_cities_config()

    if args.city:
        if args.city not in cities:
            logger.error(f"Unknown city: {args.city}")
            sys.exit(1)
        city_ids = [args.city]
    else:
        city_ids = list(cities.keys())

    logger.info(f"Fetching OSM data for {len(city_ids)} cities")

    results = {}
    for i, city_id in enumerate(city_ids):
        try:
            counts = fetch_osm_for_city(city_id, cities[city_id])
            results[city_id] = counts

            # Be nice to Overpass API - delay between requests
            if i < len(city_ids) - 1:
                time.sleep(args.delay)

        except Exception as e:
            logger.error(f"OSM fetch failed for {city_id}: {e}")
            results[city_id] = {}

    # Summary
    print("\n=== OSM Fetch Summary ===")
    for city_id, counts in results.items():
        print(f"\n{city_id}:")
        for layer, count in counts.items():
            print(f"  {layer}: {count} features")

    print(
        "\nOSM data saved to data/static/{city}/. "
        "Do not re-run during demos (use cached data)."
    )


if __name__ == "__main__":
    main()
