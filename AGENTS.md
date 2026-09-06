# AGENTS.md — ORBIT Frontend POC Build Instructions

Read this file first. Then read all files in `/context_modules/` in order (00 through 06). Do not start writing code until you have read all of them.

---

## Your job

Build a hardcoded React PWA frontend for ORBIT — a campus bus coordination system demo for a university presentation. No backend. No API calls. All data is mock. All "live updates" use setTimeout.

---

## Context modules — load all of these before building

| File | Read for |
|---|---|
| `context_modules/00_PROJECT_OVERVIEW.md` | Tech stack, folder structure, deploy target |
| `context_modules/01_SCREENS_AND_FLOW.md` | Every screen, navigation flow, exact screen content |
| `context_modules/02_MOCK_DATA.md` | All hardcoded data — copy this exactly into mockData.js |
| `context_modules/03_COMPONENTS.md` | Every component: props, layout, behavior |
| `context_modules/04_DEMO_SEQUENCE.md` | The automated demo sequence — this must work perfectly |
| `context_modules/05_DESIGN_TOKENS.md` | All colors, typography, spacing, sizes |
| `context_modules/06_UX_DECISIONS.md` | Locked UX rules — do not deviate |

---

## Build order

Build in this exact order. Do not skip ahead. Test each step renders before moving on.

1. **Project scaffold** — Vite + React + Tailwind + React Router v6 setup. Confirm `npm run dev` works.
2. **Design tokens** — `src/design/tokens.js` with all colors from `05_DESIGN_TOKENS.md`.
3. **Mock data** — `src/data/mockData.js` with all exports from `02_MOCK_DATA.md`.
4. **Shared components** — PhoneFrame, TopBar, CapacityBar, PersonSVG (build and verify each renders).
5. **PeopleQueue component** — build and verify: no overflow, shrinking sizes, correct ordering, black + blue colors.
6. **RouteTimeline component** — vertical layout, running capacity calculation, user stop highlighting.
7. **DispatchBanner + BoardingPrompt** — with CSS transition animation.
8. **useDemoSequence hook** — all timers from DEMO_TIMING constants.
9. **Onboarding screen** — 4 cards, swipe/dot navigation, localStorage flag.
10. **GPS Permission screen** — explanation + "Allow" simulates detection.
11. **Home screen** — stop picker, search filter, returning-user green banner, "How this works?" button.
12. **Destination screen** — corridor cards, atStop badge, info box for room browsing.
13. **ETA screen** — compose all components, connect useDemoSequence, atStop logic for button.
14. **App.jsx routing** — wire all screens with React Router, state flow between screens.
15. **vercel.json + PWA meta tags** — final deployment prep.
16. **End-to-end test** — run the full demo sequence manually, confirm all steps from `04_DEMO_SEQUENCE.md` work correctly.

---

## Non-negotiable rules

1. **The demo sequence in `04_DEMO_SEQUENCE.md` must work without a single error.** Test it 5 times.
2. **PeopleQueue must never show overflow or "+X more".** All people visible, icons shrink.
3. **RouteTimeline is vertical. No horizontal scroll.**
4. **No hardcoded values in components.** All data from `mockData.js`, all colors from `tokens.js`.
5. **"I'm waiting here" button is disabled when atStop=false.** Check this condition in ETA.jsx.
6. **GPS permission explanation screen fires before the native browser prompt.** In the POC, the "Allow" button does NOT call `navigator.geolocation` — it simulates detection with a 1.5s setTimeout and navigates to Destination with atStop=true and KDOJ selected.
7. **Do not add features not listed.** No map. No charts. No backend calls. No authentication. No animations beyond CSS transitions.
8. **Mobile-first.** Every screen must look correct on a 375px wide viewport.

---

## The one demo scenario that must work perfectly

```
1. App opens → onboarding (4 cards) → "Get started"
2. Home screen → tap "Find my stop automatically"
3. GPS explanation screen → tap "Allow location"
4. 1.5s loading → Destination screen (KDOJ, atStop=true)
5. Tap "Faculty Cluster (T02 · T06 · T08)"
6. ETA screen:
   - Shows Bus E2, 14 min, 14/28 seats, last seen PKU
   - RouteTimeline: Bus E2 (14/28) → KDSE (8 boarding) → KLG (5 boarding) → KDOJ (~1 seat left)
   - PeopleQueue: 11 black people
   - "I'm waiting here" button active
7. User taps "I'm waiting here"
   - Blue person appears at position 12
   - Confirmation card: "✓ You're counted — position 12 in queue"
8. 3s later: 4 more black people appear (positions 13–16), count updates to 16
9. 6s later: DispatchBanner appears — "Bus E2 leaving 7 min earlier — you and 16 others made that happen" — ETA updates 14→7
10. 11s later: DispatchBanner dismisses
11. 16s later: BoardingPrompt — "Bus E2 just arrived at KDOJ · Did you get on?"
12. Tap "✓ I'm on the bus" → "Safe trip! 👋"
```

This sequence is the entire point of the prototype. It must be smooth.

---

## What NOT to build

- No fleet manager dashboard
- No MAS backend or any server-side code
- No real GPS (simulate only)
- No map view
- No push notifications
- No user account or login
- No multiple demo scenarios (only the KDOJ → Bus E scenario needs to work)
- No analytics or tracking
- No service worker / offline caching (basic PWA meta tags only)

For Fleet Dashboard
# AGENTS.md — ORBIT Fleet Dashboard Build Instructions

Read this file first. Then read all files in `/dashboard_context_modules/` in order (00 through 05). Do not write any code until you have read all of them.

---

## Your job

Build a hardcoded React frontend for the ORBIT Fleet Manager Dashboard. This is a desktop-only, single-page application. No backend. No API calls. All data is hardcoded. All state changes are driven by the user pressing ← or → on the demo control.

---

## Context modules — load all before building

| File | Read for |
|---|---|
| `dashboard_context_modules/00_DASHBOARD_OVERVIEW.md` | Tech stack, folder structure, layout overview |
| `dashboard_context_modules/01_DASHBOARD_LAYOUT.md` | Panel dimensions, column structure, demo control position |
| `dashboard_context_modules/02_DASHBOARD_MOCK_DATA.md` | All hardcoded data — copy exactly into mockData.js |
| `dashboard_context_modules/03_DASHBOARD_COMPONENTS.md` | Every component: props, layout, exact behavior |
| `dashboard_context_modules/04_DASHBOARD_DEMO_SEQUENCE.md` | 10-step demo sequence, what updates at each step |
| `dashboard_context_modules/05_DASHBOARD_DESIGN.md` | All colors, typography, spacing, animations |

---

## Build order

Build in this exact order. Verify each step renders before moving to the next.

1. **Project scaffold** — Vite + React + Tailwind. Confirm `npm run dev` works.
2. **Design tokens** — `src/design/tokens.js` with all colors from `05_DASHBOARD_DESIGN.md`.
3. **Mock data** — `src/data/mockData.js` with all exports from `02_DASHBOARD_MOCK_DATA.md`. Copy exactly.
4. **useDashboard hook** — implement `deriveState()` and the hook as specified in `03_DASHBOARD_COMPONENTS.md`. Test that `deriveState(0)` returns initial state and `deriveState(9)` returns final state correctly.
5. **CapBar** — shared utility, build and verify.
6. **BusCard** — build and verify all four rows render correctly. Verify Override button hover works.
7. **StopCard** — build and verify. Verify the 38px queue number, demand pill, and padlock icon.
8. **LogEntry** — build fully expanded (no toggle). Verify constraint chips render. Verify timestamps.
9. **OverrideModal** — build and verify it renders/hides based on prop. Verify MQTT topic mention in warning box.
10. **DemoControl** — build expanded and collapsed states. Verify ← is disabled at step 0, → is disabled at last step.
11. **Header** — build with status pills. Verify counts derive from buses and logs arrays.
12. **App.jsx** — wire all panels, useDashboard hook, OverrideModal state, three-column layout.
13. **vercel.json** — add SPA rewrite rule.
14. **End-to-end test** — step through all 10 steps manually. Verify every bus and stop card update. Verify every log entry appears. Verify ← steps back correctly. Verify override logs an entry.

---

## Non-negotiable rules

1. **All 10 steps must work perfectly in both forward and backward directions.** Test stepping forward to step 9 and then backward to step 0 — state must match the initial state exactly.
2. **State is always derived by replaying from scratch.** Do not accumulate diffs. Use `deriveState(step)` on every navigation.
3. **Log entries start fully expanded.** No collapsed state. No toggle button.
4. **Buses are grouped by corridor in the left panel.** Order: Corridor E → Corridor B → Corridor F.
5. **The queue count number in StopCard is 38px weight 900.** This is the primary visual. Do not reduce its size.
6. **CRITICAL demand cards have a pulsing dot.** Use the CSS keyframe animation from `05_DASHBOARD_DESIGN.md`.
7. **Override modal mentions the MQTT topic `admin/override` by name.** This is important for the presentation.
8. **Desktop only.** No responsive breakpoints. Minimum width assumed: 1024px.
9. **No hardcoded colors or sizes in components.** All from tokens.js and mockData.js.
10. **Do not add features not listed.** No charts, no maps, no real-time connections, no auto-play, no routing.

---

## The sequence that must work perfectly

```
Step 0: Initial state
  → E1 COMMUTING, E2 IDLE, B1/B3 COMMUTING, B2 IDLE, F1 COMMUTING
  → KDOJ: queue 8, MEDIUM | KLG: 4 LOW | KDSE: 3 LOW | KP: 6 MEDIUM | K9/10: 2 LOW | KTR: 5 MEDIUM
  → Logs: empty

Step 1: KDOJ queue → 18, level → HIGH

Step 2: KDOJ queue → 34, level → CRITICAL (border turns red, dot pulses)

Step 3: Log entry STOP_KDOJ_E CRITICAL_BROADCAST appears

Step 4: Bus E2 → RECALCULATING (card border turns amber). Log: BUS_E2 EVALUATING

Step 5: Log: BUS_E2 CONSTRAINTS_CHECKED with 6 green chips

Step 6: Bus E2 → COMMUTING, position "En route → KDOJ", delta -7 (green badge). Log: EARLY_DEPARTURE_ACCEPTED

Step 7: KDOJ claimed → true (padlock appears). Log: CLAIM_PUBLISHED

Step 8: Log: BUS_E1 CLAIM_CHECK_FAIL (grey muted entry)

Step 9: Bus E2 → BOARDING, position "KDOJ". KDOJ queue → 4, LOW, unclaimed, lastBus → 0. Log: BOARDING_AT_KDOJ

← from step 9 → step 8: Bus E2 back to COMMUTING "En route → KDOJ". KDOJ back to CRITICAL claimed.
← from step 1 → step 0: All state back to initial. Logs empty.
```

---

## What NOT to build

- No student-facing PWA screens
- No map or chart visualization
- No real-time data connections
- No auto-play demo sequence
- No authentication
- No mobile layout
- No multiple demo scenarios