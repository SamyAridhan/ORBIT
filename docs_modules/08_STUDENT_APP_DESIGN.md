# Module 08 — ORBIT Student App Design (Layer 1)
> New module. Full specification for the student-facing PWA.
> System name: ORBIT (On-Demand, Route-Based Intelligent Transit System)
> This is the first thing built in PSM2. Read before writing Chapter 4 design sections.

---

## What the App Is

A Progressive Web App (PWA). Students open a URL in their phone browser — no download, no App Store, no UTM IT permission required. Works on any modern smartphone.

**Why PWA over native app:**
- No installation barrier reduces adoption friction
- Works on iOS and Android identically
- No App Store review process
- UTM IT does not need to publish or maintain it
- Can be accessed via QR code at bus stops

---

## Core User Flow (Happy Path)

```
Student arrives at KDOJ bus stop
    ↓
Opens URL on phone (or scans QR at stop)
    ↓
App requests location permission
    ↓
GPS detects: within 80m of KDOJ geofence
App shows: "📍 KDOJ — Kolej Datin Onn Jaafar"
    ↓
App shows available corridors from KDOJ:
    [🚌 Bus D — to Canselori (CP)]
    [🚌 Bus E — to Faculty Cluster]
    ↓
Student taps "Bus E — to Faculty Cluster"
    ↓
App submits demand signal to backend silently
    ↓
App shows:
    ┌─────────────────────────────────┐
    │  Bus E2                         │
    │  Next arrival: ~14 min          │
    │  ●●●●●●●●●●○○○○○○○○○○  12/28   │
    │  Last seen at: KDSE              │
    └─────────────────────────────────┘
    ↓
Bus arrives, student boards
```

---

## Screen Specifications

### Screen 1 — Stop Detection

**State A: Detecting**
```
┌─────────────────────────┐
│    UTM Bus              │
│                         │
│    Detecting your       │
│    location...          │
│    ⟳                   │
└─────────────────────────┘
```

**State B: Stop Confirmed**
```
┌─────────────────────────┐
│    UTM Bus              │
│                         │
│    📍 KDOJ              │
│    Kolej Datin          │
│    Onn Jaafar           │
│                         │
│    Where are you going? │
└─────────────────────────┘
```

**State C: Not at a stop**
```
┌─────────────────────────┐
│    UTM Bus              │
│                         │
│    No bus stop nearby.  │
│    Move closer to a     │
│    stop and try again.  │
│                         │
│    [Try Again]          │
└─────────────────────────┘
```

---

### Screen 2 — Destination Selection

Dynamically generated from which corridors serve the detected stop.

```
┌─────────────────────────┐
│  📍 KDOJ                │
│  ─────────────────────  │
│  Select your bus:       │
│                         │
│  ┌─────────────────┐    │
│  │ 🚌 Bus D        │    │
│  │ → Canselori     │    │
│  └─────────────────┘    │
│                         │
│  ┌─────────────────┐    │
│  │ 🚌 Bus E        │    │
│  │ → Faculty       │    │
│  │   Cluster       │    │
│  └─────────────────┘    │
└─────────────────────────┘
```

**Key design decisions:**
- Show corridor + human-readable destination only (not bus ID like "E1" or "E2")
- Student doesn't know or care which specific bus comes — they care about destination
- Destination text taken from `corridors.json` (configurable, not hardcoded)

---

### Screen 3 — ETA & Capacity Display

```
┌─────────────────────────┐
│  📍 KDOJ → Faculty      │
│  ─────────────────────  │
│  Bus E2                 │
│  ⏱  Next: ~14 min      │
│                         │
│  Seats available:       │
│  ▓▓▓▓▓▓▓▓▓▓░░░░░░  12  │
│  (12 of 28 used)        │
│                         │
│  Last seen at: KDSE     │
│  Updated: 2 min ago     │
│  ─────────────────────  │
│  Bus E1 passed 18 min   │
│  ago (next: E2)         │
│                         │
│  [← Change destination] │
└─────────────────────────┘
```

**ETA calculation — location-based (primary):**
```
ETA = distance(bus_current_position → this_stop) / avg_segment_speed
```
Bus current position comes from the simulated GPS feed (PSM2) or real GPS feed (post-PSM2). The system doesn't distinguish — it receives a position update via WebSocket and calculates remaining distance along the corridor graph. If Bus Agent issued an early departure, the position feed reflects the adjusted departure and ETA updates automatically.

**Capacity bar:**
- Full bar = 28 seats (max capacity)
- Fill = current load
- Colour: green (< 60%), yellow (60–84%), red (≥ 85% — capacity lock zone)

**"Last seen at" indicator:**
- Japan-style station indicator (shows last confirmed stop the bus passed)
- Not a dot on a map — simpler, clearer on small screens
- Updates via WebSocket push from backend whenever bus GPS crosses a stop geofence

**"Updated X min ago" freshness indicator:**
- If no position update received in 5 min: show "Bus position data unavailable"

---

### Screen 4 — Boarding Prompt

**Trigger:** Bus GPS position intersects with the student's booked stop (bus enters stop geofence). One minute after that intersection, the app pushes a prompt to all students who have an active demand signal for that stop + corridor.

This is purely location-based — the bus's position crosses the stop, not the student's position. No student tracking required.

```
┌─────────────────────────┐
│  📍 KDOJ → Faculty      │
│  ─────────────────────  │
│  Bus E2 just passed     │
│  your stop.             │
│                         │
│  Did you board?         │
│                         │
│  [✓ Yes, I'm on]        │
│  [✗ I missed it]        │
│                         │
│  No response = boarded  │
│  (prompt closes in 60s) │
└─────────────────────────┘
```

**Default behaviour — no response:**
Signal expires gracefully. Student assumed boarded. No further action.

**"I missed it" tap:**
- Submits a fresh demand signal for the same stop + corridor
- Weighted at 1.5× a standard passive submission (intentional, post-event, student definitely still at stop)
- Stop Agent receives this as high-confidence residual demand
- Prompt resets — student will receive another prompt when the next bus passes

**Why this works without tracking students:**
The trigger is the bus crossing the stop — an event the system already tracks for ETA purposes. The student's location is never checked after initial submission. The prompt is just a push notification off a bus position event.

**In PSM2 (virtual simulation):**
The simulator injects the bus passing event. The simulator resolves boarding outcomes automatically based on scenario config — e.g. 80% of simulated students board, 20% re-signal. This is a test parameter you control.

---

### Screen 5 — Low Position Data State

When no bus position update has been received recently:

```
┌─────────────────────────┐
│  📍 KDOJ → Faculty      │
│  ─────────────────────  │
│  Bus E2                 │
│  ⏱  Position data       │
│     unavailable         │
│                         │
│  ⚠ Showing scheduled    │
│  time: 08:15            │
│                         │
│  Last seen at: —        │
└─────────────────────────┘
```

Honest fallback. Shows scheduled time only when position data is stale.

---

## Technical Specification

### Stop Configuration (`stops.json`)

```json
[
  {
    "stop_id": "kdoj",
    "name": "KDOJ",
    "full_name": "Kolej Datin Onn Jaafar",
    "lat": 1.5548,
    "lng": 103.6285,
    "geofence_radius_m": 80,
    "is_interchange": false,
    "corridors": ["D", "E"]
  },
  {
    "stop_id": "cp",
    "name": "CP",
    "full_name": "Canselori / Center Point",
    "lat": 1.5590,
    "lng": 103.6370,
    "geofence_radius_m": 100,
    "is_interchange": true,
    "corridors": ["A", "C", "D", "E", "F", "G", "H"]
  }
]
```

**Note on interchange stops in the app:**
Students at CP who open the app will see all 7 corridors — this is correct, they should be able to pick their onward corridor. However, their demand signal at CP is NOT relayed to any Stop Agent for dispatch purposes (interchange flag = true). The app still shows ETA and capacity — it just doesn't trigger dispatch logic. Students at CP are past the demand-signal useful point (they're already at the interchange).

### Demand Signal Schema

Two signal types exist — initial submission and missed-bus re-signal:

```json
{
  "stop_id": "kdoj",
  "corridor_id": "E",
  "destination": "Faculty Cluster",
  "timestamp": "2025-09-15T07:52:00+08:00",
  "token": "anon_7f3a2b",
  "signal_type": "initial",
  "weight": 1.0,
  "app_version": "1.0"
}
```

```json
{
  "stop_id": "kdoj",
  "corridor_id": "E",
  "destination": "Faculty Cluster",
  "timestamp": "2025-09-15T08:18:00+08:00",
  "token": "anon_7f3a2b",
  "signal_type": "missed_bus",
  "weight": 1.5,
  "app_version": "1.0"
}
```

**`signal_type: "missed_bus"`** — submitted when student taps "I missed it" on the boarding prompt. Weighted at 1.5× because it is intentional, post-event, and definitively means the student is still physically at the stop right now. The 30-minute token window resets on a missed-bus signal so the student can be counted fresh for the next service.

**Boarding prompt token rule:** The boarding prompt fires once per bus visit. If a student taps "I missed it", their token window resets and they are eligible to be counted toward the next bus. If they tap "Yes, I boarded" or don't respond, their token expires normally.

---

## Demand Integrity — Spam Prevention & Signal Validation

> This section documents a deliberate design decision: why the system does not require student login, what risks that creates, and how three layered controls address those risks. This maps to Chapter 4 (Design Decisions) and Chapter 2 (System Limitations).

### The Core Question

The concern: without a login, what stops one person from submitting 50 demand signals and triggering a false early bus departure?

With a system like myUTM — where every student has exactly one account — the answer is structural. One account = one person, enforced at the database level. The system always knows who submitted what.

Without login, you need other mechanisms. Here is the three-layer approach, each independently providing protection, together making abuse practically impossible in a campus transit context.

---

### Layer A — Geofence as the Primary Guard

This is the strongest protection and it's specific to your context. A demand signal is only accepted by the backend if the student's GPS coordinates fall within 80 metres of the submitted stop at the time of submission.

So even if someone submits 100 signals for KDOJ from their dorm room, each one fails the geofence check before it reaches the Stop Agent. The signal is rejected at the API level immediately.

This works because physical presence is the real qualification. If you're not at the stop, your signal about that stop is meaningless — so it is discarded. No login system can replicate this guarantee; a student with a myUTM account could still submit a false signal from anywhere unless GPS was also enforced.

```python
@app.post("/api/demand")
async def receive_demand(signal: DemandSignal):
    stop = stops[signal.stop_id]
    distance = haversine(signal.gps_lat, signal.gps_lng, stop.lat, stop.lng)
    
    if distance > 80:
        # Reject silently — not physically at this stop
        return {"status": "ok"}  # Don't tell client why, prevents probing
    
    # Proceed to token check...
```

**Note:** Raw GPS coordinates are NOT stored. They are used only for this check at request time, then discarded. Only the matched stop_id is stored.

---

### Layer B — Session Token Rate Limiting (Per Corridor, Per Time Window)

When a student first opens the app, the backend issues an anonymous session token — a random UUID stored in the browser's local storage. Every demand signal carries this token. The backend enforces: **one token = one accepted signal per stop per corridor per 30-minute window**.

A second submission from the same token within the window is silently ignored. The student sees nothing — it doesn't error, it just doesn't count again. This prevents accidental double-counting (page refresh, back button) and deliberate repeat submission.

This is the standard approach used in anonymous crowdsourcing systems — the same pattern used by transit apps like Tiramisu (Carnegie Mellon) and anonymous polling platforms. The session token provides individuality without identity.

```python
async def receive_demand(signal: DemandSignal):
    # After geofence check passes...
    
    cache_key = f"{signal.token}:{signal.stop_id}:{signal.corridor_id}"
    
    if await cache.exists(cache_key):
        return {"status": "ok"}  # Already counted — silent ignore
    
    await cache.set(cache_key, 1, ttl=1800)  # 30-minute window
    demand_store.add(signal)
```

**Token lifetime:** The token persists in browser local storage across page refreshes in the same session. If a student clears their browser storage, they get a new token. This is an accepted limitation — the effort required to abuse it (clearing storage, returning to the stop, resubmitting) is not realistic for a campus bus queue.

---

### Layer C — Plausibility Filter in the Stop Agent

Even if a signal passes the geofence and token checks, the Stop Agent applies a sanity check before broadcasting to Bus Agents: does this demand level make sense for this stop at this time of day?

The Stop Agent compares the incoming count against the expected demand from the simulation model (class schedule patterns). If the count is implausibly high relative to what is expected — more than 3× the schedule-based estimate — it is flagged in the log and not escalated to a dispatch signal.

```python
def is_plausible(self, count, sim_time):
    expected = demand_engine.get_expected_demand(
        self.stop_id, self.corridor_id, sim_time
    )
    # Flag but don't act if count is 3x what schedule model predicts
    if count > expected * 3:
        self.log(f"IMPLAUSIBLE_DEMAND: count={count}, expected={expected}, flagged")
        return False
    return True
```

**Real example:** If it is 2:00pm on a Saturday and KDOJ suddenly shows 40 demand signals — no classes scheduled, no expected demand — the plausibility filter blocks any dispatch action and logs the anomaly for fleet manager review. If it is 7:45am Monday before a full lecture day and KDOJ shows 40 signals — completely plausible — the signal proceeds normally.

This is analogous to how Moovit validates crowdsourced incident reports against known schedule data before surfacing them to other users.

---

### Why Not Just Use myUTM Login?

| | myUTM Login | Three-Layer Anonymous |
|---|---|---|
| Spam prevention | Structural (one account = one person) | Practical (geofence + token + plausibility) |
| Adoption friction | High — login step required | None — open URL and go |
| Privacy | Low — tied to student ID and records | High — no personal data collected |
| Deployment speed | Months — needs UTM IT involvement | Days — fully self-contained |
| Scope | Out of PSM1/PSM2 scope | In scope |
| False signal from home | Possible unless GPS also enforced | Blocked by geofence regardless |

The conclusion: myUTM integration is the right long-term architecture and is documented as Future Work. The anonymous three-layer approach is the correct choice for PSM2 — it is lower friction, deployable independently, and provides sufficient signal integrity for a campus transit system where the motivation to abuse demand signals is essentially zero.

---

### Formal Statement for Chapter 4 (Updated)

> *"Demand signal integrity is maintained through three layered controls without requiring student authentication. First, geofence validation: signals are rejected at the API level if the submitting device's GPS coordinates fall outside an 80-metre radius of the declared stop — physical presence at the stop is the primary qualification for signal acceptance. Raw coordinates are discarded immediately after this check. Second, session token rate limiting: each browser session receives an anonymous UUID token stored in local storage; the backend enforces one accepted signal per token per stop per corridor within a 30-minute window, silently ignoring duplicates. This follows the pattern established in transit crowdsourcing systems such as Tiramisu (Carnegie Mellon University). Third, Stop Agent plausibility filtering: demand counts exceeding three times the schedule-model estimate for that time slot are flagged in the decision log and not escalated to dispatch signals. Together, these controls make abuse practically infeasible in a campus transit context while eliminating all authentication friction that would reduce voluntary participation. myUTM identity integration — which would provide structural one-account-one-person enforcement — is documented as a future work extension."*

### Geofence Detection Logic

```javascript
const STOPS = require('./stops.json');

function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth radius in metres
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 +
              Math.cos(lat1 * Math.PI/180) *
              Math.cos(lat2 * Math.PI/180) *
              Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function detectStop(userLat, userLng) {
    const candidates = STOPS
        .map(stop => ({
            ...stop,
            distance: haversineDistance(userLat, userLng, stop.lat, stop.lng)
        }))
        .filter(stop => stop.distance <= stop.geofence_radius_m)
        .sort((a, b) => a.distance - b.distance);
    
    return candidates.length > 0 ? candidates[0] : null;
}
```

### WebSocket Connection for Live Updates

```javascript
function connectToUpdates(stopId, corridorId) {
    const ws = new WebSocket(
        `wss://your-backend/ws/app/${stopId}/${corridorId}`
    );
    
    ws.onmessage = (event) => {
        const update = JSON.parse(event.data);
        
        if (update.type === 'eta_update') {
            setETA(update.eta_minutes);
            setLastUpdated(new Date());
        }
        if (update.type === 'capacity_update') {
            setCapacity(update.current_load, update.max_capacity);
        }
        if (update.type === 'position_update') {
            setLastSeenStop(update.last_stop);
        }
    };
    
    // Reconnect on drop
    ws.onclose = () => {
        setTimeout(() => connectToUpdates(stopId, corridorId), 3000);
    };
}
```

---

## Privacy Design (Formal Statement for Chapter 4)

> *"The student application collects no personally identifiable information. No student login, UTM student ID, or name is required. Location data is processed entirely on the user's device — the application uses the browser Geolocation API to identify the nearest stop but does not transmit raw coordinates to the server. Demand signals contain only: stop identifier, corridor identifier, destination text, timestamp, and an anonymous session token. Session tokens are generated per session using a random UUID and are not linked to any student identity. Demand signals are retained for a maximum of two hours and then purged — they are time-sensitive coordination data, not records. This design was chosen to remove all barriers to participation and to ensure no privacy legislation implications arise from app deployment."*

---

## Component Structure (React)

```
student-app/src/
├── App.jsx                      # Router: Detection → Destination → ETA
├── components/
│   ├── StopDetector.jsx         # Geolocation API, geofence match
│   ├── DestinationSelector.jsx  # Corridor buttons from stop config
│   ├── ETADisplay.jsx           # Main info screen
│   ├── CapacityBar.jsx          # Coloured progress bar
│   ├── BusPositionIndicator.jsx # "Last seen at X" text
│   └── FallbackState.jsx        # Low adoption / no data screen
├── hooks/
│   ├── useGeolocation.js        # Wraps navigator.geolocation
│   ├── useWebSocket.js          # Auto-reconnect WS hook
│   └── useAnonymousToken.js     # Session token generator
├── api/
│   ├── submitDemand.js          # POST /api/demand
│   └── fetchSchedule.js        # GET /api/eta fallback
└── data/
    ├── stops.json               # Stop config
    └── corridors.json           # Corridor → destination label map
```

---

## PSM2 Build Milestones for Student App

| Week | Feature | Acceptance Criteria |
|---|---|---|
| 2–3 | Stop detection | GPS correctly identifies any of 10+ configured stops within 80m |
| 3–4 | Destination selection | Correct corridor buttons shown per stop, demand signal POST confirmed |
| 4–5 | ETA display (schedule-based) | ETA shown within ±2 min of hand-calculated schedule |
| 5–6 | Capacity display | Capacity bar reflects bus manifest count, updates within 5s |
| 6 | Demo 1 | Full flow working on a real phone browser |
| Post-Demo 1 | WebSocket live updates | ETA + capacity + position updates pushed from MAS, < 5s latency |
| Post-MAS | ETA from agent decisions | If Bus Agent issued early departure, ETA reflects adjusted time |
