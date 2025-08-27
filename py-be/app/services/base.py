"""Service utilities, including database session dependency."""

from collections.abc import Generator

from sqlalchemy.orm import Session

from ..models.base import SessionLocal


def get_db() -> Generator[Session, None, None]:
    """Yield a database session and ensure its closure."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
