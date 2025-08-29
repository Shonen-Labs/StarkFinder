"""Database base configuration for SQLAlchemy models."""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql://postgres:Soham2003@localhost:5432/starkfinder_test"
)

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def init_db() -> None:
    """Create database tables."""
    # Import models here to ensure they are registered with SQLAlchemy
    from . import generated_contract, user  # noqa: F401

    Base.metadata.create_all(bind=engine)
