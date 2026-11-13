# Module 08 — ORBIT Student App & Driver Mode
> Rewritten 13 Nov 2026 to the design locked on 11 Nov 2026.
> **Changed:** the student picks a destination, not a bus; the app plans a change of bus and
> counts the student for the second bus by itself; signals at CP and Jalan Amal count; a
> "did you get on?" prompt on app open; how full the bus is, from door counters, drivers or
> riders; hold and extra-bus notices; a driver mode inside the same web app; strange counts are
> flagged, not blocked; the privacy statement is corrected (coordinates ARE sent, checked, then
> discarded). New section: how students come to use it — **locked by Samy on 13 Nov 2026**, with
> its key points and sources.
> The screen sketches here show what each screen must do. **The visual redesign comes later**,
> with Samy — he puts heavy weight on usability. The built prototype still shows the old flow
> (`10_PROTOTYPE_STATUS.md`).
> System name: ORBIT (On-Demand, Route-Based Intelligent Transit System).

---

## What the app is

A Progressive Web App. A student opens a link or scans a QR code at a bus stop — no download, no App Store, no login. It works on any modern phone.

**What it is for the student:** a campus bus navigation app. Where am I going, which bus, when does it come, will I fit, where do I change.

**What it is for ORBIT:** every student who uses it tells ORBIT, without any extra effort, where someone is waiting and for which bus. Demand sensing is a by-product of the app being useful.

**The app is never required.** A student without it rides exactly as today. ORBIT still works with zero app users, because drivers and door counters report full buses (`01_AGENT_DESIGN.md`).

**Why a PWA:** nothing to install, same on iOS and Android, no store review, UTM IT need not publish it, and a QR code at a stop opens it in one step.

---

## Student flow

```
Student at KDOJ opens the app (link or QR at the stop)
    ↓
App finds the stop: "📍 KDOJ"
    ↓
"Where are you going?"  → student picks: Faculty Cluster (T02)
    ↓
App plans the trip:  Bus E, direct.  Next: ~6 min.  Fairly full.
    ↓
Student is now counted as waiting for Bus E at KDOJ.   (nothing more to tap)
    ↓
Bus arrives. Student gets on.
    ↓
Later, if the app is open: "Did you get on?"   [I'm on]  [Still waiting]
    (no answer = got on)
```

**With a change of bus:**

```
Student at K9/10 picks: KDOJ
    ↓
App plans:  Bus C to CP  →  change  →  Bus E to KDOJ
    ↓
Counted for Bus C at K9/10.
    ↓
Student reaches CP. App (if open) sees they are at CP:
    counted for Bus E at CP, removed from Bus C.   No second tap.
```

A web app cannot check location while it is closed. If the app is closed during the ride, it catches up the moment the student opens it at CP.

---

## What each screen must do

### 1. Find the stop
- Ask for location. Match to the nearest stop within its geofence (80 m; 100 m at CP).
- Not near a stop: the student can still browse — pick a stop and see arrival times — but is **not** counted as waiting.
- Location refused: same as browsing.

### 2. Where are you going?
- **Destination first**, the way Google Maps or Grab works — not "pick Bus D or Bus E".
- Show places in plain words ("Faculty Cluster", "KDOJ"), with the bus as the answer, not the question.
- The app returns the trip: one bus, or two with the change point.
- If more than one bus fits (for example two Bus E paths, or Bus B and Bus E to the Cluster from different sides), show the one that arrives first.

### 3. Your bus
```
┌─────────────────────────────┐
│ 📍 KDOJ → Faculty Cluster   │
│ ─────────────────────────── │
│ Bus E          ~6 min       │
│ Fairly full   ▓▓▓▓▓▓▓░░░    │
│ Last seen at: Cluster T02   │
│                             │
│ Then: Bus E   ~16 min       │
│ ─────────────────────────── │
│ 12 people waiting here      │
│ [Change destination]        │
└─────────────────────────────┘
```
- **Arrival time:** plain travel time plus any hold. If the bus's position is only a timetable estimate, show "approximate".
- **How full:** from the best source — door counter, driver tap, rider taps. Shown as a simple level (plenty of room / fairly full / full). When the source is weak, say so lightly ("reported by riders").
- **Last seen at:** the last stop the bus passed. Not a moving dot.
- **Freshness:** no update for 5 minutes → "Bus position unavailable — showing timetable".
- **Colour level** of the stop (green / yellow / orange / red) is information only.

### 4. Notices
- **Holding:** "Bus E is holding 2 min at KDOJ to keep buses evenly spaced." Shown to people on board and people waiting. The arrival time already includes it.
- **Extra bus:** "Extra Bus E at KDOJ, 7:32." Shown to everyone waiting for that route.
- **No promise it can't keep:** when no spare is available the app says nothing special — it shows the next scheduled bus honestly.
- Never any wording that suggests a bus "sped up" for someone. That mechanism does not exist (`05_GROUNDING_CHECKLIST.md` Trap 11).

### 5. Did you get on?
- Shown when the student has the app open, or opens it, after their bus has left the stop. A web push notification is a bonus where the phone allows it, not something to rely on.
- **[I'm on]** — removed from the count. Optionally: "How full is it?" (plenty of room / fairly full / full).
- **[Still waiting]** — stays in the count and is marked as left behind. This is one of the two things that confirm an overflow.
- **No answer = got on.** (Locked.)
- One person is one person. There is no extra weight for a "still waiting" tap.

### 6. On board (optional)
- One tap: how full is this bus? Helps buses with no door counter.

---

## Driver mode

A screen inside the same web app — not a separate app. The driver's phone or a tablet in the bus opens the same link in driver mode.

```
┌─────────────────────────────┐
│ Bus S1 — spare              │
│                             │
│   EXTRA TRIP                │
│   Bus E from KDOJ           │
│   Go now                    │
│                             │
│  [ OK, GOING ]   [ CAN'T ]  │
└─────────────────────────────┘
```

**What the driver can tap, any time the bus is stopped:**
- How full: about empty / half / full
- "Left people behind"
- On break / back

**What the driver receives:**
- One big instruction with an alert sound (like a Grab job ping): extra trip, leave early, hold, or carry on as scheduled.
- Two buttons: **OK, going** and **Can't**.

**Rules:**
- Instructions arrive only while the bus is stopped.
- Never during a break.
- **Can't** is always respected — flat tyre, fuel, safety, anything. ORBIT then tries another spare or tells the manager. No reason has to be given.
- No answer within the time limit counts as Can't.
- Policy, stated on the screen and in the docs: ORBIT's data is for planning the service, not for judging drivers.
- The same device can supply the bus's position when PAJ GPS doesn't cover the route.

**What's in it for drivers:** a spare moves only when it is really needed — fewer pointless runs, less fatigue.

**Signage for an extra trip:** the app announcement, plus a printed route card in the windscreen ("BUS E"). A digital board is optional.

---

## Technical notes

### Stops (`stops.json`)
```json
[
  {"stop_id": "kdoj", "name": "KDOJ", "full_name": "Kolej Dato' Onn Jaafar",
   "lat": 1.5548, "lng": 103.6285, "geofence_radius_m": 80,
   "corridors": ["E"]},
  {"stop_id": "cp", "name": "CP", "full_name": "Canselori / Center Point",
   "lat": 1.5590, "lng": 103.6370, "geofence_radius_m": 100,
   "corridors": ["A", "C", "D", "E", "F", "G", "H"]}
]
```
There is no `is_interchange` flag that silences a stop. A student at CP who picks a bus is counted like anyone else.

### Signals the app sends
```json
{
  "stop_id": "kdoj",
  "corridor_id": "E",
  "destination": "cluster_t02",
  "lat": 1.5549, "lng": 103.6286,
  "timestamp": "2026-11-16T07:22:00+08:00",
  "token": "anon_7f3a2b",
  "signal_type": "initial",
  "app_version": "2.0"
}
```
`signal_type` is `initial`, `still_waiting` or `transfer`. `lat` / `lng` are used for the server-side stop check and then discarded.

### Live updates
One WebSocket per stop and route (`/ws/app/{stop_id}/{corridor_id}`): arrival time, how full, last stop passed, hold notice, extra-bus notice, and the "did you get on?" prompt. Reconnect automatically when it drops.

---

## Keeping the count honest — without a login

The question: with no login, what stops one person sending 50 signals?

### Layer A — you have to be at the stop
A signal is accepted only if the phone's coordinates are within the stop's geofence. The check runs on the server. A hundred signals for KDOJ sent from a dorm room all fail it. The reply never says why, so the check can't be probed.

### Layer B — one token, one signal
The app holds an anonymous random token in the browser. One token gives one accepted signal per stop, per route, per 30 minutes. A repeat is ignored silently. A "still waiting" tap keeps the same person in the count; it doesn't add a second one. Clearing browser storage gives a new token — an accepted limit; the effort isn't realistic for a bus queue.

### Layer C — strange counts are flagged, not blocked
If the count at a stop looks implausible for that place and time (more than three times the schedule-based expectation; later, an Isolation Forest check), ORBIT **flags it on the dashboard and keeps it**. A flagged count triggers nothing on its own. If the driver or the door counter agrees — the bus really did fill — ORBIT believes it.

*Example:* 40 signals at KDOJ at 2 pm on a Saturday. Flagged. If it's a prank, the bus arrives, doesn't fill, and nothing happens. If it's a real event, the bus leaves full, the driver taps "left people behind", and ORBIT acts.

Why not block: a filter built on a model goes blind on exactly the days that matter — exams, events, rain.

### The real protection
ORBIT only sends an extra bus when a bus has **really left full** and people are **really still waiting**. Fake signals alone can't move a bus. That makes the integrity question much smaller than it was in the old design.

### Why not myUTM login

| | myUTM login | Anonymous, three layers |
|---|---|---|
| Spam prevention | Structural | Practical — and fake signals alone can't move a bus |
| Friction | A login step | None |
| Privacy | Tied to student records | No personal data |
| Deployment | Needs UTM IT | Self-contained |

myUTM integration stays as future work.

---

## Privacy

What is true, stated plainly (this corrects the earlier version, which wrongly said coordinates never leave the phone):

- No login, no name, no student ID.
- When a student signals, the phone's coordinates **are sent to the server** for one purpose: to check the student is at the stop. They are **discarded immediately** after that check — not stored, not logged. The same happens when the app checks that a student has reached a change point.
- What is kept from a signal: stop, route, destination, time, and the anonymous token.
- Raw signals, tokens included, are **deleted after 2 hours**.
- What is kept long-term: **anonymous totals** per stop, route and time slot (for example "KDOJ, Bus E, Monday 7:20–7:30: 31 waiting, 7 left behind"). No tokens, nothing personal. These feed the planning reports.
- A student is never tracked after signalling. The "did you get on?" prompt is triggered by the bus passing the stop, not by following the student.
- Drivers: taps and answers are used for running and planning the service, not for judging individual drivers.

---

## How students come to use it — LOCKED (Samy, 13 Nov 2026)

The app is voluntary and ORBIT doesn't depend on it. But the more students use it, the faster ORBIT reacts and the better the planning reports. So: how do students pick it up naturally, not because they are forced to?

**Posters alone don't do it.** They raise awareness; they don't create the habit. Uber and Grab both started rough, in one place, and grew by being useful to a small group first. Campus bus apps that students actually use have the same things in common.

### The seven key points

1. **Useful on its own, from day one.** The draw is "when is my bus, and will I fit" — not "help the fleet".
   - OneBusAway (Seattle): 92% of riders reported higher satisfaction; riders with real-time information waited almost two minutes less, and their sense of how long they waited matched the real wait. A New York study found a median 1.7% rise in weekday ridership on routes with real-time information.
   - LSU: its bus tracking app got a little over 5,000 hits at launch and more than 66,000 within three months (hits, not riders).
2. **No install, no login.** ORBIT is a link.
   - NUS: bus arrival works as a guest, without login.
   - UConn (2019): students liked the new tracking app but complained about the extra download — "I don't understand why they had to make a separate app"; "pretty inconvenient that you need to download a new app just to track the busses".
3. **Be at the point of need.** The QR code goes where a student is standing, wondering where the bus is.
   - Rutgers: QR codes at all campus bus stops, and notices inside the buses.
   - University of Minnesota (2012): new signs at every stop with a stop number and a QR code.
4. **Win one route first.** Bus E and the KDOJ / KLG / KDSE colleges, before the whole campus. One college where "everyone checks ORBIT" spreads by word of mouth better than a campus-wide launch nobody notices.
   - Grab (MyTeksi, Kuala Lumpur, 2012): demand on day one outran the drivers; the founders recruited the first 40 drivers face to face at coffee shops and petrol kiosks, and those drivers' phones pinging with jobs sold the next drivers.
   - Uber: one city, a small group of early adopters, free rides at local events, referral credit, word of mouth, then city by city.
5. **Catch each new intake.** First-years can't bring vehicles and have no bus habits yet. Orientation week is the cheapest moment to make ORBIT the default.
   - Rutgers introduces its bus app at new-student orientation.
6. **Make the benefit visible.** "Extra Bus E at KDOJ, 7:32" is the app visibly doing something for the people waiting. That gets talked about.
7. **Official backing helps.** A line on UTM's transport page or in the college group chats does more than a poster.
   - NUS links its bus apps from its own transport pages.

### What this means for the build
- Arrival time and "how full" come first and must be trustworthy. A wrong arrival time loses a student faster than no app at all (UConn's student paper ran a piece headed "Don't trust arrival times on TransLoc Rider").
- The app must work without location permission, as a plain timetable viewer.
- The QR link must open straight to that stop's page.
- "How full" is shown simply. Not every student cares (a UConn student: "I don't need to know how full the bus is") — so it supports the arrival time; it doesn't crowd it out.

### What ORBIT does not do
Force adoption, gamify with points, or require the app to board. **It is not guaranteed that students will adopt it — which is why the design never depends on it.** Low adoption is not a failure state: ORBIT works from driver taps and door counters, and the observation months measure the app share per stop instead of assuming one.

### Sources
Read as search results and article summaries on 12–13 Nov 2026. Re-open a link before citing it in the PSM2 report. Also listed in `06_RESEARCH_FINDINGS.md` Part 12.

- Grab — the first 40 drivers: https://www.grab.com/ph/blog/grab-40-drivers/
- Grab — founder interview: https://www.nbcnewyork.com/news/business/money-report/how-i-built-a-2-billion-a-year-super-app-called-grab-20-hour-work-days/5862663/
- Grab — The Sun: https://thesun.my/archive/grabcar-huge-success-southeast-asia-within-five-years-CTARCH455422
- Uber — growth study: https://growthhackers.com/growth-studies/uber
- Uber — growth lessons: https://www.freecodecamp.org/news/growth-hacking-lessons-from-the-big-guys-daebb2c791d2
- OneBusAway — TRB: https://onlinepubs.trb.org/onlinepubs/trnews/trnews303rpo.pdf
- Real-time information and ridership — National Academies: https://nap.nationalacademies.org/read/27883/chapter/10
- NUS — uNivUS app: https://about-univus.nus.edu.sg/univus-tips/
- NUS — campus mobility satisfaction: https://nus.edu.sg/inside-nus/stories/on-the-go--campus-wide-mobility-satisfaction-climbs-amid-industry-wide-challenges
- NUS — internal shuttle bus: https://uci.nus.edu.sg/campus-life/campus-services/transportation/internal-shuttle-bus
- Rutgers — bus tracking app rollout: https://dailytargum.com/article/2023/08/u-unveils-new-bus-tracking-app-for-campus-fleet
- University of Minnesota — real-time tracking, QR codes on stop signs: https://campustechnology.com/Articles/2012/09/05/U-Minnesota-Brings-Real-Time-Transportation-Tracking-to-the-Public.aspx
- UConn — students on the new tracking app: https://dailycampus.com/2019/03/15/2019-3-15-students-think-bus-tracking-has-improved-still-some-concerns/
- UConn — "Don't trust arrival times": https://dailycampus.com/2019/03/13/2019-3-13-dont-trust-arrival-times-on-transloc-rider/
- LSU — results from revamping campus transit: https://www.metro-magazine.com/news/lsu-sees-results-from-revamping-campus-transit

---

## Component structure (target)

```
src/
├── App.jsx
├── student/
│   ├── StopFinder.jsx           # location → stop; browse mode if refused
│   ├── DestinationPicker.jsx    # destination first
│   ├── TripPlan.jsx             # one bus, or two with the change point
│   ├── BusCard.jsx              # arrival time, how full, last seen, notices
│   ├── BoardedPrompt.jsx        # "Did you get on?"
│   └── CrowdTap.jsx             # rider "how full"
├── driver/
│   ├── DriverHome.jsx           # load taps, left behind, break
│   └── InstructionScreen.jsx    # big instruction, sound, OK / Can't
├── hooks/
│   ├── useGeolocation.js
│   ├── useWebSocket.js
│   └── useAnonymousToken.js
└── data/
    ├── stops.json
    └── routes.json
```

The existing prototype's components and locked UX decisions are listed in `10_PROTOTYPE_STATUS.md`. What carries over into the redesign is for Samy to decide when that stage starts.
