"""7-day disruption forecast endpoint."""
import math
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Query
from typing import List
from pydantic import BaseModel

router = APIRouter(tags=["Forecast"])


class DayForecast(BaseModel):
    date: str
    disruption_probability: float
    risk_level: str
    suggested_action: str


@router.get("/forecast/zone", response_model=List[DayForecast])
async def forecast_zone(
    zone_h3: str = Query(...),
    city: str = Query(""),
):
    try:
        # Zone seed for determinism
        try:
            zone_seed = int(zone_h3[-4:], 16) % 100
        except (ValueError, IndexError):
            zone_seed = 50

        base_prob = 0.15 + (zone_seed / 250.0)
        today = datetime.now()
        forecasts = []

        for i in range(7):
            day = today + timedelta(days=i)
            day_of_year = day.timetuple().tm_yday

            # Sine-wave seasonal model
            seasonal = 0.5 + 0.5 * math.sin(2 * math.pi * (day_of_year - 152) / 365)
            # 152 ≈ June 1, peak monsoon

            prob = min(0.95, base_prob * (0.7 + 0.6 * seasonal))

            # Add weekend spike
            if day.weekday() >= 5:
                prob = min(0.95, prob * 1.15)

            if prob < 0.3:
                risk_level = "low"
                action = "Normal operations — no disruptions expected"
            elif prob < 0.6:
                risk_level = "medium"
                action = "Plan ahead — moderate disruption risk"
            else:
                risk_level = "high"
                action = "Consider shorter shifts — high disruption risk"

            forecasts.append(DayForecast(
                date=day.strftime("%Y-%m-%d"),
                disruption_probability=round(prob, 4),
                risk_level=risk_level,
                suggested_action=action,
            ))

        return forecasts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
