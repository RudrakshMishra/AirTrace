"""AirTrace MP configuration loader."""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml
from pydantic_settings import BaseSettings


PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
CONFIG_DIR = PROJECT_ROOT / "config"
DATA_DIR = PROJECT_ROOT / "data"


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    database_url: str = "postgresql://airtrace:airtrace_dev@localhost:5432/airtrace"
    demo_mode: bool = False

    openaq_api_key: str = ""
    firms_map_key: str = ""
    data_gov_in_key: str = ""
    anthropic_api_key: str = ""
    telegram_bot_token: str = ""

    clerk_jwks_url: str = ""
    clerk_issuer: str = ""
    clerk_authorized_parties: str = ""

    cors_origins: str = "http://localhost:3000"
    timezone: str = "Asia/Kolkata"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()


@lru_cache(maxsize=1)
def load_cities_config() -> dict[str, Any]:
    """Load cities.yaml configuration."""
    path = CONFIG_DIR / "cities.yaml"
    with open(path) as f:
        return yaml.safe_load(f)["cities"]


@lru_cache(maxsize=1)
def load_model_config() -> dict[str, Any]:
    """Load model.yaml engine constants."""
    path = CONFIG_DIR / "model.yaml"
    with open(path) as f:
        return yaml.safe_load(f)
