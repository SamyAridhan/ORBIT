# 06 — UX Decisions (Locked — Do Not Change)

## People queue — rules

1. **No overflow. No "+X more". Ever.** All people must be visible regardless of count.
2. Icons shrink as count grows (see size tiers in `05_DESIGN_TOKENS.md`).
3. Container: full card width, flex-wrap, no fixed height — grows with content.
4. **Ordering is strict:** [beforeUser black icons] → [1 blue user icon, if tapped] → [afterUser black icons]
5. User's blue icon appears at the correct chronological position — they are not first, they are not last, they are in the middle based on when they tapped relative to when others joined.
6. Colors: others = `#334155`, user = `#2563EB`.
7. Below the queue, when tapped: small blue text showing the user's position.

## Route timeline — rules

1. **Vertical layout only. No horizontal scroll.**
2. Read top to bottom: bus → intermediate stops → user's stop.
3. The running capacity is calculated and displayed at each intermediate stop to show how the bus fills up before reaching the user.
4. The user's stop node is visually distinct (larger, primary colored, highlighted background).
5. The seats-remaining forecast at the user's stop must be calculated correctly and shown in the appropriate color (red if ≤ 3, green if ≥ 4).
6. `liveWaitingAtUserStop` is a prop — it updates during the demo sequence as more people join.

## GPS permission — three flows

### Flow A: New user OR GPS not yet granted
User must explicitly initiate. Never auto-fire the native prompt.
```
Home → tap "Find my stop automatically" → GPS Explanation screen → tap "Allow" 
→ simulate 1.5s → navigate to Destination (atStop=true, stop=KDOJ)
```

### Flow B: Returning user, GPS already granted (simulated in POC)
In the POC, simulate this as the default returning-user state. When the home screen loads for a returning user (localStorage flag exists), show the green "KDOJ detected nearby — 34m away [USE →]" banner at the top of the stop list automatically. No prompt. No tap needed to detect.

### Flow C: User opens app fresh, at stop, GPS not granted
They land on home screen after onboarding. The "Find my stop automatically" button is the largest, most prominent element. They tap it → GPS explanation → Allow → detected at KDOJ. One extra step but acceptable.

**In the POC:** When user taps "Allow" on the GPS explanation screen, always simulate detection of KDOJ (the demo stop). This makes the demo deterministic.

## Button copy — locked

| Button | Copy |
|---|---|
| GPS auto-detect | "📍 Find my stop automatically" |
| GPS explanation: allow | "Allow location — detect my stop" |
| GPS explanation: skip | "I'll pick my stop manually" |
| Demand signal | "I'm waiting here" |
| Onboarding next | "Next →" |
| Onboarding last card | "Get started →" |
| Onboarding skip | "Skip" (top-right, text only) |
| Boarding: boarded | "✓ I'm on the bus" |
| Boarding: missed | "✗ I missed it" |
| How this works | "How this works?" |

## "I'm waiting here" — complete behavior

**When atStop=false (browsing from room):**
- Button is rendered but disabled (grey, cursor not-allowed)
- Sub text: "Available when you arrive at [stop.name]"
- No demo sequence fires

**When atStop=true, before tap:**
- Button is active (primary blue)
- Sub text: "Lets the system know — helps bring the bus sooner when enough of us are waiting"

**When atStop=true, after tap:**
- Button disappears
- Green confirmation card replaces it: "✓ You're counted — position [beforeUser+1] in queue"
- Sub: "We'll notify you when Bus E2 is close"
- Demo sequence starts

## Onboarding — localStorage detection

```js
// On app load:
const hasVisited = localStorage.getItem("orbit_visited");
// null → show onboarding first
// any value → skip to home

// On onboarding complete (Get started / Skip):
localStorage.setItem("orbit_visited", "true");
// navigate to home
```

"How this works?" button on the home screen re-opens the onboarding as a full-screen overlay or by navigating to /onboarding. It does NOT clear the localStorage flag. Pressing back or completing it returns to home.

## Info-only state (browsing from room)

When atStop=false, the ETA screen shows all the same information (ETA, capacity, route timeline, people queue) but:
- "I'm waiting here" button is disabled grey
- An amber info box appears above the button:
  "You're viewing live info. When you arrive at [stop.name], the system can count you too."

This makes clear the app is still useful from the room — they can plan their departure — and explicitly invites them to tap when they arrive.

## Destination screen — label hierarchy

Show destination name first, bus letter second.
- Primary label: "Faculty Cluster" (where they're going)
- Sub: "T02 · T06 · T08" (specific stops)
- Badge (right side): "Bus E" (small, colored)

Students think in destinations, not bus numbers.
