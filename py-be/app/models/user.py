"""User model with enhanced fields for SQLAlchemy ORM."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from .base import Base


class User(Base):
    """SQLAlchemy User model with comprehensive fields."""

    __tablename__ = "users"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # User credentials and identity
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)

    # Profile information
    full_name = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)

    # Status and metadata
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, default=func.now(), onupdate=func.now(), nullable=False
    )

    def __repr__(self):
        """String representation of the User model."""
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"

    def to_dict(self):
        """Convert User instance to dictionary for API responses."""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "bio": self.bio,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def update_from_dict(self, data):
        """Update user fields from dictionary, excluding protected fields."""
        protected_fields = {"id", "created_at"}
        updatable_fields = {"username", "email", "full_name", "bio", "is_active"}

        for field, value in data.items():
            if field in updatable_fields and hasattr(self, field):
                setattr(self, field, value)

    @property
    def is_authenticated(self):
        """Check if user is authenticated (has valid session)."""
        return self.is_active

    @property
    def display_name(self):
        """Get display name (full_name if available, otherwise username)."""
        return self.full_name if self.full_name else self.username
