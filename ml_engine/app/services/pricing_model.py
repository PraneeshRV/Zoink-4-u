import random

def calculate_dynamic_premium(zone_id: str, tier: str, work_hours: int) -> dict:
    """
    Simulates an ML model (like Gradient Boosting) scoring the risk of a zone.
    In a real implementation, this would load a joblib model and call .predict()
    """
    base_rates = {
        "Bronze": 29.0,
        "Silver": 49.0,
        "Gold": 69.0,
        "Platinum": 99.0
    }
    
    base_premium = base_rates.get(tier, 29.0)
    
    # Simulate historical risk factor for zone
    # For hackathon demo, 'ZONE_RED' is high risk, 'ZONE_GREEN' is low risk
    risk_score = 1.0
    if "RED" in zone_id.upper():
        risk_score = 1.6 # 60% surcharge
    elif "GREEN" in zone_id.upper():
        risk_score = 0.8 # 20% discount (cheaper since it's safe)
    else:
        # random baseline variation 0.9 to 1.15
        risk_score = random.uniform(0.9, 1.15)
        
    # Exposure multiplier based on work hours
    fatigue_exponent = (work_hours / 40.0) ** 1.1
    
    final_multiplier = risk_score * fatigue_exponent
    
    dynamic_premium = round(base_premium * final_multiplier, 2)
    
    # Cap Premium at 2% of estimated weekly earnings (assume Rs 2000 minimum)
    max_cap = 40.0 
    if tier in ["Gold", "Platinum"]:
        max_cap = 100.0
        
    if dynamic_premium > max_cap:
        dynamic_premium = max_cap
        
    return {
        "base_premium": base_premium,
        "dynamic_premium": dynamic_premium,
        "risk_score": round(risk_score, 2),
        "factors": {
            "zone_risk_multiplier": round(risk_score, 2),
            "fatigue_exposure": round(fatigue_exponent, 2)
        }
    }
