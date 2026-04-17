"""
Zoink-4-u Backend — FastAPI Application v3.0.0
Phase 3: Advanced fraud detection, instant payouts, intelligent dashboards.
"""
import logging
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import (
    auth_router, riders_router, policies_router,
    triggers_router, claims_router, payouts_router,
    admin_router, analytics_router,
)
from app.services.trigger_monitor import setup_scheduler

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("zoink")

app = FastAPI(
    title="Zoink-4-u Core Backend",
    description="Parametric income-loss insurance for gig delivery workers in India",
    version="3.0.0",
)

# CORS — allow frontend on localhost:5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(auth_router)
app.include_router(riders_router)
app.include_router(policies_router)
app.include_router(triggers_router)
app.include_router(claims_router)
app.include_router(payouts_router)
app.include_router(admin_router)
app.include_router(analytics_router)

# Setup background trigger monitor
setup_scheduler(app)


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "version": "3.0.0",
        "features": [
            "auth", "riders", "policies", "triggers",
            "claims", "payouts", "admin", "analytics",
            "fraud_detection_ml", "gps_validation",
            "behavioral_analysis", "instant_payouts",
            "auto_claim_pipeline_v3", "trigger_monitor",
            "predictive_analytics",
        ],
    }
