"""Database engine and session factory."""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from airtrace.config import get_settings


def get_engine(url: str | None = None):
    """Create SQLAlchemy engine from DATABASE_URL."""
    db_url = url or get_settings().database_url
    if db_url.startswith("sqlite"):
        return create_engine(db_url, connect_args={"check_same_thread": False})
    return create_engine(db_url, pool_pre_ping=True, pool_size=5, max_overflow=10)


def get_session_factory(url: str | None = None) -> sessionmaker[Session]:
    """Return a sessionmaker bound to the engine."""
    engine = get_engine(url)
    db_url = url or get_settings().database_url
    if db_url.startswith("sqlite"):
        from airtrace.models import Base

        Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, expire_on_commit=False)
