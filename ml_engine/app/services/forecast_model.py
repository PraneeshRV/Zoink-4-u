"""
Disruption Forecast Model — Exponential Smoothing + Seasonal Decomposition

Trained on synthetic 2-year historical disruption data per zone.
Replaces simple sine-wave formula with proper statistical forecasting.
"""
import numpy as np
import logging
from datetime import datetime, timedelta

logger = logging.getLogger("forecast_model")

_models = {}  # zone_h3 -> trained model params
_metrics = {}


def _generate_zone_history(zone_seed: int, n_days: int = 730):
    """
    Generate 2 years of synthetic daily disruption probability history.
    Incorporates seasonality, trend, and zone-specific patterns.
    """
    np.random.seed(zone_seed)

    days = np.arange(n_days)

    # Base level varies by zone
    base = 0.15 + (zone_seed % 30) / 100.0

    # Annual seasonal component (monsoon peak June-Sept = days 150-270 roughly)
    seasonal = 0.15 * np.sin(2 * np.pi * (days - 152) / 365)

    # Weekly pattern (weekends slightly higher)
    weekly = 0.03 * np.sin(2 * np.pi * days / 7)

    # Slight upward trend (urbanization increasing disruptions)
    trend = 0.00005 * days

    # Random noise
    noise = np.random.normal(0, 0.04, n_days)

    # Occasional spikes (extreme events)
    spikes = np.zeros(n_days)
    spike_indices = np.random.choice(n_days, size=int(n_days * 0.02), replace=False)
    spikes[spike_indices] = np.random.uniform(0.15, 0.35, len(spike_indices))

    probabilities = base + seasonal + weekly + trend + noise + spikes
    probabilities = np.clip(probabilities, 0.02, 0.95)

    return probabilities


class ExponentialSmoothingModel:
    """
    Simple Holt-Winters-style exponential smoothing for disruption forecasting.
    Avoids heavy dependencies like statsmodels while providing proper ML forecasting.
    """

    def __init__(self, alpha=0.3, beta=0.1, gamma=0.2, seasonal_period=7):
        self.alpha = alpha  # level smoothing
        self.beta = beta    # trend smoothing
        self.gamma = gamma  # seasonal smoothing
        self.seasonal_period = seasonal_period
        self.level = 0
        self.trend = 0
        self.seasonals = []
        self.fitted_values = []
        self.residuals = []

    def fit(self, data):
        """Fit Holt-Winters additive model."""
        n = len(data)
        sp = self.seasonal_period

        if n < sp * 2:
            # Fallback: simple exponential smoothing
            self.level = np.mean(data[:min(30, n)])
            self.trend = 0
            self.seasonals = [0] * sp
            self.fitted_values = [self.level] * n
            self.residuals = (data - self.level).tolist()
            return self

        # Initialize level and trend
        self.level = np.mean(data[:sp])
        self.trend = (np.mean(data[sp:2*sp]) - np.mean(data[:sp])) / sp

        # Initialize seasonal components
        self.seasonals = []
        for i in range(sp):
            season_vals = [data[j] for j in range(i, min(n, sp*3), sp)]
            self.seasonals.append(np.mean(season_vals) - self.level)

        # Fit the model
        self.fitted_values = []
        for t in range(n):
            if t < sp:
                self.fitted_values.append(data[t])
                continue

            # Forecast
            forecast = self.level + self.trend + self.seasonals[t % sp]
            self.fitted_values.append(forecast)

            # Update
            prev_level = self.level
            self.level = self.alpha * (data[t] - self.seasonals[t % sp]) + \
                         (1 - self.alpha) * (prev_level + self.trend)
            self.trend = self.beta * (self.level - prev_level) + \
                         (1 - self.beta) * self.trend
            self.seasonals[t % sp] = self.gamma * (data[t] - self.level) + \
                                      (1 - self.gamma) * self.seasonals[t % sp]

        self.fitted_values = np.array(self.fitted_values)
        self.residuals = data - self.fitted_values

        return self

    def forecast(self, steps=7):
        """Forecast future values."""
        forecasts = []
        level = self.level
        trend = self.trend
        sp = self.seasonal_period

        for t in range(steps):
            forecast = level + trend * (t + 1) + self.seasonals[t % sp]
            forecasts.append(np.clip(forecast, 0.02, 0.95))

        # Confidence intervals (based on residual std)
        residual_std = np.std(self.residuals[-30:]) if len(self.residuals) > 30 else 0.05
        lower = [max(0.02, f - 1.96 * residual_std) for f in forecasts]
        upper = [min(0.95, f + 1.96 * residual_std) for f in forecasts]

        return {
            "forecasts": [round(f, 4) for f in forecasts],
            "lower_ci": [round(l, 4) for l in lower],
            "upper_ci": [round(u, 4) for u in upper],
        }

    def get_metrics(self):
        if len(self.residuals) == 0:
            return {}
        residuals = np.array(self.residuals[-90:])
        return {
            "mae": round(float(np.mean(np.abs(residuals))), 4),
            "rmse": round(float(np.sqrt(np.mean(residuals**2))), 4),
            "residual_std": round(float(np.std(residuals)), 4),
        }


def _get_zone_seed(zone_h3: str) -> int:
    try:
        return int(zone_h3[-4:], 16) % 100
    except (ValueError, IndexError):
        return 50


def train_zone_model(zone_h3: str) -> dict:
    """Train forecaster for a specific zone."""
    zone_seed = _get_zone_seed(zone_h3)
    history = _generate_zone_history(zone_seed)

    model = ExponentialSmoothingModel(
        alpha=0.3, beta=0.1, gamma=0.2, seasonal_period=7
    )
    model.fit(history)

    _models[zone_h3] = model
    metrics = model.get_metrics()
    metrics["zone_h3"] = zone_h3
    metrics["training_days"] = len(history)
    metrics["status"] = "trained"

    return metrics


def train_all_zones(zone_list: list = None):
    """Train models for all known zones."""
    global _metrics

    if zone_list is None:
        zone_list = [
            "8829e24dfffffff", "8831a91dfffffff", "883148c7fffffff",
            "88292e3dfffffff", "88316899fffffff", "88395cd7fffffff",
        ]

    logger.info(f"Training Forecast Models for {len(zone_list)} zones...")

    all_metrics = []
    for zone_h3 in zone_list:
        m = train_zone_model(zone_h3)
        all_metrics.append(m)
        logger.info(f"  Zone {zone_h3}: MAE={m.get('mae', 'N/A')}")

    _metrics = {
        "model_type": "HoltWintersExponentialSmoothing",
        "zones_trained": len(zone_list),
        "seasonal_period": 7,
        "history_days": 730,
        "avg_mae": round(np.mean([m.get("mae", 0) for m in all_metrics]), 4),
        "zone_metrics": all_metrics,
        "status": "trained",
    }

    logger.info(f"Forecast Models trained for {len(zone_list)} zones")
    return _metrics


def forecast_zone(zone_h3: str, steps: int = 7) -> dict:
    """
    Get disruption forecast for a zone.

    Returns:
        dict with daily forecasts including probability, risk level, actions
    """
    if zone_h3 not in _models:
        train_zone_model(zone_h3)

    model = _models[zone_h3]
    result = model.forecast(steps)

    today = datetime.now()
    forecasts = []

    for i, prob in enumerate(result["forecasts"]):
        day = today + timedelta(days=i)

        if prob < 0.3:
            risk_level = "low"
            action = "Normal operations — no disruptions expected"
        elif prob < 0.6:
            risk_level = "medium"
            action = "Plan ahead — moderate disruption risk"
        else:
            risk_level = "high"
            action = "Consider shorter shifts — high disruption risk"

        forecasts.append({
            "date": day.strftime("%Y-%m-%d"),
            "disruption_probability": prob,
            "risk_level": risk_level,
            "suggested_action": action,
            "confidence_interval": {
                "lower": result["lower_ci"][i],
                "upper": result["upper_ci"][i],
            },
        })

    return forecasts


def get_model_metrics() -> dict:
    return _metrics if _metrics else {"status": "not_trained"}
