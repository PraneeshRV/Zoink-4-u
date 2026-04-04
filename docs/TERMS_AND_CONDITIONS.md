# Zoink-4-u Income-Loss Insurance — Terms and Conditions

> **Product:** Zoink-4-u Parametric Income-Loss Micro-Insurance  
> **Issued by:** Zoink-4-u (underwritten by a registered IRDAI partner insurer)  
> **Regulated by:** Insurance Regulatory and Development Authority of India (IRDAI)  
> **Applicable Law:** Indian Contract Act 1872, Consumer Protection Act 2019, DPDP Act 2023, Aadhaar Act 2016  
> **Version:** 1.0 — Seed Phase  

---

## 1. Definitions

| Term | Meaning |
|------|---------|
| **Policy** | This weekly parametric income-loss insurance contract between the Rider and Zoink-4-u |
| **Rider / Subscriber** | A registered food-delivery gig worker on Swiggy, Zomato, or another partner platform who holds an active Zoink-4-u policy |
| **Premium** | The weekly subscription fee deducted from the Rider's platform payout or paid via UPI |
| **Trigger Event** | A qualifying external disruption from the covered list (see Section 4) verified by independent data sources |
| **Claim** | An auto-initiated or admin-initiated request for payout tied to a verified Trigger Event |
| **Payout** | The UPI credit transferred to the Rider upon a verified, non-fraudulent claim |
| **Zoink-4-u Trust Score (GTS)** | A dynamic behavioural reputation score (0–100) calculated per Rider based on tenure, claim history, and fraud signals |
| **Zone** | The Rider's registered operating pincode/ward-level geo-boundary |
| **Platform** | The delivery aggregator (e.g., Swiggy, Zomato) through which the Rider accepts orders |
| **IRDAI** | Insurance Regulatory and Development Authority of India |

---

## 2. Eligibility

To subscribe to a Zoink-4-u policy, the Rider **must**:

1. Be a registered food-delivery partner on Swiggy, Zomato, or an approved partner platform.
2. Have a valid Indian mobile number verified via OTP.
3. Provide a valid UPI ID for premium deduction and payout receipt.
4. Register an operating zone (pincode) within supported Indian cities.
5. Declare typical daily shift hours at the time of registration.

Zoink-4-u is **exclusively for food-delivery gig workers**. Riders on logistics, cab-hailing, or personal-services platforms are not eligible under this product in the seed phase.

---

## 3. Policy Activation, Duration & Renewal

### 3.1 Activation
- Coverage begins **immediately** upon successful premium payment.
- A **72-hour waiting period** applies to disruption events that were publicly known before the policy activation date. Claims on pre-existing events are automatically rejected (see Section 7 — Exclusions).

### 3.2 Policy Duration
- Each policy covers **one calendar week (7 days)** from the date of activation.
- Coverage applies only during the Rider's **registered shift hours** within the active policy period.

### 3.3 Auto-Renewal
- Policies with `auto_renew = true` are renewed every Sunday.
- If the weekly premium payment fails, coverage lapses immediately until the next successful payment.
- Riders who do not log in on the platform for an entire week are **not charged** a premium and receive no coverage for that week (Skip-a-Week feature). No penalty applies.

### 3.4 Cancellation
- Riders may cancel at any time via WhatsApp or the PWA dashboard.
- No exit fees or lock-in period applies.
- Cancellation takes effect at the end of the current coverage week. No pro-rata refunds are issued for partial weeks.

---

## 4. Covered Trigger Events

Zoink-4-u covers **external, involuntary, verifiable disruptions** that prevent a Rider from earning during their active shift. Coverage is divided into four categories.

> **Critical:** Coverage is provided **only** for disruptions that occur during the Rider's registered shift window and within their registered Zone, verified by independent data sources.

### Category A — Environmental Disruptions

| # | Event | Trigger Threshold |
|---|-------|------------------|
| 1 | Extreme Heat Wave | IMD Orange/Red alert; ambient temp ≥ 45°C sustained ≥ 3 hours in shift |
| 2 | Heavy Rainfall / Waterlogging | IMD ≥ 64.5 mm/day or ≥ 15 mm/hr in Rider's ward |
| 3 | Urban Flooding | Municipal / NDMA flood warning for specific wards |
| 4 | Severe Air Pollution (AQI Emergency) | CPCB real-time AQI ≥ 400 ("Severe+") for ≥ 4 consecutive hours |
| 5 | Cyclone / Tropical Storm | IMD cyclone warning (Yellow or above) for Rider's district |
| 6 | Dense Fog | IMD fog advisory; visibility < 50 m (METAR < 200 m) |
| 7 | Hailstorm | IMD nowcast or Doppler radar confirmation; payout capped at 2 hours per hail event |
| 8 | Dust Storm / Sandstorm | IMD dust storm warning; visibility < 500 m |
| 9 | Lightning / Severe Thunderstorm | DAMINI lightning alert; ≥ 10 strikes within 10 km in 30 minutes |
| 10 | Earthquake (Zone Disruption) | USGS/IMD seismic alert ≥ 4.5 magnitude with aftershock advisory |
| 11 | Extreme Cold Wave | IMD cold wave Red alert; payouts restricted to **night shifts only** |

### Category B — Social & Civil Disruptions

| # | Event | Trigger Threshold |
|---|-------|------------------|
| 12 | Unplanned Curfew / Section 144 | District Magistrate imposes Section 144 CrPC or curfew |
| 13 | Bandh / General Strike | Verified: > 60% drop in zone orders confirmed by news API + platform data |
| 14 | Sudden Market / Zone Closure | Municipal authority unexpectedly shuts market; platform confirms ≥ 50% drop in open restaurants |
| 15 | Large-Scale Protest / Road Blockade | Live traffic data confirms ≥ 3 of Rider's top routes blocked |
| 16 | Political Rally / Road Closure | **Unscheduled** rally causing road closures; events announced > 24 hours in advance are excluded |
| 17 | Religious Procession / Festival Road Block | **Unscheduled** massive procession; pre-listed civic dates are auto-rejected |
| 18 | VIP Movement / Security Cordon | SPG/police impose sudden closures; Rider GPS must be within 2 km of cordon |
| 19 | Communal Tension / Area Curfew | Police advisory confirms area restrictions; Rider GPS validates inside boundary |
| 20 | Severe Gridlock / Traffic Paralysis | Live Google Maps/MapMyIndia API confirms "Dark Red" standstill > 2 hours on Rider's route |

### Category C — Infrastructure & Supply Chain Disruptions

| # | Event | Trigger Threshold |
|---|-------|------------------|
| 21 | Major Road Collapse / Sinkhole | Payout only if collapsed road is among Rider's top-10 historical routes |
| 22 | Power Grid Failure | DISCOM confirms unscheduled outage affecting ≥ 1 entire ward for ≥ 2 hours |
| 23 | Telecom / Internet Outage | Major carrier zonal outage confirmed by Downdetector |
| 24 | Water Main Burst / Gas Leak Evacuation | Municipal evacuation; Rider GPS must be within 500 m of incident |
| 25 | Platform Server Crash | Global/national Zomato/Swiggy outage via Downdetector; Rider must have active heartbeat logs before crash |
| 26 | Cooking Gas/LPG Supply Crisis | Verified supply crisis; platform API confirms > 60% drop in active restaurants in Rider's micro-market |

### Category D — Regulatory Disruptions

| # | Event | Trigger Threshold |
|---|-------|------------------|
| 27 | Government Emergency Shutdown (GRAP, Odd-Even) | Government gazette confirmed; cross-referenced against Rider's registered vehicle type |
| 28 | Pest / Disease Zone Quarantine | Municipal health quarantine order; tight geo-fence validation of Rider's GPS inside containment boundary |
| 29 | Sudden Construction / Metro Work Road Closure | **Unscheduled** emergency closure; closures announced > 48 hours in advance are auto-rejected |

---

## 5. Payout Structure

### 5.1 Payout Formula

```
Payout = min(
    verified_lost_hours × rider_rolling_avg_hourly_rate × SRS_payout_percentage,
    tier_max_weekly_payout
)
```

Where **Scenario Risk Score (SRS)** determines the payout percentage:

| SRS Range | Disruption Severity | Payout % of Avg Hourly Wage |
|-----------|--------------------|-----------------------------|
| 1–4 | Minor | 60% |
| 5–7 | Standard | 80% |
| 8–10 | Severe / Danger | 100% |

### 5.2 Plan Tiers & Payout Caps

| Tier | Weekly Premium | Max Weekly Payout | Coverage |
|------|---------------|------------------|----------|
| 🥉 Bronze | ₹29 (or ~1.2% weekly earnings) | ₹800 | Core weather disruptions (Cat A) |
| 🥈 Silver | ₹45 (or ~1.8% weekly earnings) | ₹1,500 | Cat A + Social/Civil (Cat B) |
| 🥇 Gold | ₹69 (or ~2.5% weekly earnings) | ₹2,800 | Cat A + B + Platform Crash & Supply Chain (Cat C) |
| 💎 Platinum | Flat 2.0% weekly earnings | ₹4,000 | All 29 triggers; AI auto-approval within 1 hour; ₹200 Emergency Micro-Advance |

The premium is capped at **2% of estimated weekly earnings** to ensure affordability. The maximum Gold premium (₹69) remains below ₹10/day.

### 5.3 Payout Timeline
- **Standard claims:** UPI credit within 24 hours of claim approval.
- **Platinum tier:** AI auto-approval and payout within 1 hour.
- **Flagged claims (manual review):** Resolved by admin within 48 hours.
- **Emergency Micro-Advance (Platinum):** ₹200 UPI credit within 1 hour of a confirmed multi-day event; deducted from final claim payout.

### 5.4 Payout Caps on Specific Events
- **Hailstorm:** Maximum 2 hours per hail event regardless of actual duration.
- **Cold Wave:** Payouts restricted to registered night shifts only.
- **Shift Overlap:** Payout is calculated only against the Rider's registered shift hours that overlap with the verified disruption window.
- **Daily Cap:** Maximum 10 hours/day for Gold/Platinum tier, regardless of declared shift.
- **Claims per week:** Maximum 4 claims per week; maximum 2 claims per day; minimum 6-hour cooldown between claims.

---

## 6. Claims Process

### 6.1 Automatic Claims
Zoink-4-u initiates claims **automatically** when:
- The Trigger Monitor (polling every 15 minutes) detects a qualifying event.
- The Rider has an active, paid policy in the affected Zone.
- Fraud validation passes (see Section 8).

The Rider does **not** need to file, call, or submit any paperwork.

### 6.2 Claim Lifecycle
```
Trigger Detected → Claim Created → Fraud Validation → Approved / Flagged / Rejected → Payout
```

### 6.3 Claim Notifications
- Real-time WhatsApp / push notification at each lifecycle stage.
- Language: Available in 12+ Indian languages.
- Riders may receive status updates via SMS fallback if WhatsApp is unavailable.

### 6.4 Dispute Process
- Riders may contest a rejected claim via WhatsApp or PWA support within **7 days** of rejection.
- Disputed claims enter the admin manual review queue.
- Admin resolution within 48 hours.
- A claim flagged but later approved manually carries **no Trust Score penalty**.

---

## 7. Exclusions

> **These are absolute exclusions. No claim under any excluded category will be processed or paid, regardless of plan tier or Trust Score.**

### 7.1 Hard Exclusions (System-Level; Cannot Be Overridden)

| # | Exclusion | Reason |
|---|-----------|--------|
| 1 | War, Armed Conflict & Insurrection | Unbounded, nationwide correlated loss; sovereign risk |
| 2 | Terrorism & Sabotage | Non-Gaussian loss distribution; covered separately via GIC Re Pool |
| 3 | Pandemic, Epidemic & Public Health Emergency | Long-tail systemic risk; per IRDAI Circular post-COVID |
| 4 | Nuclear / Radiological / Biological / Chemical (NRBC) Events | Infinite-duration tail risk; per Civil Liability for Nuclear Damage Act 2010 |

### 7.2 Operational Exclusions

| # | Exclusion | Detail |
|---|-----------|--------|
| 5 | Platform Employment Actions | Account deactivation, suspension, policy changes, voluntary resignation |
| 6 | Voluntary & Self-Inflicted Disruptions | Rider choosing not to work; intoxication; deliberate entry into danger zones |
| 7 | Pre-Existing & Scheduled Disruptions | Events publicly known before policy activation; pre-announced events (> 24–48 hours notice) |
| 8 | Health & Medical | Fever, illness, hospitalisation, COVID symptoms |
| 9 | Life Insurance | Death benefit or nominee payout |
| 10 | Accident & Injury | Road accident, fracture, personal injury |
| 11 | Vehicle Repair | Tyre puncture, engine failure, breakdown |
| 12 | Personal Reasons | Family emergency, planned leave, oversleeping |
| 13 | Normal Market Variation | Slow weekday, low demand |
| 14 | Rider's Own Equipment | Phone damage, charger failure |
| 15 | Inter-Platform Disputes | Payment disputes, incentive disagreements |

### 7.3 Plain-Language Exclusion Summary (Communicated During Onboarding)

> We do **not** cover:
> - Wars or terrorist attacks
> - Pandemics like COVID (government handles these)
> - Nuclear disasters
> - If your Swiggy/Zomato account gets banned
> - If you choose not to work on a clear day
> - Disruptions you knew about before buying the plan

---

## 8. Fraud Prevention & Policy Consequences

### 8.1 Multi-Layer Fraud Validation
Every claim passes through three layers before approval:

1. **Layer 1 — Rule-Based Filters (< 50ms):** Weather cross-validation, duplicate check, coverage status, cooldown period, zone boundary GPS check.
2. **Layer 2 — ML Anomaly Detection (< 200ms):** Isolation Forest model; anomaly score > 0.7 triggers auto-rejection; score 0.5–0.7 flags for manual review.
3. **Layer 3 — Zoink-4-u Trust Score Gate:** Riders with GTS < 40 are routed to mandatory manual review.

### 8.2 Zoink-4-u Trust Score (GTS)

| Action | GTS Change |
|--------|-----------|
| Week completed without fraud | +2 |
| Legitimate claim approved | +1 |
| Claim flagged but later approved manually | 0 |
| Claim rejected for fraud | −15 |
| Consecutive 4 clean weeks | +5 bonus |
| Confirmed fraud / account set to banned | Score → 0; policy cancelled |

### 8.3 Trust Score Tiers

| Tier | GTS Range | Treatment |
|------|-----------|-----------|
| Trusted | 70–100 | Instant auto-approval; up to 15% premium discount |
| Standard | 40–69 | Normal ML pipeline; standard premiums |
| Watch | 0–39 | All claims go to mandatory manual review; no discounts |
| Banned | Confirmed fraud | Account suspended; policy cancelled; no reinstatement |

### 8.4 Consequences of Fraud
- Immediate claim rejection.
- GTS penalty of −15 to −50 points.
- Confirmed fraud results in permanent account suspension and policy cancellation.
- Incidents may be reported to platform partners and relevant authorities.

---

## 9. Premium Pricing

### 9.1 Dynamic Pricing Formula (DGRI — Dynamic Gig-Risk Index)

```
Weekly Premium (Pw) = Base × (Σ WᵢRᵢ) × Φ(WH, DT) × Ω(TS)
```

Where:
- **Base** = Tier base rate (₹29 / ₹45 / ₹69)
- **Σ WᵢRᵢ** = Weighted risk pool (Zone Risk × Seasonal Factor × Platform Volatility × AI Scenario Risk Score)
- **Φ(WH, DT)** = Exposure multiplier based on declared work hours and time-of-day shift
- **Ω(TS)** = Trust/Behavioural factor (GTS 80–100: 0.85×; GTS 40–79: 1.0×; GTS < 40: 1.2×)

### 9.2 Affordability Cap
```
Pw = min(Pw, 2% × EstimatedWeeklyEarnings)
```

The premium will never exceed 2% of the Rider's estimated weekly earnings.

### 9.3 Seasonal Pricing
| Season | Risk Level | Adjustment |
|--------|-----------|------------|
| Oct–Feb (Winter, Dry) | Low | Base rate |
| Mar–May (Summer, Heat) | Medium | Base + 15% |
| Jun–Sep (Monsoon) | High | Base + 30% |

Riders may opt for a flat annual-average weekly rate for predictable pricing.

### 9.4 No-Claim Rewards
| Milestone | Reward |
|-----------|--------|
| 4 consecutive clean weeks | 1 week free coverage |
| 12 consecutive clean weeks | Tier upgrade for 2 weeks (higher coverage at same price) |

---

## 10. Data Privacy & Consent

1. **Data Collected:** Mobile number, UPI ID, platform ID, GPS location (during shifts), shift hours, claim history.
2. **Purpose:** Policy management, automated claim processing, fraud detection, premium calculation.
3. **Aadhaar:** Only the last 4 digits are collected for identity verification during onboarding. Full Aadhaar data is never stored (per Aadhaar Act 2016).
4. **Third-Party Sharing:** Data is shared only with the underwriting insurer, IRDAI-mandated auditors, and integrated data sources (OpenWeatherMap, CPCB, Razorpay). Data is **not** sold to advertisers.
5. **Exclusion Logs:** Store only event type and decision (BLOCKED / ALLOWED); no personal data (per DPDP Act 2023).
6. **Platform Data:** Earnings and delivery data are accessed only with the Rider's explicit consent.
7. **Consent Withdrawal:** Rider may withdraw data consent at any time, which will result in policy termination.

---

## 11. Regulatory Compliance

| Regulation | Compliance |
|------------|-----------|
| IRDAI General Insurance Guidelines | All exclusions explicitly defined and enforced programmatically |
| IRDAI Use and File Procedure | Exclusion schedule included in product filing |
| IRDAI Micro-Insurance Regulations | Product designed within micro-insurance premium and payout limits |
| Aadhaar Act 2016 | Only last 4 digits collected; no additional Aadhaar data stored |
| DPDP Act 2023 | Exclusion logs store only event type and decision; no personal rider data |
| Indian Contract Act 1872 | Exclusions presented before policy activation; informed consent obtained |
| Consumer Protection Act 2019 | Plain-language exclusion summary prevents claims of hidden terms |
| PCI DSS (via Razorpay) | Sensitive payment data handled solely by Razorpay's PCI-compliant infrastructure |

---

## 12. Governing Law & Dispute Resolution

1. These Terms are governed by the laws of India.
2. Disputes not resolved through the in-app support process shall be referred to the IRDAI Grievance Redressal mechanism.
3. Arbitration (if applicable) shall be conducted in accordance with the Arbitration and Conciliation Act, 1996, in the jurisdiction of the company's registered office.

---

## 13. Amendments

Zoink-4-u reserves the right to amend these Terms at any time. Riders will be notified via WhatsApp and in-app notification at least **7 days** before material changes take effect. Continued use of the service constitutes acceptance of the updated Terms.

---

*By completing registration and making the first premium payment, the Rider confirms they have read, understood, and accepted these Terms and Conditions.*
