"""Premium calculation using DGRI formula."""
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(tags=["Premium"])

BASE_RATES = {"bronze": 29, "silver": 45, "gold": 69, "platinum": 99}


class PremiumRequest(BaseModel):
    zone_h3: str
    city: str = ""
    tier: str
    work_hours_per_week: int = 40
    platform: str = ""
    zoink_score: int = 50


class PremiumResponse(BaseModel):
    premium_rs: float
    zone_risk: float
    seasonal_factor: float
    exposure_mult: float
    trust_factor: float
    breakdown: dict


@router.post("/premium/calculate", response_model=PremiumResponse)
async def calculate_premium(req: PremiumRequest):
    try:
        base = BASE_RATES.get(req.tier, 29)

        # Zone risk factor: hash zone_h3 to float 0.8-1.4
        try:
            zone_seed = int(req.zone_h3[-4:], 16) % 100
        except (ValueError, IndexError):
            zone_seed = 50
        zone_risk = round(0.8 + (zone_seed / 166.0), 4)

        # Seasonal factor
        month = datetime.now().month
        if month in [6, 7, 8, 9]:
            seasonal = 1.3
        elif month in [10, 11]:
            seasonal = 1.1
        else:
            seasonal = 1.0

        # Exposure multiplier
        hours = max(req.work_hours_per_week, 1)
        exposure = round((hours / 40.0) ** 1.1, 4)

        # Trust factor from zoink_score
        trust = round(1.0 - ((req.zoink_score - 50) / 200.0), 4)
        trust = max(0.75, min(1.25, trust))

        raw_premium = base * zone_risk * seasonal * exposure * trust

        # Cap at 2% of estimated weekly earnings
        est_weekly_earnings = hours * 80
        cap = est_weekly_earnings * 0.02
        final_premium = round(min(raw_premium, cap), 2)

        return PremiumResponse(
            premium_rs=final_premium,
            zone_risk=zone_risk,
            seasonal_factor=seasonal,
            exposure_mult=exposure,
            trust_factor=trust,
            breakdown={
                "base_rate": base,
                "raw_premium": round(raw_premium, 2),
                "cap": round(cap, 2),
                "est_weekly_earnings": est_weekly_earnings,
                "tier": req.tier,
                "zone_h3": req.zone_h3,
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
