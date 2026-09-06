# Module 10 — ORBIT Prototype Status (Student PWA + Fleet Dashboard)
> New module, July 2026. Documents the actual state of the two frontends already built in
> `github.com/SamyAridhan/ORBIT`, based on a direct review of the repo (`context_modules/`,
> `context_modules_2/`, `AGENTS.md`, `AGENTS_DASHBOARD.md`, and the `src/`/`dashboard/` folders).
> Load this before touching either frontend.

---

## Repo Structure (as of this session)

```
ORBIT/
├── AGENTS.md                  # Student PWA build brief
├── AGENTS_DASHBOARD.md        # Dashboard build brief
├── context_modules/           # Student PWA design context (00–06)
├── context_modules_2/         # Dashboard design context (00–05)
├── src/                       # Student PWA source (React 18 + Vite + Tailwind)
├── dashboard/                 # Dashboard source, separate Vite app/Vercel project
├── public/, assets/           # PWA icons, manifest, Busloader animation
└── docs_modules/               # Mirror of the 00–09 + QnA context modules (this project)
```

Both frontends are **hardcoded prototype/demo builds** — no backend, no API calls, no MQTT, no real GPS. All "live" behaviour is `setTimeout`-driven scripted sequences. This is intentional and correct for a panel-presentation demo; it is not yet the real system described in `01_AGENT_DESIGN.md`–`03_DASHBOARD_AND_INTEGRATION.md`.

---

## Student PWA — Status: Liked, Not Yet Finalized

**Where it stands:** the flow, UI, and UX are considered close to right. Locked decisions exist in `context_modules/06_UX_DECISIONS.md` and should be respected in any further iteration:
- People-queue: no overflow, all icons visible, shrink with count, strict ordering (black before-user → blue user → black after-user)
- Route timeline: vertical only, running capacity calculation, user's stop visually distinct
- Three GPS-permission flows (new user, returning user, browsing-from-room)
- Locked button copy table
- "I'm waiting here" behaviour fully specified (disabled/active/post-tap states)
- Destination-first labelling ("Faculty Cluster" before "Bus E")

**Screens built:** Onboarding, Home, GPSPermission, Destination, ETA (`src/screens/`). Components: PhoneFrame, TopBar, CapacityBar, PersonSVG, PeopleQueue, RouteTimeline, DispatchBanner, BoardingPrompt, FullBusPrompt.

**⚠️ The one thing that needs to change:** the flagship demo sequence (documented in `AGENTS.md`'s "one demo scenario that must work perfectly") is built around **arrival compression**:

> *"6s later: DispatchBanner appears — 'Bus E2 leaving 7 min earlier — you and 16 others made that happen' — ETA updates 14→7"*

A 14→7 minute ETA swing is not achievable by any mechanism this system actually has — Hold and Early Departure both have real physical bounds, and compression (the mechanism actually intended here per the dashboard brief) is bounded to 5–15 seconds/stop, nowhere near 7 minutes. This needs to be redesigned. See "Open Decision" below.

**Everything else about the PWA can proceed as-is.**

---

## Fleet Dashboard — Status: Still Being Reworked, Not Finalized

**Where it stands:** functional 3-column layout (Bus Fleet / Stop Status / Decision Log) with a 10-step (0–9) scripted replay driven by a manual arrow control, per `AGENTS_DASHBOARD.md`. Components built: Header, BusCard, StopCard, LogEntry, OverrideModal, DemoControl (`dashboard/src/components/`).

**Locked corrections currently in the build brief (need updating):**
> *"The intervention is arrival compression, not an early departure by an empty terminus bus."*

This is the same conflict as the PWA — the dashboard's entire replay scenario (`E2 already commuting at 14/28, KDOJ grows 11→16, ETA improves 14→7`) is built on compression. It needs the same redesign, and since the dashboard replays the *same* scenario as the PWA for consistency, both should be fixed together, in the same direction.

**Separately from the compression issue** — the user has said the dashboard isn't where they want it yet more broadly (layout, visual polish, information density). That's a distinct, open-ended item — happy to work through it in a dedicated session once the compression fix is settled, since redesigning the scenario will likely touch layout/content anyway.

**Validation already defined and still valid:** replay 0→9→0 without state drift; direct step jumps must equal sequential replay; modal actions must not alter canonical replay state; `npm test` and `npm run build` must pass.

---

## Note — Demo Scenario Redesign Is Deferred

The prototypes' demo scenario is built around arrival compression and will need rework once compression is off the table (a bus already COMMUTING toward KDOJ has no mechanism to arrive there faster — Hold only pauses at the bus's *current* stop, and Early Departure is terminus-only, so the only realistic fix is reframing the scenario around a bus that hasn't departed yet). A worked-through redesign (Early Departure, with a headway gap and specific numbers that stay consistent with the `-6 min` example already in `03_DASHBOARD_AND_INTEGRATION.md`) was sketched out in-session but intentionally **not applied** — actual prototype/repo changes are out of scope for this context-reorganization pass. Pick this back up as its own task when ready to touch the PWA/dashboard code directly.
