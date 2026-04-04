from fastapi import APIRouter
import random

router = APIRouter(prefix="/mock_api", tags=["External Oracles"])

@router.get("/weather/{zone_id}")
def get_weather(zone_id: str):
    """
    Mock IMD Weather Oracle. Can be polled by the backend to detect disruptions.
    """
    # 30% chance there's a heavy disruption
    if random.random() < 0.3:
        return {
            "is_disrupted": True,
            "trigger_type": "HEAVY_RAIN",
            "severity": 8,
            "rainfall_mm": 55.4
        }
    return {
        "is_disrupted": False,
        "trigger_type": "CLEAR",
        "severity": 1,
        "rainfall_mm": 0.0
    }
