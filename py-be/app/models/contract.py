"""Contract models for the API."""

from datetime import datetime
from typing import List

from pydantic import BaseModel
from sqlalchemy import Column, DateTime, Integer, String

from .base import Base


class ContractDB(Base):
    """Database model for contract data."""

    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    address = Column(String, unique=True, index=True)
    deployment_date = Column(DateTime)


class Contract(BaseModel):
    """Schema for contract data."""

    id: int
    name: str
    address: str
    deployment_date: datetime

    class Config:
        from_attributes = True


class DeployedContractsResponse(BaseModel):
    """Schema for the deployed contracts response."""

    data: List[Contract]
    total: int
    page_info: dict
