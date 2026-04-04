import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Claim(Base):
    __tablename__ = "claims"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    policy_id = Column(UUID(as_uuid=True), ForeignKey("policies.id"), nullable=False)
    rider_id = Column(UUID(as_uuid=True), ForeignKey("riders.id"), nullable=False)
    trigger_event_id = Column(String, nullable=True)
    trigger_type = Column(String, nullable=False)
    disruption_start = Column(DateTime(timezone=True), nullable=False)
    disruption_end = Column(DateTime(timezone=True), nullable=True)
    affected_zone_h3 = Column(String, nullable=False)
    srs_score = Column(Float, default=0.0)
    payout_percentage = Column(Float, default=0.0)
    calculated_payout_rs = Column(Float, default=0.0)
    status = Column(String, default="pending")  # pending/fraud_check/approved/rejected/paid
    fraud_flags = Column(JSON, default=list)
    razorpay_payment_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    policy = relationship("Policy", back_populates="claims")
    rider = relationship("Rider", back_populates="claims")
