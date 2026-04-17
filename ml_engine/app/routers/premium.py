"""Premium calculation — ML-powered with trained GradientBoosting model."""
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.premium_model import predict_premium, TIER_ENCODING

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
        # Compute zone risk
        try:
            zone_seed = int(req.zone_h3[-4:], 16) % 100
        except (ValueError, IndexError):
            zone_seed = 50
        zone_risk = 0.3 + (zone_seed / 150.0)

        # Seasonal factor
        month = datetime.now().month
        if month in [6, 7, 8, 9]:
            seasonal = 1.3
        elif month in [10, 11]:
            seasonal = 1.1
        else:
            seasonal = 1.0

        # Exposure
        exposure_norm = min(req.work_hours_per_week / 60.0, 1.2)

        # Zoink score normalized
        zoink_norm = req.zoink_score / 100.0

        # Tier encoding
        tier_enc = float(TIER_ENCODING.get(req.tier, 0))

        # Historical claim rate proxy
        hist_claim_rate = 0.10 + (zone_seed / 500.0)

        # Tenure (default moderate)
        tenure_norm = 0.5

        # Traffic baseline
        traffic_norm = 0.3 + (zone_seed / 200.0)

        features = [
            zone_risk,
            seasonal,
            exposure_norm,
            zoink_norm,
            tier_enc,
            hist_claim_rate,
            tenure_norm,
            traffic_norm,
        ]

        result = predict_premium(
            features,
            tier=req.tier,
            work_hours_per_week=req.work_hours_per_week,
        )

        return PremiumResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
