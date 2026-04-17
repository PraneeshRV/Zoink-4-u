"""7-day disruption forecast — ML-powered Holt-Winters exponential smoothing."""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from app.services.forecast_model import forecast_zone

router = APIRouter(tags=["Forecast"])


class ConfidenceInterval(BaseModel):
    lower: float
    upper: float


class DayForecast(BaseModel):
    date: str
    disruption_probability: float
    risk_level: str
    suggested_action: str
    confidence_interval: Optional[ConfidenceInterval] = None


@router.get("/forecast/zone", response_model=List[DayForecast])
async def get_zone_forecast(
    zone_h3: str = Query(...),
    city: str = Query(""),
    days: int = Query(7, ge=1, le=14),
):
    try:
        forecasts_raw = forecast_zone(zone_h3, steps=days)

        forecasts = []
        for f in forecasts_raw:
            ci = None
            if "confidence_interval" in f:
                ci = ConfidenceInterval(**f["confidence_interval"])

            forecasts.append(DayForecast(
                date=f["date"],
                disruption_probability=f["disruption_probability"],
                risk_level=f["risk_level"],
                suggested_action=f["suggested_action"],
                confidence_interval=ci,
            ))

        return forecasts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
