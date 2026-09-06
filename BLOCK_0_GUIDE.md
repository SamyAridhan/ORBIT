# Block 0 — Environment & Corridor E Graph
## Instructions for Codex

Read `AGENTS_BACKEND.md` in full before starting — it has the project context, non-negotiable
rules, and the reporting protocol referenced throughout this file. This document assumes you've
already read it and won't repeat that context.

This is infrastructure work — no agent decision logic yet, so no deep testing session at the end
(that starts in Block 1). But each task still has a concrete verification step. Do not mark a
task complete without running its verification and getting the actual expected output — not
"it should work," the real output.

Work through the four tasks in order. Each is small enough to be one report-worthy unit —
finish one fully (including verification) before starting the next.

---

## Setup (once, before Task 1)

This is the existing `github.com/SamyAridhan/ORBIT` repo — **not** a new repo. `backend/` is a
new top-level folder added alongside the existing `src/` and `dashboard/` folders. Confirm you're
in the root of that repo clone before running the below (check that `src/` and `dashboard/`
already exist as siblings of where `backend/` is about to be created — if they don't, you're in
the wrong location).

```bash
mkdir -p backend/agents backend/simulation backend/api backend/config backend/tests
cd backend
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
```

Add to the repo's `.gitignore` (create it at repo root if it doesn't exist) so the venv and
Python cruft never get committed:
```
backend/venv/
__pycache__/
*.pyc
*.db
```

If this fails (wrong Python version, venv module missing, `src/`/`dashboard/` not found where
expected, etc.), report it immediately per the protocol in `AGENTS_BACKEND.md` Section 7 — don't
attempt workarounds like switching Python versions or repo locations without flagging it first,
since environment/location mismatches are worth surfacing early.

---

## Task 1 — FastAPI skeleton running

**Objective:** A minimal FastAPI app that starts and responds. Nothing functional yet — this is
just proving the server process works, since every future API endpoint (Block 6) builds on it.

**Steps:**
```bash
pip install fastapi "uvicorn[standard]"
```

Create `backend/api/main.py`:
```python
from fastapi import FastAPI

app = FastAPI(title="ORBIT MAS Backend")

@app.get("/")
async def root():
    return {"status": "ORBIT backend is alive"}
```

Run:
```bash
uvicorn api.main:app --reload --port 8000
```

**Verification:**
```bash
curl http://localhost:8000
```
Expected output: `{"status":"ORBIT backend is alive"}`

**Report if:** the server won't start, the port is already in use, or the response doesn't
match — don't debug silently past two attempts.

---

## Task 2 — Mosquitto running, one message published and received

**Objective:** Prove the MQTT broker works end to end. This is the communication backbone every
Stop Agent → Bus Agent interaction depends on later — treat this as a load-bearing check, not a
formality.

**Steps:**

Install Mosquitto:
- macOS: `brew install mosquitto`
- Ubuntu/Debian: `sudo apt install mosquitto mosquitto-clients`
- Windows: installer from https://mosquitto.org/download/

Start the broker in its own terminal/process:
```bash
mosquitto -v
```

Install the Python client:
```bash
pip install paho-mqtt
```

Create `backend/test_subscribe.py`:
```python
import paho.mqtt.client as mqtt

def on_message(client, userdata, msg):
    print(f"Received: {msg.topic} -> {msg.payload.decode()}")

client = mqtt.Client()
client.on_message = on_message
client.connect("localhost", 1883)
client.subscribe("orbit/test")
print("Listening on orbit/test...")
client.loop_forever()
```

Create `backend/test_publish.py`:
```python
import paho.mqtt.client as mqtt

client = mqtt.Client()
client.connect("localhost", 1883)
client.publish("orbit/test", "hello from bus agent")
client.disconnect()
```

**Verification:**
Run `test_subscribe.py` in one process, then `test_publish.py` in another while the first is
still running.

Expected output from `test_subscribe.py`:
```
Listening on orbit/test...
Received: orbit/test -> hello from bus agent
```

**Report if:** the broker won't start (check for a port conflict on 1883 — it may already be
running as a background service), or the subscriber never receives the message after 10+ seconds.
Don't leave these two test scripts as permanent files — delete them once verification passes,
they're scaffolding, not part of the real system.

---

## Task 3 — Corridor E graph built

**Objective:** Represent the real Corridor E stop sequence and travel times as a directed
weighted graph. Every future ETA/dispatch calculation depends on this being right — get the
stop names and directions exact.

**Steps:**
```bash
pip install networkx
```

Create `backend/simulation/campus_graph.py`:
```python
import networkx as nx

def build_corridor_e_graph() -> nx.DiGraph:
    G = nx.DiGraph()

    # (from_stop, to_stop, base_travel_minutes)
    edges = [
        ("kdoj", "klg", 3),
        ("klg", "kdse", 3),
        ("kdse", "pku", 4),
        ("pku", "cp", 5),
        ("cp", "n24", 4),
        ("n24", "ktc", 3),
        ("ktc", "cluster_t02", 4),
        ("cluster_t02", "cluster_t08", 3),
    ]

    for u, v, base_time in edges:
        G.add_edge(u, v, base_time=base_time, weight=base_time)

    return G
```

**Verification:**
```python
from simulation.campus_graph import build_corridor_e_graph
G = build_corridor_e_graph()
assert G.number_of_edges() == 8
print(list(G.edges(data=True)))
```
Expected: no assertion error, and 8 edges printed with correct stop names and `base_time` values
matching the list above exactly.

**Report if:** stop names don't match what's used elsewhere in the project (e.g. if you've seen
`stops.json` or another config using different naming/casing) — naming consistency across the
codebase matters more than it looks like it should, since a typo here silently breaks every
downstream lookup.

---

## Task 4 — `get_eta()` returns correct values

**Objective:** First real computed output from the system — proof the graph is traversable and
weighted correctly, not just structurally present.

**Steps:**
Add to `backend/simulation/campus_graph.py`:
```python
def get_eta(G: nx.DiGraph, source: str, target: str) -> float:
    """Returns estimated travel time in minutes via Dijkstra shortest path."""
    try:
        return nx.dijkstra_path_length(G, source, target, weight="weight")
    except nx.NetworkXNoPath:
        return float("inf")
```

**Verification:**
```python
from simulation.campus_graph import build_corridor_e_graph, get_eta

G = build_corridor_e_graph()
eta = get_eta(G, "kdoj", "cluster_t02")
assert eta == 26, f"Expected 26, got {eta}"
print(f"KDOJ -> Cluster T02: {eta} minutes")
```

**Expected output:** `KDOJ -> Cluster T02: 26 minutes`

Hand-check: KDOJ→KLG(3) + KLG→KDSE(3) + KDSE→PKU(4) + PKU→CP(5) + CP→N24(4) + N24→KTC(3) +
KTC→ClusterT02(4) = **26**. If your output doesn't match, the bug is almost certainly in the
edge list from Task 3, not in Dijkstra itself — check there first.

**Report if:** the assertion fails after checking the edge list — this is exactly the kind of
"verification fails twice" case that should be reported rather than worked around.

---

## Block 0 Completion Report

Once all four tasks pass verification, produce one consolidated report (not four separate ones)
using the format from `AGENTS_BACKEND.md` Section 7:

```
## Block: 0 — Environment & Corridor E Graph
Status: Complete

What I did:
- [one line per task]

Verification output:
- Task 1: [curl output]
- Task 2: [subscribe output]
- Task 3: [edge list output]
- Task 4: [eta output]

Deviations / assumptions:
-

Questions or concerns for Claude:
-
```

Do not update `12_BUILD_MILESTONES.md` yourself — hand this report back so Claude can review it
against the milestone file and confirm before it gets checked off. This keeps one shared source
of truth instead of two versions drifting apart.

---

## Troubleshooting Reference

- **Mosquitto "address already in use":** it's likely already running as a background service —
  check before assuming the install failed.
- **`ModuleNotFoundError`:** venv probably isn't activated in the current terminal.
- **`get_eta` returns `inf`:** a stop-name mismatch between the edge list and the function call —
  check exact spelling/case/underscores.

If none of these explain a failure after a genuine attempt, that's a "report, don't guess" moment
per the protocol — better to surface a real blocker than to silently paper over it with an
untested workaround.
