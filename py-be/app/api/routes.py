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
from .limiter import limiter


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
    name: constr(min_length=1, max_length=100)
    address: constr(regex=r"^0x[a-fA-F0-9]{40}$")
    deployment_date: datetime

    @field_validator("address")
    @classmethod
    def validate_address(cls, v: str) -> str:
        """Validate the contract address format."""
        if not v.startswith("0x"):
            raise ValueError("Contract address must start with '0x'")
        return v.lower()  # Normalize to lowercase


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


@router.post("/contracts", response_model=Contract, status_code=status.HTTP_201_CREATED, tags=["contracts"])
@limiter.limit("10/minute")
async def create_contract(contract_in: ContractCreate, db: Session = Depends(get_db)):
    """
    Create a new smart contract record.
    
    Parameters:
    - **name**: Contract name (1-100 characters)
    - **address**: Contract address (must start with '0x' followed by 40 hex characters)
    - **deployment_date**: Contract deployment timestamp
    
    Returns:
    - Contract object with assigned ID
    
    Rate limit: 10 requests per minute per IP
    """
    contract = ContractDB(**contract_in.model_dump())
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract


@router.get("/deployed_contracts", response_model=DeployedContractsResponse, tags=["contracts"])
@limiter.limit("60/minute")
async def get_deployed_contracts(
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, le=100, description="Number of records to return"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    sort_by: Optional[str] = Query(
        None, 
        description="Field and order to sort by, e.g., 'deployment_date:desc'. Valid fields: id, name, address, deployment_date"),
    name: Optional[str] = Query(None, description="Filter by contract name (case-insensitive partial match)"),
    address: Optional[str] = Query(None, description="Filter by contract address (case-insensitive partial match)"),
):
    """
    Retrieve a list of deployed contracts with filtering, sorting, and pagination.
    
    Parameters:
    - **limit**: Maximum number of records to return (1-100)
    - **skip**: Number of records to skip for pagination
    - **sort_by**: Sort field and order (e.g., 'deployment_date:desc')
    - **name**: Filter contracts by name (case-insensitive)
    - **address**: Filter contracts by address (case-insensitive)
    
    Returns:
    - List of contracts
    - Total count of matching records
    - Pagination information
    
    Rate limit: 60 requests per minute per IP
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
        try:
            field, order = sort_by.split(':') if ':' in sort_by else (sort_by, 'asc')
            if order not in ['asc', 'desc']:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid sort order '{order}'. Must be 'asc' or 'desc'"
                )
            if not hasattr(ContractDB, field):
                valid_fields = [c.name for c in ContractDB.__table__.columns]
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid sort field '{field}'. Valid fields are: {', '.join(valid_fields)}"
                )
            order_by = getattr(ContractDB, field).desc() if order == 'desc' else getattr(ContractDB, field)
            query = query.order_by(order_by)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid sort_by format. Use 'field:order' format, e.g., 'deployment_date:desc'"
            )

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
