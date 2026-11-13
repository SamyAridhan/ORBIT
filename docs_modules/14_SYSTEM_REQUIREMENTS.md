# Module 14 — What ORBIT Must Do (System Requirements)
> New module, 13 Nov 2026. A short list of everything ORBIT has to do, written from the design
> Samy locked on 11 Nov 2026 (`ORBIT_DESIGN_REVIEW_OPEN_DECISIONS.md`, section 3).
> This replaces the PSM1 use case map as the **working** list for design, build and tests.
> Each line has an ID so a test case in `01_AGENT_DESIGN.md` or a task in `12_BUILD_MILESTONES.md`
> can point back to the thing it proves.
> System name: ORBIT — On-Demand, Route-Based Intelligent Transit System.
> Status: written by Chatty from the locked design. The decisions behind every line are locked;
> the wording can still be sharpened.

---

## In one sentence (wording not yet confirmed by Samy)

> ORBIT turns students' trip requests into a live picture of where people are waiting, and uses
> that picture to help UTM Fleet match buses to real demand — on the day, and when planning each
> semester's timetable.

---

## Who uses ORBIT

| Who | What they use | What they want |
|---|---|---|
| Student | The ORBIT web app (PWA) | Which bus, when, will I fit, where do I change |
| Driver | Driver mode inside the same web app | Clear instructions, a way to say "can't", fewer pointless runs |
| Fleet manager | The dashboard | See what's happening, stay in control, evidence for the timetable |
| Stop Agent, Bus Agent, Coordinator | The backend | Software actors — see `01_AGENT_DESIGN.md` |

---

## For students

- **S1** Pick a destination once. The app works out which bus to take, including a change of bus.
- **S2** See when the next bus comes. If the position is only a timetable guess, it says "approximate".
- **S3** See how full the coming bus is.
- **S4** Be counted as waiting for a bus without logging in. The app is never required to ride.
- **S5** After the bus passes, be asked "did you get on?" when the app is open. No answer means "got on". "Still waiting" tells ORBIT someone was left behind — and a late "still waiting" always counts, as one person.
- **S6** When changing bus at CP or Jalan Amal, be counted for the second bus without tapping again.
- **S7** Be told about an extra bus ("Extra Bus E at KDOJ, 7:32") and about a short hold ("holding 2 min").
- **S8** Optionally tap how full the bus is while riding.
- **S9** Stay anonymous. No name, no student ID. Location is sent only to check the student is at the stop, then thrown away.

## For drivers

- **D1** Tap how full the bus is (about empty / half / full). When the bus is full, be asked one question — "Did you have to turn people away?" Yes / No / Not sure. The driver is asked, never expected to remember.
- **D2** Get an instruction as one big message with a sound, and answer "OK, going" or "Can't".
- **D3** Only get instructions while the bus is stopped. Never during a break.
- **D4** "Can't" is always respected. ORBIT tries another spare or tells the manager.
- **D5** ORBIT's data is for planning the service, not for judging drivers.

## For the fleet manager

- **M1** See every stop and bus live: who's waiting for which route, how full each bus is, where it is.
- **M2** Get an alert when a bus leaves people behind, with the numbers.
- **M3** Approve or skip an extra trip with one tap, with the reason shown.
- **M4** One setting for extra trips: Ask me first / Send automatically and tell me / Off. And: if I don't answer in N minutes — Send anyway / Skip.
- **M5** Timing controls only: hold a bus, release a hold, cancel an extra trip, return to the timetable. Never a route change.
- **M6** See strange counts flagged, not hidden.
- **M7** See a log of every decision with its reason, including what ORBIT *would* have done while it is only observing.
- **M8** Get planning reports: load per departure, how often people are left behind, empty runs, spacing, spare use, suggested trips per hour, and where the spare should wait. Shown with the working. UTM decides.

## What the system does

- **R1** Count who is waiting at each stop **for each route**, and report it all the time, including quiet stops.
- **R2** Know how full each bus is from the best source it has: door counter, then driver tap, then rider taps.
- **R3** Know where each bus is from the best source it has: PAJ GPS, then the driver's device, then a timetable estimate.
- **R4** Add up everyone waiting along a whole route against the seats on the coming bus.
- **R5** Notice a confirmed overflow: a bus really left full **and** people are really still waiting. "Still waiting" is known three ways: the app count against door-counter boardings, students' taps, or the driver's "Yes". Each is recorded against the bus that left them.
- **R6** Answer a confirmed overflow with a spare bus when one can make it (see `01`):
  1. spare nearby — it leaves between the full bus and the next scheduled bus, the earlier the better;
  2. spare further away and the next bus is already at the terminus — the next bus leaves a few minutes early and the spare covers the original time;
  3. neither — nothing moves; alert the manager and log it.
- **R7** When two routes need the spare at once, the bigger left-behind crowd goes first.
- **R8** One spare gets at most one job at a time. Each overflow gets at most one response.
- **R9** Hold a bus for a minute or two at a control point when it has caught up too close to the bus ahead, at peak only, and only when both buses' positions come from GPS.
- **R10** Flag a count that looks wrong, keep it, and don't act on it alone. Believe it if the driver or door counter agrees.
- **R11** Run in observation mode: decide, log, don't act. Report how often it would have been right.
- **R12** Learn what share of riders use the app at each stop, by comparing app counts with door counts.
- **R13** Give arrival times from plain travel times plus any hold. A busy stop never gets a shorter time because it is busy.
- **R14** Keep history only as anonymous totals per stop, route and time slot. Delete raw signals after 2 hours.
- **R15** Read the timetable, the buses, the drivers and the spare pool from data files. Adding a bus is adding a record.
- **R16** Let the simulator replay a timetable and a demand history, so a proposed timetable can be tried against recorded demand.

## What ORBIT never does

- **N1** Never takes away a departure students are counting on, and never makes one later to chase a queue.
- **N2** Never changes a bus's route. A spare on an extra trip drives that route's normal path.
- **N3** Never uses "arrival compression". It was removed in July 2026 and stays removed.
- **N4** Never acts on a flagged, unconfirmed count.
- **N5** Never sends an extra trip before a bus has actually left full, until the observation months show its predictions are right and that mode is switched on.
- **N6** Never instructs a moving bus or a driver on a break.
- **N7** Never needs the app. With zero app users, a driver's "Yes, I turned people away" is enough.
- **N8** Never becomes a single point of failure. If ORBIT is down or wrong, buses run the timetable.
- **N9** Never uses machine learning in the decision path. The only AI in that path is the Isolation Forest check that flags strange counts.

---

## What ORBIT assumes is there (not built by this project)

These are stated deployment assumptions. In the demo the simulator plays them.

| Assumed | Played in the demo by |
|---|---|
| A shared pool of spare buses (existing supplementary buses re-designated), waiting near the busiest spots at peak | Simulator, from a fleet data file |
| Any driver can drive any route; standby time is separate from breaks | Simulator |
| Door counters on buses, or drivers tapping how full and answering the "turned people away?" question | Injector |
| A screen in the bus for the driver (a phone or tablet running the web app) | Driver mode of the PWA |
| Bus positions from PAJ's GPS, or from the driver's device | Injector |
| 28 seats per bus | Config value (placeholder) |

What ORBIT builds: the three agents, the backend, the student app, the driver mode, the dashboard, the reports, and the simulator.

---

## Numbers that are placeholders

Set at build time, kept in config, never presented as settled: seats per bus (28); how close is "too
close" for a hold and the longest hold; the manager's answer timeout; how many left-behind people
justify an extra trip (starts at 1); pool size and where spares wait; the confidence needed before predicting
ahead; all travel times.

---

## Relationship to the PSM1 use case map

The PSM1 thesis has 12 use cases (UC1–UC12) accepted by the panel. That map is part of the
submitted thesis and is not edited. It no longer matches the design: there is now a Driver, a
Coordinator, manager approval, a spare pool and planning reports, and "Determine New Dispatch
Time" (UC7) no longer exists in that form. Redrawing the use case diagram for the PSM2 documents
is deferred to report-writing time, together with the PSM2 scope decision.

| PSM1 use case | Where it lives now |
|---|---|
| UC1 Detect Nearby Bus Stop | S1, S4 |
| UC2 Submit Bus Demand Signal | S1, S4 |
| UC3 View Real-Time Bus Status | S2, S3, S7 |
| UC4 Respond to Bus Boarding Prompt | S5 |
| UC5 Validate Demand Signal Integrity | R10, S9 |
| UC6 Report High Stop Demand | R1 (stops now report all the time) |
| UC7 Determine New Dispatch Time | Replaced by R4–R8 (Coordinator) |
| UC8 Adjust Bus Dispatch Timing | Replaced by R6, R9, D2 |
| UC9 Update Bus Capacity Status | R2, D1 |
| UC10 Track Fleet Operations | M1, M7 |
| UC11 Override Dispatch Decision | M3, M4, M5 |
| UC12 View Bus Capacity Overflow Alerts | M2 |
| — (new) | D1–D5, M8, R11, R12, R14–R16 |
