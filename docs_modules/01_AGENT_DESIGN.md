# Module 01 — ORBIT Agent Design Specification
> Updated May 2026: Timing intervention hierarchy added. Stranded passenger problem addressed.
> System name: ORBIT (On-Demand, Route-Based Intelligent Transit System)

---

## Agent Overview

| Entity | Type | Count | Role |
|---|---|---|---|
| Stop Agent | Reactive agent | 1 per corridor-stop instance | Monitors demand, broadcasts state |
| Bus Agent | Deliberative agent | 1 per bus service | Evaluates timing interventions, coordinates |
| Demand Engine | Environment model | 1 global | Fallback only — feeds Stop Agents when app adoption is low |

**PSM2 simulation scope:** Model 3 corridors (Bus B, E, F) = 7 Bus Agents, ~10 Stop Agent instances.

---

## Stop Agent

### Responsibility
Aggregate demand signals from the student app for its assigned corridor-stop. Classify demand level. Broadcast when HIGH or CRITICAL. Fall back to simulation engine when app adoption is low.

### Input Sources (Priority Order)

| Priority | Source | Condition |
|---|---|---|
| 1 — App signals | Student PWA submits {stop, corridor, destination} | Primary — when students are using the app |
| 2 — Driver report | Driver taps "left passengers behind" (bus full) | Supplement when app adoption is low |
| 3 — Simulation engine | Class schedule demand model | Fallback — always available |

**Graceful degradation logic:**
```python
def get_queue_count(stop_id, corridor_id, sim_time):
    app_count = app_demand_store.get_count(stop_id, corridor_id)
    
    if app_count is not None and app_adoption_rate(stop_id) >= 0.3:
        # Enough app users — trust the app signal
        # Scale up slightly to account for non-app users
        adoption = app_adoption_rate(stop_id)
        return int(app_count / adoption)  # e.g. 9 app users / 0.3 adoption = ~30 total
    else:
        # Low adoption — fall back to simulation
        return demand_engine.get_queue_count(stop_id, sim_time)
```

**Destination attribution:**
When app signals are available, the Stop Agent knows exactly how many students are waiting for each corridor. This completely resolves the destination ambiguity problem at multi-route stops — a student who submitted via app declared their corridor explicitly.

**Interchange stops (CP, Jalan Amal):**
These stops do NOT generate dispatch signals regardless of queue count. They are waypoints only. Students at CP using the app would have submitted their signal at their origin stop (KDOJ, KTR etc.), not at CP. Stop Agents at interchange stops exist for position tracking only, not demand broadcasting.

### Demand Classification

| Level | Queue Count | Action |
|---|---|---|
| LOW | < 5 | No broadcast |
| MEDIUM | 5–15 | Broadcast on change only |
| HIGH | 16–30 | Broadcast every tick |
| CRITICAL | > 30 | Broadcast every tick, priority flag |

### State Variables
```python
stop_id: str                    # e.g. "kdoj"
corridor_id: str                # e.g. "E"
queue_count: int
demand_level: enum[LOW, MEDIUM, HIGH, CRITICAL]
is_claimed: bool
last_broadcast_time: datetime
last_bus_visit_time: datetime
app_adoption_rate: float        # rolling estimate, 0.0–1.0
is_interchange: bool            # True for CP, Jalan Amal — no dispatch signals
```

### Signal Integrity — AI Anomaly Detection

The Stop Agent uses a lightweight learned anomaly detector to validate incoming demand counts, replacing a hardcoded multiplier threshold. This is the AI component of the system — small, honest, self-contained.

**Why a learned model instead of a fixed rule:**
A fixed `count > expected * 3` threshold applies the same tolerance to every stop at every time. But KDOJ at 7:45am on a Monday has a very different normal range than KDOJ at 2pm on a Saturday. An Isolation Forest model trained per (stop, corridor, hour, weekday) bucket learns these patterns from simulation history and flags deviations from the actual learned normal — not from a blunt multiplier.

**Model:** Isolation Forest (Liu et al., 2008). Unsupervised, lightweight, no GPU, trains in seconds on simulation run history. Output is binary: anomalous or not.

```python
from sklearn.ensemble import IsolationForest

class DemandAnomalyDetector:
    def __init__(self):
        self.models = {}  # keyed by (stop_id, corridor_id, hour, weekday)

    def train(self, historical_counts):
        # Train after first few simulation runs
        for key, counts in historical_counts.items():
            self.models[key] = IsolationForest(contamination=0.05, random_state=42)
            self.models[key].fit([[c] for c in counts])

    def is_anomalous(self, stop_id, corridor_id, count, sim_time):
        key = (stop_id, corridor_id, sim_time.hour, sim_time.weekday())
        if key not in self.models:
            return count > 90  # hardcoded fallback until model is trained
        result = self.models[key].predict([[count]])
        return result[0] == -1  # IsolationForest: -1 = anomaly, 1 = normal

# Stop Agent usage
def update_queue_from_app(self, app_count, sim_time):
    if anomaly_detector.is_anomalous(
            self.stop_id, self.corridor_id, app_count, sim_time):
        mqtt.publish("system/log", {
            "agent_id": self.stop_id,
            "event": "DEMAND_SIGNAL_REJECTED",
            "reason": "anomaly detector flagged count as implausible",
            "received": app_count,
            "model_key": f"{self.stop_id}:{self.corridor_id}:"
                         f"{sim_time.hour}:{sim_time.weekday()}"
        })
        return
    self.queue_count = self.scale_for_adoption(app_count)
    self.update_demand_level()
```

**PSM2 training schedule:** Runs 1–2 use hardcoded fallback. From Run 3 onwards, anomaly detector is active. Every rejection is logged to fleet dashboard with the model key for transparency.

**Scope boundary:** This component detects bad input data. It does not predict demand, does not influence routing, and is not evaluated as a standalone AI system. It is a signal integrity component of the Stop Agent.

### Behaviour Rules
1. If `is_interchange = True` → never broadcast dispatch signal
2. Run plausibility check before accepting any app demand count
3. Only broadcast if demand_level >= HIGH or level changed
4. If `is_claimed = True` → suppress new broadcasts
5. Reset `is_claimed = False` after bus departs and queue drops below MEDIUM
6. Keepalive broadcast every 30 seconds if demand_level >= HIGH

---

## Bus Agent

### Responsibility
Operate along its assigned corridor. Receive demand signals from Stop Agents on its corridor. Evaluate which timing intervention (if any) is appropriate. Apply all constraint checks. Execute decision. Log everything.

### ⚠️ The Stranded Passenger Problem

Early departure means a student who planned to catch a bus at its scheduled time may miss it. This is a real operational problem. The Bus Agent addresses it through a strict intervention hierarchy — early departure is the last resort, not the first response.

### Timing Intervention Hierarchy

When a HIGH/CRITICAL demand signal is received from a stop on this bus's corridor:

```
STEP 1: Corridor filter
Is the signal from my corridor? → NO: ignore immediately

STEP 2: Capacity check
Is current_load >= 85%? → YES: ignore — cannot serve more passengers

STEP 3: Protected time check
Within 12 min of any lecture slot? → YES: ignore — protect all journeys

STEP 4: Claim check
Already claimed by another bus on this corridor? → YES: ignore

STEP 5: Evaluate which intervention is appropriate

  IF bus is COMMUTING and demand stop is upcoming on route:
    → Try ARRIVAL COMPRESSION first (preferred)
    → Reduce dwell time at intermediate stops
    → No stranded passenger risk — bus is already en route
    → Claim, compress, log

  ELSE IF bus is COMMUTING and running ahead of schedule:
    → Try HOLD at current stop
    → hold_minutes = schedule_deviation (max 5 min)
    → Check manifest: would hold delay any passenger past class start?
      → YES: reject hold
      → NO: hold, log

  ELSE IF bus is IDLE at terminus:
    → Try EARLY DEPARTURE (last resort)
    → Check headway gap from previous bus on this corridor
      → gap < 15 min: REJECT — stranded passenger risk too high, log reason
      → gap >= 15 min: calculate early_minutes = min(gap × 0.3, 8)
    → Check utility score >= 0.6
      → NO: reject
      → YES: depart early, claim, log

  ELSE:
    → No safe intervention available, log reason
    → Flag to dashboard if demand is CRITICAL and no intervention possible

STEP 6: Insert extra trip flag
  If queue has been CRITICAL for 3+ consecutive broadcasts with no resolution:
    → Publish alert to system/log: "Persistent overflow at {stop_id}, extra trip needed"
    → Fleet manager sees alert on dashboard
    → Cannot be auto-resolved by timing alone
```

### Why This Hierarchy Solves the Stranded Passenger Problem

- **Arrival compression** never changes when a bus departs — it just reduces dwell time en route. No student is waiting for a departure that moved.
- **Hold** slows a bus that's running ahead — this actually helps students expecting the next bus, it doesn't hurt them.
- **Early departure** is the only intervention that moves a scheduled departure time. It is the last resort, bounded to 8 minutes max, and requires a 15-minute headway gap. A student planning to catch a 7:20 bus who arrives at 7:16 is stranded only if the gap was large enough to justify departure — meaning the next bus behind them is at minimum 15 minutes away, not 4 minutes.

### Constraint Code

```python
LECTURE_SLOTS = [8, 9, 10, 11, 12, 14, 15, 16, 17]
PROTECTED_WINDOW = 12       # minutes before lecture slot
CAPACITY_THRESHOLD = 0.85
HEADWAY_MIN_FOR_EARLY = 15  # minimum gap from previous bus to allow early departure
MAX_EARLY_DEPARTURE = 8     # maximum minutes early (hard cap)
HEADWAY_MIN_BETWEEN = 5     # minimum gap between any two consecutive buses

def is_protected_time(sim_time):
    minutes = sim_time.hour * 60 + sim_time.minute
    for slot in LECTURE_SLOTS:
        if (slot * 60) - PROTECTED_WINDOW <= minutes <= (slot * 60):
            return True
    return False

def headway_safe_for_early(bus, proposed_time):
    gap = (proposed_time - bus.previous_bus_departure_time).seconds / 60
    return gap >= HEADWAY_MIN_FOR_EARLY

def manifest_safe_to_hold(bus, hold_minutes):
    for passenger in bus.manifest:
        if passenger.eta_to_destination - hold_minutes < 5:
            return False
    return True

def calculate_early_departure(gap_minutes):
    early = min(gap_minutes * 0.3, MAX_EARLY_DEPARTURE)
    return round(early, 1)
```

### State Machine
```
IDLE → COMMUTING → BOARDING → RECALCULATING → COMMUTING
                      ↑                              ↓
                      └──────────────────────────────┘
```

- **IDLE:** At terminus, waiting for next scheduled departure. Can evaluate early departure.
- **COMMUTING:** Moving between stops on corridor. Can evaluate arrival compression or hold.
- **BOARDING:** Stopped at stop, passengers boarding/alighting.
- **RECALCULATING:** Evaluating intervention. Must resolve within 5 seconds or force back to COMMUTING.

### State Variables
```python
bus_id: str
corridor_id: str
current_position: str
next_stop: str
route_vector: list[str]
scheduled_departure: datetime
actual_departure: datetime
departure_delta_minutes: float    # negative = departed early
current_load: int
max_capacity: int                 # 28
status: enum[IDLE, COMMUTING, BOARDING, RECALCULATING]
manifest: list[Passenger]
previous_bus_departure_time: datetime  # for headway gap calculation
```

### Utility Score
```
utility = (queue_count / 40) × (1 - intervention_cost / max_acceptable_cost)
```
Threshold: 0.6. Below this, intervention not worth the disruption.

---

## MQTT Topic Schema

| Topic | Publisher | Subscriber | Key Payload Fields |
|---|---|---|---|
| `stops/{id}/state` | Stop Agent | Bus Agents (own corridor), Dashboard | stop_id, corridor_id, queue_count, demand_level, is_claimed, app_count, sim_count |
| `buses/{id}/state` | Bus Agent | Dashboard, Student App backend | bus_id, corridor_id, position, next_stop, load, status, scheduled_dep, actual_dep, delta_minutes |
| `tasks/{stop_id}/claim` | Bus Agent | All agents | bus_id, corridor_id, stop_id, action, intervention_type, timestamp |
| `system/log` | All agents | Dashboard | agent_id, event_type, message, constraints_checked, timestamp |
| `admin/override` | Dashboard | Specific Bus Agent | bus_id, new_route_vector |
| `demand/signal` | Student App backend | Stop Agents | stop_id, corridor_id, destination, student_token (anonymous) |

**QoS:**
- `tasks/+/claim` → QoS 1 (critical)
- `demand/signal` → QoS 1 (demand data must not be lost)
- All others → QoS 0

---

## Black Box Test Cases (Updated)

| TC | Input | Expected | Notes |
|---|---|---|---|
| TC01 | Queue 35, load 10/28, time 08:46, bus IDLE at terminus, gap 20 min | Early departure accepted | Gap > 15 min threshold |
| TC02 | Queue 35, load 25/28 | Ignored — capacity lock | |
| TC03 | Queue 35, time 08:52 (within 12 min of 09:00) | Ignored — protected zone | |
| TC04 | Bus COMMUTING, hold would delay manifest passenger past class | Hold rejected — manifest protection | |
| TC05 | Two buses same corridor receive same CRITICAL broadcast | Only first claims | Claim lock |
| TC06 | MQTT broker disconnects | All buses revert to fixed schedule within 10s | Graceful degradation |
| TC07 | Queue = 3 (LOW) | No broadcast | |
| TC08 | Admin override sent to Bus E1 | Bus E1 updates route_vector, logs | |
| TC09 | RECALCULATING > 5s | Force back to COMMUTING | Timeout guard |
| TC10 | Normal Day 1-hour run | Every stop visited ≤ 20 min | Service guarantee |
| TC11 | Bus IDLE at terminus, gap = 8 min, queue CRITICAL | Early departure REJECTED — gap < 15 min, stranded passenger risk logged | Key stranded passenger test |
| TC12 | Bus E1 receives broadcast from Bus B corridor stop | Ignored — corridor filter | |
| TC13 | App adoption at stop = 5%, demand signal received | Stop Agent falls back to simulation engine | Graceful degradation |
| TC14 | 12 app users at KDOJ Bus E, adoption rate 30% | Queue estimated as 12/0.3 = 40 | Adoption scaling |
| TC15 | Same session token submits demand signal twice within 30 min | Second signal silently ignored, queue count unchanged | Token rate limit |
| TC16 | 80 demand signals received at KDOJ at 2pm Saturday (no classes scheduled, expected = 5) | Plausibility filter rejects count, DEMAND_SIGNAL_REJECTED logged, no dispatch triggered | Plausibility filter |

---

## Common Pitfalls

- **Interchange stops broadcasting:** CP and Jalan Amal must never generate dispatch signals. Check `is_interchange` flag.
- **Early departure without gap check:** Always verify headway gap before allowing early departure. This is the stranded passenger guard.
- **Cross-corridor response:** Corridor filter is the first check — fail fast.
- **Double response:** Check claim topic before publishing own claim.
- **RECALCULATING stuck:** 5-second timeout, always resolves to COMMUTING.
