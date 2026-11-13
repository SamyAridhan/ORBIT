# Module 03 — ORBIT Dashboard, API & System Integration
> Rewritten 13 Nov 2026 to the design locked on 11 Nov 2026.
> **Added:** the driver screen's messages, manager approval and the one setting, load reports
> (door counter, driver tap, rider tap), "still waiting", trip planning with transfers, planning
> reports. **Removed:** the early-departure log example, week-by-week build plans, the RFID
> comparison, route-changing overrides.
> Endpoint and message names are Chatty's draft; Coddy may adjust them at build time and should
> report changes so this file stays true.
> System name: ORBIT (On-Demand, Route-Based Intelligent Transit System).

---

## How the parts fit

```
Student app (PWA)  ─┐
Driver mode (PWA)  ─┼─ REST + WebSocket ─→  Backend API  ─→  MQTT  ─→  Stop Agents
Other apps (PAJ)   ─┘                           │                      Bus Agents
                                                │                      Coordinator
Door counters, GPS ─────────────────────────────┘                          │
                                                                           ↓
Fleet dashboard  ←──────────── WebSocket ←──────────────── state, alerts, log, reports
```

- The student app and the driver mode are the same web app with two modes (`08_STUDENT_APP_DESIGN.md`).
- `/api/demand` stays open to signals from other apps, so students using PAJ's app need not be invisible to ORBIT.
- If the backend or the broker is down, buses run the timetable. Nothing here is required for a bus to run.

---

## Backend API

### Students

| Endpoint | What it does |
|---|---|
| `GET /api/trip-plan?from={stop}&to={stop}` | Which bus to take, and where to change if needed. Returns one or more legs. |
| `POST /api/demand` | "I'm waiting for this bus." Carries the stop, route, destination, anonymous token and the phone's coordinates. The server checks the coordinates against the stop's geofence, then **throws them away**. Only the stop is stored. |
| `POST /api/still-waiting` | "The bus passed and I'm still here." Marks the student as left behind. |
| `POST /api/crowd-report` | Rider on board taps how full the bus is. |
| `GET /api/eta/{stop_id}/{corridor_id}` | Next arrivals: minutes, `approximate` flag, hold left, how full, whether it is an extra bus. |
| `WS /ws/app/{stop_id}/{corridor_id}` | Live arrival time, load, hold notice, extra-bus notice, "did you get on?" prompt. |

```python
@app.post("/api/demand")
async def receive_demand(signal: DemandSignal):
    stop = stops[signal.stop_id]
    if haversine(signal.lat, signal.lng, stop.lat, stop.lng) > stop.geofence_radius_m:
        return {"status": "ok"}          # not at the stop: not counted, and not told why
    # coordinates are not stored or logged past this line
    if await already_counted(signal.token, signal.stop_id, signal.corridor_id):
        return {"status": "ok"}          # one signal per token per stop per route per 30 min
    await publish("demand/signal", signal.without_coordinates())
    return {"status": "ok"}
```

### Drivers

| Endpoint | What it does |
|---|---|
| `POST /api/driver/load` | Driver taps about empty / half / full. |
| `POST /api/driver/turned-away` | The driver's answer to the prompted question "Did you have to turn people away?": `yes`, `no` or `not_sure`. No answer is treated as unknown. |
| `POST /api/driver/ack` | Driver answers an instruction: `ok` or `cant`. |
| `POST /api/driver/status` | On break / back from break. |
| `WS /ws/driver/{bus_id}` | Pushes instructions, and the turned-away question when the bus is full at a stop. |

### Bus data feeds

| Endpoint / topic | What it does |
|---|---|
| `buses/{bus_id}/position` (MQTT) | Position from PAJ GPS, the driver's device, or the injector. |
| `POST /api/buses/{bus_id}/door-count` | Boarded / alighted from a door counter. |

### Fleet manager

| Endpoint | What it does |
|---|---|
| `GET /api/settings/extra-trips`, `PUT …` | The one setting: `mode` (ask_first / automatic / off), `timeout_minutes`, `on_timeout` (send / skip). |
| `POST /api/proposals/{proposal_id}/approve`, `…/skip` | One-tap answer to an extra-trip proposal. |
| `POST /api/override` | Timing-only: `hold`, `release`, `cancel_extra_trip`, `return_to_schedule`. A request carrying a route change is refused. |
| `GET /api/reports/{name}` | Planning reports (below). |
| `WS /ws/dashboard` | Stop states, bus states, overflows, proposals, log entries. |

---

## Message shapes

**Stop state**
```json
{
  "type": "stop_state",
  "data": {
    "stop_id": "kdoj", "corridor_id": "E",
    "waiting_app": 9, "left_behind": 0, "left_behind_by_departure": {},
    "expected": 22, "estimated_total": null, "app_share": null,
    "level": "MEDIUM", "flagged": false,
    "minutes_since_last_bus": 4
  }
}
```
Published on `stops/{corridor_id}/{stop_id}/state`. `expected` is `null` at CP and Jalan Amal. `estimated_total` and `app_share` are `null` until the app share for that stop has been learned. `left_behind` is the sum of `left_behind_by_departure`, whose keys each identify one trip of one bus. `minutes_since_last_bus` is added at send time.

**Bus state**
```json
{
  "type": "bus_state",
  "data": {
    "bus_id": "E4", "role": "scheduled", "corridor_id": "E", "path_variant": "via_jalan_amal",
    "position": "kdse", "position_source": "driver_device", "next_stop": "cp",
    "load": 28, "seats": 28, "load_source": "door_counter", "left_full": true,
    "status": "COMMUTING", "hold_remaining_s": 0,
    "scheduled_departure": "07:30:00"
  }
}
```

**Overflow**
```json
{
  "type": "overflow",
  "data": {
    "overflow_id": "ovf_0412", "corridor_id": "E", "full_bus_id": "E4",
    "left_behind_by_stop": {"kdse": 7},
    "confirmed_by": ["door_counter", "still_waiting_taps"]
  }
}
```
`confirmed_by` lists what confirmed it: `door_counter` or `driver_full` (the bus left full), and `app_vs_door_count`, `still_waiting_taps` or `driver_yes` (people were left).

**Proposal (to the manager)**
```json
{
  "type": "proposal",
  "data": {
    "proposal_id": "prop_0098", "overflow_id": "ovf_0412", "case": 1,
    "spare_id": "S1",
    "reason": "7 left behind at KDSE on Bus E. The spare is at KDOJ.",
    "expires_at": "07:34:00"
  }
}
```

**Instruction (to a driver)**
```json
{
  "type": "instruction",
  "data": {
    "instruction_id": "ins_0231", "bus_id": "S1", "kind": "extra_trip",
    "text": "Extra trip — Bus E from KDOJ. Go now.",
    "corridor_id": "E", "depart_at": "07:32:00"
  }
}
```
`kind` is one of `extra_trip`, `leave_early`, `hold`, `release`, `return_to_schedule`.

**Log entry**
```json
{
  "type": "log_entry",
  "data": {
    "agent_id": "coordinator",
    "event": "EXTRA_TRIP_SENT",
    "message": "Spare S1 sent on Bus E from KDOJ at 07:32. 7 left behind at KDSE by E4.",
    "reason": {
      "bus_left_full": "door counter 28/28",
      "still_waiting": "7 taps at KDSE",
      "spare": "S1 at KDOJ, 0 min away",
      "next_scheduled": "E5 07:40",
      "manager": "approved 07:31"
    }
  }
}
```
Event names are listed in `01_AGENT_DESIGN.md`. In observation mode the same entry is written as `SHADOW_WOULD_SEND` and nothing is sent.

---

## Fleet dashboard

### Purpose
The fleet manager's tool: see, decide, and take evidence to a planning meeting. Not a student product.

### What it shows
1. **Live view.** Every stop per route (who's waiting, colour level, flagged counts marked, `expected` beside the real count) and every bus (where, how full, which source the load came from, holding or not, spare on standby or on a job).
2. **Alerts and approval.** A confirmed overflow appears with its numbers. In Ask-me-first mode it carries **Approve** and **Skip**, with the reason and a countdown. Also sent to the manager's phone.
3. **The one setting.** Extra trips: Ask me first / Send automatically and tell me / Off. If I don't answer within N minutes: Send anyway / Skip.
4. **Timing controls.** Hold, release, cancel an extra trip, return to the timetable.
5. **Decision log.** Every decision with its reason, including "would have sent" entries from observation mode and overflows nobody could answer.
6. **Planning reports.**

Colour levels (LOW / MEDIUM / HIGH / CRITICAL) are for the eye only. They trigger nothing.

### Planning reports
Ready-made, with proper charts and the working shown, exportable weekly and per semester. UTM makes the final call.

- Load per departure; departures that left people behind; empty runs
- Spacing between buses per route; trends over the semester
- Spare use: how often, where, and how many were really needed
- Observation report: "would have sent a spare 9 times; on 8 the bus really did leave people behind"
- **Suggested trips per hour** — riders per route per hour ÷ seats per bus (170 ÷ 28 ≈ 6 → a bus every 10 minutes). Demand that shows up most days goes into the timetable; occasional surges are left to the spare pool.
- **Where the spare should wait** at peak
- Before / after a timetable change

Which statistics and formats, exactly, is still open with Samy. AI commentary on top of the reports is a possible later layer, outside the decision path.

### Build order for the dashboard
Tables and log first (stops, buses, alerts, approval, log). Map second (Leaflet.js, bus markers per route, stop colours). Reports third. The existing dashboard prototype shows the old flow and is reworked later (`10_PROTOTYPE_STATUS.md`).

### Map settings (for the map stage)
```javascript
const UTM_CENTER = [1.5586, 103.6370];
const UTM_ZOOM = 16;

// Placeholder coordinates — check each against a map before use
const STOP_COORDS = {
    "kdoj": [1.5548, 103.6285], "klg": [1.5538, 103.6295], "kdse": [1.5530, 103.6305],
    "cp": [1.5590, 103.6370], "n24": [1.5600, 103.6395], "ktc": [1.5612, 103.6408],
    "cluster_t02": [1.5625, 103.6420], "cluster_t08": [1.5635, 103.6430],
    "kolej_perdana": [1.5560, 103.6250], "kolej_9_10": [1.5570, 103.6280],
    "ktr": [1.5510, 103.6340], "ktho": [1.5520, 103.6350], "ktdi": [1.5530, 103.6360],
    "jalan_amal": [1.5575, 103.6400]
};
```

---

## Backend folder layout

The repo already uses this layout under `backend/` (flat imports from `backend/`, no `__init__.py`). New files for the locked design are marked.

```
backend/
├── agents/
│   ├── stop_agent.py           # built (Tasks 1–3), being reworked
│   ├── bus_agent.py            # new
│   └── coordinator.py          # new
├── demand/                     # new — ORBIT's own schedule model (the `expected` number); not the simulator
├── simulation/
│   ├── campus_graph.py         # built (Bus E, N24 path). Real route data — due to move out of simulation/ in Block 2
│   ├── demand_engine.py        # new
│   ├── injector.py             # new
│   ├── scenarios.py            # new
│   └── simulation_runner.py    # new
├── api/
│   ├── main.py                 # skeleton built
│   ├── mqtt_bridge.py          # new
│   ├── eta.py                  # new
│   └── trip_plan.py            # new
├── reports/                    # new — planning reports
├── config/
│   ├── stops.json
│   ├── routes.json
│   ├── timetable_2026_sem1.json
│   ├── fleet.json
│   └── scenarios.json
├── tests/
└── requirements.txt
```

**`agents/` never imports from `simulation/`.** The simulator feeds the system through the same interfaces real sources use; agent code must not know it exists.

The student app lives in `src/` and the dashboard in `dashboard/` at the repo root (`10_PROTOTYPE_STATUS.md`). `docs_modules/` mirrors these context modules.

---

## Running locally

```bash
# Terminal 1: MQTT broker
mosquitto -v

# Terminal 2: backend API + agents
cd backend && uvicorn api.main:app --reload --port 8000

# Terminal 3: simulation
cd backend && python simulation/simulation_runner.py --scenario normal_weekday

# Terminal 4: student app / driver mode (dev server)
npm run dev
```
