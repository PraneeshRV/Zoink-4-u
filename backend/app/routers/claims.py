"""Claims routes: view, approve, reject claims."""
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.auth import verify_admin
from app.models.claim import Claim
from app.schemas import ClaimRejectRequest

router = APIRouter(prefix="/claims", tags=["Claims"])


@router.get("/{claim_id}")
async def get_claim(claim_id: str, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Claim).where(Claim.id == claim_id))
        claim = result.scalar_one_or_none()
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")
        return {
            "id": str(claim.id),
            "policy_id": str(claim.policy_id),
            "rider_id": str(claim.rider_id),
            "trigger_type": claim.trigger_type,
            "disruption_start": claim.disruption_start.isoformat() if claim.disruption_start else None,
            "disruption_end": claim.disruption_end.isoformat() if claim.disruption_end else None,
            "affected_zone_h3": claim.affected_zone_h3,
            "srs_score": claim.srs_score,
            "payout_percentage": claim.payout_percentage,
            "calculated_payout_rs": claim.calculated_payout_rs,
            "status": claim.status,
            "fraud_flags": claim.fraud_flags or [],
            "razorpay_payment_id": claim.razorpay_payment_id,
            "created_at": claim.created_at.isoformat() if claim.created_at else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{claim_id}/approve")
async def approve_claim(
    claim_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(verify_admin),
):
    try:
        result = await db.execute(select(Claim).where(Claim.id == claim_id))
        claim = result.scalar_one_or_none()
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")
        claim.status = "approved"
        await db.commit()
        return {"message": "Claim approved", "claim_id": str(claim.id), "status": "approved"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{claim_id}/reject")
async def reject_claim(
    claim_id: str,
    body: ClaimRejectRequest,
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(verify_admin),
):
    try:
        result = await db.execute(select(Claim).where(Claim.id == claim_id))
        claim = result.scalar_one_or_none()
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")
        claim.status = "rejected"
        claim.fraud_flags = (claim.fraud_flags or []) + [f"REJECTED: {body.reason}"]
        await db.commit()
        return {"message": "Claim rejected", "claim_id": str(claim.id), "reason": body.reason}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pending/list")
async def get_pending_claims(
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(verify_admin),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    try:
        offset = (page - 1) * limit
        result = await db.execute(
            select(Claim)
            .where(Claim.status.in_(["pending", "fraud_check"]))
            .order_by(Claim.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        claims = result.scalars().all()

        total_result = await db.execute(
            select(func.count(Claim.id)).where(Claim.status.in_(["pending", "fraud_check"]))
        )
        total = total_result.scalar() or 0

        return {
            "claims": [
                {
                    "id": str(c.id),
                    "rider_id": str(c.rider_id),
                    "trigger_type": c.trigger_type,
                    "affected_zone_h3": c.affected_zone_h3,
                    "srs_score": c.srs_score,
                    "calculated_payout_rs": c.calculated_payout_rs,
                    "status": c.status,
                    "fraud_flags": c.fraud_flags or [],
                    "created_at": c.created_at.isoformat() if c.created_at else None,
                }
                for c in claims
            ],
            "total": total,
            "page": page,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
