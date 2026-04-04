# Stitch AI Prompt: Zoink-4-u Progressive Web App (PWA)

**Instructions for Google's Stitch / LLM to Generate the Frontend:**

You are to generate a comprehensive, highly modern Progressive Web App (PWA) utilizing **Vite**, **React (TypeScript)**, and **Tailwind CSS**. This application serves as the frontend for a gig-worker insurance and financial protection API backend.

**CRITICAL INSTRUCTION:** You must write robust, edge-case resilient code. Assume networks are flaky, users make mistakes, and APIs can occasionally fail or return errors. Cover all edge cases exhaustively as documented below.

## Design Aesthetic & UI/UX Guidelines
- **Vibe:** Cyberpunk-meets-fintech, neon accents (electric blue `#00f3ff`, vibrant purple `#bc13fe`), sleek dark mode by default (`bg-gray-900`, text `gray-100`). Employ glassmorphism for modal overlays and cards (transparent backgrounds with backdrop blur).
- **Responsiveness:** Mobile-first design focusing strictly on smartphone aspect ratios, as the target demographic (gig-workers) will solely use this on mobile devices.
- **Animations:** Utilize Framer Motion for smooth component mounting, page transitions, and micro-interactions (button presses, success checkmarks).
- **Feedback Mechanisms:** **Toast notifications** (e.g., React Hot Toast) must be utilized for ALL async actions—both successes and errors. 
- **Loading States:** Every API call must show a visual loading state (Skeleton loaders for initial data, Spinner/disabled states for buttons on submission).

## System Architecture & State Management
- **State Management:** Use `Zustand` or React Context (AuthContext & PolicyContext) to manage global user state.
- **Routing:** Use `react-router-dom`. Implement a `ProtectedRoute` component that checks `localStorage` for `user_id`. If unauthenticated, redirect to `/auth`. If authenticated, redirect `/auth` to `/dashboard`.
- **PWA Specs:** Provide a fully valid `manifest.json` with standard icons, and set up a Service Worker (using Workbox or Vite-PWA plugin) to cache static assets to ensure the app boots instantly even offline.
- **API Endpoints:** 
  - `CORE_API`: `http://localhost:8000`
  - `ML_API`: `http://localhost:8001`

---

## Exhaustive Feature Specifications & Edge Cases

### 1. Authentication Module (`/auth`)
Create a tabbed interface or smooth toggle between **Registration** and **Login**.

#### A. Registration Flow
- **Fields:** Full Name, Phone Number, Zone Delivery Area (Dropdown: e.g., 'Koramangala', 'Indiranagar', 'Whitefield'), Aadhaar Number, Aadhaar OTP.
- **Validation Edge Cases to Handle:**
  - Phone number must be exactly 10 digits. Show inline error if invalid.
  - Aadhaar number must be exactly 12 digits. Show inline error if invalid.
  - Aadhaar OTP must be exactly 6 digits (Mock OTP for success is always `123456`). If incorrect, the API will return a `400 Invalid OTP`.
  - Disable the Submit button while the request is pending.
- **API Call & Error Handling:** 
  - `POST http://localhost:8000/users/register`
  - *Edge Case Handle*: If `400` because "User already registered", show a friendly Toast: "Account exists! Switching you to login..." and automatically transition them to the Login tab.
  - *Edge Case Handle*: If network timeout or `500`, show: "Servers are overloaded, please try again."

#### B. Login Flow
- **Fields:** Phone Number, Aadhaar OTP.
- **API Call:** `POST http://localhost:8000/users/login`
- **Validation Edge Cases:** 
  - *Edge Case Handle*: If `404 User not found`, toast "We couldn't find an account. Let's get you registered!"
- **State Mutation:** On success, store the returned `id` in `localStorage` as `user_id`, update Context, and push to `/dashboard`.

---

### 2. Dashboard Home (`/dashboard`)
Displays the "My Shield" overview. Fetch policy data on mount.

- **Data Fetching:** 
  - Suppose a generic `GET http://localhost:8000/policies/?user_id={id}` determines existence. If endpoint doesn't exist natively, simulate the context check or assume standard REST principles.
- **Edge Case - Offline Mode:**
  - If the user opens the app without internet, display a non-intrusive offline banner: "You are viewing cached data. Reconnect to get live updates."
- **Edge Case - No Active Policy:**
  - If the user has no policy, display a prominent, highly attractive "Secure Your Earnings" Card directing them to the Pricing Page.

---

### 3. Dynamic Premium & ML Pricing Simulator (`/purchase`)
If purchasing a policy, show the user a Tier selection component (Bronze, Gold, Platinum). Before submitting, fetch ML insights dynamically.

- **Interaction Flow:**
  - User selects Tier and enables/disables the 'Exclusion Buyback' add-on toggle.
  - As soon as these parameters change, show a skeleton loader on the price while making a request to: 
    - `POST http://localhost:8001/pricing/calculate` 
    - Payload: `{ zone_id: user.zone_id, tier: selected_tier, work_hours_estimated: 40 }`
- **Edge Cases for ML Engine:**
  - *Fallback Handling*: What if the ML server on port 8001 is down? The app MUST catch the error, toast "Unable to retrieve dynamic pricing. Using base rates," and fallback to hardcoded base prices (e.g., Bronze: 200, Gold: 350, Platinum: 500).
- **Purchase API Call:**
  - `POST http://localhost:8000/policies/`
  - Payload: `{ user_id, tier, zone_id, enable_buyback: boolean }`
  - *Edge Case*: If user rapidly clicks "Purchase" multiple times, ensure button is disabled to prevent duplicate POST attacks. Return to dashboard gracefully on success.

---

### 4. Claims & Incidents Module (`/claims`)
The zero-touch parametric claims simulation area.

- **UI Elements:**
  - Display "Current Zone Status" (Safe vs. Disrupted).
  - A mock "Admin Simulation Panel" (since this is for a hackathon demo) to manually trigger localized disruption events.
- **Incident Trigger Simulation:**
  - Dropdown of events: "SEVERE_WEATHER", "GEOPOLITICAL_RIOTS", "ROAD_CLOSURES".
  - Button: "Simulate Event" -> calls `POST http://localhost:8000/claims/trigger` with `{ event_type, zone_id }`.
- **Extensive Claim Readout (Edge Cases Handled):**
  - When the response comes back, it's an array of Claims.
  - Parse the claim `status` and display contextually:
    - `APPROVED_AND_PAID`: Render a massive green checkmark, show fireworks/confetti animation.
    - `BUYBACK_PARTIAL_PAID`: If they only survived because of the buyback add-on, show a warning-yellow notification explaining that the base claim failed but the rider saved them.
    - `SAFE_RETURN_PAID`: If event type was Riots/Curfew.
    - *Edge Case - Empty Array*: If the API returns `[]`, it implies the user's active policy was NOT valid for this zone, or the disaster didn't qualify. Display: "Your area was unaffected, and you're good to work! No claim triggered."

Please generate the absolute best-in-class implementation based on the above constraints. Code it so it works directly out-of-the-box when run via Vite.
