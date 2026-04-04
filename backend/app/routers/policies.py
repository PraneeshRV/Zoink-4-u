"""Policy routes: quoting, subscribing, viewing policies."""
import httpx
from datetime import date, timedelta
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.auth import get_current_rider_id
from app.models.rider import Rider
from app.models.policy import Policy
from app.schemas import PolicyQuoteRequest, PolicySubscribeRequest

router = APIRouter(prefix="/policies", tags=["Policies"])

TIER_CONFIG = {
    "bronze": {"max_payout": 500.0, "triggers": 6},
    "silver": {"max_payout": 1000.0, "triggers": 12},
    "gold": {"max_payout": 2000.0, "triggers": 20},
    "platinum": {"max_payout": 5000.0, "triggers": 25},
}

ML_ENGINE_URL = "http://localhost:8001"


@router.post("/quote")
async def get_quote(req: PolicyQuoteRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Rider).where(Rider.id == req.rider_id))
        rider = result.scalar_one_or_none()
        if not rider:
            raise HTTPException(status_code=404, detail="Rider not found")

        tier_cfg = TIER_CONFIG.get(req.tier)
        if not tier_cfg:
            raise HTTPException(status_code=400, detail=f"Invalid tier: {req.tier}")

        # Call ML engine for premium calculation
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(f"{ML_ENGINE_URL}/premium/calculate", json={
                    "zone_h3": rider.zone_h3,
                    "city": rider.city,
                    "tier": req.tier,
                    "work_hours_per_week": 40,
                    "platform": rider.platform,
                    "zoink_score": rider.zoink_score,
                })
                resp.raise_for_status()
                ml_result = resp.json()
                premium = ml_result.get("premium_rs", 29.0)
        except Exception:
            # Fallback to base rates
            base_rates = {"bronze": 29, "silver": 45, "gold": 69, "platinum": 99}
            premium = base_rates.get(req.tier, 29)

        return {
            "rider_id": str(rider.id),
            "tier": req.tier,
            "weekly_premium_rs": round(premium, 2),
            "max_weekly_payout_rs": tier_cfg["max_payout"],
            "covered_triggers": tier_cfg["triggers"],
            "coverage_period": "90 days",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/subscribe")
async def subscribe(req: PolicySubscribeRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Rider).where(Rider.id == req.rider_id))
        rider = result.scalar_one_or_none()
        if not rider:
            raise HTTPException(status_code=404, detail="Rider not found")

        # Cancel existing active policies
        existing_result = await db.execute(
            select(Policy).where(Policy.rider_id == rider.id, Policy.status == "active")
        )
        for p in existing_result.scalars().all():
            p.status = "cancelled"

        tier_cfg = TIER_CONFIG.get(req.tier)
        if not tier_cfg:
            raise HTTPException(status_code=400, detail=f"Invalid tier: {req.tier}")

        # Get premium from ML engine
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(f"{ML_ENGINE_URL}/premium/calculate", json={
                    "zone_h3": rider.zone_h3,
                    "city": rider.city,
                    "tier": req.tier,
                    "work_hours_per_week": 40,
                    "platform": rider.platform,
                    "zoink_score": rider.zoink_score,
                })
                resp.raise_for_status()
                ml_result = resp.json()
                premium = ml_result.get("premium_rs", 29.0)
        except Exception:
            base_rates = {"bronze": 29, "silver": 45, "gold": 69, "platinum": 99}
            premium = base_rates.get(req.tier, 29)

        policy = Policy(
            rider_id=rider.id,
            tier=req.tier,
            weekly_premium_rs=round(premium, 2),
            max_weekly_payout_rs=tier_cfg["max_payout"],
            coverage_start=date.today(),
            coverage_end=date.today() + timedelta(days=90),
            status="active",
        )
        db.add(policy)
        await db.commit()
        await db.refresh(policy)

        return {
            "id": str(policy.id),
            "rider_id": str(rider.id),
            "tier": policy.tier,
            "weekly_premium_rs": policy.weekly_premium_rs,
            "max_weekly_payout_rs": policy.max_weekly_payout_rs,
            "coverage_start": str(policy.coverage_start),
            "coverage_end": str(policy.coverage_end),
            "status": policy.status,
            "message": "Policy activated successfully!",
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{policy_id}")
async def get_policy(policy_id: str, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Policy).where(Policy.id == policy_id))
        policy = result.scalar_one_or_none()
        if not policy:
            raise HTTPException(status_code=404, detail="Policy not found")
        return {
            "id": str(policy.id),
            "rider_id": str(policy.rider_id),
            "tier": policy.tier,
            "weekly_premium_rs": policy.weekly_premium_rs,
            "max_weekly_payout_rs": policy.max_weekly_payout_rs,
            "coverage_start": str(policy.coverage_start),
            "coverage_end": str(policy.coverage_end),
            "status": policy.status,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/active/current")
async def get_active_policy(
    rider_id: str = Depends(get_current_rider_id),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(
            select(Policy).where(Policy.rider_id == rider_id, Policy.status == "active")
        )
        policy = result.scalar_one_or_none()
        if not policy:
            raise HTTPException(status_code=404, detail="No active policy")
        return {
            "id": str(policy.id),
            "rider_id": str(policy.rider_id),
            "tier": policy.tier,
            "weekly_premium_rs": policy.weekly_premium_rs,
            "max_weekly_payout_rs": policy.max_weekly_payout_rs,
            "coverage_start": str(policy.coverage_start),
            "coverage_end": str(policy.coverage_end),
            "status": policy.status,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
