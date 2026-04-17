"""Risk profiling endpoint — ML-powered with trained RandomForest model."""
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from app.services.risk_model import predict_risk

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
    class_probabilities: Dict[str, float] = {}
    model_confidence: float = 0.0


@router.post("/risk/profile", response_model=RiskProfileResponse)
async def get_risk_profile(req: RiskProfileRequest):
    try:
        # Compute feature values for ML model
        # Zone density: derived from zone hex seed
        try:
            zone_seed = int(req.zone_h3[-4:], 16) % 100
        except (ValueError, IndexError):
            zone_seed = 50
        zone_density = zone_seed / 100.0

        month = datetime.now().month
        day_of_week = datetime.now().weekday()

        # Historical claim rate proxy
        hist_claim_rate = 0.10 + (zone_seed / 500.0)

        # Weather baseline: seasonal and zone-based
        weather_baseline = 0.2
        if month in [6, 7, 8, 9]:
            weather_baseline = 0.7
        elif month in [10, 11]:
            weather_baseline = 0.4

        # Traffic baseline from zone
        traffic_baseline = 0.3 + (zone_seed / 200.0)

        features = [
            zone_density,                               # zone_density_norm
            float(month),                               # month
            float(day_of_week),                         # day_of_week
            hist_claim_rate,                             # historical_claim_rate
            weather_baseline,                            # weather_baseline
            traffic_baseline,                            # traffic_baseline
            min(req.work_hours_per_week / 60.0, 1.0),  # work_hours_norm
            min(req.months_active / 24.0, 1.0),         # months_active_norm
        ]

        result = predict_risk(features)

        return RiskProfileResponse(
            risk_tier=result["risk_tier"],
            disruption_probability_this_week=result["disruption_probability"],
            recommended_tier=result["recommended_tier"],
            risk_factors=result["risk_factors"],
            class_probabilities=result.get("class_probabilities", {}),
            model_confidence=result.get("confidence", 0.0),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
