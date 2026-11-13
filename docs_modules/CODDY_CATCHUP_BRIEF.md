# Coddy catch-up brief — ORBIT, 13 Nov 2026
> From Chatty (design side), relayed by Samy. Paste this whole file to Claude Code at the start of
> the session that resumes the build. It is written to stand on its own.

Hi Coddy. You last heard from this side on 3 Oct 2026, after Block 1 Task 3 (`47262d8`), holding for a Task 4 go-ahead. **That go-ahead is not coming — the design changed.** Between 17 Oct and 11 Nov Samy ran a whole-system, real-world review of ORBIT and locked a new design. Every context module was rewritten on 13 Nov. Your `docs_modules/` and both `CLAUDE.md` files still describe the old design.

Please read this fully, do the sync steps, and **report back before writing any code.**

---

## 1. First, in this order

1. `git fetch origin --prune`. Check out `claude/funny-knuth-w6dibj`. Confirm `709e7c9`, `2ae4c93`, `47262d8` exist on origin (`git cat-file -t`, `git branch -a --contains`). Report the raw output. (Module 13 — the milestone boxes for Tasks 1–3 are still "reported", waiting for exactly this.)
2. Run the test suite from `backend/` and report the count. Expected: 57 passing (13 graph + 44 stop-agent).
3. Replace the contents of `docs_modules/` with the 13 Nov module set Samy gives you (18 files: `00`–`03`, `05`–`14`, `ARCHIVE`, `README`, and the two `ORBIT_…` notes). Move the old versions to `docs_modules/_retired/` or delete them — your call, say which. Don't edit the module text; if something in it looks wrong against the code, tell us.
4. Read `00_MASTER_CONTEXT.md`, `01_AGENT_DESIGN.md`, `12_BUILD_MILESTONES.md`, `14_SYSTEM_REQUIREMENTS.md` in full. Skim `02`, `03`, `05`.
5. Update `CLAUDE.md` (root and `backend/`) wherever they state old rules — the table in section 3 below is the checklist. Keep everything about repo conventions, commands and module 13 as it is.
6. Commit the docs sync as its own commit, push, and report: hash, branch, pushed yes/no.
7. Stop. Report back with the answers to section 6. No code yet.

Do not touch `src/`, `dashboard/`, `AGENTS.md`, `AGENTS_DASHBOARD.md`, `context_modules/`, `context_modules_2/` — the prototypes are not being edited yet. They now describe an old demo; that is known (`10_PROTOTYPE_STATUS.md`).

---

## 2. The new design in one page

**Principle: ORBIT never takes away a departure students are counting on. A spare bus adds capacity.**

- **Three agents.** Stop Agent keeps the count of who's waiting at its stop for each route and reports all the time. Bus Agent owns its own state (position, load, hold), the driver screen, and carrying out instructions — spare buses are Bus Agents too. A new **Coordinator** watches each route's total against the coming bus, owns the spare pool, and decides which overflow gets the spare.
- **The trigger is a confirmed overflow:** a bus really left full (door counter or driver tap) AND people are really still waiting ("still waiting" taps in the app, or the driver's "left people behind"). Not a prediction. Not a demand level.
- **Three cases:** spare nearby → it leaves between the full bus and the next scheduled bus; spare further away and the next bus is already at the terminus → the next bus leaves a few minutes early and the spare covers the original time (spare's driver accepts first); neither → nothing moves, alert the manager, log `NO_SPARE_AVAILABLE`.
- **Count the whole route, not one stop.** 28 seats; 15 at KDOJ, 10 at KLG, 10 at KDSE → 7 left at KDSE.
- **Fleet manager:** one setting (Ask me first / Automatic / Off + what to do on no answer). Timing-only controls.
- **Driver:** a driver-mode screen in the PWA; "OK, going" / "Can't"; instructions only while stopped, never on a break.
- **Holding** stays, only to keep buses spaced (too close behind the bus ahead → wait 1–2 min at a control point, at peak).
- **Observation mode:** the Coordinator decides, logs `SHADOW_WOULD_SEND`, and sends nothing.
- **The app is never required.** With zero app users, drivers and door counters still report full buses.
- **Physical things are assumptions the simulator plays:** door counters, driver devices, GPS, the spare pool.
- **Still banned:** arrival compression. No rerouting.

Full spec: `01_AGENT_DESIGN.md`. Requirements with IDs: `14_SYSTEM_REQUIREMENTS.md`. Why: `ORBIT_DESIGN_REVIEW_OPEN_DECISIONS.md`.

---

## 3. Old rule → new rule (use this to audit `CLAUDE.md` and your own assumptions)

| Old (what you were building to) | New |
|---|---|
| Bus Agent picks Hold or Early Departure for a busy stop | Spare bus for a confirmed overflow, decided by the Coordinator; Hold only for spacing |
| Early departure: terminus only, gap ≥ 15 min, max 8 min, utility ≥ 0.6 | Gone. Only the pull-forward remains, and only with a spare covering the original time |
| Six-step Bus Agent hierarchy; 85% capacity lock; 12-min protected window | Gone |
| `NO_INTERVENTION_AVAILABLE` | `NO_SPARE_AVAILABLE` |
| HIGH / CRITICAL broadcast every tick, MEDIUM on change, LOW silent | Stops report every tick at every level. Levels are display colours only |
| Claim-lock: at most one bus claims a stop; keepalive through the claim | Gone. Invariant is now: one spare gets at most one job; each overflow gets at most one response |
| `queue = app_count / adoption`; fall back to the schedule model below 30% | Gone as a trigger. App count is reported as is; app share is learned later from door counts |
| CP and Jalan Amal never signal | App signals there count. Only the schedule-based `expected` number is not produced for those two stops |
| Plausibility filter rejects a strange count | Flag it, keep it; believed if driver or door counter agrees |
| Missed-bus re-signal weighted 1.5× | One person is one person |
| Admin override carries `new_route_vector` | Timing-only: hold, release, cancel extra trip, return to schedule |
| Bus load from the app's manifest | Door counter → driver tap → rider taps, with `load_source` |
| ETA via queue-adjusted edge weights | Plain base travel times plus any hold |
| Test cases TC01–TC17 | TC101–TC141 in `01` (with a table saying what happened to each old one) |

---

## 4. What this means for the code you already built

Nothing is thrown away, and your work on Tasks 1–3 was correct to the spec you were given.

- **Task 1 — `classify_demand`, `DemandLevel` (`709e7c9`): stays as is.** Levels are now display only. The `ValueError` on negatives stays. The ordered `IntEnum` is still wanted for the monotonic property test.
- **Task 2 — `decide_broadcast` / `BroadcastDecision` (`2ae4c93`): rework (Task 2R).** The Stop Agent publishes its state on every report tick whatever the level. No priority flag, no keepalive, no change-detection gating. How much of the existing function survives is your call — if a much smaller function (or none) is cleaner, say so. The keepalive branch we deliberately kept for "Task 8" is no longer needed.
- **Task 3 — `evaluate_broadcast`, `is_interchange_stop`, `INTERCHANGE_STOP_IDS` (`47262d8`): rework (Task 3R).** The gate that silenced CP and Jalan Amal goes. What remains special about those two stops: no schedule-based `expected` number is produced for them. Your separation from `02`'s routing list was right and stays right — n24 and ktc are not special here.
- **`update_edge_weights()` in `campus_graph.py`:** must not feed arrival times any more. Remove it or leave it unused — your call, tell us which, and whether anything calls it today. `get_eta` should use `base_time`.
- **The graph:** Bus E needs its second path (CP → Jalan Amal → KTC for E2/E4/E6) and a return leg. That is Block 2, not now.

---

## 5. The new plan

`12_BUILD_MILESTONES.md` is fully replanned (Blocks 0–13). The order is core-first:

1. Block 1 — Stop Agent: Task 2R, Task 3R, then Tasks 4–9 (count from app signals, one signal per token, "still waiting" after the bus passes, strange-count flag, transfer hand-over, state message), then the Testing Session.
2. Block 2 — route data (both Bus E paths, timetable file, fleet file, ETA rule).
3. Block 3 — Bus Agent. Block 4 — Coordinator I (route totals, confirmed overflow, observation mode).
4. Then MQTT, API, simulator, planning reports; then the spare bus itself (Block 9), holding, Isolation Forest, and the frontends.

**Gate:** Block 4 onward (anything about overflow handling) needs Samy's explicit go-ahead first. Blocks 1–3 don't.

Working rules are unchanged: one task at a time, stop at each task's verification with real output, Samy relays it for review before the next. Fetch at session start, push at session end, name the branch and "pushed: yes/no" in every report (module 13). Ordinary unit tests with every task; the Testing Session (coverage, Hypothesis, mutation run, flaky check) at the end of the block.

**First task after the sync is confirmed: Block 1 Task 2R.** Wait for the go-ahead.

---

## 6. What we'd like back from you

1. Fetch output and whether `709e7c9`, `2ae4c93`, `47262d8` are confirmed on origin. Test count.
2. The docs-sync commit: hash, branch, pushed yes/no.
3. What `CLAUDE.md` (root and `backend/`) said that you changed — a short list is enough.
4. Anything in the new modules that conflicts with what the code actually does or with something you observed. Real output wins over our assumptions; we'd rather fix the module.
5. Your read on Task 2R and Task 3R: what you'd keep, what you'd delete, and any test you think should survive as is.
6. Is `update_edge_weights()` called anywhere?
7. Names: the topic, event and endpoint names in `01` and `03` are proposals. If the existing code or your judgment suggests better ones, say so before we build on them.
8. Anything you think this design gets wrong from the implementation side. You see things we can't.

Thanks — and sorry for the long silence. The review was worth it; it would have been a much more expensive change two blocks later.
