"""SQLAlchemy models mirroring the frontend Drizzle schema.

These tables are OWNED by the frontend. Do not create or alter them with
backend migrations. Backend-only tables are prefixed with `be_`.
"""

from __future__ import annotations

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# Frontend-owned tables (mirror only - do NOT create via Alembic)
# ---------------------------------------------------------------------------

class City(Base):
    __tablename__ = "cities"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    name_hi = Column(String)
    state = Column(String)
    lat = Column(Float)
    lon = Column(Float)
    bbox = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())


class Ward(Base):
    __tablename__ = "wards"

    id = Column(String, primary_key=True)
    city_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    name_hi = Column(String)
    geometry = Column(JSON)  # GeoJSON polygon
    centroid_lat = Column(Float)
    centroid_lon = Column(Float)
    pop_density = Column(Float)
    n_schools = Column(Integer, default=0)
    n_hospitals = Column(Integer, default=0)
    road_density_km = Column(Float, default=0.0)
    industrial_area_km2 = Column(Float, default=0.0)
    created_at = Column(DateTime, server_default=func.now())


class Station(Base):
    __tablename__ = "stations"

    id = Column(String, primary_key=True)
    city_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    source = Column(String)  # openaq, cpcb
    lat = Column(Float)
    lon = Column(Float)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class Reading(Base):
    __tablename__ = "readings"

    id = Column(String, primary_key=True)
    station_id = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    pm25 = Column(Float)
    pm10 = Column(Float)
    no2 = Column(Float)
    so2 = Column(Float)
    co = Column(Float)
    o3 = Column(Float)
    aqi = Column(Integer)
    source = Column(String)
    created_at = Column(DateTime, server_default=func.now())


class Fire(Base):
    __tablename__ = "fires"

    id = Column(String, primary_key=True)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    brightness = Column(Float)
    frp = Column(Float)
    confidence = Column(String)  # nominal, high
    acq_date = Column(DateTime, nullable=False)
    satellite = Column(String)
    source = Column(String)
    created_at = Column(DateTime, server_default=func.now())


class WardState(Base):
    __tablename__ = "ward_state"

    id = Column(String, primary_key=True)
    ward_id = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    pm25_est = Column(Float)
    pm10_est = Column(Float)
    aqi_est = Column(Integer)
    aqi_category = Column(String)
    dominant_source = Column(String)
    source_shares = Column(JSON)     # {"fire": 0.35, "traffic": 0.25, ...}
    confidence_score = Column(Integer)
    confidence_band = Column(String)  # High, Medium, Low
    confidence_reasons = Column(JSON) # list of reason strings
    ventilation_index = Column(Float)
    trap_flag = Column(Boolean, default=False)
    risk_score = Column(Float)
    vulnerability_score = Column(Float)
    evidence = Column(JSON)          # list of evidence strings
    model_version = Column(String)
    created_at = Column(DateTime, server_default=func.now())


class Action(Base):
    __tablename__ = "actions"

    id = Column(String, primary_key=True)
    ward_id = Column(String, nullable=False)
    ward_state_id = Column(String)
    timestamp = Column(DateTime, nullable=False)
    source_type = Column(String)    # fire, traffic, dust, industry
    department = Column(String)
    text_en = Column(Text)
    text_hi = Column(Text)
    evidence = Column(Text)
    status = Column(String, default="pending")  # pending, acknowledged, completed
    assigned_to = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True)
    ward_id = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    alert_type = Column(String)     # fire_plume, trap, severity
    severity = Column(String)
    text_en = Column(Text)
    text_hi = Column(Text)
    evidence = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class Subscriber(Base):
    __tablename__ = "subscribers"

    id = Column(String, primary_key=True)
    ward_id = Column(String, nullable=False)
    phone_hash = Column(String)
    telegram_chat_id = Column(String)
    channel = Column(String)  # telegram, sms
    consent_at = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True)
    ward_id = Column(String)
    submitted_by = Column(String)  # user id or anonymous
    report_type = Column(String)
    description = Column(Text)
    location_lat = Column(Float)
    location_lon = Column(Float)
    status = Column(String, default="pending")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    clerk_id = Column(String, unique=True)
    email = Column(String)
    name = Column(String)
    role = Column(String, default="viewer")
    city_id = Column(String)
    created_at = Column(DateTime, server_default=func.now())


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(String, primary_key=True)
    user_id = Column(String)
    action = Column(String, nullable=False)
    resource_type = Column(String)
    resource_id = Column(String)
    details = Column(JSON)
    ip_address = Column(String)
    created_at = Column(DateTime, server_default=func.now())


# ---------------------------------------------------------------------------
# Backend-owned tables (managed by Alembic, prefixed be_)
# ---------------------------------------------------------------------------

class BeIngestRun(Base):
    __tablename__ = "be_ingest_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source = Column(String, nullable=False)    # openaq, cpcb, firms, weather, cams
    city_id = Column(String)
    started_at = Column(DateTime, nullable=False)
    finished_at = Column(DateTime)
    status = Column(String, default="running")  # running, success, error
    rows_fetched = Column(Integer, default=0)
    rows_upserted = Column(Integer, default=0)
    error = Column(Text)
    created_at = Column(DateTime, server_default=func.now())


class BeRawCacheIndex(Base):
    __tablename__ = "be_raw_cache_index"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source = Column(String, nullable=False)
    city_id = Column(String)
    timestamp = Column(DateTime, nullable=False)
    file_path = Column(String, nullable=False)
    record_count = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())


class BeModelConfig(Base):
    __tablename__ = "be_model_config"

    id = Column(Integer, primary_key=True, autoincrement=True)
    version = Column(String, nullable=False, unique=True)
    config_yaml = Column(Text, nullable=False)
    activated_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
