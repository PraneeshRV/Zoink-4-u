"""
Admin Analytics Routes — Loss ratios, predictive analytics, fraud stats, revenue.
"""
import random
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.auth import verify_admin
from app.core.config import ZONE_DISPLAY_NAMES
from app.models.rider import Rider
from app.models.policy import Policy
from app.models.claim import Claim
from app.models.disruption_event import DisruptionEvent

router = APIRouter(prefix="/admin/analytics", tags=["Analytics"])


@router.get("/loss-ratio-trend")
async def loss_ratio_trend(
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(verify_admin),
    weeks: int = Query(8, ge=1, le=52),
):
    """Weekly loss ratio trend over time."""
    try:
        now = datetime.now(timezone.utc)
        trend = []

        for w in range(weeks, 0, -1):
            week_start = now - timedelta(weeks=w)
            week_end = now - timedelta(weeks=w - 1)

            # Payouts in this week
            payout_result = await db.execute(
                select(func.sum(Claim.calculated_payout_rs)).where(
                    and_(
                        Claim.status == "paid",
                        Claim.created_at >= week_start,
                        Claim.created_at < week_end,
                    )
                )
            )
            payouts = float(payout_result.scalar() or 0)

            # Premium collected (estimate from active policies)
            premium_result = await db.execute(
                select(func.sum(Policy.weekly_premium_rs)).where(
                    Policy.status == "active"
                )
            )
            weekly_premium = float(premium_result.scalar() or 1)

            loss_ratio = round((payouts / max(weekly_premium, 1)) * 100, 2)

            trend.append({
                "week": week_start.strftime("%b %d"),
                "week_start": week_start.isoformat(),
                "payouts": round(payouts, 2),
                "premium_collected": round(weekly_premium, 2),
                "loss_ratio": min(loss_ratio, 150),  # cap display at 150%
                "claims_count": 0,  # will be filled below
            })

        # Fill claims count
        for item in trend:
            ws = datetime.fromisoformat(item["week_start"])
            we = ws + timedelta(weeks=1)
            claims_result = await db.execute(
                select(func.count(Claim.id)).where(
                    and_(Claim.created_at >= ws, Claim.created_at < we)
                )
            )
            item["claims_count"] = claims_result.scalar() or 0

        return {"trend": trend, "weeks": weeks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/predictions")
async def predictive_analytics(
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(verify_admin),
):
    """Next week's predicted claims and risk by zone using ML forecasts."""
    try:
        import httpx

        # Get ML forecast for each known zone
        zone_predictions = []
        for zone_h3, display_name in ZONE_DISPLAY_NAMES.items():
            try:
                async with httpx.AsyncClient(timeout=3.0) as client:
                    resp = await client.get(
                        "http://localhost:8001/forecast/zone",
                        params={"zone_h3": zone_h3, "days": 7}
                    )
                    if resp.status_code == 200:
                        forecast = resp.json()
                        avg_prob = sum(
                            f["disruption_probability"] for f in forecast
                        ) / max(len(forecast), 1)
                        high_risk_days = sum(
                            1 for f in forecast if f["risk_level"] == "high"
                        )

                        # Estimate claims based on active policies and probability
                        policies_result = await db.execute(
                            select(func.count(Policy.id)).join(Rider).where(
                                and_(
                                    Rider.zone_h3 == zone_h3,
                                    Policy.status == "active"
                                )
                            )
                        )
                        active_policies = policies_result.scalar() or 0

                        predicted_claims = round(active_policies * avg_prob * 7, 1)

                        zone_predictions.append({
                            "zone_h3": zone_h3,
                            "zone_name": display_name,
                            "avg_disruption_probability": round(avg_prob, 4),
                            "high_risk_days": high_risk_days,
                            "active_policies": active_policies,
                            "predicted_claims_next_week": predicted_claims,
                            "risk_level": (
                                "high" if avg_prob > 0.5 else
                                "medium" if avg_prob > 0.3 else "low"
                            ),
                        })
            except Exception as e:
                zone_predictions.append({
                    "zone_h3": zone_h3,
                    "zone_name": display_name,
                    "error": str(e),
                })

        # Total predictions
        total_predicted = sum(
            z.get("predicted_claims_next_week", 0) for z in zone_predictions
        )

        return {
            "zone_predictions": zone_predictions,
            "total_predicted_claims": round(total_predicted, 1),
            "prediction_model": "HoltWinters_ExponentialSmoothing",
            "forecast_horizon": "7 days",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/fraud-stats")
async def fraud_statistics(
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(verify_admin),
):
    """Fraud detection statistics and breakdown."""
    try:
        now = datetime.now(timezone.utc)
        month_ago = now - timedelta(days=30)

        # Total claims
        total_claims = (await db.execute(
            select(func.count(Claim.id)).where(Claim.created_at >= month_ago)
        )).scalar() or 0

        # Fraud flagged
        fraud_flagged = (await db.execute(
            select(func.count(Claim.id)).where(
                and_(
                    Claim.status == "fraud_check",
                    Claim.created_at >= month_ago,
                )
            )
        )).scalar() or 0

        # Rejected
        rejected = (await db.execute(
            select(func.count(Claim.id)).where(
                and_(
                    Claim.status == "rejected",
                    Claim.created_at >= month_ago,
                )
            )
        )).scalar() or 0

        # Approved/Paid
        approved = (await db.execute(
            select(func.count(Claim.id)).where(
                and_(
                    Claim.status.in_(["approved", "paid"]),
                    Claim.created_at >= month_ago,
                )
            )
        )).scalar() or 0

        # Fraud detection rate
        detection_rate = round(
            (fraud_flagged + rejected) / max(total_claims, 1) * 100, 2
        )

        # Fraud flags breakdown
        flagged_claims_result = await db.execute(
            select(Claim.fraud_flags).where(
                and_(
                    Claim.fraud_flags.isnot(None),
                    Claim.created_at >= month_ago,
                )
            )
        )
        all_flags = []
        for row in flagged_claims_result.scalars().all():
            if isinstance(row, list):
                all_flags.extend(row)

        flag_counts = {}
        for flag in all_flags:
            flag_counts[flag] = flag_counts.get(flag, 0) + 1

        # Sort by frequency
        flag_breakdown = sorted(
            [{"flag": k, "count": v} for k, v in flag_counts.items()],
            key=lambda x: x["count"],
            reverse=True,
        )

        # Banned riders
        banned_count = (await db.execute(
            select(func.count(Rider.id)).where(Rider.is_banned == True)
        )).scalar() or 0

        return {
            "period": "last_30_days",
            "total_claims": total_claims,
            "fraud_flagged": fraud_flagged,
            "rejected": rejected,
            "approved": approved,
            "detection_rate_percent": detection_rate,
            "false_positive_estimate_percent": round(detection_rate * 0.15, 2),
            "flag_breakdown": flag_breakdown,
            "banned_riders": banned_count,
            "models_active": [
                "GradientBoosting_FraudClassifier",
                "IsolationForest_AnomalyDetector",
                "GPS_Validator",
                "BehavioralAnalyzer",
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/revenue")
async def revenue_analytics(
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(verify_admin),
):
    """Premium vs payout revenue analytics."""
    try:
        now = datetime.now(timezone.utc)

        # Total premium collected (active policies * weeks active)
        premium_result = await db.execute(
            select(func.sum(Policy.weekly_premium_rs)).where(Policy.status == "active")
        )
        weekly_premium = float(premium_result.scalar() or 0)
        # Estimate 4 weeks of collection
        total_premium = round(weekly_premium * 4, 2)

        # Total payouts
        total_payouts = (await db.execute(
            select(func.sum(Claim.calculated_payout_rs)).where(Claim.status == "paid")
        )).scalar() or 0
        total_payouts = round(float(total_payouts), 2)

        # Net position
        net_position = round(total_premium - total_payouts, 2)

        # Per-zone breakdown
        zone_breakdown = []
        for zone_h3, display_name in ZONE_DISPLAY_NAMES.items():
            zone_premium_result = await db.execute(
                select(func.sum(Policy.weekly_premium_rs)).join(Rider).where(
                    and_(
                        Rider.zone_h3 == zone_h3,
                        Policy.status == "active",
                    )
                )
            )
            zone_premium = float(zone_premium_result.scalar() or 0) * 4

            zone_payout_result = await db.execute(
                select(func.sum(Claim.calculated_payout_rs)).where(
                    and_(
                        Claim.affected_zone_h3 == zone_h3,
                        Claim.status == "paid",
                    )
                )
            )
            zone_payouts = float(zone_payout_result.scalar() or 0)

            zone_breakdown.append({
                "zone_h3": zone_h3,
                "zone_name": display_name,
                "premium_collected": round(zone_premium, 2),
                "payouts": round(zone_payouts, 2),
                "loss_ratio": round(
                    (zone_payouts / max(zone_premium, 1)) * 100, 2
                ),
                "net": round(zone_premium - zone_payouts, 2),
            })

        return {
            "total_premium_collected": total_premium,
            "total_payouts": total_payouts,
            "net_position": net_position,
            "overall_loss_ratio": round(
                (total_payouts / max(total_premium, 1)) * 100, 2
            ),
            "weekly_premium_run_rate": round(weekly_premium, 2),
            "zone_breakdown": zone_breakdown,
            "profitability": "profitable" if net_position > 0 else "loss",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
