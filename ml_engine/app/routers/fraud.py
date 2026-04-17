"""
Advanced Fraud Detection — ML-powered with GPS, behavioral, and weather validation.
Uses trained GradientBoosting classifier + Isolation Forest ensemble.
"""
import logging
from datetime import datetime
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from app.services.fraud_model import predict_fraud
from app.services.isolation_forest import get_isolation_forest_score

router = APIRouter(tags=["Fraud"])
logger = logging.getLogger("fraud")


class FraudCheckRequest(BaseModel):
    rider_id: str
    zone_h3: str
    event_type: str
    claim_time_iso: str
    rider_claim_count_last_8_weeks: int = 0
    zone_total_claimants: int = 0
    zone_active_policies: int = 1
    # Phase 3: Advanced fraud features
    gps_lat: Optional[float] = None
    gps_lon: Optional[float] = None
    zone_center_lat: Optional[float] = None
    zone_center_lon: Optional[float] = None
    weather_actual_rainfall: Optional[float] = None
    weather_claimed_disruption: Optional[str] = None
    recent_claim_timestamps: Optional[List[str]] = None
    rider_avg_claim_interval_days: Optional[float] = None


class FraudContributingFactor(BaseModel):
    feature: str
    value: float
    importance: float


class FraudCheckResponse(BaseModel):
    fraud_score: float
    flags: List[str]
    recommendation: str
    model_confidence: float = 0.0
    contributing_factors: List[FraudContributingFactor] = []
    gps_validated: bool = False
    behavioral_score: float = 0.0
    weather_cross_validated: bool = False


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate haversine distance in kilometers."""
    import math
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def _calculate_claim_velocity(timestamps: list) -> float:
    """Calculate claims per day from recent timestamps."""
    if not timestamps or len(timestamps) < 2:
        return 0.0
    try:
        parsed = sorted([
            datetime.fromisoformat(ts.replace("Z", "+00:00")) for ts in timestamps
        ])
        days_span = max(1, (parsed[-1] - parsed[0]).total_seconds() / 86400)
        return len(parsed) / days_span
    except Exception:
        return 0.0


def _weather_match_score(event_type: str, actual_rainfall: float = None) -> float:
    """Cross-validate if the weather actually matches the claimed disruption."""
    if actual_rainfall is None:
        return 0.7  # neutral if no data available

    if event_type == "T1_HEAVY_RAIN":
        if actual_rainfall > 40:
            return 1.0
        elif actual_rainfall > 20:
            return 0.7
        elif actual_rainfall > 5:
            return 0.3
        else:
            return 0.05  # very suspicious
    elif event_type == "T4_EXTREME_HEAT":
        return 0.8  # harder to fake heat
    elif event_type == "T3_SEVERE_AQI":
        return 0.8  # AQI data available
    else:
        return 0.7  # default neutral


@router.post("/fraud/check", response_model=FraudCheckResponse)
async def check_fraud(req: FraudCheckRequest):
    try:
        flags = []

        # ─── Compute features ──────────────────────────────

        # 1. Claim rate
        claim_rate = req.zone_total_claimants / max(req.zone_active_policies, 1)

        # 2. Rider claim frequency normalized
        rider_freq_norm = min(1.0, req.rider_claim_count_last_8_weeks / 10.0)

        # 3. Hour normalized
        try:
            claim_hour = datetime.fromisoformat(
                req.claim_time_iso.replace("Z", "+00:00")
            ).hour
        except Exception:
            claim_hour = 12
        hour_norm = claim_hour / 24.0

        # 4. GPS distance
        gps_distance_km = 0.0
        gps_validated = False
        if (req.gps_lat is not None and req.gps_lon is not None and
                req.zone_center_lat is not None and req.zone_center_lon is not None):
            gps_distance_km = _haversine_km(
                req.gps_lat, req.gps_lon,
                req.zone_center_lat, req.zone_center_lon
            )
            gps_validated = True
            if gps_distance_km > 10.0:
                flags.append("GPS_SPOOFING_DETECTED")
            elif gps_distance_km > 5.0:
                flags.append("GPS_LOCATION_MISMATCH")

        # 5. Weather cross-validation
        weather_match = _weather_match_score(
            req.event_type, req.weather_actual_rainfall
        )
        weather_cross_validated = req.weather_actual_rainfall is not None
        if weather_match < 0.2:
            flags.append("WEATHER_MISMATCH_SEVERE")
        elif weather_match < 0.4:
            flags.append("WEATHER_MISMATCH_MODERATE")

        # 6. Claim velocity
        claim_velocity = _calculate_claim_velocity(req.recent_claim_timestamps or [])
        if claim_velocity > 0.8:
            flags.append("HIGH_CLAIM_VELOCITY")

        # 7. Off-hours flag
        off_hours = 1.0 if 2 <= claim_hour <= 5 else 0.0
        if off_hours:
            flags.append("OFF_HOURS_CLAIM")

        # 8. Behavioral score (composite anomaly)
        behavioral_score = 0.0
        if rider_freq_norm > 0.6:
            behavioral_score += 0.3
        if claim_velocity > 0.5:
            behavioral_score += 0.3
        if gps_distance_km > 5:
            behavioral_score += 0.2
        if weather_match < 0.3:
            behavioral_score += 0.2
        behavioral_score = min(1.0, behavioral_score)

        # Rule flags for legacy compatibility
        if claim_rate < 0.10:
            flags.append("LOW_ZONE_ADOPTION")
        if req.rider_claim_count_last_8_weeks > 6:
            flags.append("HIGH_CLAIM_FREQUENCY")

        # ─── ML Model Prediction ──────────────────────────

        features = [
            claim_rate,
            rider_freq_norm,
            hour_norm,
            min(gps_distance_km / 20.0, 1.0),  # normalize GPS to 0-1
            weather_match,
            min(claim_velocity, 1.0),
            off_hours,
            behavioral_score,
        ]

        # Primary: GradientBoosting classifier
        ml_result = predict_fraud(features)

        # Secondary: Isolation Forest anomaly detection
        iso_score = get_isolation_forest_score(features)

        # Ensemble: weighted combination
        fraud_score = min(1.0,
                          ml_result["fraud_probability"] * 0.7 +
                          iso_score * 0.3)

        # Recommendation
        if fraud_score > 0.7:
            recommendation = "reject"
        elif fraud_score > 0.4:
            recommendation = "review"
        else:
            recommendation = "approve"

        contributing_factors = [
            FraudContributingFactor(**f)
            for f in ml_result.get("contributing_factors", [])
        ]

        return FraudCheckResponse(
            fraud_score=round(fraud_score, 4),
            flags=flags,
            recommendation=recommendation,
            model_confidence=ml_result.get("confidence", 0.0),
            contributing_factors=contributing_factors,
            gps_validated=gps_validated,
            behavioral_score=round(behavioral_score, 4),
            weather_cross_validated=weather_cross_validated,
        )
    except Exception as e:
        logger.error(f"Fraud check error: {e}")
        return FraudCheckResponse(
            fraud_score=0.0, flags=[], recommendation="approve"
        )
