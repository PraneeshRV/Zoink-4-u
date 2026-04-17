# Coverage Scope — GigShield Income-Loss Insurance

> Weekly-premium micro-insurance for food-delivery gig workers in India (Swiggy, Zomato, Uber Eats).

> [!IMPORTANT]
> **Strict Exclusions** — This policy does **NOT** cover health, life, accidents, medical bills, or vehicle repairs under any circumstance.

---

## How Coverage Works (Summary)

| Element | Detail |
|---|---|
| **Who** | Registered food-delivery riders on partner platforms |
| **What** | Loss of earning opportunity due to external disruptions |
| **When** | During the rider's active logged-in shift window |
| **Payout** | Proportional to verified lost hours × rider's rolling-average hourly earnings |
| **Premium** | Fixed weekly subscription deducted from platform payout |

---

## Category A — Environmental Disruptions (1–11)

### 1. Extreme Heat Wave
| Aspect | Detail |
|---|---|
| **Trigger** | IMD issues an Orange/Red heat alert for city; ambient temp ≥ 45 °C sustained for ≥ 3 hours during shift |
| **Impact** | Platform throttles or disables order dispatch in affected zones; substantially fewer orders available |
| **Fraud Vector** | Rider claims heat disruption while operating in an unaffected cooler zone, or logs in briefly then goes offline |
| **Anti-Fraud** | Cross-reference **IMD API hourly station data** with rider's GPS pin-code. Validate against platform dispatch data. |

### 2. Heavy Rainfall / Waterlogging
| Aspect | Detail |
|---|---|
| **Trigger** | IMD rainfall ≥ 64.5 mm/day or real-time gauge shows ≥ 15 mm/hr in rider's ward; visible waterlogging |
| **Impact** | Roads impassable, order volume drops, platform may pause dispatch |
| **Fraud Vector** | Rider is in a dry micro-zone but claims rain disruption using a neighbouring ward's data |
| **Anti-Fraud** | Use **hyperlocal rain data**. Payout only for verified rain-overlap hours. |

### 3. Urban Flooding
| Aspect | Detail |
|---|---|
| **Trigger** | Municipal authority or NDMA declares flood warning for specific wards |
| **Impact** | Complete halt of delivery operations in affected areas |
| **Fraud Vector** | Claiming full-day loss when flood cleared in 2 hours |
| **Anti-Fraud** | Correlate **NDMA/SDMA flood bulletins** with exact ward-level geo-fence. |

### 4. Severe Air Pollution (AQI Emergency)
| Aspect | Detail |
|---|---|
| **Trigger** | CPCB real-time AQI ≥ 400 ("Severe+") at the nearest monitoring station for ≥ 4 consecutive hours |
| **Impact** | GRAP Stage-IV restrictions; outdoor work halted |
| **Fraud Vector** | Rider claims AQI disruption but was located 20 km from the monitoring station |
| **Anti-Fraud** | Use **CPCB + SAFAR hourly station-level AQI** interpolated to 5 km grid. |

### 5. Cyclone / Tropical Storm
| Aspect | Detail |
|---|---|
| **Trigger** | IMD cyclone warning (Yellow or above) for rider's district |
| **Impact** | Mass shutdown of food delivery; restaurants closed; roads blocked |
| **Fraud Vector** | Claiming disruption for a post-cyclone day when operations resumed |
| **Anti-Fraud** | Automated trigger from **IMD cyclone bulletins**. |

### 6. Dense Fog
| Aspect | Detail |
|---|---|
| **Trigger** | IMD fog advisory with visibility < 50 m; METAR data confirms < 200 m |
| **Impact** | Dangerous riding conditions; platform slows dispatch |
| **Fraud Vector** | Claiming full-day fog disruption when it cleared by 10 AM |
| **Anti-Fraud** | Use **METAR aviation visibility data**. Payout proportional to verified fog-hours only. |

### 7. Hailstorm
| Aspect | Detail |
|---|---|
| **Trigger** | IMD nowcast or Doppler radar confirmation of hail |
| **Impact** | Temporary halt of outdoor movement; platform pauses zone |
| **Fraud Vector** | Claiming 4 hour disruption for a 30-minute hail event |
| **Anti-Fraud** | Hail events use tight **radar timestamps**. Max payout capped at 2 hours per hail event. |

### 8. Dust Storm / Sandstorm
| Aspect | Detail |
|---|---|
| **Trigger** | IMD dust storm warning; visibility < 500 m |
| **Impact** | Hazardous riding; reduced visibility; restaurants may close early |
| **Fraud Vector** | Claim limits expanded beyond actual storm duration |
| **Anti-Fraud** | Match **IMD dust storm warnings** to rider location. |

### 9. Lightning / Severe Thunderstorm Warning
| Aspect | Detail |
|---|---|
| **Trigger** | DAMINI app issues lightning alert; ≥ 10 strikes within 10 km in 30 min |
| **Impact** | Extreme rider safety risk; riders stop voluntarily |
| **Fraud Vector** | Rider aggregates short warnings into a full-shift claim |
| **Anti-Fraud** | Use **DAMINI lightning API**. Sum verified disruption windows. |

### 10. Earthquake (Zone Disruption)
| Aspect | Detail |
|---|---|
| **Trigger** | USGS/IMD seismic alert ≥ 4.5 magnitude; aftershock advisory active |
| **Impact** | Panic-driven market shutdowns |
| **Fraud Vector** | Overstatement of disruption duration |
| **Anti-Fraud** | Event → official advisory lifted or platform resume. |

### 11. Extreme Cold Waves (Added Reason)
| Aspect | Detail |
|---|---|
| **Trigger** | Sudden temperature drop triggering IMD cold wave red alert |
| **Impact** | Late-night/early-morning shifts impossible |
| **Fraud Vector** | Claiming extreme cold when operating in an unaffected / warmer sub-zone |
| **Anti-Fraud** | Cross-reference IMD API station data to GPS pin-code. Restrict payouts to night shifts ONLY. |

---

## Category B — Social & Civil Disruptions (12–20)

### 12. Unplanned Curfew / Section 144
| Aspect | Detail |
|---|---|
| **Trigger** | District Magistrate imposes Section 144 CrPC or curfew |
| **Impact** | Movement prohibited; complete delivery halt |
| **Fraud Vector** | Curfew applies to specific wards but rider claims it covered their unaffected zone |
| **Anti-Fraud** | Ingest **gazette/notification** via NLP scraper. Validate GPS falls inside boundary. |

### 13. Bandh / General Strike
| Aspect | Detail |
|---|---|
| **Trigger** | Political party calls a bandh; verified by > 60 % drop in zone orders |
| **Impact** | Shops/restaurants shut; roads blocked |
| **Fraud Vector** | Bandh called off midday but rider claims full day |
| **Anti-Fraud** | Use **news API + platform data**. If > 40 % of restaurants remained open, reduce payout. |

### 14. Sudden Market / Zone Closure
| Aspect | Detail |
|---|---|
| **Trigger** | Municipal authority shuts down a market complex unexpectedly |
| **Impact** | Restaurants in zone closed; no pickups |
| **Fraud Vector** | Only small cluster closed but rider claims entire zone |
| **Anti-Fraud** | Require **platform API confirmation** that restaurant-open count dropped ≥ 50 %. |

### 15. Large-Scale Protest / Road Blockade
| Aspect | Detail |
|---|---|
| **Trigger** | Unplanned protest blockade verified by live traffic data |
| **Impact** | Key routes blocked; delivery times spike |
| **Fraud Vector** | Protest blocks one road but rider claims entire zone was inaccessible |
| **Anti-Fraud** | Ingest **live traffic data (Google Maps)**. Payout only if ≥ 3 of rider's top routes blocked. |

### 16. Political Rally / Road Closure
| Aspect | Detail |
|---|---|
| **Trigger** | Unscheduled political rally causes road closures |
| **Impact** | Arterial roads closed; surge in travel time |
| **Fraud Vector** | Claiming for pre-announced rallies (only unplanned events covered) |
| **Anti-Fraud** | Cross-reference **traffic police advisories**. Exclude events announced > 24 hours in advance. |

### 17. Religious Procession / Festival Road Block
| Aspect | Detail |
|---|---|
| **Trigger** | Unscheduled massive religious procession blocks key routes |
| **Impact** | Road closures for hours |
| **Fraud Vector** | Claiming scheduled civic festivals as "unplanned" |
| **Anti-Fraud** | Maintain a **civic events calendar**. Auto-reject claims on pre-listed dates. |

### 18. VIP Movement / Security Cordon
| Aspect | Detail |
|---|---|
| **Trigger** | SPG/police impose sudden road closures for VVIP |
| **Impact** | Routes blocked for 1-4 hours |
| **Fraud Vector** | Rider outside cordon claims disruption |
| **Anti-Fraud** | Rider GPS must fall within 2 km of the cordon. |

### 19. Communal Tension / Area Curfew
| Aspect | Detail |
|---|---|
| **Trigger** | Localized tension leads to area-specific restrictions |
| **Impact** | Riders avoid area; platform blacklists zone |
| **Fraud Vector** | Tension in one neighbourhood; rider claims broader area |
| **Anti-Fraud** | Require **police advisory/FIR data**. |

### 20. Severe Gridlock / Traffic Paralysis (Added Reason)
| Aspect | Detail |
|---|---|
| **Trigger** | Massive unpredicted traffic standstills exceeding 3+ hours due to chain accidents |
| **Impact** | Rider is trapped, dropping delivery volume to zero |
| **Fraud Vector** | Traffic was only slow, not fully paralyzed, but rider claims full shift disruption |
| **Anti-Fraud** | Ingest live Google Maps/MapMyIndia API to verify a "Dark Red" standstill on rider's route >2 hours. |

---

## Category C — Infrastructure & Supply Chain Disruptions (21–26)

### 21. Major Road Collapse / Sinkhole
| Aspect | Detail |
|---|---|
| **Trigger** | Bridge collapse or sinkhole blocking key arterial route |
| **Impact** | Alternate routes congested making deliveries non-viable |
| **Fraud Vector** | Collapse is on a side street rider never uses |
| **Anti-Fraud** | Payout only if collapsed road was among rider's top-10 historical routes. |

### 22. Power Grid Failure (Citywide/Zonal)
| Aspect | Detail |
|---|---|
| **Trigger** | DISCOM confirms unscheduled outage affecting ≥ 1 entire ward for ≥ 2 hours |
| **Impact** | Restaurants can't operate; platform dispatch hampered |
| **Fraud Vector** | Outage lasted 1 hour but claim is for full shift |
| **Anti-Fraud** | Ingest **DISCOM outage feeds**. |

### 23. Telecom / Internet Outage
| Aspect | Detail |
|---|---|
| **Trigger** | Major carrier suffers zonal outage confirmed by Downdetector |
| **Impact** | App unusable; can't accept deliveries |
| **Fraud Vector** | Rider's personal phone issue disguised as network outage |
| **Anti-Fraud** | Require **carrier outage confirmation**. Detect clusters of identical issues. |

### 24. Water Main Burst / Gas Leak Evacuation
| Aspect | Detail |
|---|---|
| **Trigger** | Municipal burst/leak triggers localized evacuation |
| **Impact** | Evacuation zone is no-go area |
| **Fraud Vector** | Incident on one street; rider claims multi-ward disruption |
| **Anti-Fraud** | Define disruption radius as 500 m. Rider GPS must be inside. |

### 25. Platform Server Crash (Added Reason)
| Aspect | Detail |
|---|---|
| **Trigger** | Zomato/Swiggy entirely goes down globally/nationally (confirmed via Downdetector) |
| **Impact** | Rider is logged in and ready, but platform cannot dispatch orders |
| **Fraud Vector** | Rider was offline making excuses to claim lost wages |
| **Anti-Fraud** | Payout ONLY if rider has heartbeat logs proving they were online right before the crash. |

### 26. Cooking Gas/LPG Supply Crisis (Added Reason)
| Aspect | Detail |
|---|---|
| **Trigger** | Verified major supply chain crisis (e.g. geopolitics) halting commercial LPG supply to kitchens |
| **Impact** | Mass shutdown of restaurants entirely halting order volumes |
| **Fraud Vector** | Claiming blackout but restaurants in their specific zone use electric/induction |
| **Anti-Fraud** | Platform API confirms a >60% drop in active restaurants accepting orders in that micro-market. |

---

## Category D — Regulatory Disruptions (27–29)

### 27. Government Emergency Shutdown (GRAP, Odd-Even)
| Aspect | Detail |
|---|---|
| **Trigger** | GRAP construction bans or odd-even vehicle restrictions |
| **Impact** | Riders on restricted vehicles can't operate |
| **Fraud Vector** | Rider owns an exempt bicycle but claims they could not work |
| **Anti-Fraud** | Cross-reference **government gazette** with rider's registered vehicle type. |

### 28. Pest / Disease Zone Quarantine (Area Lockdown)
| Aspect | Detail |
|---|---|
| **Trigger** | Municipal health authority declares quarantine zone |
| **Impact** | No pickups within containment zone |
| **Fraud Vector** | Containment zone is 2 lanes but rider claims entire ward |
| **Anti-Fraud** | Ingest containment order boundaries. Tight geo-fence validation. |

### 29. Sudden Construction / Metro Work Road Closure
| Aspect | Detail |
|---|---|
| **Trigger** | Unscheduled emergency closure for utility work without notice |
| **Impact** | Detours add 20-40 minutes per delivery |
| **Fraud Vector** | Construction was pre-announced (planned work) |
| **Anti-Fraud** | Auto-reject claims for closures announced > 48 hours in advance. |

---

## Explicit Exclusions Checklist

> [!CAUTION]
> The following are **permanently excluded** from coverage and must be rejected at claim intake:

| # | Excluded Category | Examples |
|---|---|---|
| 1 | Health & Medical | Fever, illness, hospitalisation, COVID symptoms |
| 2 | Life Insurance | Death benefit, nominee payout |
| 3 | Accident & Injury | Road accident, fracture, personal injury |
| 4 | Vehicle Repair | Tyre puncture, engine failure, breakdown |
| 5 | Personal Reasons | Family emergency, planned leave, oversleeping |
| 6 | Platform Penalties | Account suspension, deactivation, rating drops |
| 7 | Normal Market Variation | Slow weekday, low demand |
| 8 | Scheduled Events | Pre-announced rallies, gazetted holidays |
| 9 | Rider's Own Equipment | Phone damage, charger failure |
| 10 | Inter-Platform Disputes | Payment disputes, incentive disagreements |
