"""Test configuration and fixtures."""

import os
import tempfile

TEST_DB_FILE = os.path.join(tempfile.gettempdir(), "starkfinder_test.db")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_FILE}"

import pytest

from app.models.base import Base, engine, init_db


@pytest.fixture(autouse=True)
def setup_db():
    """Ensure a clean database for each test."""
    Base.metadata.drop_all(bind=engine)
    init_db()
    yield
    Base.metadata.drop_all(bind=engine)