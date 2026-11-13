# Module 09 — Supervisor's Real Research Project & ORBIT's Position Within It
> Updated May 2026; **updated 13 Nov 2026** to the design locked on 11 Nov 2026.
> This module captures the PAJ-funded UTM Smart Bus project led by Dr. Sim's team,
> what it covers, what it doesn't, and exactly where ORBIT stands in relation to it.
> What changed on 13 Nov: ORBIT's position is now "demand picture + fleet decision support"
> (not "autonomous dispatch timing"); bus position has a three-step source order; a separate
> ORBIT student app is confirmed as fine; the report paragraphs further down are marked as PSM1
> wording. The facts about the PAJ project itself are unchanged.

---

## The Document

**Title:** Projek: Sistem Pengangkutan Bas Pintar Berasaskan IoT dan GPS di Kampus UTM Johor Bahru
*(Smart Bus Transportation System Based on IoT and GPS at UTM Johor Bahru Campus)*

**Funding Body:** PAJ (Pusat Amanah Jaminan — UTM internal research grant)
**Focus Area:** Wireless Communication / Smart Transportation

**Research Team:**
- **Principal Investigator:** Prof. Ir. Dr. Sharul Kamal Abdul Rahim
- **Dr. Sim Hiew Moi** ← your supervisor
- Dr. Pang Yee Yong
- Dr. Afifah Taat

**Dr. Sim's instruction to you:** *"Just use this as the proof of stakeholder."*
This is not just a stakeholder letter. This is the real funded research programme your FYP sits inside.

---

## What Their Project Does

### Core Problem Statement (from the proposal)
Year 1 and Year 2 UTM students are not allowed to bring private vehicles onto campus. They depend entirely on UTM's shuttle buses. Problems identified:
- Overcrowding (kesesakan)
- Unpredictable frequency — students cannot efficiently predict bus arrival
- Students at far colleges (KDSE, KDOJ) are burdened — they must wait with no notification or alerts about bus movement

### Proposed Solution Architecture
GPS trackers installed on each bus → 3G/4G transmission → Cloud platform → ETA calculation → Display to users

```
Bus with GPS tracker
    → 3G/4G cellular data
        → Cloud (data aggregation + analytics)
            → Fleet management dashboard (for operators)
            → Mobile app (for passengers: location + ETA)
            → PIDS display screens at bus stops (ETA display boards)
```

### Three Phases of Development

**Phase 1 — Proof of Concept (POC):**
- 1 main route: KP → CP (Kolej Perdana to Canselori)
- 4 bus stops, 3 buses
- Install GPS, test ETA display, validate data pipeline

**Phase 2 — Full Campus Deployment:**
- All 8 UTM JB corridors
- All identified bus stops
- Complete mobile app and dashboard
- API handover to UTM Digital at end of Phase 2

**Phase 3 — Maintenance and UTMSMART Integration:**
- UTM Digital takes over and integrates into UTMSMART ecosystem
- Ongoing monitoring

### Technology Stack (Their Project)

| Component | Technology |
|---|---|
| Bus tracking | HASTA GPS Tracker (hardware on bus) |
| Data transmission | 3G/4G cellular (SIM per bus) |
| GPS tracking server | Traccar (open source, free) |
| Cloud hosting | DigitalOcean VPS (4GB/2vCPU, ~RM600/month) |
| ETA prediction | LightGBM / XGBoost (gradient boosting ML models) |
| GTFS integration | GTFS Static + GTFS Real-Time data |
| Bus stop displays | Outdoor/weatherproof PIDS screens (~RM5,000/unit) |
| Mobile app | Passenger-facing app with bus location + ETA |
| Dashboard | Fleet monitoring dashboard for operators |

### Budget
- **Full package total: RM188,127** (including 23% UTSB overhead)
- Optional-only package: RM164,117
- GPS hardware cost: borne by UTM Fleet (not in their budget)
- Major costs: RM90,000 software engineer (12 months), RM16,000 consultant, RM15,000 training, RM7,200 VPS hosting

### Timeline
- **July 2026 → June 2028** (2 full years)
- Phase 1 POC: July–December 2026
- Phase 2 Full deployment: January 2027 onwards
- Phase 3 Maintenance: 2028

### Commercialisation Reference
The proposal references an existing commercialisation project under PAJ: **MBJB Smart Bus Stop** (Majlis Bandaraya Johor Bahru) — serving 100,000+ users/month. This confirms Dr. Sim's team has real deployed transit tech in the field.

---

## What Their Project Does NOT Do

This is the critical section. Read it before every report writing session.

| Gap | Why It Matters for ORBIT |
|---|---|
| No demand sensing from students | They track buses. They don't track student waiting queues. No mechanism exists to know how many students are at a stop. |
| No fleet decision support | The system shows ETAs based on GPS. It does not say: "a bus just left 7 people behind at KDSE — send the spare?" |
| No agents | Central server. No stop, bus or coordinator logic acting on demand. |
| No response to demand | The bus runs its schedule. The system displays where it is. |
| No queue awareness at stops | PIDS screens show ETA. They don't know if 3 students or 40 students are waiting. |
| No student demand capture | Students are passive consumers of bus location data. They cannot say where they are going. |
| No "left behind" signal | Nothing confirms that people could not board. |
| No planning evidence on demand | GPS history shows where buses were, not who was waiting or left behind. |

**One-line summary:** Their project answers *"Where is the bus?"* ORBIT answers *"Where are the people, and what should Fleet do about it?"*

---

## ORBIT's Exact Position

### The Layered View

```
UTMSMART Ecosystem (Future — Phase 3 of PAJ project)
    ↑
PAJ Project Output (2026-2028):
    GPS tracking infrastructure
    ETA prediction (LightGBM/XGBoost on real operational data)
    PIDS screens at stops
    Fleet dashboard (location + ETA)
    Passenger mobile app (location + ETA)
    ↑
ORBIT (your FYP — the demand and decision layer):
    Students' trip requests + door counts + driver taps → live demand picture
    Stop Agents + Bus Agents + Coordinator + MQTT
    A shared spare bus for a confirmed overflow; short holds for spacing; no route changes
    Fleet dashboard: live view, one-tap approval, decision log, planning reports
    Student app: destination, which bus, when, will I fit; driver mode for instructions
```

ORBIT is not competing with their project and does not "improve on" it. ORBIT is the **demand sensing and fleet decision support** that their tracking infrastructure enables but does not provide.

### A separate ORBIT app is fine (agreed 17 Oct 2026)
ORBIT's student app builds on PAJ's GPS and ETA and adds demand and decision support. The risk: students who use PAJ's passenger app are invisible to ORBIT. Two answers: ORBIT's `/api/demand` stays open to signals from other apps, and ORBIT's app has to be useful enough that students choose it (`08_STUDENT_APP_DESIGN.md`).

### The GPS Feed Relationship
ORBIT takes each bus's position from the best source available:

1. **PAJ GPS feed** — where it exists
2. **GPS from the driver's device** (the phone or tablet running driver mode)
3. **A timetable estimate** — shown everywhere as "approximate"

Where PAJ's own ETA exists, ORBIT uses it; otherwise ORBIT adds up plain travel times.

**Open risk — raise it whenever GPS integration planning comes up:** PAJ Phase 1 (the POC) covers only the KP–CP route. ORBIT's modelled routes are Bus B, E and F. Until Phase 2, ORBIT's routes rely on sources 2 and 3. In the FYP demo the simulator plays the position feed.

### Why Dr. Sim Supervised You Into This Space
Dr. Sim is on the PAJ project team. He knows exactly what that project delivers and what it doesn't. He put you in this space precisely because he knows the demand-response coordination gap exists and his own funded project doesn't fill it. Your FYP is the research exploration of that gap.

---

## How to Use This in Your Report *(PSM1 wording — rewrite for PSM2)*

> **Note (13 Nov 2026):** the paragraphs in this section are the PSM1 framing ("dispatch
> coordination", "demand-responsive timing decisions", a "pluggable ETA calculator"). The
> complementary-layers framing is still right and still locked. The wording about what ORBIT
> does must be redrafted from the current design when the PSM2 report is written.

### Chapter 1 — Problem Background
Reference the PAJ project as **institutional validation** of the problem:
> *"The severity of this problem has been recognised at the institutional level — a funded research initiative by UTM researchers is currently underway to deploy IoT-GPS tracking infrastructure across all 8 UTM campus bus corridors. However, this initiative addresses the bus visibility problem: providing real-time location and ETA data to passengers. The dispatch coordination problem — the absence of any mechanism for buses to autonomously detect and respond to demand imbalances — remains unaddressed. ORBIT is designed to fill this gap."*

### Chapter 2 — Related Work
Add as a dedicated subsection. Frame it as:
- Closest institutional precedent (same campus, same problem domain)
- What it contributes (GPS infrastructure, ETA display)
- What it does not address (demand sensing, coordination, autonomous decisions)
- How ORBIT complements rather than overlaps

### Chapter 2 — Research Gap
The gap statement becomes much stronger:
> *"Even the most directly related active initiative — a funded multi-year UTM research project deploying IoT-GPS tracking infrastructure across all campus corridors — does not address demand-responsive dispatch coordination. GPS tracking makes buses visible; it does not make them intelligent. ORBIT addresses this remaining gap through a Multi-Agent System coordination layer designed to consume GPS position data as input and produce demand-responsive timing decisions as output."*

### Chapter 3 — Methodology Justification
The pluggable ETA calculator design is now explicitly motivated by a real future integration target — not just a theoretical "future work" mention.

### Chapter 4 — Design
The `GPSBasedETA` module swap-in can be framed as designed for the PAJ project's GPS feed. This makes the design decision feel grounded in real institutional context.

### Chapter 5 — Future Work
> *"The most immediate deployment path is integration with UTM Fleet's GPS tracking infrastructure, currently under development as a funded research initiative. ORBIT's pluggable ETA calculator interface requires no architectural changes to consume a live GPS position feed. Once Phase 1 of the IoT-GPS project delivers GPS data from the KP–CP corridor, ORBIT can be deployed on that corridor with full real-time ETA capability."*

---

## On LightGBM/XGBoost vs ORBIT's Approach

Their project uses gradient boosting ML (LightGBM/XGBoost) for ETA prediction. ORBIT uses graph-based calculation. This is not a weakness — it is the appropriate choice for your context.

**Why they can use ML:**
- They will have months of real GPS operational data
- Actual bus traces at every second across every corridor
- Enough data to train models that learn route-specific variance (rain, events, time of day)

**Why ORBIT uses graph-based ETA:**
- No real operational data exists yet (simulation only in PSM2)
- Training ML on simulation data = circular (model learns the simulator, not reality)
- Fixed-route campus shuttle with predictable traffic: graph traversal is accurate enough
- Rule-based is more interpretable, debuggable, and appropriate at this stage

**If asked by panel or supervisor:**
> *"The PAJ project trains ETA models on months of real GPS operational data collected from actual bus runs. ORBIT is designed for the pre-data phase — before that infrastructure exists. Graph-based ETA estimation is appropriate when no training data is available and traffic variance is low (closed campus). Once the PAJ project's GPS feed is live and operational data accumulates, ML-based ETA prediction becomes a viable enhancement — the pluggable ETA calculator interface supports this without architectural changes."*

---

## Key Facts to Remember (Quick Reference)

| Fact | Value |
|---|---|
| PAJ project PI | Prof. Ir. Dr. Sharul Kamal Abdul Rahim |
| Dr. Sim's role | Named researcher (Ahli) |
| Budget | RM188,127 total |
| Timeline | July 2026 – June 2028 |
| Phase 1 scope | KP–CP corridor, 4 stops, 3 buses |
| ML method | LightGBM / XGBoost for ETA prediction |
| GPS platform | Traccar (open source) |
| Stop displays | PIDS screens (~RM5,000/unit) |
| End goal | Integration into UTMSMART via UTM Digital |
| Commercialisation ref | MBJB Smart Bus Stop, 100,000+ users/month |
| What it does NOT do | Demand sensing, agents, fleet decision support on demand |
| ORBIT's relationship | Demand and decision-support layer above their tracking infrastructure |
| Phase 1 coverage risk | KP–CP only — not Bus B / E / F |
