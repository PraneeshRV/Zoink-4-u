import uuid
from datetime import datetime, time, timezone
from sqlalchemy import Column, String, Boolean, Integer, Time, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Rider(Base):
    __tablename__ = "riders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    aadhaar_token = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False, unique=True)
    platform = Column(String, nullable=False)  # zomato/swiggy/zepto/amazon/flipkart
    zone_h3 = Column(String, nullable=False)
    city = Column(String, nullable=False)
    shift_start = Column(Time, nullable=False, default=time(9, 0))
    shift_end = Column(Time, nullable=False, default=time(21, 0))
    zoink_score = Column(Integer, default=50)
    is_verified = Column(Boolean, default=False)
    is_banned = Column(Boolean, default=False)
    consecutive_clean_weeks = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    policies = relationship("Policy", back_populates="rider", lazy="selectin")
    claims = relationship("Claim", back_populates="rider", lazy="selectin")
