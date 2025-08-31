"""User repository for CRUD operations."""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..models.user import User


class UserRepository:
    """User repository implementing basic CRUD operations as requested."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, user_data: Dict[str, Any]) -> User:
        """CREATE operation - Insert new user."""
        user = User(**user_data)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def read(self, user_id: int) -> Optional[User]:
        """READ operation - Get user by ID."""
        return self.db.query(User).filter(User.id == user_id).first()

    def read_all(self, skip: int = 0, limit: int = 100) -> List[User]:
        """READ operation - Get all users with pagination."""
        return self.db.query(User).offset(skip).limit(limit).all()

    def update(self, user_id: int, update_data: Dict[str, Any]) -> Optional[User]:
        """UPDATE operation - Update user by ID."""
        user = self.read(user_id)
        if not user:
            return None

        for field, value in update_data.items():
            if hasattr(user, field) and field != "id":
                setattr(user, field, value)

        self.db.commit()
        self.db.refresh(user)
        return user

    def delete(self, user_id: int) -> bool:
        """DELETE operation - Remove user by ID."""
        user = self.read(user_id)
        if not user:
            return False

        self.db.delete(user)
        self.db.commit()
        return True

    def exists_by_username_or_email(self, username: str, email: str) -> bool:
        """Check if user exists for validation."""
        return (
            self.db.query(User)
            .filter(or_(User.username == username, User.email == email))
            .first()
            is not None
        )
