"""
Background trigger monitor that checks weather/AQI/traffic every 15 minutes
and auto-fires claims when thresholds are breached.
"""
import uuid
import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, and_
from app.core.database import get_async_session_maker
from app.models.rider import Rider
from app.models.policy import Policy
from app.models.disruption_event import DisruptionEvent
from app.services.external_apis import get_risk_conditions
from app.services.claim_pipeline import run_claim_pipeline

logger = logging.getLogger("trigger_monitor")


async def check_and_fire_triggers():
    """
    For each active policy's zone, check risk conditions and fire triggers
    if thresholds are breached.
    """
    async with get_async_session_maker()() as session:
        try:
            # Get all unique zones with active policies
            result = await session.execute(
                select(Rider.zone_h3, Rider.city).join(Policy).where(
                    Policy.status == "active"
                ).distinct()
            )
            zones = result.all()

            for zone_h3, city in zones:
                try:
                    conditions = await get_risk_conditions(zone_h3, city)
                    triggers_to_fire = []

                    weather = conditions.get("weather", {})
                    aqi_data = conditions.get("aqi", {})
                    traffic = conditions.get("traffic", {})

                    # Check thresholds
                    if weather.get("rainfall_mm_hr", 0) > 40:
                        triggers_to_fire.append(("T1_HEAVY_RAIN", 8))
                    if aqi_data.get("aqi", 0) > 350:
                        triggers_to_fire.append(("T3_SEVERE_AQI", 7))
                    if weather.get("temp_c", 0) > 45:
                        triggers_to_fire.append(("T4_EXTREME_HEAT", 8))
                    if traffic.get("congestion_ratio", 0) > 4.0:
                        triggers_to_fire.append(("T9_GRIDLOCK", 6))

                    for event_type, severity in triggers_to_fire:
                        # Check if similar event already active in last 2 hours
                        two_hours_ago = datetime.now(timezone.utc) - timedelta(hours=2)
                        existing = await session.execute(
                            select(DisruptionEvent).where(
                                and_(
                                    DisruptionEvent.zone_h3 == zone_h3,
                                    DisruptionEvent.event_type == event_type,
                                    DisruptionEvent.created_at > two_hours_ago,
                                )
                            )
                        )
                        if existing.scalar_one_or_none():
                            logger.info(f"Skipping {event_type} for {zone_h3} — recent event exists")
                            continue

                        # Create disruption event
                        event = DisruptionEvent(
                            id=uuid.uuid4(),
                            event_type=event_type,
                            zone_h3=zone_h3,
                            city=city,
                            severity=severity,
                            source_api="trigger_monitor",
                            raw_data=conditions,
                            started_at=datetime.now(timezone.utc),
                            duration_hours=3,
                            is_active=True,
                        )
                        session.add(event)
                        await session.commit()

                        logger.info(f"🚨 Trigger fired: {event_type} in {city} ({zone_h3})")
                        await run_claim_pipeline(str(event.id))

                except Exception as e:
                    logger.error(f"Error checking zone {zone_h3}: {e}")
                    continue

        except Exception as e:
            logger.error(f"Trigger monitor error: {e}")


def setup_scheduler(app):
    """Register APScheduler with FastAPI app."""
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        scheduler = AsyncIOScheduler()
        scheduler.add_job(check_and_fire_triggers, "interval", minutes=15, id="trigger_monitor")

        @app.on_event("startup")
        async def start_scheduler():
            scheduler.start()
            logger.info("⏰ Trigger monitor scheduler started (15 min interval)")

        @app.on_event("shutdown")
        async def stop_scheduler():
            scheduler.shutdown()

    except ImportError:
        logger.warning("APScheduler not installed — trigger monitor disabled")
