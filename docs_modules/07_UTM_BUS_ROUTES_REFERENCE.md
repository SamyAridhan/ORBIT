# Module 07 — ORBIT UTM Bus Routes Reference
> Updated May 2026. Complete reference for all confirmed UTM Skudai bus routes, stops, and stop relationships.
> Source: Official UTM Fleet Schedule (KDOJ website, 2023); UTM StudentPPI PDF (2019).
> This is the ground truth for building the ORBIT campus graph. Do not invent stops.

---

## Quick Reference: Total System

- **Total bus services:** 19
- **Total corridor types:** 8 (A through H)
- **Operating days:** Monday–Friday only (no service Sunday, Saturday, public holidays, semester breaks)
- **Arrival times:** explicitly stated as NOT guaranteed due to traffic
- **Main interchange:** CP (Canselori/Center Point) — appears in routes A, C, D, E, F, G, H

---

## Route A — Kolej Perdana Loop

**Buses:** A1, A2
**Valid:** 1/1/2023 to 31/12/2023 (confirm renewal with Dr Sim)
**Type:** Loop service

```
KP → CP → Jln Amal → KP
(Kolej Perdana → Canselori/Center Point → Jalan Amal → back to Kolej Perdana)
```

**Stop sequence:**
1. Kolej Perdana (KP) — origin/terminus
2. CP (Canselori/Center Point)
3. Jalan Amal
4. Return to KP

**Notes:**
- Pure loop — serves the KP residential college to the CP/commercial area
- Low complexity, primarily serves KP residents going to Jalan Amal or CP
- Not a primary faculty-commute route

---

## Route B — KP to Faculty Cluster

**Buses:** B1, B2, B3
**Valid:** 1/1/2023 to 31/12/2023 (confirm renewal)
**Type:** Shuttle — KP and K9/10 to Faculty Cluster and back

```
KP → K9/10 → T02 → T08 → K9/10 → KP
(Kolej Perdana → Kolej 9/10 → Cluster T02 → Cluster T08 → back)
```

**Stop sequence outbound:**
1. Kolej Perdana (KP)
2. Kolej 9 / Kolej 10 (K9/10)
3. Cluster T02 (Faculty block T02)
4. Cluster T04 / T06 (if stopping — confirm with Fleet)
5. Cluster T08

**Return:** T08 → K9/10 → KP

**Staggered departure times (approx from 2019 schedule):**
- B1: ~07:15 from KP
- B2: ~08:15 from KP
- B3: ~10:00 from KP (Wednesday-specific in some schedules — verify)

**Notes:**
- This is a primary faculty commute route
- KP + K9/10 are large residential colleges — high morning demand expected
- 60-minute gap between B1 and B2 during the most critical pre-lecture window
- **This gap is one of the key dispatch timing problems your system addresses**

---

## Route C — K9/10 to Lingkaran Ilmu

**Buses:** C1, C2, C3
**Valid:** 1/1/2023 to 31/12/2023 (confirm renewal)
**Type:** Shuttle — K9/10 through central campus

```
K9/10 → KTC → CP → Jln Amal → KTC → K9/10
```

**Stop sequence:**
1. Kolej 9/10 (K9/10)
2. KTC
3. CP (Canselori/Center Point)
4. Jalan Amal
5. KTC
6. Return to K9/10

**Staggered departures (approx):**
- C1: ~07:30
- C2: ~10:15
- C3: ~13:15

**Notes:**
- Covers different central campus stops than Route B
- C routes serve K9/10 students needing to access KTC and CP areas

---

## Route D — KDOJ to Lingkaran Ilmu

**Buses:** D1, D2
**Valid:** 1/2/2023 to 31/1/2026 ✅ (currently active)
**Type:** Loop — KDOJ corridor through south campus to CP

```
KDOJ → KLG → KDSE → PKU → CP → Jln Amal → KDOJ
```

**Full stop sequence:**
1. KDOJ (Kolej Dato' Onn Jaafar) — origin
2. KLG (Kolej Lembah Gelang / foundation college)
3. KDSE (Kolej Datin Seri Endon)
4. PKU (Pusat Kesihatan UTM — UTM Health Centre)
5. CP (Canselori/Center Point)
6. Jalan Amal
7. Return to KDOJ

**Notes:**
- Serves the southern residential cluster (KDOJ, KLG, KDSE)
- This route goes to CP and Jalan Amal — NOT to the Faculty Cluster
- Students from KDOJ needing to reach the Faculty Cluster must take **Bus E**, not Bus D
- PKU stop useful for students with medical appointments
- **Key design fact:** A student at KDOJ waiting for Bus D is going to CP/Jalan Amal. A student at KDOJ waiting for Bus E is going to the Cluster. These are different students with different destinations.

---

## Route E — KDOJ to Faculty Cluster

**Buses:** E1, E2
**Valid:** 1/2/2023 to 31/1/2026 ✅ (currently active)
**Type:** Shuttle — KDOJ corridor to Faculty Cluster via CP→N24→KTC

```
KDOJ/KLG/KDSE → (CP → N24 → KTC) → Cluster T02–T08
```

**Full stop sequence:**
1. KDOJ (Kolej Dato' Onn Jaafar)
2. KLG (Kolej Lembah Gelang)
3. KDSE (Kolej Datin Seri Endon)
4. CP (transit waypoint)
5. N24
6. KTC
7. Cluster T02
8. Cluster T06 (if stopping — confirm)
9. Cluster T08

**Notes:**
- **This is the critical pre-lecture commute route for KDOJ/KDSE/KLG students going to faculties**
- Only 2 buses (E1, E2) — smaller fleet than Bus B (3 buses)
- Route is longer and more complex than Bus B — goes through CP, N24, KTC before reaching Cluster
- High demand corridor: KDOJ, KLG, KDSE collectively house hundreds of students who need the Cluster
- **Likely the highest-impact corridor for your MAS system to model**

---

## Route F — KTR to Lingkaran Ilmu

**Buses:** F1, F2, F3
**Valid:** 1/2/2023 to 31/1/2026 ✅ (currently active)
**Type:** Loop — KTR corridor to CP

```
KTR → KTHO → KTDI → Jln Amal → CP → KTR
```

**Stop sequence:**
1. Kolej Tun Razak (KTR)
2. Kolej Tun Hussein Onn (KTHO)
3. Kolej Tun Dr Ismail (KTDI)
4. Jalan Amal
5. CP (Canselori/Center Point)
6. Return to KTR

**Notes:**
- Serves the KTR/KTHO/KTDI residential cluster (west/north-west of campus)
- Three buses — larger fleet than Route E
- Connects residential colleges to CP/Jalan Amal commercial and admin area

---

## Route G — KTR to SKT via N24

**Buses:** G1, G2, G3
**Valid:** 1/2/2023 to 31/1/2026 ✅ (currently active)
**Type:** Shuttle — alternative KTR corridor route

```
KTR/KTHO/KTDI → N24 → SKT → P19 → CP
```

**Stop sequence:**
1. Kolej Tun Razak (KTR)
2. Kolej Tun Hussein Onn (KTHO)
3. Kolej Tun Dr Ismail (KTDI)
4. N24
5. SKT
6. P19
7. CP

**Notes:**
- Alternative route for KTR/KTHO/KTDI students serving different internal campus stops (N24, SKT, P19) compared to Route F
- Both F and G serve the same three residential colleges but via different campus internal roads
- Terminates at CP

---

## Route H — CP to Taman U

**Buses:** H (single bus)
**Valid:** 1/2/2023 to 31/1/2026 ✅ (currently active)
**Type:** Short shuttle — CP to adjacent off-campus area

```
CP → Jln Amal → V01 (Taman U) → CP
```

**Stop sequence:**
1. CP (Canselori/Center Point)
2. Jalan Amal
3. V01 (Taman Universiti area)
4. Return to CP

**Notes:**
- Only 1 bus — smallest service
- Connects campus to the Taman Universiti commercial area just outside campus
- Students living off-campus in Taman U use this to get to CP

---

## Corridor Comparison Table

| Route | Buses | Origin Colleges | Destination | Fleet Size | Complexity |
|---|---|---|---|---|---|
| A | A1, A2 | KP | CP, Jalan Amal | 2 | Low |
| B | B1, B2, B3 | KP, K9/10 | Faculty Cluster | 3 | Medium |
| C | C1, C2, C3 | K9/10 | KTC, CP, Jalan Amal | 3 | Medium |
| D | D1, D2 | KDOJ, KLG, KDSE | CP, Jalan Amal | 2 | Medium |
| E | E1, E2 | KDOJ, KLG, KDSE | Faculty Cluster | 2 | High |
| F | F1, F2, F3 | KTR, KTHO, KTDI | CP, Jalan Amal | 3 | Medium |
| G | G1, G2, G3 | KTR, KTHO, KTDI | CP via N24/SKT | 3 | Medium |
| H | H | — | Taman U (V01) | 1 | Low |

---

## Key Relationships to Model in Simulation

### Stops That Appear in Multiple Corridors (Shared Nodes)

| Stop | Routes That Use It | Implication |
|---|---|---|
| CP | A, C, D, E, F, G, H | Major interchange — students transfer here |
| Jalan Amal | A, C, D, F, H | Secondary interchange |
| N24 | E, G | Shared waypoint |
| KTC | C, E | Shared waypoint |
| KDOJ/KLG/KDSE | D, E | Served by two different routes to different destinations |

### The KDOJ Destination Ambiguity (Concrete Example)
A student physically standing at KDOJ could be waiting for:
- **Bus D** → going to CP/Jalan Amal (admin, shopping, PKU)
- **Bus E** → going to Faculty Cluster (lectures at T02–T08)

Your simulation models these as separate Stop Agent instances: `kdoj_bus_d` and `kdoj_bus_e`. Each generates demand independently based on time of day and destination patterns.

---

## Recommended Simulation Scope (3 Corridors for PSM1)

Do not try to model all 8 corridors for PSM1. Model the three most representative:

**Priority 1 — Bus E (KDOJ → Cluster)**
- Highest impact: critical pre-lecture commute, only 2 buses, long complex route
- Best demonstrates the dispatch timing problem
- KDOJ/KLG/KDSE are large colleges with high student populations

**Priority 2 — Bus B (KP → Cluster)**
- Complementary corridor to Bus E — same destination, different origin
- 3 buses, allows comparison of fleet size effect
- Demonstrates that Bus B and Bus E NEVER coordinate (different corridors, same destination)

**Priority 3 — Bus F (KTR → CP)**
- Simpler loop structure — good contrast to the E/B faculty commute routes
- Tests the system on a non-faculty-cluster corridor

This 3-corridor scope gives you: 6 Bus Agents (E1, E2, B1, B2, B3, F1), ~10 Stop Agent instances, full claim-lock and headway-control testing.

---

## Questions for Dr Sim (Route-Specific)

1. Are Routes A/B/C renewed beyond December 2023?
2. Do KDOJ students queue separately for Bus D and Bus E, or at the same physical location?
3. What are the actual current departure times for Bus E? (Critical — 2019 schedule may be outdated)
4. Is the faculty cluster (T02–T08) one stop or multiple stops on the bus route?
5. Which corridor/stop does UTM Fleet consider the most problematic?
6. Does Bus E ever run full and leave students behind at KDOJ?
7. Are there any stops where consistently long queues are known to the Fleet office?
