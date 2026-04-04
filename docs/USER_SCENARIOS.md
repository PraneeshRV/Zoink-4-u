# 📖 User Scenarios & Stories — Zoink-4-u

## Persona Overview

We focus on **Food Delivery Partners** (Zomato/Swiggy) across three archetypes that represent the majority of gig workers:

| Persona | City | Experience | Monthly Earnings | Risk Profile |
|---------|------|-----------|-----------------|-------------|
| 🧑 Ramesh | Mumbai | 3 years | ₹18,000-22,000 | High (monsoon flooding) |
| 👩 Priya | Bangalore | 1 year | ₹8,000-12,000 | Medium (seasonal rain) |
| 🧑 Arjun | Delhi | 3 months | ₹12,000-15,000 | High (AQI + heat) |

---

## Scenario 1: Heavy Monsoon Rain — Ramesh (Mumbai)

### Context
- **Date:** Monday, July 14, 2025
- **Location:** Andheri West, Mumbai
- **Condition:** IMD heavy rain warning; rainfall exceeds 60mm/hr by 1 PM
- **Ramesh's status:** Logged in on Swiggy since 10 AM, completed 4 deliveries

### Timeline

| Time | What Happens | Zoink-4-u Action |
|------|-------------|---------------------|
| 10:00 AM | Ramesh starts his shift — clear weather | Monitoring active, no triggers |
| 12:30 PM | Rain starts intensifying in Andheri zone | Weather API shows 35mm/hr — below threshold |
| 1:00 PM | Rainfall crosses 50mm/hr; roads waterlogging | **🔴 TRIGGER FIRES:** rainfall > 40mm/hr for zone |
| 1:15 PM | System identifies Ramesh has active policy in Andheri zone | Coverage confirmed, event ID created |
| 1:20 PM | Fraud check: GPS confirms Ramesh is in Andheri | ✅ Location validated |
| 1:20 PM | Weather cross-check: OpenWeatherMap confirms heavy rain | ✅ Weather validated |
| 6:00 PM | Rain subsides below threshold | **Event window closed:** 1 PM – 6 PM = 5 hours |
| 6:05 PM | Payout calculated: 5 hours × ₹80/hr = ₹400 | ₹400 credited to Ramesh's UPI |
| 6:06 PM | Push notification sent | *"Zoink-4-u: ₹400 credited for rain disruption in Andheri"* |

### User Story

> **As** Ramesh, a full-time Swiggy delivery partner in Mumbai,  
> **I want** my income to be automatically protected when heavy rain stops me from working,  
> **So that** I don't lose ₹800+ on a single rainy day during monsoon season.

---

## Scenario 2: Severe Air Pollution — Arjun (Delhi)

### Context
- **Date:** Wednesday, November 5, 2025
- **Location:** Lajpat Nagar, Delhi
- **Condition:** Delhi AQI crosses 450; GRAP Stage 4 restrictions announced
- **Arjun's status:** Was planning to start his shift at 9 AM

### Timeline

| Time | What Happens | Zoink-4-u Action |
|------|-------------|---------------------|
| 7:00 AM | WAQI API shows AQI hitting 420 in South Delhi | Monitoring — approaching threshold |
| 8:00 AM | AQI crosses 450; government advisory issued | **🔴 TRIGGER FIRES:** AQI > 350 sustained |
| 8:05 AM | System identifies Arjun's active policy in Lajpat Nagar zone | Coverage confirmed |
| 8:10 AM | Fraud validation: zone-wide trigger, no GPS check needed | ✅ Zone-level event (affects all workers) |
| 8:00 PM | AQI drops below 350 | **Event window closed:** 8 AM – 8 PM = 12 hours (capped at 8 working hours) |
| 8:05 PM | Payout: 8 hours × ₹70/hr = ₹560 | ₹560 credited |

### User Story

> **As** Arjun, a new Zomato delivery partner in Delhi,  
> **I want** protection when dangerous pollution levels prevent me from working safely,  
> **So that** I can stay home without worrying about losing an entire day's income.

---

## Scenario 3: Urban Flood Alert — Ramesh (Mumbai)

### Context
- **Date:** Thursday, August 21, 2025
- **Location:** Andheri West, Mumbai
- **Condition:** BMC issues flood warning; knee-deep waterlogging reported
- **Ramesh's status:** Unable to leave home

### Timeline

| Time | What Happens | Zoink-4-u Action |
|------|-------------|---------------------|
| 6:00 AM | Overnight rain causes widespread waterlogging | Weather data shows 120mm in 12 hours |
| 7:00 AM | BMC flood warning for Andheri, Jogeshwari, Goregaon | **🔴 TRIGGER FIRES:** Official flood alert for zone |
| 7:05 AM | Flat payout triggered (flood = full-day disruption) | Full-day coverage activated |
| 8:00 PM | Official all-clear issued | Event window closed |
| 8:05 PM | Payout: Full-day flat rate = ₹650 | ₹650 credited |

### User Story

> **As** Ramesh,  
> **I want** automatic full-day income protection when my entire zone floods,  
> **So that** I don't lose ₹1,000 sitting at home with waterlogged streets.

---

## Scenario 4: Extreme Heat Wave — Priya (Bangalore)

### Context
- **Date:** Friday, April 18, 2025  
- **Location:** Koramangala, Bangalore
- **Condition:** Temperature hits 42°C (unusual for Bangalore); IMD heat advisory
- **Priya's status:** Part-time, was planning to work the lunch rush (11 AM – 2 PM)

### Timeline

| Time | What Happens | Zoink-4-u Action |
|------|-------------|---------------------|
| 10:00 AM | Temperature forecast at 40°C+ for Bangalore | Monitoring — nearing threshold |
| 11:30 AM | Temperature crosses 45°C in Koramangala zone | **🔴 TRIGGER FIRES:** Temp > 45°C for 2+ hours |
| 11:35 AM | Priya's active Basic plan confirmed | Coverage check passed |
| 3:30 PM | Temperature drops below 45°C | **Event window:** 11:30 AM – 3:30 PM = 4 hours |
| 3:35 PM | Payout: 3 hours (Priya's registered shift overlap) × ₹60/hr = ₹180 | ₹180 credited |

### User Story

> **As** Priya, a part-time Zomato rider,  
> **I want** heat protection for only the hours I was scheduled to work,  
> **So that** I'm fairly compensated for lost peak-hour earnings.

---

## Scenario 5: Sudden Strike / Curfew — Zone Shutdown

### Context
- **Date:** Tuesday, September 9, 2025
- **Location:** HSR Layout, Bangalore
- **Condition:** Sudden bandh called; police impose Section 144 in the area
- **Multiple workers affected**

### Timeline

| Time | What Happens | Zoink-4-u Action |
|------|-------------|---------------------|
| 9:00 AM | Bandh announced in parts of Bangalore | Admin monitors news feeds |
| 9:30 AM | Admin confirms: HSR Layout zone under Section 144 | **🔴 MANUAL TRIGGER:** Admin activates curfew trigger for zone |
| 9:35 AM | All active policies in HSR Layout identified (47 workers) | Bulk event created |
| 6:00 PM | Restrictions lifted | Event window: 9:30 AM – 6:00 PM |
| 6:10 PM | Payouts calculated per worker based on their plan + shift hours | Bulk UPI payouts processed |

### User Story

> **As** a delivery partner in an area under sudden curfew,  
> **I want** the system to recognize zone-level shutdowns and protect all affected workers,  
> **So that** we don't each have to individually prove we couldn't work.

---

## Scenario 6: Fraud Attempt — GPS Spoofing Detection

### Context
- **Date:** Thursday, July 17, 2025
- **Location:** Claims Koramangala, Bangalore
- **Actual Location:** Whitefield, Bangalore (15 km away, clear weather)
- **Worker:** Suspicious history (3 claims in 2 weeks, peer average is 0.5)

### What Happens

| Check | Result |
|-------|--------|
| **Weather API** | ✅ Heavy rain confirmed in Koramangala |
| **GPS Validation** | ❌ Worker's last 10 GPS pings from Whitefield (no rain) |
| **Pattern Check** | ⚠️ Worker has claimed 3x more than zone average |
| **Trust Score** | 35/100 — already in "review required" tier |
| **Decision** | ❌ **CLAIM REJECTED** |

### Post-Rejection Actions
1. Worker's GigShield Trust Score reduced by 20 points → now 15/100
2. All future claims from this worker routed to manual review queue
3. Alert created on admin dashboard
4. Worker receives notification: *"Claim could not be verified. Contact support if you believe this is an error."*

---

## Scenario 7: Onboarding Flow — New Worker Registration

### Priya Signs Up

```
Step 1: Open Zoink-4-u link (shared by fellow rider)
    → Mobile-optimized landing page loads

Step 2: Enter phone number → OTP verification
    → Quick, familiar auth (no email needed)

Step 3: Select delivery platform: [Zomato] [Swiggy] [Other]
    → Priya picks Zomato

Step 4: Enter operating zone: Pin code or map selection
    → Priya selects Koramangala (560034)

Step 5: Enter typical shift hours: [11 AM - 2 PM, 6 PM - 10 PM]
    → System notes: ~7 hours/day, part-time profile

Step 6: AI generates risk profile + personalized premium
    → "Your zone: Medium Risk | Season: Dry | Premium: ₹36/week"
    → Shows: "You're protected for up to ₹1,000/week in income loss"

Step 7: Choose plan: [Basic ₹29] [Standard ₹36 ✅ Recommended] [Premium ₹55]
    → Priya picks Standard

Step 8: Pay ₹36 via UPI (Razorpay checkout)
    → Coverage starts immediately!

Step 9: Dashboard shows:
    → "🛡️ Active until March 18 | Zone: Koramangala | Plan: Standard"
```

---

## Summary: User Stories Quick Reference

| Story ID | As a... | I want... | So that... |
|----------|---------|----------|-----------|
| US-01 | Delivery partner | Auto-protection during heavy rain | I don't lose daily income |
| US-02 | Worker in polluted city | AQI-triggered coverage | I can stay safe indoors without financial stress |
| US-03 | Worker in flood zone | Full-day coverage on flood days | I'm not penalized for city infrastructure failures |
| US-04 | Part-time rider | Protection only for my scheduled hours | I pay fair premiums and get fair payouts |
| US-05 | Worker in curfew area | Zone-wide auto-protection | I don't have to prove I couldn't work |
| US-06 | Insurer/Admin | Automatic fraud detection | We minimize false payouts |
| US-07 | New worker | Simple 2-minute onboarding | I can get coverage without paperwork |
