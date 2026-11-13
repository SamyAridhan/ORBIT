# Module 05 — Grounding Checklist & Scope Guard
> Rewritten 13 Nov 2026 to the design locked on 11 Nov 2026.
> Load this when direction feels uncertain, or before any design or build decision.
> **What changed:** Trap 11 (arrival compression) stays active. New Traps 12–16 guard against the
> July 2026 rules coming back. The old "6 objectives", feature stack and presentation checklist
> described Hold / Early Departure / claim-lock and are replaced.
> Traps 8–10 are kept as resolved history.

---

## The System Development track trap (read first)

**The trap:** framing the project as "comparing ORBIT against the fixed timetable to prove it performs better" makes it look research-based. The research track needs CGPA 3.30 and a different document structure.

| ❌ Research framing (avoid) | ✓ System Development framing (use) |
|---|---|
| "Evaluate ORBIT vs the fixed timetable" | "Validate system correctness under simulated demand" |
| "Prove ORBIT reduces waiting" | "Verify the system meets its acceptance criteria" |
| "Compare algorithmic efficiency" | "Test that the software behaves as specified" |
| "This approach is better because…" | "The system met / did not meet these acceptance criteria…" |
| "Hypothesis", "statistical significance" | "Requirement", "test case passed" |

Nothing changes in what gets built — only how it is described. The timetable-only vs ORBIT comparison still exists, as a **performance acceptance test**. The observation-mode "hit rate" is a system check ("did ORBIT's logged decision match what happened?"), not a research result.

---

## Sanity check (before every work session)

1. **Which requirement does this serve?** Name an ID from `claude/14_SYSTEM_REQUIREMENTS.md`. If you can't, stop.
2. **Is it one of the "never" lines (N1–N9)?** Then don't.
3. **Is it physical?** Door counters, driver devices, GPS hardware and the spare pool are assumptions the simulator plays. ORBIT builds logic and interfaces.
4. **Still System Development language?**
5. **Is it an old rule?** Check Trap 12.

---

## Traps

### RESOLVED — Trap 8: sequence diagram coverage
Confirmed correct in the submitted thesis (SD001 = UC2+UC5, SD002 = UC6+UC7+UC8; every use case has its own SRS sequence diagram). History only. The PSM2 documents will need new diagrams for the new design — at report-writing time.

### RESOLVED — Trap 9: PSM1 / PSM2 phase confusion
PSM1 is submitted. Now: internship, weekend development; PSM2 March–July 2027. See `00_MASTER_CONTEXT.md`.

### RESOLVED — Trap 10: "five-step" vs "six-step" hierarchy
Fixed in the submitted thesis. **The six-step Bus Agent hierarchy itself no longer exists** in the design (Trap 12). If "six-step" appears in new work, that is the old design leaking in.

### ACTIVE — Trap 11: arrival compression is not a real intervention
Removed July 2026. Cutting dwell time at a stop saves 5–15 seconds, not minutes.

| ❌ Wrong | ✅ Correct |
|---|---|
| Any intervention called "compression", "speed up", "bus sped up for you" | It doesn't exist. Capacity is added by a spare bus; spacing is kept by a short hold |
| "ETA improved from 14 to 7 minutes" | Not achievable; never reuse. The prototypes still contain it (`10_PROTOTYPE_STATUS.md`) |
| `ARRIVAL_COMPRESSION_ACCEPTED` in a log | Use the event names in `01_AGENT_DESIGN.md` |
| Treating the thesis's compression test case as valid going forward | The thesis is not edited; the design has moved on |

Searching for the word "compression" won't find the prototype behaviour — it isn't in `src/` or `dashboard/`. Search for the symptom: the "14 min → 7 min" numbers and the scripted sequence behind them.

### ACTIVE — Trap 12: the July 2026 rules are gone
The design was replaced on 11 Nov 2026. These must not come back in code, tests, docs, dashboard copy or app messages:

| ❌ Old rule | ✅ Now |
|---|---|
| "Timing adjustment only — Hold or Early Departure" for a busy stop | A spare bus for a confirmed overflow; a short hold only to keep buses spaced |
| Early departure limits (terminus only, gap ≥ 15 min, max 8 min, utility ≥ 0.6) | No early departure for a queue. The only early move is the pull-forward, and only with a spare covering the original time |
| Six-step Bus Agent checklist; 85% capacity lock; 12-minute protected window | Removed. The Coordinator checks each route |
| `NO_INTERVENTION_AVAILABLE` | `NO_SPARE_AVAILABLE` — alert the manager and log it |
| `queue = app_count / adoption`; fall back below 30% adoption | Removed. Act on a confirmed overflow; learn the app share during observation |
| HIGH / CRITICAL triggers a broadcast; LOW stays silent | Levels are colours. Stops report all the time |
| "CP and Jalan Amal never signal. Ever." | App signals there count. Only ORBIT's own schedule guesses for those two stops are ignored |
| Plausibility filter rejects a strange count | Flag it, keep it, believe it if the driver or door counter agrees |
| "At most one bus claims a stop" | One spare, at most one job; one overflow, at most one response |
| Manager override sets a new route | Manager controls are timing-only |
| 1.5× missed-bus weight | One person counts as one person |
| ETA from queue-adjusted weights | Plain travel time plus any hold |

### ACTIVE — Trap 13: never take a departure away
Any idea that makes a scheduled bus leave earlier without cover, leave later to wait for a queue, skip a stop, or swap routes breaks the first principle. If a "clever" response moves a scheduled bus, check that a spare covers the original time and that the spare's driver accepted first.

### ACTIVE — Trap 14: acting on a guess
The whole-route count and app numbers are for display, logging and reports. An extra trip needs a bus that really left full and people really still waiting. Predicting ahead is a switch that stays off until the observation data earns it. A flagged count never acts alone.

### ACTIVE — Trap 15: assumed is not built, and not promised
- Door counters, driver devices, GPS coverage on Bus B/E/F and the spare pool are **assumptions**. Say so wherever they matter.
- Placeholder numbers (28 seats, hold lengths, timeouts, travel times, level cut-offs) are never presented as settled.
- The honest pitch: better service from the buses UTM already has, and evidence. Not "saves money", not "eliminates waiting". ORBIT can't create seats.
- PAJ Phase 1 covers only KP–CP. Don't write as if PAJ's GPS already covers Bus E.

### ACTIVE — Trap 16: PSM2 scope is not the design's scope
- These modules describe the full real system, designed as if it will be deployed.
- What goes into the PSM2 report is a separate, deferred decision (the examiner advised a smaller scope). Don't shrink the design to fit a report, and don't promise the full design in a report.
- The decision path stays rule-based. The planning analyst's "AI commentary" idea is a draft, outside the control loop, left out of the PSM2 report unless Samy says otherwise.
- The submitted thesis and the prototypes are not edited from here. Only context modules, and backend code through Coddy.

---

## Scope creep red flags

| Suggestion | Why it's out |
|---|---|
| "Reroute a bus to the busy stop" / "send Bus B to help Bus E's route mid-trip" | No rerouting. Only a spare runs an extra trip, on the route's normal path |
| "Let the agents learn from experience (ML / RL)" | The decision path is rule-based |
| "Use an LLM inside the agents" | Non-deterministic, untestable, and off-track |
| "Predict demand with a model and dispatch on it" | Trap 14 |
| "Require login / myUTM to use the app" | Kills adoption. Anonymous by design; myUTM is future work |
| "Make students book a seat" | A different system |
| "Per-stop, per-bus settings for the manager" | One simple setting. Samy rejected the complicated version |
| "Build the door counter / driver tablet hardware" | Assumed, simulated |
| "Add real-time traffic data" | Not needed on a closed campus |
| "Score drivers on their taps or refusals" | ORBIT's data is for planning, not for judging drivers |

---

## Build priority (core-first)

Stop when time runs out; everything above the line you stopped at is a complete system.

1. Stop Agent — the count of who's waiting, per route, reported all the time
2. Route data, timetable and fleet files; arrival times
3. Bus Agent — position, load, driver answers
4. Coordinator I — whole-route count, confirmed overflow, observation mode
5. MQTT, API, live dashboard tables and log
6. Simulator and scenario library
7. Planning reports
8. Coordinator II — the spare bus, approval, driver instructions
9. Holding
10. Isolation Forest flag
11. Student app and driver mode on the new flow; dashboard rework and map

Task detail: `12_BUILD_MILESTONES.md`.

---

## Common ways this project goes wrong

- **Polishing the dashboard before the agents work.** Agents → integration → dashboard.
- **Making the crowd model clever.** It needs to produce plausible crowds that create interesting situations. Nothing more.
- **Fussing over travel times.** They are config. Estimate, move on, tune later.
- **Marking something decided before Samy says so.** Definitive beats fast.
- **Trusting a hash in a report.** "Reported" is not "confirmed" until fetched from origin (`13_GIT_PERSISTENCE_PROTOCOL.md`).
- **Old context leaking in.** An older chat, the thesis, `CLAUDE.md` in the repo or the prototypes may still state July 2026 rules. The modules dated 13 Nov 2026 win.

---

## What a good demo looks like

1. A morning peak runs in the simulator. The dashboard shows who is waiting per route.
2. A Bus E leaves KDOJ full. Seven students at KDSE tap "still waiting".
3. The manager's phone shows: "7 left behind at KDSE. The spare is at KDOJ. Send it?" — Approve.
4. The spare's driver screen pings: "Extra trip — Bus E from KDOJ." — "OK, going".
5. The app announces "Extra Bus E at KDOJ, 7:32". No scheduled bus changed its time.
6. Show the same morning with the setting on Automatic, and one where the driver taps "Can't".
7. Show the observation report and a planning report with suggested trips per hour.
8. State one limit plainly: when no spare can make it, ORBIT moves nothing — it alerts and logs.
