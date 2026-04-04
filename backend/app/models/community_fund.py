from sqlalchemy import Column, Integer, Float, String, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class CommunityFund(Base):
    """
    Zone-level Community Resilience Fund.
    
    1% of every premium in a zone is pooled here.
    During major excluded events, admin can release one-time
    emergency grants (₹500-1000) to riders. NOT insurance — 
    it's community support. CSR tax-deductible.
    """
    __tablename__ = "community_funds"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(String, unique=True, index=True, nullable=False)
    balance = Column(Float, default=0.0)
    total_contributed = Column(Float, default=0.0)
    total_granted = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class FundTransaction(Base):
    """Audit trail for community fund contributions and grants."""
    __tablename__ = "fund_transactions"

    id = Column(Integer, primary_key=True, index=True)
    fund_id = Column(Integer, nullable=False)
    transaction_type = Column(String, nullable=False)  # "CONTRIBUTION" or "EMERGENCY_GRANT"
    amount = Column(Float, nullable=False)
    user_id = Column(Integer, nullable=True)  # Who received grant (null for contributions)
    reason = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
