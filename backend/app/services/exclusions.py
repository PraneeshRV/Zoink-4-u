"""
Exclusion Registry for Zoink-4-u Parametric Insurance.

This module defines all trigger types that are EXCLUDED from coverage
per IRDAI guidelines and actuarial soundness requirements.

Exclusions are split into two tiers:
  - HARD: Permanently excluded. No buyback, no Safe Return. Ever.
  - SOFT: Excluded by default, but can be partially covered via:
      * Exclusion Buyback add-on (paid extra premium)
      * Safe Return guarantee (mid-delivery micro-payout for sudden events)
"""

# ── HARD EXCLUSIONS ──
# These are NEVER covered under any circumstance.
# No buyback, no Safe Return, no exceptions.
HARD_EXCLUDED = {
    "WAR_CONFLICT": {
        "category": "War / Armed Conflict",
        "reason": "Unbounded correlated nationwide loss. Sovereign risk, not insurable at micro-premium scale.",
        "irdai_ref": "Standard exclusion per IRDAI General Insurance Product Guidelines"
    },
    "CIVIL_WAR": {
        "category": "War / Armed Conflict",
        "reason": "Insurrection and civil war create unbounded multi-zone losses.",
        "irdai_ref": "Standard exclusion per IRDAI General Insurance Product Guidelines"
    },
    "MARTIAL_LAW": {
        "category": "War / Armed Conflict",
        "reason": "Military-imposed restrictions are sovereign actions outside commercial insurance scope.",
        "irdai_ref": "Standard exclusion per IRDAI General Insurance Product Guidelines"
    },
    "TERRORISM": {
        "category": "Terrorism / Sabotage",
        "reason": "Intentional extreme loss volatility with accumulation risk. Covered separately via Indian Terrorism Risk Insurance Pool (GIC Re).",
        "irdai_ref": "Terrorism excluded per IRDAI guidelines; separate pool managed by GIC Re"
    },
    "SABOTAGE": {
        "category": "Terrorism / Sabotage",
        "reason": "Deliberate destructive acts create unmodelable loss distributions.",
        "irdai_ref": "Standard exclusion per IRDAI General Insurance Product Guidelines"
    },
    "NRBC_EVENT": {
        "category": "Nuclear / NRBC",
        "reason": "Severity tail exceeds all parametric product risk appetite. Covered under Civil Liability for Nuclear Damage Act, 2010.",
        "irdai_ref": "Universal exclusion across all Indian general insurance classes"
    },
    "NUCLEAR_INCIDENT": {
        "category": "Nuclear / NRBC",
        "reason": "Nuclear incidents can render areas uninhabitable for years. Infinite-duration claims.",
        "irdai_ref": "Civil Liability for Nuclear Damage Act, 2010"
    },
    "CHEMICAL_SPILL_MAJOR": {
        "category": "Nuclear / NRBC",
        "reason": "Major chemical events with city-wide evacuation exceed parametric scope.",
        "irdai_ref": "Universal exclusion across all Indian general insurance classes"
    },
}

# ── SOFT EXCLUSIONS ──
# Excluded by default, BUT eligible for:
#   - Buyback partial coverage (if rider paid for add-on)
#   - Safe Return micro-payout (if rider was mid-delivery during sudden events)
SOFT_EXCLUDED = {
    "PANDEMIC_LOCKDOWN": {
        "category": "Pandemic / Epidemic",
        "reason": "Long-tail, multi-zone, prolonged business interruption. No micro-premium pool can absorb systemic pandemic risk.",
        "irdai_ref": "Post-COVID mandate: IRDAI Circular IRDAI/HLT/REG/CIR/2020",
        "buyback_eligible": True,
        "buyback_payout_pct": 0.30,  # 30% of normal payout
        "buyback_max_duration_hours": 72,
        "safe_return_eligible": False,  # Pandemic is gradual, nobody is mid-delivery
    },
    "EPIDEMIC_QUARANTINE": {
        "category": "Pandemic / Epidemic",
        "reason": "Government quarantine orders during disease outbreaks fall under public health emergency.",
        "irdai_ref": "Post-COVID mandate: IRDAI Circular IRDAI/HLT/REG/CIR/2020",
        "buyback_eligible": True,
        "buyback_payout_pct": 0.25,
        "buyback_max_duration_hours": 48,
        "safe_return_eligible": False,
    },
    "ACCOUNT_DEACTIVATION": {
        "category": "Platform Employment",
        "reason": "Account bans/suspensions are contractual matters between rider and platform.",
        "irdai_ref": "Non-insurable under product scope: employment risk",
        "buyback_eligible": True,
        "buyback_payout_pct": 0.0,  # No percentage — flat one-time ₹200 goodwill
        "buyback_flat_payout": 200.0,
        "buyback_cooldown_months": 6,
        "safe_return_eligible": False,
    },
    "PLATFORM_RESTRUCTURING": {
        "category": "Platform Employment",
        "reason": "Mass layoffs or platform policy changes are business decisions.",
        "irdai_ref": "Non-insurable under product scope: employment risk",
        "buyback_eligible": False,
        "safe_return_eligible": False,
    },
    "VOLUNTARY_NONWORK": {
        "category": "Voluntary / Self-Inflicted",
        "reason": "Rider choosing not to work is not an involuntary external disruption. Creates moral hazard.",
        "irdai_ref": "Behavioral / moral hazard exclusion",
        "buyback_eligible": False,
        "safe_return_eligible": False,
    },
    "PRE_EXISTING_EVENT": {
        "category": "Pre-Existing / Scheduled",
        "reason": "Events known before policy activation enable adverse selection, draining the premium pool.",
        "irdai_ref": "Standard adverse selection prevention",
        "buyback_eligible": False,
        "safe_return_eligible": False,
    },
    # Sudden civil disruptions — eligible for Safe Return
    "SUDDEN_CURFEW": {
        "category": "Sudden Civil Disruption",
        "reason": "Section 144 imposed with immediate effect. Excluded as a broad event but Safe Return eligible for mid-delivery riders.",
        "irdai_ref": "Civil disruption exclusion",
        "buyback_eligible": True,
        "buyback_payout_pct": 0.30,
        "buyback_max_duration_hours": 24,
        "safe_return_eligible": True,
        "safe_return_max_payout": 100.0,
    },
    "SUDDEN_PROTEST": {
        "category": "Sudden Civil Disruption",
        "reason": "Unannounced protest blocking roads. Excluded broadly but Safe Return eligible.",
        "irdai_ref": "Civil disruption exclusion",
        "buyback_eligible": True,
        "buyback_payout_pct": 0.25,
        "buyback_max_duration_hours": 12,
        "safe_return_eligible": True,
        "safe_return_max_payout": 100.0,
    },
}

# ── COVERED TRIGGER TYPES ──
COVERED_TRIGGERS = [
    "HEAVY_RAIN", "FLASH_FLOOD", "CYCLONE", "EXTREME_HEAT",
    "DENSE_FOG", "AQI_EMERGENCY", "HAILSTORM", "DUST_STORM",
    "LIGHTNING", "EARTHQUAKE", "EXTREME_COLD",
    "CURFEW", "BANDH", "VIP_CORDON", "PROTEST",
    "ROAD_COLLAPSE", "POWER_GRID_FAILURE", "TELECOM_OUTAGE",
    "APP_OUTAGE", "GAS_LEAK_EVACUATION", "GRIDLOCK_PARALYSIS",
    "GRAP_ODD_EVEN", "EMERGENCY_ROAD_CLOSURE",
    "LPG_SUPPLY_CRISIS", "RELIGIOUS_PROCESSION",
]


def check_exclusion(trigger_type: str, has_buyback: bool = False, is_delivering: bool = False) -> dict:
    """
    Enhanced exclusion check with Buyback + Safe Return support.
    
    Returns a dict with:
      - "action": "ALLOW" | "BLOCK" | "BUYBACK_PARTIAL" | "SAFE_RETURN"
      - plus relevant details
    """
    trigger_upper = trigger_type.upper()

    # 1. Check if it's a covered trigger (always allowed)
    if trigger_upper in COVERED_TRIGGERS:
        return {"action": "ALLOW", "trigger_type": trigger_upper}

    # 2. Check HARD exclusions (always blocked, no exceptions)
    if trigger_upper in HARD_EXCLUDED:
        info = HARD_EXCLUDED[trigger_upper]
        return {
            "action": "BLOCK",
            "trigger_type": trigger_upper,
            "exclusion_tier": "HARD",
            "category": info["category"],
            "reason": info["reason"],
            "irdai_ref": info["irdai_ref"],
            "message": f"HARD EXCLUDED: {info['category']}. No buyback or Safe Return available."
        }

    # 3. Check SOFT exclusions (may have Buyback or Safe Return)
    if trigger_upper in SOFT_EXCLUDED:
        info = SOFT_EXCLUDED[trigger_upper]

        # 3a. Check Safe Return first (mid-delivery micro-payout)
        if is_delivering and info.get("safe_return_eligible", False):
            return {
                "action": "SAFE_RETURN",
                "trigger_type": trigger_upper,
                "exclusion_tier": "SOFT",
                "category": info["category"],
                "max_payout": info.get("safe_return_max_payout", 100.0),
                "message": f"Safe Return activated: rider was mid-delivery during {trigger_upper}. Micro-payout of up to ₹{info.get('safe_return_max_payout', 100.0)} approved."
            }

        # 3b. Check Buyback (paid add-on for partial coverage)
        if has_buyback and info.get("buyback_eligible", False):
            payout_pct = info.get("buyback_payout_pct", 0.0)
            flat_payout = info.get("buyback_flat_payout", None)
            return {
                "action": "BUYBACK_PARTIAL",
                "trigger_type": trigger_upper,
                "exclusion_tier": "SOFT",
                "category": info["category"],
                "payout_percentage": payout_pct,
                "flat_payout": flat_payout,
                "message": f"Buyback coverage activated for {trigger_upper}. "
                           + (f"Flat payout: ₹{flat_payout}" if flat_payout else f"Partial payout: {int(payout_pct*100)}% of normal claim.")
            }

        # 3c. Default: blocked (no buyback, not delivering)
        return {
            "action": "BLOCK",
            "trigger_type": trigger_upper,
            "exclusion_tier": "SOFT",
            "category": info["category"],
            "reason": info["reason"],
            "irdai_ref": info["irdai_ref"],
            "buyback_available": info.get("buyback_eligible", False),
            "message": f"SOFT EXCLUDED: {info['category']}. "
                       + ("Upgrade to Buyback add-on for partial coverage." if info.get("buyback_eligible") else "Not eligible for Buyback.")
        }

    # 4. Unknown trigger type — allow (benefit of the doubt)
    return {"action": "ALLOW", "trigger_type": trigger_upper}


def get_exclusion_summary() -> list[dict]:
    """Returns a human-readable summary of all exclusions for onboarding."""
    categories = {}
    
    for trigger, info in HARD_EXCLUDED.items():
        cat = info["category"]
        if cat not in categories:
            categories[cat] = {"category": cat, "tier": "HARD", "reason": info["reason"], "triggers": [], "buyback_available": False}
        categories[cat]["triggers"].append(trigger)
    
    for trigger, info in SOFT_EXCLUDED.items():
        cat = info["category"]
        if cat not in categories:
            categories[cat] = {"category": cat, "tier": "SOFT", "reason": info["reason"], "triggers": [], "buyback_available": info.get("buyback_eligible", False)}
        categories[cat]["triggers"].append(trigger)
    
    return list(categories.values())
