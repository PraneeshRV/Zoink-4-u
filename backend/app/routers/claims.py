from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.policy import Policy
from app.models.user import User
from app.models.claim import Claim
from app.schemas.claim import TriggerEvent, ClaimResponse
from app.services.exclusions import check_exclusion, get_exclusion_summary
from typing import List

router = APIRouter(prefix="/claims", tags=["Claims Automation"])

@router.post("/trigger", response_model=List[ClaimResponse])
def process_automated_trigger(event: TriggerEvent, db: Session = Depends(get_db)):
    """
    The core parametric claims pipeline. Processes trigger events through:
    
    1. EXCLUSION REGISTRY CHECK (Hard/Soft classification)
    2. BUYBACK partial coverage check (if rider has add-on)
    3. SAFE RETURN mid-delivery check (for sudden events)
    4. PAYOUT CALCULATION (severity-scaled, tier-based)
    """
    
    # ── STEP 1: Find all active policies in the affected zone ──
    affected_policies = db.query(Policy).filter(
        Policy.zone_id == event.zone_id,
        Policy.is_active == True
    ).all()
    
    if not affected_policies:
        return []
    
    payouts = []
    
    for policy in affected_policies:
        # Get the rider's delivery status for Safe Return check
        user = db.query(User).filter(User.id == policy.user_id).first()
        is_delivering = user.delivery_status == "DELIVERING" if user else False
        
        # ── STEP 2: EXCLUSION CHECK (enhanced with Buyback + Safe Return) ──
        exclusion_result = check_exclusion(
            trigger_type=event.trigger_type,
            has_buyback=policy.has_buyback,
            is_delivering=is_delivering
        )
        
        action = exclusion_result["action"]
        
        # HARD BLOCKED — skip this rider entirely
        if action == "BLOCK":
            continue
        
        # ── STEP 3: CALCULATE PAYOUT ──
        base_payout = 400.0
        if policy.tier == "Bronze":
            base_payout = 200.0
        elif policy.tier == "Gold":
            base_payout = 600.0
        elif policy.tier == "Platinum":
            base_payout = 1000.0
            
        severity_multiplier = event.severity / 10.0
        normal_payout = round(base_payout * severity_multiplier, 2)
        
        # Determine final payout based on exclusion action
        final_payout = normal_payout
        claim_status = "APPROVED_AND_PAID"
        
        if action == "BUYBACK_PARTIAL":
            # Buyback: apply partial percentage or flat payout
            flat = exclusion_result.get("flat_payout")
            if flat:
                final_payout = flat
            else:
                pct = exclusion_result.get("payout_percentage", 0.30)
                final_payout = round(normal_payout * pct, 2)
            claim_status = "BUYBACK_PARTIAL_PAID"
            
        elif action == "SAFE_RETURN":
            # Safe Return: micro-payout capped at max
            max_sr = exclusion_result.get("max_payout", 100.0)
            final_payout = min(normal_payout, max_sr)
            claim_status = "SAFE_RETURN_PAID"
        
        # ── STEP 4: CREATE CLAIM RECORD ──
        claim = Claim(
            policy_id=policy.id,
            zone_id=event.zone_id,
            trigger_reason=event.trigger_type,
            payout_amount=final_payout,
            status=claim_status
        )
        db.add(claim)
        payouts.append(claim)
        
    db.commit()
    
    for claim in payouts:
        db.refresh(claim)
        
    return payouts


@router.get("/exclusions")
def get_exclusions():
    """
    Returns the full list of excluded trigger categories (HARD + SOFT).
    Used by the frontend onboarding flow for informed consent.
    """
    return {
        "excluded_categories": get_exclusion_summary(),
        "message": "These event types are excluded from Zoink-4-u coverage per IRDAI guidelines. "
                   "SOFT exclusions may be partially covered via the Buyback add-on or Safe Return guarantee."
    }
