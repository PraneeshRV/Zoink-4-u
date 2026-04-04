from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.community_fund import CommunityFund, FundTransaction
from pydantic import BaseModel

router = APIRouter(prefix="/community-fund", tags=["Community Resilience Fund"])


class FundResponse(BaseModel):
    zone_id: str
    balance: float
    total_contributed: float
    total_granted: float

    class Config:
        from_attributes = True


class GrantRequest(BaseModel):
    zone_id: str
    user_id: int
    amount: float
    reason: str  # e.g., "COVID-19 emergency grant"


# ── Fund Contribution (called automatically on premium payment) ──

FUND_RATE = 0.01  # 1% of weekly premium

def auto_contribute_to_fund(zone_id: str, weekly_premium: float, db: Session):
    """
    Called internally when a policy premium is charged.
    Deposits 1% into the zone's Community Resilience Fund.
    """
    contribution = round(weekly_premium * FUND_RATE, 2)

    fund = db.query(CommunityFund).filter(CommunityFund.zone_id == zone_id).first()
    if not fund:
        fund = CommunityFund(zone_id=zone_id, balance=0.0, total_contributed=0.0, total_granted=0.0)
        db.add(fund)
        db.flush()

    fund.balance += contribution
    fund.total_contributed += contribution

    txn = FundTransaction(
        fund_id=fund.id,
        transaction_type="CONTRIBUTION",
        amount=contribution,
        reason=f"Auto-contribution: 1% of ₹{weekly_premium} premium"
    )
    db.add(txn)
    return contribution


# ── API Endpoints ──

@router.get("/{zone_id}", response_model=FundResponse)
def get_fund_balance(zone_id: str, db: Session = Depends(get_db)):
    """Get the community fund balance for a zone."""
    fund = db.query(CommunityFund).filter(CommunityFund.zone_id == zone_id).first()
    if not fund:
        return FundResponse(zone_id=zone_id, balance=0.0, total_contributed=0.0, total_granted=0.0)
    return FundResponse(
        zone_id=fund.zone_id,
        balance=fund.balance,
        total_contributed=fund.total_contributed,
        total_granted=fund.total_granted
    )


@router.post("/grant")
def release_emergency_grant(req: GrantRequest, db: Session = Depends(get_db)):
    """
    Admin endpoint to release an emergency grant from the community fund.
    Used during major excluded events (pandemic, floods beyond coverage).
    NOT insurance — this is community support. CSR tax-deductible.
    """
    fund = db.query(CommunityFund).filter(CommunityFund.zone_id == req.zone_id).first()
    if not fund:
        raise HTTPException(status_code=404, detail=f"No community fund exists for zone {req.zone_id}")

    if req.amount > fund.balance:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient fund balance. Available: ₹{fund.balance}, Requested: ₹{req.amount}"
        )

    fund.balance -= req.amount
    fund.total_granted += req.amount

    txn = FundTransaction(
        fund_id=fund.id,
        transaction_type="EMERGENCY_GRANT",
        amount=req.amount,
        user_id=req.user_id,
        reason=req.reason
    )
    db.add(txn)
    db.commit()

    return {
        "message": f"Emergency grant of ₹{req.amount} released to rider {req.user_id} from zone {req.zone_id} community fund.",
        "remaining_fund_balance": fund.balance,
        "reason": req.reason
    }
