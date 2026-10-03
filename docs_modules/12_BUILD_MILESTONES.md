# Module 12 — ORBIT Build Milestones (Task-Based)
> New module, August 2026. Tracks implementation progress for the MAS backend build,
> organized by task/block completion — not by date or sprint week. Samy works weekends,
> irregularly, sometimes more/less time per session; this file is the persistent source
> of truth so any session can pick up exactly where the last one left off.
> Pattern: implementation tasks get ordinary unit tests as they're written (always).
> Dedicated "Testing Session" checkpoints (research + Hypothesis property tests +
> mutation testing per 11_TESTING_QA_JBAGENTIC.md) happen at the END of each block,
> not after every task — see rationale in that module.
> Load this at the start of every build session. Update and re-save at the end of every
> build session (complete file, not a diff — matches delivery preference).
> **Persistence/sync: "done" is defined by `13_GIT_PERSISTENCE_PROTOCOL.md` — a task is
> complete only when its commit is pushed to `origin` and re-fetchable by a fresh session,
> NOT when a hash appears in a report. Fetch origin at session start; push at session end.**

---

## How to Use This File

- Check off tasks (`[ ]` → `[x]`) as they're actually done and passing their cited test case.
- A box is only `[x]` when its commit is **confirmed on `origin`** (per `13_GIT_PERSISTENCE_PROTOCOL.md`):
  a hash in a Coddy report is "reported," not "confirmed," until a session has run
  `git fetch` + `git cat-file -t <hash>` and seen it on the working branch. Carry the
  branch name next to the hash in Status notes.
- A block is not "complete" until its Testing Session line is also checked — code that
  passes unit tests but hasn't had a mutation/property-based pass is "implemented," not "done."
- If a session gets interrupted mid-block, leave a one-line **Status** note under that block
  so the next session doesn't have to reconstruct context from scratch.
- Blocks are ordered by build priority (per `00_MASTER_CONTEXT.md`), but you don't have to
  do them strictly in order if a weekend's energy/mood points elsewhere — just don't start
  a later block's Testing Session before its own tasks are done.

---

## Working Branch (read before touching git)

Active development branch: **`claude/funny-knuth-w6dibj`** on `origin` (`github.com/SamyAridhan/ORBIT`).
All Block 0 work lives here, **not on `main`** — `main` is still at a pre-Block-0 commit (`b3d547b`).
A fresh session MUST `git fetch origin` and check out this branch before trusting any local
`git log`; a checkout of `main` will correctly show an empty `backend/` and is NOT evidence the
work is missing. See `13_GIT_PERSISTENCE_PROTOCOL.md` for why this matters (3 Oct 2026 incident).
Merge-to-`main` is a deliberate end-of-block decision, not yet done for Block 0.

---

## Progress Overview

| Block | Status |
|---|---|
| 0 — Environment & Corridor E Graph | Complete (confirmed on origin, `31507a9`) |
| 1 — Stop Agent (Corridor E) | Not started |
| 2 — Bus Agent: Constraint Hierarchy Steps 1–4 | Not started |
| 3 — Bus Agent: Intervention Selection (Step 5) + Overflow Flag (Step 6) | Not started |
| 4 — Claim-Lock Mechanism (cross-cutting) | Not started |
| 5 — MQTT Integration & Degradation | Not started |
| 6 — FastAPI Endpoints & WebSocket | Not started |
| 7 — Isolation Forest Signal Integrity | Not started |
| 8 — Virtual Injector (Simulation) | Not started |
| 9 — Prototype Reconciliation (compression removal) | Not started |
| 10 — Dashboard Rework | Not started |

---

## Block 0 — Environment & Corridor E Graph

Infra only — no rule logic yet, so no Testing Session needed for this block.

- [x] FastAPI skeleton running (`backend/api/main.py`, `uvicorn --reload`) — commit `3cfcf57`
- [ ] Mosquitto broker running locally, basic pub/sub smoke test — **see note below; intentionally left unchecked**
- [x] Corridor E graph built in NetworkX — nodes, directed edges, base travel times (`02_GRAPH_AND_SIMULATION.md`) — commits `b0b691d` + `fa3c144`, superseded by superset `139cd3b`
- [x] `get_eta()` Dijkstra function returns sane values for KDOJ→Cluster — `139cd3b`
- [x] Repo folder structure matches `03_DASHBOARD_AND_INTEGRATION.md`'s layout (backend/agents, simulation, api, config, tests scaffolded; context_modules_2 renamed to dashboard_context_modules; docs_modules/_retired created for superseded files)

> **Mosquitto box — unchecked on purpose (not an oversight).** An earlier session genuinely ran
> a Mosquitto pub/sub smoke test (broker + paho-mqtt round-trip) and the `paho-mqtt==2.1.0`
> dependency is committed (`832dea6`). However, the smoke test left **no persisted, re-runnable
> artifact** — the throwaway scripts were removed and no broker is installed in a fresh container.
> Real, re-runnable broker setup belongs to **Block 5 (MQTT Integration & Degradation)**, which is
> where the MQTT work is actually owned. So this box stays unchecked here and is tracked in Block 5
> rather than claimed as a persisted Block 0 deliverable. The dependency being in `requirements.txt`
> is the durable part that carried forward; the live broker is Block 5's to stand up for real.

**Testing Session:** — (skip; nothing rule-based to mutate yet)

**Status:** Block 0 COMPLETE and **confirmed on origin** (branch `claude/funny-knuth-w6dibj`, unified tip `31507a9`).

History on origin: `832dea6` (paho-mqtt dep) → `b0b691d` (graph build) → `fa3c144` (Corridor E correction, drop PKU, add get_eta) → `bb8adc7` (this file marked complete by earlier session) → `139cd3b` (superset graph + unified test suite) → `344db19` (uvloop Windows-safe fix) → `31507a9` (longer canonical module-02 prose). Clean fast-forward history, no force-push, origin's earlier commits byte-for-byte intact.

Verified state on the reconciled tip:
- Corridor E graph: 8 nodes / 7 directed edges, **no PKU** (Bus D stop), `kdse→cp=6` placeholder, `cluster_t06` deferred/provisional (T02→T08 direct).
- `get_eta` (from the actual graph, Python 3.12.10, networkx **3.6.1** pinned): `kdoj→cluster_t08 = 26`, `kdoj→cluster_t02 = 23`, reverse path = `inf`. Superset graph also defines real `update_edge_weights()` and a `NodeNotFound`-robust `get_eta` (returns `inf` for an absent node instead of raising).
- Unified test suite: **13 passed** (10 from origin's lineage + 3 unique), run from `backend/` with flat imports (`from simulation.campus_graph …`; no `__init__.py`, no `backend.` prefix — the repo's existing convention per `BLOCK_0_GUIDE.md`).
- `requirements.txt`: union — `paho-mqtt==2.1.0` AND `uvloop==0.22.1; sys_platform != "win32"` (the Windows-install fix) both present; `networkx`/`pytest` already pinned.

Environment notes (not committed — venv is gitignored): venv pinned to **Python 3.12.10** (moved off 3.14 for testing-tool wheel safety — MutPy/cosmic-ray/Hypothesis lag on bleeding-edge Python); networkx pinned to **3.6.1** to match origin's committed pin.

> **History note (3 Oct 2026 reconcile):** This block briefly had two parallel lineages after a
> session started from a stale, never-fetched local checkout, concluded the graph "never existed,"
> and rebuilt it. It had not — the original work was real and on the branch all along. Nothing was
> fabricated or lost; the two lineages were reconciled into `31507a9` (origin's trunk preserved,
> the rebuild's genuinely-unique extras — superset graph, uvloop fix, longer doc — grafted on top).
> The milestone file previously cited `fa3c144` as the graph tip; that commit is real but is now one
> step in the chain under the superset `139cd3b`. This is the incident that produced
> `13_GIT_PERSISTENCE_PROTOCOL.md` — read it to see why "done = pushed + re-fetchable."

Next: Block 1 (Stop Agent).

---

## Block 1 — Stop Agent (Corridor E subset: KDOJ, KDSE to start)

- [ ] Demand classification (LOW/MEDIUM/HIGH/CRITICAL thresholds) — TC07
- [ ] Broadcast-on-change / broadcast-every-tick logic per level
- [ ] `is_interchange` suppression — CP/Jalan Amal never broadcast dispatch
- [ ] Adoption-rate scaling (app_count / adoption) — TC14
- [ ] Graceful degradation to simulation engine below 30% adoption — TC13
- [ ] Session token rate limiting (one signal per stop/corridor/30 min) — TC15
- [ ] Plausibility filter (reject count > 3× expected) — TC16
- [ ] Claim-suppression (`is_claimed=True` blocks new broadcasts) + reset logic

**Testing Session:**
- [ ] Coverage check on Stop Agent module
- [ ] First Hypothesis property test — e.g. "classification level is monotonic in queue_count"
- [ ] Note down mutation testing tool choice (MutPy vs cosmic-ray) and first run result

**Status:** — Not started. Frozen pending Block 0 close-out + protocol doc commit (both completing this session). Tasks 6 (token rate limit) and 7 (plausibility filter) must satisfy the fuller `08_STUDENT_APP_DESIGN.md` spec, not just `01`'s summary (silent-ignore on duplicate, `{token}:{stop}:{corridor}` key, 30-min window reset on missed-bus; plausibility = rule-based `count > 3× expected`, flag+log, no hard-reject — Isolation Forest is Block 7, NOT here).

---

## Block 2 — Bus Agent: Constraint Hierarchy Steps 1–4

Build and test each step individually before moving to the next — don't write all four at once.

- [ ] Step 1: Corridor filter — TC12 (ignore signal from wrong corridor)
- [ ] Step 2: Capacity check — TC02 (ignore if load ≥ 85%)
- [ ] Step 3: Protected time check — TC03 (ignore within 12 min of lecture slot)
- [ ] Step 4: Claim check — TC05 (only first bus claims; second on same corridor ignores)
- [ ] RECALCULATING timeout guard (5s force-back-to-COMMUTING) — TC09

**Testing Session:**
- [ ] Coverage check across all four steps
- [ ] Hypothesis tests for each threshold boundary (e.g. capacity exactly at 85%, protected window edge)
- [ ] Mutation run — this is rule-dense logic, good early signal for whether the test suite actually catches broken thresholds

**Status:** —

---

## Block 3 — Bus Agent: Intervention Selection (Step 5) + Overflow Flag (Step 6)

**Reminder before starting this block:** exactly two interventions — Hold and Early Departure.
Arrival compression is not to be implemented under any circumstances (`05_GROUNDING_CHECKLIST.md` Trap 11).

- [ ] Hold branch: ahead-of-schedule detection, `hold_minutes` capped at 5, manifest-safety check — TC04
- [ ] Early Departure branch: headway gap ≥ 15 min required, reject below — TC11
- [ ] Early Departure: `calculate_early_departure()` capped at 8 min, utility ≥ 0.6 threshold
- [ ] No-intervention branch (COMMUTING, on-time/behind schedule) — TC17, logs `NO_INTERVENTION_AVAILABLE`
- [ ] Step 6: persistent CRITICAL (3+ broadcasts) → dashboard alert, "extra trip needed"

**Testing Session:**
- [ ] Coverage check on full Step 5/6 logic
- [ ] Hypothesis stateful/property tests on utility score behavior across the input space
- [ ] Mutation run — highest-value target in the whole agent, per Huiming's "deterministic branch-heavy rule logic" framing (`11_TESTING_QA_JBAGENTIC.md`)
- [ ] Explicit grep/search for "compression" anywhere in this block's code and tests — must be zero hits

**Status:** —

---

## Block 4 — Claim-Lock Mechanism (cross-cutting: Stop Agent + Bus Agent)

This is the concrete test target Huiming flagged directly — build it with the invariant in mind from the start, not after.

- [ ] MQTT `tasks/{stop_id}/claim` publish/subscribe implementation
- [ ] Race handling: two Bus Agents responding to the same broadcast — TC05 (only first claims)
- [ ] Claim reset after bus departs and queue drops below MEDIUM

**Testing Session:**
- [ ] Hypothesis `RuleBasedStateMachine` (or equivalent) test for the invariant:
      *"at most one Bus Agent may hold a claim for a given stop+corridor at any time;
      concurrent claim attempts resolve to exactly one winner, never both, never neither."*
- [ ] Flaky-test check — run repeatedly with randomized ordering, since this is exactly the
      kind of async/MQTT code where non-determinism hides (per `11_TESTING_QA_JBAGENTIC.md`)
- [ ] Mutation run on the claim-lock code specifically

**Status:** —

---

## Block 5 — MQTT Integration & Degradation

- [ ] Full topic schema wired up (`01_AGENT_DESIGN.md` MQTT table) — QoS levels correct
- [ ] Broker disconnect → all buses revert to fixed schedule within 10s — TC06
- [ ] Cross-agent message flow verified end-to-end (Stop Agent broadcast → Bus Agent receives → claims → logs)
- [ ] **Stand up Mosquitto broker for real, re-runnable** (carried over from Block 0 — the broker smoke test must become a persisted, re-runnable setup here, not a throwaway; `paho-mqtt==2.1.0` already in `requirements.txt`)

**Testing Session:**
- [ ] Coverage on the MQTT bridge module
- [ ] Disconnect/reconnect simulated in tests, not just manually

**Status:** —

---

## Block 6 — FastAPI Endpoints & WebSocket

- [ ] `/api/demand` (POST) — geofence check, token check, plausibility check wired to Stop Agent
- [ ] `/api/eta/{bus_id}/{stop_id}` (GET)
- [ ] `/api/capacity/{bus_id}` (GET)
- [ ] `/api/position/{bus_id}` (GET)
- [ ] `/ws/dashboard` — pushes bus_state, stop_state, log_entry messages
- [ ] `/ws/app/{stop_id}/{corridor_id}` — pushes eta/capacity/position updates

**Testing Session:**
- [ ] Coverage on API layer
- [ ] Contract tests against the JSON schemas in `03_DASHBOARD_AND_INTEGRATION.md`

**Status:** —

---

## Block 7 — Isolation Forest Signal Integrity

- [ ] Per-(stop, corridor, hour, weekday) model training pipeline
- [ ] Fallback hardcoded threshold (count > 90) when no trained model exists yet
- [ ] Wire into Stop Agent's plausibility check as a secondary layer alongside TC16's rule-based filter

**Testing Session:**
- [ ] Coverage on the anomaly detector module
- [ ] Confirm scope boundary holds: detects bad input only, doesn't influence routing/dispatch —
      write a test that asserts this isn't accidentally wired into intervention logic

**Status:** —

---

## Block 8 — Virtual Injector (Simulation)

- [ ] `inject_bus_position()` — publishes to same MQTT topic real GPS would use
- [ ] `inject_demand_signal()` — hits same API endpoint real students would hit
- [ ] `inject_boarding_outcome()` — configurable `board_rate`, missed-bus re-signal at 1.5× weight
- [ ] Sim clock (`TICK_SECONDS`, `SPEED_MULTIPLIER`) driving the injector on a loop
- [ ] Scenario presets wired (`normal_day`, `peak_morning`, `exam_week`, `low_demand`)

**Testing Session:**
- [ ] Coverage on injector module
- [ ] Verify system behaves identically whether data source is injector or (future) real feed —
      i.e. no injector-specific branching leaked into agent code

**Status:** —

---

## Block 9 — Prototype Reconciliation (Compression Removal)

Not new build — fixing the existing PWA + Dashboard prototypes per `10_PROTOTYPE_STATUS.md`.
Best tackled once Block 3 (Hold/Early Departure logic) is real, so the redesigned demo
scenario can be checked against actual agent behavior instead of invented numbers.

- [ ] Redesign PWA flagship demo scenario around Hold or Early Departure (not compression)
- [ ] Redesign Dashboard's 10-step replay scenario — same corrected scenario, kept consistent with PWA
- [ ] Search both repos for "compression" / "ARRIVAL_COMPRESSION" — zero remaining references
- [ ] Note: grepping for "compression" alone won't find the prototype behavior — the word doesn't appear in `src/` or `dashboard/` source code (confirmed Sept 2026). Search for the actual symptom instead: the hardcoded "14 min → 7 min" ETA numbers/strings and the demo scenario logic that produces them
- [ ] Update decision-log copy to use `HOLD_ACCEPTED` / `EARLY_DEPARTURE_ACCEPTED` / `NO_INTERVENTION_AVAILABLE`

**Testing Session:** — (prototype/demo content, not backend logic; existing `npm test`/`npm run build` validation applies instead)

**Status:** — Deferred by design until Block 3 is far enough along to ground the new scenario in real numbers.

---

## Block 10 — Dashboard Rework (broader polish)

Separate from Block 9's compression fix — this is the open-ended layout/visual-density rework
Samy flagged as "not happy with it yet," independent of the compression issue.

- [ ] Scope this properly in its own session once Block 9 is done (redesigning the scenario will likely touch layout anyway)
- [ ] (Sub-tasks TBD — deliberately not broken down yet, per `10_PROTOTYPE_STATUS.md`)

**Testing Session:** — TBD

**Status:** — Not scoped yet.

---

## Cross-Reference: Test Case Coverage Map

Quick lookup so you can confirm which TC a task is supposed to satisfy without re-opening `01_AGENT_DESIGN.md`.

| TC | Covered in Block |
|---|---|
| TC01, TC11 | Block 3 |
| TC02 | Block 2 |
| TC03 | Block 2 |
| TC04 | Block 3 |
| TC05 | Block 2, Block 4 |
| TC06 | Block 5 |
| TC07 | Block 1 |
| TC08 | Block 6 (admin override) |
| TC09 | Block 2 |
| TC10 | Block 8 (service guarantee, needs full sim) |
| TC12 | Block 2 |
| TC13 | Block 1 |
| TC14 | Block 1 |
| TC15 | Block 1 |
| TC16 | Block 1 |
| TC17 | Block 3 |

---

## Updating This File

At the end of a build session: tell me what got checked off and any Status notes, and I'll return
the complete updated file to save back into the project. At the start of a session: paste this file
back in (or just say which block you're resuming) and I'll pick up from there — no memory persists
between chats, so this file is the only continuity mechanism.

**Before marking anything `[x]`:** confirm the commit is on `origin` per `13_GIT_PERSISTENCE_PROTOCOL.md`
(fetch + `git cat-file -t <hash>`), not just reported in chat. A hash in a report is "reported";
a hash seen on origin by a later session is "confirmed." Only confirmed work is `[x]`.
