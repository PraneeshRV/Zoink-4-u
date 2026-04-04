import httpx
from fastapi import HTTPException

# URL of the ML Engine (runs on port 8001)
ML_ENGINE_URL = "http://localhost:8001/pricing/calculate"

def calculate_premium(tier: str, zone_id: str) -> float:
    payload = {
        "zone_id": zone_id,
        "tier": tier,
        "work_hours_estimated": 40
    }
    try:
        response = httpx.post(ML_ENGINE_URL, json=payload, timeout=5.0)
        response.raise_for_status()
        data = response.json()
        return data["dynamic_premium"]
    except Exception as e:
        # Fallback pricing in case ML engine is down 
        # (Benefit of Doubt protocol from policy strategy)
        base_rates = {"Bronze": 29.0, "Silver": 49.0, "Gold": 69.0, "Platinum": 99.0}
        return base_rates.get(tier, 29.0)

