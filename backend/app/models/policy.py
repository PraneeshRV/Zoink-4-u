import uuid
from datetime import datetime, date, timezone
from sqlalchemy import Column, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Policy(Base):
    __tablename__ = "policies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rider_id = Column(UUID(as_uuid=True), ForeignKey("riders.id"), nullable=False)
    tier = Column(String, nullable=False)  # bronze/silver/gold/platinum
    weekly_premium_rs = Column(Float, nullable=False)
    max_weekly_payout_rs = Column(Float, nullable=False)
    coverage_start = Column(Date, nullable=False, default=date.today)
    coverage_end = Column(Date, nullable=False)
    status = Column(String, default="active")  # active/expired/cancelled
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    rider = relationship("Rider", back_populates="policies")
    claims = relationship("Claim", back_populates="policy", lazy="selectin")
