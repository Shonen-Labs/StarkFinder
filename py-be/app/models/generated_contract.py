"""Model for storing generated contracts."""

from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Text

from .base import Base


class GeneratedContract(Base):
    """SQLAlchemy model for a generated contract."""

    __tablename__ = "generated_contracts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    contract_type = Column(String, nullable=False)
    contract_name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    parameters = Column(JSON, nullable=True)
    template_id = Column(String, nullable=True)
    generated_code = Column(Text, nullable=False)
    status = Column(String, nullable=False, default="generated")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
