import os

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy_utils import create_database, database_exists, drop_database

from app.models.base import Base
from app.services.base import get_db

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "sqlite:///./test.db",
)
os.environ["DATABASE_URL"] = TEST_DATABASE_URL


engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Create a fresh test database before tests and drop it after."""
    if not database_exists(TEST_DATABASE_URL):
        create_database(TEST_DATABASE_URL)

    Base.metadata.create_all(bind=engine)

    yield

    drop_database(TEST_DATABASE_URL)
    Base.metadata.drop_all(bind=engine)
    if TEST_DATABASE_URL.startswith("sqlite"):
        try:
            os.remove("test.db")
        except FileNotFoundError:
            pass


@pytest.fixture()
def db_session():
    """Provide a SQLAlchemy session for tests."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(autouse=True)
def override_get_db(monkeypatch, db_session):
    """Override the get_db dependency in FastAPI with test session."""

    def _get_db_override():
        try:
            yield db_session
        finally:
            pass

    monkeypatch.setattr("app.services.base.get_db", _get_db_override)
