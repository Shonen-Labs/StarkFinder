from datetime import timedelta

from app.core.config import settings
from app.core.security import (create_access_token, get_current_user,
                               get_password_hash, verify_password)
from app.db.crud import (create_user, get_user, get_user_by_email,
                         get_user_by_username)
from app.db.Sessions import get_db
from app.models.schemas import Token, User, UserCreate
from fastapi import APIRouter, Depends, HTTPException, status  # type: ignore
from fastapi.security import OAuth2PasswordRequestForm  # type: ignore
from sqlalchemy.orm import Session  # type: ignore

router = APIRouter()


@router.get("/user", response_model=User)
async def read_user_me(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    Get current user details based on authentication token
    """
    return current_user


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = get_user_by_username(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/users", response_model=User)
async def create_new_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user (registration endpoint)
    """
    db_user = get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    return create_user(db=db, user=user)
