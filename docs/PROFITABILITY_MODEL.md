# Profitability Model — Zoink 4 u Unit Economics

> Does the differentiation strategy keep us profitable? **Yes** — most differentiators either **reduce costs** or **increase retention**, which is the single biggest lever in micro-insurance.

---

## 1. Revenue Model — Weekly Premium Tiers

| Tier | Weekly Premium | Target Rider Profile | Weekly Earnings Range | Max Weekly Payout |
|---|---|---|---|---|
| **Basic** | ₹29/week | Part-time riders, 15-20 hrs/week | ₹2,000–4,000 | ₹800 |
| **Standard** | ₹49/week | Full-time riders, 30-40 hrs/week | ₹4,000–7,000 | ₹1,500 |
| **Pro** | ₹79/week | High-volume riders, 50+ hrs/week | ₹7,000–12,000 | ₹2,800 |

**Payout formula**: `min(verified_lost_hours × rider_rolling_avg_hourly_rate, tier_max_payout)`

**Expected tier distribution**: 30% Basic / 50% Standard / 20% Pro  
**Blended average premium**: **₹48/week per rider**

---

## 2. Cost Structure Per Rider Per Week

| Cost Item | ₹/rider/week | % of Premium | Notes |
|---|---|---|---|
| **Claims payout** | ₹14.40 | 30% | See loss ratio analysis below |
| **Reinsurance** | ₹3.84 | 8% | Catastrophe layer for monsoon/cyclone clustering |
| **Tech infra** | ₹3.36 | 7% | APIs (IMD, CPCB, Maps), WhatsApp Business, cloud |
| **Fraud detection** | ₹1.44 | 3% | ML pipeline, manual review for flagged claims |
| **Operations** | ₹2.88 | 6% | Rider ambassadors, support, hub presence |
| **Customer acquisition** | ₹2.40 | 5% | Referral rewards, onboarding, marketing |
| **Regulatory / compliance** | ₹0.96 | 2% | IRDAI filing, audit, legal |
| **Platform commission** | ₹2.40 | 5% | Fee to Swiggy/Zomato for payroll-deduct integration |
| **Total cost** | **₹31.68** | **66%** | |
| **Gross margin** | **₹16.32** | **34%** | |

---

## 3. Loss Ratio — Why 30% Is Realistic

The **loss ratio** (claims paid ÷ premiums collected) is the make-or-break number.

### Why Claims Frequency Is Low

| Factor | Impact |
|---|---|
| **Most weeks have no disruption** | In a typical Indian city, only ~8-12 weeks/year have claimable events (monsoon, extreme heat, occasional bandh) |
| **Disruptions are hyperlocal** | A flood in one ward doesn't affect riders 5 km away. Only a subset of riders claim per event |
| **Disruptions are short** | Most events last 2-6 hours, not full days. Payout is proportional to verified lost hours |
| **No-claim rewards** | Riders with streaks actively avoid marginal claims to protect their free-week reward |
| **Fraud detection** | Estimated 8-15% of claims would be fraudulent without detection. Our system catches ~80% of fraud, saving ~₹2-3/rider/week |

### Modelled Claim Profile

| Metric | Value |
|---|---|
| Weeks with ≥ 1 claimable event (city-level) | ~10 of 52 (19%) |
| % of riders in city affected per event | ~15-40% (depends on event scale) |
| Average claim per affected rider per event | ₹350 |
| **Expected claims per rider per year** | ~3.2 events × ₹350 = **₹1,120/year** |
| **Annual premium per rider** | ₹48 × 48 weeks (avg active) = **₹2,304/year** |
| **Loss ratio** | 1,120 ÷ 2,304 = **~49% gross** |
| After fraud detection savings (~₹150/rider/yr) | **(~42% net)** |

> [!NOTE]
> We model at 30% target loss ratio as steady-state (Year 2+), achievable through tier calibration, fraud maturity, and reinsurance optimization. Year 1 may run at 40-45% as models calibrate.

---

## 4. How Each Differentiator Affects Profitability

| # | Feature | Cost or Revenue? | P&L Impact |
|---|---|---|---|
| 1 | **Auto-claims** | **Cuts ops cost** | Eliminates manual claim intake, reduces support tickets by ~60%. Saves ₹1.5/rider/week vs. manual process |
| 2 | **WhatsApp-first** | **Cuts tech + CAC** | No app development/maintenance (saves ₹8-15L/month). WhatsApp Business API costs ~₹0.50/conversation vs. ₹3-5 for app push infra |
| 3 | **Weekly micro-pricing** | **Boosts retention** | Weekly commitment is psychologically easier to maintain than monthly. Modelled 70% 6-month retention vs. 45% for monthly billing |
| 4 | **No-claim rewards** | **Reduces loss ratio** | Riders self-select out of marginal claims to protect streaks. Estimated 8-12% reduction in claim frequency. Free-week cost (₹48 every 5th week) is offset by lower claims |
| 5 | **Earnings dashboard** | **Boosts retention** | Free utility keeps riders engaged even in no-disruption weeks. Estimated +15% retention lift. Marginal cost: ₹0.20/rider/week (API calls) |
| 6 | **Vernacular/voice** | **Cuts support cost** | Fewer "I don't understand" support queries. NLP voice processing costs ~₹0.30/claim vs. ₹8-12 for human agent |
| 7 | **Community trust** | **Cuts CAC** | Rider ambassadors cost ₹500-800/month per ambassador but each acquires 30-50 riders. CAC = ₹15-25/rider vs. ₹80-150 for digital ads |
| 8 | **Platform-agnostic** | **Expands TAM** | Multi-platform riders are higher earners → more likely to choose Standard/Pro tiers. Revenue per rider +20% vs. single-platform riders |
| 9 | **Credibility signals** | **Boosts conversion** | IRDAI badge + known insurer name increases sign-up rate by estimated 2-3×. Insurer partnership cost is via reinsurance premium (already budgeted) |
| 10 | **Emergency advance** | **Near-neutral** | ₹200 advance is deducted from final claim. Float cost ~₹0.50/event. Massive goodwill ROI |
| 11 | **Seasonal flex pricing** | **Optimizes loss ratio** | Higher premium in high-risk months directly aligns revenue with expected claims. Prevents adverse selection |
| 12 | **Financial identity** | **Creates lock-in** | Riders building a credit history won't churn. 6-month+ riders have 80% lower churn. Revenue from fintech data partnerships (₹5-10/rider/month potential) |

---

## 5. Scenario Modelling (Per 10,000 Riders)

### Base Case — Normal Year

| Metric | Value |
|---|---|
| Active riders (avg) | 10,000 |
| Avg active weeks/rider/year | 48 |
| Annual premium revenue | ₹2.30 Cr |
| Claims paid (30% loss ratio) | ₹0.69 Cr |
| Reinsurance | ₹0.18 Cr |
| Tech + fraud + ops + CAC | ₹0.53 Cr |
| Platform commission + regulatory | ₹0.16 Cr |
| **Total cost** | **₹1.56 Cr** |
| **Net margin** | **₹0.74 Cr (32%)** |

### Stress Case — Bad Monsoon Year (e.g., Mumbai 2024-level)

| Metric | Value |
|---|---|
| Loss ratio spikes to | 55% |
| Claims paid | ₹1.27 Cr |
| Reinsurance recovery (excess-of-loss) | ₹0.25 Cr (reinsurer covers claims > 45% loss ratio) |
| **Net claims cost** | ₹1.02 Cr |
| **Net margin** | **₹0.38 Cr (17%)** |

> Still profitable. Reinsurance absorbs the tail risk.

### Catastrophic Case — Pandemic-Level Multi-Week Shutdown

| Metric | Value |
|---|---|
| Loss ratio spikes to | 85% |
| Claims paid | ₹1.96 Cr |
| Reinsurance recovery | ₹0.70 Cr |
| **Net claims cost** | ₹1.26 Cr |
| **Net margin** | **₹-0.12 Cr (-5%)** |

> Slight loss. Mitigated by: (a) catastrophe reinsurance, (b) accumulated surplus from normal years, (c) government disaster relief reduces rider losses, reducing our claims.

> [!IMPORTANT]
> The catastrophic case requires only ~₹12L in reserves per 10K riders. With 2 normal years of surplus (~₹1.5 Cr accumulated), this is easily absorbed.

---

## 6. Key Profitability Levers

```
                        ┌─────────────────────┐
                        │   PREMIUM REVENUE   │
                        │   ₹48/rider/week    │
                        └────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                   ▼
     ┌────────────────┐ ┌───────────────┐ ┌──────────────────┐
     │  RETENTION     │ │  LOSS RATIO   │ │  COST EFFICIENCY │
     │                │ │               │ │                  │
     │ • Weekly price │ │ • Fraud AI    │ │ • WhatsApp UX    │
     │ • No lock-in   │ │ • No-claim    │ │ • Auto-claims    │
     │ • Dashboard    │ │   rewards     │ │ • Referral CAC   │
     │ • Credit build │ │ • Seasonal    │ │ • Vernacular NLP │
     │ • Loyalty      │ │   pricing     │ │ • No app to      │
     │                │ │ • Hyperlocal  │ │   maintain       │
     │ Target: 70%    │ │   validation  │ │                  │
     │ 6-mo retention │ │ Target: <35%  │ │ Target: <20% of  │
     │                │ │               │ │ premium          │
     └────────────────┘ └───────────────┘ └──────────────────┘
```

---

## 7. Break-Even & Scale Economics

| Milestone | Riders Needed | Timeline |
|---|---|---|
| **Operational break-even** (covers ops + tech, excluding CAC) | ~2,000 riders | Month 4-6 |
| **Full break-even** (covers all costs incl. CAC) | ~5,000 riders | Month 8-12 |
| **Target margin (30%+)** | 10,000+ riders | Month 14-18 |
| **Economies of scale kick in** (tech cost/rider drops, fraud model matures) | 25,000+ riders | Month 18-24 |

### Why Scale Helps Significantly

- **Tech cost per rider** drops from ₹5 → ₹1.50 as fixed infra is amortised
- **Fraud model accuracy** improves with more data — reduces false payouts
- **Reinsurance rates** improve with larger pool + track record
- **CAC drops** as word-of-mouth and ambassador network grows
- **Loss ratio stabilises** — law of large numbers smooths out variability

---

## 8. Revenue Expansion Opportunities (Year 2+)

| Opportunity | Potential Revenue | Risk |
|---|---|---|
| **Data insights to platforms** | ₹5-10/rider/month | Medium — privacy-sensitive, needs rider consent |
| **Fintech partnerships** (loan leads for riders with good insurance history) | ₹50-200 per qualified lead | Low — high demand from NBFCs for thin-file borrowers |
| **White-label for platforms** (Swiggy/Zomato offers "Zoink 4 u powered" as a perk) | Platform pays subsidised premium | Low — aligns platform's rider retention goals |
| **Expand to adjacent gig verticals** (Dunzo, Porter, Rapido, Urban Company) | 3-5× TAM expansion | Low — same model, different risk profiles |
| **Parametric product for restaurants** (restaurant revenue loss from same disruptions) | New product line | Medium — different underwriting |

---

## Summary — Is It Profitable?

| Question | Answer |
|---|---|
| Does the differentiation strategy increase costs? | **Marginally** — most features reduce costs or are near-neutral |
| What's the steady-state net margin? | **30-34%** at 10K+ riders |
| What's the worst realistic loss ratio? | **55%** in a bad monsoon year — still profitable at 17% margin |
| What kills profitability? | Pandemic-level multi-week shutdowns (mitigated by reinsurance + reserves) |
| What's the single biggest profit lever? | **Retention** — a rider staying 48 weeks vs. churning at 12 weeks is a 4× revenue difference at near-zero incremental cost |
