# Module 07 — ORBIT UTM Bus Routes Reference
> Rewritten 13 Nov 2026 from the UTM Fleet driver sheets Samy photographed on 17 Oct 2026
> (effective 12/10/2026; the A1 sheet is dated 6/10/2025).
> **The previous version of this file was stale** (2019 / 2023 data: 2 Bus E buses, Sunday–Thursday
> service, a 60-minute gap between B1 and B2). None of that is true any more.
> Timetables change a little each semester. Treat this as the operating pattern, not fixed
> numbers — the real timetable belongs in a config file per semester (`02_GRAPH_AND_SIMULATION.md`).
> Do not invent stops or times. Where a sheet is missing, this file says so.

---

## Quick facts

- **Operating days:** Monday–Friday. No service on Saturday, Sunday, public holidays or semester breaks — **except** Bus E1 (and reportedly E2), which run a weekend route.
- **Friday:** no service 12:40–14:00 on all routes.
- Every sheet says arrival times "may not be accurate due to traffic".
- **Main interchange:** CP (Canselori / Center Point). Jalan Amal is the second.
- **Buses seen on the sheets:** A1; B1–B3; C1–C3; D1; E1–E6; F1, F2; G1, G2; H.

---

## Bus E — KDOJ / KLG / KDSE → Faculty Cluster (6 buses)

The route ORBIT is built on first.

**Two paths:**
- **E1, E3, E5:** KDOJ – KLG – KDSE – CP – **N24** – KTC – Cluster
- **E2, E4, E6:** KDOJ – KLG – KDSE – CP – **Jalan Amal (D05)** – KTC – Cluster

**Which stops:** E1–E4 serve KDOJ, KLG and KDSE. **E5 and E6 are KDOJ-only**, with gaps in their day — they are supplementary buses.

**Cycle:** each bus runs a 60-minute cycle. It leaves KDOJ, and leaves Cluster T02 30 minutes later.

**Morning peak — a bus every 10 minutes from KDOJ, 7:00–9:30:**

| Bus | Leaves KDOJ (repeats hourly) |
|---|---|
| E1 | 7:00 |
| E2 | 7:10 |
| E3 | 7:20 |
| E4 | 7:30 |
| E5 | 7:40 |
| E6 | 7:50 |

E5 and E6 drop out after 8:40 / 8:50. E5 runs again at 10:00 and 11:00; E6 at 10:30.

**Midday — about every 15 minutes:** E1 11:00, E2 11:15, E3 11:30, E4 11:45, hourly to about 14:45.

**Evening — about every 15 minutes:** from 15:00 (E6), 15:15 (E5) …, last about 18:15.

**Night (E6):** from KDOJ 19:45, 20:15; from CP (FABU) 20:00, 22:00, 23:00.

**Weekend (Saturday and Sunday), E1:** KDOJ / KLG / KDSE → **K9/10** via CP – N24 – KTC. Leaves KDOJ 7:30, 9:00, 11:00, 13:00, 15:00, 17:00; leaves K9/10 30 minutes later. No service on public holidays. *(The E2 weekend sheet is missing.)*

**What this means for ORBIT:**
- UTM already adds buses — Bus E went from 2 to 6. E5 and E6 are fixed extras that run whether anyone is waiting or not. In ORBIT's design, buses like these become the **shared spare pool** (`01_AGENT_DESIGN.md`).
- A bus gets back to the terminus only a few minutes before its next departure (a 60-minute cycle for a round trip of about 55 minutes). So "the next bus leaves early" is rarely possible — which is why the spare waits nearby instead.
- Jalan Amal is a real stop on half of Bus E's trips.
- PKU is **not** a Bus E stop.

---

## Bus B — KP → Faculty Cluster (B1–B3)

```
KP → K9/10 → T02 → T08 → K9/10 → KP
```

- Morning peak: a bus every **10 minutes** from KP (B1 7:00, B2 7:10, B3 7:20; each on a 30-minute cycle, to about 9:50).
- Midday and evening: about every 13 minutes (40-minute cycles).

---

## Bus C — K9/10 → KTC → CP → Jalan Amal (C1–C3)

```
K9/10 → KTC → CP → Jln Amal → KTC → K9/10
```

- Morning peak: every 10 minutes.
- C2 has a night service.

---

## Bus D (D1 sheet only)

```
CP → N24 → FKT (N29) → P19 → CP        every 30 minutes
```

**Conflict, not resolved:** the older reference (and the official map legend quoted in earlier modules) had Bus D as KDOJ – KLG – KDSE – PKU – CP – Jln Amal – KDOJ. The Oct 2026 D1 sheet shows the loop above. The other D sheets are missing. Bus D is not modelled until Samy supplies them.

---

## Bus F — KTR → KTHO → KTDI → Jalan Amal → CP (F1, F2)

```
KTR → KTHO → KTDI → Jln Amal → CP → KTR
```

- The return departs from FKE (P19a).
- About every 15 minutes (alternating 10 and 20).
- F2 has a night service.

---

## Bus G — KTR / KTHO / KTDI → N24 → FKT (N29) → P19 → CP (G1, G2)

- About every 15 minutes.

---

## Bus H — CP → Jalan Amal → V01 (Taman U) → CP

- Every 30–40 minutes.

---

## Bus A1 — KP → CP → Jalan Amal → KP

- Every 30 minutes, plus a night service.

---

## Stops shared by more than one route

| Stop | Routes | Note |
|---|---|---|
| CP | A, C, D, E, F, G, H | Main interchange. Students change bus here. |
| Jalan Amal | A, C, E (E2/E4/E6), F, H | Second interchange, and a real stop on half of Bus E's trips. |
| N24 | D, E (E1/E3/E5), G | Shared stop |
| KTC | C, E | Shared stop |
| KDOJ / KLG / KDSE | E (and D on the older map) | |
| K9/10 | B, C, and E1 on weekends | |

**Counting at shared stops:** a student who picks a bus in the app counts for that bus, at any stop — CP and Jalan Amal included. ORBIT only declines to *guess* at CP and Jalan Amal when nobody there uses the app, because seven routes pass through and it can't tell who wants which bus.

**Changing bus:** the app plans it. Example: K9/10 → KDOJ is Bus C to CP, then Bus E. Example inside the simulated routes: KTR → Cluster is Bus F to CP, then Bus E.

---

## Simulation scope

Three routes: **Bus E** (built first), **Bus B**, **Bus F**. Buses, spares and timetables are loaded from data files, so adding a route later is adding data.

---

## Still missing

- The other Bus D sheets.
- The Bus E2 weekend sheet.
- Bus E's return path from the Cluster to KDOJ (stop order).
- Whether Cluster T04 / T06 are stops (left out for now: T02 → T08 direct).

Samy supplies these when convenient. Until then they are marked as assumptions in the config.
