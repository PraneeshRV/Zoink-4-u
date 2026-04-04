"""Rider routes: profile management, claims history, earnings."""
import random
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.auth import get_current_rider_id
from app.models.rider import Rider
from app.models.policy import Policy
from app.models.claim import Claim
from app.schemas import RiderUpdate
from datetime import time as dt_time

router = APIRouter(prefix="/riders", tags=["Riders"])


def parse_time(t: str) -> dt_time:
    parts = t.split(":")
    return dt_time(int(parts[0]), int(parts[1]))


@router.get("/me")
async def get_my_profile(
    rider_id: str = Depends(get_current_rider_id),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(select(Rider).where(Rider.id == rider_id))
        rider = result.scalar_one_or_none()
        if not rider:
            raise HTTPException(status_code=404, detail="Rider not found")

        # Get active policy
        policy_result = await db.execute(
            select(Policy).where(Policy.rider_id == rider.id, Policy.status == "active")
        )
        active_policy = policy_result.scalar_one_or_none()

        policy_data = None
        if active_policy:
            policy_data = {
                "id": str(active_policy.id),
                "tier": active_policy.tier,
                "weekly_premium_rs": active_policy.weekly_premium_rs,
                "max_weekly_payout_rs": active_policy.max_weekly_payout_rs,
                "coverage_start": str(active_policy.coverage_start),
                "coverage_end": str(active_policy.coverage_end),
                "status": active_policy.status,
            }

        return {
            "id": str(rider.id),
            "name": rider.name,
            "phone": rider.phone,
            "platform": rider.platform,
            "zone_h3": rider.zone_h3,
            "city": rider.city,
            "shift_start": rider.shift_start.strftime("%H:%M") if rider.shift_start else "09:00",
            "shift_end": rider.shift_end.strftime("%H:%M") if rider.shift_end else "21:00",
            "zoink_score": rider.zoink_score,
            "is_verified": rider.is_verified,
            "active_policy": policy_data,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/me")
async def update_profile(
    updates: RiderUpdate,
    rider_id: str = Depends(get_current_rider_id),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(select(Rider).where(Rider.id == rider_id))
        rider = result.scalar_one_or_none()
        if not rider:
            raise HTTPException(status_code=404, detail="Rider not found")

        if updates.zone_h3:
            rider.zone_h3 = updates.zone_h3
        if updates.city:
            rider.city = updates.city
        if updates.shift_start:
            rider.shift_start = parse_time(updates.shift_start)
        if updates.shift_end:
            rider.shift_end = parse_time(updates.shift_end)

        await db.commit()
        return {"message": "Profile updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me/claims")
async def get_my_claims(
    rider_id: str = Depends(get_current_rider_id),
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    try:
        offset = (page - 1) * limit
        result = await db.execute(
            select(Claim)
            .where(Claim.rider_id == rider_id)
            .order_by(Claim.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        claims = result.scalars().all()

        total_result = await db.execute(
            select(func.count(Claim.id)).where(Claim.rider_id == rider_id)
        )
        total = total_result.scalar() or 0

        return {
            "claims": [
                {
                    "id": str(c.id),
                    "policy_id": str(c.policy_id),
                    "rider_id": str(c.rider_id),
                    "trigger_type": c.trigger_type,
                    "disruption_start": c.disruption_start.isoformat() if c.disruption_start else None,
                    "disruption_end": c.disruption_end.isoformat() if c.disruption_end else None,
                    "affected_zone_h3": c.affected_zone_h3,
                    "srs_score": c.srs_score,
                    "payout_percentage": c.payout_percentage,
                    "calculated_payout_rs": c.calculated_payout_rs,
                    "status": c.status,
                    "fraud_flags": c.fraud_flags or [],
                    "razorpay_payment_id": c.razorpay_payment_id,
                    "created_at": c.created_at.isoformat() if c.created_at else None,
                }
                for c in claims
            ],
            "total": total,
            "page": page,
            "limit": limit,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me/earnings-summary")
async def get_earnings_summary(
    rider_id: str = Depends(get_current_rider_id),
    db: AsyncSession = Depends(get_db),
):
    try:
        weeks = []
        now = datetime.utcnow()
        for i in range(8):
            week_start = now - timedelta(weeks=i+1)
            week_end = now - timedelta(weeks=i)

            result = await db.execute(
                select(func.sum(Claim.calculated_payout_rs)).where(
                    Claim.rider_id == rider_id,
                    Claim.status == "paid",
                    Claim.created_at >= week_start,
                    Claim.created_at < week_end,
                )
            )
            protected = result.scalar() or 0

            weeks.append({
                "week": f"W{8-i}",
                "week_start": week_start.strftime("%Y-%m-%d"),
                "earnings": round(random.uniform(3000, 8000), 2),
                "protected": round(float(protected), 2),
            })

        weeks.reverse()
        return {"weeks": weeks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
