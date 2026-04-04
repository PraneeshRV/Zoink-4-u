# Zoink-4-u — Internal Company Policy

> **Document Type:** Internal Operational Policy  
> **Product:** Zoink-4-u Parametric Income-Loss Micro-Insurance (Zoink-4-u)  
> **Audience:** Employees, admins, engineering team, underwriting partner  
> **Version:** 1.0 — Seed Phase  

---

## 1. Company Overview & Mission

Zoink-4-u provides **parametric income-loss micro-insurance** exclusively for food-delivery gig workers (Swiggy, Zomato, and partner platforms) in India. Our mission is to provide affordable, zero-friction income protection to gig workers who have no access to employee benefits.

The product is built on three principles:
1. **Automation first** — Claims are auto-detected, auto-validated, and auto-paid. Riders never file forms.
2. **Parametric triggers** — Payouts are tied to independent, verifiable data (weather APIs, government alerts, live traffic feeds), not self-reported losses.
3. **Affordability cap** — Premium never exceeds 2% of a Rider's estimated weekly earnings.

---

## 2. Product & Pricing Policy

### 2.1 Plan Tiers
The company offers four plan tiers:

| Tier | Weekly Premium | Max Payout/Week |
|------|---------------|-----------------|
| Bronze | ₹29 (~1.2% weekly earnings) | ₹800 |
| Silver | ₹45 (~1.8% weekly earnings) | ₹1,500 |
| Gold | ₹69 (~2.5% weekly earnings) | ₹2,800 |
| Platinum | Flat 2.0% weekly earnings | ₹4,000 |

Expected tier distribution: **30% Bronze / 50% Silver / 20% Gold** (Platinum is invite-only for high-trust, long-tenure Riders).

### 2.2 Dynamic Pricing Engine
Premiums are calculated using the **Dynamic Gig-Risk Index (DGRI)**:
```
Pw = Base × (Zone Risk × Seasonal Factor × Platform Volatility × AI Scenario Risk) × Exposure Multiplier × Trust Factor
```
- The Python FastAPI Premium Engine calculates this in real-time when a Rider views plans.
- The XGBoost pricing model is retrained weekly with latest claim and weather data.
- If the model fails, a rule-based fallback formula (`Base × Zone_Factor × Season_Factor × Trust_Factor`) is used.
- **Affordability cap:** `Pw = min(Pw, 2% × EstWeeklyEarnings)`.

### 2.3 Seasonal Surcharges
The pricing team applies seasonal risk surcharges automatically:
- **Oct–Feb (Dry/Winter):** Base rate
- **Mar–May (Summer/Heat):** Base + 15%
- **Jun–Sep (Monsoon):** Base + 30%

These surcharges are communicated to Riders as "enhanced seasonal coverage," not as a price increase.

### 2.4 No-Claim Rewards Program
The system automatically tracks clean-week streaks:
- **4 consecutive clean weeks** → 1 week free coverage
- **12 consecutive clean weeks** → Tier upgrade for 2 weeks at same price

Free weeks are auto-applied; no action required by the Rider or admin.

### 2.5 Profitability Targets

| Metric | Target |
|--------|--------|
| Loss ratio (steady-state) | ≤ 35% |
| Gross margin | ~34% at 10,000+ Riders |
| 6-month Rider retention | ≥ 70% |
| Fraud detection rate | ≥ 80% of fraudulent claims |
| False positive rate (legitimate claims flagged) | < 5% |

---

## 3. Claims Operations Policy

### 3.1 Auto-Claim Mandate
Auto-initiated claims are the **default and mandatory mode** of claim processing. The Trigger Monitor polls all active zones every 15 minutes. When a qualifying event threshold is breached:
1. A `trigger_event` record is created.
2. All active policies in the affected zone are identified.
3. An auto-claim is initiated for each eligible Rider.

Manual claim intake by Riders is **not supported**. Admin-initiated manual triggers are permitted for social/civil events (Category B) that require human confirmation (e.g., sudden bandh).

### 3.2 Fraud Validation Pipeline (Mandatory; Cannot Be Bypassed)
Every claim — whether auto or admin-initiated — **must** pass all three layers:

**Layer 1 — Rule-Based Filters (< 50ms)**
- Weather cross-validation against independent API data
- Duplicate claim check (same worker + event ID)
- Coverage status check (active, paid policy)
- Cooldown check (6-hour minimum between claims; max 2/day, 4/week)
- Zone boundary check (Rider GPS within registered zone ± 2 km buffer)

**Layer 2 — ML Anomaly Detection (< 200ms)**
- Isolation Forest model; anomaly score > 0.7 = auto-reject; 0.5–0.7 = flag for review
- < 100ms inference time required; must not delay payout pipeline

**Layer 3 — Zoink-4-u Trust Score Gate**
- GTS ≥ 70: Instant auto-approval
- GTS 40–69: Standard ML pipeline
- GTS < 40: Mandatory manual review; claim held until admin decision

### 3.3 Payout SLA
| Claim Type | SLA |
|-----------|-----|
| Auto-approved (Standard) | UPI credit within 24 hours |
| Auto-approved (Platinum Tier) | UPI credit within 1 hour |
| Flagged → Manual review → Approved | Within 48 hours of admin decision |
| Emergency Micro-Advance (Platinum, multi-day events) | ₹200 UPI within 1 hour; deducted from final payout |

Payout SLA breaches must be escalated to the Product Lead within 2 hours.

### 3.4 Admin Review Queue Policy
- Flagged claims appear in the Admin Fraud Review Queue.
- Each admin reviewer must process flagged claims within **24 hours** of queuing.
- Reviewers have three actions: **Approve**, **Reject**, **Investigate**.
- Approvals trigger immediate payout; rejections notify the Rider with the reason code.
- All admin decisions are logged with timestamp and reviewer ID.

### 3.5 Rider Dispute Process
- Riders may contest a rejected claim within **7 days** of rejection via WhatsApp or PWA.
- Disputed claims re-enter the manual review queue with a `DISPUTE` flag.
- A claim reversed from rejected to approved carries **no Trust Score penalty** for the Rider.
- Final admin decision on disputes is binding within 48 hours.

---

## 4. Fraud Detection & Anti-Fraud Policy

### 4.1 Zero-Tolerance on Confirmed Fraud
Confirmed fraudulent accounts are **immediately suspended** with no reinstatement path. Incidents are documented and, where legally warranted, reported to partner platforms and authorities.

### 4.2 GPS Spoofing Detection
The system must detect:
- **Teleportation:** GPS jump > 5 km in < 5 minutes → `spoofing_detected`
- **Peer mismatch:** Worker claims disruption in a zone where ≥ 50 registered workers show no disruption signal
- **Historical mismatch:** GPS trail from outside the zone in the 6 hours preceding the claim

### 4.3 Organized Fraud Ring Detection
The fraud team must monitor:
- Clusters of workers who always claim together
- Multiple workers registered from the same IP/device within 7 days
- Multiple UPI accounts linked to the same bank account
- Long referral chains with claim rates far above zone average

### 4.4 Inflated Shift Hours Policy
- Admins must cap payouts at **10 hours/day maximum** for Gold/Platinum tiers regardless of declared shift.
- Declared shift hours are cross-referenced against platform earnings data at monthly reviews.
- Workers with consistently declared hours out of proportion to actual deliveries are flagged for review.

### 4.5 Trust Score Updates
The Trust Score Engine runs every **Monday** to update all Rider GTS scores based on the previous week:
- Scores update within ± points as defined in TERMS_AND_CONDITIONS.md, Section 8.2.
- Any score drop below 40 triggers an automatic email/WhatsApp alert to the Rider.
- Scores reaching 0 trigger automatic policy suspension.

---

## 5. Exclusion Enforcement Policy

### 5.1 Exclusion Registry (Hardcoded; No Admin Override)
The following trigger types are **permanently blocked** at the system level and cannot be overridden by any admin:
- `WAR_CONFLICT`
- `TERRORISM`
- `PANDEMIC_LOCKDOWN`
- `NRBC_EVENT`

### 5.2 Operational Exclusions (Enforced at Claim Validation)
- Platform account deactivation/suspension: Claim rejected with `EMPLOYMENT_ACTION_EXCLUDED`
- Pre-existing events (event known before policy creation): Claim rejected with `PRE_EXISTING_EXCLUSION`
- Voluntary non-work patterns: Flagged by Zoink Score engine; routed to manual review

### 5.3 Edge Case — Localized Health Advisory
A government-ordered localized health advisory (e.g., dengue fumigation in one ward for ≤ 48 hours) that does **not** constitute a declared epidemic **may** qualify under the `REGULATORY_SHUTDOWN` trigger at the admin's discretion. This must be explicitly approved by a senior admin and logged with justification.

---

## 6. Data & Privacy Policy

### 6.1 Data Collection Principles
The company collects only the minimum data required for policy management and claim validation:

| Data Type | Purpose | Retention |
|-----------|---------|-----------|
| Mobile number | Identity, OTP auth, notifications | Duration of policy + 3 years |
| UPI ID | Premium deduction, payout | Duration of policy + 3 years |
| GPS location (shift-time only) | Zone validation, fraud detection | 90 days rolling |
| Shift hours declared | Payout calculation, fraud detection | Duration of policy + 1 year |
| Claim history | Trust Score, premium pricing | Duration of policy + 5 years |
| Aadhaar (last 4 digits only) | Identity verification onboarding | Duration of policy |
| Weather/environmental API data | Trigger validation | 90 days per zone |

### 6.2 Data Sharing Rules
Data may be shared **only** with:
1. The underwriting insurer (IRDAI-registered partner)
2. IRDAI-mandated auditors
3. Integrated data vendors (OpenWeatherMap, CPCB, WAQI, Razorpay) — for API operations only
4. Law enforcement agencies — only upon a valid legal order

**Data is never sold or shared with advertisers or unrelated third parties.**

### 6.3 Platform Data (Earnings / Delivery History)
Platform earnings and delivery data are accessed **only with explicit Rider consent** at onboarding. Riders may revoke this consent at any time, which results in fallback to estimated earnings for premium and payout calculations.

### 6.4 Anonymised Aggregate Data
Zone-level claim statistics (e.g., "47 riders in Koramangala received ₹16,200 last week") may be published on the app for community trust. These are always aggregated and anonymised; no individual Rider data is revealed.

### 6.5 DPDP Act 2023 Compliance
- Exclusion logs store only event type and decision (`BLOCKED`/`ALLOWED`); no personal Rider data is attached.
- Riders may request data export or deletion via WhatsApp/PWA at any time.
- Data deletion requests are fulfilled within 30 days.

---

## 7. Technology & Security Policy

### 7.1 Authentication
- All Rider authentication via OTP (phone-based); no password storage.
- JWT access tokens: 15-minute expiry; refresh tokens: 7-day expiry.
- Sessions managed in Redis; TTL 24 hours.
- Role-based access control enforced at API Gateway level: `worker` vs. `admin`.

### 7.2 API Security
- Rate limiting: 100 requests/minute per user.
- All inputs validated via Zod/Joi schema validation on every endpoint.
- CORS: Strict origin whitelist only.
- All PII encrypted at rest.

### 7.3 Payment Security
- Sensitive payment data handled exclusively by Razorpay (PCI-DSS compliant).
- Zoink-4-u never stores raw card or full UPI credentials.

### 7.4 AI/ML Model Governance
| Model | Retraining Frequency | Fallback |
|-------|---------------------|---------|
| Premium Pricing (XGBoost) | Weekly batch | Rule-based formula |
| Fraud Detection (Isolation Forest) | Phase 3 continuous | Layer 1 rules only |
| Trust Score Engine | Every Monday | Heuristic formula |
| Disruption Forecaster (LSTM) | Daily batch | Weather API 7-day forecast |

- All ML models are versioned and logged.
- Model accuracy is monitored via admin dashboard metrics.
- Fairness check: Pricing model must not show systematic bias against specific zones or new workers. Monthly fairness audit required.

### 7.5 Incident Response
- Security incidents (data breach, system compromise) must be escalated to the CTO within 1 hour.
- IRDAI and affected Riders must be notified within 72 hours of confirmed data breach (per DPDP Act 2023).

---

## 8. Partner Platform Policy

### 8.1 Premium Deduction Integration
- Platform commission: 5% of premium for payroll-deduction integration.
- Premium deductions must be transparent on the Rider's platform earnings statement.
- Zoink-4-u takes no action on a Rider's account on the platform; deactivations are solely the platform's domain.

### 8.2 Platform Data API
- Platform API access is read-only; Zoink-4-u cannot modify any Rider data on the platform.
- API credentials are stored in an encrypted secrets manager; never in source code.

### 8.3 Platform-Agnostic Coverage Guarantee
Zoink-4-u covers the **Rider**, not the platform. A Rider operating across Swiggy and Zomato is covered by their single Zoink-4-u policy across both platforms. Rider earnings data is aggregated across platforms (with consent) for fair payout calculation.

---

## 9. Reinsurance & Catastrophe Risk Policy

### 9.1 Reinsurance Structure
- **8% of premium revenue** is allocated to reinsurance.
- An excess-of-loss reinsurance arrangement covers claims above 45% loss ratio.
- Reinsurance partner must be IRDAI-registered.

### 9.2 Reserve Policy
- A catastrophe reserve is maintained starting from Year 1 surplus.
- Minimum reserve target: ₹12L per 10,000 active Riders.
- Reserve adequacy reviewed quarterly by the Finance/Actuarial team.

### 9.3 Catastrophic Exclusion Enforcement
- Events classified as pandemic, war, or NRBC automatically block all claims in the pipeline.
- The `PANDEMIC_LOCKDOWN` trigger type exists in the system but is permanently flagged as `EXCLUDED`. Any auto-detected pandemic-class event is logged but never processed for payout.

---

## 10. Regulatory & Compliance Policy

### 10.1 IRDAI Filing
- All product changes (new triggers, pricing changes, exclusion updates) must be filed under the IRDAI Use and File Procedure before going live.
- The exclusion schedule is included in the product filing document for the underwriting partner.
- Compliance budget: 2% of premium revenue allocated to regulatory, audit, and legal.

### 10.2 Rider Communication Compliance
- Exclusions must be presented to the Rider **before** policy activation (per Indian Contract Act 1872).
- Plain-language exclusion summary must be displayed during WhatsApp onboarding and on the PWA subscription page.
- Audio explainers (90-second voice clips in 12+ languages) explaining coverage and exclusions must be available at all times.

### 10.3 Grievance Redressal
- A dedicated Grievance Officer is designated per IRDAI requirements.
- Grievance contact details are displayed on the PWA and communicated during onboarding.
- Unresolved grievances are escalated to IRDAI's Integrated Grievance Management System (IGMS).

---

## 11. Employee & Admin Conduct Policy

### 11.1 Admin Access
- Admin dashboard access is role-gated; requires multi-factor authentication.
- Admin actions on the fraud review queue are fully audited with timestamps.
- Admins may not approve claims for Riders they are personally connected to (conflict of interest).

### 11.2 Data Access
- Employees access only the minimum Rider data required for their job function.
- All PII access is logged and auditable.
- No employee may export or copy Rider data outside of company-approved systems.

### 11.3 Whistleblower Protection
- Employees who report fraud, data misuse, or policy violations in good faith are protected from retaliation.
- Reports may be made anonymously to the Compliance Officer.

---

## 12. Onboarding & Offboarding Policy

### 12.1 Rider Onboarding (2-Minute Flow)
1. Phone number + OTP verification
2. Platform selection (Swiggy / Zomato / Other)
3. Zone selection (pincode or map)
4. Shift hours declaration
5. AI risk profile generation + personalised premium display
6. Plan selection + UPI payment (via Razorpay)
7. Coverage active immediately; dashboard confirms status

### 12.2 Rider Offboarding (Cancellation)
- Cancel anytime via WhatsApp or PWA; no human intervention required.
- No exit fees; no lock-in.
- Cancellation effective at end of current coverage week.
- All Rider data retained per Section 6.1 retention schedules; deletion on request within 30 days.

---

*This document is for internal use by Zoink-4-u (Zoink-4-u) employees, administrators, and the underwriting partner. It is not a public-facing document. All external communications about policy terms must use the TERMS_AND_CONDITIONS.md document.*
