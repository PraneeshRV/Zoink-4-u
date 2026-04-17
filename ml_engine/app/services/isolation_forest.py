"""
Enhanced Isolation Forest — 8-feature anomaly detection for fraud.
Now includes GPS distance, behavioral score, weather match, and claim velocity.
"""
import numpy as np
import logging
from sklearn.ensemble import IsolationForest

logger = logging.getLogger("isolation_forest")

# Global model cache
_model = None
_metrics = {}

FEATURE_NAMES = [
    "claim_rate",
    "rider_claims_norm",
    "hour_norm",
    "gps_distance_norm",
    "weather_match_score",
    "claim_velocity",
    "off_hours_flag",
    "behavioral_score",
]


def _train_model():
    """Train on synthetic data: 800 normal + 100 anomaly rows with 8 features."""
    global _model, _metrics
    logger.info("Training Enhanced Isolation Forest (8 features)...")

    np.random.seed(42)

    # Normal data
    normal = np.column_stack([
        np.random.uniform(0.15, 0.85, 800),     # claim_rate: moderate
        np.random.uniform(0.0, 0.4, 800),        # rider claims: low
        np.random.uniform(0.25, 0.92, 800),      # hour: 6am-10pm
        np.random.uniform(0.0, 0.15, 800),       # GPS distance: close (0-3km norm)
        np.random.uniform(0.6, 1.0, 800),         # weather match: good
        np.random.uniform(0.0, 0.3, 800),         # claim velocity: low
        np.zeros(800),                             # regular hours
        np.random.uniform(0.0, 0.25, 800),        # behavioral: normal
    ])

    # Anomaly data (mixed fraud patterns)
    anomaly = np.column_stack([
        np.random.uniform(0.0, 0.15, 100),       # low claim rate
        np.random.uniform(0.6, 1.0, 100),         # high rider claims
        np.random.uniform(0.0, 1.0, 100),         # any hour
        np.random.uniform(0.3, 1.0, 100),         # far GPS (6-20km norm)
        np.random.uniform(0.0, 0.4, 100),         # poor weather match
        np.random.uniform(0.4, 1.0, 100),         # high velocity
        np.random.choice([0, 1], 100, p=[0.3, 0.7]),  # mostly off-hours
        np.random.uniform(0.5, 1.0, 100),         # anomalous behavior
    ])

    X = np.vstack([normal, anomaly])
    _model = IsolationForest(
        n_estimators=150,
        contamination=0.10,
        max_features=6,
        random_state=42,
    )
    _model.fit(X)

    # Evaluate on the data
    y_true = np.concatenate([np.ones(800), -np.ones(100)])  # 1=normal, -1=anomaly
    y_pred = _model.predict(X)
    accuracy = np.mean(y_true == y_pred)

    _metrics = {
        "model_type": "IsolationForest",
        "n_estimators": 150,
        "n_features": 8,
        "training_samples": len(X),
        "contamination": 0.10,
        "detection_accuracy": round(accuracy, 4),
        "feature_names": FEATURE_NAMES,
        "status": "trained",
    }

    logger.info(f"Enhanced Isolation Forest trained — Detection accuracy: {accuracy:.4f}")
    return _metrics


def get_isolation_forest_score(features: list) -> float:
    """
    Return anomaly score (0=normal, 1=anomalous).
    Accepts 3-feature (legacy) or 8-feature (enhanced) input.
    Higher = more suspicious.
    """
    global _model
    if _model is None:
        _train_model()

    try:
        # Pad 3-feature legacy input to 8 features
        if len(features) == 3:
            features = features + [0.0, 0.8, 0.1, 0, 0.1]

        X = np.array([features[:8]])
        # decision_function: negative = anomaly, positive = normal
        raw = _model.decision_function(X)[0]
        # Convert to 0-1 score where 1 = most anomalous
        score = max(0.0, min(1.0, -raw * 2.5))
        return round(score, 4)
    except Exception as e:
        logger.error(f"Isolation Forest error: {e}")
        return 0.0


def get_model_metrics() -> dict:
    return _metrics if _metrics else {"status": "not_trained"}
