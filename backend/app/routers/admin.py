"""Admin routes: dashboard stats, rider management, claims management, zone heatmap."""
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.auth import verify_admin
from app.core.config import ZONE_DISPLAY_NAMES
from app.models.rider import Rider
from app.models.policy import Policy
from app.models.claim import Claim
from app.models.disruption_event import DisruptionEvent

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard-stats")
async def dashboard_stats(
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(verify_admin),
):
    try:
        now = datetime.now(timezone.utc)
        week_ago = now - timedelta(days=7)

        # Total riders
        total_riders = (await db.execute(select(func.count(Rider.id)))).scalar() or 0

        # Active policies
        active_policies = (await db.execute(
            select(func.count(Policy.id)).where(Policy.status == "active")
        )).scalar() or 0

        # Claims this week
        claims_this_week = (await db.execute(
            select(func.count(Claim.id)).where(Claim.created_at >= week_ago)
        )).scalar() or 0

        # Payout this week
        payout_this_week = (await db.execute(
            select(func.sum(Claim.calculated_payout_rs)).where(
                and_(Claim.status == "paid", Claim.created_at >= week_ago)
            )
        )).scalar() or 0

        # Fraud flags pending
        fraud_pending = (await db.execute(
            select(func.count(Claim.id)).where(Claim.status == "fraud_check")
        )).scalar() or 0

        # Total premium collected (rough estimate)
        total_premium_result = await db.execute(
            select(func.sum(Policy.weekly_premium_rs)).where(Policy.status == "active")
        )
        total_premium = (total_premium_result.scalar() or 1) * 4  # ~4 weeks

        # Loss ratio
        total_payout_all = (await db.execute(
            select(func.sum(Claim.calculated_payout_rs)).where(Claim.status == "paid")
        )).scalar() or 0
        loss_ratio = round((total_payout_all / max(total_premium, 1)) * 100, 2)

        # Top affected zones
        zone_claims = await db.execute(
            select(
                Claim.affected_zone_h3,
                func.count(Claim.id).label("claim_count"),
                func.sum(Claim.calculated_payout_rs).label("total_payout"),
            )
            .where(Claim.created_at >= week_ago)
            .group_by(Claim.affected_zone_h3)
            .order_by(func.count(Claim.id).desc())
            .limit(5)
        )
        top_zones = [
            {
                "zone_h3": row[0],
                "zone_name": ZONE_DISPLAY_NAMES.get(row[0], row[0]),
                "claim_count": row[1],
                "total_payout": round(float(row[2] or 0), 2),
            }
            for row in zone_claims.all()
        ]

        return {
            "total_riders": total_riders,
            "active_policies": active_policies,
            "total_claims_this_week": claims_this_week,
            "total_payout_this_week": round(float(payout_this_week), 2),
            "fraud_flags_pending": fraud_pending,
            "loss_ratio": loss_ratio,
            "top_affected_zones": top_zones,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/riders")
async def list_riders(
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(verify_admin),
    page: int = Query(1, ge=1),
    search: str = Query(""),
    limit: int = Query(20, ge=1, le=100),
):
    try:
        offset = (page - 1) * limit
        query = select(Rider)
        if search:
            query = query.where(
                Rider.name.ilike(f"%{search}%") | Rider.phone.ilike(f"%{search}%")
            )
        query = query.order_by(Rider.created_at.desc()).offset(offset).limit(limit)

        result = await db.execute(query)
        riders = result.scalars().all()

        total_query = select(func.count(Rider.id))
        if search:
            total_query = total_query.where(
                Rider.name.ilike(f"%{search}%") | Rider.phone.ilike(f"%{search}%")
            )
        total = (await db.execute(total_query)).scalar() or 0

        riders_data = []
        for r in riders:
            # Get active policy
            pol_result = await db.execute(
                select(Policy).where(Policy.rider_id == r.id, Policy.status == "active")
            )
            pol = pol_result.scalar_one_or_none()

            riders_data.append({
                "id": str(r.id),
                "name": r.name,
                "phone": r.phone,
                "platform": r.platform,
                "zone_h3": r.zone_h3,
                "city": r.city,
                "zoink_score": r.zoink_score,
                "is_verified": r.is_verified,
                "is_banned": r.is_banned,
                "active_tier": pol.tier if pol else None,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            })

        return {"riders": riders_data, "total": total, "page": page}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/claims")
async def list_all_claims(
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(verify_admin),
    status: str = Query(""),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    try:
        offset = (page - 1) * limit
        query = select(Claim)
        if status:
            query = query.where(Claim.status == status)
        query = query.order_by(Claim.created_at.desc()).offset(offset).limit(limit)

        result = await db.execute(query)
        claims = result.scalars().all()

        total_query = select(func.count(Claim.id))
        if status:
            total_query = total_query.where(Claim.status == status)
        total = (await db.execute(total_query)).scalar() or 0

        return {
            "claims": [
                {
                    "id": str(c.id),
                    "rider_id": str(c.rider_id),
                    "policy_id": str(c.policy_id),
                    "trigger_type": c.trigger_type,
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
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/disruption-events")
async def list_disruption_events(
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(verify_admin),
    active: bool = Query(False),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    try:
        offset = (page - 1) * limit
        query = select(DisruptionEvent)
        if active:
            query = query.where(DisruptionEvent.is_active == True)
        query = query.order_by(DisruptionEvent.created_at.desc()).offset(offset).limit(limit)

        result = await db.execute(query)
        events = result.scalars().all()

        events_data = []
        for e in events:
            # Count affected riders and total payout
            claims_result = await db.execute(
                select(
                    func.count(Claim.id),
                    func.sum(Claim.calculated_payout_rs),
                ).where(Claim.trigger_event_id == str(e.id))
            )
            row = claims_result.one()
            affected_riders = row[0] or 0
            total_payout = round(float(row[1] or 0), 2)

            events_data.append({
                "id": str(e.id),
                "event_type": e.event_type,
                "zone_h3": e.zone_h3,
                "city": e.city,
                "severity": e.severity,
                "started_at": e.started_at.isoformat() if e.started_at else None,
                "ended_at": e.ended_at.isoformat() if e.ended_at else None,
                "is_active": e.is_active,
                "source_api": e.source_api,
                "affected_riders": affected_riders,
                "total_payout": total_payout,
            })

        return {"events": events_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/zone-heatmap")
async def zone_heatmap(
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(verify_admin),
):
    try:
        # Get zone stats
        result = await db.execute(
            select(
                Claim.affected_zone_h3,
                func.count(Claim.id).label("claim_count"),
                func.sum(Claim.calculated_payout_rs).label("total_payout"),
            )
            .group_by(Claim.affected_zone_h3)
        )
        rows = result.all()

        zones = []
        for row in rows:
            zone_h3 = row[0]
            claim_count = row[1]
            # Calculate risk score from claim frequency
            risk_score = min(10, round(claim_count * 1.5, 1))
            zones.append({
                "zone_h3": zone_h3,
                "zone_name": ZONE_DISPLAY_NAMES.get(zone_h3, zone_h3),
                "risk_score": risk_score,
                "claim_count": claim_count,
                "total_payout": round(float(row[2] or 0), 2),
            })

        zones.sort(key=lambda x: x["risk_score"], reverse=True)
        return zones
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
