# PSM Master Context — ORBIT
> **Load this file FIRST in every new chat session. It is the single source of truth.**
> Rewritten July 2026 — PSM1 fully submitted and finalized. This file now governs the pre-internship build window (sembreak) and points forward to implementation, not report-writing.
> Superseded version: the June 2026 edition of this file (written mid-corrections, before final PDF compile) is retired. Do not resurrect its "Phase Correction" framing — that job is done.

---

## ⚠️ Phase Status (read this first)

**PSM1 is complete and submitted.** The finalized thesis PDF (SRS + SDD + STD as appendices, 5-chapter report) was compiled and submitted. Panel corrections from the earlier round are incorporated in that final PDF — this includes the six-step Bus Agent constraint hierarchy wording fix, which the thesis's own AI-usage documentation appendix confirms was audited and corrected project-wide (search the compiled PDF for "Six-Step vs Five-Step Constraint Hierarchy Audit" if you need to re-verify).

**Where the project stands right now:** Sembreak. Per the project's own Gantt chart, this is the **Buffer Sprint** window (20 July – 31 Aug 2026), which sits between PSM1 submission and the industrial training placement (Sept 2026 – Feb 2027, weekends-only development). The goal for this window is exactly what the user is doing now: **lock every open design decision, correct known errors, and get a solid head start on implementation** before the internship reduces available time to weekends.

**What this means practically:**
- Report-writing mode is over. `04_REPORT_WRITING_GUIDE.md` and `QnA_SUPERVISOR.md` are retired as day-to-day modules — see their replacement, `ARCHIVE_PSM1_REPORT_AND_PANEL.md`, which keeps only what's still useful (durable Q&A logic for a future viva, chapter/citation conventions if PSM2 needs to extend the same report).
- Two working prototypes already exist in the GitHub repo (`SamyAridhan/ORBIT`): a student PWA (liked, UX considered close to final, not yet fully finalized) and a Fleet Dashboard (still being reworked, not happy with it yet). See `10_PROTOTYPE_STATUS.md` for the current build state of both.
- A real backend (MAS, MQTT, agents) does not exist yet. Everything server-side described in `01_AGENT_DESIGN.md`, `02_GRAPH_AND_SIMULATION.md`, and `03_DASHBOARD_AND_INTEGRATION.md` is design spec, not implemented code, going into this build window.

---

## ⚠️ Design Correction: Arrival Compression Removed (July 2026)

**Arrival compression is no longer a modeled Bus Agent intervention.** This was a design error carried through PSM1: it was introduced by misreading source material as endorsing dwell-time reduction as a viable dispatch tool. It is not — it's unrealistic as a solution, not a real lever the system has.

**Why it doesn't work:** UTM buses run without scheduled holds at intermediate stops. There's no built-in slack to compress — a bus already moves through intermediate stops as fast as boarding/alighting allows. The theoretical dwell-time saving available is on the order of 5–15 seconds per stop, which cannot produce a meaningful ETA change (the PSM1 prototype's demo scenario claimed a 14→7 minute improvement from compression alone — that number is not physically achievable by this mechanism and should never be reused).

**What replaces it:** The Bus Agent now selects between exactly **two** interventions — **Hold** (when running ahead of schedule) and **Early Departure** (terminus only, last resort). When a bus is COMMUTING and on-time or behind schedule with a high-demand stop ahead, there is honestly **no safe timing intervention available** — this is now an accepted, logged outcome (`STEP 5`'s "no safe intervention" branch), not a gap to paper over with compression.

**Where this touches things:**
- `01_AGENT_DESIGN.md` — rewritten, see below.
- The Bus Agent constraint hierarchy is still **six steps** (corridor filter → capacity check → protected-time check → claim check → intervention selection → overflow flag) — removing compression only changes what happens *inside* step 5 (two branches instead of three), it does not change the step count. Don't let this get confused with the already-resolved five-step/six-step wording bug from PSM1 — that was about miscounting steps, this is a separate, newer correction about which interventions exist.
- The finalized PSM1 thesis PDF still describes and tests arrival compression (including TC007_03). **That submitted document is not being retroactively edited.** This correction applies forward, to PSM2 design and implementation, and should be written up explicitly as a documented design evolution when the SDD is revisited for PSM2 (an honest "here's what changed and why since PSM1" note is normal and expected, not something to hide).
- **Open conflict, unresolved as of this session:** the existing student-PWA and dashboard prototypes in the GitHub repo have their entire demo sequence built around arrival compression as the mechanism (`AGENTS_DASHBOARD.md` explicitly says "the intervention is arrival compression, not an early departure by an empty terminus bus"). This needs to be redesigned around Hold or Early Departure before the prototypes are considered final. See `10_PROTOTYPE_STATUS.md`.

---

## Known Placeholder Values — Not Finalized, Not To Fix Now

These are noted so they surface when relevant, not because they need action during this build window:

- **Bus capacity = 28 seats.** Placeholder. Not fixed in the thesis. Confirm with UTM Fleet eventually (see Dr Sim questions below).
- **Missed-bus re-signal weight = 1.5×.** Reasonable placeholder, to be fine-tuned during development, not derived from anything.
- **Headway/threshold constants.** 15 min (early departure gap) and 8 min (early departure cap) are grounded loosely in "UTM Fleet Schedule (2023)" — a citation of convenience, not a real derivation. The 85% capacity lock, 12-minute protected window, 5-minute min-headway-between-buses, and 0.6 utility threshold have **no grounding at all**. All of these are placeholders to fine-tune during development, not finalized values.
- **Arrival compression removal is not reflected in the submitted PSM1 thesis.** The correction (see `01_AGENT_DESIGN.md`) applies going forward only. The thesis still describes and tests compression (including TC007_03). This needs to be written up explicitly as a documented design evolution when the SDD is revisited for PSM2 — flagged here so it isn't forgotten by then.
- **GPS timeline dependency.** The PAJ project's Phase 1 POC only covers the KP–CP corridor — not Bus B, E, or F, which are ORBIT's modeled corridors. This is a real risk to the "swap in real GPS" plan and was previously flagged but nearly lost. Doing nothing about it now; just keeping it visible here so it comes up when it matters (e.g. when GPS integration planning starts).

---

## Open Questions for Dr Sim (Restored — Still Live, Not Stale)

- **GPS feed from PAJ project:** Is there a planned API format (REST or MQTT) for Phase 1's GPS position data?
- **Route A/B/C renewal:** Their validity was listed as ending December 2023 — are they still running?
- **Biggest pain point / which corridor first:** Does Bus E (KDOJ→Cluster) match what UTM Fleet actually sees as the worst corridor?
- **Fleet manager demo access:** Could a UTM Fleet staff member view the dashboard during a future demo?
- **Traccar platform compatibility:** Does Traccar expose a real-time position API or MQTT feed, for `GPSBasedETA` compatibility?
- **PIDS screen plans:** Is the KP–CP corridor prioritized for Phase 1 because it already has better infrastructure?
- **Typical bus capacity:** Is 28 seats accurate for UTM's actual fleet? *(Directly ties to the capacity placeholder above.)*

---

## What This Project Is

**System Name:** ORBIT — On-Demand, Route-Based Intelligent Transit System
**Report Title:** ORBIT: On-Demand, Route-Based Intelligent Transit System
**Course:** SECJ3032/SECJ4013 (FYP1 → FYP2), Semester 01 2026/2027 → PSM2 March–July 2027
**University:** UTM, Skudai, Johor Bahru
**Track:** System Development (NOT Research-based)
**Supervisor:** Dr Sim Hiew Moi (named researcher on UTM's PAJ-funded Smart Bus IoT project)
**PSM1 status:** ✅ Submitted, finalized, panel corrections incorporated.

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
2. **Timing adjustment only:** hold → early departure (last resort). **Not** arrival compression (removed — see correction above). Not rerouting.
3. **Early departure:** terminus only, headway gap ≥ 15 min, max 8 min, utility ≥ 0.6.
4. **No safe intervention is a valid, loggable outcome.** A COMMUTING bus that's on-time/behind schedule with high demand ahead simply gets flagged, not force-fit into an intervention that doesn't exist.
5. **Interchange stops (CP, Jalan Amal):** waypoints only, no dispatch signals ever.
6. **App participation is voluntary.** Graceful degradation to schedule-based estimation below 30% adoption.
7. **Agents are rule-based.** Isolation Forest is the only approved AI component — signal integrity only.
8. **Methodology: Agile only.** No Waterfall.
9. **Three corridors in simulation:** Bus B, E, F.

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

**Critical:** UC12 extends UC8 (not UC9). UC9 stands alone. UC7 includes UC8. This map is unchanged by the compression removal — no use case referenced compression by name.

---

## Tech Stack (Final)

| Layer | Component | Technology |
|---|---|---|
| Student App | Frontend | React 18 + Vite PWA (built — see `10_PROTOTYPE_STATUS.md`) |
| Student App | Stop detection | Browser Geolocation API + Haversine geofence |
| Student App | Backend connection | REST (FastAPI) + WebSocket (not yet built) |
| MAS Backend | Agents | Python 3.11 (not yet built) |
| MAS Backend | Messaging | Eclipse Mosquitto (MQTT) (not yet built) |
| MAS Backend | Graph/routing | NetworkX (Dijkstra) (not yet built) |
| MAS Backend | Anomaly detection | scikit-learn Isolation Forest (not yet built) |
| MAS Backend | API server | FastAPI + WebSockets (not yet built) |
| Fleet Dashboard | Frontend | React 18 + Vite (built as static-replay prototype — see `10_PROTOTYPE_STATUS.md`) |
| Bus Location | Deployment target | Real GPS from Dr Sim's PAJ project API |
| Bus Location | Fallback | Schedule-based ETA |
| Database | Persistence | SQLite (utm_bus.db) |
| UML Design | Diagrams | Draw.io |

---

## Build Roadmap (unchanged structure, now entering execution)

**Buffer Sprint (now — through 31 Aug 2026):** Lock all open design decisions (this session). Reconcile the compression removal with the prototypes. Begin MAS backend foundations if time allows — this is genuinely a head start, not a hard requirement.

**Phase 2 — Internship Development (Sept 2026 – Feb 2027), weekends only:**
| Sprint | Focus |
|---|---|
| P2.S1 — Simulation World & Injector | VirtualInjector, destination probability tables, GPS simulation, sim clock |
| P2.S2 — Full Bus Agent Behaviour | Bus Agent FSM (Hold / Early Departure only), GPS position handler, Stop Agent Isolation Forest |
| P2.S3 — Integration Sprint | App ↔ MAS full integration, end-to-end flow verified, WebSocket dashboard |
| P2.S4 — Dashboard Phase 1 | Bus/stop status tables, decision log, manual override UI |

**Phase 3 — PSM2 Final Semester (March–July 2027), full-time:**
| Sprint | Focus |
|---|---|
| P3.S1 — PSM2 Kickoff & Demo 1 Prep | Real-device deploy, PAJ GPS live, Leaflet.js map, PSM2 Ch1–3 draft |
| P3.S2 — Full System, Demo 2, Report & Viva | TC01–TC16 test suite (compression-related cases removed/replaced), final report, Turnitin, Demo 2, viva & reflection video |

---

## All Project Context Modules

| File | Contents | Load When |
|---|---|---|
| `00_MASTER_CONTEXT.md` | This file | ALWAYS |
| `01_AGENT_DESIGN.md` | Stop/Bus Agent full spec (compression removed), MQTT topic schema, black box test cases, state machines | Agent behaviour, MAS design, test cases, MQTT |
| `02_GRAPH_AND_SIMULATION.md` | Campus graph nodes/edges, demand engine, scenario presets, simulation clock, evaluation metrics, virtual injector | Graph/routing, simulation design |
| `03_DASHBOARD_AND_INTEGRATION.md` | Dashboard spec, API endpoints, folder structure, WebSocket schema, message formats | Dashboard design, API, system integration |
| `05_GROUNDING_CHECKLIST.md` | Scope traps, track language rules, the compression-removal trap | Before any design/build decision |
| `06_RESEARCH_FINDINGS.md` | All citations with full references, literature review findings, research gap statement | Citation questions, PSM2 report continuity |
| `07_UTM_BUS_ROUTES_REFERENCE.md` | All 19 UTM bus services, 8 corridor stop sequences, shared nodes | Route/stop questions, graph nodes |
| `08_STUDENT_APP_DESIGN.md` | PWA screens, demand integrity (three layers), boarding prompt, privacy design | App design, demand signal integrity |
| `09_SUPERVISOR_PROJECT_REFERENCE.md` | PAJ project full detail, ORBIT's exact position, GPS feed relationship | PAJ framing, supervisor meeting prep |
| `10_PROTOTYPE_STATUS.md` | **New.** Current state of the two built prototypes (student PWA, dashboard) in the GitHub repo, locked UX decisions, open issues | Any work touching the actual frontend repos |
| `ARCHIVE_PSM1_REPORT_AND_PANEL.md` | **New, replaces `04_REPORT_WRITING_GUIDE.md` + `QnA_SUPERVISOR.md`.** Trimmed to durable content only — citation/chapter conventions for PSM2 continuity, and reusable viva Q&A logic | Only if PSM2 report writing or viva prep comes up — not for day-to-day build work |

**04_REPORT_WRITING_GUIDE.md and QnA_SUPERVISOR.md are retired** — their durable content lives in `ARCHIVE_PSM1_REPORT_AND_PANEL.md` now. Don't load the old files; they contain stale mid-correction framing.
