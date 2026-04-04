"""Trigger routes: current conditions, simulate disruptions, active events."""
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.auth import verify_admin
from app.models.disruption_event import DisruptionEvent
from app.services.external_apis import get_risk_conditions
from app.services.claim_pipeline import run_claim_pipeline
from app.schemas import TriggerSimulateRequest

router = APIRouter(prefix="/triggers", tags=["Triggers"])


@router.get("/current-conditions")
async def get_current_conditions(
    zone_h3: str = Query(...),
    city: str = Query(""),
    time_of_day_hour: int = Query(None),
    vehicle_type: str = Query("scooter"),
    rider_experience_months: int = Query(6),
):
    try:
        conditions = await get_risk_conditions(
            zone_h3, city, time_of_day_hour, vehicle_type, rider_experience_months
        )
        return conditions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/simulate")
async def simulate_disruption(
    req: TriggerSimulateRequest,
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(verify_admin),
):
    try:
        now = datetime.now(timezone.utc)
        event = DisruptionEvent(
            id=uuid.uuid4(),
            event_type=req.event_type,
            zone_h3=req.zone_h3,
            city=req.city,
            severity=req.severity,
            source_api="admin_simulation",
            raw_data={"simulated": True, "severity": req.severity},
            started_at=now,
            ended_at=now + timedelta(hours=req.duration_hours),
            duration_hours=req.duration_hours,
            is_active=True,
        )
        db.add(event)
        await db.commit()
        await db.refresh(event)

        # Run the auto-claim pipeline
        pipeline_result = await run_claim_pipeline(str(event.id))

        return {
            "event_id": str(event.id),
            "event_type": event.event_type,
            "zone_h3": event.zone_h3,
            "city": event.city,
            "severity": event.severity,
            "duration_hours": req.duration_hours,
            "pipeline_result": pipeline_result,
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/active")
async def get_active_events(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(
            select(DisruptionEvent)
            .where(DisruptionEvent.is_active == True)
            .order_by(DisruptionEvent.created_at.desc())
        )
        events = result.scalars().all()
        return [
            {
                "id": str(e.id),
                "event_type": e.event_type,
                "zone_h3": e.zone_h3,
                "city": e.city,
                "severity": e.severity,
                "started_at": e.started_at.isoformat() if e.started_at else None,
                "ended_at": e.ended_at.isoformat() if e.ended_at else None,
                "is_active": e.is_active,
                "source_api": e.source_api,
            }
            for e in events
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
