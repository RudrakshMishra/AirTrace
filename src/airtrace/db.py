"""Database engine and session factory."""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from airtrace.config import get_settings


def get_engine(url: str | None = None):
    """Create SQLAlchemy engine from DATABASE_URL."""
    db_url = url or get_settings().database_url
    return create_engine(db_url, pool_pre_ping=True, pool_size=5, max_overflow=10)


def get_session_factory(url: str | None = None) -> sessionmaker[Session]:
    """Return a sessionmaker bound to the engine."""
    engine = get_engine(url)
    return sessionmaker(bind=engine, expire_on_commit=False)
