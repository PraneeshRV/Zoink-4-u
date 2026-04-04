from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    policy_id = Column(Integer, ForeignKey("policies.id"), nullable=False)
    zone_id = Column(String, nullable=False)
    trigger_reason = Column(String, nullable=False)
    payout_amount = Column(Float, nullable=False)
    status = Column(String, default="APPROVED") # Auto-approved by default in parametric systems
    created_at = Column(DateTime(timezone=True), server_default=func.now())
