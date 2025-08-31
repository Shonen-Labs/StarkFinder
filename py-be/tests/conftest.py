import os
import time

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy_utils import create_database, database_exists, drop_database

# ✅ Import all models so they register with Base
import app.models
from app.models.base import Base

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "sqlite:///./test.db",
)
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

# CAMBIO MÍNIMO: Agregar default aquí también
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "sqlite:///./test.db")
if not TEST_DATABASE_URL:
    raise ValueError("TEST_DATABASE_URL environment variable is not set.")

engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    """Create a fresh test database before tests and drop it after."""
    print(f"Test database URL: {engine.url}")
    print(f"Test database name: {engine.url.database}")
    if database_exists(TEST_DATABASE_URL):
        drop_database(TEST_DATABASE_URL)
    create_database(TEST_DATABASE_URL)

    print(f"Tables before create_all: {Base.metadata.tables.keys()}")  # Debug print

    # ensure all tables are created
    Base.metadata.create_all(bind=engine)

    print(f"Tables after create_all: {Base.metadata.tables.keys()}")  # Debug print

    yield

    Base.metadata.drop_all(bind=engine)
    drop_database(TEST_DATABASE_URL)
    if TEST_DATABASE_URL.startswith("sqlite"):
        try:
            os.remove("test.db")
        except FileNotFoundError:
            pass


@pytest.fixture()
def db_session():
    """Provide a test client that uses the test database session."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(name="client")
def client_fixture(db_session):
    """Provide a test client that uses the test database session."""
    from fastapi.testclient import TestClient

    from app.api.routes import app
    from app.services.base import get_db

    app.dependency_overrides[get_db] = lambda: db_session
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
    app.dependency_overrides.clear()