"""
Behavioral Analysis Service — Detects anomalous claim patterns.

Analyzes timing patterns, claim velocity, cross-rider collusion,
and historical behavior comparison for fraud detection.
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from collections import Counter
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.claim import Claim
from app.models.rider import Rider

logger = logging.getLogger("behavioral_analyzer")


async def analyze_rider_behavior(
    session: AsyncSession,
    rider_id: str,
    zone_h3: str,
    current_time: Optional[datetime] = None,
) -> dict:
    """
    Comprehensive behavioral analysis of a rider's claim patterns.
    
    Returns:
        dict with behavioral_score (0-1, higher=more suspicious),
        flags, and detailed analysis
    """
    now = current_time or datetime.now(timezone.utc)
    flags = []
    score = 0.0

    # ─── 1. Claim Frequency Analysis ────────────────────
    eight_weeks_ago = now - timedelta(weeks=8)
    recent_claims_result = await session.execute(
        select(Claim).where(
            and_(
                Claim.rider_id == rider_id,
                Claim.created_at >= eight_weeks_ago,
            )
        ).order_by(Claim.created_at.desc())
    )
    recent_claims = recent_claims_result.scalars().all()
    claim_count = len(recent_claims)

    if claim_count > 8:
        score += 0.25
        flags.append("EXCESSIVE_CLAIM_FREQUENCY")
    elif claim_count > 5:
        score += 0.10
        flags.append("HIGH_CLAIM_FREQUENCY")

    # ─── 2. Claim Velocity (acceleration detection) ─────
    if claim_count >= 3:
        claim_times = sorted([c.created_at for c in recent_claims if c.created_at])
        if len(claim_times) >= 3:
            # Compare recent vs older intervals
            recent_gap = (claim_times[-1] - claim_times[-2]).total_seconds() / 3600
            older_gap = (claim_times[-2] - claim_times[-3]).total_seconds() / 3600

            if recent_gap < 24 and older_gap > 72:
                score += 0.20
                flags.append("CLAIM_ACCELERATION_DETECTED")
            elif recent_gap < 12:
                score += 0.15
                flags.append("RAPID_SUCCESSIVE_CLAIMS")

    # ─── 3. Timing Pattern Analysis ─────────────────────
    if recent_claims:
        claim_hours = [c.created_at.hour for c in recent_claims if c.created_at]
        if claim_hours:
            hour_counter = Counter(claim_hours)
            most_common_hour, most_common_count = hour_counter.most_common(1)[0]

            # If >60% claims at the same hour → suspicious
            if most_common_count / max(len(claim_hours), 1) > 0.6 and claim_count > 2:
                score += 0.15
                flags.append(f"TIMING_PATTERN_HOUR_{most_common_hour}")

            # Off-hours pattern
            off_hours_count = sum(1 for h in claim_hours if 2 <= h <= 5)
            if off_hours_count / max(len(claim_hours), 1) > 0.3:
                score += 0.10
                flags.append("OFF_HOURS_PATTERN")

    # ─── 4. Trigger Type Clustering ─────────────────────
    if recent_claims:
        trigger_types = [c.trigger_type for c in recent_claims if c.trigger_type]
        if trigger_types:
            type_counter = Counter(trigger_types)
            most_common_type, type_count = type_counter.most_common(1)[0]

            # If >70% same trigger type → suspicious
            if type_count / max(len(trigger_types), 1) > 0.7 and claim_count > 3:
                score += 0.10
                flags.append(f"TRIGGER_CLUSTERING_{most_common_type}")

    # ─── 5. Cross-Rider Collusion Detection ─────────────
    one_hour_ago = now - timedelta(hours=1)
    zone_claims_result = await session.execute(
        select(func.count(func.distinct(Claim.rider_id))).where(
            and_(
                Claim.affected_zone_h3 == zone_h3,
                Claim.created_at >= one_hour_ago,
                Claim.rider_id != rider_id,
            )
        )
    )
    concurrent_claimers = zone_claims_result.scalar() or 0

    # Get total active riders in zone
    zone_riders_result = await session.execute(
        select(func.count(Rider.id)).where(Rider.zone_h3 == zone_h3)
    )
    total_zone_riders = zone_riders_result.scalar() or 1

    collusion_ratio = concurrent_claimers / max(total_zone_riders, 1)
    if collusion_ratio > 0.5 and concurrent_claimers > 3:
        score += 0.15
        flags.append("POSSIBLE_COLLUSION_DETECTED")
    elif concurrent_claimers > 5:
        score += 0.05
        flags.append("HIGH_CONCURRENT_CLAIMS_IN_ZONE")

    # ─── 6. Historical Comparison ───────────────────────
    # Compare rider's claim rate to zone average
    zone_avg_result = await session.execute(
        select(func.count(Claim.id)).where(
            and_(
                Claim.affected_zone_h3 == zone_h3,
                Claim.created_at >= eight_weeks_ago,
            )
        )
    )
    zone_total_claims = zone_avg_result.scalar() or 0
    zone_avg_per_rider = zone_total_claims / max(total_zone_riders, 1)

    if zone_avg_per_rider > 0 and claim_count > zone_avg_per_rider * 2.5:
        score += 0.10
        flags.append("CLAIMS_ABOVE_ZONE_BASELINE")

    # ─── 7. Fraud Flag History ──────────────────────────
    flagged_claims_result = await session.execute(
        select(func.count(Claim.id)).where(
            and_(
                Claim.rider_id == rider_id,
                Claim.status.in_(["fraud_check", "rejected"]),
            )
        )
    )
    past_fraud_flags = flagged_claims_result.scalar() or 0

    if past_fraud_flags > 2:
        score += 0.15
        flags.append("REPEAT_FRAUD_OFFENDER")
    elif past_fraud_flags > 0:
        score += 0.05
        flags.append("PRIOR_FRAUD_FLAGS")

    # Cap score at 1.0
    final_score = min(1.0, score)

    return {
        "behavioral_score": round(final_score, 4),
        "flags": flags,
        "risk_level": (
            "high" if final_score > 0.6 else
            "medium" if final_score > 0.3 else
            "low"
        ),
        "analysis": {
            "claims_in_8_weeks": claim_count,
            "concurrent_zone_claimers": concurrent_claimers,
            "zone_avg_claims_per_rider": round(zone_avg_per_rider, 2),
            "past_fraud_flags": past_fraud_flags,
            "collusion_ratio": round(collusion_ratio, 4),
        },
    }


async def get_recent_claim_timestamps(
    session: AsyncSession,
    rider_id: str,
    limit: int = 10,
) -> List[str]:
    """Get recent claim timestamps for velocity calculation."""
    result = await session.execute(
        select(Claim.created_at).where(
            Claim.rider_id == rider_id
        ).order_by(Claim.created_at.desc()).limit(limit)
    )
    timestamps = result.scalars().all()
    return [t.isoformat() for t in timestamps if t]
