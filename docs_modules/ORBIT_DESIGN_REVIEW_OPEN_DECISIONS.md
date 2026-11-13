# ORBIT — Design Review: Decisions Tracker
> Started 17 Oct 2026 (Samy + Chatty): a whole-system, real-world review of ORBIT, pulled forward from the
> "Architecture & Real-World Plausibility Review" gate in `12_BUILD_MILESTONES.md`.
> **11 Nov 2026: the design decisions are now LOCKED** (section 3). This file was rewritten that day into a
> shorter "what was decided" record; the long back-and-forth was removed, the decisions and their reasons kept.
> **13 Nov 2026: applied.** Every module (00–12, README, ARCHIVE) now carries this design, a requirements
> list exists (`14_SYSTEM_REQUIREMENTS.md`), replacement Project instructions were drafted
> and pasted in by Samy the same day, and the Coddy catch-up note is written
> (`CODDY_CATCHUP_BRIEF.md`). Samy also confirmed the ten filled-in items (3.15) and locked the
> student adoption plan (3.14). Not yet done: giving Coddy the module set and the brief, and the build
> restarting. See section 5.
> This file stays as the record of **what was decided and why**. For how the system works now, read the modules.
> Evidence from real transport systems is in `ORBIT_REAL_WORLD_PRECEDENTS.md`.
> Last updated: 13 Nov 2026.

## How to work with Samy on this (his instructions)
- **Plain words, one thing at a time, with a concrete example.** He often comes to this tired; keep it light.
- **Never mark anything locked until he says so.** Definitive over fast.
- **He decides on his own.** Do NOT suggest consulting Dr Sim or UTM Fleet (he dropped that on 11 Nov). Unknown facts about UTM are **assumptions Samy sets** (section 6).
- **Before any building of the overflow handling (3.1) starts, confirm it with Samy once more.** (His condition for locking it.)
- A fast format he asked for: Chatty suggests an answer for each open item; he says yes, no, or "explain".

---

## 1. Build status
- Block 0 complete and on `main`. Block 1 Tasks 1–3 built and pushed (`47262d8`): demand levels, broadcast decision, interchange gate.
- **The build resumed on 13 Nov 2026.** Coddy synced the docs and reworked the Stop Agent (Tasks 2R, 3R and 9; reported `81b6e75`, pushed; 58 tests). Next: Block 1 Task 4.
- Effect of the locked design on what's built: Task 1 (levels) stays, as display only. Task 2 (broadcast rules) changes: stops report all the time. Task 3 (interchange gate) changes: app signals at CP / Jalan Amal now count (3.6).
- `12_BUILD_MILESTONES.md` was replanned on 13 Nov into Blocks 0–13 (core-first). First task on resume: Block 1 Task 2R.

---

## 2. What ORBIT is

**Objective (Chatty's wording; Samy agreed with the framing, wording not yet confirmed):**
> ORBIT turns students' trip requests into a live picture of where people are waiting, and uses that picture to help UTM Fleet match buses to real demand — on the day, and when planning each semester's timetable.

- **Student side:** a campus bus navigation app (where am I going, which bus, when, will I fit). Being useful is what gets students to use it.
- **Demand sensing:** a by-product of students using the app.
- **Fleet side:** live view, alerts, and professional planning reports.

**Value, ranked by how easy it is to convince UTM Fleet:**
1. **Planning reports** — evidence per departure (overflow, empty runs) for next semester's timetable. No change to daily operations.
2. **Live help** — overflow handling with a spare bus (3.1), alerts; the fleet manager stays in control.
3. **Automatic adjustments** — holding for spacing (3.4). Small.

**Honest value pitch:** ORBIT doesn't necessarily save money. The claim is better service from the buses and drivers UTM already has (fewer empty runs, fewer students left behind, less driver fatigue) plus evidence of where the problems are. ORBIT can't create seats that don't exist.

**Guiding principles (agreed 17 Oct):**
- **ORBIT builds the decision logic and the interfaces. Anything physical is a stated deployment assumption, played by the simulator in the demo.** Built: agents, backend, student app, dashboard, driver screen. Assumed, not built: door counters, driver tablet hardware, GPS hardware where PAJ doesn't cover, a shared spare-bus pool.
- **Design and build as if it will really be implemented.** The PSM2 scope question is deferred to report-writing time (section 4). Project docs describe the full real system; PSM-only constraints (e.g. `00` principle #7) govern the PSM2 report, not this design record.
- **Build core-first** (demand sensing → dashboard → planning reports; extras later) so a smaller complete PSM2 subset exists whenever scope has to shrink.
- **Design for growth:** later features must not need a rebuild (3.13).
- **If ORBIT is down or wrong, buses simply run the timetable.**

**PAJ relationship (agreed 17 Oct):** a separate ORBIT student app is fine; it builds on PAJ's GPS/ETA and adds demand and decision support. Risk: students on PAJ's app are invisible to ORBIT. Mitigations: keep `/api/demand` open to signals from other apps; and make ORBIT's app useful enough that students choose it. Framing: PAJ = "where is the bus", ORBIT = "where are the people, and what should Fleet do."

---

## 3. LOCKED design (all confirmed by Samy; 3.1 on 5 Nov and amended 11 Nov, the rest on 11 Nov unless noted; 3.14–3.17 on 13 Nov)

### 3.1 Handling a big queue — the spare bus (Decisions 1 + 3)
**Principle: ORBIT never takes away a departure students are counting on. A spare bus adds capacity.**

**Spare pool (stated assumption).** UTM re-designates some of its existing supplementary buses (E5/E6-style extras) as a **shared spare pool**. No new buses. A spare belongs to no route and can serve any route.

**Where the spare waits.** At peak it waits **where trouble is most likely** (e.g. KDOJ in the morning, the Cluster in the late afternoon), chosen from the planning data. It is still shared: like an ambulance, it waits where it's most likely needed but goes wherever it's called. With two spares, they wait at the two busiest spots.

**What happens when a bus leaves people behind:**
1. **Spare is nearby:** it leaves **any time between the full bus and the next scheduled bus — earlier is better.** No other bus changes its time. (Example: the 7:30 leaves full, the spare leaves about 7:32.)
2. **Spare is further away, and the next scheduled bus is already at the terminus:** Samy's original move — the next bus leaves a few minutes early (7:40 → 7:35) and the spare covers the original slot (7:40). This gives the spare time to drive over.
3. **Neither is possible:** don't move anything. Alert the fleet manager and log it for the planning report.

**Count the whole route, not one stop (Samy, 11 Nov).** Example: 28 seats; 15 waiting at KDOJ, 10 at KLG, 10 at KDSE. KDOJ looks fine, but 7 people get left at KDSE. ORBIT adds up everyone waiting along the route against the seats on the coming bus.

**When ORBIT acts (the trigger):**
- **Confirmed first:** a bus has really left full (door counter or driver tap) and people are really still waiting (students tap "still waiting" in the app, or the driver taps "left people behind").
- **Predicting ahead comes later:** sending the spare *before* a bus fills, from app numbers alone, is switched on only after the observation months show the predictions are right (3.8).
- **Two routes need the spare at once:** the bigger left-behind crowd goes first.

**Why the original wording was amended (11 Nov findings):** (a) buses get back to the terminus only a few minutes before their next departure (Bus E runs a 60-minute cycle for a ~55-minute round trip), so the next bus is usually not there to leave early; (b) students only signal once they're at the stop, a few minutes before the bus, so a far-away spare can't be called in time. Hence: spare waits nearby, confirmed trigger first.

**Why a spare pool beats adding fixed buses to certain routes:**
1. Demand moves around from day to day; a fixed extra bus can't follow it.
2. Fewer buses cover more (risk pooling): four routes that each overflow one day in four need four fixed extras, but a pool of two covers roughly 95% of the time. Smaller gain right before 8:00 lectures when several routes peak together.
3. A spare moves only when really needed; fixed extra trips run whether anyone is waiting or not.
4. No new buses to buy.
5. Timetable for the predictable, spares for the surprises: spare use is logged, and repeated patterns become permanent timetable trips next semester. The live system reduces its own workload over time.
6. Good for drivers: a spare driver drives only when needed — fewer pointless runs, less fatigue.

**Fleet manager approval.** One tap on their phone, with the reason shown ("7 left behind at KDSE, spare is at KDOJ — send it? [Approve] [Skip]"). **One simple setting**, no per-bus toggles:
- Extra trips: Ask me first / Send automatically and tell me / Off
- If I don't answer within [N] minutes: Send anyway / Skip
All three levels are built. Recommended default for real use: ask first. In the demo, show both.

**Driver side.** A **driver-mode screen inside the PWA** (not a separate app): a big instruction, an alert sound (like a Grab ping), and two buttons: **"OK, going"** and **"Can't"** (the driver's veto — flat tyre, break, any safety reason; ORBIT then tries another spare or alerts the manager). Instructions arrive only while the bus is stopped. Never pulls a driver out of a break. Policy to state: ORBIT's data is for planning service, not for judging drivers. The same screen carries the driver taps in 3.2.

**Signage.** The student app announces the extra bus ("Extra Bus E at KDOJ, 7:32"); a printed route card in the windscreen; a digital board is optional.

**Rollout in stages (data first):**
0. **Observation phase (a few months).** The app is purely informative. ORBIT collects data and runs in **shadow mode**: it decides what it would have done, logs it, and doesn't act. Weekly report: "ORBIT would have sent a spare 9 times; on 8 the bus really did leave people behind."
1. Planning reports. 2. Live alerts to the manager. 3. Driver instructions with manager approval. 4. Automatic, once trusted.
UTM gets value even if it only ever adopts stages 0–2. For the FYP, the simulator plays the observation months.

**Adoption friction and answers.** Fleet manager: trust, blame, another screen → reports first, ask-first mode, reasons shown, shadow-mode track record. Drivers: "an app bossing me", feeling watched, safety, breaks → stopped-only instructions, "Can't" veto, not-for-judging policy, fewer pointless runs. Students: only use it if it's useful.

### 3.2 How ORBIT knows a bus is full — three sources, best one first
1. **Door counters (APC)** where a bus has them.
2. **Driver tap** on the driver screen: "about empty / half / full" and "left people behind".
3. **Riders** tapping how full the bus is, in the app.
Same pattern as the GPS rule (3.12). Real systems use all three — see the precedents file.
Note: the planning reports (load per trip, empty runs, overflow) come mainly from door counters and GPS. The app adds what counters can't see: people left behind or still waiting, and where they want to go.

### 3.3 Dispatch rules — who decides and when (Decisions 14 + 4)
- The overflow check is done **per route**, by a small **coordinator** (3.11), not inside each bus. (The old Bus Agent checklist threw the alarm away exactly when every bus was full.)
- The LOW / MEDIUM / HIGH / CRITICAL levels stay only as **colours on the dashboard and app**. They no longer trigger anything.
- **Stops report their state all the time**, including quiet stops, because the dashboard and the planning reports need them.
- ORBIT does not act when: no spare can make it, the count is flagged as strange and nothing confirms it (3.7), or the manager's setting is Off / they skip.

### 3.4 Holding — INCLUDED (Decision 2; Samy's call, 11 Nov)
- A bus that has caught up too close to the bus ahead waits a minute or two at a chosen stop (a control point such as a terminus or major stop), at peak frequency only.
- **ETA:** the arrival time adds the remaining hold. **App:** shows "holding 2 min" to people on board and waiting.
- Based on the gap to the bus ahead, not on being ahead of the timetable.
- For the record: Chatty's review view was that holding has small value on this network (about 2 minutes of room per trip, and the timetable already spaces buses at the terminus) and suggested leaving it out of the first build. Samy chose to include it. Exact numbers (how close is "too close", maximum hold) are placeholders to set at build time.

### 3.5 "No changes near lecture time" rule — REMOVED (Decision 5)
The 12-minute protected window existed to protect students relying on a scheduled time. The locked design never takes a departure away, so the rule is no longer needed.

### 3.6 CP and Jalan Amal, and transfers (Decision 7)
- **Old rule (removed):** ORBIT ignored everyone waiting at CP and Jalan Amal.
- **New rule:** a student at CP or Jalan Amal who picks a bus in the app counts as waiting for that bus, the same as at any other stop. They show on the dashboard and count in that route's total.
- **Still ignored:** ORBIT's own schedule-based guesses for those two stops when nobody there uses the app (seven routes pass through; it can't tell who wants which bus).
- **Transfers are handled by the app (Samy):** the student picks a destination once (e.g. K10 → KDOJ). The app works out the trip (Bus C to CP, then Bus E), counts them for Bus C at K10, and when they reach CP counts them for Bus E by itself — no second tap. Limit: a web app can't check location while it's closed, so if the app is closed it catches up when the student opens it at CP.
- This **changes non-negotiable #5 in `00`** and **Task 3's code**. Doc fix as well: "interchange node" (routing: cp, jalan_amal, n24, ktc) is a different thing from the old "dispatch-suppressed stop". Jalan Amal (D05) is also on half of Bus E's route.

### 3.7 Strange numbers (Decision 8)
A count that looks implausible (e.g. 40 people on a quiet Saturday) is **flagged on the dashboard, not deleted**, and doesn't trigger anything by itself. ORBIT believes it if the driver or the door counter agrees. Reason: a filter based on a model goes blind on real unusual days (exams, events, rain).

### 3.8 What share of students use the app (Decision 9)
- **The app is never required.** ORBIT works without it, because the driver or door counter reports a full bus. More app users = ORBIT reacts faster and knows more; few users = it still works, more slowly.
- **The app helps from day one:** students see arrival times and how full the bus is; "still waiting" taps tell ORBIT how many were left behind; every use adds data.
- **ORBIT learns the app share per stop** during the observation months, by comparing app users with door counts.
- **Until then it acts only on a confirmed "left behind"** (3.1). After that, it can start predicting ahead.
- **Task 4 is rewritten to this** (the old `queue = app_count / adoption` formula with a fixed 30% is gone as a trigger).

### 3.9 Bus E's two paths (Decision 10)
E1/E3/E5 run CP → N24 → KTC; E2/E4/E6 run CP → Jalan Amal (D05) → KTC. The route map (graph) from Block 0 only has the N24 path; add the second so those buses show the right stops and arrival times.

### 3.10 Planning reports suggest trips per hour and where the spare waits (Decision 13)
- Method: riders per route per hour ÷ seats per bus = suggested trips per hour (170 ÷ 28 ≈ 6 → a bus every 10 minutes). Demand that shows up most days goes into the timetable; occasional surges are left to the spare pool. The report also suggests where the spare should wait at peak.
- Shown as evidence with the working; **UTM makes the final call.** What counts as a "typical day" and how full a bus may get are settings, not fixed truths.

### 3.11 Agents (replaces the six-step Bus Agent checklist in `01`)
- **Stop Agent:** keeps the count of who's waiting at its stop for each route; reports all the time.
- **Bus Agent:** owns its own state (position, load, hold), the driver screen, and carrying out instructions. Spares are Bus Agents too.
- **Coordinator:** watches each route's total against the coming bus, owns the spare pool, decides which overflow gets the spare.
- **Claim-lock changes shape:** from "at most one bus claims a stop" to **"one spare gets at most one job, and each overflow gets at most one response."** Still the target for the property-based test agreed with Huiming (`11`).
- Why agents and not one program: each stop and bus owns its own state and rules, buses are added as data, and the system falls back to the timetable.
- Blocks 2–4 in `12` must be replanned around this.

### 3.12 Agreed on 17 Oct (unchanged)
- **GPS source, best first:** PAJ GPS → driver tablet GPS → timetable estimate (shown as "approximate").
- **"Deployment Assumptions" section** to be written into the docs.
- **"Still waiting?" prompt:** shown when a student opens the app after their bus passed; web push only as a bonus.
- **Privacy statement fix (`08`):** coordinates ARE sent for the server-side location check, then discarded.
- **ETA fix:** fallback ETA uses plain travel times, never the queue-adjusted weights in `02` (a busy stop must not get a shorter ETA). Use PAJ's ETA where it exists.
- **Manager override = timing-only** (hold, release, approve/cancel, return to schedule). Remove `new_route_vector` / TC08 route wording.
- **Timetable as a config file** per semester (weekday, Friday, weekend patterns; which bus runs which path).
- **Destination picking** in the student app (Google Maps / Grab style); the UI redesign comes after the system design.
- **Fleet planning analyst:** core agreed in principle (section 4).

### 3.13 Design for growth (agreed 17 Oct)
- **Buses, drivers and the spare pool are data, not code** (pool size, where spares wait, drive time to each route start). Adding a bus means adding a record.
- **The simulator takes a timetable and a demand history as inputs**, so it can replay recorded demand against any proposed timetable.
- **Keep history as anonymous totals** per stop / route / time slot (no tokens, nothing personal); purge raw signals after 2 hours as before. `08`'s privacy statement must say this.
- **Operating limits are data** (number of buses, driver hours, Friday prayer gap, route paths).

### 3.14 How students come to use the app — LOCKED (Samy, 13 Nov 2026)
Adoption is not forced and not guaranteed, so the design never depends on it (3.8). The plan for getting students to use it naturally, with its evidence, is locked:
1. **Useful on its own from day one** — arrival time and "will I fit" (OneBusAway, LSU).
2. **No install, no login** — a link (NUS guest mode; UConn students' complaint about a separate app).
3. **At the point of need** — QR codes at stops and notices in buses (Rutgers, University of Minnesota).
4. **Win one route first** — Bus E and KDOJ / KLG / KDSE (Grab's first 40 drivers; Uber city by city).
5. **Catch each new intake** at orientation (Rutgers).
6. **Make the benefit visible** — "Extra Bus E at KDOJ, 7:32".
7. **Official backing** — UTM's transport page, college group chats (NUS).
Posters raise awareness but don't create the habit. No points, no gamifying, never required to board.
Full text and all source links: `08_STUDENT_APP_DESIGN.md` ("How students come to use it"); evidence notes: `06_RESEARCH_FINDINGS.md` Part 12.

### 3.15 Items filled in while writing the modules — CONFIRMED (Samy, 13 Nov 2026: "ok to all")
1. A "still waiting" tap counts as one person; the 1.5× missed-bus weight is retired.
2. The smallest left-behind crowd worth an extra trip is a placeholder number (no value set yet).
3. In the pull-forward case the spare's driver accepts first; only then is the next bus told to leave early.
4. A driver who doesn't answer an instruction in time counts as "Can't".
5. A driver's "left people behind" tap counts for both halves of the trigger.
6. Test cases are numbered TC101–TC141.
7. Rollout stage (`observe` / `alert` / `act`) is a deployment setting, separate from the manager's one setting.
8. Build order in `12`: core first, then the spare bus, holding, Isolation Forest, frontends.
9. Transfer demo inside the three simulated routes: KTR → Cluster = Bus F to CP, then Bus E.
10. Names of message topics, log events and API endpoints in `01` and `03` are proposals Coddy may adjust.

### 3.16 Knowing people were left behind — LOCKED (Samy, 13 Nov 2026, afternoon)
Raised by Coddy's sync report (a late "still waiting" tap would have been dropped) and by Samy's worry that an optional driver button is forgettable and that a driver can't always tell who was left.
- **A late "still waiting" tap always counts, as one person.** The one-signal-per-phone limit applies to "I'm waiting" only; "still waiting" and "changed bus" are updates to a person ORBIT already knows. (Ali taps 7:25, pockets his phone; the 7:30 leaves full and ORBIT assumes he boarded; at 7:35 he taps "Still waiting" — he is put back, once.)
- **Each left-behind is recorded against the bus that left them.** A tap after a bus that had empty seats confirms nothing — the student just missed it; no spare.
- **Three ways to know, the driver last:**
  1. *Automatic* — app says 10 waiting, door counter says 3 boarded and the bus is full → at least 7 left. Nobody taps.
  2. *Students* — "still waiting" taps.
  3. *Driver, asked* — when the bus is full at a stop the screen asks "Did you have to turn people away at the door?" Yes / No / Not sure. The optional "left people behind" button is removed.
- Per departure, take the **largest** source, never the sum. A driver's "Yes" counts for both halves of the trigger. "Not sure" or silence is "unknown", never "nobody".
- **Accepted limit:** no door counter + no app users + an unsure driver → ORBIT cannot know; it does nothing and the timetable runs. Samy: there is no other way; in real life this gets adopted gradually, as Uber did.
- Evidence (precedents file, section 6): Transit app asks riders after a departure has passed; Winnipeg drivers log pass-ups with a button; Vancouver uses pass-up data to add service; Calgary shows a memory-based driver button gets under-used; a Pittsburgh study shows door counters err too, so no single source is trusted alone. The exact one-phone-one-person rule is ORBIT's own — no source publishes how they de-duplicate.

### 3.17 Smaller rulings from Coddy's sync report — CONFIRMED (Samy, 13 Nov 2026)
1. The smallest left-behind crowd worth an extra trip **starts at 1** (still a placeholder).
2. **No holding unless both buses' positions come from GPS** (PAJ or driver device).
3. The **"expected" number is ORBIT's own schedule model**, outside the simulator; agent code never imports from `simulation/`.
4. The learned app share is an upper bound (noted in `01`).
5. The catch-up brief is saved in the repo; `AGENTS_BACKEND.md` rewritten short by Coddy, with no rule table.
6. Names: instruction field `kind`; topic `stops/{corridor_id}/{stop_id}/state`. Python: 3.11+, no repo pin.

---

## 4. Still open or deferred
- **For the spare-bus confirmation (before Block 4 / Block 9):** in the pull-forward case, approval and the driver's answer take time while the next bus is minutes from leaving. The Coordinator checks the time before proposing and before the pull-forward — but **what happens when the time has run out is not decided** (raised by Coddy, 13 Nov).
- **Build-time detail:** the format of the departure key (`departure_id`) — must identify one trip of one bus and work for a spare's extra trip.
- **PSM2 scope and problem statement (Decisions 0, 11) — deferred** to report-writing time. Examiner advised a smaller PSM2 scope. The real problem is now: fixed extra buses that don't follow demand, bunching, and peak overflow (not 2019's "too few buses").
- **Fleet planning analyst (Decision 12).**
  - *Core, agreed in principle:* a professional statistical analyst — ready-made reports with proper charts and statistics, presentable in a fleet meeting. "Reports first, AI on top": a deterministic reporting module (load per departure, overflow rate, empty runs, spacing, trends, before/after a timetable change, spare use, shadow-mode hit rate, suggested trips per hour), exportable weekly and per semester; AI commentary is an optional layer on top, outside the control loop. Left out of the PSM2 report; recorded here as real-system design.
  - *Still open:* exactly which statistics and formats; weekly vs semester; build order.
  - *Full analyst — draft potential only, to design after the system is complete:* proactive weekly findings ranked by impact; every claim linked to ORBIT's data; concrete timetable edits, not advice; each proposal tested by replaying real demand in the simulator; only proposes what's possible; questions secondary ("explain this" on a chart); possibly takes manager instructions ("I'm adding one more bus"). The propose-and-test loop doesn't strictly need AI.
- **Interface details (later stage):** hold notice, extra-bus notice, driver screen layout, manager approval notification, shadow-mode report, planning report design, destination-picking redesign.
- **Numbers to set at build time (placeholders):** how close is "too close" for a hold and the maximum hold; the manager's answer timeout; the confidence level before predicting ahead; pool size; seats per bus (28).

---

## 5. Next steps

**Done (Chatty, 13 Nov 2026):**
1. ✅ One-page "what ORBIT must do" list → `14_SYSTEM_REQUIREMENTS.md`.
2. ✅ Modules updated in one pass: `00`, `01`, `02`, `03`, `05`, `07`, `08`, `12`, README rewritten; `06`, `09`, `10`, `11`, ARCHIVE updated; `13` unchanged.
3. ✅ Coddy catch-up note written → `CODDY_CATCHUP_BRIEF.md`.
4. ✅ Adoption plan and its sources written into `08` and `06`; locked (3.14).

**Done (Samy, 13 Nov 2026):**
5. ✅ New Project instructions pasted in.
6. ✅ Filled-in items confirmed (3.15).

**Done (13 Nov, afternoon):**
7. ✅ Coddy synced `docs_modules/`, rewrote `CLAUDE.md` and `AGENTS_BACKEND.md`, and built Tasks 2R, 3R and 9. Samy ruled on 3.16 and 3.17; modules updated again.

**Left:**
7a. Give Coddy the updated module zip; Block 1 continues from Task 4.
8. **Confirm 3.1 once more before Block 4** (the first block that builds overflow handling). Blocks 1–3 don't depend on it.

**Carried over, no rush:** the simulation scenario library (section 8); the missing Bus D and E2-weekend sheets; Bus E's return path; which statistics go in the planning reports.

---

## 6. Assumptions Samy sets himself (was "to verify")
No outside consultation is planned. These are treated as stated assumptions in the design and played by the simulator.
- A shared spare pool exists (existing supplementary buses re-designated), and a spare can wait at or near a busy terminus at peak.
- Any driver can drive any route; standby time is separate from breaks.
- Buses have door counters, or drivers give a quick "how full / left people behind" tap.
- Drivers can receive instructions on a screen in the bus.
- Seats per bus: 28 (placeholder).
- Travel times and terminus waiting times in `02` are estimates.

**Data still missing (Samy can supply when convenient):** the other Bus D sheets (only D1 received; it shows CP → N24 → FKT(N29) → P19 → CP, not the KDOJ–KLG–KDSE–PKU–CP route in `07`/`02`); the Bus E2 weekend sheet.

---

## 7. Current UTM schedule — key facts (from Samy's screenshots, 17 Oct 2026; effective 12/10/2026, A1 sheet 6/10/2025)
Schedules change slightly each semester — treat this as the operating pattern, not fixed numbers.

- **Operating days:** Monday–Friday (no service Sat/Sun/public holidays/semester breaks), **except** E1 (and reportedly E2) run a weekend route. **Friday: no service 12:40–14:00** on all routes. Every sheet: "time of arrival may not be accurate due to traffic."
- **Bus E (6 buses):**
  - E1/E3/E5 via CP–N24–KTC; E2/E4/E6 via CP–D05 (Jln Amal)–KTC. E1–E4 serve KDOJ/KLG/KDSE; **E5 and E6 are KDOJ-only** with gaps (supplementary buses).
  - Each bus runs a 60-min cycle: departs KDOJ, departs Cluster T02 30 min later.
  - KDOJ morning departures every **10 min, 7:00–9:30** (E1 7:00, E2 7:10, E3 7:20, E4 7:30, E5 7:40, E6 7:50, repeating hourly; E5/E6 drop out after 8:40/8:50, E5 resumes 10:00 & 11:00, E6 10:30).
  - Midday ~every 15 min (E1 11:00, E2 11:15, E3 11:30, E4 11:45, hourly to ~14:45). Evening ~every 15 min (from 15:00 E6, 15:15 E5 … last ~18:15).
  - E6 night service: KDOJ 19:45, 20:15; from CP (FABU) 20:00, 22:00, 23:00.
  - **Weekend (Sat & Sun), E1:** KDOJ/KLG/KDSE → **K9/10** via CP–N24–KTC; KDOJ 7:30, 9:00, 11:00, 13:00, 15:00, 17:00; from K9/10 30 min later. Public holidays: no service.
  - Timetable check: KDOJ → Cluster departure 30 min later vs graph's 26 min end-to-end — placeholder travel times look right.
- **Bus B (B1–B3):** KP – K9/10 – T02 – T08 – K9/10 – KP. KP departures every **10 min** at morning peak (B1 7:00, B2 7:10, B3 7:20, each 30-min cycle, to ~9:50); midday/evening ~every 13 min (40-min cycles). The old "60-min gap B1→B2" in `07` no longer exists.
- **Bus C (C1–C3):** K9/10 – KTC – CP – Jln Amal – KTC – K9/10. Every 10 min at morning peak; C2 has night service.
- **Bus D (D1 sheet):** CP – N24 – FKT(N29) – P19 – CP, every 30 min (other sheets missing).
- **Bus F (F1, F2):** KTR – KTHO – KTDI – Jln Amal – CP – KTR; return departs FKE (P19a). ~15-min headway (alternating 10/20); F2 night service.
- **Bus G (G1, G2):** KTR/KTHO/KTDI – N24 – FKT(N29) – P19 – CP. ~15-min headway.
- **Bus H:** CP – Jln Amal – V01 (Taman U) – CP, every 30–40 min.
- **Bus A1:** KP – CP – Jln Amal – KP, every 30 min (+ night service).

**What this means:** UTM already "bombards" (Bus E went from 2 to 6 buses; E5/E6 are KDOJ-only extras on a fixed timetable). ORBIT makes that smart: the extras become a shared spare pool that goes where and when the crowd is. `07_UTM_BUS_ROUTES_REFERENCE.md` is stale (2019/2023 data: 2 E buses, Sun–Thu operation).

---

## 8. To-do: simulation scenario library
The simulator becomes a library of realistic scenarios, also used to play the observation months for the FYP. Extends the four presets in `02`. Candidates: normal weekday; first week of semester; exam week; big events (convocation, career fair); heavy rain; Friday prayer gap, weekends, public holidays; a "messy day" (bus breakdown, traffic jam on one route).
**Wanted from Samy over time (no rush):** the UTM academic calendar, big recurring events, and campus knowledge (e.g. "everyone heads to KDOJ after the 5pm class").

---

## 9. Review history (short)
- **17 Oct:** first whole-system review. Found the design assumed things it couldn't know (bus load, what the driver is told, app share, GPS on B/E/F), and that early departure checked the wrong gap. New schedule data showed UTM now runs 6 Bus E buses every 10 minutes at peak. ORBIT reframed as demand picture + fleet decision support + planning reports.
- **5 Nov:** Decisions 1 + 3 locked as Samy's "pull forward + spare backfill", with the shared spare pool, approval setting, driver screen and staged rollout.
- **6 Nov:** Samy raised the dispatch-rules question (when exactly does ORBIT dispatch?).
- **13 Nov (afternoon):** Coddy's sync report found real gaps (late "still waiting" taps dropped; `expected` tied to the simulator; a race in the pull-forward case; holding on timetable positions). Samy questioned the optional driver button; evidence collected (Transit app, Winnipeg, Vancouver, Calgary). Locked 3.16 and confirmed 3.17. Coddy built Tasks 2R, 3R and 9.
- **13 Nov:** all modules rewritten or updated to the locked design; requirements list, replacement Project instructions (pasted by Samy) and the Coddy catch-up note written. Samy confirmed the ten filled-in items (3.15) and locked the student adoption plan with its sources (3.14).
- **11 Nov:** head-to-toe review. Findings: the next bus is rarely at the terminus early enough to pull forward; ORBIT hears about queues late; planning reports depend on door counters more than the app; the agent design and requirements were out of date. Decision 1 amended (spare waits nearby, confirmed trigger, whole-route count) and all remaining decisions locked the same evening. Real-world precedents collected.
