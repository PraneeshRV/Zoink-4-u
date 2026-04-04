# Zoink-4-u: Standard Insurance Exclusions & Coverage Boundaries

> **IRDAI Compliance Reference** | Parametric Microinsurance Product Scope
> This document defines what Zoink-4-u **does NOT cover**, ensuring actuarial soundness, regulatory compliance, and protection of the premium pool from unbounded correlated losses.

---

## Why Exclusions Are Non-Negotiable

Parametric insurance works because the risk pool is **bounded**. Every premium collected funds a finite set of predictable, short-duration disruptions. Events that are unbounded in duration, correlated across all zones simultaneously, or catastrophic in scale would drain the entire pool and make the product insolvent. Exclusions are not fine print — they are the structural foundation that makes affordable ₹29-₹69/week premiums possible.

---

## Standard Exclusion Categories

### 1. War, Armed Conflict & Insurrection

| Attribute | Detail |
|-----------|--------|
| **Exclusion** | Loss of income directly or indirectly caused by declared or undeclared war, invasion, armed conflict, military action, civil war, insurrection, revolution, or martial law |
| **Why Excluded** | War-class events produce unbounded, correlated losses across all zones simultaneously. No weekly micro-premium can absorb nationwide military disruption. These events fall under sovereign risk, not insurable commercial risk |
| **IRDAI Precedent** | Standard exclusion in all Indian general insurance policies per IRDAI's General Insurance Product Guidelines |
| **Implementation** | Trigger type `WAR_CONFLICT` is hardcoded in the exclusion registry and rejected at the claims validation layer before any payout calculation |

### 2. Terrorism & Sabotage

| Attribute | Detail |
|-----------|--------|
| **Exclusion** | Loss of income caused by acts of terrorism (as defined under the Unlawful Activities Prevention Act, 1967), sabotage, politically motivated violence, or bioterrorism |
| **Why Excluded** | Terrorism introduces intentional, extreme loss volatility with accumulation risk. A single coordinated attack could trigger simultaneous claims across an entire city. The loss distribution is non-Gaussian and unmodelable with standard actuarial techniques |
| **IRDAI Precedent** | Terrorism is excluded from standard policies; coverage is available separately via the Indian Terrorism Risk Insurance Pool (managed by GIC Re) |
| **Implementation** | Events flagged by NLP news scrapers matching terrorism keywords are automatically classified as `TERRORISM` and excluded from the trigger pipeline |

### 3. Pandemic, Epidemic & Public Health Emergency

| Attribute | Detail |
|-----------|--------|
| **Exclusion** | Loss of income caused by pandemics, epidemics, or public health emergencies declared by WHO, ICMR, or state/central government health authorities. This includes but is not limited to: government-ordered lockdowns due to disease outbreaks, quarantine mandates affecting delivery operations, and platform shutdowns due to public health directives |
| **Why Excluded** | Pandemics create long-tail, multi-zone, prolonged business interruption spanning weeks to months. COVID-19 demonstrated that even large insurers with billions in reserves faced solvency stress from pandemic claims. A micro-premium product serving gig workers cannot absorb this class of systemic risk |
| **IRDAI Precedent** | Post-COVID, IRDAI mandated explicit pandemic exclusion clauses in all new general insurance products. Our exclusion aligns with IRDAI Circular IRDAI/HLT/REG/CIR/2020 |
| **Edge Case** | If a government orders a **localized, short-duration** health advisory (e.g., dengue fumigation in one ward for 48 hours) that does NOT constitute a declared epidemic, it MAY qualify under the `REGULATORY_SHUTDOWN` trigger category at the admin's discretion |
| **Implementation** | The `PANDEMIC_LOCKDOWN` trigger type exists in the system but is flagged as `EXCLUDED` in the exclusion registry. Any auto-detected pandemic-class event is logged but never processed for payout |

### 4. Nuclear, Radiological, Biological & Chemical (NRBC) Events

| Attribute | Detail |
|-----------|--------|
| **Exclusion** | Loss of income caused by nuclear reaction, radiation, radioactive contamination, biological weapon deployment, chemical weapon deployment, or any NRBC event regardless of cause (accidental or intentional) |
| **Why Excluded** | NRBC events have severity tails that exceed the risk appetite of any parametric product. A single nuclear incident could render entire cities uninhabitable for years, creating infinite-duration claims that no premium pool can fund |
| **IRDAI Precedent** | Universal exclusion across all classes of Indian insurance. Covered separately only through government-sponsored nuclear liability pools under the Civil Liability for Nuclear Damage Act, 2010 |
| **Implementation** | `NRBC_EVENT` trigger type is hardcoded as excluded. Cannot be overridden by admin |

### 5. Platform Employment Actions (Non-Disruption Events)

| Attribute | Detail |
|-----------|--------|
| **Exclusion** | Loss of income caused by: platform account deactivation, termination, or suspension; platform-initiated policy changes reducing order allocation; mass layoffs or restructuring by the delivery platform; voluntary resignation from platform |
| **Why Excluded** | Zoink-4-u covers **external disruptions** that prevent willing workers from earning. Employment-related income loss is a contractual/labor issue between the rider and the platform, not an insurable parametric event. Including employment actions would create moral hazard (riders getting deactivated for misconduct could claim insurance) |
| **Implementation** | Claims are cross-referenced against platform API status. If the rider's platform account shows `DEACTIVATED` or `SUSPENDED`, the claim is rejected with reason `EMPLOYMENT_ACTION_EXCLUDED` |

### 6. Voluntary & Self-Inflicted Disruptions

| Attribute | Detail |
|-----------|--------|
| **Exclusion** | Loss of income caused by: rider choosing not to work during active coverage; rider being intoxicated or under influence of substances; rider engaging in illegal activity; rider deliberately entering a known danger zone against official advisories; self-inflicted equipment damage |
| **Why Excluded** | Parametric insurance requires an **involuntary, externally verifiable** trigger event. Voluntary non-work creates moral hazard — riders would be incentivized to stay home and collect payouts. This exclusion is the behavioral backbone that keeps the 30% loss ratio viable |
| **Implementation** | The Zoink Score engine detects patterns of "convenient" non-work during minor events. Riders with suspiciously high claim-to-disruption ratios are flagged and moved to manual review |

### 7. Pre-Existing & Scheduled Disruptions

| Attribute | Detail |
|-----------|--------|
| **Exclusion** | Loss of income caused by: disruptions that were publicly known BEFORE the rider's policy activation; scheduled maintenance shutdowns announced by the platform > 24 hours in advance; pre-announced public events (marathons, parades) with > 48 hours notice where alternative routes exist |
| **Why Excluded** | Allowing claims for known disruptions creates adverse selection — riders would subscribe only when they know a disruption is coming, drain the pool, and cancel. The 72-hour activation delay exists precisely to prevent this |
| **Implementation** | Trigger events are timestamped. If the trigger event was publicly known (via news NLP or platform announcements) before the rider's policy `created_at` timestamp, the claim is rejected with `PRE_EXISTING_EXCLUSION` |

---

## Exclusion Rationale Matrix (Summary)

| # | Exclusion Class | Risk Type | Why Uninsurable at ₹29-69/week |
|---|----------------|-----------|-------------------------------|
| 1 | War / Armed Conflict | Catastrophic correlated | Unbounded nationwide loss, sovereign risk |
| 2 | Terrorism / Sabotage | Catastrophic correlated | Intentional, extreme volatility, accumulation risk |
| 3 | Pandemic / Epidemic | Systemic correlated | Long-tail, multi-zone, months-long duration |
| 4 | Nuclear / NRBC | Extreme tail | Infinite-duration, city-level destruction |
| 5 | Platform Employment | Non-insurable | Contractual/labor issue, not external disruption |
| 6 | Voluntary / Self-Inflicted | Moral hazard | Destroys parametric trigger integrity |
| 7 | Pre-Existing / Scheduled | Adverse selection | Known events exploit the premium pool |

---

## How Exclusions Are Enforced in Code

Exclusions are enforced at **two levels** in the claims pipeline:

### Level 1: Trigger Classification (Pre-Processing)
Before any payout is calculated, every incoming trigger event is checked against the **Exclusion Registry** — a hardcoded list of excluded trigger types. If the event matches an excluded category, it is logged for audit but **never enters the payout pipeline**.

```
Incoming Trigger Event
        │
        ▼
┌─────────────────────┐
│ EXCLUSION REGISTRY  │
│ CHECK               │
│                     │
│ WAR_CONFLICT?       │──► BLOCKED (logged, no payout)
│ TERRORISM?          │──► BLOCKED
│ PANDEMIC_LOCKDOWN?  │──► BLOCKED
│ NRBC_EVENT?         │──► BLOCKED
│ EMPLOYMENT_ACTION?  │──► BLOCKED
│ VOLUNTARY_NONWORK?  │──► BLOCKED
│ PRE_EXISTING?       │──► BLOCKED
│                     │
│ None matched?       │──► PROCEED to payout pipeline
└─────────────────────┘
```

### Level 2: Claim Validation (Post-Processing)
Even if a trigger passes Level 1, additional contextual checks run during the 5-layer fraud validation:
- **Platform cross-reference:** If rider's account is suspended → `EMPLOYMENT_ACTION_EXCLUDED`
- **Temporal check:** If event was known before policy activation → `PRE_EXISTING_EXCLUSION`
- **Behavioral check:** If rider's Zoink Score patterns suggest voluntary non-work → flagged for manual review

---

## Rider Communication

Exclusions are communicated to riders in plain language during onboarding:

> **What we DON'T cover (in simple terms):**
> - Wars or terrorist attacks (these are too big for any weekly insurance)
> - Pandemics like COVID (government handles these, we can't)
> - Nuclear disasters (way beyond what ₹49/week can protect)
> - If your Swiggy/Zomato account gets banned (that's between you and them)
> - If you choose not to work on a nice sunny day (we only pay when something STOPS you)
> - If you knew about a bandh before you bought the plan (no gaming the system!)

This is displayed during WhatsApp onboarding and on the PWA subscription page before premium payment.

---

## Regulatory Alignment

| Regulation | How We Comply |
|------------|---------------|
| **IRDAI General Insurance Guidelines** | All 7 standard exclusion categories are explicitly defined and enforced programmatically |
| **IRDAI Use and File Procedure** | Exclusion schedule is included in the product filing document for the underwriting partner |
| **Aadhaar Act 2016** | Exclusion enforcement does not require additional Aadhaar data beyond the existing token |
| **DPDP Act 2023** | Exclusion logs store only event type and decision (BLOCKED/ALLOWED), no personal rider data |
| **Indian Contract Act, 1872** | Exclusions are presented to the rider BEFORE policy activation, satisfying informed consent |
| **Consumer Protection Act, 2019** | Plain-language exclusion summary prevents claims of "hidden terms" |
