# Module 12 — ORBIT Build Milestones (Task-Based)
> Replanned 13 Nov 2026 around the design locked on 11 Nov 2026 (`01_AGENT_DESIGN.md`).
> Tracks the build task by task — never by date. Samy works weekends, irregularly; this file is
> what lets any session pick up exactly where the last one stopped.
> Ordinary unit tests are written with every task. A dedicated **Testing Session** (coverage,
> Hypothesis property tests, mutation run — `11_TESTING_QA_JBAGENTIC.md`) happens at the END of
> each block, not after each task.
> Load this at the start of every build session. Update it at the end (complete file, not a diff).
> **"Done" is defined by `13_GIT_PERSISTENCE_PROTOCOL.md`:** a task is complete only when its
> commit is pushed to `origin` and a fresh session can fetch it — not when a hash appears in a report.
> The block order (core first) was confirmed by Samy on 13 Nov 2026. Samy and Coddy can reorder
> tasks inside a block freely.

---

## How to use this file

- Tick a box (`[ ]` → `[x]`) only when the commit is **confirmed on `origin`**: a session has run `git fetch` and `git cat-file -t <hash>` and seen it on the working branch. A hash in a Coddy report is "reported", not "confirmed". Keep the branch name next to the hash.
- A block is not complete until its Testing Session is ticked too.
- If a session stops mid-block, leave a one-line **Status** note under that block.
- Test case numbers (TC101 …) are in `01_AGENT_DESIGN.md`. Requirement IDs (R1, S5 …) are in `14_SYSTEM_REQUIREMENTS.md`.

---

## Working branch (read before touching git)

- Active branch: **`claude/funny-knuth-w6dibj`** on `origin` (`github.com/SamyAridhan/ORBIT`).
- `main` is at **`8b005cc`** (Block 0 merged, 3 Oct 2026).
- The working branch is ahead of `main`; tip reported as **`1d67a2e`** (13 Nov 2026).
- Always `git fetch origin` before trusting a local `git log`. Check out the working branch, not `main`, for Block 1+ commits. `main` gets a merge at each block end.

---

## Build resumed — 13 Nov 2026

- [x] **Coddy catch-up done.** Fetched; `709e7c9`, `2ae4c93`, `47262d8` confirmed on origin; `docs_modules/` replaced with the 13 Nov set (`132a9c9`); both `CLAUDE.md` files and `AGENTS_BACKEND.md` rewritten to the new design; catch-up brief saved in `docs_modules/` (`61f92ab`). All reported as pushed.
- Old module versions were deleted, not moved to `_retired/` — git holds them at `47262d8`, and keeping July rule text greppable is the leak Trap 12 warns about.
- **Python:** no pin in the repo. The suite has passed on 3.11.18 (Coddy's container) and 3.12.10 (Samy's local venv).
- **Module refinements of 13 Nov (afternoon)** are in `01`: three ways to know people were left behind, late "still waiting" taps, left-behind per departure, hold needs GPS, `expected` from ORBIT's own schedule model.

---

## Progress overview

| Block | Status |
|---|---|
| 0 — Environment and Bus E route map | Complete (on `main`, `8b005cc`) |
| ★ Whole-system design review | **Done** (17 Oct – 11 Nov 2026). Design locked; modules updated 13 Nov |
| 1 — Stop Agent | In progress — Tasks 1, 2R + 9, 3R, 4 confirmed; Task 5 built (reported `1d67a2e`, pushed); next Task 6 |
| 2 — Route data: both Bus E paths, timetable file, fleet file, ETA rule | Not started |
| 3 — Bus Agent: state, sources, driver answers | Not started |
| 4 — Coordinator I: route totals, confirmed overflow, observation mode | Not started — needs Samy's confirmation first |
| 5 — MQTT integration and fallback to the timetable | Not started |
| 6 — API and WebSocket | Not started |
| 7 — Simulator, injector and scenario library | Not started |
| 8 — Planning reports | Not started |
| 9 — Coordinator II: the spare bus | Not started |
| 10 — Holding | Not started |
| 11 — Isolation Forest flag | Not started |
| 12 — Student app and driver mode on the new flow | Not started |
| 13 — Dashboard rework | Not started |

Blocks 1–8 are the core (demand picture → live view → reports). A complete, smaller system exists at the end of Block 8 even if nothing after it is built.

---

## Block 0 — Environment and Bus E route map — COMPLETE

Infra only; no Testing Session.

- [x] FastAPI skeleton running (`backend/api/main.py`) — `3cfcf57`
- [ ] Mosquitto broker running locally — **unchecked on purpose**; a real, re-runnable broker belongs to Block 5. `paho-mqtt==2.1.0` is in `requirements.txt` (`832dea6`).
- [x] Bus E route map in NetworkX — superset `139cd3b`
- [x] `get_eta()` returns sane values for KDOJ → Cluster — `139cd3b`
- [x] Repo folder structure scaffolded

**Verified state on `main` (`8b005cc`):**
- Bus E graph: 8 nodes, 7 directed edges, no PKU, `kdse→cp = 6` placeholder, T02→T08 direct. Only the N24 path exists; the Jalan Amal path and the return leg are Block 2.
- `get_eta`: `kdoj→cluster_t08 = 26`, `kdoj→cluster_t02 = 23`, reverse = `inf`. Returns `inf` for an unknown node.
- `update_edge_weights()` exists (queue-adjusted weights). **Must not feed arrival times** — see Block 2.
- 13 graph tests passing, run from `backend/` with flat imports (`from simulation.campus_graph …`; no `__init__.py`).
- `requirements.txt`: `paho-mqtt==2.1.0`, `uvloop==0.22.1; sys_platform != "win32"`, `networkx==3.6.1`, pytest.
- venv (not committed): no repo pin; 3.11.18 and 3.12.10 both pass.

**History:** `832dea6` → `b0b691d` → `fa3c144` → `bb8adc7` → `139cd3b` → `344db19` → `31507a9` → `8b005cc`. On 3 Oct 2026 a session that started from a stale checkout rebuilt the graph thinking it was missing; the two lineages were reconciled with nothing lost. That incident produced module 13.

---

## ★ Whole-system design review — DONE

The "Architecture and Real-World Plausibility Review" gate that used to sit after Block 1 was pulled forward and ran 17 Oct – 11 Nov 2026. Outcome: the design in `01` was replaced (spare bus, Coordinator, confirmed trigger, stops report all the time, app signals count at CP/Jalan Amal). Record: `ORBIT_DESIGN_REVIEW_OPEN_DECISIONS.md`.

Effect on built code:
- Task 1 (levels) stays — levels are now display only.
- Task 2 (broadcast decision) changes — stops report on every tick.
- Task 3 (interchange gate) changes — app signals at CP / Jalan Amal count.
- The earlier note "keepalive fires through the claim" is void. There is no claim and no keepalive.

---

## Block 1 — Stop Agent (start with Bus E: KDOJ, KLG, KDSE, CP)

- [x] **Task 1 — Demand levels** (LOW / MEDIUM / HIGH / CRITICAL; negative raises `ValueError`) — TC102. *`709e7c9` — confirmed on origin by Coddy's 13 Nov session. Unchanged; test comments relabelled TC101/TC102.*
- [x] **Task 2R + Task 9 — The state, built on every tick.** `decide_broadcast`, `BroadcastDecision`, `KEEPALIVE_INTERVAL` deleted. `StopState` (frozen dataclass) + `build_stop_state(...)`, produced at every level; `level = classify_demand(best count)`; `left_behind` is the sum of `left_behind_by_departure`; `to_dict()` gives the message shape. — TC101. *`81b6e75` — confirmed on origin by Coddy's later 13 Nov session.*
- [x] **Task 3R — CP and Jalan Amal.** `evaluate_broadcast` deleted. `NO_EXPECTED_STOP_IDS` / `produces_expected()`; `expected` is forced to `None` at CP and Jalan Amal where the state is built (coerce, not raise — accepted); n24 / ktc explicitly not in the set; a count at CP counts at every level. — TC108, Stop-Agent half of TC107. *`81b6e75` — confirmed on origin.*
- [x] **Task 4 — Waiting count from app signals.** One record per token (`SignalRecord`, status `WAITING` / `ASSUMED_BOARDED` / `LEFT_BEHIND`) in a `SignalBook` per stop and route; `expire_signals`, `waiting_count`, `waiting_app_from_book`; placeholder `SIGNAL_EXPIRY = 30 min` in `backend/config/thresholds.py`. — R1. *`419bff0` — confirmed on origin. Corrected in Task 5: `waiting_count` excludes only `ASSUMED_BOARDED` (a left-behind person is still waiting).*
- [ ] **Task 5 — Signal types and the lost-track rule.** `SignalType` (`initial` / `still_waiting` / `transfer`) through one entry point `apply_signal(...)`. Unknown or expired token, any type → one `WAITING` record. `ASSUMED_BOARDED`, any type → restored as one person, start time kept. Known person + `initial` → nothing changes, no clock touched. Two times on the record: `started_waiting_at` (never refreshed) and `last_heard_at` (drives expiry). One constant, `SIGNAL_EXPIRY`. TC150 as a Hypothesis `RuleBasedStateMachine` (200 examples × 40 steps). — TC103, TC150, TC151, TC152. *Built, reported `1d67a2e`, pushed. Tick once a later session fetch-confirms.*
- [ ] **Task 6 — After the bus leaves.** A small frozen `DepartureFacts` to the contract in `01`, in a module shared with the Bus Agent and Coordinator (not inside `stop_agent.py`, never in `simulation/`). On a departure: snapshot (`waiting_at_departure`, `flagged_at_departure`); people who were already waiting are marked `ASSUMED_BOARDED` — all of them when `boarded` is `None`, only the `boarded` longest-waiting when the door counter gives a number. "Still waiting" → `LEFT_BEHIND`, attached to the most recent departure that left **full** at or after the student started waiting; none → stays `WAITING`, confirms nothing. The live map groups current people by the last full bus that left them; the per-departure tap count in the snapshot only grows. — TC110, TC142, TC143, TC153 (record half), TC154
- [ ] **Task 7 — Strange-count flag (rule layer).** Flag when the count is more than 3× `expected`; keep the count; never drop it. Isolation Forest is Block 11, not here. — TC105
- [ ] **Task 8 — Transfer hand-over.** Move a person from one stop-and-route count to another in one step, never in both. (The app side is Block 12.) — TC109

**Testing Session (GATE):**
- [ ] Coverage check on the Stop Agent module (a floor, not a target)
- [ ] First Hypothesis property test — "the level never goes down when the count goes up" (the `IntEnum` was built for this)
- [ ] Second property — "one person is never counted at two stops at once" (Task 8)
- [x] Third property — "one token is never counted more than once at a stop and route", across any mix of `initial`, `still_waiting` and `transfer` signals — *built early with Task 5 as a `RuleBasedStateMachine` (`1d67a2e`); extend it when Task 6 adds departures*
- [ ] Choose the mutation tool (MutPy or cosmic-ray), note why, confirm it runs here
- [ ] **Mutation run executed and its survivors triaged** — record the kill rate as the first baseline; kill each survivor with a test or accept it with a one-line reason
- [ ] Flaky-test check (random order, repeated runs) before trusting the mutation score

> No numeric pass mark is set on purpose. The threshold is an open question with Huiming (`11`).
> This first session's goal is the baseline and learning the tooling.

**Status:** In progress. 13 Nov 2026: Tasks 2R + 9, 3R and 4 confirmed on origin (`81b6e75`, `419bff0`); docs syncs `132a9c9`, `61f92ab`, `29e8c41` confirmed, `d81ec64` reported and pushed. **Task 5 built and pushed (`1d67a2e`, reported): 95 tests green** (13 graph + 82 stop-agent, 19 new), including the first Hypothesis state machine (TC150). New pinned dependency: `hypothesis==6.170.15`; `.hypothesis/` gitignored. Known, accepted limit: a tap from someone whose record expired starts a fresh record, so they can only be attached to buses that leave after that tap. Next: Task 6.

---

## Block 2 — Route data: both Bus E paths, timetable file, fleet file, ETA rule

Data foundations. Small, and safe to do before anything else changes.

- [ ] Bus E second path: CP → Jalan Amal → KTC for E2/E4/E6; E1/E3/E5 keep CP → N24 → KTC. Each bus carries a `path_variant`. — TC137
- [ ] Bus E return leg (Cluster → … → KDOJ) so a simulated bus can run its 60-minute cycle. Stop order is an assumption until Samy supplies it.
- [ ] **ETA rule:** arrival times use plain base travel times plus any hold. `update_edge_weights()` must not feed them; remove it or leave it unused — Coddy's call, report which. — TC136
- [ ] Timetable as a config file per semester: weekday, Friday (no service 12:40–14:00) and weekend patterns; which bus runs which path. Loaded from the Oct 2026 facts in `07`.
- [ ] Fleet file: buses, seats, role (scheduled / spare), spare waiting spots, drive time from each waiting spot to each route start. — TC141
- [ ] Rename note in code/docs: "interchange node" is a routing term only.
- [ ] Delete `update_edge_weights()` and its test in the same commit that switches `get_eta` to `base_time` — one number per edge (Coddy's call, agreed).
- [ ] The route map is real data, not simulation: move `campus_graph.py` out of `simulation/` (suggested — the Coordinator and the ETA code need it, and agents must not import from `simulation/`). Coddy's call on the folder name.
- [ ] `backend/demand/` — ORBIT's own schedule model for the `expected` number, separate from the simulator's crowd generator.

**Testing Session:** coverage on the loaders; property test "ETA to a stop never depends on that stop's queue".

**Status:** —

---

## Block 3 — Bus Agent: state, sources, driver answers

- [ ] Bus state object and status values (`01` Bus Agent "State"), scheduled and spare roles
- [ ] Position from the best source: PAJ GPS → driver device → timetable estimate, with `position_source` — TC134
- [ ] Load from the best source: door counter → driver tap → rider taps, with `load_source` — TC130
- [ ] "Left full" report when a bus leaves a stop (door counter at seat count, or driver "full"), plus how many boarded at that stop where there is a door counter
- [ ] The driver's question: when the bus is full at a stop the screen asks "Did you have to turn people away?" by itself; Yes / No / Not sure; no answer = unknown — TC146
- [ ] Trip key (`departure_id`): identifies one trip of one bus; must also work for a spare's extra trip
- [ ] Publish the departure facts in the shape of `01`'s contract (`left_full`, `boarded`, `turned_people_away`, `departed_at`)
- [ ] Instruction handling: deliver only while stopped; never to a driver on a break; "OK, going" / "Can't"; no answer = "Can't" — TC127, TC128, TC129
- [ ] Manager controls are timing-only; a route change is rejected and logged — TC133

**Testing Session:** coverage; Hypothesis on the source-priority rules; mutation run.

**Status:** —

---

## Block 4 — Coordinator I: route totals, confirmed overflow, observation mode

**Gate — do not start this block until Samy has confirmed the spare-bus plan once more** (`01` "The trigger" and "What happens — three cases"). His own condition from 11 Nov. Blocks 1–3 don't depend on it.

- [ ] Samy's confirmation received

- [ ] Whole-route count: `route_overflow(seats_left, waiting_in_stop_order)` — TC111
- [ ] Confirmed overflow: bus left full AND people still waiting, known three ways (app count against door-counter boardings; "still waiting" taps; the driver's "Yes"). Largest source per departure, not the sum. A driver's "Yes" counts for both halves; a flagged count is never used for the automatic check; `max(way 1, way 2, threshold if driver said Yes)`; a driver's "No" does not cancel student taps; an overflow closes once a later bus has left that stop with room — TC112 (detection part), TC113, TC144, TC145, TC147, TC148, TC153 (no-spare half), TC155
- [ ] No action on a prediction while predicting ahead is off — TC114
- [ ] Flagged count with nothing confirming it → no overflow; confirmed by driver or door counter → believed — TC105, TC106
- [ ] Each overflow recorded once — TC118 (detection part)
- [ ] Rollout stage `observe`: log `SHADOW_WOULD_SEND` with the case it would have chosen; send nothing — TC124
- [ ] Rollout stage `alert`: alert the manager; send nothing to drivers
- [ ] Outside service hours → nothing — TC126

**Testing Session:** coverage; Hypothesis on `route_overflow` (people in = people boarded + people left; nobody boards a full bus); mutation run — this is the densest rule logic so far.

**Status:** —

---

## Block 5 — MQTT integration and fallback to the timetable

- [ ] Stand up Mosquitto for real, re-runnable (carried over from Block 0)
- [ ] Topics wired per `01` "Message topics", QoS levels correct
- [ ] Stop state → Coordinator → log, end to end
- [ ] Broker disconnect → every bus back on the timetable within 10 s; nothing pending — TC135

**Testing Session:** coverage on the MQTT bridge; disconnect and reconnect simulated in tests.

**Status:** —

---

## Block 6 — API and WebSocket

Endpoints per `03_DASHBOARD_AND_INTEGRATION.md`.

- [ ] `POST /api/demand` — server-side geofence check (coordinates used, then discarded), token check, flag check — TC104
- [ ] `POST /api/still-waiting`, `POST /api/crowd-report`
- [ ] `GET /api/trip-plan` (which bus, where to change), `GET /api/eta/...`, `GET /api/buses/{id}`
- [ ] Driver: `POST /api/driver/load`, `POST /api/driver/turned-away`, `POST /api/driver/ack`, `/ws/driver/{bus_id}`
- [ ] Manager: `GET/PUT /api/settings/extra-trips`, `POST /api/proposals/{id}/approve|skip`, `POST /api/override`
- [ ] `/ws/dashboard`, `/ws/app/...`
- [ ] Raw signals deleted after 2 hours; anonymous totals kept — TC139

**Testing Session:** coverage on the API layer; contract tests against the message shapes in `03`.

**Status:** —

---

## Block 7 — Simulator, injector and scenario library

- [ ] Injector publishes on the same interfaces real sources would use: bus positions, app signals, door counts, driver taps, "still waiting" taps, rider taps
- [ ] The simulated crowd is the truth; only a share of it uses the app (app share per stop is a scenario setting)
- [ ] Simulator takes a timetable file and a demand history as inputs
- [ ] Sim clock (`TICK_SECONDS`, `SPEED_MULTIPLIER`)
- [ ] Scenario library: normal weekday; first week of semester; exam week; big event; heavy rain; Friday gap, weekend, public holiday; a messy day (breakdown, jam on one route)
- [ ] Plays the observation months for the FYP (shadow mode over many simulated days)

**Testing Session:** coverage; check that no injector-specific branch has leaked into agent code.

**Status:** —

---

## Block 8 — Planning reports

- [ ] Anonymous totals per stop, route and time slot
- [ ] Per departure: load, people left behind, empty runs; per route: spacing, trends
- [ ] App share learned per stop (app users boarded ÷ door-counter boardings) — R12
- [ ] Suggested trips per hour with the working shown (riders per hour ÷ seats) — TC138
- [ ] Where the spare should wait at peak
- [ ] Observation report: "would have sent a spare N times; M were real" — TC140
- [ ] Export weekly and per semester

Which statistics and formats is still open with Samy — settle at the start of this block.

**Testing Session:** coverage; property tests on the totals (sums match the raw events they came from).

**Status:** —

---

## Block 9 — Coordinator II: the spare bus

- [ ] Spare pool from the fleet file; free / on a job / on a break
- [ ] Case 1: spare nearby → leaves between the full bus and the next scheduled bus; no other bus changes — TC112
- [ ] Case 2: spare further, next bus at the terminus → spare accepts first, then the next bus leaves early and the spare covers the original time — TC115
- [ ] Case 2 timing check: enough time left before proposing, and again before the pull-forward. **What happens when the time has run out is for Samy to decide at the confirmation gate.**
- [ ] Case 3: neither → nothing moves; alert; `NO_SPARE_AVAILABLE` — TC116
- [ ] Two routes at once → bigger left-behind crowd first — TC117
- [ ] Manager setting: Ask me first / Automatic / Off, and the no-answer rule — TC120–TC123
- [ ] Driver "Can't" → next spare, else alert — TC127
- [ ] Extra-bus announcement to the app and dashboard

**Testing Session:**
- [ ] Hypothesis `RuleBasedStateMachine` for the invariant: **one spare gets at most one job at a time, and each overflow gets at most one response** — TC118, TC119
- [ ] Property: no scheduled departure is ever removed or made later by an overflow response — TC125
- [ ] Flaky-test check — this is async, message-driven code
- [ ] Mutation run on the Coordinator

**Status:** —

---

## Block 10 — Holding

- [ ] Control points and peak periods in config
- [ ] Hold when too close behind the bus ahead; never longer than the longest hold — TC131
- [ ] No hold off-peak, away from a control point, or when the gap is fine — TC132
- [ ] No hold unless both buses' positions come from GPS — TC149
- [ ] Arrival times add the remaining hold; app and driver screen show it
- [ ] Manager release — TC133

**Testing Session:** coverage; Hypothesis on the hold length; mutation run.

**Status:** —

---

## Block 11 — Isolation Forest flag

- [ ] One model per stop, route, hour and weekday, trained on simulator history
- [ ] Wired as a second flagging layer beside Block 1 Task 7's rule; flags only
- [ ] Test that it cannot reach the Coordinator's decision except as a flag

**Testing Session:** coverage on the detector.

**Status:** —

---

## Block 12 — Student app and driver mode on the new flow

Replaces the old "prototype reconciliation" block. The prototypes in the repo still show the old flow and the compression demo (`10_PROTOTYPE_STATUS.md`).

- [ ] Destination picking and trip plan, including a change of bus
- [ ] Arrival time, how full the bus is, "approximate" label
- [ ] "Did you get on?" prompt on app open after the bus passed
- [ ] Extra-bus and holding notices; rider "how full" tap
- [ ] Driver mode: load taps, the "turned people away?" question when the bus is full, instruction screen with sound, "OK, going" / "Can't"
- [ ] Remove the compression demo. Searching for the word "compression" finds nothing in `src/` or `dashboard/` — search for the symptom: the hardcoded "14 min → 7 min" numbers and the scripted sequence that produces them
- [ ] The UI redesign itself is a design task to do with Samy first

**Testing Session:** `npm test`, `npm run build`, and a walkthrough on a real phone.

**Status:** —

---

## Block 13 — Dashboard rework

- [ ] Live view of stops and buses per route
- [ ] Alerts and one-tap approval; the extra-trips setting
- [ ] Decision log, including observation-mode entries
- [ ] Planning reports view
- [ ] Remove the compression replay scenario (same symptom search as Block 12)

**Testing Session:** `npm test`, `npm run build`.

**Status:** —

---

## Cross-reference: test case → block

| TC | Block |
|---|---|
| TC101, TC102, TC103, TC105, TC107, TC108, TC109, TC110, TC142, TC143, TC150, TC151, TC152, TC153, TC154 | 1 |
| TC136, TC137, TC141 | 2 |
| TC127, TC128, TC129, TC130, TC133, TC134, TC146 | 3 |
| TC106, TC111, TC113, TC114, TC124, TC126, TC144, TC145, TC147, TC148, TC153, TC155 | 4 |
| TC135 | 5 |
| TC104, TC139 | 6 |
| TC138, TC140 | 8 |
| TC112, TC115, TC116, TC117, TC118, TC119, TC120, TC121, TC122, TC123, TC125 | 9 |
| TC131, TC132, TC149 | 10 |

---

## Updating this file

At the end of a build session, tell Chatty what was done and any Status notes; Chatty returns the complete updated file and saves it to the Project. Coddy mirrors it into `docs_modules/`. No memory carries between chats — this file is the continuity.

Before ticking anything: confirm the commit on `origin` per module 13.
