# 🧮 Comprehensive Risk Scoring & Omni-Tier Payout Model

To ensure **Zoink-4-u** remains highly profitable for the insurer while feeling incredibly fair to the gig worker, we need a massive mathematical model that translates *disruption frequency* and *scenario severity* into precise percentages. 

We have completely integrated the **29 Parametric Triggers** from our Coverage Scope into this dynamic percentage-based model, mapped across four inclusive app tiers.

---

## 1. The Ultimate Parameter List (Everything Included)

### A. Core Environmental & Infrastructure Risk (The Base)
1. **Base Severity:** The intrinsic danger of the trigger (e.g., Extreme Heat = 7/10, Category 4 Cyclone = 10/10).
2. **Zone Risk Factor:** Pincode-level historical frequency of floods, strikes, and infrastructure failures.
3. **Seasonal Risk Multiplier:** Monsoon (1.3x) vs. Winter (1.1x) vs. Dry Season (1.0x).
4. **Supply Chain Disruption Index (Added):** Is this a direct rider blackout (rain) or an indirect supply blackout (LPG gas crisis shutting down restaurants)?
5. **Regulatory Shutdown Factor (Added):** Are government orders (GRAP stage IV, VIP movement, Curfews) actively blocking the route?

### B. Micro-Economic & Contextual Risk (The Context)
6. **Time-of-Day Multiplier:** A 3-hour disruption from 7 PM to 10 PM (Dinner Rush) destroys a rider's daily income far more than a 3-hour disruption from 3 PM to 6 PM.
7. **Surge Pricing Index:** Platforms surge pay during floods. The risk score must acknowledge lost *surge* wages.
8. **Micro-market Restaurant Density:** A route with 50 cloud kitchens (high economic loss) vs. a quiet residential suburb (low economic loss).
9. **Disruption Duration:** Did the event last 1 hour (Fog) or 3 days (Urban Flooding)?

### C. Rider-Specific Risk (The Behavioral)
10. **Claim History:** Past claim frequency of the specific rider.
11. **Work Hours Logged:** Is the rider part-time (15 hrs/wk) or full-time (50+ hrs/wk)?
12. **Platform Risk:** Swiggy vs. Zomato metrics (e.g., which platform recovers dispatching faster).
13. **Zoink-4-u Trust/Loyalty Score (GigShield Score):** A continuous score (0-100) based on rider loyalty and zero-fraud history.

---

## 2. Zoink-4-u Subscription Tiers (Bronze to Platinum)
Instead of forcing everyone into one bracket, the app separates riders into **dynamic tiers** based on their weekly earning potential and Trust Score.

| Tier Name | Target Rider Profile | Risk % Deduction | Max Weekly Payout Cap | Special Perks |
|---|---|---|---|---|
| 🥉 **Bronze Tier** | Part-time (Students, Weekend only) | **1.2%** of weekly earnings | ₹800 / week | Core weather disruption coverage |
| 🥈 **Silver Tier** | Standard Full-time (30-40 hrs) | **1.8%** of weekly earnings | ₹1,500 / week | Adds Social/Civil disruption coverage |
| 🥇 **Gold Tier** | High-volume earners (50+ hrs) | **2.5%** of weekly earnings | ₹2,800 / week | Adds Platform Crash & Supply Chain coverage + No-Claim Rewards |
| 💎 **Platinum Tier** | Elite, high-trust riders (6+ months) | **Flat 2.0%** (VIP Discount) | **₹4,000 / week** | Auto-approved AI claims within 1 hour + ₹200 Emergency Micro-Advances |

*Example:* A Gold Tier Zomato rider expects to earn ₹8,000 this week.
**Premium = ₹8,000 × 0.025 = ₹200/week.**

---

## 3. The Master Calculation Formulas

### Formula A: Calculating the Scenario Risk Score (SRS)
Every unique disruption event from our Coverage Scope gets an SRS from **0.0 to 10.0**.

> **`SRS = [ (Base Severity × Seasonal Risk × Supply/Regulatory Factor) + Time-of-Day + Micro-Market Density ] ÷ Disruption Duration`**

*Example:* A flash flood happens.
* Base Severity = 7
* Season = Monsoon (1.2)
* Supply Factor = Standard (1.0)
* Time = 8 PM Dinner Rush (+ 2.0)
* Density = High (+ 1.0)
* **Final SRS = (7 × 1.2 × 1.0) + 2.0 + 1.0 = 11.4 (Capped at 10.0)**

### Formula B: Calculating the Rider's Premium Deduction
> **`Final Weekly Premium = Expected Weekly Earnings × [Tier %] × (Zone Risk × Platform Risk) - (Trust Score Discount)`**

### Formula C: Calculating the Salary Payout % (Preventing Moral Hazard)
If you pay a worker 100% of their lost wages for a minor drizzle, they will *want* to sit at home. We use **The 80/20 Rule**.

> **`Instant Payout = (Verified Lost Hours × Hourly Average Wage × Surge Index) × (SRS-adjusted Payout Percentage)`**

**The SRS-adjusted Payout Percentages:**
1. **Minor Disruption (SRS 1-4):** Pays **60%** of average hourly wage. (Encourages riders to try and work if it's safe).
2. **Standard Disruption (SRS 5-7):** Pays **80%** of average hourly wage. (Covers rent and food comfortably).
3. **Severe/Danger Event (SRS 8-10):** Pays **100%** of baseline hourly wage. (During an active cyclone or bandh, you do *not* want them on the road. Paying 100% physically stops them from taking dangerous risks).

---

## 4. What We Have That Traditional Insurers (And Competitors) Do Not Have

Hackathon judges will ask: *"Why can't Acko, Digit Insurance, or Zomato just build this tomorrow?"* 
Here is your direct competitive advantage matrix:

| Feature / Metric | Traditional Insurance (e.g., Acko/Digit) | Competitor Startup (GigShield) | **Our Platform (Zoink-4-u)** 🛡️ |
|---|---|---|---|
| **Coverage Scope** | Accidents, Health, Vehicle only. | Basic weather & social (25 triggers). | **Deep Gig-Specific Income Loss (29 Triggers), including Platform crashes and LPG supply gaps.** |
| **Pricing Model** | Fixed Annual/Monthly premiums (₹500-₹1500). | Fixed Weekly tiers (₹29-₹79). | **Dynamic %-based micro-deduction** (Matches exact earning volatility). |
| **App Ecosystem** | Force 50MB app downloads. | Solo mobile applications. | **Omni-Channel: WhatsApp Native NLP + PWA Companion App.** |
| **User Retention (Loyalty)** | "Pay us and hope you don't use it." | Zero specific loyalty systems. | **No-Claim Rewards (4 weeks clean = 1 week free) to heavily drive down loss-ratio and fraud.** |
| **Emergency Liquidity** | Forms take 30 days to process. | Process takes 24-48 hours. | **Platinum Tier gets ₹200 UPI Emergency Micro-Advances instantly** during multi-day cyclones before the claim is even finished. |
| **Moral Hazard Prevention** | High fixed deductibles (e.g., first ₹1000). | Flat payouts promoting people staying home. | **Dynamic 60% / 80% / 100% sliding scale** tied to exact Scenario Risk Scores (SRS). |
