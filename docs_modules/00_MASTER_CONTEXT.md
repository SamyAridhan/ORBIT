# PSM1 Master Context — ORBIT
> **Load this file FIRST in every new chat session. It is the single source of truth.**
> Last updated: June 2026 — Chapters 3, 4, 5 and Abstract/Abstrak drafted and refined. SRS v1.1 finalised. SDD v1.0 / STD v1.0 drafted, not yet finalised. Diagrams in progress.
> Redundant detail sections compressed — full specs live in their dedicated modules (see index below).

---

## ⚠️ Phase Correction (read this first)

**This project is currently in PSM1, not PSM2.** Earlier versions of this file and `04_REPORT_WRITING_GUIDE.md` incorrectly labelled the current semester "PSM2" — that was wrong and has been corrected throughout. The evidence: the SRS cover page reads "SECJ 3032: Software Engineering FYP1, Semester 01, 2026/2027"; the supervisor-guideline document confirms the PSM1 Final Report is due **Week 15 / 25 June 2026**; and the project's own Gantt chart places "PSM1 Final Report" as a milestone inside Phase 1 (April–July 2026), with PSM2 deferred to **March–July 2027**, after an industrial training placement.

**Course/track:** SECJ3032 — Software Engineering FYP1 (this semester) → FYP2 / PSM2 (March–July 2027). Semester 01, 2026/2027. System Development track.

**What this means practically:**
- PSM1 deliverables: full 5-chapter report (Intro, Lit Review, Methodology, Design, Conclusion), plus SRS + SDD + STD as appendices, due 25 June 2026.
- PSM1 does **not** include implementation-completed claims, test execution results, or working-system results. The student app prototype targeted for the PSM1 final presentation is a partial, in-progress deliverable (Sprints P1.S1–P1.S4) — not a finished build.
- PSM2 (full implementation, integration, GPS live data, black-box test execution, final demo) does not begin until March 2027, after a September 2026 – February 2027 industrial training placement during which only weekend-pace development happens.

If any other context module or earlier conversation in this project refers to "PSM2 active" or assumes immediate continuation after this submission, that's the error this section corrects.

---

## What This Project Is

**System Name:** ORBIT — On-Demand, Route-Based Intelligent Transit System
**Report Title:** ORBIT: On-Demand, Route-Based Intelligent Transit System
**Course:** SECJ3032, Software Engineering FYP1, Semester 01 2026/2027
**University:** UTM, Skudai, Johor Bahru
**Track:** System Development (NOT Research-based)
**Supervisor:** Dr Sim Hiew Moi (named researcher on UTM's PAJ-funded Smart Bus IoT project)
**PSM1 Final Submission Deadline:** Week 15 / 25 June 2026

---

## ⚡ Real-World Institutional Context

Dr. Sim is named researcher on the PAJ-funded UTM Smart Bus IoT-GPS project (RM188,127, July 2026–June 2028). That project delivers GPS tracking + ETA prediction (LightGBM/XGBoost) + PIDS screens + passenger app. It does NOT deliver: student demand sensing, autonomous dispatch decisions, agent coordination.

```
PAJ project: "Where is the bus?"
ORBIT:        "What should the bus DO about where the students are?"
```

> Full detail → **09_SUPERVISOR_PROJECT_REFERENCE.md**

---

## One-Sentence Description

> "ORBIT is a three-layer campus transit system: students signal demand via a PWA, a MAS backend coordinates bus dispatch timing via MQTT, and a fleet manager dashboard shows everything live — without changing routes or requiring new hardware."

---

## ⚠️ Critical Design Principles — Non-Negotiable

1. **Buses stay on corridors.** No cross-corridor rerouting. Ever.
2. **Timing adjustment only:** compression → hold → early departure (last resort), governed by a **six-step constraint hierarchy** (corridor filter → capacity check → protected-time check → claim check → intervention selection → overflow flag). Not rerouting.
3. **Early departure:** terminus only, headway gap ≥ 15 min, max 8 min, utility ≥ 0.6.
4. **Interchange stops (CP, Jalan Amal):** waypoints only, no dispatch signals ever.
5. **App participation is voluntary.** Graceful degradation to schedule-based estimation below 30% adoption.
6. **Agents are rule-based.** Isolation Forest is the only approved AI component — signal integrity only.
7. **Methodology: Agile only.** No Waterfall.
8. **Three corridors in simulation:** Bus B, E, F.

> **⚠️ Known cross-document bug — "five-step" vs "six-step":** the Bus Agent constraint hierarchy is six steps, not five. This wording error ("five-step constraint hierarchy") has been found and fixed in the refined Chapter 3 and Chapter 4 drafts, but as of last check it is **still present and uncorrected** in the actual STD document (page 3, overview paragraph: "...within a strict five-step constraint hierarchy"). Check the SDD too — it has not yet been checked for this specific phrase. Fix at the source (STD/SDD) before final compilation, not just in the thesis chapters.

---

## Finalised Use Case Map (Panel-Accepted — Do Not Change)

| Package | UC | Name | Actor | Key Relationship |
|---|---|---|---|---|
| Student PWA | UC1 | Detect Nearby Bus Stop | Student | — |
| Student PWA | UC2 | Submit Bus Demand Signal | Student | includes UC5 |
| Student PWA | UC3 | View Real-Time Bus Status | Student | — |
| Student PWA | UC4 | Respond to Bus Boarding Prompt | Student | extends UC2 |
| MAS Backend | UC5 | Validate Demand Signal Integrity | Stop Agent | included by UC2 |
| MAS Backend | UC6 | Report High Stop Demand | Stop Agent | includes UC7 |
| MAS Backend | UC7 | Determine New Dispatch Time | Bus Agent | included by UC6; includes UC8 |
| MAS Backend | UC8 | Adjust Bus Dispatch Timing | Bus Agent | included by UC7; extended by UC11, UC12 |
| MAS Backend | UC9 | Update Bus Capacity Status | Bus Agent | — |
| Fleet Dashboard | UC10 | Track Fleet Operations | Fleet Manager | — |
| Fleet Dashboard | UC11 | Override Dispatch Decision | Fleet Manager | extends UC8 |
| Fleet Dashboard | UC12 | View Bus Capacity Overflow Alerts | Fleet Manager | extends UC8 |

**Critical:** UC12 extends UC8 (not UC9). UC9 stands alone. UC7 includes UC8.

---

## Sequence Diagram Coverage — Corrected (Two-Tier Structure)

Earlier guidance in this project (including a now-corrected entry in `05_GROUNDING_CHECKLIST.md`) claimed the SDD's five sequence diagrams alone covered all twelve use cases, with UC1/UC9/UC10/UC12 having no sequence diagram. **This was checked against the actual SRS PDF and found to be wrong.**

The real structure: the **SRS gives every one of the 12 use cases its own dedicated sequence diagram** (Figures 2.4.1b through 2.4.12b, one per user story, captioned "Sequence Diagram for USxxx"). The **SDD then layers five additional composite/direct diagrams on top of this** for the most operationally significant flows:

| UC | SRS Sequence Diagram (dedicated) | SDD Sequence Diagram |
|---|---|---|
| UC1 | Figure 2.4.1b | — |
| UC2 | Figure 2.4.2b | SD001 (composite, with UC5) |
| UC3 | Figure 2.4.3b | SD003 (direct reuse) |
| UC4 | Figure 2.4.4b | SD004 (direct reuse) |
| UC5 | Figure 2.4.5b | SD001 (composite, with UC2) |
| UC6 | Figure 2.4.6b | SD002 (composite, with UC7, UC8) |
| UC7 | Figure 2.4.7b | SD002 (composite, with UC6, UC8) |
| UC8 | Figure 2.4.8b | SD002 (composite, with UC6, UC7) |
| UC9 | Figure 2.4.9b | — |
| UC10 | Figure 2.4.10b | — |
| UC11 | Figure 2.4.11b | SD005 (direct reuse) |
| UC12 | Figure 2.4.12b | — |

Every use case has complete sequence-level coverage at the SRS layer; the SDD's five diagrams are an additional consolidated view, not a narrower replacement. This is the version now reflected in the refined Chapter 4 (Table 4.2). **`05_GROUNDING_CHECKLIST.md`'s old "Trap 8" entry, which claimed SD002 covers UC9 and UC12, is incorrect and has been corrected in that file.**

---

## PSM1 Progress 2 — Document Inventory

### Thesis Chapters (Progress 2 drafting and refinement)
| File | Contents | Status |
|---|---|---|
| Chapter 1 (Introduction) | Problem background, aim, 3 objectives (a/b/c), scope | ✅ Written (in the actual thesis PDF, not yet re-checked against this session's other corrections) |
| Chapter 2 (Literature Review) | Lit review, PAJ-project related work, research gap | ✅ Written (not reviewed in this session) |
| `Chapter3_System_Development_Methodology.md` | Methodology, Agile justification, 3-phase/10-sprint Gantt, tech stack, hw/sw requirements | ✅ Substantially rewritten this session — see Chapter 3 module deliverable |
| `Chapter4_Requirement_Analysis_and_Design.md` | UC analysis, sequence diagram coverage, architecture, class diagram, normalised DB schema (PK/FK), interface design, navigation flows | ✅ Substantially rewritten this session — see Chapter 4 module deliverable |
| `Chapter5_Conclusion.md` | PSM1 achievements per objective, PSM2 execution plan referencing Figure 3.1 | ✅ Drafted this session — **§5.2 has a placeholder for actual Student PWA prototype status (in progress vs complete) that must be confirmed before submission** |
| `Abstract_and_Abstrak.md` | English Abstract + Malay Abstrak, single paragraph each, 7 required content elements | ✅ Drafted this session |

### SRS / SDD / STD
| File | Status |
|---|---|
| SRS (Software Requirements Specification) | ✅ v1.1 finalised — 12 user stories, panel-accepted 12-UC diagram, 12 dedicated sequence diagrams, full NFR and design constraint sections |
| SDD (Software Design Document) | 🟡 v1.0 drafted, not yet finalised — nine viewpoints, 5 consolidated sequence diagrams (SD001–SD005) |
| STD (Software Testing Document) | 🟡 v1.0 drafted, not yet finalised — 12 test cases / 36 sub-cases, traceability matrix. **Contains the uncorrected "five-step" wording bug (page 3 overview) — needs fixing.** |

### Diagrams (Draw.io)
| File | Diagram | Status |
|---|---|---|
| `ORBIT_Architecture_Diagram.xml` | Three-layer system architecture | ✅ Updated this session — added `demand/signal (QoS 1)` MQTT topic, added `GET /api/position/{bus}` endpoint, fixed the broker from a floating/disconnected box to the correctly-wired central hub (API Server → Broker → Agents, no direct API↔Agent channel) |
| `ORBIT_Activity_Diagram.xml` | Bus Agent constraint hierarchy | 🟡 **Outstanding manual fix flagged**: still labels a 5-step process where the spec is 6 steps. User fixing manually. |
| `ORBIT_Class_Diagram.xml` | SDD-level domain model (extended: adds methods, `FleetDashboard`, `MQTTBroker`) | ✅ Done — **use this one for Chapter 4, not the SRS domain model** (SRS's is the requirements-stage version; SDD's is the design-stage version Chapter 4's Table 4.3 actually matches) |
| `ORBIT_Component_Diagram.xml` | SDD 5.3 — subsystems | ✅ Done |
| `ORBIT_Package_Diagram.xml` | SDD 5.7 — package dependencies | ✅ Done |
| `ORBIT_ERD.xml` | SDD 5.5 / Ch4 Figure 4.4 | ✅ Done |
| `ORBIT_SD001_Combined.xml` | SD001 — UC2+UC5 composite | ✅ Done |
| `ORBIT_PWA_Navigation.xml` | Ch4 Figure 4.10 | ✅ Done per earlier inventory — **now referenced as a real figure in the refined Chapter 4**; confirm it's actually inserted before final compilation |
| `ORBIT_Dashboard_Navigation.xml` | Ch4 Figure 4.12 | ✅ Done per earlier inventory — same confirmation needed |
| Screen wireframes ×5 | Ch4 Figures 4.5–4.9 | 🟡 Status not re-confirmed this session — check before compilation |

### Diagrams Reused Directly from SRS
| SRS Source | Used As | Notes |
|---|---|---|
| Use Case Diagram | Ch4 Figure 4.1 + SDD 5.2 | Copy directly |
| State Machine Diagram | SDD 5.9 | Copy directly |
| SRS Figure 2.4.3b | SDD SD003 / Ch4 (UC3 sequence) | Relabel only |
| SRS Figure 2.4.4b | SDD SD004 / Ch4 (UC4 sequence) | Relabel only |
| SRS Figure 2.4.11b | SDD SD005 / Ch4 (UC11 sequence) | Relabel only |

---

## Chapter 4 Figure and Table Numbering (As Actually Used — Do Not Deviate)

The refined Chapter 4 uses a single continuous figure sequence rather than the larger 4.1–4.18 scheme referenced in some earlier planning notes — that scheme was never fully applied to the real document and had its own internal duplicate. This is the sequence actually used:

**Figures:** 4.1 Use Case Diagram, 4.2 System Architecture, 4.3 Class Diagram, 4.4 ERD, 4.5–4.9 the five Student PWA screens, 4.10 PWA Navigation Flow, 4.11 Fleet Dashboard, 4.12 Dashboard Navigation Flow.

**Tables:**
| Table | Title |
|---|---|
| 4.1 | ORBIT Use Case Summary |
| 4.2 | Sequence Diagram Coverage by Use Case |
| 4.3 | ORBIT Class Summary |
| 4.4 | DemandSignal Table Schema (PK identified; no FK columns exist — see note below) |
| 4.5 | BusState Table Schema |
| 4.6 | StopState Table Schema |
| 4.7 | AgentLog Table Schema |
| 4.8 | TripHistory Table Schema |

**Database design note:** All five tables use a single auto-incrementing integer primary key. There are no foreign key columns anywhere in the schema — `stop_id`, `corridor_id`, and `bus_id` reference the JSON configuration files (stop/corridor/bus definitions), not other database tables, so there is nothing to mark as FK. `BusState` and `StopState` are intentionally append-only (a new row per state update, not an update-in-place), which preserves the history needed for evaluation metrics like average service interval.

---

## Tech Stack (Final)

| Layer | Component | Technology |
|---|---|---|
| Student App | Frontend | React PWA |
| Student App | Stop detection | Browser Geolocation API + Haversine geofence |
| Student App | Backend connection | REST (FastAPI) + WebSocket |
| MAS Backend | Agents | Python 3.11 |
| MAS Backend | Messaging | Eclipse Mosquitto (MQTT) |
| MAS Backend | Graph/routing | NetworkX (Dijkstra) |
| MAS Backend | Anomaly detection | scikit-learn Isolation Forest |
| MAS Backend | API server | FastAPI + WebSockets |
| Fleet Dashboard | Frontend | React + Leaflet.js |
| Bus Location | PSM2 (March–July 2027) | Real GPS from Dr Sim's PAJ project API |
| Bus Location | Fallback | Schedule-based ETA |
| Database | Persistence | SQLite (utm_bus.db) |
| UML Design | Diagrams | Draw.io |

---

## ORBIT Development Roadmap (3 Phases, 10 Sprints — April 2026 to July 2027)

This supersedes any earlier "PSM2 Timeline" table that assumed immediate, continuous development right after this submission with no gap. The actual roadmap, per the project's Gantt chart (now Figure 3.1 in the refined Chapter 3), spans three phases with an industrial training placement in between:

**Phase 1 — PSM1 Development (April–July 2026), current semester:**
| Sprint | Period | Focus |
|---|---|---|
| P1.S1 — Foundations & Infrastructure | April 2026 | Git repo, venv, SQLite schema, MQTT broker, React PWA scaffold |
| P1.S2 — Sense & Signal | May 2026 | GPS tracking hook, demand submission API, MQTT publish pipeline |
| P1.S3 — Display & Validate | May 2026 | ETA display, capacity API, geofence middleware, Bus Agent base class |
| P1.S4 — Agent Logic & Live App | June 2026 | WebSocket live feed, PWA manifest, Bus Agent state machine, PSM1 report compilation |

Buffer Sprint (20 July – 31 August 2026) absorbs slippage before the internship.

**Phase 2 — Internship Development (September 2026 – February 2027), weekends only:**
| Sprint | Focus |
|---|---|
| P2.S1 — Simulation World & Injector | VirtualInjector, destination probability tables, GPS simulation, sim clock |
| P2.S2 — Full Bus Agent Behaviour | Bus Agent FSM, GPS position handler, Stop Agent Isolation Forest |
| P2.S3 — Integration Sprint | App ↔ MAS full integration, end-to-end flow verified, WebSocket dashboard |
| P2.S4 — Dashboard Phase 1 | Bus/stop status tables, decision log, manual override UI |

Post-Intern Sprint (1–19 March 2027) precedes Phase 3.

**Phase 3 — PSM2 Final Semester (March–July 2027), full-time:**
| Sprint | Focus |
|---|---|
| P3.S1 — PSM2 Kickoff & Demo 1 Prep | Real-device deploy, PAJ GPS live, Leaflet.js map, PSM2 Ch1–3 draft |
| P3.S2 — Full System, Demo 2, Report & Viva | TC01–TC16 test suite, final report, Turnitin, Demo 2, viva & reflection video |

**Key milestones:** PSM1 Final Report (June 2026) → Internship Start (~July 2026) → Internship End (~Feb 2027) → Demo 1, ~40% (Apr 2027) → Demo 2, ~70% (Jun 2027) → Viva & Submission (Jul 2027).

---

## All Project Context Modules

| File | Contents | Load When |
|---|---|---|
| `00_MASTER_CONTEXT.md` | This file | ALWAYS |
| `01_AGENT_DESIGN.md` | Stop/Bus Agent spec, intervention hierarchy, test cases, MQTT | Agent behaviour, MAS design |
| `02_GRAPH_AND_SIMULATION.md` | Campus graph, demand engine, virtual injector, eval metrics | Graph/routing, simulation |
| `03_DASHBOARD_AND_INTEGRATION.md` | Dashboard spec, API endpoints, WebSocket schema | Dashboard design, API |
| `04_REPORT_WRITING_GUIDE.md` | Chapter-by-chapter guidance, tense rules, UC table | Report writing |
| `05_GROUNDING_CHECKLIST.md` | Scope traps, track language, pre-chapter checklist | Before writing any section |
| `06_RESEARCH_FINDINGS.md` | All citations, literature review findings, research gap statement | Chapter 2, citations |
| `07_UTM_BUS_ROUTES_REFERENCE.md` | All 19 UTM bus services, corridor stop sequences | Route/stop questions |
| `08_STUDENT_APP_DESIGN.md` | PWA screens, demand integrity, boarding prompt, privacy | App design, Ch4 app sections |
| `09_SUPERVISOR_PROJECT_REFERENCE.md` | PAJ project full detail, ORBIT's position, GPS feed relationship | PAJ framing, Ch1/2 context |
| `QnA_SUPERVISOR.md` | Dr Sim meeting prep, panel Q&A | Before supervisor meetings |

**Modules 01, 02, 03, 06, 07, 08, 09, and QnA_SUPERVISOR were checked against this session's work and found accurate — no changes needed.**

---

## Six Objectives (Detailed Version — For Report Chapters, If Used)

> **Note:** Chapter 1 of the actual submitted report uses the supervisor's condensed 3-objective format (a/b/c — analyse and gather requirements; design and develop the 3-layer system; test and evaluate). The 6-item list below is a more granular version some earlier modules used; it has not been verified as the version Chapter 1 actually contains. Check Chapter 1 directly before assuming either list applies — do not silently swap one for the other in a chapter that's meant to match Chapter 1.

1. Design and implement a MAS with autonomous Stop Agents and Bus Agents
2. Model UTM campus network as a directed weighted graph with Dijkstra pathfinding
3. Build a demand simulation engine based on UTM class schedule patterns
4. Implement MQTT-based inter-agent coordination with claim-lock protocol
5. Build a real-time web dashboard for fleet manager use and a student-facing PWA for demand signalling
6. Validate system correctness and functional behaviour under simulated demand scenarios using black box test cases and defined software acceptance criteria
