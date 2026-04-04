"""
Database initialization script with seed data.
Run: python -m app.init_db
"""
import hashlib
import uuid
from datetime import date, time, datetime, timedelta, timezone
import random

from app.core.database import get_sync_engine, get_sync_session_maker, Base
from app.models import Rider, Policy, Claim, DisruptionEvent, AuditLog


# Tier configurations
TIER_CONFIG = {
    "bronze": {"weekly_premium": 29.0, "max_weekly_payout": 500.0},
    "silver": {"weekly_premium": 45.0, "max_weekly_payout": 1000.0},
    "gold": {"weekly_premium": 69.0, "max_weekly_payout": 2000.0},
    "platinum": {"weekly_premium": 99.0, "max_weekly_payout": 5000.0},
}

SEED_RIDERS = [
    {
        "name": "Deepak Kumar",
        "phone": "9876543210",
        "platform": "swiggy",
        "zone_h3": "8829e24dfffffff",
        "city": "Chennai",
        "shift_start": time(10, 0),
        "shift_end": time(22, 0),
        "tier": "gold",
        "zoink_score": 72,
    },
    {
        "name": "Shalini Reddy",
        "phone": "9876543211",
        "platform": "zomato",
        "zone_h3": "8831a91dfffffff",
        "city": "Hyderabad",
        "shift_start": time(9, 0),
        "shift_end": time(21, 0),
        "tier": "bronze",
        "zoink_score": 45,
    },
    {
        "name": "Mohammed Khan",
        "phone": "9876543212",
        "platform": "swiggy",
        "zone_h3": "883148c7fffffff",
        "city": "Bengaluru",
        "shift_start": time(8, 0),
        "shift_end": time(20, 0),
        "tier": "gold",
        "zoink_score": 85,
    },
    {
        "name": "Priya Sharma",
        "phone": "9876543213",
        "platform": "amazon",
        "zone_h3": "88292e3dfffffff",
        "city": "Mumbai",
        "shift_start": time(7, 0),
        "shift_end": time(19, 0),
        "tier": "silver",
        "zoink_score": 60,
    },
    {
        "name": "Ravi Nair",
        "phone": "9876543214",
        "platform": "zepto",
        "zone_h3": "88316899fffffff",
        "city": "Kochi",
        "shift_start": time(11, 0),
        "shift_end": time(23, 0),
        "tier": "bronze",
        "zoink_score": 50,
    },
    {
        "name": "Arjun Singh",
        "phone": "9876543215",
        "platform": "flipkart",
        "zone_h3": "88395cd7fffffff",
        "city": "Delhi",
        "shift_start": time(6, 0),
        "shift_end": time(18, 0),
        "tier": "platinum",
        "zoink_score": 92,
    },
]

TRIGGER_TYPES = [
    "T1_HEAVY_RAIN", "T2_FLOODING", "T3_SEVERE_AQI",
    "T4_EXTREME_HEAT", "T9_GRIDLOCK", "T10_CURFEW",
]

CLAIM_STATUSES = ["paid", "pending", "rejected", "paid", "paid", "approved"]


def create_aadhaar_token(phone: str, aadhaar_last4: str = "1234") -> str:
    return hashlib.sha256(f"{phone}{aadhaar_last4}".encode()).hexdigest()


def run_seed():
    sync_engine = get_sync_engine()
    SyncSession = get_sync_session_maker()

    print("🚀 Creating database tables...")
    Base.metadata.create_all(bind=sync_engine)
    print("✅ Tables created successfully.")

    session = SyncSession()
    try:
        # Check if data already exists
        existing = session.query(Rider).first()
        if existing:
            print("⚠️  Seed data already exists. Skipping.")
            return

        print("🌱 Seeding database...")
        now = datetime.now(timezone.utc)
        riders_created = []

        for rd in SEED_RIDERS:
            rider = Rider(
                id=str(uuid.uuid4()),
                aadhaar_token=create_aadhaar_token(rd["phone"]),
                name=rd["name"],
                phone=rd["phone"],
                platform=rd["platform"],
                zone_h3=rd["zone_h3"],
                city=rd["city"],
                shift_start=rd["shift_start"],
                shift_end=rd["shift_end"],
                zoink_score=rd["zoink_score"],
                is_verified=True,
                created_at=now - timedelta(days=random.randint(30, 90)),
                updated_at=now,
            )
            session.add(rider)
            session.flush()

            # Create active policy
            tier_cfg = TIER_CONFIG[rd["tier"]]
            policy = Policy(
                id=str(uuid.uuid4()),
                rider_id=rider.id,
                tier=rd["tier"],
                weekly_premium_rs=tier_cfg["weekly_premium"],
                max_weekly_payout_rs=tier_cfg["max_weekly_payout"],
                coverage_start=date.today() - timedelta(days=14),
                coverage_end=date.today() + timedelta(days=90),
                status="active",
                created_at=now - timedelta(days=14),
            )
            session.add(policy)
            session.flush()

            # Create 2-4 claims per rider
            num_claims = random.randint(2, 4)
            for c in range(num_claims):
                claim_status = CLAIM_STATUSES[c % len(CLAIM_STATUSES)]
                trigger_type = random.choice(TRIGGER_TYPES)
                srs = round(random.uniform(2.0, 9.0), 2)
                payout_pct = 0.60 if srs <= 4 else (0.80 if srs <= 7 else 1.00)
                payout = round(min(tier_cfg["max_weekly_payout"],
                                   random.randint(2, 6) * 80 * payout_pct), 2)
                disruption_start = now - timedelta(days=random.randint(1, 30),
                                                    hours=random.randint(0, 12))
                fraud_flags = []
                if claim_status == "rejected":
                    fraud_flags = ["HIGH_CLAIM_FREQUENCY"]

                claim = Claim(
                    id=str(uuid.uuid4()),
                    policy_id=policy.id,
                    rider_id=rider.id,
                    trigger_event_id=str(uuid.uuid4()),
                    trigger_type=trigger_type,
                    disruption_start=disruption_start,
                    disruption_end=disruption_start + timedelta(hours=random.randint(2, 8)),
                    affected_zone_h3=rd["zone_h3"],
                    srs_score=srs,
                    payout_percentage=payout_pct,
                    calculated_payout_rs=payout if claim_status in ("paid", "approved") else 0,
                    status=claim_status,
                    fraud_flags=fraud_flags,
                    razorpay_payment_id=f"mock_txn_{uuid.uuid4().hex[:12]}" if claim_status == "paid" else None,
                    created_at=disruption_start,
                    updated_at=now,
                )
                session.add(claim)

            riders_created.append(rider)

        # Create a couple of disruption events
        for i in range(3):
            event = DisruptionEvent(
                id=str(uuid.uuid4()),
                event_type=random.choice(TRIGGER_TYPES),
                zone_h3=SEED_RIDERS[i]["zone_h3"],
                city=SEED_RIDERS[i]["city"],
                severity=random.randint(5, 9),
                source_api="seed_data",
                raw_data={"source": "seed", "note": "Pre-seeded disruption event"},
                started_at=now - timedelta(hours=random.randint(1, 48)),
                ended_at=now - timedelta(hours=random.randint(0, 1)) if i > 0 else None,
                is_active=(i == 0),
                created_at=now - timedelta(hours=48),
            )
            session.add(event)

        session.commit()
        print(f"✅ Seeded {len(riders_created)} riders with policies and claims.")
        for r in riders_created:
            print(f"   👤 {r.name} ({r.platform}) — {r.city} — {r.zoink_score} zoink score")

    except Exception as e:
        session.rollback()
        print(f"❌ Seed error: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    run_seed()
