# 01 — Screens and Navigation Flow

## Screen list

| ID | Route | Screen name | Trigger |
|---|---|---|---|
| S1 | `/onboarding` | Onboarding | First visit (no localStorage flag) |
| S2 | `/` | Home / Stop Picker | After onboarding or returning visit |
| S3 | `/gps` | GPS Permission Explanation | User taps "Find my stop automatically" |
| S4 | `/destination` | Destination Picker | Stop selected |
| S5 | `/eta` | ETA Screen | Corridor selected |

## Navigation flow

```
App launch
  └─ check localStorage("orbit_visited")
       ├─ null → S1 Onboarding → on complete → S2 Home
       └─ exists → S2 Home (also: silent background geofence check)

S2 Home
  ├─ tap "Find my stop automatically" → S3 GPS Permission
  ├─ tap any stop in list → S4 Destination (atStop = false)
  └─ tap "How this works?" → S1 Onboarding (overlay, does NOT clear localStorage)

S3 GPS Permission
  ├─ tap "Allow" → simulate 1.5s detection → S4 Destination (atStop = true, stop = KDOJ)
  └─ tap "I'll pick manually" → S2 Home

S4 Destination (receives: stop, atStop)
  └─ tap a corridor card → S5 ETA (receives: stop, atStop, corridor)

S5 ETA (receives: stop, atStop, corridor)
  └─ back button → S4 Destination
```

## State that flows between screens

Managed in App.jsx with useState:

```js
const [selectedStop, setSelectedStop] = useState(null);   // stop object from STOPS
const [atStop, setAtStop]             = useState(false);   // boolean
const [selectedCorridor, setSelectedCorridor] = useState(null); // corridor key e.g. "E"
```

## S1 — Onboarding screen spec

4 swipeable cards. Cannot go back past card 1.

| Card | Emoji | Headline | Body |
|---|---|---|---|
| 1 | 🚌 | "Waiting for the bus with no idea when it comes?" | "Every UTM student knows this feeling. ORBIT fixes it." |
| 2 | 📱 | "See live ETA and how full the bus is — from anywhere" | "Check before you even leave your room. No more guessing." |
| 3 | 👥 | "At the stop? Let the system know you're waiting" | "When enough of us tap in, the bus can be dispatched earlier — automatically." |
| 4 | ⚡ | "You'll see it happen — and know you helped" | *italic* "Bus E2 is coming 7 minutes earlier. You and 14 others made that happen." |

Navigation within onboarding:
- Dot indicators at bottom. Current dot = wide pill (20px). Inactive = circle (7px).
- Cards 1–3: "Next →" button
- Card 4: "Get started →" button → sets `localStorage.setItem("orbit_visited","true")` → navigate to Home
- Top-right "Skip" text button on every card → same action as "Get started"
- Swipe left/right to navigate between cards (use touch events or drag detection)

## S2 — Home / Stop Picker screen spec

- TopBar: title "ORBIT", sub "UTM Campus Bus"
- Top-right button: "How this works?" (small, bordered) → re-opens onboarding
- Heading: "Where are you heading from?"
- Sub: "Pick your stop or detect automatically"
- **Primary CTA (full width, primary blue):** "📍 Find my stop automatically" → goes to S3
- Search input with 🔍 prefix — filters STOPS list in real time by name or full name
- Stop list below: each row = stop icon (🚏) + name + full name + corridor badges
- Tap any row → navigate to S4 Destination with atStop=false

**Returning user with GPS already granted (simulate with state, not real GPS):**
Show green "detected" banner at top of stop list:
```
📍 KDOJ detected nearby · 34m away    [USE →]
```
Tap USE → navigate to S4 with atStop=true, selectedStop=KDOJ.
In the POC, always show this banner (simulate GPS already granted state) so the demo is fast.

## S3 — GPS Permission Explanation screen spec

- Large 📍 emoji (56px)
- Headline: "Allow location access?"
- Body: "We use your location **only** to detect your nearest bus stop. It is never stored, never shared, and discarded immediately after the stop is identified."
- Amber info box: "📌 You can also **pick your stop manually** without ever sharing location."
- Primary button: "Allow location — detect my stop" → simulate 1.5s loading → navigate to S4 (atStop=true, stop=KDOJ)
- Secondary button: "I'll pick my stop manually" → back to S2

## S4 — Destination Picker screen spec

- TopBar: `[stop.name]` / `[stop.full]` / back button / "YOU'RE HERE" green badge if atStop
- Heading: "Where to?"
- One card per corridor serving this stop (from stop.corridors, filtered by CORRIDORS object)
- Each card: bus emoji + destination label + destination sub + bus letter badge (right side)
- Tap card → navigate to S5

If atStop=false: show amber info box at bottom:
"You're browsing from outside [stop.name]. The 'I'm waiting here' button unlocks when you arrive at the stop."

## S5 — ETA Screen spec

This is the main screen. See `03_COMPONENTS.md` for each sub-component.

Top to bottom layout (all in a scrollable column with gap-3):
1. TopBar (stop + corridor destination + back + YOU'RE HERE badge)
2. DispatchBanner (hidden by default, appears during demo sequence)
3. BoardingPrompt (hidden by default, appears during demo sequence)
4. ETA Card (bus number, ETA minutes, capacity bar)
5. RouteTimeline (vertical, bus approaching visualization)
6. PeopleQueue (fixed-size, all people visible, shrinking icons)
7. "I'm waiting here" button OR confirmation card (if tapped)

The ETA screen is driven by `useDemoSequence` hook. See `04_DEMO_SEQUENCE.md`.
