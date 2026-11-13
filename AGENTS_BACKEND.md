# AGENTS_BACKEND.md — ORBIT MAS backend: conventions, layout, pointers
> Rewritten 13 Nov 2026. This file governs `backend/` only. It is deliberately short: **the rules
> live in the modules** (`docs_modules/01_AGENT_DESIGN.md`, `14_SYSTEM_REQUIREMENTS.md`) and the
> digest in `backend/CLAUDE.md`. Nothing here restates a rule, so there is one less place to go stale.
> Sibling files `AGENTS.md` (student PWA) and `AGENTS_DASHBOARD.md` (dashboard) are not touched by
> backend work.

---

## 1. Read these, in this order

| File | Why |
|---|---|
| `docs_modules/00_MASTER_CONTEXT.md` | Always-load project context. The modules dated 13 Nov 2026 win over anything older. |
| `docs_modules/13_GIT_PERSISTENCE_PROTOCOL.md` | Fetch first, push last, "reported" vs "confirmed". Do this before trusting local `git`. |
| `docs_modules/12_BUILD_MILESTONES.md` | Which task is next. Never tick a box yourself. |
| `backend/CLAUDE.md` | The rule digest, auto-loaded. |
| `docs_modules/01_AGENT_DESIGN.md` | Full agent spec, message topics, test cases TC101+. |
| `docs_modules/14_SYSTEM_REQUIREMENTS.md` | Requirement IDs that tasks and tests point at. |
| `docs_modules/05_GROUNDING_CHECKLIST.md` | Before any design decision; Trap 11 (compression) and Trap 12 (old rules). |
| `docs_modules/02_…`, `03_…` | Route map, data files, simulator; API, message shapes, folder layout. |

If a task needs detail these don't have, say so in the report rather than guessing.

---

## 2. Roles and how we work

- **Coddy** = Claude Code (this side). Executes in the repo, sees real output. **Chatty** = the claude.ai
  Project chat. Holds the design context, cannot read this disk. **Samy** relays between them and decides.
- One task at a time. Stop at each task's verification step with real output; Samy relays it for review
  before the next task. Don't half-build several tasks.
- Unit tests with every task. The Testing Session (coverage, Hypothesis, mutation run, flaky check) is at
  the **end of each block**, not after each task.
- Flag, don't guess: an ambiguity the spec doesn't cover, a verification that fails twice, a task prompt
  that seems to contradict a module, or a cleaner alternative — all go in the report, plainly, as a peer
  would say it. State a low-risk assumption and proceed; stop on a high-risk one.
- Report format (paste-friendly for relaying to Chatty):

```
## Task: [name]
Status: Complete / Blocked / Question
Committed as <hash> on <branch>, pushed: yes/no

What I did:
-
Verification output:
[real command output]
Deviations / assumptions:
-
Questions or concerns for Chatty:
-
```

- Topic, event and endpoint names in modules 01/03 are proposals. If you change one, say so in the report.

---

## 3. Chatty/Coddy context sync protocol

Any change Coddy makes to a `docs_modules/*.md` file reaches Chatty only when Samy re-uploads that file
into the Project. There is no automation. So every session that modifies a `docs_modules/` file **must
end** with:

```
===== CONTEXT SYNC REQUIRED =====
Re-upload these files into the claude.ai Project (Chatty), then tell Chatty what changed:
  - <filename> — <one-line summary of change>
If a file below was already re-uploaded in a previous session, skip it.
=================================
```

If no `docs_modules/` file changed, say `No context sync required — no docs_modules files modified.`
Files that came *from* Chatty's own set, copied in unedited, do not need a sync. Coddy cannot know what
Samy last uploaded; if the baseline is ambiguous, list everything changed in recent commits and say so.

---

## 4. Folder layout (matches `03_DASHBOARD_AND_INTEGRATION.md`)

One repo, `github.com/SamyAridhan/ORBIT`. `backend/` sits beside `src/` and `dashboard/`. Flat imports
from `backend/` (`from agents.stop_agent import …`); no `__init__.py`. Run everything from `backend/`.

```
backend/
├── agents/
│   ├── stop_agent.py           # built (Task 1; 2R/3R rework)
│   ├── bus_agent.py            # Block 3
│   └── coordinator.py          # Block 4 / 9
├── demand/                     # ORBIT's own schedule model: the `expected` number (not the simulator)
├── simulation/                 # the outside world: crowd generator, injector, scenarios, runner
│   ├── campus_graph.py         # built (Bus E, N24 path); second path + return leg in Block 2
│   ├── demand_engine.py
│   ├── injector.py
│   ├── scenarios.py
│   └── simulation_runner.py
├── api/
│   ├── main.py                 # skeleton built
│   ├── mqtt_bridge.py
│   ├── eta.py
│   └── trip_plan.py
├── reports/                    # planning reports (Block 8)
├── config/                     # data, not code: stops, routes, timetable_<sem>.json, fleet.json,
│                               # scenarios.json, thresholds (placeholders, marked as such)
├── tests/                      # pytest; test_<module>.py
├── venv/                       # gitignored
└── requirements.txt            # pinned; add a dependency only when a task calls for it, and say so
```

**`agents/` never imports from `simulation/`.** The simulator feeds the system through the same
interfaces real sources would use; agent code must not know the simulator exists.

---

## 5. Code conventions

- Python 3.11+ (the suite has passed on 3.11.18 and 3.12.10; no repo pin). Type hints on signatures.
- Docstrings name the module section and test case or requirement a function satisfies
  (`"""Implements 01 Stop Agent Rule 3; TC108."""`).
- Small, single-responsibility, pure where possible — this code is a testbed for Hypothesis and mutation
  testing; hard-to-test code is counterproductive here, not just untidy.
- No premature abstraction: build for Bus B, E, F. Bus E first.
- Placeholder numbers live in one place (`config/`), commented as placeholders, never scattered as magic
  numbers and never presented as settled.
- System Development track language in code and comments: requirements met, test cases passed. No
  "hypothesis", "prove", "significant".
- Don't touch `src/`, `dashboard/`, `AGENTS.md`, `AGENTS_DASHBOARD.md`, the context_modules folders or the
  submitted thesis unless a task says so.
- Every commit message says what task it is. Every report says the branch and "pushed: yes/no".

Local run (once the pieces exist): `mosquitto -v` · `cd backend && uvicorn api.main:app --reload --port 8000`
· `cd backend && python -m pytest`.
