# Module 10 — ORBIT Prototype Status (Student PWA + Fleet Dashboard)
> New module, July 2026. Documents the actual state of the two frontends already built in
> `github.com/SamyAridhan/ORBIT`, based on a direct review of the repo (`context_modules/`,
> `context_modules_2/`, `AGENTS.md`, `AGENTS_DASHBOARD.md`, and the `src/`/`dashboard/` folders).
> Load this before touching either frontend.
> **Updated 13 Nov 2026:** the design was replaced on 11 Nov 2026 (`00_MASTER_CONTEXT.md` design
> change log). Both prototypes now differ from the design in more than the compression demo —
> see "Where the prototypes stand against the Nov 2026 design" at the end. The description of
> what is built, below, is unchanged from July 2026. The prototypes themselves are not edited
> from this Project.

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

A 14→7 minute ETA swing is not achievable by any mechanism this system has — compression (the mechanism intended here per the dashboard brief) is bounded to 5–15 seconds per stop. This must go. See the last section of this file.

**Note (13 Nov 2026):** "everything else can proceed as-is" is no longer true. The flow itself changes (destination first, transfers, how-full, "did you get on?", extra-bus notice, driver mode) — see the last section.

---

## Fleet Dashboard — Status: Still Being Reworked, Not Finalized

**Where it stands:** functional 3-column layout (Bus Fleet / Stop Status / Decision Log) with a 10-step (0–9) scripted replay driven by a manual arrow control, per `AGENTS_DASHBOARD.md`. Components built: Header, BusCard, StopCard, LogEntry, OverrideModal, DemoControl (`dashboard/src/components/`).

**Locked corrections currently in the build brief (need updating):**
> *"The intervention is arrival compression, not an early departure by an empty terminus bus."*

This is the same conflict as the PWA — the dashboard's entire replay scenario (`E2 already commuting at 14/28, KDOJ grows 11→16, ETA improves 14→7`) is built on compression. It needs the same redesign, and since the dashboard replays the *same* scenario as the PWA for consistency, both should be fixed together, in the same direction — now the Nov 2026 design, not Hold / Early Departure.

**Separately from the compression issue** — the user has said the dashboard isn't where they want it yet more broadly (layout, visual polish, information density). That's a distinct, open-ended item — happy to work through it in a dedicated session once the compression fix is settled, since redesigning the scenario will likely touch layout/content anyway.

**Validation already defined and still valid:** replay 0→9→0 without state drift; direct step jumps must equal sequential replay; modal actions must not alter canonical replay state; `npm test` and `npm run build` must pass.

---

## Where the prototypes stand against the Nov 2026 design

The July 2026 note here planned to rebuild the demo around Early Departure. **That plan is void** — early departure for a queue no longer exists. The prototypes are now two steps behind:

| | Prototype (as built) | Design locked 11 Nov 2026 |
|---|---|---|
| What the student picks | A bus / corridor at the detected stop | A **destination**; the app plans the trip, including a change of bus |
| What happens to a queue | "Bus E2 leaving 7 min earlier" (compression; ETA 14 → 7) | A **spare bus** runs an extra trip for a confirmed overflow; no scheduled bus changes |
| How full the bus is | From a scripted manifest count | Door counter → driver tap → rider tap, with the source shown |
| After the bus passes | BoardingPrompt / FullBusPrompt, scripted | "Did you get on?" on app open; "Still waiting" confirms a left-behind |
| CP and Jalan Amal | Treated as waypoints | Signals there count like anywhere else |
| Driver | No driver screen | **Driver mode** inside the PWA: load taps, instruction with sound, OK / Can't |
| Dashboard | 3 columns, 10-step replay of the compression scenario, OverrideModal | Live view per route, alerts with one-tap approval, the one setting, decision log incl. observation mode, planning reports |
| Manager override | Modal (check for any route field) | Timing-only |

**What can probably carry over** (Samy decides at redesign time): the visual language, PhoneFrame / TopBar, the people-queue idea, the vertical route timeline, the GPS-permission flows, destination-first labelling, the capacity bar as a "how full" display.

**What must go:** the DispatchBanner copy "leaving 7 min earlier — you and 16 others made that happen", the 14 → 7 ETA change, and the dashboard's compression replay. Searching for the word "compression" won't find them — the word isn't in `src/` or `dashboard/`. Search for the "14 min → 7 min" numbers and the `setTimeout` sequence that produces them.

**When:** after the backend core exists. Tracked as Blocks 12 (student app and driver mode) and 13 (dashboard) in `12_BUILD_MILESTONES.md`. The UI redesign is a design task to do with Samy first — he puts heavy weight on usability.

**Also stale in the repo** (for Coddy to flag, not for this Project to edit): `AGENTS.md`, `AGENTS_DASHBOARD.md`, `context_modules/`, `context_modules_2/` describe the old demo; `CLAUDE.md` (root and `backend/`) and `docs_modules/` describe the July 2026 rules until Coddy syncs them from the 13 Nov module set.
