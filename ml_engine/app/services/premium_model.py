"""
Premium Pricing Model — Gradient Boosting Regressor

Trained on synthetic actuarial data. Replaces formula-based premium calculation.
Outputs calibrated premium respecting the 2% weekly earnings cap.
"""
import numpy as np
import logging
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

logger = logging.getLogger("premium_model")

_model = None
_metrics = {}

BASE_RATES = {"bronze": 29, "silver": 45, "gold": 69, "platinum": 99}
TIER_ENCODING = {"bronze": 0, "silver": 1, "gold": 2, "platinum": 3}

FEATURE_NAMES = [
    "zone_risk_score",          # 0-1 zone risk from risk model
    "seasonal_factor",          # seasonal multiplier
    "exposure_hours_norm",      # work hours / 60
    "zoink_score_norm",         # zoink_score / 100
    "tier_encoded",             # 0-3 tier level
    "historical_claim_rate",    # zone historical claims per policy
    "months_active_norm",       # rider tenure / 24
    "traffic_congestion_norm",  # 0-1 traffic baseline
]


def _generate_training_data():
    """
    Generate synthetic actuarial premium dataset.
    Target: weekly premium in INR (roughly ₹20-120 range).
    """
    np.random.seed(42)
    n_samples = 1200

    zone_risk = np.random.uniform(0.1, 1.0, n_samples)
    seasonal = np.random.choice([1.0, 1.0, 1.0, 1.1, 1.3, 1.3], n_samples)
    exposure = np.random.uniform(0.3, 1.2, n_samples)
    zoink = np.random.uniform(0.2, 1.0, n_samples)
    tier = np.random.choice([0, 1, 2, 3], n_samples, p=[0.3, 0.3, 0.25, 0.15])
    hist_claims = np.random.uniform(0.0, 0.5, n_samples)
    tenure = np.random.uniform(0.0, 1.0, n_samples)
    traffic = np.random.uniform(0.1, 0.9, n_samples)

    X = np.column_stack([zone_risk, seasonal, exposure, zoink, tier,
                          hist_claims, tenure, traffic])

    # Generate target premium: base rate * risk factors * trust discount
    base_rates_arr = np.array([29, 45, 69, 99])
    base = base_rates_arr[tier.astype(int)]

    # Premium formula with realistic actuarial factors
    raw_premium = (
        base
        * (0.8 + zone_risk * 0.6)       # risk adjustment
        * seasonal                        # seasonal adjustment
        * (exposure ** 0.9)               # exposure adjustment
        * (1.0 - (zoink - 0.5) * 0.3)   # trust discount
        * (1.0 + hist_claims * 0.5)      # historical claims loading
    )

    # Add noise
    noise = np.random.normal(0, 2, n_samples)
    y = np.clip(raw_premium + noise, 15, 150)

    return X, y


def train_premium_model():
    """Train GradientBoosting premium regressor."""
    global _model, _metrics
    logger.info("Training Premium Pricing Model (GradientBoostingRegressor)...")

    X, y = _generate_training_data()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    _model = GradientBoostingRegressor(
        n_estimators=120,
        max_depth=5,
        learning_rate=0.1,
        min_samples_split=10,
        min_samples_leaf=5,
        subsample=0.8,
        random_state=42,
    )
    _model.fit(X_train, y_train)

    y_pred = _model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    _metrics = {
        "model_type": "GradientBoostingRegressor",
        "n_estimators": 120,
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "mae": round(mae, 4),
        "r2_score": round(r2, 4),
        "feature_importances": {
            name: round(imp, 4)
            for name, imp in zip(FEATURE_NAMES, _model.feature_importances_)
        },
        "status": "trained",
    }

    logger.info(f"Premium Model trained — MAE: ₹{mae:.2f}, R²: {r2:.4f}")
    return _metrics


def predict_premium(features: list, tier: str = "bronze",
                     work_hours_per_week: int = 40) -> dict:
    """
    Predict weekly premium for a rider.

    Args:
        features: list of 8 floats matching FEATURE_NAMES order
        tier: policy tier name
        work_hours_per_week: for cap calculation

    Returns:
        dict with premium_rs, breakdown details
    """
    global _model
    if _model is None:
        train_premium_model()

    try:
        X = np.array([features])
        raw_premium = float(_model.predict(X)[0])
        raw_premium = max(15, raw_premium)  # floor at ₹15

        # Apply 2% weekly earnings cap
        est_weekly_earnings = work_hours_per_week * 80
        cap = est_weekly_earnings * 0.02
        final_premium = round(min(raw_premium, cap), 2)

        # Extract component factors for transparency
        zone_risk = features[0]
        seasonal = features[1]
        exposure = features[2]
        trust = 1.0 - (features[3] - 0.5) * 0.3

        return {
            "premium_rs": final_premium,
            "zone_risk": round(zone_risk, 4),
            "seasonal_factor": round(seasonal, 4),
            "exposure_mult": round(exposure, 4),
            "trust_factor": round(trust, 4),
            "breakdown": {
                "base_rate": BASE_RATES.get(tier, 29),
                "raw_premium": round(raw_premium, 2),
                "cap": round(cap, 2),
                "est_weekly_earnings": est_weekly_earnings,
                "tier": tier,
                "model_prediction": round(raw_premium, 2),
            },
        }
    except Exception as e:
        logger.error(f"Premium prediction error: {e}")
        base = BASE_RATES.get(tier, 29)
        return {
            "premium_rs": float(base),
            "zone_risk": 1.0,
            "seasonal_factor": 1.0,
            "exposure_mult": 1.0,
            "trust_factor": 1.0,
            "breakdown": {
                "base_rate": base,
                "raw_premium": float(base),
                "cap": work_hours_per_week * 80 * 0.02,
                "est_weekly_earnings": work_hours_per_week * 80,
                "tier": tier,
                "model_prediction": float(base),
            },
        }


def get_model_metrics() -> dict:
    return _metrics if _metrics else {"status": "not_trained"}
