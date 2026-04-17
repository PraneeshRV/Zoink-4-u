"""Payout routes: instant payout processing, status tracking, and history."""
import uuid
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.auth import verify_admin
from app.core.config import RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
from app.models.claim import Claim
from app.services.payment_gateway import (
    create_instant_payout,
    get_payout_status,
    simulate_webhook_callback,
    get_all_payouts,
)

router = APIRouter(prefix="/payouts", tags=["Payouts"])


@router.post("/process/{claim_id}")
async def process_payout(
    claim_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(verify_admin),
):
    try:
        result = await db.execute(select(Claim).where(Claim.id == claim_id))
        claim = result.scalar_one_or_none()
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")

        if claim.status not in ("approved", "pending"):
            raise HTTPException(
                status_code=400,
                detail=f"Claim status is '{claim.status}', cannot process payout"
            )

        # Use the instant payout gateway
        payout_result = create_instant_payout(
            claim_id=str(claim.id),
            amount=claim.calculated_payout_rs,
            rider_name="Rider",
        )

        claim.razorpay_payment_id = payout_result.get(
            "razorpay_payment_id",
            payout_result.get("payment_details", {}).get("razorpay_payment_id",
            f"mock_txn_{uuid.uuid4().hex[:12]}")
        )
        claim.status = "paid"
        await db.commit()

        return {
            "claim_id": str(claim.id),
            "txn_id": claim.razorpay_payment_id,
            "status": payout_result.get("status", "completed"),
            "amount": claim.calculated_payout_rs,
            "payout_id": payout_result.get("payout_id"),
            "payment_details": payout_result.get("payment_details", {}),
            "steps": payout_result.get("steps", []),
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{payout_id}")
async def payout_status(payout_id: str):
    """Get real-time status of a payout with step tracking."""
    status = get_payout_status(payout_id)
    if not status:
        raise HTTPException(status_code=404, detail="Payout not found")
    return status


@router.get("/webhook-sim/{payout_id}")
async def webhook_simulation(payout_id: str):
    """Simulate Razorpay webhook callback for a completed payout."""
    result = simulate_webhook_callback(payout_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.get("/active")
async def active_payouts():
    """Get all active/tracked payouts."""
    return get_all_payouts()


@router.get("/history")
async def payout_history(
    rider_id: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    try:
        query = select(Claim).where(Claim.status == "paid")
        if rider_id:
            query = query.where(Claim.rider_id == rider_id)
        query = query.order_by(Claim.updated_at.desc()).limit(50)

        result = await db.execute(query)
        claims = result.scalars().all()

        return [
            {
                "claim_id": str(c.id),
                "rider_id": str(c.rider_id),
                "amount": c.calculated_payout_rs,
                "txn_id": c.razorpay_payment_id,
                "trigger_type": c.trigger_type,
                "paid_at": c.updated_at.isoformat() if c.updated_at else None,
            }
            for c in claims
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
