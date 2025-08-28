"""API routes for the backend."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, constr, field_validator
from sqlalchemy import or_
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..models.base import init_db
from ..models.user import User
from ..models.contract import Contract, ContractDB, DeployedContractsResponse
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


class ContractCreate(BaseModel):
    """Schema for creating a new contract."""
    name: str
    address: str
    deployment_date: datetime


router = APIRouter()

init_db()


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


@router.post("/contracts", response_model=Contract, status_code=status.HTTP_201_CREATED)
async def create_contract(contract_in: ContractCreate, db: Session = Depends(get_db)):
    """Create a new contract."""
    contract = ContractDB(**contract_in.model_dump())
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract


@router.get("/deployed_contracts", response_model=DeployedContractsResponse)
async def get_deployed_contracts(
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, le=100),
    skip: int = Query(0, ge=0),
    sort_by: Optional[str] = Query(
        None, description="Field to sort by, e.g., 'deployment_date:desc'"),
    name: Optional[str] = None,
    address: Optional[str] = None,
):
    """
    Fetches a list of deployed contracts with filtering, sorting, and pagination.
    """
    # Start with a base query
    query = db.query(ContractDB)

    # Apply filters
    if name:
        query = query.filter(ContractDB.name.ilike(f"%{name}%"))
    if address:
        query = query.filter(ContractDB.address.ilike(f"%{address}%"))

    # Apply sorting
    if sort_by:
        field, order = sort_by.split(':') if ':' in sort_by else (sort_by, 'asc')
        if hasattr(ContractDB, field):
            order_by = getattr(ContractDB, field).desc() if order == 'desc' else getattr(ContractDB, field)
            query = query.order_by(order_by)

    # Get total count for pagination
    total = query.count()

    # Apply pagination
    query = query.offset(skip).limit(limit)

    # Execute query
    contracts = query.all()

    return {
        "data": contracts,
        "total": total,
        "page_info": {
            "limit": limit,
            "skip": skip,
        }
    }
