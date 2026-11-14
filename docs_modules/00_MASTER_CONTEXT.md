# PSM Master Context — ORBIT
> **Load this file FIRST in every new chat session. It is the single source of truth.**
> Rewritten 13 Nov 2026 after the whole-system design review (17 Oct – 11 Nov 2026). The design
> Samy locked on 11 Nov is now written into every module. The decisions and their reasons are
> recorded in `ORBIT_DESIGN_REVIEW_OPEN_DECISIONS.md`; the real-world evidence is in
> `ORBIT_REAL_WORLD_PRECEDENTS.md`.
> Superseded: the July 2026 edition of this file (Hold + Early Departure, six-step Bus Agent
> hierarchy, "interchange stops never signal"). Do not bring those rules back.

---

## Phase status (read this first)

- **PSM1 is complete and submitted.** The thesis is not edited.
- **Now:** industrial training (Sept 2026 – Feb 2027). Development happens on weekends. PSM2 runs March – July 2027.
- **Build:** Block 0 is on `main` (`8b005cc`). **The build resumed on 13 Nov 2026.** Coddy synced `docs_modules/` and reworked the Stop Agent to the new design: Task 1 kept; Tasks 2R, 3R and 9 built and confirmed (`81b6e75` on `claude/funny-knuth-w6dibj`); Tasks 4, 5 and 6 built — the waiting count from app taps, the signal types with the lost-track rule, and what happens to the count when a bus leaves (`1d67a2e` confirmed; `03c0846` reported, pushed; 133 tests). Next: Block 1 Task 7.
- **Design:** locked 11 Nov 2026. Modules updated 13 Nov 2026.
- **13 Nov 2026, confirmed by Samy:** the small rules filled in while writing the modules (tracker 3.15), and the student adoption plan (below; tracker 3.14). New Project instructions are pasted in.
- **13 Nov 2026 (afternoon), refined with Samy after Coddy's sync report:** three ways to know people were left behind (the driver is asked, not expected to remember); a late "still waiting" tap always counts; holding needs real GPS (tracker 3.16–3.17).
- **Before Block 4** (the first block that builds overflow handling): Samy confirms the spare-bus plan once more — his own condition.

---

## How to work with Samy

- Plain words, one thing at a time, with a concrete example. He often comes to this tired.
- Never mark anything locked until he says so.
- He decides on his own. Do not suggest consulting Dr Sim or UTM Fleet about the design. Facts ORBIT can't know about UTM are **assumptions Samy sets** (listed below).
- Delivery: complete replacement files, not diffs.
- Chatty (this Project) holds the design context; Coddy (Claude Code) builds in the repo. They share no memory. Samy relays between them. See `13_GIT_PERSISTENCE_PROTOCOL.md` for what "done" means.

---

## What this project is

**System name:** ORBIT — On-Demand, Route-Based Intelligent Transit System
**Course:** SECJ3032/SECJ4013 (FYP1 → FYP2), UTM Skudai
**Track:** System Development (NOT research-based)
**Supervisor:** Dr Sim Hiew Moi (named researcher on UTM's PAJ-funded Smart Bus IoT project)

**Objective (Chatty's wording; Samy agreed with the framing, wording not yet confirmed):**
> ORBIT turns students' trip requests into a live picture of where people are waiting, and uses
> that picture to help UTM Fleet match buses to real demand — on the day, and when planning each
> semester's timetable.

**Three parts:**
- **Student side:** a campus bus navigation app — where am I going, which bus, when, will I fit. Being useful is what gets students to use it.
- **Demand sensing:** a by-product of students using the app, combined with door counters and driver taps.
- **Fleet side:** a live view, alerts, a spare bus sent where the crowd is, and planning reports.

**Value, ranked by how easy it is for UTM Fleet to accept:**
1. **Planning reports** — evidence per departure (people left behind, empty runs) for next semester's timetable. Changes nothing in daily operations.
2. **Live help** — a spare bus for a confirmed overflow, and alerts. The fleet manager stays in control.
3. **Automatic adjustments** — short holds to keep buses spaced. Small.

**Honest pitch:** ORBIT doesn't necessarily save money, and it can't create seats that don't exist. The claim is better service from the buses and drivers UTM already has — fewer empty runs, fewer students left behind, less driver fatigue — plus evidence of where the problems are.

**The real problem today (Oct 2026 timetable):** UTM already adds buses — Bus E went from 2 to 6, and E5/E6 are extra KDOJ-only buses on a fixed timetable. Fixed extras can't follow demand that moves from day to day. ORBIT makes the extras smart: they become a shared spare pool that goes where and when the crowd is.

---

## Design change log

### July 2026 — arrival compression removed (still in force)
Arrival compression (cutting dwell time at stops to arrive sooner) was a design error. It can save 5–15 seconds per stop, not minutes. It is not an intervention in ORBIT and must never return in code, tests, dashboard copy or app messages. The "14 min → 7 min" claim in the prototypes is not achievable and must not be reused. The submitted PSM1 thesis still describes compression; that document is not edited. See `05_GROUNDING_CHECKLIST.md` Trap 11.

### November 2026 — the redesign (locked 11 Nov)
A head-to-toe review found the July design assumed things it couldn't know (how full a bus is, what the driver is told, how many students use the app, GPS on Bus B/E/F), and that its interventions didn't fit how UTM's timetable now runs (a bus every 10 minutes at peak; buses get back to the terminus minutes before their next departure).

| Old rule (July 2026) | New rule (Nov 2026) |
|---|---|
| Bus Agent picks Hold or Early Departure for a busy stop | A **spare bus** adds capacity for a confirmed overflow. A **Coordinator** decides. Holding stays, but only to keep buses spaced. |
| Early departure: terminus only, gap ≥ 15 min, max 8 min, utility ≥ 0.6 | Removed as a queue response. The only early move left is the "pull-forward" (next bus a few minutes early) and only when a spare covers the original time. |
| Six-step Bus Agent checklist (route filter, 85% capacity, 12-min protected window, claim, intervention, overflow flag) | Removed. The overflow check is done per route by the Coordinator. |
| 12-minute "no changes before lectures" window | Removed. ORBIT never takes a departure away, so it isn't needed. |
| `NO_INTERVENTION_AVAILABLE` | Replaced by "no spare can make it → alert the manager and log it". |
| LOW / MEDIUM / HIGH / CRITICAL trigger broadcasts | Levels are only colours on the dashboard and app. Stops report all the time. |
| Queue = app count ÷ adoption rate; fall back to the schedule model below 30% | Removed as a trigger. ORBIT acts on a **confirmed** overflow. It learns the app share per stop during the observation months. |
| CP and Jalan Amal never signal | App signals there **count**. Only ORBIT's own schedule guesses for those two stops are ignored. |
| Strange counts are rejected | Strange counts are flagged and kept; believed if the driver or door counter agrees. |
| At most one bus claims a stop | One spare gets at most one job; each overflow gets at most one response. |
| Manager override can set a new route vector | Manager controls are timing-only. |
| Bus load comes from the app's manifest | Door counter → driver tap → rider taps. |
| ETA uses queue-adjusted edge weights | ETA uses plain travel times plus any hold. |

### 13 Nov 2026 — refinements (Samy, after Coddy's sync report)
- **Knowing people were left behind — three ways:** (1) automatic: app count against door-counter boardings on a bus that left full; (2) students' "still waiting" taps; (3) the driver, **asked** "Did you have to turn people away?" when the bus is full — Yes / No / Not sure. The old optional "left people behind" button is gone: where reporting depends on a driver remembering, it gets under-used.
- **A late "still waiting" tap always counts**, as one person. The one-signal-per-phone limit applies to "I'm waiting" only.
- **Left-behind is recorded against the bus that left them.** A tap after a bus that had room confirms nothing.
- **The smallest crowd worth an extra trip starts at 1** (placeholder).
- **No holding unless both buses' positions come from GPS.**
- **The "expected" number is ORBIT's own schedule model**, not the simulator's. Agent code never imports from the simulator.
- **Any tap from a person ORBIT has lost track of puts them back, as one person** (record expired, or "I'm waiting" tapped again).
- **Record against the last full bus; no spare once a bus with room has passed.** A bus is only blamed for someone already waiting when it left.
- **Accepted limit:** with no door counter, no app users and an unsure driver, ORBIT cannot know — it does nothing and the timetable runs. Real-life adoption is gradual, the way Uber's and Grab's was; the staged rollout exists for that.

---

## Principles — non-negotiable

1. **ORBIT never takes away a departure students are counting on.** A spare bus adds capacity.
2. **Buses stay on their routes.** No rerouting. A spare on an extra trip drives that route's normal path.
3. **Arrival compression is not a real intervention.** Never reintroduce it.
4. **Act on what's confirmed.** An extra trip needs a bus that really left full and people who are really still waiting — known from door counts against app counts, from students' "still waiting" taps, or from the driver answering "Yes, I turned people away". Predicting ahead is switched on only after the observation months show the predictions are right.
5. **The fleet manager stays in control.** One setting (ask first / automatic / off). Recommended default: ask first.
6. **The driver can always say "Can't".** Instructions only while stopped, never during a break. The driver is asked, never expected to remember. Data is for planning, not for judging drivers.
7. **The app is never required.** ORBIT works with zero app users because door counters report full buses and the driver is asked whether people were turned away. More app users makes it faster and better informed.
8. **ORBIT builds the decision logic and the interfaces. Anything physical is a stated assumption**, played by the simulator in the demo (table below).
9. **If ORBIT is down or wrong, buses run the timetable.**
10. **The decision path is rule-based.** The only AI in it is the Isolation Forest check that flags strange counts. No ML or neural networks anywhere else in the control loop.
11. **System Development track language.** No "hypothesis", "prove", statistical significance or "evaluate the algorithm". Requirements met, test cases passed.
12. **Design as if it will really be deployed.** The PSM2 scope question is deferred to report-writing time. These modules describe the full real system.
13. **Build core-first** (demand picture → dashboard → planning reports → spare bus → extras), so a smaller complete subset exists whenever PSM2 scope has to shrink.
14. **Design for growth.** Buses, drivers, the spare pool, the timetable and operating limits are data, not code.
15. **Agile only.** No Waterfall framing.

---

## How students come to use the app — locked 13 Nov 2026

Adoption is not forced and not guaranteed, so the design never depends on it (principle 7). The plan for students picking it up naturally:

1. Useful on its own from day one — arrival time and "will I fit".
2. No install, no login — a link.
3. At the point of need — QR codes at stops, notices in buses.
4. Win one route first — Bus E and KDOJ / KLG / KDSE.
5. Catch each new intake at orientation.
6. Make the benefit visible — "Extra Bus E at KDOJ, 7:32".
7. Official backing — UTM's transport page, college group chats.

Posters raise awareness but don't create the habit. No points, no gamifying, never required to board. Full text, evidence (Grab, Uber, OneBusAway, NUS, Rutgers, Minnesota, UConn, LSU) and source links: `08_STUDENT_APP_DESIGN.md`; notes in `06_RESEARCH_FINDINGS.md` Part 12.

---

## The three agents (full spec in `01_AGENT_DESIGN.md`)

| Agent | Job |
|---|---|
| **Stop Agent** | Keeps the count of who's waiting at its stop for each route. Reports all the time. |
| **Bus Agent** | Owns its own state (position, load, hold), the driver screen, and carrying out instructions. Spare buses are Bus Agents too. |
| **Coordinator** | Watches each route's total against the coming bus, owns the spare pool, decides which overflow gets the spare. |

---

## Deployment assumptions — Samy sets these

No outside consultation is planned. These are stated assumptions in the design. The simulator plays them.

- A shared spare pool exists (existing supplementary buses re-designated). A spare can wait at or near a busy terminus at peak.
- Any driver can drive any route. Standby time is separate from breaks.
- Buses have door counters, or drivers tap how full the bus is. When it is full, the driver answers one prompted question ("turned people away?").
- Drivers can receive instructions on a screen in the bus.
- Seats per bus: 28 (placeholder).
- Travel times and terminus waiting times in `02_GRAPH_AND_SIMULATION.md` are estimates.

**Built by ORBIT:** agents, backend, student app, driver mode, dashboard, reports, simulator.
**Assumed, not built:** door counters, driver device hardware, GPS hardware where PAJ doesn't cover, the spare pool itself.

**Data still missing (Samy can supply when convenient):** the other Bus D sheets (D1 shows CP → N24 → FKT(N29) → P19 → CP, which doesn't match the older KDOJ–KLG–KDSE–PKU–CP route); the Bus E2 weekend sheet; Bus E's return path from the Cluster.

---

## Placeholder values — not finalized

Configurable, to tune during development. Never present them as settled, especially in anything for PSM2.

- Seats per bus: 28.
- Hold: how close is "too close" to the bus ahead, and the longest hold (1–2 minutes is the idea).
- The manager's answer timeout (N minutes).
- How many left-behind people justify an extra trip (starts at 1).
- Pool size and where spares wait.
- The confidence needed before predicting ahead is switched on.
- All travel times in `02`.
- Demand level cut-offs (5 / 16 / 31) — display colours only.
- Strange-count rule: more than 3× the expected number, and at least a minimum count.
- How long ORBIT remembers a tap, and a departure: 30 minutes.

**Retired with the old design** (do not use): 85% capacity lock, 12-minute protected window, 15-minute early-departure gap, 8-minute early-departure cap, 5-minute minimum headway, 0.6 utility score, 30% adoption threshold, 1.5× missed-bus weight.

---

## PAJ relationship

Dr Sim's PAJ project (RM188,127, July 2026 – June 2028) delivers GPS tracking, ETA prediction, stop display screens and a passenger app. It does not sense student demand or support fleet decisions.

```
PAJ project:  "Where is the bus?"
ORBIT:        "Where are the people, and what should Fleet do about it?"
```

Complementary layers only — never competing, never "improving on". ORBIT is designed to consume PAJ's GPS feed.

- **Bus position, best source first:** PAJ GPS → the driver's device GPS → a timetable estimate (shown as "approximate").
- **Open risk:** PAJ Phase 1 covers only the KP–CP route, not Bus B/E/F. Raise this whenever GPS integration planning comes up.
- **A separate ORBIT student app is fine.** Students on PAJ's app are invisible to ORBIT, so `/api/demand` stays open to signals from other apps, and ORBIT's app has to be useful enough that students choose it.

Full detail → `09_SUPERVISOR_PROJECT_REFERENCE.md`.

---

## Requirements and use cases

The working list of what ORBIT must do is `14_SYSTEM_REQUIREMENTS.md`.

The PSM1 use case map (UC1–UC12) was accepted by the panel and is part of the submitted thesis. It is not edited, and it no longer matches the design (no Driver, Coordinator, approval, spare pool or reports). Module 14 maps each old use case to where it lives now. Redrawing the diagram for PSM2 is deferred to report-writing time.

---

## Tech stack

| Layer | Component | Technology | State |
|---|---|---|---|
| Student app | Frontend | React 18 + Vite PWA | Prototype built (old flow) |
| Student app | Stop detection | Browser Geolocation + server-side geofence check | Prototype only |
| Driver mode | Screen inside the PWA | React | Not built |
| Backend | Agents | Python 3.11+ (suite has passed on 3.11.18 and 3.12.10; no repo pin) | Stop Agent state, waiting count, signal types and departures built (Tasks 1, 2R, 3R, 9, 4, 5, 6) |
| Backend | Messaging | Eclipse Mosquitto (MQTT), paho-mqtt 2.1.0 | Dependency only |
| Backend | Route map | NetworkX 3.6.1 (DiGraph, Dijkstra) | Bus E, one path built |
| Backend | Strange-count check | scikit-learn Isolation Forest | Not built |
| Backend | API | FastAPI + WebSockets | Skeleton |
| Dashboard | Frontend | React 18 + Vite | Static-replay prototype (old flow) |
| Bus position | Sources | PAJ GPS → driver device → timetable estimate | Simulated |
| Database | Persistence | SQLite | Not built |
| Tests | Tooling | pytest, Hypothesis, MutPy or cosmic-ray | pytest and Hypothesis 6.170.15 in use (133 passing, one state-machine property test covering taps, departures, expiry and pruning) |

---

## Build order

Tracked task by task in `12_BUILD_MILESTONES.md` — never by date.

Priority: MAS backend (in progress) → student app and driver mode rebuilt on the new flow → dashboard rework. The two prototypes in the repo still show the old flow and the compression demo; see `10_PROTOTYPE_STATUS.md`.

Simulation scope: Bus B, E and F. Bus E is built first.

---

## Still open or deferred

- **PSM2 scope and problem statement** — deferred to report-writing time. The examiner advised a smaller PSM2 scope.
- **Planning analyst** — the core (ready-made statistical reports) is agreed in principle; which statistics and formats is open. A fuller "AI analyst" is a draft idea only, outside the control loop, left out of the PSM2 report.
- **Interface details** — hold notice, extra-bus notice, driver screen layout, approval notification, reports, the destination-picking redesign. Later stage.
- **Simulation scenario library** — see `02`.

---

## All project context modules

| File | Contents | Load when |
|---|---|---|
| `00_MASTER_CONTEXT.md` | This file | ALWAYS |
| `01_AGENT_DESIGN.md` | Stop Agent, Bus Agent, Coordinator; overflow rules; holding; message topics; test cases | Agent behaviour, rules, tests |
| `02_GRAPH_AND_SIMULATION.md` | Route map, travel times, ETA rule, timetable file, simulator, scenario library, observation mode | Routes, simulation, validation |
| `03_DASHBOARD_AND_INTEGRATION.md` | Dashboard, API, driver and manager messages, folder layout | Dashboard, API, integration |
| `05_GROUNDING_CHECKLIST.md` | Scope traps, track language, old-rule traps | Before any design or build decision |
| `06_RESEARCH_FINDINGS.md` | Citations, literature, real-world precedents and adoption evidence | Citations, PSM2 report |
| `07_UTM_BUS_ROUTES_REFERENCE.md` | UTM routes and the Oct 2026 timetable pattern | Route and stop questions |
| `08_STUDENT_APP_DESIGN.md` | Student app, driver mode, signal checks, privacy, the locked adoption plan with sources | App design |
| `09_SUPERVISOR_PROJECT_REFERENCE.md` | PAJ project detail and ORBIT's position | PAJ framing |
| `10_PROTOTYPE_STATUS.md` | State of the two built prototypes | Any frontend work |
| `11_TESTING_QA_JBAGENTIC.md` | Testing collaboration with Huiming, the one-job invariant | Test infrastructure |
| `12_BUILD_MILESTONES.md` | Task-based build tracker | **Every build session** |
| `13_GIT_PERSISTENCE_PROTOCOL.md` | Fetch at start, push at end, "reported" vs "confirmed" | Every build session |
| `14_SYSTEM_REQUIREMENTS.md` | What ORBIT must do, with IDs | Design, tests, PSM2 documents |
| `ORBIT_DESIGN_REVIEW_OPEN_DECISIONS.md` | The locked decisions and their reasons | "Why is it like this?" |
| `ORBIT_REAL_WORLD_PRECEDENTS.md` | Real transport systems that work this way | Justifying the design |
| `CODDY_CATCHUP_BRIEF.md` | The note that brings Claude Code up to date | When the build resumes |
| `ARCHIVE_PSM1_REPORT_AND_PANEL.md` | Report conventions, viva Q&A logic | PSM2 report or viva prep only |
| `README_MODULE_INDEX.md` | Map of the module set | Rarely |

**File locations:** in the repo's `docs_modules/` every file sits flat, so the modules name files without a folder. In this Project, the files Chatty created sit under `claude/` (`claude/14_SYSTEM_REQUIREMENTS.md`, `claude/ORBIT_DESIGN_REVIEW_OPEN_DECISIONS.md`, `claude/ORBIT_REAL_WORLD_PRECEDENTS.md`, `claude/CODDY_CATCHUP_BRIEF.md`) — same files.
