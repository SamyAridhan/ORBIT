# Module 03 — ORBIT Dashboard, Student App & System Integration
> Updated May 2026: Student app (Layer 1) fully added. Three-layer integration documented.
> System name: ORBIT (On-Demand, Route-Based Intelligent Transit System)

---

## System Integration Overview

Three layers, one coherent system. Data flows upward through layers; information flows back down to users.

```
Student App (Layer 1)
    ↕ REST API + WebSocket
MAS Backend (Layer 2)
    ↕ WebSocket
Fleet Dashboard (Layer 3)
```

---

## Layer 1 — Student App (PWA)

### What It Is
A Progressive Web App — runs in any phone browser, no App Store, no UTM IT permission needed. Students open a URL, it works.

### Student User Flow
```
1. Student arrives at bus stop
2. Opens app URL on phone browser
3. Browser Geolocation API detects coordinates
4. App matches coordinates to nearest named stop (geofence radius: 80m)
5. App shows: "You are at KDOJ"
6. App shows available corridors from this stop: [Bus D → CP] [Bus E → Cluster]
7. Student taps their destination corridor
8. App submits demand signal to backend: {stop_id, corridor_id, destination, timestamp}
9. App displays:
   - ETA for next bus on selected corridor
   - Current bus capacity (seats available)
   - Simple position indicator: "Bus E2 last seen at KDSE"
10. Student boards their bus
```

### What the App Displays
- **Stop name** — confirmed by geofence match
- **Available corridors** — based on which routes serve this stop
- **ETA** — calculated from last known bus position + average segment travel times
- **Capacity** — percentage full (from bus manifest count)
- **Bus position indicator** — which stop the bus last passed (Japan-style stop indicator, not live dot on map — simpler, less battery intensive)

### Bus Position: GPS vs RFID Decision

**Chosen approach: GPS live location (future) / schedule-based ETA (PSM2 early)**

GPS wins over RFID for UTM because:
- Lower total cost (GPS tracker per bus vs RFID reader at every stop)
- Higher precision (exact location, not "last seen at stop X")
- Already deployed locally (Bus Johor P211, Cityliner)
- UTM Fleet may already have GPS — ask Dr Sim
- RFID requires power supply at every stop (UTM stops are open-air, no power)

**PSM2 implementation plan:**
- Weeks 1–6: Schedule-based ETA (calculate from timetable + average travel time)
- Week 6+: Swap in GPS feed if UTM Fleet provides access. Architecture supports this — ETA calculation module is pluggable.

```python
class ETACalculator:
    def get_eta(self, bus_id, stop_id):
        raise NotImplementedError

class ScheduleBasedETA(ETACalculator):
    def get_eta(self, bus_id, stop_id):
        # Calculate from scheduled departure + average segment times
        ...

class GPSBasedETA(ETACalculator):
    def get_eta(self, bus_id, stop_id):
        # Calculate from live GPS position + remaining segments
        ...

# Swap without changing any agent logic:
eta_calculator = ScheduleBasedETA()   # PSM2 early
# eta_calculator = GPSBasedETA()      # After UTM Fleet GPS integration
```

### Stop Detection — Geofence Logic
```javascript
// Browser Geolocation API
navigator.geolocation.getCurrentPosition(position => {
    const { latitude, longitude } = position.coords;
    const nearestStop = findNearestStop(latitude, longitude, STOPS);
    if (nearestStop.distance <= 80) {  // 80m radius
        setDetectedStop(nearestStop);
    } else {
        showMessage("Move closer to a bus stop");
    }
});

function findNearestStop(lat, lng, stops) {
    return stops
        .map(stop => ({
            ...stop,
            distance: haversineDistance(lat, lng, stop.lat, stop.lng)
        }))
        .sort((a, b) => a.distance - b.distance)[0];
}
```

### Demand Signal Submission
```javascript
async function submitDemandSignal(stopId, corridorId, destination) {
    await fetch('/api/demand', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            stop_id: stopId,
            corridor_id: corridorId,
            destination: destination,
            timestamp: new Date().toISOString(),
            token: getAnonymousToken()  // session-based, no identity
        })
    });
}
```

### Privacy Design
- No student login required
- No name, student ID, or personal data collected
- Anonymous session token (refreshes every trip) for deduplication only
- Token cannot be linked to any individual
- Data retained for maximum 2 hours then purged (demand signals are time-sensitive)

### Participation and Adoption
App use is voluntary. Students who don't use it are unaffected in normal operation. When timing adjustments happen, non-app users face at most 8 minutes unpredictability (bounded by Bus Agent constraints). As adoption grows, demand signal accuracy improves. A launch campaign (future work) would accelerate adoption.

---

## Layer 2 — MAS Backend

See `01_AGENT_DESIGN.md` for full agent specifications.

### Backend API Endpoints

```python
# Demand signal from student app
@app.post("/api/demand")
async def receive_demand(signal: DemandSignal):
    demand_store.add(signal)
    # Stop Agent will read from demand_store on next tick
    return {"status": "received"}

# ETA query from student app
@app.get("/api/eta/{bus_id}/{stop_id}")
async def get_eta(bus_id: str, stop_id: str):
    return {"eta_minutes": eta_calculator.get_eta(bus_id, stop_id)}

# Bus capacity query
@app.get("/api/capacity/{bus_id}")
async def get_capacity(bus_id: str):
    bus = bus_registry.get(bus_id)
    return {"load": bus.current_load, "max": bus.max_capacity,
            "available": bus.max_capacity - bus.current_load}

# Bus position (schedule-based or GPS)
@app.get("/api/position/{bus_id}")
async def get_position(bus_id: str):
    return {"last_stop": bus_registry.get(bus_id).current_position,
            "next_stop": bus_registry.get(bus_id).next_stop}

# WebSocket for real-time dashboard updates
@app.websocket("/ws/dashboard")
async def dashboard_ws(websocket: WebSocket):
    await websocket.accept()
    connected_dashboard_clients.append(websocket)
    ...

# WebSocket for real-time app updates (ETA, capacity)
@app.websocket("/ws/app/{stop_id}/{corridor_id}")
async def app_ws(websocket: WebSocket, stop_id: str, corridor_id: str):
    await websocket.accept()
    # Push ETA and capacity updates for this corridor to this student
    ...
```

---

## Layer 3 — Fleet Manager Dashboard

### Purpose
Fleet manager tool. Visibility and control. Not a student product.

### Build Strategy

**Phase 1 (PSM2 Weeks 11–13) — Text dashboard:**
- Bus status table: ID, corridor, position, load, status, departure delta
- Stop status table: stop, corridor, queue, demand level, last visit
- Decision log feed: every agent action with reason and constraints checked
- Play/pause and speed controls

**Phase 2 (PSM2 Weeks 13–15) — Visual dashboard:**
- Leaflet.js campus map with bus markers (colour by corridor) and stop markers
- Queue heatmap on map (green/yellow/red circles)
- Bus route lines drawn per corridor
- MAS vs fixed-schedule metrics comparison panel

### Dashboard Message Formats

**Bus state:**
```json
{
  "type": "bus_state",
  "data": {
    "bus_id": "bus_E2",
    "corridor_id": "E",
    "position": "kdse",
    "next_stop": "cp",
    "eta_seconds": 240,
    "current_load": 14,
    "max_capacity": 28,
    "status": "COMMUTING",
    "scheduled_departure": "08:15:00",
    "actual_departure": "08:09:00",
    "departure_delta_minutes": -6
  }
}
```

**Stop state:**
```json
{
  "type": "stop_state",
  "data": {
    "stop_id": "kdoj",
    "corridor_id": "E",
    "queue_count": 34,
    "app_signal_count": 10,
    "estimated_total": 34,
    "demand_level": "CRITICAL",
    "is_claimed": true,
    "minutes_since_last_bus": 18
  }
}
```

**Decision log:**
```json
{
  "type": "log_entry",
  "data": {
    "agent_id": "bus_E2",
    "event": "EARLY_DEPARTURE_ACCEPTED",
    "message": "Departing 6 min early. KDOJ queue: 34. Headway gap: 22 min. Utility: 0.81.",
    "constraints_checked": {
      "corridor_match": "PASS",
      "capacity_lock": "PASS",
      "protected_time": "PASS",
      "headway_gap": "PASS — 22 min gap",
      "claim_lock": "PASS"
    }
  }
}
```

---

## Campus Map — Leaflet.js (Phase 2 Dashboard)

```javascript
const UTM_CENTER = [1.5586, 103.6370];
const UTM_ZOOM = 16;

// Verify all coordinates against Google Maps before using
const STOP_COORDS = {
    "kdoj":          [1.5548, 103.6285],
    "klg":           [1.5538, 103.6295],
    "kdse":          [1.5530, 103.6305],
    "pku":           [1.5555, 103.6330],
    "cp":            [1.5590, 103.6370],
    "n24":           [1.5600, 103.6395],
    "ktc":           [1.5612, 103.6408],
    "cluster_t02":   [1.5625, 103.6420],
    "cluster_t08":   [1.5635, 103.6430],
    "kolej_perdana": [1.5560, 103.6250],
    "kolej_9_10":    [1.5570, 103.6280],
    "ktr":           [1.5510, 103.6340],
    "ktho":          [1.5520, 103.6350],
    "ktdi":          [1.5530, 103.6360],
    "jalan_amal":    [1.5575, 103.6400],
};

const CORRIDOR_COLORS = {
    "A": "#e74c3c", "B": "#3498db", "C": "#2ecc71",
    "D": "#f39c12", "E": "#9b59b6", "F": "#1abc9c",
    "G": "#e67e22", "H": "#95a5a6"
};
```

---

## Project Folder Structure

```
utm-bus-system/
├── student-app/              # Layer 1 — React PWA
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── StopDetector.jsx
│   │   │   ├── DestinationSelector.jsx
│   │   │   ├── ETADisplay.jsx
│   │   │   ├── CapacityDisplay.jsx
│   │   │   └── BusPositionIndicator.jsx
│   │   ├── hooks/
│   │   │   ├── useGeolocation.js
│   │   │   └── useWebSocket.js
│   │   └── App.jsx
│   └── package.json
│
├── backend/                  # Layer 2 — MAS + API
│   ├── agents/
│   │   ├── base_agent.py
│   │   ├── stop_agent.py
│   │   └── bus_agent.py
│   ├── simulation/
│   │   ├── demand_engine.py
│   │   ├── campus_graph.py
│   │   └── simulation_runner.py
│   ├── api/
│   │   ├── main.py           # FastAPI
│   │   ├── mqtt_bridge.py
│   │   └── eta_calculator.py
│   └── config/
│       ├── stops.json
│       ├── corridors.json
│       └── scenarios.json
│
├── dashboard/                # Layer 3 — Fleet Dashboard
│   └── src/
│       ├── BusStatusTable.jsx
│       ├── StopStatusTable.jsx
│       ├── DecisionLog.jsx
│       ├── CampusMap.jsx
│       └── MetricsPanel.jsx
│
├── database/
│   └── utm_bus.db            # SQLite
│
└── tests/
    ├── test_stop_agent.py
    ├── test_bus_agent.py
    ├── test_graph.py
    └── test_demand_api.py
```

---

## Running Locally

```bash
# Terminal 1: MQTT broker
mosquitto -v

# Terminal 2: Backend API + MAS
cd backend && uvicorn api.main:app --reload --port 8000

# Terminal 3: Student app (dev server)
cd student-app && npm run dev   # runs on port 5173

# Terminal 4: Simulation
python backend/simulation/simulation_runner.py --scenario normal_day

# Dashboard: http://localhost:8000/dashboard
# Student app: http://localhost:5173
```
