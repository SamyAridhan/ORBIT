# 03 — Component Specifications

## useDashboard hook
`src/hooks/useDashboard.js`

State is always derived by replaying STEPS from 0 to the current step. This makes ← (go back) trivial — just replay to step-1.

```js
import { useState, useCallback } from "react";
import { INIT_BUSES, INIT_STOPS, STEPS } from "../data/mockData";

function deriveState(targetStep) {
  let buses = INIT_BUSES.map(b => ({ ...b }));
  let stops = INIT_STOPS.map(s => ({ ...s }));
  let logs  = [];
  for (let i = 1; i <= targetStep; i++) {
    const s = STEPS[i];
    buses = buses.map(b  => s.busPatch[b.id]   ? { ...b,  ...s.busPatch[b.id]  } : b);
    stops = stops.map(st => s.stopPatch[st.id]  ? { ...st, ...s.stopPatch[st.id]} : st);
    s.logs.forEach((l, j) => logs.unshift({ ...l, _key: `${i}-${j}` }));
  }
  return { buses, stops, logs };
}

export function useDashboard() {
  const [step, setStep] = useState(0);
  const [{ buses, stops, logs }, setState] = useState(() => deriveState(0));

  const goTo = useCallback((n) => {
    const clamped = Math.max(0, Math.min(STEPS.length - 1, n));
    setStep(clamped);
    setState(deriveState(clamped));
  }, []);

  // Override: patches current state without changing step
  const applyOverride = useCallback((busId) => {
    setState(prev => ({
      ...prev,
      buses: prev.buses.map(b => b.id === busId ? { ...b, delta: 0, status: "IDLE" } : b),
      logs: [{
        type: "REJECT", agent: `BUS_${busId}`, event: "FLEET_MANAGER_OVERRIDE",
        desc: `Override confirmed. Published to admin/override. Bus ${busId} reverts to fixed schedule.`,
        chips: [], _key: `override-${Date.now()}`,
      }, ...prev.logs],
    }));
  }, []);

  return { step, buses, stops, logs, goTo, applyOverride, totalSteps: STEPS.length };
}
```

---

## BusCard
`src/components/BusCard.jsx`

**Props:** `{ bus, onOverride }`

Layout (compact card, margin-bottom 5px):

**Row 1:** Bus ID badge (primary bg, white text, 10px 800) + delta badge if `bus.delta !== 0`
- Delta badge: green bg + "↑Xm early" if negative, red bg + "↓Xm late" if positive
- No delta badge if delta === 0

**Row 2:** Status indicator + position text
- Colored dot (6×6px circle, color from STATUS_CFG[bus.status].color)
- Status label (9px, 600, same color)
- Position text (9px, muted, overflow ellipsis)
- If status is COMMUTING or BOARDING: dot has a soft glow ring (box-shadow: `0 0 0 2px ${color}30`)

**Row 3:** Capacity bar + "X/28" text
- CapBar component (see below)
- Load/max text right-aligned (9px, 700, color matches cap fill color)

**Row 4:** Override button
- Full-width, ghost style (transparent bg, border: 1px solid border-color, muted text)
- On hover: border becomes accent amber, text becomes amber
- Clicking calls `onOverride(bus)`

Card border: 1.5px solid border-color normally. When status is RECALCULATING: border becomes accent amber. CSS transition: 0.3s.

---

## StopCard
`src/components/StopCard.jsx`

**Props:** `{ stop }`

Layout (card, margin-bottom 6px):

**Row 1:** Stop name (12px, 800) + corridor badge + claimed padlock
- Corridor badge: "E" or "B" or "F" — grey bg, 8px, 700
- Claimed padlock: 🔒 emoji, 13px, shown only when `stop.claimed === true`
- Padlock floats to the right

**Row 2:** Queue number (BIG) + demand level pill
- Queue number: 38px, weight 900. Color: red if CRITICAL, orange if HIGH, text-primary otherwise. CSS transition on color.
- Demand level pill: inline-flex with colored dot + label. Dot pulses (CSS animation) if CRITICAL.

**Row 3:** "Last bus X min ago" (9px, muted)
- Special case: if `stop.lastBus === 0`, show "Last bus just now"

Card border: 1.5px solid border-color normally. When CRITICAL: border becomes red. CSS transition: 0.3s.

---

## LogEntry
`src/components/LogEntry.jsx`

**Props:** `{ entry, stepIndex }`

**Starts expanded. No toggle.** (All entries are always fully visible.)

`stepIndex` is used to compute a display timestamp:
```js
const TIMESTAMPS = ["09:41:07","09:41:06","09:41:05","09:41:04","09:41:03","09:41:02","09:41:01","09:41:00","09:41:00","09:41:00"];
const time = TIMESTAMPS[Math.min(stepIndex, 9)];
```

Layout (left-border card, border-radius 0 8px 8px 0, margin-bottom 6px):
- Left border: 3px solid, color from LOG_CFG[entry.type].border
- Background: LOG_CFG[entry.type].bg

**Row 1:** Icon + agent name + timestamp
- Icon: emoji from LOG_CFG, 12px
- Agent name: 10px, weight 800, text-primary, flex:1
- Timestamp: 9px, muted, monospace font

**Row 2:** Event name (11px, weight 700, color = left border color)

**Row 3:** Description text (10px, textSec, line-height 1.5)

**Row 4 (if entry.chips.length > 0):** Constraint pills
- Each chip: green background (#D1FAE5), green text (#059669), 9px, 700, padding 2px 7px, border-radius 12px, green border

---

## CapBar (shared utility)
`src/components/CapBar.jsx`

**Props:** `{ load, max, height? }` (height defaults to 5)

```jsx
const pct = max > 0 ? load / max : 0;
const color = pct < 0.60 ? "#059669" : pct < 0.85 ? "#F59E0B" : "#DC2626";
// renders: gray track + colored fill, rounded, transition on width
```

---

## OverrideModal
`src/components/OverrideModal.jsx`

**Props:** `{ bus, onClose, onConfirm }`
Renders `null` if `bus` is null.

Overlay: absolute inset-0, semi-transparent dark bg, flex center, z-index 50.

Modal card (300px wide, white, rounded, border):
- Title: "Override Bus [bus.id]"
- Current decision text: shows delta or "Following fixed schedule"
- Amber warning box: mentions `admin/override` MQTT topic by name
- Two buttons: "Confirm" (red primary) | "Cancel" (secondary)

Clicking Confirm: calls `onConfirm()` which triggers `applyOverride(bus.id)` in the hook.

---

## DemoControl
`src/components/DemoControl.jsx`

**Props:** `{ step, totalSteps, stepLabel, onPrev, onNext }`

Two render states (toggled by local `open` state, starts open):

**Expanded:** dark primary pill
- ← button: disabled (opacity 0.25, cursor default) when step === 0
- Center: "STEP X / Y" label (8px, caps, muted white) + step label below (10px, white, 600)
- → button: green bg when active, disabled when step === totalSteps - 1
- ✕ to collapse

**Collapsed:** 42×42 circular primary button, ⚡ icon
