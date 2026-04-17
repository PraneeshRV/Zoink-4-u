"""
Risk Classification Model — Random Forest

Trained on synthetic multi-city zone risk data. Replaces rule-based zone seed hashing.
Classifies zones into risk tiers with calibrated disruption probability.
"""
import numpy as np
import logging
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.preprocessing import LabelEncoder

logger = logging.getLogger("risk_model")

_model = None
_label_encoder = None
_metrics = {}

FEATURE_NAMES = [
    "zone_density_norm",        # normalized population density of zone
    "month",                    # 1-12
    "day_of_week",              # 0-6
    "historical_claim_rate",    # claims per policy in historical data
    "weather_baseline",         # avg rainfall/heat index for zone
    "traffic_baseline",         # avg congestion for zone
    "work_hours_norm",          # weekly hours normalized
    "months_active",            # rider tenure
]

TIER_MAP = {0: "low", 1: "medium", 2: "high"}


def _generate_training_data():
    """
    Generate synthetic risk classification dataset.
    Labels: 0=low, 1=medium, 2=high risk.
    """
    np.random.seed(42)
    n_per_class = 300

    # ─── Low risk zones ────────────────────────────
    low_risk = np.column_stack([
        np.random.uniform(0.1, 0.4, n_per_class),    # low density
        np.random.choice([1, 2, 3, 10, 11, 12], n_per_class),  # non-monsoon
        np.random.randint(0, 7, n_per_class),         # any day
        np.random.uniform(0.0, 0.15, n_per_class),   # low historical claims
        np.random.uniform(0.0, 0.3, n_per_class),    # low weather risk
        np.random.uniform(0.0, 0.3, n_per_class),    # low traffic
        np.random.uniform(0.3, 0.7, n_per_class),    # moderate hours
        np.random.uniform(3, 24, n_per_class),        # experienced riders
    ])

    # ─── Medium risk zones ─────────────────────────
    med_risk = np.column_stack([
        np.random.uniform(0.3, 0.7, n_per_class),    # moderate density
        np.random.choice([4, 5, 6, 9, 10], n_per_class),  # transition months
        np.random.randint(0, 7, n_per_class),
        np.random.uniform(0.10, 0.35, n_per_class),  # moderate claims
        np.random.uniform(0.2, 0.6, n_per_class),    # moderate weather
        np.random.uniform(0.3, 0.6, n_per_class),    # moderate traffic
        np.random.uniform(0.5, 0.9, n_per_class),    # higher hours
        np.random.uniform(1, 12, n_per_class),
    ])

    # ─── High risk zones ──────────────────────────
    high_risk = np.column_stack([
        np.random.uniform(0.6, 1.0, n_per_class),    # high density
        np.random.choice([6, 7, 8, 9], n_per_class),  # monsoon months
        np.random.randint(0, 7, n_per_class),
        np.random.uniform(0.25, 0.60, n_per_class),  # high historical claims
        np.random.uniform(0.5, 1.0, n_per_class),    # high weather risk
        np.random.uniform(0.5, 1.0, n_per_class),    # high traffic
        np.random.uniform(0.6, 1.0, n_per_class),    # long hours
        np.random.uniform(0, 6, n_per_class),         # newer riders
    ])

    X = np.vstack([low_risk, med_risk, high_risk])
    y = np.concatenate([
        np.zeros(n_per_class),
        np.ones(n_per_class),
        np.full(n_per_class, 2),
    ])

    return X, y


def train_risk_model():
    """Train Random Forest risk classifier."""
    global _model, _metrics
    logger.info("Training Risk Classification Model (RandomForest)...")

    X, y = _generate_training_data()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    _model = RandomForestClassifier(
        n_estimators=100,
        max_depth=8,
        min_samples_split=10,
        min_samples_leaf=5,
        random_state=42,
        class_weight="balanced",
    )
    _model.fit(X_train, y_train)

    y_pred = _model.predict(X_test)
    report = classification_report(y_test, y_pred, output_dict=True)

    _metrics = {
        "model_type": "RandomForestClassifier",
        "n_estimators": 100,
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "accuracy": round(report["accuracy"], 4),
        "per_class_f1": {
            TIER_MAP[int(float(k))]: round(v.get("f1-score", 0), 4)
            for k, v in report.items()
            if k in ("0.0", "1.0", "2.0")
        },
        "feature_importances": {
            name: round(imp, 4)
            for name, imp in zip(FEATURE_NAMES, _model.feature_importances_)
        },
        "status": "trained",
    }

    logger.info(f"Risk Model trained — Accuracy: {report['accuracy']:.4f}")
    return _metrics


def predict_risk(features: list) -> dict:
    """
    Predict risk tier and disruption probability.

    Args:
        features: list of 8 floats matching FEATURE_NAMES order

    Returns:
        dict with risk_tier, disruption_probability, confidence, risk_factors
    """
    global _model
    if _model is None:
        train_risk_model()

    try:
        X = np.array([features])
        pred_class = int(_model.predict(X)[0])
        probas = _model.predict_proba(X)[0]

        risk_tier = TIER_MAP.get(pred_class, "medium")

        # Disruption probability calibrated from class probabilities
        # Weighted: low=0.15, medium=0.45, high=0.75 base, adjusted by confidence
        base_probs = {0: 0.15, 1: 0.45, 2: 0.75}
        disruption_prob = sum(
            probas[i] * base_probs.get(i, 0.5) for i in range(len(probas))
        )

        # Recommended tier based on risk
        tier_recommendations = {0: "bronze", 1: "silver", 2: "gold"}
        recommended = tier_recommendations.get(pred_class, "silver")

        # Risk factors from feature values
        risk_factors = []
        month = int(features[1]) if len(features) > 1 else 1
        if month in [6, 7, 8, 9]:
            risk_factors.append("Monsoon season increases disruption risk by 50%")
        if features[0] > 0.6:
            risk_factors.append("High-density delivery zone with frequent gridlock")
        if features[6] > 0.7:
            risk_factors.append("Extended work hours increase exposure")
        if features[7] < 3:
            risk_factors.append("New rider — limited historical data")
        if features[4] > 0.5:
            risk_factors.append("Zone has elevated weather disruption baseline")
        if features[5] > 0.6:
            risk_factors.append("High average traffic congestion in this zone")
        if not risk_factors:
            risk_factors.append("Normal risk profile for this zone and season")

        return {
            "risk_tier": risk_tier,
            "disruption_probability": round(disruption_prob, 4),
            "recommended_tier": recommended,
            "risk_factors": risk_factors,
            "class_probabilities": {
                TIER_MAP[i]: round(float(p), 4) for i, p in enumerate(probas)
            },
            "confidence": round(float(max(probas)), 4),
        }
    except Exception as e:
        logger.error(f"Risk prediction error: {e}")
        return {
            "risk_tier": "medium",
            "disruption_probability": 0.4,
            "recommended_tier": "silver",
            "risk_factors": ["Error in prediction — using defaults"],
            "class_probabilities": {},
            "confidence": 0.0,
        }


def get_model_metrics() -> dict:
    return _metrics if _metrics else {"status": "not_trained"}
