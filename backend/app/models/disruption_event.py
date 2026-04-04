import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class DisruptionEvent(Base):
    __tablename__ = "disruption_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_type = Column(String, nullable=False)
    zone_h3 = Column(String, nullable=False)
    city = Column(String, nullable=False)
    severity = Column(Integer, nullable=False)  # 1-10
    source_api = Column(String, default="manual")
    raw_data = Column(JSON, default=dict)
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    ended_at = Column(DateTime(timezone=True), nullable=True)
    duration_hours = Column(Integer, default=2)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
