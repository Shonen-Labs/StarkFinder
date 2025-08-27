"""Database base configuration for SQLAlchemy models."""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./app.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def init_db() -> None:
    """Create database tables."""
    # Import models here to ensure they are registered with SQLAlchemy
    from . import user  # noqa: F401

    Base.metadata.create_all(bind=engine)
