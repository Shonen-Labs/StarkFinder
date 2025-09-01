"""Database connection pool configuration for SQLAlchemy."""

import os
from typing import Generator

from dotenv import load_dotenv
from sqlalchemy import MetaData, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool

# Load environment variables
load_dotenv()

# Database URL configuration with fallback
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql+psycopg2://postgres:test1234@localhost:5432/Starkfinder-test"
)

# Validate DATABASE_URL is set
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set.")

# Engine configuration based on database type
if "sqlite" in DATABASE_URL.lower():
    engine = create_engine(
        DATABASE_URL,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
        echo=os.getenv("SQL_DEBUG", "false").lower() == "true",
    )
else:
    # PostgreSQL or other database configuration
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=os.getenv("SQL_DEBUG", "false").lower() == "true",
    )

# Session configuration
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Metadata for migrations and schema operations
metadata = MetaData()


def get_db() -> Generator:
    """
    Database session dependency with proper connection handling.
    
    Yields:
        Generator: SQLAlchemy database session
        
    Example:
        ```python
        @app.get("/users/")
        def get_users(db: Session = Depends(get_db)):
            return db.query(User).all()
        ```
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def init_db() -> None:
    """
    Initialize database tables.
    
    Creates all tables defined in the models.
    Should be called during application startup.
    """
    # Import all models to ensure they are registered with Base
    from . import user
    
    Base.metadata.create_all(bind=engine)


def get_database_info() -> dict:
    """
    Get information about the current database configuration.
    
    Returns:
        dict: Database configuration details
    """
    return {
        "url": DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else DATABASE_URL,  # Hide credentials
        "engine_info": str(engine.url),
        "pool_size": getattr(engine.pool, 'size', 'N/A'),
        "max_overflow": getattr(engine.pool, 'max_overflow', 'N/A'),
        "sql_debug": os.getenv("SQL_DEBUG", "false").lower() == "true"
    }


# Export public API
__all__ = [
    "Base", 
    "engine", 
    "SessionLocal", 
    "metadata", 
    "get_db", 
    "init_db",
    "get_database_info",
    "DATABASE_URL"
]