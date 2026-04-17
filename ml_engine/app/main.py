"""
Zoink-4-u ML Engine — FastAPI Application v3.0.0
Trained ML models for premium pricing, fraud detection, risk profiling, disruption forecast.
All models are trained on synthetic data at startup.
"""
import logging
import time
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.premium import router as premium_router
from app.routers.fraud import router as fraud_router
from app.routers.risk import router as risk_router
from app.routers.forecast import router as forecast_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ml_engine")

app = FastAPI(
    title="Zoink-4-u ML Engine",
    description="Trained ML models for premium pricing, fraud detection, risk profiling, disruption forecast",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(premium_router)
app.include_router(fraud_router)
app.include_router(risk_router)
app.include_router(forecast_router)

# ─── Model training status ─────────────────────────────
_training_status = {"status": "initializing", "models": {}}


@app.on_event("startup")
async def train_all_models():
    """Pre-train all ML models at startup."""
    global _training_status
    logger.info("=" * 60)
    logger.info("  🧠 ML ENGINE v3.0.0 — Training all models at startup")
    logger.info("=" * 60)

    start = time.time()
    _training_status["status"] = "training"

    # 1. Fraud Detection Model (GradientBoosting)
    try:
        from app.services.fraud_model import train_fraud_model
        metrics = train_fraud_model()
        _training_status["models"]["fraud_detection"] = metrics
        logger.info(f"  ✅ Fraud Model: AUC={metrics.get('auc_roc', 'N/A')}")
    except Exception as e:
        logger.error(f"  ❌ Fraud Model training failed: {e}")
        _training_status["models"]["fraud_detection"] = {"status": "failed", "error": str(e)}

    # 2. Isolation Forest (Enhanced 8-feature)
    try:
        from app.services.isolation_forest import _train_model as train_iso
        from app.services.isolation_forest import get_model_metrics as iso_metrics
        train_iso()
        _training_status["models"]["isolation_forest"] = iso_metrics()
        logger.info(f"  ✅ Isolation Forest: 8-feature anomaly detector")
    except Exception as e:
        logger.error(f"  ❌ Isolation Forest training failed: {e}")
        _training_status["models"]["isolation_forest"] = {"status": "failed", "error": str(e)}

    # 3. Risk Classification Model (RandomForest)
    try:
        from app.services.risk_model import train_risk_model
        metrics = train_risk_model()
        _training_status["models"]["risk_classification"] = metrics
        logger.info(f"  ✅ Risk Model: Accuracy={metrics.get('accuracy', 'N/A')}")
    except Exception as e:
        logger.error(f"  ❌ Risk Model training failed: {e}")
        _training_status["models"]["risk_classification"] = {"status": "failed", "error": str(e)}

    # 4. Premium Pricing Model (GradientBoostingRegressor)
    try:
        from app.services.premium_model import train_premium_model
        metrics = train_premium_model()
        _training_status["models"]["premium_pricing"] = metrics
        logger.info(f"  ✅ Premium Model: R²={metrics.get('r2_score', 'N/A')}")
    except Exception as e:
        logger.error(f"  ❌ Premium Model training failed: {e}")
        _training_status["models"]["premium_pricing"] = {"status": "failed", "error": str(e)}

    # 5. Disruption Forecast Models (Holt-Winters per zone)
    try:
        from app.services.forecast_model import train_all_zones
        metrics = train_all_zones()
        _training_status["models"]["disruption_forecast"] = metrics
        logger.info(f"  ✅ Forecast Models: {metrics.get('zones_trained', 0)} zones, Avg MAE={metrics.get('avg_mae', 'N/A')}")
    except Exception as e:
        logger.error(f"  ❌ Forecast Models training failed: {e}")
        _training_status["models"]["disruption_forecast"] = {"status": "failed", "error": str(e)}

    elapsed = round(time.time() - start, 2)
    _training_status["status"] = "ready"
    _training_status["training_time_seconds"] = elapsed

    trained_count = sum(
        1 for m in _training_status["models"].values()
        if m.get("status") == "trained"
    )
    total_count = len(_training_status["models"])

    logger.info("=" * 60)
    logger.info(f"  🎯 {trained_count}/{total_count} models trained in {elapsed}s")
    logger.info("=" * 60)


@app.get("/health")
async def health():
    return {
        "status": "ml_engine_healthy",
        "version": "3.0.0",
        "ml_status": _training_status.get("status", "unknown"),
        "models_trained": sum(
            1 for m in _training_status.get("models", {}).values()
            if m.get("status") == "trained"
        ),
    }


@app.get("/models/status")
async def models_status():
    """Return detailed status and metrics for all trained ML models."""
    return _training_status
