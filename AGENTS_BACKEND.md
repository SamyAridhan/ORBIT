# AGENTS_BACKEND.md
> Instruction file for Codex (or any coding agent) working on the ORBIT MAS backend.
> This is a sibling file to `AGENTS.md` (student PWA) and `AGENTS_DASHBOARD.md` (fleet dashboard) —
> those two govern the existing frontend prototypes and are NOT to be touched by backend work.
> This file governs `backend/` only: agents, simulation, API, MQTT.
> Read this file fully before writing any code. If anything here conflicts with a specific
> task prompt you're given, the task prompt wins for that task, but flag the conflict in your
> report — it usually means this file needs updating.

---

## 1. What ORBIT Is (30 seconds)

ORBIT — On-Demand, Route-Based Intelligent Transit System — is a UTM Skudai Final Year Project.
It's a three-layer system:

```
Student App (PWA)  →  MAS Backend (you are building this)  →  Fleet Dashboard
     [built]              [NOT BUILT YET]                        [built, being reworked]
```

Students at a bus stop signal "I'm waiting for Bus E." A Multi-Agent System (Stop Agents +
Bus Agents, talking over MQTT) decides whether a bus should adjust its timing in response.
A fleet manager watches everything happen on a dashboard.

**The one-sentence pitch:** buses don't reroute and don't change their stops — they only ever
adjust *when* they leave, based on real-time demand signals, using autonomous agent coordination
instead of a central scheduler.

---

## 2. Why This Matters / The Actual Problem Being Solved

UTM students at certain stops (especially KDOJ, on Bus E's corridor) face unpredictable bus
frequency and overcrowding. A separate, real, funded UTM research project (PAJ-funded,
led by the supervisor's research team, RM188,127, 2026–2028) is already deploying GPS trackers
on buses — but that project only makes buses **visible** (you can see where the bus is). It does
**not** make them **intelligent** (nobody knows how many students are waiting, and buses don't
adjust their behavior based on demand). ORBIT is designed to be the intelligence layer that sits
on top of that visibility infrastructure.

This matters for how you write code: every design decision should be defensible as "this makes
the bus demand-responsive," not "this makes the bus fancier." If you're ever unsure whether a
feature belongs, ask: does this help a Stop Agent or Bus Agent make a better timing decision?
If not, it's probably out of scope.

---

## 3. Where We Are Right Now

- **Student PWA:** built, working prototype, UX considered close to final. Lives in `src/`.
  **Do not modify** unless a task explicitly says to.
- **Fleet Dashboard:** built, working prototype, still being reworked for layout/content.
  Lives in `dashboard/`. **Do not modify** unless a task explicitly says to.
- **MAS Backend (`backend/`):** does not exist yet. This is what you're building. Nothing in
  `backend/` should be assumed to exist until a previous task has created it — check the repo
  state, don't assume.

**Source of truth for exact progress:** `12_BUILD_MILESTONES.md`. It has a checklist broken into
Blocks 0–10. Before starting any task, check which boxes are already ticked. After finishing a
task, do not tick the box yourself — report completion (see Section 7) and let Samy/Claude update
the milestone file, since that file is the shared continuity mechanism across sessions and tools.

---

## 4. Non-Negotiable Rules

These are not style preferences — violating them means the work has to be redone. If a task
prompt ever seems to ask for one of the "never" items below, stop and flag it rather than
proceeding — it's more likely a miscommunication than an intentional scope change.

| Rule | Detail |
|---|---|
| **No rerouting** | Buses never change corridors or stops. Bus E stays on Corridor E, always. |
| **Exactly two interventions** | Bus Agent may choose **Hold** (bus ahead of schedule) or **Early Departure** (bus idle at terminus, last resort). Nothing else. |
| **Arrival compression is forbidden** | This was a removed design error — reducing dwell time at stops to save 5–15 seconds. Do not implement it, reference it, or create anything named `*compression*` or `ARRIVAL_COMPRESSION*` anywhere — code, comments, tests, log strings, or variable names. If you're not sure why, see `05_GROUNDING_CHECKLIST.md` Trap 11 (ask for it if not provided). |
| **"No safe intervention" is a valid, correct outcome** | A bus that's COMMUTING and on-time/behind schedule, facing high demand ahead, has no timing lever. Log `NO_INTERVENTION_AVAILABLE`. Do not invent a workaround to "solve" this case. |
| **Interchange stops never dispatch** | CP and Jalan Amal are waypoints only. Their Stop Agent instances must never broadcast a dispatch signal, regardless of queue size. |
| **Early departure is bounded** | Terminus only. Requires headway gap ≥ 15 min from the previous bus. Capped at 8 min early. Utility score must be ≥ 0.6. All four conditions, every time. |
| **Only one AI/ML component** | Isolation Forest, inside the Stop Agent, for demand-signal anomaly detection only. It flags implausible input; it never predicts demand, never influences routing or dispatch decisions. No other ML/AI anywhere in this codebase. |
| **Corridor filter first** | A Bus Agent must ignore any signal from a stop not on its own corridor, before checking anything else. |
| **Claim-lock, not race conditions** | When multiple Bus Agents on the same corridor could respond to the same demand signal, exactly one must claim it. Never both, never neither. This is a concurrency-correctness requirement, not just a logic nicety — treat it with the seriousness of a race condition bug, because it is one. |

**Placeholder values — use them, but mark them as placeholders:**

| Value | Current placeholder | Status |
|---|---|---|
| Bus capacity | 28 seats | Not finalized, verify with UTM Fleet eventually |
| Missed-bus re-signal weight | 1.5× | Reasonable guess, not derived |
| Early departure min headway gap | 15 min | Loosely grounded, tune during development |
| Early departure max advance | 8 min | Loosely grounded, tune during development |
| Capacity lock threshold | 85% | No grounding, placeholder |
| Protected time window | 12 min before lecture slot | No grounding, placeholder |
| Min headway between any two buses | 5 min | No grounding, placeholder |
| Utility score threshold | 0.6 | No grounding, placeholder |

When you hardcode these, put them in one obvious constants location (e.g. a `config/thresholds.py`
or similar) with a comment noting they're placeholders — not scattered as magic numbers through
the logic. This makes them easy to tune later without hunting through files.

---

## 5. Architecture You're Building

### 5a. Whole-Repo Structure (this is ONE repo — `github.com/SamyAridhan/ORBIT`)

This is not a new/separate repo. `backend/` is a new top-level folder added alongside the
frontend folders that already exist. Everything outside `backend/` and `docs_modules/` is
someone else's territory (see Section 9) — know where the boundary is before touching anything.

```
ORBIT/                          # single repo, root
├── AGENTS.md                   # Student PWA build brief — NOT backend's concern
├── AGENTS_DASHBOARD.md         # Dashboard build brief — NOT backend's concern
├── AGENTS_BACKEND.md           # THIS FILE — backend's brief
├── context_modules/            # Student PWA design context (00–06)
├── dashboard_context_modules/   # Dashboard design context (00–05)
├── docs_modules/                # Mirror of the 00–12 + ARCHIVE context modules
│                                # (project-wide design docs — read, don't edit, unless a
│                                #  task explicitly says a module needs updating)
├── src/                         # Student PWA source (React 18 + Vite + Tailwind) — DO NOT TOUCH
├── dashboard/                   # Fleet Dashboard source (React 18 + Vite) — DO NOT TOUCH
├── public/, assets/             # PWA icons, manifest, animations — DO NOT TOUCH
│
├── backend/                     # ← YOU ARE BUILDING THIS
│   ├── venv/                    # gitignored, local only
│   ├── agents/
│   │   ├── base_agent.py
│   │   ├── stop_agent.py
│   │   └── bus_agent.py
│   ├── simulation/
│   │   ├── demand_engine.py
│   │   ├── campus_graph.py
│   │   └── simulation_runner.py
│   ├── api/
│   │   ├── main.py              # FastAPI
│   │   ├── mqtt_bridge.py
│   │   └── eta_calculator.py
│   ├── config/
│   │   ├── stops.json
│   │   ├── corridors.json
│   │   └── scenarios.json
│   ├── tests/                   # pytest tests live HERE, not at repo root — see note below
│   │   ├── test_stop_agent.py
│   │   ├── test_bus_agent.py
│   │   ├── test_graph.py
│   │   └── test_demand_api.py
│   └── requirements.txt         # pin versions as dependencies are added
│
├── database/                    # NEW — will hold utm_bus.db (SQLite), created in a later block
│
├── .gitignore                   # make sure backend/venv/, __pycache__/, *.db are ignored
└── 12_BUILD_MILESTONES.md       # if kept at root rather than inside docs_modules/ — confirm
                                  # with Samy which location is authoritative before assuming
```

**Note on `tests/` location — a deliberate deviation from `03_DASHBOARD_AND_INTEGRATION.md`:**
that module's idealized structure puts a single `tests/` folder at repo root. In practice,
`backend/tests/` is being used instead, since the Python venv, pytest config, and coverage/
mutation tooling (MutPy, Hypothesis) all live inside `backend/` — keeping tests there avoids
mixing Python test config with the frontend's own `npm test` setup. If this causes friction with
existing repo conventions, flag it rather than silently picking one.

### 5b. `backend/` Internals (detail view)

```
backend/
├── agents/
│   ├── base_agent.py
│   ├── stop_agent.py
│   └── bus_agent.py
├── simulation/
│   ├── demand_engine.py
│   ├── campus_graph.py
│   └── simulation_runner.py
├── api/
│   ├── main.py           # FastAPI
│   ├── mqtt_bridge.py
│   └── eta_calculator.py
└── config/
    ├── stops.json
    ├── corridors.json
    └── scenarios.json
```

**Two agent types:**
- **Stop Agent** (reactive) — one per corridor-stop pair. Watches demand, classifies it
  (LOW/MEDIUM/HIGH/CRITICAL), broadcasts over MQTT when relevant.
- **Bus Agent** (deliberative) — one per physical bus. Listens to Stop Agent broadcasts on its
  own corridor, runs a six-step constraint check, decides Hold / Early Departure / no
  intervention, executes, logs.

**Communication:** MQTT (Eclipse Mosquitto). Full topic schema and QoS levels are in
`01_AGENT_DESIGN.md` — request it if you don't have it loaded for a given task.

**Scope for simulation:** three corridors only — Bus B, E, F. Corridor E (KDOJ → Faculty
Cluster) is being built first — it's the highest-demand, most complex corridor, and is treated
as the reference implementation the other two will follow.

---

## 6. How We Work — Process, Not Just Code

- **Task-based milestones, not time-based.** Nobody's working to a deadline within a session —
  work happens in irregular weekend blocks. `12_BUILD_MILESTONES.md` breaks work into small,
  closeable tasks (usually one task = one test case, e.g. TC12, TC02). Do one task fully —
  implementation + unit tests — before moving to the next, rather than half-building several.
- **Unit tests are written alongside every task, always** — this is baseline hygiene, not
  optional. A task isn't "done," only "implemented," until it has a passing test.
- **Deeper testing sessions happen at block boundaries, not after every task.** Coverage checks,
  Hypothesis property-based tests, and mutation testing (MutPy or cosmic-ray) are run once a
  whole block (e.g. all four constraint-hierarchy steps) is implemented — not piecemeal. Don't
  set these up mid-task unless a task prompt specifically asks for it.
- **This is a System Development track FYP, not a research track one.** Avoid research-flavored
  language in comments/docs ("we hypothesize," "prove," "statistically significant"). Frame
  things as functional requirements and test cases passing.

---

## 7. Communication Protocol — When and How to Report Back

You (Codex) and Claude are both working on this project from different vantage points — Claude
holds the full design context and history across many past conversations; you have direct
execution access to the code, terminal, and real error output that Claude never sees. Neither of
you should treat the other as just an instruction-follower. Flag disagreements, alternate
approaches, or concerns as an engineer would to a peer — plainly, with reasoning, without
excessive hedging.

**Report progress back (via Samy, who relays between you and Claude) at these points:**

1. **A task is fully complete** — implementation + tests passing. Include: what you built, the
   verification output (actual command output, not a paraphrase), and any deviation from the
   guide and why.
2. **You're blocked or a verification fails twice in a row.** Don't keep guessing past two failed
   attempts at the same problem — report what you tried, the actual error, and your best guess
   at the cause, and wait for input rather than working around it silently.
3. **You hit an ambiguity or a design decision the spec doesn't cover.** Example: "the spec says
   `hold_minutes = schedule_deviation (max 5 min)` but doesn't say what happens if
   `schedule_deviation` is negative — I assumed X, flagging in case that's wrong." State your
   assumption, proceed if the assumption is low-risk and reversible, but always surface it.
4. **You notice something in this file or the task prompt that seems inconsistent with itself
   or with a rule in Section 4.** Say so directly — "Section 4 says X, but this task asks for Y,
   which seems to violate it" — rather than silently picking one.
5. **You have a genuine alternative-approach suggestion.** If you think a cleaner or more
   testable structure exists than what a task prompt specifies, say so as a suggestion with
   reasoning, implement what was asked if it's not blocking, and let the human/Claude decide
   whether to take the suggestion for the next task.

**Don't report:** routine sub-steps within a task (e.g., "I created the file, now writing the
function, now testing it") — only the task-level outcome. Keep reports information-dense, not a
narrated log.

**Report format (copy-paste friendly for relaying to Claude):**
```
## Task: [name]
Status: Complete / Blocked / Question

What I did:
-

Verification output:
[paste actual output]

Deviations / assumptions:
-

Questions or concerns for Claude:
-
```

---

## 8. Code Quality Expectations

- Python 3.11+, type hints on function signatures, docstrings that reference which spec module
  and test case a function satisfies (e.g. `"""Implements Step 2 capacity check, see TC02."""`).
- Small, single-responsibility functions — favor something that's easy to property-test over
  something clever. This codebase is being used as a real testbed for mutation testing and
  Hypothesis-based property testing (see `11_TESTING_QA_JBAGENTIC.md` if you need the full
  context) — code that's hard to test is actively counterproductive here, not just untidy.
- No premature abstraction. Build for the three corridors (B, E, F) actually in scope — don't
  generalize for corridors that aren't being modeled.
- Match the folder structure in Section 5 — don't reorganize it without flagging why first.
- Comment placeholder constants as placeholders (Section 4) — don't let them look authoritative.

---

## 9. What NOT to Touch

- `src/` (student PWA) and `dashboard/` (fleet dashboard) — separate prototypes, separate
  `AGENTS.md` / `AGENTS_DASHBOARD.md` instruction files govern those. Backend tasks don't modify
  frontend code unless a task explicitly says to (this will happen eventually — see Block 9,
  prototype reconciliation — but not yet).
- The submitted PSM1 thesis PDF — not part of this repo's editable scope at all.
- Don't add dependencies outside what a task calls for without flagging it — new packages have a
  way of becoming permanent architecture decisions by accident.

---

## 10. If You Need More Context

This file is meant to be self-contained enough for day-to-day task execution, but it's a summary
of a larger set of design documents. If a task requires detail this file doesn't have (exact MQTT
topic schema, full demand simulation logic, the complete black-box test case list, etc.), say so
in your report rather than guessing — the full modules (`01_AGENT_DESIGN.md` through
`12_BUILD_MILESTONES.md`) exist and can be provided.

---

## 11. Chatty/Coddy Context Sync Protocol

**This is a standing protocol for every session, not a one-off.** Read it and honor it.

**Roles:**
- **Coddy** = Claude Code (the execution side — me). Works directly on local disk in this repo,
  runs the terminal, sees real command output and errors.
- **Chatty** = the claude.ai Project chat (the design-context + review side). Holds the full
  design history across many conversations, but **cannot read this disk**. Chatty only ever sees
  a `docs_modules/` file when Samy **manually uploads** it into the claude.ai Project Knowledge.

**The hard constraint:** any change Coddy makes to a `docs_modules/*.md` file does **not** reach
Chatty automatically. There is no sync automation — it is a manual drag-and-drop re-upload by
Samy. If Samy forgets, Chatty reviews against a stale copy and the two sides silently drift apart.

**The rule:** whenever a session modifies **any** file under `docs_modules/`, that session
**MUST** end with an explicit `CONTEXT SYNC REQUIRED` notice to Samy, in this format:

```
===== CONTEXT SYNC REQUIRED =====
Re-upload these files into the claude.ai Project (Chatty), then tell Chatty what changed:
  - <filename> — <one-line summary of change>
  - <filename> — <one-line summary of change>
If a file below was already re-uploaded in a previous session, skip it.
=================================
```

The notice must list: (a) each `docs_modules/*.md` file changed this session, (b) a one-line
summary of what changed in each, and (c) the explicit instruction — shown above — for Samy to
re-upload exactly those files into claude.ai Project Knowledge and tell Chatty what changed.

**If NO `docs_modules/*.md` file was changed in a session,** the session must still say so
explicitly — `No context sync required — no docs_modules files modified.` — so the absence is a
deliberate, verified statement rather than a forgotten step.

Coddy cannot determine what Samy last uploaded to Chatty (the repo holds no synced-point marker).
If the last-synced point is genuinely ambiguous, say so and list all `docs_modules/*.md` modified
in the recent commits so Samy can decide — do not silently guess a sync baseline.
