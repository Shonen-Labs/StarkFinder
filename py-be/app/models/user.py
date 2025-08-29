"""User model definition."""

from sqlalchemy import Column, Integer, String  # type: ignore

from .base import Base


class User(Base):
    """SQLAlchemy model for a registered user."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
