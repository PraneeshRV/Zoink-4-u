from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.policy import Policy
from app.models.user import User
from app.schemas.policy import PolicyCreate, PolicyResponse
from app.services.pricing import calculate_premium
from app.routers.wallets import auto_deposit_shield
from app.routers.community_fund import auto_contribute_to_fund

router = APIRouter(prefix="/policies", tags=["Policies"])

# Buyback add-on pricing by tier
BUYBACK_PREMIUMS = {
    "Bronze": 8.0,
    "Silver": 12.0,
    "Gold": 15.0,
    "Platinum": 18.0,
}

@router.post("/", response_model=PolicyResponse)
def create_policy(policy_in: PolicyCreate, db: Session = Depends(get_db)):
    # Verify user exists
    user = db.query(User).filter(User.id == policy_in.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check if active policy exists
    active_policy = db.query(Policy).filter(Policy.user_id == user.id, Policy.is_active == True).first()
    if active_policy:
        raise HTTPException(status_code=400, detail="User already has an active policy")

    # Get ML-driven dynamic premium
    premium = calculate_premium(policy_in.tier, policy_in.zone_id)
    
    # Calculate buyback add-on if opted in
    buyback_premium = 0.0
    if policy_in.enable_buyback:
        buyback_premium = BUYBACK_PREMIUMS.get(policy_in.tier, 12.0)
    
    # Create the policy
    new_policy = Policy(
        user_id=policy_in.user_id,
        tier=policy_in.tier,
        zone_id=policy_in.zone_id,
        weekly_premium=premium,
        has_buyback=policy_in.enable_buyback,
        buyback_premium=buyback_premium
    )
    db.add(new_policy)
    db.flush()  # Get the ID before committing so we can do Shield + Fund

    # ── AUTO-DEPOSITS ──
    # 3% of premium → Rider's Disruption Shield Wallet
    shield_deposit = auto_deposit_shield(policy_in.user_id, premium, db)
    
    # 1% of premium → Zone Community Resilience Fund
    fund_contribution = auto_contribute_to_fund(policy_in.zone_id, premium, db)
    
    db.commit()
    db.refresh(new_policy)
    return new_policy
