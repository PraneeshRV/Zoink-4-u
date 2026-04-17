"""
Mock Payment Gateway Service — Simulated Razorpay + UPI instant payout.

Generates realistic transaction flows with step-by-step status tracking.
Supports Razorpay test mode order creation and UPI transfer simulation.
"""
import uuid
import logging
import random
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger("payment_gateway")

# Store active payouts for status tracking
_active_payouts = {}

# Realistic bank reference prefixes
UPI_BANKS = ["AXIS", "HDFC", "ICICI", "SBI", "KOTAK", "YES", "PNB", "BOB"]
RAZORPAY_PREFIXES = ["pay_", "order_", "rfnd_"]


def _generate_razorpay_id(prefix: str = "pay_") -> str:
    """Generate a realistic Razorpay-style ID."""
    return f"{prefix}{uuid.uuid4().hex[:14]}"


def _generate_upi_ref() -> str:
    """Generate a realistic UPI transaction reference."""
    bank = random.choice(UPI_BANKS)
    ref = random.randint(100000000000, 999999999999)
    return f"{bank}{ref}"


def _generate_bank_ref() -> str:
    """Generate a realistic bank reference number."""
    return f"NEFT{random.randint(10000000, 99999999)}"


class PayoutFlow:
    """Represents a step-by-step payout flow with status tracking."""

    STEPS = [
        {"step": 1, "name": "claim_verified", "label": "Claim Verified by AI", "icon": "✅"},
        {"step": 2, "name": "fraud_cleared", "label": "Fraud Check Passed", "icon": "🔒"},
        {"step": 3, "name": "order_created", "label": "Payment Order Created", "icon": "📋"},
        {"step": 4, "name": "upi_initiated", "label": "UPI Transfer Initiated", "icon": "📲"},
        {"step": 5, "name": "payment_confirmed", "label": "Payment Confirmed", "icon": "💰"},
    ]

    def __init__(self, claim_id: str, amount: float, rider_name: str = "Rider"):
        self.payout_id = _generate_razorpay_id("pout_")
        self.claim_id = claim_id
        self.amount = amount
        self.rider_name = rider_name
        self.created_at = datetime.now(timezone.utc)
        self.current_step = 0
        self.status = "initiated"
        self.razorpay_order_id = None
        self.razorpay_payment_id = None
        self.upi_ref = None
        self.bank_ref = None

    def to_dict(self) -> dict:
        return {
            "payout_id": self.payout_id,
            "claim_id": self.claim_id,
            "amount": self.amount,
            "status": self.status,
            "current_step": self.current_step,
            "total_steps": len(self.STEPS),
            "steps": [
                {**step, "completed": step["step"] <= self.current_step}
                for step in self.STEPS
            ],
            "razorpay_order_id": self.razorpay_order_id,
            "razorpay_payment_id": self.razorpay_payment_id,
            "upi_ref": self.upi_ref,
            "bank_ref": self.bank_ref,
            "created_at": self.created_at.isoformat(),
        }


def create_instant_payout(
    claim_id: str,
    amount: float,
    rider_name: str = "Rider",
    rider_upi_id: Optional[str] = None,
) -> dict:
    """
    Create a simulated instant payout with full Razorpay test-mode flow.

    Returns complete payout details with transaction IDs and step tracking.
    """
    flow = PayoutFlow(claim_id, amount, rider_name)

    # Step 1: Claim verified
    flow.current_step = 1

    # Step 2: Fraud cleared
    flow.current_step = 2

    # Step 3: Create Razorpay order (simulated)
    flow.razorpay_order_id = _generate_razorpay_id("order_")
    flow.current_step = 3

    # Step 4: UPI transfer
    flow.razorpay_payment_id = _generate_razorpay_id("pay_")
    flow.upi_ref = _generate_upi_ref()
    upi_id = rider_upi_id or f"{rider_name.lower().replace(' ', '')}@upi"
    flow.current_step = 4

    # Step 5: Payment confirmed
    flow.bank_ref = _generate_bank_ref()
    flow.current_step = 5
    flow.status = "completed"

    # Store for tracking
    _active_payouts[flow.payout_id] = flow

    result = flow.to_dict()
    result["payment_details"] = {
        "method": "UPI",
        "upi_id": upi_id,
        "upi_ref": flow.upi_ref,
        "bank_ref": flow.bank_ref,
        "currency": "INR",
        "amount_paise": int(amount * 100),
        "razorpay_order_id": flow.razorpay_order_id,
        "razorpay_payment_id": flow.razorpay_payment_id,
        "mode": "test",  # always test mode for hackathon
    }

    logger.info(
        f"Instant payout created: {flow.payout_id} | "
        f"₹{amount} → {upi_id} | "
        f"Razorpay: {flow.razorpay_payment_id}"
    )

    return result


def get_payout_status(payout_id: str) -> Optional[dict]:
    """Get current status of a payout."""
    flow = _active_payouts.get(payout_id)
    if flow:
        return flow.to_dict()
    return None


def simulate_webhook_callback(payout_id: str) -> dict:
    """
    Simulate a Razorpay webhook callback for payout completion.
    This mimics what Razorpay would send to your webhook endpoint.
    """
    flow = _active_payouts.get(payout_id)
    if not flow:
        return {"error": "Payout not found"}

    return {
        "event": "payout.processed",
        "entity": "event",
        "account_id": "acc_zoink4u_test",
        "contains": ["payout"],
        "payload": {
            "payout": {
                "entity": {
                    "id": flow.razorpay_payment_id,
                    "fund_account_id": f"fa_{uuid.uuid4().hex[:14]}",
                    "amount": int(flow.amount * 100),
                    "currency": "INR",
                    "status": "processed",
                    "utr": flow.bank_ref,
                    "mode": "UPI",
                    "purpose": "insurance_payout",
                    "reference_id": flow.claim_id,
                    "narration": f"Zoink-4-u Claim Payout #{flow.claim_id[:8]}",
                    "created_at": int(flow.created_at.timestamp()),
                }
            }
        },
    }


def get_all_payouts() -> list:
    """Get all tracked payouts."""
    return [flow.to_dict() for flow in _active_payouts.values()]
