"""Isolation Forest model trained on synthetic data for fraud detection."""
import numpy as np
import logging
from sklearn.ensemble import IsolationForest

logger = logging.getLogger("isolation_forest")

# Global model cache
_model = None


def _train_model():
    """Train on synthetic data: 500 normal + 50 anomaly rows."""
    global _model
    logger.info("Training Isolation Forest on synthetic data...")

    np.random.seed(42)

    # Normal data: claim_rate, rider_claims_norm, hour_norm
    normal = np.column_stack([
        np.random.uniform(0.2, 0.8, 500),      # claim_rate
        np.random.uniform(0.0, 0.5, 500),       # rider claims normalized
        np.random.uniform(0.25, 0.92, 500),     # hour normalized (6am-10pm)
    ])

    # Anomaly data
    anomaly = np.column_stack([
        np.random.uniform(0.0, 0.05, 50),       # very low claim rate
        np.random.uniform(0.7, 1.0, 50),         # very high rider claims
        np.random.uniform(0.08, 0.21, 50),       # off-hours (2am-5am)
    ])

    X = np.vstack([normal, anomaly])
    _model = IsolationForest(
        n_estimators=100,
        contamination=0.09,
        random_state=42,
    )
    _model.fit(X)
    logger.info("Isolation Forest trained successfully")


def get_isolation_forest_score(features: list) -> float:
    """
    Return anomaly score (0=normal, 1=anomalous).
    Higher = more suspicious.
    """
    global _model
    if _model is None:
        _train_model()

    try:
        X = np.array([features])
        # decision_function: negative = anomaly, positive = normal
        raw = _model.decision_function(X)[0]
        # Convert to 0-1 score where 1 = most anomalous
        score = max(0.0, min(1.0, -raw * 2))
        return round(score, 4)
    except Exception as e:
        logger.error(f"Isolation Forest error: {e}")
        return 0.0
