from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tier = Column(String, nullable=False) # Bronze, Silver, Gold, Platinum
    weekly_premium = Column(Float, nullable=False)
    zone_id = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    has_buyback = Column(Boolean, default=False)  # Exclusion Buyback add-on
    buyback_premium = Column(Float, default=0.0)  # Extra ₹10-15/week for buyback
    created_at = Column(DateTime(timezone=True), server_default=func.now())

