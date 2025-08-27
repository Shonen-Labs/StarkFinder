"""API routes for the backend."""

from fastapi import Depends, FastAPI, HTTPException, status
from pydantic import BaseModel, ConfigDict, constr, field_validator
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..models.base import init_db
from ..models.user import User
from ..services.base import get_db


class UserCreate(BaseModel):
    """Schema for incoming user registration data."""

    username: constr(min_length=3)
    email: str
    password: constr(min_length=6)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Invalid email address")
        return v


class UserRead(BaseModel):
    """Schema returned after user registration."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str


app = FastAPI()

init_db()


@app.post("/reg", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)) -> User:
    """Register a new user."""

    existing = (
        db.query(User)
        .filter(or_(User.username == user_in.username, User.email == user_in.email))
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this username or email already exists",
        )

    user = User(**user_in.model_dump())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
