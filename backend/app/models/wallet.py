from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class Wallet(Base):
    """
    Disruption Shield Savings Wallet.
    
    3% of each weekly premium is auto-deposited here.
    Riders can withdraw during ANY excluded event.
    This is the rider's OWN money — zero underwriting risk for Zoink.
    """
    __tablename__ = "wallets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    balance = Column(Float, default=0.0)
    total_deposited = Column(Float, default=0.0)
    total_withdrawn = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class WalletTransaction(Base):
    """Audit trail for all wallet deposits and withdrawals."""
    __tablename__ = "wallet_transactions"

    id = Column(Integer, primary_key=True, index=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id"), nullable=False)
    transaction_type = Column(String, nullable=False)  # "SHIELD_DEPOSIT" or "EMERGENCY_WITHDRAWAL"
    amount = Column(Float, nullable=False)
    reason = Column(String, nullable=True)  # e.g., "Weekly premium 3% auto-deposit" or "PANDEMIC_LOCKDOWN withdrawal"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
