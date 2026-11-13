# ORBIT MAS Backend — Claude Code Instructions

For the complete brief (architecture, process, reporting protocol), read `AGENTS_BACKEND.md`
at the repo root. This file contains the essential rules that must be in context for every
backend session. **Design locked 11 Nov 2026; modules in `docs_modules/` dated 13 Nov 2026 win
over anything older.** Full agent spec: `docs_modules/01_AGENT_DESIGN.md`. Requirement IDs
(S1…, D1…, M1…, R1…, N1…): `docs_modules/14_SYSTEM_REQUIREMENTS.md`.

## What you're building

Multi-Agent System backend in `backend/`: three agents over MQTT, a FastAPI API layer, a
NetworkX route map, data files for the timetable and fleet, and a software-in-the-loop simulator.

| Agent | Job |
|---|---|
| **Stop Agent** | One per stop-and-route pair. Keeps the count of who's waiting. Reports every tick, whatever the level. Never decides anything about buses. |
| **Bus Agent** | One per bus, spares included. Owns position, load and hold; runs the driver screen; carries out instructions. |
| **Coordinator** | One. Watches each route's total against the coming bus, owns the spare pool, decides which confirmed overflow gets the spare. |

Simulation scope: Bus B, E, F. Bus E is built first (reference implementation).

## Non-negotiable rules

| Rule | Detail |
|---|---|
| **Never take a departure away** (N1) | No scheduled departure is removed or made later by an overflow response. The only early move is a pull-forward, and only when a spare covers the original time and the spare's driver accepted first. |
| **No rerouting** (N2) | Buses never change routes or stops. A spare on an extra trip drives the route's normal path. |
| **Arrival compression is forbidden** (N3) | Removed design error. Do not implement, reference, or create anything named `*compression*` or `ARRIVAL_COMPRESSION*`. See `05_GROUNDING_CHECKLIST.md` Trap 11. |
| **Confirmed overflow only** (R5, N4, N5) | Act when a bus really left full AND people are really still waiting. "Still waiting" is known three ways, each recorded against the departure that left them: the app count against door-counter boardings; students' `still_waiting` taps (a late tap always counts, as one person); the driver's "Yes" to the question the screen asks when the bus is full. Per departure take the **largest** source, never the sum. Nothing can confirm it → send nothing, log `LEFT_FULL_UNCONFIRMED`. Never on a prediction, never on a demand level, never on a flagged unconfirmed count. |
| **Levels are colours** (R1) | LOW / MEDIUM / HIGH / CRITICAL are display only. They trigger nothing. Stops report on every tick at every level. |
| **CP and Jalan Amal count** (S6) | App signals at those stops count like anywhere else. The only special case: no schedule-based `expected` number is produced for them. "Interchange node" is a routing word in module 02 — never reuse that list for anything about demand. |
| **Flag, don't drop** (R10) | A strange count is flagged and kept, never deleted. Believed if the driver or door counter agrees. |
| **One job, one response** (R8) | One spare gets at most one job at a time; each overflow gets at most one response. (Replaces the old claim-lock.) |
| **Three cases, in order** (R6) | Spare nearby → leaves between the full bus and the next scheduled bus. Spare further and next bus at terminus → spare accepts first, then next bus leaves early and the spare covers its time. Neither → nothing moves; alert the manager; log `NO_SPARE_AVAILABLE`. |
| **Holding is for spacing only** (R9) | Hold 1–2 min at a control point, at peak, when too close behind the bus ahead — and only when both buses' positions come from GPS (never on a timetable estimate). Never for a queue. |
| **Driver is asked, never expected to remember** (D1–D4, N6) | When the bus is full the screen asks "Did you have to turn people away?" Yes / No / Not sure — there is no optional "left people behind" button. "Not sure" or no answer is unknown, never "nobody was left". Instructions only while stopped, never on a break. No answer to an instruction = "Can't"; "Can't" is final. |
| **Manager controls are timing-only** (M5) | hold / release / cancel extra trip / return to schedule. A route change is rejected and logged `OVERRIDE_REJECTED`. |
| **ETA is plain travel time plus any hold** (R13) | `get_eta` uses `base_time`. Queue-adjusted edge weights must never feed arrival times. A busy stop never gets a shorter time. |
| **Only one AI/ML component** (N9) | Isolation Forest to flag strange counts. It never deletes, never decides. No other ML/AI in the decision path. |
| **The app is never required** (N7) | Zero app users must still work: a driver's "Yes, I turned people away" is enough on its own. |
| **Fallback to the timetable** (N8) | Broker or Coordinator down → every bus runs its timetable, nothing left pending. |
| **Observation mode** (R11) | Rollout stage `observe`: decide, log `SHADOW_WOULD_SEND`, send nothing. |
| **Data, not code** (R15) | Timetable, buses, drivers, spare pool, control points, peak periods are config files. Adding a bus is adding a record. |

**Retired with the old design — do not use:** Hold/Early Departure for a queue, six-step Bus
Agent hierarchy, 85% capacity lock, 12-min protected window, 15-min headway gap, 8-min early cap,
5-min min headway, 0.6 utility score, 30% adoption threshold, `app_count / adoption`, 1.5×
missed-bus weight, `NO_INTERVENTION_AVAILABLE`, `new_route_vector`, claim-lock, keepalive
broadcasts, "CP and Jalan Amal never signal", test cases TC01–TC17 (now TC101–TC141 in `01`).

## Placeholder constants

Keep these in one location (e.g. `config/thresholds.py` or the config JSON files), marked as
placeholders, never presented as settled:

| Value | Placeholder | Status |
|---|---|---|
| Seats per bus | 28 | Not finalized |
| Demand level cut-offs | 5 / 16 / 31 | Display colours only |
| Hold: "too close" gap and longest hold | 1–2 min idea | Not set |
| Manager answer timeout | N minutes | Not set |
| Left-behind people that justify an extra trip | 1 | Placeholder; a driver's "Yes" always meets it |
| Signal expiry; token rate window | 30 min | Starting value |
| Strange-count rule | > 3× `expected` | Starting value |
| All travel times (`02`), spare pool size and waiting spots | — | Estimates / data files |

## Code expectations

- Python 3.11+, type hints on signatures (tests pass on 3.11; a 3.12 venv is also fine)
- Small, single-responsibility functions — easy to property-test
- Tests alongside every task (pytest, in `backend/tests/`). Run from `backend/` with flat imports
  (`from agents.stop_agent …`, `from simulation.campus_graph …`; no `__init__.py`).
- Testing Session (coverage, Hypothesis, mutation run, flaky check) at the END of each block
- Don't modify `src/` or `dashboard/` unless explicitly told to
- Check `docs_modules/12_BUILD_MILESTONES.md` for current progress before starting work
- Don't tick milestone boxes yourself — report completion for review. A box is ticked only
  when a later session has fetch-confirmed the commit on origin (module 13).
- Topic, event and endpoint names in `01`/`03` are proposals — if you change one, say so in the
  report so the module is updated.
- **Git (`13_GIT_PERSISTENCE_PROTOCOL.md`):** `git fetch origin --prune` first; push before the
  session ends; every report says "committed as `<hash>` on `<branch>`, pushed: yes/no".
  Working branch: `claude/funny-knuth-w6dibj`.
