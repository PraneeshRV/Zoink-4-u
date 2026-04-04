from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.wallet import Wallet, WalletTransaction
from pydantic import BaseModel

router = APIRouter(prefix="/wallets", tags=["Disruption Shield"])


class WalletResponse(BaseModel):
    user_id: int
    balance: float
    total_deposited: float
    total_withdrawn: float

    class Config:
        from_attributes = True


class WithdrawRequest(BaseModel):
    user_id: int
    amount: float
    reason: str  # Must be an excluded event type, e.g. "PANDEMIC_LOCKDOWN"


# ── Shield Deposit (called automatically on premium payment) ──

SHIELD_RATE = 0.03  # 3% of weekly premium

def auto_deposit_shield(user_id: int, weekly_premium: float, db: Session):
    """
    Called internally when a policy premium is charged.
    Deposits 3% into the rider's Disruption Shield wallet.
    """
    deposit_amount = round(weekly_premium * SHIELD_RATE, 2)

    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if not wallet:
        wallet = Wallet(user_id=user_id, balance=0.0, total_deposited=0.0, total_withdrawn=0.0)
        db.add(wallet)
        db.flush()

    wallet.balance += deposit_amount
    wallet.total_deposited += deposit_amount

    txn = WalletTransaction(
        wallet_id=wallet.id,
        transaction_type="SHIELD_DEPOSIT",
        amount=deposit_amount,
        reason=f"Auto-deposit: 3% of ₹{weekly_premium} weekly premium"
    )
    db.add(txn)
    return deposit_amount


# ── API Endpoints ──

@router.get("/{user_id}", response_model=WalletResponse)
def get_wallet_balance(user_id: int, db: Session = Depends(get_db)):
    """Get the rider's Disruption Shield wallet balance."""
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="No wallet found. Shield is created when your first premium is charged.")
    return WalletResponse(
        user_id=wallet.user_id,
        balance=wallet.balance,
        total_deposited=wallet.total_deposited,
        total_withdrawn=wallet.total_withdrawn
    )


@router.post("/{user_id}/withdraw")
def withdraw_from_shield(user_id: int, req: WithdrawRequest, db: Session = Depends(get_db)):
    """
    Withdraw from the Disruption Shield during an excluded event.
    The rider can only withdraw during events that are genuinely excluded 
    (the Shield exists precisely for events we can't insure).
    """
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="No wallet found.")

    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Withdrawal amount must be positive.")

    if req.amount > wallet.balance:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient balance. Available: ₹{wallet.balance}, Requested: ₹{req.amount}"
        )

    wallet.balance -= req.amount
    wallet.total_withdrawn += req.amount

    txn = WalletTransaction(
        wallet_id=wallet.id,
        transaction_type="EMERGENCY_WITHDRAWAL",
        amount=req.amount,
        reason=f"Emergency withdrawal during: {req.reason}"
    )
    db.add(txn)
    db.commit()

    return {
        "message": f"₹{req.amount} withdrawn from Disruption Shield.",
        "remaining_balance": wallet.balance,
        "reason": req.reason
    }
