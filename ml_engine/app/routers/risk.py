"""Risk profiling endpoint."""
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

router = APIRouter(tags=["Risk"])


class RiskProfileRequest(BaseModel):
    zone_h3: str
    city: str = ""
    work_hours_per_week: int = 40
    platform: str = ""
    months_active: int = 1


class RiskProfileResponse(BaseModel):
    risk_tier: str
    disruption_probability_this_week: float
    recommended_tier: str
    risk_factors: List[str]


@router.post("/risk/profile", response_model=RiskProfileResponse)
async def get_risk_profile(req: RiskProfileRequest):
    try:
        # Zone-based probability
        try:
            zone_seed = int(req.zone_h3[-4:], 16) % 100
        except (ValueError, IndexError):
            zone_seed = 50
        base_prob = 0.15 + (zone_seed / 250.0)

        month = datetime.now().month
        if month in [6, 7, 8, 9]:
            base_prob *= 1.5

        prob = min(0.95, base_prob)

        # Determine risk tier
        if prob < 0.3:
            risk_tier = "low"
            recommended = "bronze"
        elif prob < 0.6:
            risk_tier = "medium"
            recommended = "silver"
        else:
            risk_tier = "high"
            recommended = "gold"

        # Risk factors
        factors = []
        if month in [6, 7, 8, 9]:
            factors.append("Monsoon season increases disruption risk by 50%")
        if zone_seed > 60:
            factors.append("High-density delivery zone with frequent gridlock")
        if req.work_hours_per_week > 50:
            factors.append("Extended work hours increase exposure")
        if req.months_active < 3:
            factors.append("New rider — limited historical data")
        if not factors:
            factors.append("Normal risk profile for this zone and season")

        return RiskProfileResponse(
            risk_tier=risk_tier,
            disruption_probability_this_week=round(prob, 4),
            recommended_tier=recommended,
            risk_factors=factors,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
