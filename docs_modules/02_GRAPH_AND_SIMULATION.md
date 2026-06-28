# Module 02 — ORBIT Campus Graph & Demand Simulation
> Updated May 2026: Graph nodes use real UTM stop names from official schedule.
> PSM2 evaluation approach: software-in-the-loop simulation. Virtual data injector documented.
> System name: ORBIT (On-Demand, Route-Based Intelligent Transit System)

---

## Campus Graph

### What It Is
A directed weighted graph of UTM Skudai's shuttle road network. Directed because some campus roads are one-way. Weighted because edge weights encode travel time between stops.

**Important:** The graph is not a single connected mesh. It is a set of corridor subgraphs. Bus B agents only traverse Bus B corridor nodes. Bus E agents traverse Bus E corridor nodes. CP is a shared node appearing in multiple corridors (interchange point).

### Implementation
```python
import networkx as nx
G = nx.DiGraph()  # DIRECTED — not Graph()
```

### Confirmed Nodes (Real UTM Stop Names)

```python
# Corridor B: KP ↔ K9/10 ↔ Cluster
B_STOPS = ["kolej_perdana", "kolej_9_10", "cluster_t02", "cluster_t04",
           "cluster_t06", "cluster_t08"]

# Corridor C: K9/10 ↔ KTC ↔ CP ↔ Jln Amal
C_STOPS = ["kolej_9_10", "ktc", "cp", "jalan_amal"]

# Corridor D: KDOJ ↔ KLG ↔ KDSE ↔ PKU ↔ CP ↔ Jln Amal
D_STOPS = ["kdoj", "klg", "kdse", "pku", "cp", "jalan_amal"]

# Corridor E: KDOJ/KLG/KDSE → Cluster via CP→N24→KTC
E_STOPS = ["kdoj", "klg", "kdse", "cp", "n24", "ktc",
           "cluster_t02", "cluster_t06", "cluster_t08"]

# Corridor F: KTR → KTHO → KTDI → Jln Amal → CP
F_STOPS = ["ktr", "ktho", "ktdi", "jalan_amal", "cp"]

# Corridor G: KTR/KTHO/KTDI → N24 → SKT → P19 → CP
G_STOPS = ["ktr", "ktho", "ktdi", "n24", "skt", "p19", "cp"]

# Shared nodes (appear in multiple corridors)
INTERCHANGE_NODES = ["cp", "jalan_amal", "n24", "ktc"]
```

> **⚠️ Post Dr Sim meeting:** Verify exact stop sequence and one-way segments for each corridor. The above is based on the official schedule route descriptions — exact road topology needs ground-truth confirmation.

### Edge Weight Formula
```
W_edge = base_travel_minutes × (1 + 1 / (queue_count_at_destination + 1))
```
- High queue at destination → smaller penalty → edge more attractive (bus should go there)
- Low queue → penalty approaches 2× base (discourages unnecessary detour)
- `base_travel_minutes` = estimated road segment travel time

### Approximate Base Travel Times

These are estimates. Verify with Dr Sim or UTM Fleet, or drive/time the routes.

**Corridor E (KDOJ → Cluster) — most critical corridor:**

| Segment | Minutes | Direction |
|---|---|---|
| KDOJ → KLG | 3 | one-way outbound |
| KLG → KDSE | 3 | one-way outbound |
| KDSE → PKU | 4 | one-way outbound |
| PKU → CP | 5 | bidirectional |
| CP → N24 | 4 | one-way |
| N24 → KTC | 3 | one-way |
| KTC → Cluster T02 | 4 | one-way |
| Cluster T02 → T08 | 3 | one-way loop |

**Corridor B (KP → Cluster):**

| Segment | Minutes | Direction |
|---|---|---|
| KP → K9/10 | 5 | bidirectional |
| K9/10 → Cluster T02 | 7 | one-way outbound |
| Cluster T08 → K9/10 | 7 | one-way return |
| K9/10 → KP | 5 | bidirectional |

**Corridor F (KTR → CP):**

| Segment | Minutes | Direction |
|---|---|---|
| KTR → KTHO | 4 | one-way |
| KTHO → KTDI | 3 | one-way |
| KTDI → Jalan Amal | 5 | one-way |
| Jalan Amal → CP | 4 | bidirectional |

### Graph Build Code

```python
def build_corridor_graph(corridor_id: str) -> nx.DiGraph:
    G = nx.DiGraph()
    edges = CORRIDOR_EDGES[corridor_id]  # loaded from config/graph.json
    for u, v, base_time in edges:
        G.add_edge(u, v, base_time=base_time, weight=base_time)
    return G

def update_edge_weights(G: nx.DiGraph, queue_states: dict):
    """Refresh weights from current queue data. Call every simulation tick."""
    for u, v, data in G.edges(data=True):
        q = queue_states.get(v, 0)
        data["weight"] = data["base_time"] * (1 + 1 / (q + 1))

def get_eta(G: nx.DiGraph, source: str, target: str) -> float:
    """Returns estimated travel time in minutes."""
    try:
        return nx.dijkstra_path_length(G, source, target, weight="weight")
    except nx.NetworkXNoPath:
        return float("inf")
```

---

## Demand Simulation Engine

### What It Is
A module that generates realistic queue counts per stop per simulation tick. It is NOT random — it is driven by UTM's class schedule and boarding/alighting history. This is what makes the simulation credible and academically justifiable.

### Honest Statement About Queue Sensing

**Direct queue counting at bus stops does not exist in your simulation.** Your Stop Agents receive a simulated number from this engine. This is the correct approach because:

1. No campus bus system reliably counts waiting queues directly
2. Real systems (Skyss Norway, Moovit) infer demand from boarding patterns — not direct headcounts
3. Your demand engine applies the same principle: infer expected queue from known class schedule patterns
4. For simulation, you generate what the system *would* receive if sensors existed

The vision-based queue counting idea (camera on bus) was evaluated and deferred to Future Work because: (a) queue data is only available at the moment the bus visits, not in real-time between visits, (b) destination ambiguity remains unsolved even with a camera, (c) CV accuracy in outdoor Malaysian conditions requires significant validation effort outside PSM1 scope.

Use this paragraph in your report:
> *"The Stop Agent receives queue state from the demand simulation engine, which generates probabilistic queue counts based on UTM's class schedule patterns. This approach is analogous to the indirect inference methodology used by production transit operators — Skyss (Norway) estimates waiting passengers through Automatic Passenger Counting data analysed across boarding/alighting patterns rather than direct stop-level measurement. The simulation abstracts the sensing layer to focus validation on the coordination and dispatch logic, which is the core contribution of this system."*

### Design Philosophy
Campus bus stop demand is highly predictable:
- Spikes 15–20 minutes before a lecture (students leaving colleges)
- Drops sharply after a bus arrives and boards passengers
- Varies by stop based on nearby residential college population
- Weekend/holiday demand is flat and low

### UTM Lecture Slots
```python
LECTURE_SLOTS_HOURS = [8, 9, 10, 11, 12, 14, 15, 16, 17]
PRE_LECTURE_WINDOW = 20  # minutes before slot = peak boarding window
```

### Stop Demand Profiles (Updated with Real UTM Stop Names)

```python
STOP_PROFILES = {
    # Corridor E stops — KDOJ is the highest-demand origin for Bus E
    "kdoj_bus_e": {
        "baseline": 3,
        "peak_multiplier": 6,
        "peak_destinations": ["cluster_t02", "cluster_t08"],
        "resident_college_capacity": 1200,  # approximate, verify
    },
    "klg_bus_e": {
        "baseline": 2,
        "peak_multiplier": 5,
        "peak_destinations": ["cluster_t02"],
        "resident_college_capacity": 800,
    },
    "kdse_bus_e": {
        "baseline": 2,
        "peak_multiplier": 5,
        "peak_destinations": ["cluster_t02", "cluster_t08"],
        "resident_college_capacity": 900,
    },
    # Corridor B stops
    "kp_bus_b": {
        "baseline": 3,
        "peak_multiplier": 5,
        "peak_destinations": ["cluster_t02", "kolej_9_10"],
        "resident_college_capacity": 1100,
    },
    # Corridor F stops
    "ktr_bus_f": {
        "baseline": 2,
        "peak_multiplier": 4,
        "peak_destinations": ["cp", "jalan_amal"],
        "resident_college_capacity": 1000,
    },
    "ktho_bus_f": {"baseline": 2, "peak_multiplier": 4, "peak_destinations": ["cp"]},
    "ktdi_bus_f": {"baseline": 2, "peak_multiplier": 4, "peak_destinations": ["cp"]},
    # Add all corridor stops
}
```

### Queue Count Generation

```python
def get_queue_count(stop_id: str, sim_time: datetime,
                    last_bus_visit: datetime) -> int:
    profile = STOP_PROFILES[stop_id]
    in_peak = is_within_pre_lecture_window(sim_time, PRE_LECTURE_WINDOW)

    rate = profile["baseline"]
    if in_peak:
        rate *= profile["peak_multiplier"]

    # Accumulate since last bus visit
    minutes_since_visit = (sim_time - last_bus_visit).total_seconds() / 60
    accumulated = int(rate * minutes_since_visit)

    # Add ±20% noise for realism
    noise = random.uniform(0.8, 1.2)
    return int(accumulated * noise)
```

### Boarding / Alighting Simulation

```python
def simulate_stop_visit(bus, stop_id: str, sim_time: datetime):
    available = bus.max_capacity - bus.current_load
    queue = current_queue[stop_id]
    boarding = min(queue, available)
    leftover = max(0, queue - available)  # students who couldn't board

    for _ in range(boarding):
        dest = assign_destination(stop_id, sim_time)
        bus.manifest.append(Passenger(
            destination_stop=dest,
            eta_to_destination=get_eta(corridor_graph, stop_id, dest)
        ))

    # Alighting
    alighting = sum(1 for p in bus.manifest if p.destination_stop == stop_id)
    bus.manifest = [p for p in bus.manifest if p.destination_stop != stop_id]

    # Update queue state
    current_queue[stop_id] = leftover
    update_boarding_history(stop_id, boarding, alighting, sim_time)

    return boarding, alighting, leftover
```

### Destination Probability Tables (PSM1 Hardcoded)

```python
DESTINATION_PROBABILITY = {
    # Corridor E: morning trips go to Cluster, afternoon return to colleges
    "kdoj_bus_e": {
        "07:00-10:00": {"cluster_t02": 0.55, "cluster_t08": 0.45},
        "11:00-13:00": {"kdoj": 0.50, "kdse": 0.30, "klg": 0.20},
        "14:00-17:00": {"cluster_t02": 0.40, "cluster_t08": 0.60},
    },
    "klg_bus_e": {
        "07:00-10:00": {"cluster_t02": 0.70, "cluster_t08": 0.30},
        "11:00-13:00": {"kdoj": 0.30, "klg": 0.40, "kdse": 0.30},
    },
    # Corridor B
    "kp_bus_b": {
        "07:00-10:00": {"cluster_t02": 0.55, "cluster_t06": 0.25, "kolej_9_10": 0.20},
        "12:00-14:00": {"kp": 0.55, "kolej_9_10": 0.45},
    },
    # Corridor F
    "ktr_bus_f": {
        "07:00-10:00": {"cp": 0.60, "jalan_amal": 0.40},
        "12:00-14:00": {"ktr": 0.50, "ktho": 0.25, "ktdi": 0.25},
    },
}
```

### Boarding History (Skyss-Analogous Pattern Refinement)

```python
boarding_history = defaultdict(list)  # stop_id → list of visit records

def update_boarding_history(stop_id: str, boarded: int,
                             alighted: int, sim_time: datetime):
    boarding_history[stop_id].append({
        "time": sim_time,
        "boarded": boarded,
        "alighted": alighted,
        "leftover": current_queue.get(stop_id, 0)
    })
    # Rolling window: keep last 3 visits
    if len(boarding_history[stop_id]) > 3:
        boarding_history[stop_id].pop(0)

def get_demand_adjustment(stop_id: str) -> float:
    """Scale demand estimate based on recent boarding history."""
    history = boarding_history.get(stop_id, [])
    if not history:
        return 1.0
    avg_leftover = sum(h["leftover"] for h in history) / len(history)
    if avg_leftover > 10:
        return 1.3   # consistently leaving passengers — scale up
    elif avg_leftover == 0:
        return 0.9   # always absorbing full queue — slight scale down
    return 1.0
```

---

## Scenario Presets

```python
SCENARIOS = {
    "normal_day":   {"peak_scale": 1.0, "noise": 0.20},
    "peak_morning": {"peak_scale": 1.5, "noise": 0.15},  # e.g. first week of semester
    "exam_week":    {"peak_scale": 0.4, "noise": 0.30},  # fewer students, more spread
    "low_demand":   {"peak_scale": 0.2, "noise": 0.40},  # holiday, break
}
```

---

## Simulation Clock

```python
TICK_SECONDS = 5          # each tick = 5 seconds of simulated campus time
SPEED_MULTIPLIER = 1      # adjustable via dashboard: 1×, 5×, 10×

sim_time = datetime(2026, 3, 23, 7, 0, 0)  # start at 7:00am

while running:
    sim_time += timedelta(seconds=TICK_SECONDS)
    demand_engine.tick(sim_time)
    for agent in all_agents:
        agent.tick(sim_time)
    time.sleep(TICK_SECONDS / SPEED_MULTIPLIER)
```

---

## Evaluation Metrics

Run same scenario twice: MAS mode vs fixed-schedule mode. Compare:

| Metric | Definition | Target |
|---|---|---|
| Average passenger wait time | Time from joining queue to boarding, averaged across all passengers | < 15 min |
| Bus utilisation rate | Average (load / max_capacity) across all trips | > 60% |
| CRITICAL queue events | Count of ticks where any stop queue > 30 | < 5 per simulated hour |
| Service interval | Average time between consecutive bus visits per stop | ≤ 20 min |
| Leftover passengers per trip | Average passengers who couldn't board due to capacity | Minimise |

---

## PSM2 Evaluation Approach — Software-in-the-Loop Simulation

### Core Principle

The system is fully real. All agent code, all coordination logic, all three layers run exactly as they would in production. The only simulated part is the **data sources** — bus GPS positions, student demand signals, and boarding outcomes. A virtual injector feeds these into the system; the system processes them identically to real data. It has no knowledge of whether data is real or simulated.

This is software-in-the-loop simulation — standard methodology for transit system validation. The Qatar University campus transit study used the same approach.

### What the Virtual Injector Does

```python
class VirtualInjector:
    """
    Feeds simulated data into the real system.
    System cannot distinguish this from real hardware/students.
    """

    def inject_bus_position(self, bus_id, lat, lng, sim_time):
        # Publishes to same MQTT topic a real GPS tracker would use
        mqtt.publish(f"buses/{bus_id}/position", {
            "lat": lat, "lng": lng, "timestamp": sim_time
        })

    def inject_demand_signal(self, stop_id, corridor_id, destination, weight=1.0):
        # Hits same API endpoint a real student phone would hit
        requests.post("/api/demand", json={
            "stop_id": stop_id,
            "corridor_id": corridor_id,
            "destination": destination,
            "token": generate_unique_token(),
            "signal_type": "initial",
            "weight": weight
        })

    def inject_boarding_outcome(self, stop_id, corridor_id, bus_id,
                                 board_rate=0.8):
        # Simulates boarding prompt outcomes
        # board_rate = fraction of waiting students who board
        # Remainder re-signal as "missed_bus" with weight 1.5
        ...
```

### How Bus Position Drives Everything

Bus position is the heartbeat of the entire system in PSM2. All downstream events derive from it:

```
Injector publishes bus GPS position every 5 seconds
    → Bus Agent updates current_position
    → ETA recalculated for all stops ahead on corridor
    → Student app receives updated ETA via WebSocket
    → When bus GPS enters stop geofence:
        → Bus Agent logs "arrived at {stop_id}"
        → Stop Agent records last_bus_visit_time
        → Boarding prompt fires to app users waiting at that stop (1 min delay)
    → When bus GPS exits stop geofence:
        → Bus Agent logs "departed {stop_id}"
        → Stop Agent resets is_claimed, re-evaluates residual demand
```

This is why the design is location-based, not schedule-based. The trigger for every event — ETA update, boarding prompt, Stop Agent reset — is the bus's GPS position crossing a stop geofence. Not a clock. Not a timetable lookup. The position is the ground truth.

### Boarding Outcome Simulation

```python
def simulate_boarding_at_stop(stop_id, corridor_id, bus_id,
                               waiting_count, bus_capacity_remaining,
                               board_rate=0.8, scenario_config=None):

    board_rate = scenario_config.get("board_rate", board_rate)
    actual_boarders = min(
        int(waiting_count * board_rate),
        bus_capacity_remaining
    )
    missed = waiting_count - actual_boarders

    # Inject missed-bus re-signals with higher weight
    for _ in range(missed):
        injector.inject_demand_signal(
            stop_id, corridor_id,
            signal_type="missed_bus",
            weight=1.5
        )

    return actual_boarders, missed
```

`board_rate` is a scenario parameter. Set it low to simulate a full bus leaving students behind. Set it high for normal conditions. This gives full control over test scenarios.

### Report Statement for PSM2 Methodology

> *"PSM2 system validation uses a software-in-the-loop approach. All system components — student app, MAS backend, fleet dashboard — are fully implemented and operational. External data sources (bus GPS positions, student demand signals, boarding outcomes) are provided by a virtual injector module that publishes to the same interfaces real hardware and real students would use. The system processes simulated data identically to real data and has no knowledge of the data source. Bus position is the primary ground truth: all downstream events including ETA calculation, boarding prompt triggering, and Stop Agent queue resets derive from bus GPS crossing stop geofences — not from a schedule or clock. This location-based event model ensures the system behaves correctly in deployment when real GPS data replaces the injector, requiring no architectural changes."*

---

## System Maturity Path

| Phase | Demand Source | What Changes |
|---|---|---|
| **Phase 1 — PSM1** | Class schedule model (this module) | Simulation only |
| **Phase 2 — Early deployment** | Driver tap on full bus | Real leftover signal |
| **Phase 3 — With APC** | Infrared door counters on buses | Real boarding/alighting data |
| **Phase 4 — Skyss level** | Historical APC patterns override schedule | Self-improving demand model |

The only hardware needed for Phase 3: **bidirectional infrared door counter** on each bus door. Cheap, privacy-safe, no stop infrastructure. Same technology as Skyss Norway.
