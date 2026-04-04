from pydantic import BaseModel
from datetime import datetime

class TriggerEvent(BaseModel):
    zone_id: str
    trigger_type: str # e.g., "HEAVY_RAIN", "APP_OUTAGE", "AQI_EMERGENCY"
    severity: int # 1 to 10

class ClaimResponse(BaseModel):
    id: int
    policy_id: int
    zone_id: str
    trigger_reason: str
    payout_amount: float
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True
