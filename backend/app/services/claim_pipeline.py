"""
Auto-claim pipeline: processes disruption events and creates claims automatically.
Phase 3: Integrated GPS validation, behavioral analysis, and instant payouts.
"""
import uuid
import httpx
import logging
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_async_session_maker
from app.models.rider import Rider
from app.models.policy import Policy
from app.models.claim import Claim
from app.models.disruption_event import DisruptionEvent
from app.models.audit_log import AuditLog
from app.services.gps_validator import validate_gps, generate_mock_gps, get_zone_center
from app.services.behavioral_analyzer import analyze_rider_behavior, get_recent_claim_timestamps
from app.services.payment_gateway import create_instant_payout

logger = logging.getLogger("claim_pipeline")
ML_ENGINE_URL = "http://localhost:8001"


def calculate_srs(event_type: str, severity: int, time_of_day: int, zone_h3: str) -> float:
    """Calculate Severity-Risk Score."""
    base = severity / 10.0
    if (12 <= time_of_day <= 15) or (19 <= time_of_day <= 22):
        base *= 1.3
    month = datetime.now().month
    if month in [6, 7, 8, 9]:
        base *= 1.2
    return round(max(1.0, min(10.0, base * 10)), 2)


def srs_to_payout_percent(srs: float) -> float:
    """Convert SRS to payout percentage."""
    if srs <= 4:
        return 0.60
    elif srs <= 7:
        return 0.80
    else:
        return 1.00


async def update_zoink_score(session: AsyncSession, rider: Rider, has_fraud_flags: bool, fraud_confirmed: bool = False):
    """Update zoink score based on claim outcome."""
    if fraud_confirmed:
        rider.zoink_score = max(0, rider.zoink_score - 50)
        rider.is_banned = True
        rider.consecutive_clean_weeks = 0
    elif has_fraud_flags:
        rider.zoink_score = max(0, rider.zoink_score - 15)
        rider.consecutive_clean_weeks = 0
    else:
        rider.zoink_score = min(100, rider.zoink_score + 2)
        rider.consecutive_clean_weeks = (rider.consecutive_clean_weeks or 0) + 1
        if rider.consecutive_clean_weeks >= 5:
            rider.zoink_score = min(100, rider.zoink_score + 5)
            rider.consecutive_clean_weeks = 0
    await session.flush()


async def check_fraud(claim_data: dict) -> dict:
    """Call ML engine fraud check endpoint with enhanced features."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(f"{ML_ENGINE_URL}/fraud/check", json=claim_data)
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        logger.error(f"Fraud check failed: {e}")
        return {"fraud_score": 0.0, "flags": [], "recommendation": "approve"}


async def process_payout(claim_id: str, amount: float, rider_name: str = "Rider") -> dict:
    """Process instant payout via simulated Razorpay/UPI flow."""
    result = create_instant_payout(
        claim_id=claim_id,
        amount=amount,
        rider_name=rider_name,
    )
    return {
        "txn_id": result.get("razorpay_payment_id", f"mock_txn_{uuid.uuid4().hex[:12]}"),
        "status": result.get("status", "completed"),
        "payout_id": result.get("payout_id"),
        "upi_ref": result.get("payment_details", {}).get("upi_ref"),
        "bank_ref": result.get("payment_details", {}).get("bank_ref"),
    }


async def run_claim_pipeline(disruption_event_id: str) -> dict:
    """
    Main auto-claim pipeline:
    1. Load disruption event
    2. Find riders with active policies in affected zone
    3. GPS validation + behavioral analysis
    4. Create claims, run ML fraud checks, calculate payouts
    5. Process instant payouts via Razorpay/UPI simulation
    """
    async_session = get_async_session_maker()
    async with async_session() as session:
        try:
            # 1. Load disruption event
            result = await session.execute(
                select(DisruptionEvent).where(DisruptionEvent.id == disruption_event_id)
            )
            event = result.scalar_one_or_none()
            if not event:
                logger.error(f"Disruption event {disruption_event_id} not found")
                return {"error": "Event not found", "claims_created": 0}

            # 2. Find riders with active policies in zone
            riders_result = await session.execute(
                select(Rider).where(Rider.zone_h3 == event.zone_h3)
            )
            riders = riders_result.scalars().all()

            claims_created = 0
            claims_approved = 0
            claims_fraud_flagged = 0
            total_payout = 0.0
            payout_details = []

            zone_center_lat, zone_center_lon = get_zone_center(event.zone_h3)

            for rider in riders:
                # Find active policy
                policy_result = await session.execute(
                    select(Policy).where(
                        Policy.rider_id == rider.id,
                        Policy.status == "active"
                    )
                )
                policy = policy_result.scalar_one_or_none()
                if not policy:
                    continue

                # 3. GPS Validation (simulate GPS for pipeline)
                mock_gps = generate_mock_gps(event.zone_h3, spoofed=False)
                gps_result = validate_gps(
                    mock_gps["lat"], mock_gps["lon"], event.zone_h3
                )

                # 4. Behavioral Analysis
                behavior_result = await analyze_rider_behavior(
                    session, str(rider.id), event.zone_h3
                )

                # Get recent claim timestamps for velocity calc
                recent_timestamps = await get_recent_claim_timestamps(
                    session, str(rider.id)
                )

                # 5. Create claim
                now = datetime.now(timezone.utc)
                hour = now.hour
                srs = calculate_srs(event.event_type, event.severity, hour, event.zone_h3)
                payout_pct = srs_to_payout_percent(srs)
                lost_hours = event.duration_hours or 2
                raw_payout = lost_hours * 80 * payout_pct
                calculated_payout = round(min(policy.max_weekly_payout_rs, raw_payout), 2)

                claim = Claim(
                    id=str(uuid.uuid4()),
                    policy_id=policy.id,
                    rider_id=rider.id,
                    trigger_event_id=str(event.id),
                    trigger_type=event.event_type,
                    disruption_start=event.started_at,
                    disruption_end=event.ended_at,
                    affected_zone_h3=event.zone_h3,
                    srs_score=srs,
                    payout_percentage=payout_pct,
                    calculated_payout_rs=calculated_payout,
                    status="pending",
                    fraud_flags=[],
                    created_at=now,
                    updated_at=now,
                )
                session.add(claim)
                await session.flush()
                claims_created += 1

                # 6. Enhanced Fraud check with GPS + behavioral data
                recent_claims_result = await session.execute(
                    select(Claim).where(Claim.rider_id == rider.id)
                )
                recent_claims = len(recent_claims_result.scalars().all())

                zone_claims_result = await session.execute(
                    select(Claim).where(Claim.affected_zone_h3 == event.zone_h3)
                )
                zone_claimants = len(zone_claims_result.scalars().all())

                zone_policies_result = await session.execute(
                    select(Policy).join(Rider).where(
                        Rider.zone_h3 == event.zone_h3,
                        Policy.status == "active"
                    )
                )
                zone_active_policies = len(zone_policies_result.scalars().all())

                fraud_data = {
                    "rider_id": str(rider.id),
                    "zone_h3": event.zone_h3,
                    "event_type": event.event_type,
                    "claim_time_iso": now.isoformat(),
                    "rider_claim_count_last_8_weeks": recent_claims,
                    "zone_total_claimants": zone_claimants,
                    "zone_active_policies": zone_active_policies or 1,
                    # Phase 3 enhanced fields
                    "gps_lat": mock_gps["lat"],
                    "gps_lon": mock_gps["lon"],
                    "zone_center_lat": zone_center_lat,
                    "zone_center_lon": zone_center_lon,
                    "recent_claim_timestamps": recent_timestamps,
                    "rider_avg_claim_interval_days": None,
                }
                fraud_result = await check_fraud(fraud_data)

                # Combine ML fraud score with GPS and behavioral flags
                all_fraud_flags = fraud_result.get("flags", [])
                all_fraud_flags.extend(gps_result.get("flags", []))
                all_fraud_flags.extend(behavior_result.get("flags", []))

                combined_fraud_score = fraud_result.get("fraud_score", 0)
                # Boost fraud score if GPS or behavioral flags
                if gps_result.get("status") == "spoofed":
                    combined_fraud_score = min(1.0, combined_fraud_score + 0.3)
                if behavior_result.get("behavioral_score", 0) > 0.6:
                    combined_fraud_score = min(1.0, combined_fraud_score + 0.15)

                if combined_fraud_score > 0.7:
                    claim.status = "fraud_check"
                    claim.fraud_flags = list(set(all_fraud_flags))
                    claims_fraud_flagged += 1
                    await update_zoink_score(session, rider, has_fraud_flags=True)
                else:
                    claim.status = "approved"
                    claims_approved += 1

                    # 7. Process instant payout
                    payout_result = await process_payout(
                        str(claim.id), calculated_payout, rider.name
                    )
                    claim.razorpay_payment_id = payout_result["txn_id"]
                    claim.status = "paid"
                    total_payout += calculated_payout

                    payout_details.append({
                        "rider_name": rider.name,
                        "amount": calculated_payout,
                        "txn_id": payout_result["txn_id"],
                        "upi_ref": payout_result.get("upi_ref"),
                    })

                    await update_zoink_score(session, rider, has_fraud_flags=False)

                await session.flush()

                # 8. Audit log with enhanced data
                audit = AuditLog(
                    id=str(uuid.uuid4()),
                    entity_type="claim",
                    entity_id=str(claim.id),
                    action="auto_claim_pipeline_v3",
                    actor="system",
                    old_value=None,
                    new_value={
                        "status": claim.status,
                        "payout": calculated_payout,
                        "fraud_score": combined_fraud_score,
                        "gps_distance_km": gps_result.get("distance_km", 0),
                        "gps_status": gps_result.get("status", "unknown"),
                        "behavioral_score": behavior_result.get("behavioral_score", 0),
                        "behavioral_risk": behavior_result.get("risk_level", "unknown"),
                        "fraud_flags": all_fraud_flags,
                    },
                    created_at=now,
                )
                session.add(audit)

            await session.commit()

            result_summary = {
                "event_id": str(event.id),
                "event_type": event.event_type,
                "zone_h3": event.zone_h3,
                "city": event.city,
                "claims_created": claims_created,
                "claims_approved": claims_approved,
                "claims_fraud_flagged": claims_fraud_flagged,
                "total_payout": round(total_payout, 2),
                "avg_payout": round(total_payout / max(claims_approved, 1), 2),
                "payout_details": payout_details,
                "pipeline_version": "3.0.0",
            }
            logger.info(f"Pipeline complete: {result_summary}")
            return result_summary

        except Exception as e:
            await session.rollback()
            logger.error(f"Claim pipeline error: {e}")
            raise
