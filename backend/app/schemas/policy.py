from pydantic import BaseModel
from datetime import datetime

class PolicyBase(BaseModel):
    tier: str
    zone_id: str

class PolicyCreate(PolicyBase):
    user_id: int
    enable_buyback: bool = False  # Optional: activate Exclusion Buyback add-on

class PolicyResponse(PolicyBase):
    id: int
    user_id: int
    weekly_premium: float
    is_active: bool
    has_buyback: bool
    buyback_premium: float
    created_at: datetime

    class Config:
        from_attributes = True
