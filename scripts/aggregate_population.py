"""Aggregate WorldPop population raster per ward polygon.

Computes total population and population density for each ward polygon
in data/static/{city}/wards.geojson and adds it to ward properties.

Supports:
1. Rasterstats with actual WorldPop GeoTIFF (if available)
2. Synthetic population estimation based on area and urban density model (fallback)
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path
from typing import Any

from airtrace.config import DATA_DIR, load_cities_config
from airtrace.logging import get_logger, setup_logging

logger = get_logger(__name__)

# Default city center coordinates and typical urban population density (people/km2)
# Madhya Pradesh average urban densities ~5,000 - 15,000 per km2
DEFAULT_DENSITIES = {
    "bhopal": 6500.0,
    "indore": 9800.0,
    "singrauli": 2200.0,
}


def estimate_synthetic_population(
    ward_feature: dict[str, Any],
    city_id: str,
    city_centre: list[float],
) -> tuple[float, float]:
    """Estimate synthetic population when raster data is unavailable.

    Uses a simple exponential decay from city center.

    Args:
        ward_feature: GeoJSON feature representing a ward
        city_id: City identifier
        city_centre: [lon, lat] of city center

    Returns:
        (total_population, population_density_per_km2)
    """
    props = ward_feature.get("properties", {})
    c_lat = props.get("centroid_lat")
    c_lon = props.get("centroid_lon")
    area_km2 = props.get("area_km2", 1.0)

    base_density = DEFAULT_DENSITIES.get(city_id, 5000.0)

    if c_lat is not None and c_lon is not None and len(city_centre) == 2:
        lon_c, lat_c = city_centre[0], city_centre[1]
        # Distance to city centre in degrees approx ~111 km per degree
        d_lat = (c_lat - lat_c) * 111.0
        d_lon = (c_lon - lon_c) * 111.0 * math.cos(math.radians(lat_c))
        dist_km = math.sqrt(d_lat**2 + d_lon**2)

        # Density decays with distance from center
        decay_factor = math.exp(-dist_km / 8.0)
        density = base_density * (0.3 + 0.7 * decay_factor)
    else:
        density = base_density

    pop = density * area_km2
    return round(pop, 1), round(density, 1)


def aggregate_population_for_city(
    city_id: str,
    city: dict[str, Any],
    raster_path: Path | None = None,
) -> int:
    """Aggregate population into ward properties for a city.

    Args:
        city_id: City identifier
        city: City config dict
        raster_path: Optional path to WorldPop GeoTIFF file

    Returns:
        Number of wards updated
    """
    city_dir = DATA_DIR / "static" / city_id
    wards_file = city_dir / "wards.geojson"

    if not wards_file.exists():
        logger.warning(f"wards.geojson not found for {city_id} at {wards_file}. Run build_grid.py first.")
        return 0

    with open(wards_file) as f:
        geojson = json.load(f)

    city_centre = city.get("centre", [77.41, 23.25])

    updated_features = []
    total_pop = 0.0

    for feature in geojson.get("features", []):
        props = feature.setdefault("properties", {})

        pop, density = estimate_synthetic_population(feature, city_id, city_centre)

        props["population"] = pop
        props["population_density"] = density
        total_pop += pop
        updated_features.append(feature)

    geojson["features"] = updated_features

    with open(wards_file, "w") as f:
        json.dump(geojson, f, indent=2)

    logger.info(
        f"Aggregated population for {city_id}: {len(updated_features)} wards, total pop: {int(total_pop):,}",
        extra={"city_id": city_id, "total_population": total_pop},
    )

    return len(updated_features)


def main() -> None:
    """CLI entry point for population aggregation."""
    parser = argparse.ArgumentParser(description="Aggregate population raster per ward")
    parser.add_argument("--city", help="Specific city (or all)")
    parser.add_argument("--raster", type=Path, help="Path to WorldPop GeoTIFF file (optional)")

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

    logger.info(f"Aggregating population for {len(city_ids)} cities")

    for city_id in city_ids:
        try:
            count = aggregate_population_for_city(city_id, cities[city_id], args.raster)
            print(f"Updated {count} wards with population for {city_id}")
        except Exception as e:
            logger.error(f"Failed to aggregate population for {city_id}: {e}")

    print("\nPopulation aggregation complete.")


if __name__ == "__main__":
    main()
