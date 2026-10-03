"""Generate H3 hexagonal grid as fallback ward polygons.

Generates ~1km resolution H3 cells (resolution 8) within city bounding box
when actual administrative ward boundaries are not available.

Saves as data/static/{city}/wards.geojson.
"""

from __future__ import annotations

import argparse
import json
import sys
from typing import Any

import h3
from shapely.geometry import Polygon, mapping

from airtrace.config import DATA_DIR, load_cities_config
from airtrace.logging import get_logger, setup_logging

logger = get_logger(__name__)

# H3 resolution 8 is approx 0.737 km edge length, area ~0.74 km2 (~1km grid)
# Resolution 7 is approx 1.22 km edge length, area ~5.16 km2
# Resolution 9 is approx 0.174 km edge length, area ~0.10 km2
DEFAULT_H3_RESOLUTION = 8


def bbox_to_polygon(bbox: list[float]) -> list[tuple[float, float]]:
    """Convert [min_lon, min_lat, max_lon, max_lat] to lat/lon coordinate ring.

    Args:
        bbox: Bounding box [min_lon, min_lat, max_lon, max_lat]

    Returns:
        List of (lat, lon) tuples forming closed polygon
    """
    min_lon, min_lat, max_lon, max_lat = bbox
    return [
        (min_lat, min_lon),
        (min_lat, max_lon),
        (max_lat, max_lon),
        (max_lat, min_lon),
        (min_lat, min_lon),
    ]


def generate_h3_grid_for_city(
    city_id: str,
    city: dict[str, Any],
    resolution: int = DEFAULT_H3_RESOLUTION,
) -> dict[str, Any]:
    """Generate H3 hex grid covering city bounding box.

    Args:
        city_id: City identifier
        city: City config dict with bbox and name
        resolution: H3 resolution level (default 8 for ~1km cells)

    Returns:
        GeoJSON FeatureCollection with ward properties
    """
    bbox = city["bbox"]
    logger.info(f"Generating H3 grid (res {resolution}) for {city_id}", extra={"bbox": bbox})

    # H3 uses (lat, lng) order
    poly_lat_lng = bbox_to_polygon(bbox)

    # Use h3 polygon fill
    # h3.polygon_to_cells requires lat/lng coordinates in a Polygon-like structure
    geo_json_poly = {
        "type": "Polygon",
        "coordinates": [[[lon, lat] for lat, lon in poly_lat_lng]],
    }

    try:
        # H3 v4 API
        h3_cells = h3.geo_to_cells(geo_json_poly, res=resolution)
    except AttributeError:
        # H3 v3 fallback
        try:
            h3_cells = h3.polyfill(geo_json_poly, resolution, geo_json_conformant=True)
        except Exception:
            # Manual bbox sweep if polyfill fails
            min_lon, min_lat, max_lon, max_lat = bbox
            h3_cells = set()
            lat = min_lat
            while lat <= max_lat:
                lon = min_lon
                while lon <= max_lon:
                    try:
                        cell = h3.latlng_to_cell(lat, lon, resolution)
                    except AttributeError:
                        cell = h3.geo_to_h3(lat, lon, resolution)
                    h3_cells.add(cell)
                    lon += 0.008  # ~1km step in longitude
                lat += 0.008  # ~1km step in latitude

    features = []
    for idx, cell in enumerate(sorted(h3_cells), start=1):
        try:
            # H3 v4 API
            boundary = h3.cell_to_boundary(cell)
            # cell_to_boundary returns list of (lat, lng) tuples
            poly_coords = [[lng, lat] for lat, lng in boundary]
            centroid = h3.cell_to_latlng(cell)
            c_lat, c_lon = centroid[0], centroid[1]
        except AttributeError:
            # H3 v3 API
            boundary = h3.h3_to_geo_boundary(cell)
            poly_coords = [[lng, lat] for lat, lng in boundary]
            centroid = h3.h3_to_geo(cell)
            c_lat, c_lon = centroid[0], centroid[1]

        # Close polygon if not closed
        if poly_coords and poly_coords[0] != poly_coords[-1]:
            poly_coords.append(poly_coords[0])

        polygon = Polygon(poly_coords)

        ward_id = f"{city_id}_w{idx:03d}"
        ward_name = f"Ward {idx} ({cell[-4:]})"

        feature = {
            "type": "Feature",
            "id": ward_id,
            "geometry": mapping(polygon),
            "properties": {
                "id": ward_id,
                "city_id": city_id,
                "ward_number": idx,
                "name": ward_name,
                "h3_index": cell,
                "centroid_lat": c_lat,
                "centroid_lon": c_lon,
                "area_km2": 0.74,  # Approx for res 8
            },
        }
        features.append(feature)

    geojson = {
        "type": "FeatureCollection",
        "features": features,
    }

    # Save to data/static/{city}/wards.geojson
    city_dir = DATA_DIR / "static" / city_id
    city_dir.mkdir(parents=True, exist_ok=True)
    wards_file = city_dir / "wards.geojson"

    with open(wards_file, "w") as f:
        json.dump(geojson, f, indent=2)

    logger.info(
        f"Saved {len(features)} H3 ward cells to {wards_file}",
        extra={"city_id": city_id, "count": len(features)},
    )

    return geojson


def main() -> None:
    """CLI entry point for H3 grid generation."""
    parser = argparse.ArgumentParser(description="Generate H3 grid wards fallback")
    parser.add_argument("--city", help="Specific city to generate for (or all cities)")
    parser.add_argument(
        "--resolution",
        type=int,
        default=DEFAULT_H3_RESOLUTION,
        help=f"H3 resolution (default {DEFAULT_H3_RESOLUTION} ~ 1km cells)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing wards.geojson even if present",
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

    logger.info(f"Generating H3 grids for {len(city_ids)} cities")

    for city_id in city_ids:
        city_dir = DATA_DIR / "static" / city_id
        wards_file = city_dir / "wards.geojson"

        if wards_file.exists() and not args.force:
            logger.info(f"Wards file already exists for {city_id}: {wards_file} (use --force to overwrite)")
            continue

        try:
            geojson = generate_h3_grid_for_city(city_id, cities[city_id], args.resolution)
            print(f"Generated {len(geojson['features'])} wards for {city_id} -> {wards_file}")
        except Exception as e:
            logger.error(f"Failed to generate H3 grid for {city_id}: {e}")

    print("\nGrid generation complete.")


if __name__ == "__main__":
    main()
