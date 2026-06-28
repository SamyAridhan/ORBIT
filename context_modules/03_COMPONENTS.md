# 03 — Component Specifications

## PhoneFrame
Wraps all screen content. On mobile (< 640px): renders children directly, full screen. On desktop: renders a phone-shaped container centered on screen.

```jsx
// Props: { children }
// Desktop: w-[390px] rounded-[36px] border-[8px] border-slate-800 shadow-2xl overflow-hidden
// Mobile: w-full min-h-screen
```

Includes status bar at top (time left, signal right), all dark primary background.

---

## TopBar
```jsx
// Props: { title, sub?, onBack?, badge? }
// badge = boolean — shows "📍 YOU'RE HERE" green pill if true
// onBack = function — shows back button if provided
```
Dark primary background. Title in white bold. Sub in white/50. Back button is a small rounded button top-left. Badge is a small green pill next to title.

---

## CapacityBar
```jsx
// Props: { load, max }
```
Label row: "SEATS" left, "[max-load] of [max] left" right.
Bar: full-width, rounded, height 8px. Fill color: green if < 60%, yellow if 60–84%, red if ≥ 85%.

---

## PersonSVG
```jsx
// Props: { color, size }
// Renders a simple SVG person: circle head + ellipse body
// size = pixel width. Height = size * 1.55 automatically.
```

```jsx
<svg width={size} height={size*1.55} viewBox="0 0 16 25">
  <circle cx="8" cy="5.5" r="4.5" fill={color} />
  <ellipse cx="8" cy="19" rx="6.5" ry="7" fill={color} />
</svg>
```

---

## PeopleQueue
**This component has strict rules. Read carefully.**

```jsx
// Props: { beforeUser, afterUser, userTapped }
// beforeUser: number of people waiting BEFORE user tapped
// afterUser:  number of people who joined AFTER user tapped
// userTapped: boolean
```

**Person ordering (strict):**
1. `beforeUser` black people (came before user)
2. 1 blue person (the user) — only rendered if userTapped=true
3. `afterUser` black people (came after user)

**No overflow. No "+X more". All people must be visible.**
The container is a fixed width (full card width minus padding ≈ 270px). Icons shrink as count increases. Use these size tiers:

| Total people | Icon size (px) |
|---|---|
| 1–8 | 22 |
| 9–16 | 18 |
| 17–28 | 15 |
| 29–45 | 12 |
| 46–70 | 10 |
| 71+ | 8 |

**Layout:** `display: flex, flexWrap: wrap, gap: 3px`. Let icons flow naturally into rows. Do NOT set a fixed height — let the container grow with the content.

**Colors:** Others = `#334155` (dark slate, not pure black). User = `#2563EB` (blue).

**Below the queue:** if userTapped, show small blue text: "🔵 That's you — position [beforeUser+1] in the queue"

**Card header row:** "WAITING AT THIS STOP" label left, total count (large, primary blue) right.

---

## RouteTimeline
**Vertical timeline. No horizontal scroll.**

```jsx
// Props: { bus, liveWaitingAtUserStop }
// bus = DEMO_BUS object
// liveWaitingAtUserStop = current dynamic count shown on user's stop node
```

**Layout:** A vertical list of nodes connected by a line. Read top to bottom: bus → intermediate stops → user's stop.

**Top row — Bus block:**
- Bus emoji + "Bus [bus.id]" + "Last seen: [bus.lastSeen]"
- CapacityBar below it showing current load

**Each intermediate stop:**
- Vertical connector line (2px, border color)
- Small filled circle dot
- Right of dot: stop name + "[N] boarding here"
- Below that in small text: "→ [running_load]/28 after this stop" in appropriate color

**User's stop (last node):**
- Thicker/colored connector line (primary color)
- Larger circle dot, primary filled, white inner dot
- Right: stop name + "— Your stop"
- Below: capacity warning text
  - If seats remaining ≤ 0: "⚠️ Bus may be full by the time it reaches you" (red)
  - If seats remaining 1–3: "⚠️ Only ~[N] seat[s] left for you" (red)
  - If seats remaining ≥ 4: "✓ ~[N] seats expected for you" (green)

**Calculate running load:**
```js
let running = bus.load;
bus.routeToUser.filter(s => !s.isUserStop).forEach(stop => {
  running = Math.min(bus.max, running + stop.waiting);
});
const seatsForUser = bus.max - running;
```

**liveWaitingAtUserStop** is shown in the user stop node as the current count (updates during demo).

---

## DispatchBanner
```jsx
// Props: { show, newEta, oldEta, totalWaiting }
// show: boolean — animate in/out with CSS transition (opacity + translateY)
```

Dark primary background, rounded card. Content:
- "🚌 Bus coming sooner" headline (white bold)
- Body: "Bus E2 is leaving **[X] minutes earlier** than scheduled. You and [totalWaiting] others waiting here made that happen."
- Inner box: "Updated ETA" label + large new ETA + strikethrough old ETA

Animate: `transition: opacity 0.4s, transform 0.4s`. Hidden = `opacity:0, translateY(-8px)`. Visible = `opacity:1, translateY(0)`.

---

## BoardingPrompt
```jsx
// Props: { show, onBoarded, onMissed }
// show: boolean
```

White card with primary border. Content:
- 🚌 emoji (large)
- "Bus E2 just arrived at KDOJ"
- "Did you get on?"
- Two buttons: "✓ I'm on the bus" (primary) | "✗ I missed it" (secondary)
- After "I'm on": show "Safe trip! 👋" in green
- After "I missed it": show "Still counted. Bus E1 in ~24 min." in primary color
- Small muted text at bottom: "No reply in 60s = assumed boarded"

---

## useDemoSequence (hook)
```jsx
// src/hooks/useDemoSequence.js
// Called from ETA.jsx
// Returns: { eta, totalWaiting, showDispatch, showBoarding, startSequence }
```

```js
export function useDemoSequence(initialEta, initialWaiting) {
  const [eta, setEta]                   = useState(initialEta);
  const [extraPeople, setExtraPeople]   = useState(0);
  const [showDispatch, setShowDispatch] = useState(false);
  const [showBoarding, setShowBoarding] = useState(false);
  const [started, setStarted]           = useState(false);

  const startSequence = () => setStarted(true);

  useEffect(() => {
    if (!started) return;
    const timers = [
      setTimeout(() => setExtraPeople(DEMO_TIMING.extraPeopleCount),   DEMO_TIMING.extraPeopleDelay),
      setTimeout(() => { setShowDispatch(true); setEta(DEMO_TIMING.dispatchEtaNew); }, DEMO_TIMING.dispatchDelay),
      setTimeout(() => setShowDispatch(false),                           DEMO_TIMING.dispatchHideDelay),
      setTimeout(() => setShowBoarding(true),                            DEMO_TIMING.boardingDelay),
    ];
    return () => timers.forEach(clearTimeout);
  }, [started]);

  // totalWaiting: before (11) + user (1 after tap) + extra
  // caller manages the +1 for user; this hook provides extraPeople
  return { eta, extraPeople, showDispatch, showBoarding, startSequence };
}
```
