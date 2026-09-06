# Module 05 — Grounding Checklist & Scope Guard

> Load this whenever you feel uncertain about direction, or before any major implementation decision.
> This module exists to prevent scope creep, feature bloat, and getting lost.
> Original content below predates the "Trap" numbering convention used further down this file —
> it was never split into discrete numbered traps; it's organized as thematic sections instead.
> Traps 8–11 (added June–July 2026) are appended after the original content and use the numbered
> convention. Recovered and reassembled August 2026 after a prior reorganization pass accidentally
> left only an additions-only stub in the repo — see git history if the full story is ever needed.

---

## ⚠️ The System Development Track Trap (Read First)

This is the single most important risk to your project approval. Understand it clearly.

**The trap:** If you frame your project as "comparing the MAS algorithm against fixed-route routing to prove it performs better," the evaluation panel may classify your project as **Research-based**. The Research track requires CGPA 3.30 minimum and a completely different document structure.

**Why it happens:** Algorithmic comparison ("does A outperform B?") is a research question. System development is about building software that solves a problem and testing that it works correctly.

**The fix — always use this framing table:**

| ❌ Research framing (avoid) | ✓ System Development framing (use this) |
|---|---|
| "Evaluate MAS vs fixed-route performance" | "Validate system correctness under simulated demand" |
| "Prove MAS reduces wait time" | "Verify the system meets its functional acceptance criteria" |
| "Compare algorithmic efficiency" | "Test that the software behaves as specified" |
| "This algorithm is better because..." | "The system met / did not meet the following acceptance criteria..." |
| "Validate the MAS algorithm" | "Test the software system's functional requirements" |

**What actually changes:** Nothing in what you build. Only how you describe and frame it — in objectives, in Chapter 5, in the NABC benefit row, and in how you present results.

The MAS vs fixed-route comparison still exists — it becomes a **performance acceptance test**: one of many software test cases that checks whether the system meets its requirements under load. Not a research contribution.

---

## The Sanity Check (Run Before Every Work Session)

Answer these four questions before writing any code or report section:

**1. Which of the 6 objectives does this work serve?**
If you can't name one, stop and reconsider.

**2. Is this in scope?**
If it requires hardware, a mobile app, an LLM, or integration with UTM's IT systems → it's out of scope. Write it in "Future Work" instead.

**3. Is the deadline safe?**
Check today's date against the calendar. If you're behind, cut features before cutting sleep.

**4. Am I still on the System Development track?**
If what you're writing sounds like a research contribution or algorithm comparison, reframe it as software testing and functional validation before continuing.

---

## The 6 Objectives (Memorise These)

1. MAS with autonomous Stop and Bus Agents
2. Directed weighted campus graph + Dijkstra pathfinding
3. Time-aware demand simulation engine
4. MQTT inter-agent coordination with claim-lock protocol
5. Real-time web dashboard for fleet manager
6. **Validate system correctness and functional behaviour under simulated demand scenarios using black box test cases and defined software acceptance criteria**

> Objective 6 is deliberately framed around software validation, not algorithmic comparison. Do not reword it.

---

## Scope Creep Red Flags

If you or an AI assistant starts suggesting any of the following, **stop immediately**:

| Suggestion | Why It's Scope Creep |
|---|---|
| "Let's add a student-facing mobile app" | Out of scope. Dashboard is fleet-manager only. *(Note: superseded by later design — the student app became an official Layer 1 component. Kept here as a historical example of the reasoning pattern, not a currently-accurate scope boundary.)* |
| "We could use LangGraph for agent reasoning" | Agents are rule-based. LLMs add cost, complexity, non-determinism. |
| "Let's connect to UTM's real bus GPS feed" | Requires UTM IT cooperation, hardware access, not a student project deliverable. |
| "We should add real-time traffic data" | No traffic API budget, simulation is campus-only. |
| "Let's make the buses learn from experience (ML/RL)" | New research area, not the project scope. Future work only. |
| "We should add passenger booking/reservation" | Different system entirely. Not related to fleet optimisation. |
| "Let's deploy this on AWS/cloud" | Local deployment only. No cloud hosting budget or requirement. |
| "Add authentication and user accounts" | Unnecessary for a simulation demo. |
| "Integrate with UTM's timetable API" | Demand model uses hardcoded schedule patterns. No live API needed. |

---

## Feature Priority Stack

When time is tight, implement in this order and stop when the deadline is near:

### Must Have (Required for Pass)
- [ ] Campus directed graph with all named stops
- [ ] Stop Agent: queue classification + MQTT broadcast
- [ ] Bus Agent: state machine + Dijkstra evaluation + constraint checks
- [ ] MQTT claim-lock protocol (no double-response)
- [ ] Demand simulation engine (time-aware, 4 scenario presets)
- [ ] Text-based dashboard (bus table, stop table, decision log)
- [ ] Unit tests for all agent constraint logic
- [ ] Evaluation metrics computed and exported

### Should Have (Good Grade)
- [ ] Leaflet.js map with stop markers and bus position indicators
- [ ] Queue colour-coding (green/yellow/red) on map
- [ ] Simulation speed controls (1×, 5×, 10×)
- [ ] Admin manual override via dashboard

### Nice to Have (Only If Time Permits)
- [ ] Bus route lines drawn on map
- [ ] Scenario comparison: run multiple scenarios, compare all metrics in one view
- [ ] Export simulation log to CSV from dashboard

### Do Not Build
- LLM integration inside agent logic
- Real GPS or RFID hardware (until the PAJ project's feed is available to consume)

> **Note (August 2026):** "Do Not Build — Mobile app" and "Student-facing features" from the
> original version of this list are struck out here rather than silently removed, since they're
> now factually wrong — the student PWA is an official, built Layer 1 component (see
> `08_STUDENT_APP_DESIGN.md`, `10_PROTOTYPE_STATUS.md`). Kept visible so it's clear this file
> predates that design decision rather than contradicting it silently.

---

## Common Ways This Project Goes Wrong

**Getting obsessed with the dashboard before the agents work**
The dashboard is display only. It has zero value if the agents behind it aren't functioning correctly. Build agents → integration → dashboard. Never the reverse.

**Making the demand simulation too clever**
Your demand model does not need to be a research contribution. It needs to generate plausible queue numbers that create interesting agent decisions. Simple time-of-day spikes are enough.

**Spending too long on the campus graph**
The graph is a configuration file, not a research contribution. Define the stops, estimate the edges in minutes of travel, add it to graph.json, and move on. You can refine the weights later.

**Trying to prove your system works on real data**
You don't have real data. That's fine. Simulation-based validation is standard in systems research. State your assumptions clearly and your methodology is defensible.

**Report chapters written before the system works**
Chapter 4 (System Design) should be written during implementation, not before. Chapter 5 (Evaluation) cannot be written until the system runs. Don't write the cart before the horse.

---

## When to Ask for Help vs. Push Through

### Push Through Yourself
- Minor Python bugs and syntax errors
- Figuring out a specific NetworkX function
- Wiring up MQTT topics between two agents
- Deciding exact queue threshold numbers
- Writing prose for report chapters

### Ask Supervisor
- Scope decisions: "Is X in scope for PSM1?" / "for PSM2?"
- Stakeholder access: how to approach the transportation office / UTM Fleet
- Methodology justification: "Is simulation-based validation acceptable?"
- Evaluation design: "Are these metrics sufficient for the report?"

### Bring to New Chat Session (with context modules loaded)
- Architecture decisions
- Agent logic design questions
- Debugging complex agent interaction bugs
- Report structure and chapter content
- Evaluation methodology

---

## What a Successful Presentation Looks Like

You will have succeeded if you can:

1. Open the dashboard and run the simulation live
2. Show buses dynamically adjusting timing in response to queue spikes
3. Point to the decision log and explain *why* a specific bus held, departed early, or did neither (and why that's correct, not a gap)
4. Show the comparison table: MAS mode vs fixed-route baseline on the defined evaluation metrics
5. Explain one acknowledged limitation clearly (e.g., a COMMUTING on-schedule bus has no safe intervention available by design)

That is a complete, honest, defensible presentation. Nothing more is needed.

---

---

## RESOLVED — Trap 8: Sequence Diagram Coverage Misrepresentation

Confirmed correct in the finalized thesis: SD001 = UC2+UC5, SD002 = UC6+UC7+UC8. Every one of the 12 use cases has its own dedicated SRS sequence diagram (Figures 2.4.1b–2.4.12b); the SDD layers five additional composite/direct diagrams (SD001–SD005) on top for the most operationally significant flows. UC1/UC9/UC10/UC12 are not uncovered — they just don't have an SDD-level composite diagram. No further action needed; keep this framing if the SDD is revisited for PSM2.

---

## RESOLVED — Trap 9: PSM1/PSM2 Phase Confusion

**No longer active.** PSM1 is fully submitted. There is no more ambiguity to guard against — the project is now in the post-submission Buffer Sprint (sembreak), heading into the internship placement (Sept 2026–Feb 2027, weekends only), then PSM2 (March–July 2027). See `00_MASTER_CONTEXT.md`'s "Phase Status" section for the live, current framing. This trap entry is kept only as a historical note in case old chat context resurfaces the "is this PSM1 or PSM2" confusion.

---

## RESOLVED — Trap 10: "Five-Step" vs "Six-Step" Bus Agent Constraint Hierarchy

**Confirmed fixed in the finalized, submitted thesis PDF.** Direct check of the compiled document (July 2026) shows "six-step constraint hierarchy" used consistently throughout, including in the STD overview and the activity diagram description. The thesis's own AI-usage documentation appendix independently records this as an audited-and-corrected item ("Six-Step vs Five-Step Constraint Hierarchy Audit"). No outstanding "five-step" wording bug remains in the submitted document.

**Do not confuse this with Trap 11 below** — this trap was about miscounting the *number of top-level steps* in the hierarchy. Trap 11 is about *which interventions exist inside step 5*. They are unrelated corrections that happen to touch the same diagram.

---

## ACTIVE — Trap 11: Arrival Compression Is Not a Real Intervention (New, July 2026)

**Arrival compression has been removed from the Bus Agent's intervention set.** It was originally introduced by misreading source material as endorsing dwell-time reduction as a viable dispatch lever — it isn't. UTM buses run without scheduled holds, so the achievable dwell-time saving at an intermediate stop is on the order of 5–15 seconds, not enough to produce a meaningful ETA change. It's a real operational nuance to be aware of (dwell time does vary slightly), not a lever an agent should be modeled as choosing to pull.

The Bus Agent now selects between exactly **two** interventions: **Hold** (bus ahead of schedule) and **Early Departure** (bus idle at terminus, last resort). A COMMUTING bus that is on-time or behind schedule has **no safe intervention available** — this is logged honestly, not disguised.

| ❌ Wrong | ✅ Correct |
|---|---|
| "The Bus Agent tries arrival compression first, then hold, then early departure" | "The Bus Agent tries hold (if ahead of schedule) or early departure (if idle at terminus, last resort); otherwise no intervention is available" |
| "Compression reduced the ETA from 14 to 7 minutes" | This specific claim is physically unrealistic for a mechanism bounded to 5–15 seconds/stop and should not be reused anywhere — including in the student PWA / dashboard demo copy, where it currently exists |
| Any dashboard/decision-log text reading "ARRIVAL_COMPRESSION_ACCEPTED" | Should read `HOLD_ACCEPTED` or `EARLY_DEPARTURE_ACCEPTED` depending on the actual scenario chosen |
| Treating the PSM1 thesis's TC007_03 (arrival compression test case) as still valid going forward | It was valid for the PSM1 submission and is not being retroactively edited, but is superseded going forward by TC17 (`NO_INTERVENTION_AVAILABLE`) — see `01_AGENT_DESIGN.md` |

**Known unresolved consequence, as of this session:** the built student PWA and dashboard prototypes (GitHub repo `SamyAridhan/ORBIT`) have their core demo scenario built entirely around arrival compression, per `AGENTS_DASHBOARD.md`: *"The intervention is arrival compression, not an early departure by an empty terminus bus."* This must be redesigned around Hold or Early Departure before either prototype is considered finalized. See `10_PROTOTYPE_STATUS.md` for the open decision.

**Before finalising any document, diagram, or piece of UI copy, search it for "compression" and resolve any remaining instances against this trap.**
