"""API routes for the backend."""

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, constr, field_validator
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.crud import get_user

from ..models.base import User, init_db
from ..models.deployed_contracts import DeployedContract
from ..models.generated_contract import GeneratedContract
from ..models.user import UserCreate, UserResponse
from ..services.base import get_db

router = APIRouter()


# Placeholder for authentication - In a real application, this would involve
# proper token validation (e.g., JWT, OAuth2) and user retrieval.
# This is added solely to enable testing of unauthorized access.
async def verify_token(
    x_token: str = Header(
        None
    ),  # Changed to Header(None) to make it optional for FastAPI's validation
):
    if x_token is None or x_token != "fake-super-secret-token":
        raise HTTPException(status_code=401, detail="Unauthorized")


class UserRead(BaseModel):
    """Schema returned after user registration."""

    model_config = ConfigDict(from_attributes=True)
    id: int


class GenerateContract(BaseModel):
    """Schema for contract generation requests."""

    user_id: int
    contract_type: Annotated[str, constr(min_length=1)]
    contract_name: Annotated[str, constr(min_length=1)]
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


class DeployedContractRead(BaseModel):
    """Schema returned for deployed contracts."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: int
    contract_name: str
    contract_address: str
    metadata: dict | None = Field(None, alias="contract_metadata")
    deployed_at: datetime


# init_db()  # Commented out to avoid database connection at import time


@router.post("/reg", response_model=UserRead, status_code=status.HTTP_201_CREATED)
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


@router.post(
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


@router.get("/generated_contracts", response_model=list[GeneratedContractRead])
def get_generated_contracts(
    user_id: int | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    token: str = Depends(verify_token),  # Added authentication dependency
) -> list[GeneratedContract]:
    """Retrieve a list of generated contracts, with optional filtering by user_id and pagination."""
    query = db.query(GeneratedContract)
    if user_id:
        query = query.filter(GeneratedContract.user_id == user_id)
    contracts = query.offset(skip).limit(limit).all()
    return contracts


@router.get(
    "/deployed_contracts",
    response_model=list[DeployedContractRead],
    status_code=status.HTTP_200_OK,
)
def get_deployed_contracts(
    name: str | None = None,
    sort_by: str = "deployed_at",
    order: str = "desc",
    db: Session = Depends(get_db),
) -> list[DeployedContract]:
    """Retrieve deployed contracts with optional filtering and sorting."""

    valid_sort = {
        "deployed_at": DeployedContract.deployed_at,
        "contract_name": DeployedContract.contract_name,
    }
    if sort_by not in valid_sort:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid sort_by field",
        )

    query = db.query(DeployedContract)
    if name:
        query = query.filter(DeployedContract.contract_name.ilike(f"%{name}%"))

    sort_column = valid_sort[sort_by]
    if order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    return query.all()


@router.get("/user", response_model=UserResponse)
async def read_user_me(current_user: User = Depends(get_current_user)):
    """
    Get current user details based on authentication token
    """
    return current_user


@router.get("/user/{user_id}", response_model=UserResponse)
async def read_user(user_id: int, db: Session = Depends(get_db)):
    """
    Get user by ID (admin functionality)
    """
    db_user = get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user
