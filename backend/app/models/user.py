from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    aadhaar_token = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=False)
    zone_id = Column(String, nullable=False)
    delivery_status = Column(String, default="IDLE")  # IDLE or DELIVERING (for Safe Return)
    zoink_score = Column(Float, default=85.0)  # Trust score 0-100
    created_at = Column(DateTime(timezone=True), server_default=func.now())

