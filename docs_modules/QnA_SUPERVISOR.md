# QnA — ORBIT Supervisor & Panel Preparation
> Updated May 2026: PSM1 complete. PSM2 active. Scope traps table removed — see 05_GROUNDING_CHECKLIST.md.
> Dr. Sim is a named researcher on the PAJ-funded UTM Smart Bus IoT-GPS project.
> Use this before Dr Sim meetings and before any panel presentation.

---

## One-Paragraph Elevator Pitch (Memorise This)

> "I'm proposing ORBIT — an On-Demand, Route-Based Intelligent Transit system for UTM. The first layer is a student app — a simple web app students open on their phone at a bus stop, tap their destination, and submit. That gives the system real demand data. The second layer is a multi-agent backend where each bus and each stop is an autonomous agent. They communicate through MQTT — when a stop agent detects a high queue, the relevant bus agent evaluates whether it should adjust its departure timing. The third layer is a fleet manager dashboard that shows all of this live with a full decision log. The goal is shorter student wait times and better fleet utilisation without changing any routes or requiring new hardware."

---

## Understanding Your Position with Dr. Sim

Dr. Sim is not just your supervisor. He is a named researcher on the PAJ-funded *Sistem Pengangkutan Bas Pintar Berasaskan IoT dan GPS di Kampus UTM* — a real, two-year, RM188,127 project that will deploy GPS tracking across all 8 UTM corridors. He knows exactly what that project delivers (bus visibility) and what it doesn't (demand-responsive coordination). He put you in this space deliberately.

**What this means practically:**
- Your FYP exists within his research ecosystem — you are not inventing a problem, you are extending a real programme
- The GPS feed his project will deliver is the exact feed ORBIT's architecture is designed to consume
- When he says "use this as proof of stakeholder" — he means the problem is institutionally real, not manufactured
- He will likely already know the gap you are filling. Don't explain the gap to him as if he can't see it. Acknowledge you understand the relationship.

**Opening framing for your next meeting:**
> "I've read through the PAJ project proposal and I understand that ORBIT is designed to be the coordination intelligence layer above the GPS tracking infrastructure your project will deploy. The `GPSBasedETA` module I've designed can directly consume your project's GPS feed with no architectural changes."

---

## Questions Dr Sim Will Likely Ask

### "Why use agents? Why not just a simple scheduler?"

> "A centralised scheduler requires complete real-time knowledge of the whole network to make decisions. With 19 bus services and 30+ stops, any communication failure would take down the whole system. With agents, each bus and stop has local knowledge and local decision-making. The coordination emerges from message passing. It's also more extensible — adding a new corridor means deploying two new agents, not redesigning the central logic. The decentralised architecture is the academic contribution; a scheduler would just be a timetable optimiser."

### "How does ORBIT relate to our PAJ project?"

This question is likely. Answer it clearly and confidently:

> "The PAJ project delivers GPS tracking infrastructure and ETA prediction — it solves the bus visibility problem. ORBIT is the coordination intelligence layer above that infrastructure. GPS makes buses visible; ORBIT makes them demand-responsive. The two are complementary — ORBIT is designed to consume your project's GPS feed directly through a pluggable ETA calculator module. No architectural changes are required when the GPS feed goes live. In PSM2, I use simulated GPS as the data source; the system treats it identically to a real feed."

### "Why not use LightGBM or XGBoost for ETA like our project does?"

> "The PAJ project trains ML models on months of real GPS operational data from actual bus runs — that data exists because collecting it is part of the project scope. ORBIT is designed for the pre-data phase. Training on simulation data would be circular — the model learns the simulator, not reality. Graph-based ETA from the campus road network is adequate for a fixed-route campus shuttle with low traffic variance. Once the PAJ project's GPS feed is live and operational data accumulates, ML-based ETA becomes a natural enhancement — the pluggable calculator interface supports this without any architectural changes."

### "How will you get students to use the app?"

> "The system is designed to work at any adoption level. At zero adoption, Stop Agents fall back to class schedule-based demand estimation. At 30% adoption, the system scales up the count to estimate total queue. As adoption grows, accuracy improves. For PSM2, we don't need 100% adoption to demonstrate the system works — we just need enough simulated signals to show the agents responding correctly. A QR code at bus stops and a mention in orientation would be the real-world launch approach, which I'm documenting as future work."

### "What happens if the app goes down or students don't use it?"

> "The system degrades gracefully. Each Bus Agent has a 10-second MQTT timeout — if the broker is unreachable, it reverts to fixed-schedule operation. If app adoption at a stop is below 30%, the Stop Agent uses the simulation-based demand model. The buses always run their corridor on schedule as the baseline. The agents only intervene when conditions justify it."

### "Isn't this just a regular bus tracking app?"

> "The student app is the input and output layer — it's how students interact with the system and how demand data enters. But the core academic contribution is the MAS coordination layer. The buses are agents that make autonomous timing decisions based on demand signals from stop agents. The fleet dashboard shows every decision with the constraints that were checked. That's the novelty — not the app itself, but what the app enables the agents to do. Your PAJ project provides bus visibility. ORBIT provides bus intelligence."

### "How do you prevent students from spamming fake demand signals without a login?"

> "Three layered controls. First, geofence validation: the backend rejects any signal where the student's GPS isn't within 80 metres of the declared stop — submitting from a dorm room is blocked regardless. Second, session token rate limiting: each browser session gets an anonymous token, enforcing one accepted signal per stop per corridor per 30 minutes — same approach used by Carnegie Mellon's Tiramisu transit crowdsourcing system. Third, the Stop Agent runs a plausibility filter using a learned anomaly detector — if the signal count deviates implausibly from the expected demand pattern for that stop, time, and day, it flags and doesn't act. Together these make abuse practically impossible in a campus context. myUTM login integration is documented as Future Work."

### "Why not machine learning?"

> "Three reasons. First, there's no training data — UTM hasn't published APC or boarding records, so any ML model would train on simulation, which is circular. Second, rule-based coordination is sufficient — Daganzo and Pilachowski showed in 2011 that cooperative headway control rules achieve 53–78% variance reduction. Third, ML framing shifts the project toward research track evaluation, which requires CGPA 3.30. The PAJ project uses ML for ETA prediction precisely because they will have real GPS data to train on — a different context. I've documented ML as future work for when real data from the GPS infrastructure accumulates."

---

## Questions to Ask Dr Sim

### Essential — Need Answers Before Finalising Design

**1. GPS feed from PAJ project:**
> "I've designed a pluggable ETACalculator interface specifically so ORBIT can consume your project's GPS feed when it goes live. Phase 1 is the KP–CP corridor — is there a planned API format for the GPS position data? Even knowing whether it'll be REST or MQTT would help me make sure the interface aligns."

**2. Route A, B, C renewal:**
> "I've confirmed routes D, E, F, G, H are on the schedule valid to January 2026. For routes A, B, and C — their validity was listed as ending December 2023. Are these still running?"

**3. Biggest pain point — which corridor first:**
> "From what you know about the UTM Fleet operation, which corridor causes the most complaints? I'm planning to model Bus E (KDOJ to Faculty Cluster) as my primary simulation corridor because of the long headways and pre-lecture peak. Does that match what Fleet sees on the ground?"

**4. Fleet manager access for demo:**
> "For PSM2 demo, it would strengthen the evaluation significantly if a UTM Fleet staff member could view the dashboard during the demo. Is that something you could help facilitate through your Fleet connection?"

### Good to Know

**5. Traccar platform compatibility:**
> "The PAJ project uses Traccar as the GPS tracking platform. Does Traccar expose a real-time position API or MQTT feed? I want to make sure my GPSBasedETA module would be compatible with the output format."

**6. PIDS screen plans:**
> "The PAJ proposal mentions PIDS display screens at bus stops. Is the KP–CP corridor being prioritised for Phase 1 because it already has or is getting infrastructure? I want to understand which stops will have the most reliable data first."

**7. Typical bus capacity:**
> "I'm using 28 seats as max capacity. Is this accurate for UTM's fleet?"

---

## Panel Questions to Prepare For

### "What is the scope of your PSM2 demo?"

> "PSM2 will demonstrate the full three-layer system: the student app running on a real phone, the MAS backend coordinating Bus B, E, and F corridors in simulation, and the fleet dashboard showing live agent decisions. The demo scenario will be a simulated peak period — 15 minutes before 8am — where KDOJ shows a CRITICAL queue and Bus E2 is idle at terminus with a 22-minute headway gap. The system should issue an early departure, the dashboard should log the constraints checked, and the student app should show the updated ETA."

### "How does this relate to the GPS tracking project already underway at UTM?"

> "That project and ORBIT are complementary layers. The PAJ project solves bus visibility — students can see where buses are and get ETA predictions. ORBIT solves bus intelligence — buses can detect where students are and adjust dispatch timing. The GPS feed the PAJ project produces is the exact input ORBIT's architecture is designed to consume. In PSM2 I use simulated GPS; the swap-in to real GPS requires no architectural changes."

### "How will you evaluate if it works?"

> "Through 16 defined black box test cases covering: capacity lock, protected time zones, headway gap checks for early departure, stranded passenger prevention, claim lock, MQTT failure graceful degradation, cross-corridor isolation, app adoption fallback, and normal service continuity. This is software validation — verifying the system behaves correctly against its specifications."

### "What are the limitations?"

> "Three main ones. First, app participation is voluntary — the system degrades gracefully to schedule-based estimation at low adoption, but demand accuracy scales with adoption. Second, early departure carries stranded passenger risk for non-app users, mitigated by terminus-only rule and 15-minute headway gap threshold. Third, bus position in PSM2 is simulated — real GPS integration is the immediate post-PSM2 step, enabled by the PAJ project's infrastructure. Stating these limitations honestly is stronger than pretending they don't exist."

### "Why only 3 corridors in simulation?"

> "Modelling 19 services in PSM2 would consume most of the development time. I've selected corridors B, E, and F because they represent different patterns: Bus E has the highest demand pressure and most critical pre-lecture timing problem, Bus B has complementary demand with a larger fleet for comparison, Bus F represents the west college pattern. Three corridors is enough to demonstrate that the agent architecture generalises."

---

## Things NOT to Say

> For the full list of forbidden phrases and correct replacements (scope traps, track language, PAJ framing mistakes) → **05_GROUNDING_CHECKLIST.md**

Key rule: Never say "the system proves...", "I'm doing machine learning", or "I'll reroute buses". Never describe ORBIT as similar to or competing with the PAJ project — they are complementary layers.
