# Module 06 — ORBIT Research Findings & Literature Review
> Deep research findings for PSM1 Chapter 2. All citations verified.
> Updated May 2026: PAJ supervisor project added as Part 9 — the most directly relevant related work.
> mmWave section added. Student app / demand sensing section expanded. IoT and AI anomaly detection added.
> System name: ORBIT (On-Demand, Route-Based Intelligent Transit System)

---

## Part 1 — Foundational MAS Theory

### Wooldridge & Jennings (1995)
**Full citation:** Wooldridge, M., & Jennings, N.R. (1995). Intelligent agents: Theory and practice. *The Knowledge Engineering Review*, 10(2), 115–152.

The foundational definition of an intelligent agent: an entity that is **autonomous** (acts without direct human control), **reactive** (perceives and responds to environment), **proactive** (takes goal-directed initiative), and **social** (communicates with other agents).

**Apply to your system:**
- Stop Agent = reactive (responds to demand signal changes)
- Bus Agent = deliberative (plans timing interventions, evaluates constraints)
- Both agents communicate via MQTT — satisfies the social property

This is your theoretical anchor. Cite it every time you define what an agent is.

### FIPA Standards
Foundation for Intelligent Physical Agents. Defines agent communication languages (ACL) and interaction protocols. In your system, MQTT topics serve as the communication layer. Not a hard requirement to implement full FIPA — mention it as the standard your design is informed by.

---

## Part 2 — Campus Transit Systems

### Noor et al. (2021) — PRIMARY CITATION
**Full citation:** Noor, N.M., et al. (2021). Predicting bus travel time and arrival time based on GPS data: A case study at the University of Malaya. *Sustainability*, 13(1), 225. https://doi.org/10.3390/su13010225

**What they did:**
- University of Malaya campus: 309 ha, 5 bus routes
- Collected GPS data for one full semester (10M+ data points)
- Compared ANN vs SVM for travel time prediction
- ANN outperformed SVM
- Recommended merging overlapping routes → projected 27% travel time reduction

**Why this is the closest Malaysian precedent:**
- Malaysian public university context (UM vs UTM)
- Campus-scale fixed-route transit
- GPS-based data collection

**Critical limitations to state in your Chapter 2:**
- Produces a better fixed schedule — not real-time demand response
- No agent-based coordination
- No student-facing application
- No demand signal input — purely historical GPS analysis
- Cannot adapt during the semester to changing demand patterns

**How your project addresses the gap:**
Where Noor et al. optimise the schedule offline, your system optimises dispatch timing online, during operation, using real student demand signals.

### Qatar University IEOM (2020)
Campus shuttle bus simulation study. Tested scheduling modifications in simulation. Reported up to 75% effectiveness improvement in service delivery metrics. Validates simulation as a legitimate PSM2 evaluation methodology — you are not the first to use simulation for campus transit evaluation.

---

## Part 3 — MAS Transit Architecture

### Meignan et al. (2007)
**Full citation:** Meignan, D., Simonin, O., & Koukam, A. (2007). Simulation and evaluation of urban bus networks using a multiagent approach. *Simulation Modelling Practice and Theory*, 15(6), 659–671.

Early MAS simulation of urban bus networks. Demonstrates viability of modelling buses and stops as autonomous agents. Foundational precedent for your architecture. Cite as proof that MAS has been applied to bus coordination before.

### Jäger et al. (2018) — ARCHITECTURE PRECEDENT
**Full citation:** Jäger, B., Brickwedde, C., & Niemann, A. (2018). Multi-agent-based transport simulation for policy decision support. *Transportation Research Record*, 2672(23), 87–97. https://doi.org/10.1177/0361198118786644

**Why this is critical:** Their architecture uses three agent types — vehicle agents, stop agents, customer agents — which maps almost directly onto your Bus Agents, Stop Agents, and (to an extent) the student app as the demand input layer. Cite this as the closest published architecture to your proposed design.

Difference from your system: their agents operate in open urban networks with flexible routing. Your system constrains agents to fixed corridors. This is a deliberate simplification appropriate for campus transit.

---

## Part 4 — Headway Control Theory

### Daganzo & Pilachowski (2011)
**Full citation:** Daganzo, C.F., & Pilachowski, J. (2011). Reducing bunching with bus-to-bus cooperation. *Transportation Research Part B: Methodological*, 45(1), 267–277.

**What they proved:**
- Bus bunching (two buses arriving together, then long gap) is a fundamental instability problem in high-frequency transit
- Cooperative headway control — buses that communicate and adjust speed/timing relative to each other — reduces headway variance by 53–78%
- Simple rule-based control is sufficient; complex optimisation not required

**Apply to your system:**
Your Bus Agent claim-lock protocol is a form of cooperative headway control. Bus E1 and E2 are implicitly cooperating — when E1 claims a demand event, E2 does not respond, preventing both buses from compressing simultaneously and arriving together.

This paper validates your timing intervention mechanism theoretically. Cite in Chapter 2 when explaining why timing adjustment is the right mechanism and why rule-based logic is sufficient.

---

## Part 5 — Why Not ML (Written Justification for Chapter 2)

**The training data problem:**
Machine learning models require historical operational data to learn from. UTM does not have published APC (Automatic Passenger Counter) data, passenger boarding records, or documented real-time queue history for its shuttle services. Without a training dataset, any ML model would need to be trained on simulated data — which is circular.

**Important contrast:** The PAJ-funded UTM Smart Bus IoT project (Dr. Sim's team) uses LightGBM and XGBoost for ETA prediction — and this is appropriate for their context because they will collect months of real GPS operational data as part of their study. Their ML models will train on actual bus traces, not simulations. ORBIT is designed for the pre-data phase. Once the PAJ project's GPS infrastructure is live and operational data accumulates, ML-based ETA prediction becomes viable for ORBIT as a future enhancement — the pluggable `ETACalculator` interface supports this without architectural changes.

**The track misclassification risk:**
Introducing ML components shifts the project toward research track framing — validating a model's predictive performance rather than validating software functional requirements. Research track requires CGPA 3.30.

**The sufficiency argument:**
Daganzo & Pilachowski (2011) demonstrate that cooperative rule-based headway control achieves 53–78% variance reduction. For the problem of dispatch timing optimisation in a fixed-route campus network, rule-based agents are not a compromise; they are the appropriate tool.

**Future work framing:**
As the student app and the PAJ project's GPS infrastructure accumulate real data over multiple semesters, ML-based demand prediction and ETA modelling become viable. This is documented as Phase 4 maturity in the Future Work section.

---

## Part 6 — Demand Sensing Technologies

### Skyss (Bergen, Norway) — APC Inference
Bus operator running 300+ routes. Uses infrared bidirectional APC door counters. Does not count people waiting at stops — counts people who board and alight. Analyses net inflow over time at each stop to infer upstream waiting demand.

**Relevance:** Your fallback demand model uses class schedule patterns as a proxy — analogous to Skyss's indirect inference. You are not the first to infer demand without direct observation.

### mmWave Radar (60–77GHz) — Future Hardware Path

**Technology overview:**
FMCW radar. Counts people via multi-target tracking. No camera, no privacy concerns. IP67-rated. MQTT output available on commercial units.

**Accuracy:** 93–99% in structured environments.

**Commercial examples:**
- SensMax TAC-B: RM2,000–4,000/unit
- TI IWR6843AOPEVM: research use
- SICK AG TDC-E: industrial grade, RM5,000–8,000/unit

**Why it's Future Work:**
Counts headcount — does not know destination corridor. Cost: RM2,000–8,000 × 30+ stops. Hardware deployment outside PSM1/2 scope. Student app solves both queue counting AND destination attribution simultaneously.

**Architecture note:** Stop Agent pluggable queue source supports future mmWave integration without agent logic changes.

---

## Part 7 — Student-Facing Transit Applications

### Bus Johor (P211 and others)
Live GPS tracking via MyBusTracking platform. Established in Malaysia — proves GPS bus tracking is not novel locally.

### myUTM App
No bus tracking, no bus information whatsoever. The planned PAJ project will eventually integrate with UTMSMART via UTM Digital (Phase 3). ORBIT's student app is deployable independently via URL/QR, without waiting for this integration.

---

## Part 8 — IoT Architecture in Transit Systems

### Why the System Is IoT

| IoT Layer | This System |
|---|---|
| Sensor | Student phones (GPS + intent), bus GPS trackers, future mmWave radar |
| Communication | MQTT (ISO/IEC 20922) — dominant IoT protocol |
| Processing | Stop Agents + Bus Agents (edge decision-making) |
| Application | Student PWA + Fleet Dashboard |

**Key reference:** Al-Turjman et al. (2019) — IoT in smart transportation.

**Connection to PAJ project:** The PAJ project also uses GPS sensors and 3G/4G connectivity — confirming the IoT framing for UTM's transit system is appropriate and institutionally recognised. ORBIT extends this IoT model from passive tracking to active coordination.

---

## Part 9 — UTM Smart Bus IoT-GPS Project (PAJ) — MOST DIRECTLY RELATED WORK

> This is the single most important related work entry for ORBIT. It is a real, funded, active research project at the same institution, involving your supervisor. Read this section before writing Chapter 2.

### Full Reference
**Title:** Sistem Pengangkutan Bas Pintar Berasaskan IoT dan GPS di Kampus UTM Johor Bahru
*(Smart Bus Transportation System Based on IoT and GPS at UTM Johor Bahru Campus)*
**Funding:** PAJ (UTM internal research grant)
**Principal Investigator:** Prof. Ir. Dr. Sharul Kamal Abdul Rahim
**Team:** Dr. Sim Hiew Moi, Dr. Pang Yee Yong, Dr. Afifah Taat
**Budget:** RM188,127 | **Duration:** July 2026 – June 2028
**Focus Area:** Wireless Communication / Smart Transportation

### What the Project Does
- GPS trackers physically installed on UTM buses (hardware cost borne by UTM Fleet)
- 3G/4G data transmission to cloud (DigitalOcean VPS)
- GPS tracking server: Traccar (open source)
- ETA prediction using **LightGBM and XGBoost** (gradient boosting ML) trained on real GPS operational data
- GTFS Static + Real-Time data integration
- Passenger Information Display Screens (PIDS) at bus stops (~RM5,000/unit outdoor display)
- Passenger mobile app: view bus location, check ETA at preferred stop, plan routes, receive delay notifications
- Fleet monitoring dashboard: track all buses, vehicle performance metrics, historical analytics
- Three-phase rollout: Phase 1 POC (KP–CP, 4 stops, 3 buses) → Phase 2 full 8 corridors → Phase 3 UTMSMART integration via UTM Digital

### What the Project Does NOT Do
This is the critical gap that ORBIT addresses:

| Gap | Explanation |
|---|---|
| No student demand sensing | The system tracks buses. It does not track or capture how many students are waiting at a stop. |
| No autonomous dispatch decisions | GPS makes bus location visible. The bus still runs its fixed schedule. No mechanism adjusts timing based on demand. |
| No agent-based coordination | Centralised cloud server architecture. Buses have no awareness of each other. |
| No queue-level awareness | PIDS screens display ETA. They do not know if 3 or 40 students are waiting. |
| No demand-responsive behaviour | Buses respond to the clock, not to students. |
| No student demand capture | Students are passive consumers of bus location data — they cannot signal that they are waiting. |

### How ORBIT Relates

```
PAJ Project:  GPS tracking → Cloud → ETA display → Passenger sees bus location
              "Where is the bus right now?"

ORBIT:        Student demand → MAS coordination → Dispatch adjustment → Fleet sees everything
              "What should the bus DO about where the students are?"
```

These are complementary layers, not competing systems. The PAJ project provides the GPS infrastructure. ORBIT provides the coordination intelligence that GPS tracking alone cannot deliver.

**Technical integration point:** ORBIT's `ETACalculator` is a pluggable module. When the PAJ project's Phase 1 GPS feed is live (target December 2026, KP–CP corridor), ORBIT can consume that feed immediately through a swap-in, requiring no architectural changes.

### How to Write This in Chapter 2

Frame the PAJ project as:
1. **Institutional validation** — A funded multi-year initiative by senior UTM researchers confirms the problem is real and formally recognised
2. **Current state of practice at UTM** — GPS tracking + ETA prediction is what the most advanced current initiative delivers
3. **The remaining gap** — GPS tracking makes buses visible; it does not make them demand-responsive

> *"The most directly relevant initiative is an active, funded research project at UTM itself — a multi-year IoT-GPS smart bus system led by faculty from the Faculty of Electrical Engineering and supported by UTM Fleet management. This project deploys GPS tracking infrastructure across all 8 UTM campus corridors, provides ETA prediction using machine learning models trained on operational data, and delivers real-time bus location to passengers via a mobile application and display screens at bus stops. However, the system's architecture is fundamentally passive: buses continue to operate on fixed schedules, and no mechanism exists for autonomous detection of or response to demand imbalances at stops. Students can see when the bus will arrive but cannot signal that they are waiting; the bus can be tracked but cannot decide to adjust its timing. ORBIT is designed to fill this gap — adding a Multi-Agent coordination layer that consumes GPS position data as input and produces demand-responsive timing decisions as output, transforming a visible transit network into an intelligent one."*

### On LightGBM/XGBoost vs ORBIT's Graph-Based ETA

The PAJ project uses gradient boosting ML for ETA prediction. ORBIT uses graph traversal. This distinction should be addressed in Chapter 2 if comparing approaches:

> *"The PAJ project's ETA prediction employs LightGBM and XGBoost models trained on months of real GPS operational data — an appropriate methodology given the availability of large-scale real-world traces. ORBIT, operating in the pre-data phase before such infrastructure exists, uses graph-based ETA calculation from the campus road network model. This distinction reflects context rather than capability: graph-based calculation is adequate for a fixed-route campus shuttle with low traffic variance, and the architecture explicitly supports a future swap-in of ML-based ETA once sufficient operational data is available through the PAJ project's GPS feed."*

---

## Part 10 — AI Anomaly Detection

### Isolation Forest — Liu et al. (2008)
**Full citation:** Liu, F.T., Ting, K.M., & Zhou, Z.H. (2008). Isolation forest. In *2008 Eighth IEEE International Conference on Data Mining* (pp. 413–422). IEEE.

Unsupervised anomaly detection. Builds ensemble of isolation trees. No labelled data required. Output: normal (1) or anomaly (-1).

**Why it fits here:**
- No labelled spam/genuine demand signal examples exist
- Trains on simulation run history
- Lightweight: trains in under a second
- One model per (stop_id, corridor_id, hour, weekday) bucket

**Scope statement for Chapter 4:**
> *"The anomaly detection component is a signal integrity mechanism, not a demand prediction model. It does not predict future transit demand; it detects whether an incoming sensor reading deviates from the learned normal distribution for that stop, corridor, and time context. The system's coordination intelligence remains fully rule-based, preserving interpretability and avoiding research-track framing."*

---

## Research Gap Statement (Final Version — Updated with PAJ Context)

> *"Existing campus transit optimisation studies produce static schedule improvements without real-time demand response (Noor et al., 2021), or apply MAS to urban networks without fixed-corridor constraints and student demand capture (Meignan et al., 2007; Jäger et al., 2018). Headway control theory validates timing-based intervention as sufficient for schedule variance reduction (Daganzo & Pilachowski, 2011), but no implementation combines voluntary student demand signalling, autonomous multi-agent dispatch coordination, and fleet manager visibility within a single campus transit system. Critically, even the most advanced active initiative at UTM itself — a funded multi-year IoT-GPS project deploying real-time bus tracking and ML-based ETA prediction across all campus corridors — addresses bus visibility but not demand-responsive coordination. GPS tracking makes buses visible; it does not make them intelligent. ORBIT addresses this gap through a three-layer architecture — student PWA for demand signalling, MAS backend for autonomous coordination, fleet dashboard for management visibility — designed to complement and consume the GPS infrastructure this tracking initiative will deliver, transforming a visible transit network into a demand-responsive one."*

---

## Citation Table

| Author | Year | Use For |
|---|---|---|
| Wooldridge & Jennings | 1995 | Definition of intelligent agent |
| Dijkstra | 1959 | Shortest path algorithm |
| Meignan et al. | 2007 | MAS bus simulation precedent |
| Jäger et al. | 2018 | Three-agent-type architecture precedent |
| Noor et al. | 2021 | Malaysian campus transit precedent |
| Daganzo & Pilachowski | 2011 | Headway control theory, rule-based sufficiency |
| Qatar Univ. IEOM | 2020 | Simulation evaluation methodology |
| Liu et al. | 2008 | Isolation Forest — anomaly detection |
| Al-Turjman et al. | 2019 | IoT in smart transportation |
| PAJ / Sharul et al. | 2026 | UTM Smart Bus IoT-GPS project — closest related work, institutional context, remaining gap |
