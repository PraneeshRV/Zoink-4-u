from pydantic import BaseModel
from typing import Optional, List
from datetime import date, time, datetime


# ─── Auth ─────────────────────────────────────────
class RegisterRequest(BaseModel):
    name: str
    phone: str
    platform: str
    zone_h3: str
    city: str
    shift_start: str  # HH:MM
    shift_end: str    # HH:MM
    aadhaar_last4: str
    mock_otp: str


class LoginRequest(BaseModel):
    phone: str
    mock_otp: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    rider_id: str
    name: str


# ─── Rider ────────────────────────────────────────
class RiderProfile(BaseModel):
    id: str
    name: str
    phone: str
    platform: str
    zone_h3: str
    city: str
    shift_start: str
    shift_end: str
    zoink_score: int
    is_verified: bool
    active_policy: Optional[dict] = None

    class Config:
        from_attributes = True


class RiderUpdate(BaseModel):
    zone_h3: Optional[str] = None
    city: Optional[str] = None
    shift_start: Optional[str] = None
    shift_end: Optional[str] = None


# ─── Policy ───────────────────────────────────────
class PolicyQuoteRequest(BaseModel):
    rider_id: str
    tier: str


class PolicySubscribeRequest(BaseModel):
    rider_id: str
    tier: str


class PolicyResponse(BaseModel):
    id: str
    rider_id: str
    tier: str
    weekly_premium_rs: float
    max_weekly_payout_rs: float
    coverage_start: str
    coverage_end: str
    status: str

    class Config:
        from_attributes = True


# ─── Claim ────────────────────────────────────────
class ClaimResponse(BaseModel):
    id: str
    policy_id: str
    rider_id: str
    trigger_type: str
    disruption_start: str
    disruption_end: Optional[str] = None
    affected_zone_h3: str
    srs_score: float
    payout_percentage: float
    calculated_payout_rs: float
    status: str
    fraud_flags: List[str] = []
    razorpay_payment_id: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


class ClaimRejectRequest(BaseModel):
    reason: str


# ─── Trigger ──────────────────────────────────────
class TriggerSimulateRequest(BaseModel):
    event_type: str
    zone_h3: str
    city: str
    severity: int
    duration_hours: int


class DisruptionEventResponse(BaseModel):
    id: str
    event_type: str
    zone_h3: str
    city: str
    severity: int
    started_at: str
    ended_at: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


# ─── Payout ───────────────────────────────────────
class PayoutResponse(BaseModel):
    claim_id: str
    txn_id: str
    status: str
    amount: float


# ─── Admin ────────────────────────────────────────
class DashboardStats(BaseModel):
    total_riders: int
    active_policies: int
    total_claims_this_week: int
    total_payout_this_week: float
    fraud_flags_pending: int
    loss_ratio: float
    top_affected_zones: list


class EarningsSummary(BaseModel):
    weeks: list  # list of { week, earnings, protected }
