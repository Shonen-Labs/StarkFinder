"""Database base configuration for SQLAlchemy models."""

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set.")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def init_db() -> None:
    """Create database tables."""
    # Import models here to ensure they are registered with SQLAlchemy
    from . import deployed_contracts, generated_contract, user  # noqa: F401

    Base.metadata.create_all(bind=engine)
