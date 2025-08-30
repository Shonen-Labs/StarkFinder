"""Simple CRUD test to verify basic functionality."""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_imports():
    """Test that we can import our modules."""
    try:
        from app.models.base import Base, engine, SessionLocal
        from app.models.user import User
        from app.repositories.user_repository import UserRepository
        assert True, "All imports successful"
    except ImportError as e:
        assert False, f"Import error: {e}"

def test_database_connection():
    """Test basic database connection."""
    from app.models.base import engine
    from sqlalchemy import text

    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        assert result.fetchone()[0] == 1