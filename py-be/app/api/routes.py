"""API routes for the backend."""

from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException, status
from pydantic import BaseModel, ConfigDict, constr, field_validator
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..models.base import init_db
from ..models.generated_contract import GeneratedContract
from ..models.user import User
from ..services.base import get_db

app = FastAPI()


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


class GenerateContract(BaseModel):
    """Schema for contract generation requests."""

    user_id: int
    contract_type: constr(min_length=1)
    contract_name: constr(min_length=1)
    description: str | None = None
    parameters: dict | None = None
    template_id: str | None = None


class GeneratedContractRead(BaseModel):
    """Schema returned after contract generation."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    contract_type: str
    contract_name: str
    description: str | None = None
    parameters: dict | None = None
    template_id: str | None = None
    generated_code: str
    status: str
    created_at: datetime
    updated_at: datetime


@app.post(
    "/generate",
    response_model=GeneratedContractRead,
    status_code=status.HTTP_201_CREATED,
)
def generate_contract(
    req: GenerateContract, db: Session = Depends(get_db)
) -> GeneratedContract:
    """Generate a contract for an existing user."""

    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    if len(req.contract_type) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="contract_type must be less than 100 characters",
        )
    if len(req.contract_name) > 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="contract_name must be less than 200 characters",
        )
    if req.description and len(req.description) > 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="description must be less than 1000 characters",
        )
    if req.template_id and len(req.template_id) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="template_id must be less than 100 characters",
        )

    generated_code = (
        f"// Generated contract: {req.contract_name}\n"
        f"// Type: {req.contract_type}\n"
    )

    contract = GeneratedContract(
        user_id=req.user_id,
        contract_type=req.contract_type,
        contract_name=req.contract_name,
        description=req.description,
        parameters=req.parameters,
        template_id=req.template_id,
        generated_code=generated_code,
        status="generated",
    )

    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract
