# 04 — Demo Sequence and Presentation Script

## The 10-step sequence

Each → press advances one step. Each ← press goes back one step. State is always recomputed from scratch.

| Step | Demo control label | What updates |
|---|---|---|
| 0 | "Initial state — system running" | Nothing. Baseline. |
| 1 | "KDOJ demand rising — HIGH threshold crossed" | KDOJ stop: queue 8→18, level MEDIUM→HIGH |
| 2 | "KDOJ demand — CRITICAL (34 students)" | KDOJ stop: queue 18→34, level HIGH→CRITICAL. Card border turns red. |
| 3 | "Stop Agent broadcasts CRITICAL signal" | Log entry appears: STOP_KDOJ_E CRITICAL_BROADCAST |
| 4 | "Bus E2 receives signal — evaluating" | Bus E2 status → RECALCULATING (card border turns amber). Log: BUS_E2 EVALUATING |
| 5 | "All 6 constraints pass — decision made" | Log: BUS_E2 CONSTRAINTS_CHECKED with 6 green constraint chips |
| 6 | "Early departure accepted — Bus E2 departs" | Bus E2: IDLE→COMMUTING, delta→-7 (green badge appears). Log: EARLY_DEPARTURE_ACCEPTED |
| 7 | "Claim published — KDOJ locked to Bus E2" | KDOJ stop: claimed→true (padlock appears). Log: CLAIM_PUBLISHED |
| 8 | "Bus E1 suppressed by claim lock" | Log: BUS_E1 CLAIM_CHECK_FAIL (grey/muted entry) |
| 9 | "Bus E2 boarding at KDOJ — queue resolved" | Bus E2: COMMUTING→BOARDING. KDOJ: queue 34→4, CRITICAL→LOW, claimed→false. Log: BOARDING_AT_KDOJ |

## What the presenter says at each step (narration guide)

This is reference for the presenter, not code to implement.

**Step 0:** "This is the fleet dashboard. Left panel — all six buses, grouped by corridor. Center — stop status, live demand levels. Right — the decision log. Everything the agents do is recorded here."

**Step 1 → 2:** Press → twice without much narration, just let the KDOJ stop card visually escalate — LOW → MEDIUM → CRITICAL. Then: "KDOJ is reaching a critical threshold. 34 students waiting."

**Step 3:** "The Stop Agent broadcasts a CRITICAL signal to all Bus E agents on this corridor." Point to log entry.

**Step 4:** "Bus E2 — currently idle at the terminus — receives it and starts evaluating." Point to Bus E2 card changing to EVALUATING state.

**Step 5:** "Six constraints, checked in order." Point to the constraint chips in the log entry. Read them: "Corridor filter, capacity check, protected time, claim check, headway gap, utility score. All pass."

**Step 6:** "Decision made — Bus E2 departs 7 minutes early." Point to the departure delta badge appearing on Bus E2 card, and the log entry. "This is the autonomous coordination working."

**Step 7:** "The bus publishes a claim to lock KDOJ — so no other bus wastes a response." Point to the padlock appearing on the KDOJ stop card.

**Step 8:** "Bus E1 sees the claim, suppresses its own response. Two buses, one coordinated action. No duplication." Point to the grey CLAIM_CHECK_FAIL entry.

**Step 9:** "Bus E2 arrives at KDOJ. 30 students board. Queue drops from 34 to 4. Stop agent resets. The claim releases." Point to KDOJ stop card reverting to LOW, padlock disappearing.

**After step 9 — Manual Override demo:**
"Throughout all of this, the fleet manager has the option to override any decision." Hover over the Override button on Bus E2. "This publishes directly to the MQTT broker's admin/override topic. The bus agent updates its route vector immediately." Click Override, show the modal, then cancel — do not confirm unless the examiner asks you to.

## Total presentation time
Step-through narration: approximately 90 seconds.
Override demo: 20 seconds.
Total dashboard segment: ~2 minutes.

## How to transition from student app to dashboard

After the student app boarding prompt fires:
> "That was the student experience — from demand signal to boarding prompt. Let me show you what the agents were doing during that same 25 seconds."

Switch to the dashboard browser tab. Reset to step 0 (press ← until step 0, or have the tab already at step 0). Begin the step-through.
