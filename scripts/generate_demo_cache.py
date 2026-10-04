"""Generate comprehensive mock cached data for all configured cities.

Ensures DEMO_MODE=true works completely offline across all sources:
- openaq
- cpcb
- firms
- weather
- cams
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta

from airtrace.config import DATA_DIR, load_cities_config


def generate_demo_cache_for_city(city_id: str, city: dict, timestamp: datetime | None = None) -> None:
    """Generate mock cache files for all ingest sources for one city."""
    if timestamp is None:
        timestamp = datetime.now(UTC)

    ts_str = timestamp.strftime("%Y%m%d_%H%M%S")
    lon, lat = city["centre"]

    # 1. OpenAQ cache
    openaq_dir = DATA_DIR / "cache" / "openaq"
    openaq_dir.mkdir(parents=True, exist_ok=True)

    openaq_data = {
        "meta": {"found": 6, "city": city_id},
        "results": [
            {
                "location_id": f"{city_id}_station_north",
                "location": f"{city['name']} North Air Monitoring Station",
                "coordinates": {"latitude": lat + 0.04, "longitude": lon + 0.02},
                "parameter": {"name": "pm25"},
                "value": 68.5,
                "unit": "µg/m³",
                "datetime": timestamp.isoformat(),
            },
            {
                "location_id": f"{city_id}_station_north",
                "location": f"{city['name']} North Air Monitoring Station",
                "coordinates": {"latitude": lat + 0.04, "longitude": lon + 0.02},
                "parameter": {"name": "pm10"},
                "value": 128.0,
                "unit": "µg/m³",
                "datetime": timestamp.isoformat(),
            },
            {
                "location_id": f"{city_id}_station_central",
                "location": f"{city['name']} Central Station",
                "coordinates": {"latitude": lat - 0.01, "longitude": lon - 0.01},
                "parameter": {"name": "pm25"},
                "value": 74.2,
                "unit": "µg/m³",
                "datetime": timestamp.isoformat(),
            },
            {
                "location_id": f"{city_id}_station_central",
                "location": f"{city['name']} Central Station",
                "coordinates": {"latitude": lat - 0.01, "longitude": lon - 0.01},
                "parameter": {"name": "no2"},
                "value": 42.0,
                "unit": "µg/m³",
                "datetime": timestamp.isoformat(),
            },
            {
                "location_id": f"{city_id}_station_central",
                "location": f"{city['name']} Central Station",
                "coordinates": {"latitude": lat - 0.01, "longitude": lon - 0.01},
                "parameter": {"name": "so2"},
                "value": 18.5,
                "unit": "µg/m³",
                "datetime": timestamp.isoformat(),
            },
            {
                "location_id": f"{city_id}_station_central",
                "location": f"{city['name']} Central Station",
                "coordinates": {"latitude": lat - 0.01, "longitude": lon - 0.01},
                "parameter": {"name": "co"},
                "value": 850.0,
                "unit": "µg/m³",
                "datetime": timestamp.isoformat(),
            },
        ],
    }

    with open(openaq_dir / f"{city_id}_{ts_str}.json", "w") as f:
        json.dump(openaq_data, f, indent=2)

    # 2. CPCB fallback cache
    cpcb_dir = DATA_DIR / "cache" / "cpcb"
    cpcb_dir.mkdir(parents=True, exist_ok=True)

    cpcb_data = {
        "records": [
            {
                "station_id": f"{city_id}_cpcb_1",
                "station": f"{city['name']} Regional Board Office",
                "last_update": timestamp.isoformat(),
                "pm25": 71.0,
                "pm10": 135.0,
                "no2": 39.0,
                "so2": 16.0,
                "co": 800.0,
                "o3": 44.0,
            }
        ]
    }

    with open(cpcb_dir / f"{city_id}_{ts_str}.json", "w") as f:
        json.dump(cpcb_data, f, indent=2)

    # 3. FIRMS fire cache (regional / upwind detections)
    firms_dir = DATA_DIR / "cache" / "firms"
    firms_dir.mkdir(parents=True, exist_ok=True)

    firms_data = {
        "results": [
            {
                "latitude": str(lat + 0.8),
                "longitude": str(lon - 0.6),
                "brightness": "328.4",
                "frp": "185.0",
                "confidence": "high",
                "acq_date": timestamp.strftime("%Y-%m-%d"),
                "acq_time": timestamp.strftime("%H%M"),
                "satellite": "VIIRS",
            },
            {
                "latitude": str(lat + 1.2),
                "longitude": str(lon - 0.9),
                "brightness": "315.2",
                "frp": "92.4",
                "confidence": "nominal",
                "acq_date": timestamp.strftime("%Y-%m-%d"),
                "acq_time": timestamp.strftime("%H%M"),
                "satellite": "VIIRS",
            },
            {
                "latitude": str(lat + 0.4),
                "longitude": str(lon - 0.3),
                "brightness": "335.0",
                "frp": "210.6",
                "confidence": "high",
                "acq_date": timestamp.strftime("%Y-%m-%d"),
                "acq_time": timestamp.strftime("%H%M"),
                "satellite": "VIIRS",
            },
        ],
        "bbox": city.get("fire_bbox", city["bbox"]),
        "days": 1,
        "timestamp": timestamp.isoformat(),
    }

    with open(firms_dir / f"{city_id}_{ts_str}.json", "w") as f:
        json.dump(firms_data, f, indent=2)

    # 4. Weather cache (48 hourly forecasts)
    weather_dir = DATA_DIR / "cache" / "weather"
    weather_dir.mkdir(parents=True, exist_ok=True)

    base_time = timestamp.replace(minute=0, second=0, microsecond=0)
    time_series = [(base_time + timedelta(hours=i)).isoformat() for i in range(48)]

    weather_data = {
        "latitude": lat,
        "longitude": lon,
        "generationtime_ms": 0.5,
        "utc_offset_seconds": 0,
        "timezone": "UTC",
        "hourly": {
            "time": time_series,
            "temperature_2m": [28.0 + (i % 8) * 0.8 for i in range(48)],
            "relative_humidity_2m": [52.0 - (i % 6) * 2.0 for i in range(48)],
            "precipitation": [0.0] * 48,
            "wind_speed_10m": [3.5 + (i % 5) * 0.4 for i in range(48)],
            "wind_direction_10m": [315.0 + (i % 4) * 5.0 for i in range(48)],  # NW wind (from 315 deg)
            "boundary_layer_height": [850.0 + (i % 12) * 40.0 for i in range(48)],
        },
    }

    with open(weather_dir / f"{city_id}_{ts_str}.json", "w") as f:
        json.dump(weather_data, f, indent=2)

    # 5. CAMS cache (48 hourly forecasts)
    cams_dir = DATA_DIR / "cache" / "cams"
    cams_dir.mkdir(parents=True, exist_ok=True)

    cams_data = {
        "latitude": lat,
        "longitude": lon,
        "generationtime_ms": 0.4,
        "utc_offset_seconds": 0,
        "timezone": "UTC",
        "hourly": {
            "time": time_series,
            "pm10": [115.0 + (i % 7) * 3.0 for i in range(48)],
            "pm2_5": [62.0 + (i % 7) * 2.0 for i in range(48)],
            "carbon_monoxide": [650.0 + (i % 5) * 25.0 for i in range(48)],
            "nitrogen_dioxide": [32.0 + (i % 6) * 1.5 for i in range(48)],
            "sulphur_dioxide": [15.0 + (i % 4) * 1.0 for i in range(48)],
            "ozone": [48.0 + (i % 8) * 2.0 for i in range(48)],
        },
    }

    with open(cams_dir / f"{city_id}_{ts_str}.json", "w") as f:
        json.dump(cams_data, f, indent=2)


def main() -> None:
    """CLI entry point for demo cache generation."""
    cities = load_cities_config()
    now = datetime.now(UTC)

    print("Generating comprehensive demo cache for all cities...")
    for city_id, city in cities.items():
        generate_demo_cache_for_city(city_id, city, now)
        print(f"  ✓ Generated cache for {city_id} (openaq, cpcb, firms, weather, cams)")

    print("\nDemo cache generation complete.")


if __name__ == "__main__":
    main()
