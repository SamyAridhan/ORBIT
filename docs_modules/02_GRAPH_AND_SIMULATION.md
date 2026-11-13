# Module 02 — ORBIT Route Map, Timetable Data & Simulation
> Rewritten 13 Nov 2026 to the design locked on 11 Nov 2026.
> **Changed:** arrival times no longer use queue-adjusted weights; Bus E has two paths; the
> timetable, the buses and the spare pool are data files; the injector also feeds door counts and
> driver taps; the four scenario presets grow into a scenario library; the simulator plays the
> observation months. The "verify with Dr Sim / UTM Fleet" notes are gone — unknowns are
> assumptions Samy sets (`00_MASTER_CONTEXT.md`).
> System name: ORBIT (On-Demand, Route-Based Intelligent Transit System).

---

## Route map (campus graph)

### What it is
A directed, weighted graph of UTM Skudai's shuttle roads. Directed because some campus roads are one-way. Each edge carries a base travel time in minutes.

The map is a set of route subgraphs, not one mesh. A Bus E bus only ever drives Bus E's path. **No rerouting.** A spare on an extra trip for Bus E drives Bus E's normal path.

```python
import networkx as nx
G = nx.DiGraph()  # DIRECTED — not Graph()
```

### Stops per route

```python
# Bus B: KP ↔ K9/10 ↔ Cluster
B_STOPS = ["kolej_perdana", "kolej_9_10", "cluster_t02", "cluster_t08"]

# Bus C: K9/10 ↔ KTC ↔ CP ↔ Jln Amal
C_STOPS = ["kolej_9_10", "ktc", "cp", "jalan_amal"]

# Bus E: KDOJ / KLG / KDSE → Cluster. TWO PATHS (Oct 2026 driver sheets):
#   E1, E3, E5:  … CP → N24 → KTC → Cluster
#   E2, E4, E6:  … CP → Jalan Amal (D05) → KTC → Cluster
# E5 and E6 are KDOJ-only supplementary buses.
E_STOPS_VIA_N24        = ["kdoj", "klg", "kdse", "cp", "n24", "ktc",
                          "cluster_t02", "cluster_t08"]
E_STOPS_VIA_JALAN_AMAL = ["kdoj", "klg", "kdse", "cp", "jalan_amal", "ktc",
                          "cluster_t02", "cluster_t08"]

# Bus F: KTR → KTHO → KTDI → Jln Amal → CP
F_STOPS = ["ktr", "ktho", "ktdi", "jalan_amal", "cp"]

# Bus G: KTR/KTHO/KTDI → N24 → FKT (N29) → P19 → CP
G_STOPS = ["ktr", "ktho", "ktdi", "n24", "fkt_n29", "p19", "cp"]

# Shared by more than one route. A ROUTING fact only.
INTERCHANGE_NODES = ["cp", "jalan_amal", "n24", "ktc"]
```

**Bus D is not modelled yet.** The older reference had D as KDOJ – KLG – KDSE – PKU – CP – Jln Amal. The Oct 2026 D1 sheet shows CP → N24 → FKT (N29) → P19 → CP. The other D sheets are missing. PKU is not a Bus E stop either way.

**"Interchange node" is a routing word.** It means a stop that sits on more than one route's path. It says nothing about demand. The old rule that CP and Jalan Amal "never signal" is gone (`01_AGENT_DESIGN.md`); do not reuse this list for anything about counting people.

### Base travel times (all estimates — placeholders)

**Bus E, outbound:**

| Segment | Minutes | Path |
|---|---|---|
| KDOJ → KLG | 3 | both |
| KLG → KDSE | 3 | both |
| KDSE → CP | 6 | both |
| CP → N24 | 4 | via N24 |
| N24 → KTC | 3 | via N24 |
| CP → Jalan Amal | 4 | via Jalan Amal |
| Jalan Amal → KTC | 4 | via Jalan Amal |
| KTC → Cluster T02 | 4 | both |
| Cluster T02 → T08 | 3 | both |

- Via N24: 3+3+6+4+3+4 = **23 min** to T02, **26 min** to T08. This is what Block 0 built.
- Via Jalan Amal: 3+3+6+4+4+4 = 24 min to T02 (placeholder; not yet in the graph).
- Timetable check: each Bus E leaves KDOJ and leaves Cluster T02 30 minutes later. 23–26 minutes of driving plus a few minutes' wait fits. The placeholders look right.
- **Return leg (Cluster → KDOJ) is not in the graph.** Each bus runs a 60-minute cycle, so the simulator needs it. Until Samy supplies the stop order, assume the outbound path in reverse with the same times.
- `cluster_t06` is left out (T02 → T08 direct).

**Bus B:**

| Segment | Minutes |
|---|---|
| KP → K9/10 | 5 |
| K9/10 → Cluster T02 | 7 |
| Cluster T08 → K9/10 | 7 |
| K9/10 → KP | 5 |

**Bus F:**

| Segment | Minutes |
|---|---|
| KTR → KTHO | 4 |
| KTHO → KTDI | 3 |
| KTDI → Jalan Amal | 5 |
| Jalan Amal → CP | 4 |

### Arrival times (ETA) — the rule

> **An arrival time is plain travel time, plus any hold that is left. Nothing else.**

1. Where PAJ's own ETA exists, use it.
2. Otherwise: sum the base travel times from the bus's position to the stop along its path, and add `hold_remaining`.
3. If the position is only a timetable estimate, label the result "approximate".

```python
def get_eta(G: nx.DiGraph, source: str, target: str) -> float:
    """Minutes of plain travel time. Uses base_time, never a queue-adjusted weight."""
    try:
        return nx.dijkstra_path_length(G, source, target, weight="base_time")
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        return float("inf")
```

**Removed:** the old edge-weight formula `base × (1 + 1/(queue + 1))`. It made a busy stop look closer, which is wrong for an arrival time, and its original purpose (choosing where a bus should go) doesn't exist in a no-rerouting system. The code from Block 0 still has `update_edge_weights()`; it must not feed arrival times (Block 2 in `12_BUILD_MILESTONES.md`).

---

## Data files — buses, timetable and limits are data, not code

Adding a bus is adding a record. Changing the timetable for a new semester is swapping a file.

**Timetable (one file per semester):**
```json
{
  "effective_from": "2026-10-12",
  "service_days": {"weekday": ["mon","tue","wed","thu","fri"], "weekend": ["sat","sun"]},
  "no_service": [{"days": ["fri"], "from": "12:40", "to": "14:00"}],
  "buses": {
    "E1": {"corridor_id": "E", "path_variant": "via_n24",
           "weekday_departures": {"kdoj": ["07:00","08:00","09:00","11:00"]}},
    "E2": {"corridor_id": "E", "path_variant": "via_jalan_amal",
           "weekday_departures": {"kdoj": ["07:10","08:10","09:10","11:15"]}}
  }
}
```

**Fleet (buses, drivers, the spare pool):**
```json
{
  "seats_default": 28,
  "buses": [
    {"bus_id": "E1", "role": "scheduled", "corridor_id": "E", "has_door_counter": true},
    {"bus_id": "S1", "role": "spare", "has_door_counter": false,
     "waiting_spots": [{"period": "morning_peak", "stop": "kdoj"},
                       {"period": "evening_peak", "stop": "cluster_t02"}]}
  ],
  "drive_minutes_to_route_start": {"kdoj": {"E": 0, "B": 9, "F": 8}},
  "control_points": {"E": ["kdoj", "cluster_t02"]},
  "peak_periods": [{"from": "07:00", "to": "09:30"}, {"from": "16:30", "to": "18:15"}]
}
```
Every number in these examples is a placeholder. The real timetable pattern is in `07_UTM_BUS_ROUTES_REFERENCE.md`.

**Operating limits are data too:** number of buses, driver hours, the Friday prayer gap, route paths.

---

## The simulator

### Core principle — software in the loop

The system is fully real. All agent code, the Coordinator, the API, the app and the dashboard run exactly as they would in use. The only simulated part is the **outside world**: where buses are, how many people are really at each stop, what door counters read, what drivers and students tap. A virtual injector feeds these in through the same interfaces real sources would use. ORBIT cannot tell the difference.

The simulator also plays everything ORBIT assumes but doesn't build: door counters, the driver's device, GPS, and the spare pool (`00` "Deployment assumptions").

### Two different crowds — keep them apart

| | What it is | Who can see it |
|---|---|---|
| **The real crowd** | The people the simulator decides are standing at a stop | Only the simulator. ORBIT never reads it directly. |
| **What ORBIT sees** | App signals from the share of that crowd who use the app; door counts when they board; driver taps | ORBIT |

`app_share` per stop is a scenario setting (for example 0.25 at KDOJ). This is what lets the simulator play the observation months: ORBIT compares app counts with door counts and learns the share, exactly as it would in real life.

### What the injector feeds in

```python
class VirtualInjector:
    """Feeds simulated outside-world data into the real system."""

    def inject_bus_position(self, bus_id, lat, lng, sim_time, source="paj_gps"): ...
        # → buses/{bus_id}/position, the topic a real GPS feed would use

    def inject_demand_signal(self, stop_id, corridor_id, destination, token,
                             signal_type="initial"): ...
        # → POST /api/demand, the endpoint a real phone would hit
        # signal_type: "initial" | "still_waiting" | "transfer"

    def inject_door_count(self, bus_id, stop_id, boarded, alighted): ...
        # → the load interface a real door counter would use

    def inject_driver_tap(self, bus_id, level=None, left_people_behind=False): ...
        # level: "empty" | "half" | "full"

    def inject_driver_answer(self, bus_id, instruction_id, answer): ...
        # answer: "ok" | "cant" | None (no answer)

    def inject_rider_crowd_tap(self, bus_id, level): ...
```

### Bus position drives the events

```
Position update
  → Bus Agent updates where it is
  → arrival times recalculated for the stops ahead
  → bus enters a stop's geofence: "arrived"; boarding happens; door counter reads
  → bus leaves the geofence: "departed"; Bus Agent reports whether it left full;
    Stop Agent updates its count; students with the app open get "did you get on?"
```

### Boarding in the simulator

```python
def simulate_stop_visit(bus, stop, sim_time):
    seats_left = bus.seats - bus.load
    crowd = real_crowd[stop.id][bus.corridor_id]
    boarding = min(crowd, seats_left)
    left_behind = crowd - boarding

    injector.inject_door_count(bus.id, stop.id, boarded=boarding, alighted=alighting_here(bus, stop))
    real_crowd[stop.id][bus.corridor_id] = left_behind

    if left_behind > 0:
        if scenario.driver_taps:                       # how reliably drivers tap is a setting
            injector.inject_driver_tap(bus.id, left_people_behind=True)
        for person in app_users_among(left_behind, stop.app_share):
            injector.inject_demand_signal(stop.id, bus.corridor_id, person.destination,
                                          person.token, signal_type="still_waiting")
    return boarding, left_behind
```

A left-behind person is one person. (The old "1.5× missed-bus weight" is retired: ORBIT now counts people against seats, and a person and a half doesn't fit that.)

### The demand engine — the simulator's crowd model

Generates the real crowd per stop per tick from class-schedule patterns. Not random: it spikes 15–20 minutes before lectures, drops after a bus boards, varies by college size, and is flat and low on weekends.

It has a second, smaller job: it gives ORBIT the schedule-based `expected` number for each stop and time (used for the dashboard and the strange-count check — never as a trigger, and not produced for CP or Jalan Amal).

```python
LECTURE_SLOTS_HOURS = [8, 9, 10, 11, 12, 14, 15, 16, 17]
PRE_LECTURE_WINDOW = 20  # minutes before a slot = peak boarding window

STOP_PROFILES = {
    "kdoj_bus_e": {"baseline": 3, "peak_multiplier": 6,
                   "peak_destinations": ["cluster_t02", "cluster_t08"]},
    "klg_bus_e":  {"baseline": 2, "peak_multiplier": 5, "peak_destinations": ["cluster_t02"]},
    "kdse_bus_e": {"baseline": 2, "peak_multiplier": 5,
                   "peak_destinations": ["cluster_t02", "cluster_t08"]},
    "kp_bus_b":   {"baseline": 3, "peak_multiplier": 5,
                   "peak_destinations": ["cluster_t02", "kolej_9_10"]},
    "ktr_bus_f":  {"baseline": 2, "peak_multiplier": 4, "peak_destinations": ["cp", "jalan_amal"]},
    "ktho_bus_f": {"baseline": 2, "peak_multiplier": 4, "peak_destinations": ["cp"]},
    "ktdi_bus_f": {"baseline": 2, "peak_multiplier": 4, "peak_destinations": ["cp"]},
}

def crowd_arrivals(stop_instance: str, sim_time, minutes: float, scenario) -> int:
    profile = STOP_PROFILES[stop_instance]
    rate = profile["baseline"]
    if is_within_pre_lecture_window(sim_time, PRE_LECTURE_WINDOW):
        rate *= profile["peak_multiplier"] * scenario["peak_scale"]
    noise = random.uniform(1 - scenario["noise"], 1 + scenario["noise"])
    return int(rate * minutes * noise)
```

Destination probabilities per stop and time of day stay as in the earlier version (morning trips to the Cluster, midday and evening back to the colleges). With destination picking in the app, the simulator also draws transfer trips — for example KTR → Cluster: Bus F to CP, then Bus E.

The simulator can also take a **recorded demand history** in place of the engine, and a **proposed timetable** in place of the current one — so a timetable change can be tried against real recorded demand before UTM commits to it.

### Simulation clock

```python
TICK_SECONDS = 5
SPEED_MULTIPLIER = 1      # 1×, 5×, 10×, or as fast as possible for the observation months
```

---

## Scenario library

The four old presets (`normal_day`, `peak_morning`, `exam_week`, `low_demand`) become a library. Each scenario sets the crowd, the app share, how reliably drivers tap, and any disruption.

| Scenario | What it shows |
|---|---|
| Normal weekday | The baseline |
| First week of semester | Heavier, less predictable crowds |
| Exam week | Fewer people, spread out; odd peaks |
| Big event (convocation, career fair) | A crowd the schedule model doesn't expect — the strange-count flag |
| Heavy rain | More riders everywhere at once — several routes want the spare |
| Friday (12:40–14:00 gap), weekend, public holiday | Service-hour rules |
| A messy day | A bus breaks down; a jam on one route; a driver says "Can't" |
| Zero app users | ORBIT still works from driver taps and door counters |

To build over time with Samy's campus knowledge: the academic calendar, recurring events, and habits like "everyone heads to KDOJ after the 5 pm class".

---

## Observation mode in the simulator

For the FYP, the simulator plays the months a real deployment would spend watching.

1. Run many simulated days with the rollout stage set to `observe`.
2. ORBIT logs what it would have done each time (`SHADOW_WOULD_SEND`) and sends nothing.
3. Compare with what happened: did that bus really leave people behind?
4. The report reads: "ORBIT would have sent a spare 9 times; on 8 the bus really did leave people behind."
5. The same runs give the app share per stop and the first planning reports.

---

## Validation checks

Framed as software validation: the system meets its requirements under simulated demand. Run the same scenario twice — timetable only, and with ORBIT acting — as a **performance acceptance test**.

| Check | What is measured |
|---|---|
| People left behind | Count per departure and per day |
| Wait after being left behind | Minutes until the next seat |
| Empty runs | Trips that ran with almost nobody on board |
| Spare trips | How many, and how many were needed |
| Observation hit rate | Of the times ORBIT would have acted, how often it was right |
| Bunching | How often two buses on a route run too close together |
| Timetable kept | No scheduled departure removed or made later by an overflow response |

Pass marks are placeholders to set at build time.

---

## Deployment path — which demand sources are real

| Stage | What is real | What changes |
|---|---|---|
| FYP demo | Nothing physical; the simulator plays it all | — |
| Observation | App + driver taps + whatever GPS exists | Real data starts; ORBIT only watches |
| With door counters | Infrared door counters on buses | Real load per trip; app share can be learned properly |
| Mature | History replaces the class-schedule model | Reports and the spare's waiting spots come from real patterns |

Door counters are the one piece of hardware worth having: cheap, privacy-safe, nothing to install at stops.
