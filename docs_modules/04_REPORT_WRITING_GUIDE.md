# Module 04 — ORBIT Report Writing Guide (PSM1 Reference)
> Updated June 2026 — corrected: this project is in PSM1 (due 25 June 2026), not PSM2. PSM2 is deferred to March–July 2027 after an industrial training placement. See `00_MASTER_CONTEXT.md` for the full phase correction and the real 10-sprint roadmap.
> PSM1 chapters are written in future/planning tense (proposal), except where noted.
> System name: ORBIT (On-Demand, Route-Based Intelligent Transit System)

---

## ⚠️ Most Important Rule for PSM1 Writing

PSM1 is a **proposal**. You are describing what you WILL build, not what you have built.

Write in future/planning tense:
- ✅ "The system will implement..."
- ✅ "The proposed architecture consists of..."
- ✅ "Bus Agents will evaluate..."
- ❌ "The system implements..." (sounds like it's built)
- ❌ "Results show..." (you have no results yet)

**Exception:** Chapter 3's methodology section and Chapter 5's achievements section may describe completed PSM1 work (the SRS, SDD, STD, diagrams, and the in-progress/completed student app prototype) in present or past tense, since that work genuinely has been done. Everything about the *system itself functioning* — agent coordination actually running, dispatch decisions actually being made, test cases actually passing — stays in future/planning tense, because that doesn't happen until PSM2.

---

## Report Structure

| Chapter | Title | Tense |
|---|---|---|
| 1 | Introduction | Present (problem exists now) |
| 2 | Literature Review | Present/past (existing work) |
| 3 | System Development Methodology | Past for completed PSM1 work; future for PSM2 phases |
| 4 | Requirement Analysis and Design | Future/conditional (design, not yet built) |
| 5 | Conclusion | Present achievement (PSM1) + future plan (PSM2) |

This is a 5-chapter report — see `00_MASTER_CONTEXT.md`'s phase correction note for why this matters: PSM1 strictly requires exactly 5 chapters, with no separate "Implementation and Testing" chapter, since that work doesn't happen until PSM2.

---

## Chapter 1 — Introduction

### Problem Background (Two Angles + Institutional Context)

**Fleet coordination problem:**
UTM Skudai operates 19 shuttle bus services across 8 route corridors serving a large campus of approximately 1,222 hectares with a significant student population dependent on shuttle buses as their primary mode of campus transportation. These services follow fixed schedules with no mechanism to detect or respond to real-time demand variation. During pre-lecture peaks — 15–20 minutes before the 8am, 9am, and 10am lecture slots — residential college stops such as KDOJ (Bus E corridor) and KP (Bus B corridor) accumulate queues of 30+ students while the next scheduled service may be 45+ minutes away. This timing mismatch results in extended student wait times and inconsistent fleet utilisation.

**Student information problem:**
Students currently have no visibility on bus ETAs, current bus capacity, or real-time bus positions. The myUTM application does not include bus tracking functionality. Students must guess whether a bus is coming or has already passed, and cannot make informed decisions about waiting versus alternative transport.

**Institutional validation of the problem:**
The severity of this problem has been recognised at the institutional level. A funded research initiative — *Sistem Pengangkutan Bas Pintar Berasaskan IoT dan GPS di Kampus UTM Johor Bahru* — is currently underway, led by UTM researchers with a budget of RM188,127 and a 2026–2028 timeline. This initiative deploys GPS tracking infrastructure and ETA prediction across all 8 UTM campus corridors, providing real-time bus location to students via a mobile application and display screens at bus stops. However, this initiative addresses bus visibility — not dispatch coordination. Buses continue to operate on fixed schedules; no mechanism exists for autonomous detection of or response to demand imbalances. Students can see when a bus will arrive but cannot signal that they are waiting. ORBIT is proposed to fill this remaining gap: transforming a visible transit network into a demand-responsive one.

### Aim
To design and develop ORBIT (On-Demand, Route-Based Intelligent Transit System) — a three-layer campus transit system comprising a student-facing demand input application, a multi-agent coordination backend, and a fleet manager dashboard — enabling demand-responsive dispatch timing for UTM's shuttle services while providing real-time bus information to students.

### Objectives

> **Confirmed from the actual submitted SRS/thesis:** Chapter 1 uses three lettered objectives:
> (a) to analyse and gather requirements for ORBIT, covering student demand-signalling needs, agent coordination constraints, demand signal integrity mechanisms, and fleet management visibility requirements;
> (b) to design and develop the three-layer ORBIT system — student-facing PWA, MAS backend, fleet manager dashboard;
> (c) to test and evaluate ORBIT against defined black-box test cases and software acceptance criteria.
>
> A more granular 6-objective list exists elsewhere in this project's context modules (see `00_MASTER_CONTEXT.md`'s "Six Objectives" section) but has not been confirmed as the version actually used in Chapter 1. Don't substitute it into Chapter 1 without checking the real document first — and if Chapter 5 or any other chapter restates the objectives, restate the 3-item (a/b/c) version, since that's what's confirmed.

### Scope
**In scope:**
- Student PWA: stop detection, destination selection, ETA display, capacity display
- MAS backend: Stop Agents, Bus Agents, demand engine, MQTT coordination
- Fleet dashboard: live monitoring, decision log, manual override
- Software testing: unit, integration, black box, acceptance test

**Out of scope:**
- Live hardware deployment on real UTM buses (this is covered by the PAJ GPS project)
- Integration with myUTM or UTM IT systems
- Real GPS hardware (simulated until the PAJ project's GPS feed is live; real GPS from PAJ project is the planned PSM2 swap-in)
- Machine learning components (future work once operational data is available)
- Physical sensors at bus stops

---

## Chapter 2 — Literature Review

### 2.1 Multi-Agent Systems

Define agents using Wooldridge & Jennings (1995): autonomous, reactive, proactive, social entities. Distinguish reactive agents (Stop Agent) from deliberative agents (Bus Agent). FIPA communication standards. Why MAS over centralised control: no single point of failure, each agent has local knowledge, coordination emerges from message passing.

### 2.2 Graph-Based Routing

Dijkstra's algorithm for weighted directed graphs (Dijkstra, 1959). Dynamic edge weights for demand-responsive systems. Why directed: UTM campus has one-way road segments. Why weighted: edge weight encodes travel time, adjusted by queue pressure at destination.

### 2.3 Related Campus Transit Systems

**Primary reference — Noor et al. (2021), MDPI Sustainability:**
University of Malaya, 309 ha, 5 routes, GPS data one semester (10M+ data points). ANN outperformed SVM for travel time prediction. Recommendation: merge overlapping routes → 27% travel time reduction. **Limitation:** offline analysis producing better fixed schedule. No real-time demand response. Not agent-based. Cite as closest Malaysian academic precedent.

**Secondary references:**
- Meignan et al. (2007): MAS simulation of urban bus networks — MAS architecture precedent
- Jäger et al. (2018): MAS with vehicle/stop/customer agents — closest architecture to yours
- Qatar University IEOM (2020): campus shuttle simulation, 75% effectiveness gain — simulation methodology precedent
- Daganzo & Pilachowski (2011): headway control reduces bunching variance 53–78% — validates timing intervention mechanism

### 2.4 UTM Smart Bus IoT-GPS Project — MOST DIRECTLY RELATED WORK

**This subsection is the most important in Chapter 2.** It is the closest related work — same institution, same problem domain, same supervisor involvement. Handle it with precision.

**What to cover:**
- PAJ-funded initiative, UTM researchers, RM188,127 budget, 2026–2028 timeline
- Three-phase rollout: POC (KP–CP corridor) → full 8 corridors → UTMSMART integration
- Technology: GPS trackers on buses, Traccar platform, LightGBM/XGBoost ETA prediction, PIDS screens, passenger mobile app, fleet dashboard
- What it delivers: bus visibility (real-time location, ETA, route information)
- What it does not deliver: demand sensing, autonomous dispatch decisions, agent coordination, queue awareness

**Key paragraph to write:**
> *"The most directly relevant related work is an active funded research initiative at UTM itself. The project deploys GPS tracking hardware across all campus bus corridors, transmits position data via 3G/4G to a cloud platform, applies machine learning models to predict arrival times, and delivers this information to passengers via a mobile application and stop-level display screens. The system represents the current state of practice in campus bus intelligence: making buses visible to passengers and management. However, visibility and intelligence are distinct properties. The system's architecture is fundamentally passive — buses operate on fixed schedules regardless of how many students are waiting, and no mechanism exists for the system to detect demand imbalances or trigger corrective dispatch actions. ORBIT is proposed as the coordination intelligence layer above this infrastructure, consuming the GPS position feed as input and producing demand-responsive timing decisions as output."*

**On ML (LightGBM/XGBoost) vs ORBIT's approach:**
The PAJ project uses ML for ETA prediction trained on real GPS data. ORBIT uses graph-based calculation. Write this distinction explicitly:
> *"The PAJ project's ETA prediction employs gradient boosting models trained on real operational GPS traces — appropriate for a project that generates months of actual bus position data. ORBIT operates in the pre-data phase, before such data exists, and uses graph-based ETA calculation. This is adequate for a fixed-route campus shuttle with predictable traffic. The system is architecturally designed for a future swap-in of ML-based ETA once real GPS data accumulates."*

### 2.5 Student-Facing Transit Applications

- **Bus Johor (P211):** GPS live tracking, ETA display, locally proven
- **Singapore smartcard:** Tap-in/tap-out, 100% compliance — too invasive for voluntary campus use
- **myUTM:** No bus tracking. Will eventually integrate PAJ project output via UTMSMART, but not in scope for FYP.

Justify PWA over native app: no App Store, no UTM IT permission, runs on any phone browser.

### 2.6 Demand Sensing Technologies

**APC door counters (Skyss, Norway):** Indirect demand inference from boarding/alighting patterns. Analogous to your fallback demand model.

**App-based voluntary demand signalling (ORBIT):** Student submits stop + destination. Resolves queue count AND destination simultaneously. Scales with adoption.

**mmWave radar (60–77GHz):** Future IoT hardware extension. Counts headcount, cannot resolve destination. Complements app but doesn't replace it. Stop Agent architected with pluggable source for this swap-in.

### 2.7 IoT in Transit Systems

ORBIT's architecture follows the standard four-layer IoT model. The PAJ project also uses GPS sensors and cellular connectivity, confirming the IoT framing is institutionally appropriate for UTM's transit context. ORBIT extends from passive sensor-to-display to active sensor-to-coordination.

Cite: Al-Turjman et al. (2019) IoT in smart transportation.

### 2.8 Anomaly Detection for Data Integrity

Isolation Forest (Liu et al., 2008). Unsupervised, lightweight, no labelled data. Applied as signal integrity component within Stop Agent — replacing hardcoded threshold with learned model. Not demand prediction. Not a research contribution — a system component.

### 2.9 Research Gap

> *"Existing campus transit optimisation approaches produce static schedule improvements without real-time demand response (Noor et al., 2021), or propose MAS frameworks not applied to fixed-route campus transit with student demand capture (Meignan et al., 2007; Jäger et al., 2018). Headway control theory validates rule-based timing intervention as sufficient (Daganzo & Pilachowski, 2011). Critically, even the most advanced active initiative at UTM — a funded multi-year IoT-GPS project deploying real-time tracking and machine learning ETA prediction across all campus corridors — addresses bus visibility but not demand-responsive coordination. ORBIT fills the remaining gap: a three-layer system combining student demand signalling, autonomous multi-agent dispatch coordination, and fleet management visibility, designed to complement and consume the GPS infrastructure the tracking initiative will deliver."*

---

## Chapter 3 — System Development Methodology

> **See the refined `Chapter3_System_Development_Methodology.md` deliverable for the actual current chapter text.** This section is retained as background reference for the guidance that produced it.

### Development Approach: Agile

ORBIT is developed using an Iterative-Agile approach. Each layer is built, tested, and validated before the next is added. Design decisions made during PSM1 will be revised during PSM2 as implementation reveals constraints — this is expected and correct. There is no fixed sequence of phases that cannot change.

**Why not Waterfall:** Waterfall requires complete requirements to be known upfront. This project involves learning by doing — each agent layer reveals new integration requirements. Agile accommodates this; Waterfall does not.

### Development Roadmap (Corrected — 3 Phases, 10 Sprints, April 2026 – July 2027)

> **An earlier version of this guide described a "PSM2 Phase Plan" assuming continuous, immediate development right after PSM1 submission (Phase 1 Weeks 1–6, Phase 2 Weeks 6–11, Phase 3 Weeks 11–15, ending in a Final Demo).** That assumption is wrong — see `00_MASTER_CONTEXT.md`'s phase correction. The real roadmap has an industrial training placement between PSM1 and PSM2, and PSM2 itself doesn't start until March 2027. **Always pull the current roadmap from `00_MASTER_CONTEXT.md`'s "ORBIT Development Roadmap" section** rather than from a static table here, since that's now the single source of truth, kept in sync with the actual Gantt chart (Figure 3.1).

The current Chapter 3 includes this full roadmap as Figure 3.1, sourced from the project's Gantt chart, and a detailed sprint table (Table 3.2) for the four Phase 1 sprints that fall within this report's scope — intentionally giving Phases 2 and 3 only brief paragraph-level description, since detailing 9–14-months-out sprints at the same granularity as current work would read as padding.

### Tools Justification
| Tool | Justification |
|---|---|
| React PWA | Runs on any phone browser, no install, no UTM IT permission |
| Browser Geolocation API | Built into all modern browsers, no hardware needed |
| Python | Dominant language for agent/simulation systems |
| NetworkX | Built-in Dijkstra, directed graph, academic-grade |
| Eclipse Mosquitto | ISO standard MQTT, free, lightweight, IoT-standard |
| FastAPI | Native async + WebSocket, Python ecosystem |
| SQLite | Simple, local, zero-config |
| Leaflet.js | Open-source maps, OpenStreetMap, free |
| scikit-learn (Isolation Forest) | Lightweight anomaly detection, no GPU |

### GPS and Deployment Note

PSM2 (March–July 2027) is planned to use **real GPS data from Dr Sim's PAJ project API** as the primary bus position source, since PSM2 carries a deployment rubric component that fully simulated GPS would not satisfy. Dr Sim has confirmed access will be provided; a master's student under Dr Sim working on the same PAJ project will be consulted on the GPS API format before PSM2 implementation begins. Until then — through Phase 1 (PSM1) and Phase 2 (the internship placement) — schedule-based ETA is the active data source, with the `ETACalculator` pluggable interface designed so the swap to `GPSBasedETA()` requires no changes to Stop Agent or Bus Agent logic:

```python
eta_calculator = ScheduleBasedETA()   # PSM1 and Phase 2 (internship)
# eta_calculator = GPSBasedETA()      # PSM2, once Dr Sim's API access is confirmed live
```

### Configuration-Driven Deployment Design
All institution-specific parameters externalised into config files. Core system — agent logic, MQTT, boarding prompt, demand integrity, dashboard — is institution-agnostic. This mirrors the generalisation goal stated in the PAJ proposal itself: *"Model yang dibangunkan di Kampus UTM JB juga direka untuk boleh diguna pakai semula di Kampus UTM KL dan universiti lain"* (the model is designed to be reusable at UTM KL and other universities).

---

## Chapter 4 — Requirement Analysis & Design

> **See the refined `Chapter4_Requirement_Analysis_and_Design.md` deliverable for the actual current chapter text**, including the corrected sequence diagram coverage table (Table 4.2), the now-completed Class Diagram section, the normalised DB schema with PK identification (Tables 4.4–4.8), and the PWA/Dashboard navigation flow diagrams (Figures 4.10, 4.12). All previously-flagged gaps in this chapter (missing class diagram section, missing normalised tables, missing navigation diagrams, duplicate/mismatched figure numbers) have been resolved — see `00_MASTER_CONTEXT.md`'s figure/table numbering reference for the final sequence actually used.

### Must Include — Status Check

- [x] System architecture diagram — Figure 4.2
- [x] Use case diagram — Figure 4.1, 4 actors, 12 UCs across 3 packages
- [x] Class diagram — Figure 4.3 (now present; use the SDD-level diagram, not the SRS domain model — see `00_MASTER_CONTEXT.md` diagram inventory)
- [x] Sequence diagram coverage table — Table 4.2 (corrected two-tier SRS+SDD structure)
- [x] Bus Agent state machine — reused from SRS/SDD directly
- [x] MQTT topic schema table — in `01_AGENT_DESIGN.md`, referenced not reproduced in Ch4
- [x] Campus graph diagram — in `02_GRAPH_AND_SIMULATION.md` / `07_UTM_BUS_ROUTES_REFERENCE.md`
- [x] Database schema — Tables 4.4–4.8, normalised, PK identified
- [ ] Interface mockups — student app (5 screens, Figures 4.5–4.9) and dashboard (Figure 4.11): status not re-confirmed this session, check before compilation
- [x] Navigation flow diagrams — Figures 4.10 (PWA), 4.12 (Dashboard)

**Use Cases:** see `00_MASTER_CONTEXT.md`'s "Finalised Use Case Map" — unchanged, panel-accepted, do not revert.

**Database Schema (key tables):**
```
demand_signals (id PK, stop_id, corridor_id, destination, timestamp, token)
bus_states (id PK, bus_id, corridor_id, position, load, status, actual_dep, delta_min, timestamp)
stop_states (id PK, stop_id, corridor_id, queue_count, demand_level, last_visit, timestamp)
agent_logs (id PK, agent_id, event_type, message, constraints_json, timestamp)
trip_history (trip_id PK, bus_id, corridor_id, start_time, end_time, stops_json)
```
No foreign keys — `stop_id`/`corridor_id`/`bus_id` reference JSON configuration, not other database tables.

---

## Chapter 5 — Conclusion *(PSM1 — DRAFTED, NOT YET FINALISED)*

> **See the `Chapter5_Conclusion.md` deliverable for the actual current chapter text.** It follows the required 3-section structure (5.1 Introduction, 5.2 Achievements, 5.3 Suggested Plan for PSM2) per the official UTM PSM Handbook guidance. **It has one open item:** §5.2's description of the Student PWA prototype status is written as a placeholder ("in progress / complete") pending confirmation of where Sprints P1.S1–P1.S4 actually stand. This must be resolved with an honest, specific status before final submission — the rubric specifically rewards being concrete here, and guessing wrong in either direction (overclaiming or underselling) works against the score.
>
> **Per the supervisor's own NotebookLM-derived guidance, this is the one chapter recommended to be substantially rewritten by hand** rather than left close to AI-generated phrasing, since it's short, reflective, and personal — exactly where Turnitin's AI detector is most sensitive and where a student's own voice is easiest to apply.

### What PSM1 Achieves (Per the Three Objectives)
1. **Objective (a):** Requirement elicitation via direct consultation with UTM students (Bus E/KDSE and Bus B/Kolej 10 residents) plus institutional evidence from the PAJ project proposal; formalised into SRS v1.1 (12 user stories, panel-accepted 12-UC diagram, 12 dedicated sequence diagrams).
2. **Objective (b):** Three-layer system design — architecture, normalised database schema, class design, interface design — formalised into SDD v1.0 (9 viewpoints) plus the full diagram set, plus an in-progress/completed Student PWA prototype (confirm actual status — see open item above).
3. **Objective (c):** Test planning formalised into STD v1.0 (12 test cases, 36 sub-cases, traceability matrix) — execution and results correctly deferred to PSM2, since the system being tested isn't fully built yet.

### PSM2 Roadmap Reference
Refer the reader to Figure 3.1 (Chapter 3) for the complete Phase 2/Phase 3 timeline rather than re-deriving it in Chapter 5 — this is what the rubric's "planning of PSM2 stated clearly" criterion is checking for, and duplicating the full Gantt narrative here would be redundant with Chapter 3.

---

## Track Language Warning

Before writing any evaluation or results section, check your language against the system development track requirements.

> Full scope trap list with forbidden/correct language pairs → **05_GROUNDING_CHECKLIST.md** (Trap 1)
