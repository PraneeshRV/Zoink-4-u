"""Payout routes: process and history."""
import uuid
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.auth import verify_admin
from app.core.config import RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
from app.models.claim import Claim

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
            raise HTTPException(status_code=400, detail=f"Claim status is '{claim.status}', cannot process payout")

        # Try Razorpay if keys available, otherwise mock
        if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
            try:
                import razorpay
                client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
                payout_data = client.payment.create({
                    "amount": int(claim.calculated_payout_rs * 100),
                    "currency": "INR",
                    "notes": {"claim_id": str(claim.id)},
                })
                txn_id = payout_data.get("id", f"rzp_{uuid.uuid4().hex[:12]}")
                status = "processed"
            except Exception:
                txn_id = f"mock_txn_{uuid.uuid4().hex[:12]}"
                status = "simulated"
        else:
            txn_id = f"mock_txn_{uuid.uuid4().hex[:12]}"
            status = "simulated"

        claim.razorpay_payment_id = txn_id
        claim.status = "paid"
        await db.commit()

        return {
            "claim_id": str(claim.id),
            "txn_id": txn_id,
            "status": status,
            "amount": claim.calculated_payout_rs,
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


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
