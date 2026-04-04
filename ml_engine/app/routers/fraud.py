"""Fraud detection with Isolation Forest + rule-based checks."""
import logging
import numpy as np
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.isolation_forest import get_isolation_forest_score

router = APIRouter(tags=["Fraud"])
logger = logging.getLogger("fraud")


class FraudCheckRequest(BaseModel):
    rider_id: str
    zone_h3: str
    event_type: str
    claim_time_iso: str
    rider_claim_count_last_8_weeks: int = 0
    zone_total_claimants: int = 0
    zone_active_policies: int = 1


class FraudCheckResponse(BaseModel):
    fraud_score: float
    flags: List[str]
    recommendation: str


@router.post("/fraud/check", response_model=FraudCheckResponse)
async def check_fraud(req: FraudCheckRequest):
    try:
        flags = []
        fraud_score = 0.0

        # Rule 1: Claim rate vs zone peers
        claim_rate = req.zone_total_claimants / max(req.zone_active_policies, 1)
        if claim_rate < 0.10:
            flags.append("LOW_ZONE_ADOPTION")
            fraud_score += 0.4

        # Rule 2: Rider claim frequency
        if req.rider_claim_count_last_8_weeks > 6:
            flags.append("HIGH_CLAIM_FREQUENCY")
            fraud_score += 0.3

        # Rule 3: Time-based (off-hours)
        try:
            claim_hour = datetime.fromisoformat(req.claim_time_iso.replace("Z", "+00:00")).hour
        except Exception:
            claim_hour = 12
        if 2 <= claim_hour <= 5:
            flags.append("OFF_HOURS_CLAIM")
            fraud_score += 0.25

        # Isolation Forest score
        features = [
            claim_rate,
            req.rider_claim_count_last_8_weeks / 10.0,
            claim_hour / 24.0,
        ]
        iso_score = get_isolation_forest_score(features)
        fraud_score = min(1.0, fraud_score + iso_score * 0.3)

        # Recommendation
        if fraud_score > 0.7:
            recommendation = "reject"
        elif fraud_score > 0.4:
            recommendation = "review"
        else:
            recommendation = "approve"

        return FraudCheckResponse(
            fraud_score=round(fraud_score, 4),
            flags=flags,
            recommendation=recommendation,
        )
    except Exception as e:
        logger.error(f"Fraud check error: {e}")
        return FraudCheckResponse(fraud_score=0.0, flags=[], recommendation="approve")
