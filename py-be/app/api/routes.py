"""API routes for the backend."""

from app.core.security import get_current_user
from app.db.crud import get_user
from app.models.schemas import UserCreate
from fastapi import (APIRouter, Depends, FastAPI,  # type: ignore
                     HTTPException, status)
from pydantic import (BaseModel, ConfigDict, constr,  # type: ignore
                      field_validator)
from sqlalchemy import or_  # type: ignore
from sqlalchemy.orm import Session  # type: ignore

from ..models.base import User, init_db
from ..services.base import get_db


class UserCreate(BaseModel):
    """Schema for incoming user registration data."""

    def get_username() -> list[str]:
        return []

    email: str

    def get_password() -> str:
        return ""

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


router = APIRouter()


@router.get("/user", response_model=User)
async def read_user_me(current_user: User = Depends(get_current_user)):
    """
    Get current user details based on authentication token
    """
    return current_user


@router.get("/user/{user_id}", response_model=User)
async def read_user(user_id: int, db: Session = Depends(get_db)):
    """
    Get user by ID (admin functionality)
    """
    db_user = get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user
