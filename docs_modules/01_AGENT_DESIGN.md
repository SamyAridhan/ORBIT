# Module 01 — ORBIT Agent Design Specification
> Rewritten 13 Nov 2026 to the design Samy locked on 11 Nov 2026
> (`claude/ORBIT_DESIGN_REVIEW_OPEN_DECISIONS.md`, section 3).
> **Replaced:** the six-step Bus Agent checklist, Hold-or-Early-Departure as a queue response, the
> 12-minute protected window, the 85% capacity lock, the utility score, adoption-rate scaling,
> "interchange stops never signal", and test cases TC01–TC17.
> **Still banned:** arrival compression (`05_GROUNDING_CHECKLIST.md` Trap 11).
> Words: "route" in this file is `corridor_id` in the code. A "spare" is a bus from the shared pool.
> Requirement IDs (S1, R6, N1 …) refer to `claude/14_SYSTEM_REQUIREMENTS.md`.
> The rules below are locked. The smaller rules Chatty filled in while writing this file (one tap =
> one person; spare's driver accepts first; no answer = "Can't"; a driver's "left people behind"
> covers both halves of the trigger) were confirmed by Samy on 13 Nov 2026. The names of topics,
> events and endpoints are proposals Coddy may adjust; numbers marked placeholder are set at build time.

---

## The idea in five lines

1. Stops count who is waiting for each route and report it all the time.
2. Buses report where they are and how full they are.
3. A Coordinator adds up each route and notices when a bus really leaves people behind.
4. If a spare bus can get there in time, it runs an extra trip. No scheduled bus loses its departure.
5. The fleet manager approves, the driver can refuse, and everything is logged for the planning reports.

**Principle: ORBIT never takes away a departure students are counting on. A spare bus adds capacity.**

---

## Agent overview

| Agent | How many | Job |
|---|---|---|
| Stop Agent | One per stop-and-route pair (e.g. KDOJ for Bus E) | Keeps the count of who's waiting. Reports all the time. |
| Bus Agent | One per bus, spares included | Owns its position, load and hold. Runs the driver screen. Carries out instructions. |
| Coordinator | One | Watches each route's total against the coming bus. Owns the spare pool. Decides which overflow gets the spare. |
| Demand engine | One (simulation only) | Plays the real crowd in the simulator, and gives the schedule-based "expected" number. Not an agent. |

**Why agents and not one program:** each stop and bus owns its own state and rules; a new bus is a new record, not new code; and if the Coordinator or the broker goes down, every bus simply runs its timetable.

**Simulation scope:** Bus B, E and F. Bus E is built first.

---

## Stop Agent

### Job
Keep the count of who is waiting at its stop for its route, and publish that state on every report tick — busy or quiet. (R1)

### What it counts

| Number | Where it comes from | Used for |
|---|---|---|
| `waiting_app` | Students who picked this route in the app at this stop and haven't boarded | Dashboard, route totals, planning |
| `left_behind` | Students who tapped "still waiting" after a bus left; plus a driver's "left people behind" tap | The overflow trigger |
| `expected` | The schedule-based estimate for this stop and time | Dashboard ("expected about 20"), the strange-count check. **Never a trigger.** |
| `estimated_total` | `waiting_app` scaled by the app share learned for this stop | Display and reports, once the share has been learned. Later, predicting ahead. |

A person is counted once. One anonymous token gives one accepted signal per stop, per route, per 30 minutes (`08_STUDENT_APP_DESIGN.md`).

### When a signal stops counting
- The student's bus passes and they don't say "still waiting" → assumed boarded, removed. (No response = boarded. Locked.)
- They tap "still waiting" → they stay in the count and are added to `left_behind`.
- The signal gets too old (build-time detail; 30 minutes is the starting value).

### Demand level — a colour, nothing more

| Level | Count | Meaning |
|---|---|---|
| LOW | under 5 | green |
| MEDIUM | 5–15 | yellow |
| HIGH | 16–30 | orange |
| CRITICAL | over 30 | red |

Levels are shown on the dashboard and in the app. **They trigger nothing.** The level uses the best count available: `estimated_total` once the app share is known, otherwise `waiting_app`. Cut-offs are placeholders.

### CP and Jalan Amal
- A student at CP or Jalan Amal who picks a bus in the app counts exactly like a student anywhere else. They show on the dashboard and in that route's total. (S6)
- The schedule-based `expected` number is **not** produced for these two stops. Seven routes pass through CP; with nobody using the app there, ORBIT can't tell who wants which bus, so it doesn't guess.
- **Naming:** "interchange node" means a stop shared by more than one route in the route map (cp, jalan_amal, n24, ktc). That is a routing fact. It has nothing to do with the old "never signal" rule, which is gone.

### Transfers
The app handles a change of bus (`08`). The Stop Agent only sees the result: the student is counted for Bus C at K9/10, and when they reach CP they are counted for Bus E at CP and removed from Bus C's count. One person is never counted at two stops at the same time.

### Strange counts
A count that looks implausible is **flagged, kept, and shown** on the dashboard. It does not trigger anything on its own. If a driver or a door counter agrees (the bus really did fill), ORBIT believes it. (R10)

- First layer (rule): flag when the count is more than three times `expected`.
- Second layer (AI, built later): an Isolation Forest per stop, route, hour and weekday. It flags; it never deletes and never decides.

```python
class DemandAnomalyDetector:
    """Flags a count as strange. Never drops it, never changes it."""
    def is_strange(self, stop_id, corridor_id, count, sim_time) -> bool:
        key = (stop_id, corridor_id, sim_time.hour, sim_time.weekday())
        if key not in self.models:
            return False            # no model yet -> the rule layer is the only check
        return self.models[key].predict([[count]])[0] == -1
```

**Scope boundary:** this detects odd input. It does not predict demand, does not choose a response, and is the only AI in the decision path. Reason for flag-not-drop: a filter built on a model goes blind on real unusual days (exams, events, rain).

### Learning the app share
During the observation months, ORBIT compares, per stop and route, how many app users boarded with how many people the door counter saw board. The ratio is the app share for that stop. It is stored as data and used only for `estimated_total` — and later for predicting ahead, if that is ever switched on. (R12)

### State
```python
stop_id: str
corridor_id: str
waiting_app: int
left_behind: int
expected: int | None          # None at CP and Jalan Amal
estimated_total: int | None   # None until the app share is learned
app_share: float | None
level: DemandLevel            # display only
flagged: bool
last_bus_visit_time: datetime
```

### Rules
1. Publish state on every report tick, whatever the level.
2. Count app signals at every stop, CP and Jalan Amal included.
3. Don't produce `expected` for CP or Jalan Amal.
4. Flag a strange count; never drop it.
5. After a bus leaves, move "still waiting" students into `left_behind`; drop the rest as boarded.
6. Never decide anything about buses. The Stop Agent only reports.

---

## Bus Agent

### Job
Own its own state, show the driver what to do, and carry out instructions. It does not decide extra trips — the Coordinator does. It does decide its own short hold. Spare buses are Bus Agents with `role = spare`.

### Where is the bus — best source first (R3)
1. PAJ GPS feed
2. GPS from the driver's device
3. Timetable estimate — shown everywhere as "approximate"

### How full is the bus — best source first (R2)
1. Door counter (APC), where the bus has one
2. Driver tap: about empty / half / full
3. Riders tapping how full it is in the app

The source is carried with the number (`load_source`) so the dashboard and reports can show how sure ORBIT is.

### "Left full"
When a bus leaves a stop, the Bus Agent reports whether it left full:
- door counter shows the load at the seat count, or
- the driver tapped "full", or
- the driver tapped "left people behind" (this covers both halves of the trigger — a driver only leaves people when the bus is full).

### Holding — to keep buses spaced (R9)
A bus that has caught up too close to the bus ahead on the same route waits a minute or two.

- Only at a control point (a terminus or a major stop, listed per route in config).
- Only at peak frequency.
- Based on the gap to the bus ahead — not on being ahead of the timetable.
- `hold = min(wanted_gap − actual_gap, longest_hold)`. Both numbers are placeholders.
- The driver screen shows "Hold 2 min". The app shows "holding 2 min" to people on board and people waiting. The arrival time adds the hold that is left.
- The manager can release a hold.

For the record: the review's view was that holding has small value on this network; Samy chose to include it. It has nothing to do with queues.

### Instructions
The Bus Agent receives instructions and shows them on the driver screen:

| Instruction | From | Driver sees |
|---|---|---|
| Extra trip (spare) | Coordinator | "Extra trip — Bus E from KDOJ. Go now." |
| Leave early (pull-forward) | Coordinator | "Leave at 7:35 (5 min early). A spare covers 7:40." |
| Hold | The bus's own rule | "Hold 2 min." |
| Release, cancel, return to schedule | Fleet manager | "Carry on as scheduled." |

Rules for every instruction (D2–D4, N6):
- Delivered only while the bus is stopped. If it is moving, the instruction waits.
- Never sent to a driver on a break.
- The driver answers **"OK, going"** or **"Can't"**. No answer within the time limit counts as "Can't" (build-time detail).
- "Can't" is final for that instruction. The Coordinator tries another spare or tells the manager.

### States
```
Scheduled bus:  IDLE (at terminus) → COMMUTING → BOARDING → COMMUTING → … → IDLE
                                         ↘ HOLDING (at a control point) ↗
Spare bus:      STANDBY (at its waiting spot) → on an extra trip (same states as above) → STANDBY
Any bus:        ON_BREAK, OFFLINE
```

### State
```python
bus_id: str
role: Literal["scheduled", "spare"]
corridor_id: str | None       # None for a spare on standby
path_variant: str | None      # e.g. Bus E "via_n24" or "via_jalan_amal"
position: str                 # last stop passed
position_source: Literal["paj_gps", "driver_device", "timetable"]
next_stop: str
load: int | None
load_source: Literal["door_counter", "driver_tap", "rider_taps"] | None
seats: int                    # 28 placeholder, from fleet data
status: BusStatus
hold_remaining_s: int
scheduled_departure: datetime | None
current_job_id: str | None    # spare only
```

### If the broker or the Coordinator is down
The bus runs its timetable. No instruction is left hanging. (N8)

---

## Coordinator

### Job
Watch each route's total against the coming bus, own the spare pool, and decide which overflow gets the spare. One Coordinator serves all routes because the pool is shared.

### The spare pool (stated assumption)
- UTM re-designates some of its existing supplementary buses as a shared pool. No new buses.
- A spare belongs to no route and can serve any route.
- At peak it waits where trouble is most likely (for example KDOJ in the morning, the Cluster in the late afternoon), chosen from the planning data. Like an ambulance: it waits where it is most likely needed and goes wherever it is called.
- Pool size, waiting spots and the drive time from each waiting spot to each route start are data in a fleet file.

### Counting the whole route (R4)
One stop looking fine doesn't mean the route is fine.

> 28 seats. 15 waiting at KDOJ, 10 at KLG, 10 at KDSE.
> KDOJ: 15 board, 13 seats left. KLG: 10 board, 3 seats left. KDSE: 3 board, **7 left behind.**

```python
def route_overflow(seats_left: int, waiting_in_stop_order: list[tuple[str, int]]):
    """Walk the route in stop order. Return who gets left, and where."""
    left = {}
    for stop_id, waiting in waiting_in_stop_order:
        boarding = min(waiting, seats_left)
        seats_left -= boarding
        if waiting > boarding:
            left[stop_id] = waiting - boarding
    return left
```
First version: nobody is assumed to get off before the last pickup stop. Refine with destination data later.

This number is shown on the dashboard and written to the log. **It does not send a bus by itself** — see the trigger.

### The trigger — confirmed first (R5, N5)

ORBIT acts on a **confirmed overflow**:

> a bus has really left full **and** people are really still waiting.

| Half | Evidence |
|---|---|
| The bus left full | Door counter at the seat count, or the driver tapped "full" |
| People are still waiting | Students tapped "still waiting", or the driver tapped "left people behind" |

A driver's "left people behind" tap counts for both halves. That is what makes ORBIT work with zero app users.

**Predicting ahead comes later.** Sending the spare *before* a bus fills, from app numbers alone, is switched on only after the observation months show the predictions are right. It is a config switch, off by default.

**How big is the crowd:** the larger of the "still waiting" taps and the app count still waiting on that route. A driver-only report with no numbers counts as the smallest crowd worth acting on (placeholder).

### What happens — three cases (R6)

1. **A spare is nearby.** It leaves **any time between the full bus and the next scheduled bus — the earlier the better.** No other bus changes its time.
   *The 7:30 leaves KDOJ full. The spare leaves about 7:32.*
2. **The spare is further away, and the next scheduled bus is already at the terminus.** The next bus leaves a few minutes early and the spare covers the original time.
   *The 7:40 leaves at 7:35. The spare arrives and leaves at 7:40.*
   Order matters: the spare's driver accepts **first**, and only then is the next bus told to leave early. A scheduled time is never left uncovered.
3. **Neither is possible.** Nothing moves. The manager gets an alert and the event is logged for the planning report (`NO_SPARE_AVAILABLE`).

An extra trip drives the route's normal path. It is not a reroute. (N2)

### Steps the Coordinator follows

```
Confirmed overflow on route R
  1. Already answered?                       → yes: stop. (Each overflow gets one response.)
  2. Count flagged as strange and nothing
     confirms it?                            → yes: stop, log.
  3. Rollout stage = observe?                → log SHADOW_WOULD_SEND, stop.
     Rollout stage = alert?                  → alert the manager, stop.
  4. Manager setting = Off?                  → log, stop.
  5. Pick a free spare (not on a job, driver not on a break, bus stopped).
       Can it reach the route's start before the next scheduled bus leaves?   → Case 1
       Else: is the next bus at the terminus, and can the spare be there by
       that bus's original time?                                              → Case 2
       Else                                                                   → Case 3
  6. Setting = Ask me first → send the proposal with its reason. Wait up to N minutes.
       Approve → continue.   Skip → log, stop.
       No answer → follow the "if I don't answer" setting (Send anyway / Skip).
     Setting = Automatic → continue, and tell the manager.
  7. Send the instruction to the spare's driver.
       "OK, going" → the spare is on the job.
       "Can't" or no answer → try the next free spare (step 5). None left → Case 3.
  8. Case 2 only: now tell the next scheduled bus to leave early.
       Its driver says "Can't" → nothing is pulled forward; release the spare; alert the manager.
  9. Announce in the app ("Extra Bus E at KDOJ, 7:32"). Show on the dashboard. Log.
 10. The trip ends → the spare goes back to its waiting spot → free again.
```

### Two routes need the spare at once (R7)
The bigger left-behind crowd goes first. The other route gets Case 3 unless another spare is free.

### The invariant (R8)
> **One spare gets at most one job at a time, and each overflow gets at most one response.**

This replaces the old "at most one bus claims a stop" claim-lock. It is the target of the property-based test agreed with Huiming (`11_TESTING_QA_JBAGENTIC.md`).

### When ORBIT does not act
- No spare can make it.
- The count is flagged as strange and nothing confirms it.
- The manager's setting is Off, or they tap Skip.
- ORBIT is in the observation stage.
- It is outside service hours (for example the Friday 12:40–14:00 gap).

Each of these is logged. For planning, an overflow nobody could answer is as useful as one that was answered.

### The manager's setting (M3, M4)
One setting. No per-bus or per-stop toggles.

- **Extra trips:** Ask me first / Send automatically and tell me / Off
- **If I don't answer within N minutes:** Send anyway / Skip

All three levels are built. Recommended default for real use: Ask me first. A proposal reads like:

> 7 left behind at KDSE on Bus E. The spare is at KDOJ. Send it? **[Approve] [Skip]**

### Manager controls are timing-only (M5)
Hold a bus, release a hold, cancel an extra trip, return a bus to the timetable. A message that tries to change a route is rejected and logged (`OVERRIDE_REJECTED`). There is no `new_route_vector`.

### Rollout stages (R11)
A deployment setting, not a manager toggle.

| Stage | Config value | What ORBIT does |
|---|---|---|
| 0 Observation | `observe` | Collects data. Decides what it would have done, logs it, does not act (**shadow mode**). Weekly report: "would have sent a spare 9 times; on 8 the bus really did leave people behind." |
| 1 Planning reports | `observe` | Same, plus the reports are used. |
| 2 Live alerts | `alert` | Tells the manager about confirmed overflows. Sends nothing to drivers. |
| 3 Instructions with approval | `act` + Ask me first | Full flow, the manager approves each one. |
| 4 Automatic | `act` + Automatic | Full flow, the manager is told. |

UTM gets value even if it only ever adopts stages 0–2. For the FYP, the simulator plays the observation months.

### Why a spare pool beats fixed extra buses
1. Demand moves from day to day; a fixed extra can't follow it.
2. Fewer buses cover more (risk pooling). Four routes that each overflow one day in four need four fixed extras; a pool of two covers roughly 95% of days. The gain is smaller right before 8:00 lectures, when several routes peak together.
3. A spare moves only when needed; fixed extra trips run whether anyone is waiting or not.
4. No new buses to buy.
5. Timetable for the predictable, spares for the surprises. Spare use is logged; a pattern that repeats becomes a permanent trip next semester. The live system reduces its own workload.
6. Good for drivers: fewer pointless runs, less fatigue.

Real systems that work this way: `claude/ORBIT_REAL_WORLD_PRECEDENTS.md`.

---

## Message topics (MQTT) — proposed names

Coddy may change names at build time; tell Chatty so this table stays true.

| Topic | Publisher | Subscriber | Main fields |
|---|---|---|---|
| `stops/{stop_instance}/state` | Stop Agent | Coordinator, dashboard | stop_id, corridor_id, waiting_app, left_behind, expected, estimated_total, level, flagged |
| `buses/{bus_id}/position` | GPS feed / driver device / injector | Bus Agent | lat, lng, timestamp, source |
| `buses/{bus_id}/load` | Door counter / driver tap / rider taps (via the API) | Bus Agent | load or level, source, left_people_behind |
| `buses/{bus_id}/state` | Bus Agent | Coordinator, dashboard, app backend, other Bus Agents on the route | bus_id, role, corridor_id, position, position_source, load, load_source, status, hold_remaining_s, left_full |
| `coordinator/overflow` | Coordinator | Dashboard | overflow_id, corridor_id, full_bus_id, left_behind_by_stop, confirmed_by |
| `coordinator/proposal` | Coordinator | Dashboard (manager) | proposal_id, overflow_id, case, spare_id, reason, expires_at |
| `admin/approval` | Dashboard | Coordinator | proposal_id, decision (approve / skip) |
| `buses/{bus_id}/instruction` | Coordinator, manager, own hold rule | Bus Agent → driver screen | instruction_id, type, text, depart_at |
| `buses/{bus_id}/ack` | Driver screen | Coordinator | instruction_id, answer (ok / cant) |
| `admin/override` | Dashboard | Bus Agent, Coordinator | bus_id, action (hold / release / cancel_extra_trip / return_to_schedule) |
| `demand/signal` | App backend | Stop Agents | stop_id, corridor_id, destination, token, signal_type (initial / still_waiting / transfer) |
| `system/log` | All agents | Dashboard, reports | agent_id, event, message, reason, timestamp |

**QoS 1** (must arrive): `demand/signal`, `coordinator/proposal`, `admin/approval`, `buses/+/instruction`, `buses/+/ack`, `admin/override`. Everything else QoS 0.

**Log events:** `OVERFLOW_CONFIRMED`, `OVERFLOW_PREDICTED` (display only), `EXTRA_TRIP_PROPOSED`, `EXTRA_TRIP_APPROVED`, `EXTRA_TRIP_SKIPPED`, `EXTRA_TRIP_SENT`, `PULL_FORWARD_SENT`, `NO_SPARE_AVAILABLE`, `DRIVER_DECLINED`, `SHADOW_WOULD_SEND`, `HOLD_STARTED`, `HOLD_RELEASED`, `COUNT_FLAGGED`, `OVERRIDE_REJECTED`, `FALLBACK_TO_TIMETABLE`.

---

## Black box test cases (new set — TC101 onward)

Numbered from 101 so they can't be confused with TC01–TC17 or with the PSM1 thesis test cases
(numbering confirmed by Samy, 13 Nov 2026). Derived from the locked design; each points at a
requirement in module 14. Wording can be sharpened as each block is built.

### Stop Agent
| TC | Input | Expected | Req |
|---|---|---|---|
| TC101 | 3 people waiting | Level LOW, and the state is still published | R1 |
| TC102 | Counts 4, 5, 15, 16, 30, 31 | LOW, MEDIUM, MEDIUM, HIGH, HIGH, CRITICAL. Negative count raises an error | R1 |
| TC103 | Same token signals twice within 30 min | Counted once | S4 |
| TC104 | Signal sent from outside the stop's geofence | Not counted; the app is not told why | S9 |
| TC105 | 40 signals at KDOJ on a quiet Saturday, expected 5 | Count kept, `flagged = true`, shown on the dashboard, nothing triggered | R10, N4 |
| TC106 | Same as TC105, and the driver taps "left people behind" | Believed; the overflow goes ahead | R10 |
| TC107 | Student at CP picks Bus E | Counted for Bus E at CP and in Bus E's route total | S6 |
| TC108 | CP with no app users | No `expected` number is published for CP or Jalan Amal | R1 |
| TC109 | Trip K9/10 → KDOJ (Bus C to CP, then Bus E) | Counted for Bus C at K9/10; on reaching CP, counted for Bus E at CP and removed from Bus C; never in both at once | S1, S6 |
| TC110 | Bus passes; one student taps "still waiting", one doesn't answer | First stays and adds to `left_behind`; second is removed as boarded | S5 |

### Coordinator — overflow
| TC | Input | Expected | Req |
|---|---|---|---|
| TC111 | 28 seats; 15 at KDOJ, 10 at KLG, 10 at KDSE | Whole-route count shows 7 left at KDSE; logged; no bus sent | R4, N5 |
| TC112 | 7:30 leaves full (door counter); 7 "still waiting"; spare at KDOJ | Spare leaves between 7:30 and 7:40; no other bus's time changes | R5, R6 |
| TC113 | Bus leaves full; nobody confirms anyone waiting | No extra trip; "left full" logged for planning | R5 |
| TC114 | App shows 40 waiting; the bus hasn't left yet; predicting ahead is off | No extra trip | N5 |
| TC115 | Spare can't reach before 7:40; the 7:40 bus is at the terminus | Spare driver accepts first; then the 7:40 leaves at 7:35; spare leaves at 7:40 | R6, N1 |
| TC116 | No spare can make it; next bus not at the terminus | Nothing moves; manager alerted; `NO_SPARE_AVAILABLE` logged | R6 |
| TC117 | Bus E leaves 7 behind and Bus B leaves 12 behind; one spare | Bus B gets the spare; Bus E gets an alert and a log entry | R7 |
| TC118 | Same overflow reported by the driver tap and by "still waiting" taps | Exactly one response | R8 |
| TC119 | A spare is already on a job; a second overflow arrives | That spare gets no second job | R8 |
| TC120 | Setting: Ask me first | Proposal with the reason shown; nothing moves until Approve | M3, M4 |
| TC121 | Ask me first; no answer for N minutes | "Send anyway" → sent. "Skip" → not sent, logged | M4 |
| TC122 | Setting: Automatic | Sent at once; the manager is told | M4 |
| TC123 | Setting: Off | Never sent; the overflow is still logged | M4 |
| TC124 | Rollout stage: observe | `SHADOW_WOULD_SEND` logged; no instruction leaves the Coordinator | R11 |
| TC125 | Any sequence of overflows and responses | No scheduled departure is removed or made later by an overflow response | N1 |
| TC126 | Confirmed overflow during the Friday 12:40–14:00 gap | No alert, no instruction | R15 |

### Bus Agent and driver
| TC | Input | Expected | Req |
|---|---|---|---|
| TC127 | Spare's driver taps "Can't" | Coordinator tries another spare; none → manager alert | D4 |
| TC128 | Instruction issued while the bus is moving | Delivered only once the bus has stopped | D3, N6 |
| TC129 | Driver is on a break | No instruction is sent to that bus | D3, N6 |
| TC130 | Bus with a door counter; bus without; bus with only rider taps | Load taken from the best source present; `load_source` says which | R2 |
| TC131 | Peak; bus reaches a control point too close behind the bus ahead | Holds, never longer than the longest hold; arrival times include the hold; app shows "holding" | R9, R13 |
| TC132 | Same bus off-peak, or not at a control point, or the gap is fine | No hold | R9 |
| TC133 | Manager releases a hold; manager sends a route change | Hold ends; the route change is rejected and logged | M5, N2 |
| TC134 | PAJ GPS present; only driver device; neither | Position from the best source; the timetable estimate is labelled "approximate" | R3 |
| TC135 | Broker disconnects | Every bus is back on the timetable within 10 s; nothing left pending | N8 |
| TC136 | Queue at a stop grows from 5 to 40 | The arrival time for that stop does not get shorter | R13 |
| TC137 | Bus E2 (via Jalan Amal) | Stop list and arrival times show Jalan Amal, not N24 | R13 |

### Planning and data
| TC | Input | Expected | Req |
|---|---|---|---|
| TC138 | 170 riders in an hour on a route, 28 seats | Report shows the working and suggests about 6 trips an hour (rounding is a setting) | M8 |
| TC139 | Raw signals older than 2 hours | Deleted; anonymous totals per stop, route and time slot remain, with no tokens | R14 |
| TC140 | A week in observation mode | Report shows how many times ORBIT would have sent a spare, and how many of those were real | R11 |
| TC141 | A new bus added to the fleet file | It appears as a Bus Agent with no code change | R15 |

### What happened to TC01–TC17

| Old | Now |
|---|---|
| TC01, TC11 (early departure accepted / rejected by gap) | Retired. Replaced by TC112, TC115, TC116 |
| TC02 (85% capacity lock), TC03 (12-min window), TC12 (route filter in the bus) | Retired with the six-step checklist |
| TC04 (hold vs manifest) | Retired. Holding is now TC131–TC132 |
| TC05 (only first bus claims) | Replaced by TC118, TC119 |
| TC06 (broker down) | Kept as TC135 |
| TC07 (queue 3 → no broadcast) | Changed: TC101 (level LOW, still reported) |
| TC08 (override sets route vector) | Replaced by TC133 (timing-only) |
| TC09 (RECALCULATING timeout) | Retired. A driver not answering is "Can't" (TC127) |
| TC10 (every stop visited ≤ 20 min) | Covered by TC125: ORBIT never makes the timetable worse |
| TC13, TC14 (adoption fallback, 12 ÷ 0.3 = 40) | Retired |
| TC15 (token rate limit) | Kept as TC103 |
| TC16 (plausibility rejects) | Changed: TC105, TC106 (flag, don't reject) |
| TC17 (`NO_INTERVENTION_AVAILABLE`) | Replaced by TC116 (`NO_SPARE_AVAILABLE`) |

---

## Common pitfalls

- **Bringing back an old rule.** Early departure for a queue, the 12-minute window, the 85% lock, `app_count / adoption`, "CP never signals", the utility score. All gone. See `05` Trap 12.
- **Sending a bus on a prediction.** The whole-route count is for display and logging until predicting ahead is switched on.
- **Moving a scheduled bus before the spare has accepted.** Never.
- **Letting a level trigger something.** Levels are colours.
- **Dropping a strange count.** Flag it and keep it.
- **Giving a spare two jobs, or answering one overflow twice.**
- **Putting a route field in a manager override.**
- **Reusing the routing "interchange nodes" list for anything about demand.**
- **Reintroducing arrival compression** in code, log text, dashboard copy or app messages ("bus sped up for you"). It is not a real lever.
