"""Database base configuration for SQLAlchemy models."""

import os


from sqlalchemy import create_engine,Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv


DATABASE_URL = os.environ.get(
    "DATABASE_URL" 
      , "postgresql+psycopg2://postgres:test1234@localhost:5432/Starkfinder-test"
)


load_dotenv()


DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set.")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    """SQLAlchemy model for a registered user."""
    
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)



def init_db() -> None:
    """Create database tables."""
    # Import models here to ensure they are registered with SQLAlchemy
    from . import deployed_contracts, generated_contract, user  # noqa: F401

    Base.metadata.create_all(bind=engine)
