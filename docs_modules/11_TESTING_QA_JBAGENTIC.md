# Module 11 — ORBIT Testing & QA Automation (JB Agentic Collaboration)
> New module, August 2026. Captures the outcome of the 26 Aug call with Huiming (JB Agentic) and defines
> ORBIT's role as a testbed for an AI-assisted testing/QA automation pipeline (the "software factory,"
> downstream-gate-first approach). Supersedes the pre-meeting prep deck (`orbit_jbagentic_deck.html`) as
> the source of truth for what was actually discussed and agreed — the deck's questions were largely
> answered in this call; see inline notes below for what carried forward unresolved.
> Load this when working on test infrastructure, coverage/mutation/property-based testing setup, or
> anything involving the JB Agentic collaboration.

---

## Where This Fits

Two threads converge here:
1. **ORBIT's own build** — the MAS backend needs real tests regardless of any collaboration.
2. **JB Agentic's "software factory" research** — Huiming's broader AI-assisted SDLC automation project. ORBIT is one of (likely several — Huiming runs a parallel experiment on her own repo, "fizzy") initial testbeds.

This module governs the testing/QA/JB-Agentic side only. It does not change ORBIT's product design (see `01`/`02`/`03`/`08`/`09`) or PSM scope (`00`). This work sits in the same Buffer-Sprint/internship-weekends window as the MAS backend build — it is not FYP-panel-facing content unless deliberately folded into PSM2 later.

---

## Samy's New Role — Context for the Testing Work Ahead

- Joined **Keysight** on a software QA / internship track — the team builds software that interfaces with hardware test controllers, for customers including Samsung and Intel.
- Immediate responsibility includes writing automated tests.
- Background in Java/JavaScript; will be writing **Python** for upcoming tasks — directly transferable to ORBIT's Python MAS backend.
- Company provides Copilot-style AI tooling to full-time devs; not yet available to Samy as an intern.
- Enterprise AI governance (company accounts, regional data residency) came up as the mechanism that makes AI tooling viable at a company handling proprietary/customer data — worth remembering if the JB Agentic tooling ever needs an "enterprise-safe" framing later, not actionable now.
- This is real-world QA context running in parallel with ORBIT, not something this module tracks in detail — noted here only because it's directly relevant to why Samy is well-placed for this collaboration.

---

## The Joint Vision — "Software Factory" (Huiming's Framing)

Huiming's broader thesis: automate the full SDLC — requirements → design → build → test → deploy — with AI progressively taking on each stage.

**Key hypothesis, and why testing comes first:** upstream automation (coding/design) is fundamentally limited by the lack of robust downstream gates. Fast code generation isn't safely releasable without high-confidence tests. So: build test/validation automation and confidence *first* — that's what unlocks safely automating the earlier stages later.

This is why the collaboration is scoped to testing/QA specifically, not "help build ORBIT's features." The JB Agentic angle is about proving out the test-automation layer, using ORBIT as one real testbed among others.

**Proposed agent lifecycle (PR-based workflow):**
```
Agent creates branch
  → implements change (or generates tests)
    → runs local CI checks (coverage, mutation, flakiness, style/lint)
      → receives measurable, structured feedback
        → iterates until metrics clear defined thresholds
          → push / merge
```
This requires CI-visible, enforceable numeric thresholds (coverage %, mutation kill rate, flaky-test rate) — not review-by-vibes.

---

## Testing Techniques Confirmed In Scope

| Technique | What it checks | Tooling named by Huiming | Status for ORBIT |
|---|---|---|---|
| Line/branch coverage | Are new/changed lines exercised by a test | Standard, language-agnostic | Baseline — easy to hit, necessary but not sufficient on its own |
| Mutation testing | Do tests actually fail when code is subtly broken (mutants) | JS/C#/Scala: **Striker** *(see note below)*; Python: **MutPy, cosmic-ray** | Confirmed as the core quality metric — expensive but "more viable with automation/parallelization" |
| Flaky-test detection | Tests that pass/fail non-deterministically with no code change | Randomized test order, repeated runs (general technique) | Confirmed important — flaky tests specifically undermine trust in *agent-driven* PR pipelines |
| Property-based testing | Invariants checked against many generated inputs, not hand-picked examples | Python: **Hypothesis** | Confirmed as the approachable entry point — LLMs can help generate the invariant list from requirements/rules |
| Code style / linting | Maintainability, actionable warnings an agent can act on | Static analysis / lint tools generally | Confirmed as part of the pipeline, lower priority than the above |

> ⚠️ **Tooling name note:** "Striker" is very likely **StrykerJS / Stryker.NET / stryker4s** (the real project name) — kept as spoken in the auto-transcribed notes rather than silently corrected. Verify exact package names before actually wiring anything up.

**Not discussed live in this call, but still relevant** (from the three reports reviewed just before this meeting): assertion-density linting, second-agent/LLM-as-judge review, differential testing, metamorphic testing, fault injection, test-smell detection. These remain a useful superset — see the reconciliation section below.

---

## ORBIT's Role as a Testbed — Confirmed, Concrete

Agreed reasons ORBIT (specifically the Python MAS backend, once it exists) is a good testbed:

- **Deterministic, branch-heavy rule logic** — capacity thresholds, scheduling constraints. This is the Bus Agent constraint hierarchy (`01_AGENT_DESIGN.md`).
- **Priority/resource contention among agents** — named explicitly in the call: *"resource claim conflicts where multiple agents try to claim the same bus stop."* This is the Stop Agent claim-lock / Bus Agent race condition already documented in `01_AGENT_DESIGN.md`.

**Confirmed ORBIT-testbed use cases:**
1. Branch/line coverage improvements
2. Property-based tests expressing invariants — capacity constraints, and **no double-claim of the same resource** (new, concrete — see below)
3. Mutation testing to validate whether generated tests catch injected faults
4. **Agent-to-agent coordination tests** — concurrency / ordering / flakiness, specifically on the Bus Agent claim-lock race

**Scope clarification confirmed by this call:** "agent-to-agent coordination tests" here means **ORBIT's own Stop Agent / Bus Agent MQTT coordination**, tested with concurrency-focused techniques (flaky-test detection, ordering randomization). This is a different concern from "managing tasks across multiple coding agents" (Claude → Codex handoffs), which is about how JB Agentic's *skills themselves* get built and chained, not about ORBIT's runtime code. Both are real and both matter — this call's substance was about the first one. The second remains open, unresolved by this session (see the pre-meeting deck for that context).

---

## New Concrete Test Target: No-Double-Claim Invariant

Worth stating formally since it's new and specific — a property-based / concurrency test target for the Stop Agent claim-lock, once that code exists:

> **Invariant:** for any given stop+corridor broadcast, at most one Bus Agent may hold the claim at any time. If two Bus Agents attempt to claim concurrently, exactly one succeeds and the other observes the claim already held — never both, never neither.

Candidate approach: Hypothesis stateful/model-based testing (`RuleBasedStateMachine`), or a dedicated concurrency test once the MQTT claim-lock mechanism (`01_AGENT_DESIGN.md`) is implemented. Add to the eventual test plan for that module.

---

## Reconciliation With the Pre-Meeting Reports

Before this call, three reports were reviewed: coverage as a necessary-but-weak floor, mutation testing as the strongest single signal, and eight complementary guardrail techniques (property-based, metamorphic, assertion-density, test-smell, differential, fault injection, second-agent review, flakiness).

**Confirmed to match the reports:**
- Coverage = necessary floor, not a target — matches the coverage report exactly.
- Mutation testing = the core quality signal — matches the mutation report exactly.
- Flakiness detection flagged as important specifically because it undermines agent-driven pipelines — matches the complementary-techniques report's "must-have before mutation testing" framing.
- Hypothesis named specifically for Python property-based testing — matches the complementary-techniques report's tool table exactly.

**What this call added beyond the reports:**
- A concrete PR-based agent lifecycle with enforced CI thresholds — the reports covered *techniques*; this call covered the *workflow* those techniques sit inside.
- The claim-lock race condition named as a specific, real ORBIT test target — the reports were generic; this ties directly to ORBIT's actual architecture.
- The "software factory" / downstream-gate-first framing as the *strategic reason* testing comes first — not covered in the reports.
- A productization angle (open-source tooling now, consulting/training later as the monetization path) — business context, not technical, but useful to know why Huiming is investing time here.

**What the reports covered that this call didn't reach:** second-agent/LLM-as-judge review, differential testing, metamorphic testing, test-smell detection, assertion-density linting specifically. Not off the table — just not this session's focus.

---

## Decisions & Next Steps

**Samy:**
- Continue building the MAS backend with testability as an explicit design concern for the rule-heavy logic.
- Experiment with Hypothesis (property-based) and a Python mutation-testing tool (MutPy or cosmic-ray) on ORBIT once there's real code to test against.
- Weekend-paced, part-time — consistent with the existing internship constraint (`00_MASTER_CONTEXT.md`).
- Share progress with Huiming informally; no fixed cadence.

**Huiming:**
- Running a parallel experiment on her own repo ("fizzy") — a separate JB Agentic testbed, not part of ORBIT.
- Building the initial pipeline: coverage → branch coverage → flaky detection → mutation testing → LLM-assisted remediation.
- Will share research notes, tools, and reference links as they develop.

**Joint:**
- ORBIT confirmed as a live testbed for: coverage, the mutation feedback loop, flaky detection, property-based testing, and agent-coordination (claim-lock) testing.
- Reconvene ad-hoc — no fixed schedule.
- If early results are promising: incremental open-source release of discrete skills/plugins (e.g., "a plugin that sets up coverage + mutation checks and agent scaffolding").

---

## Open Questions — Carried Forward, Unresolved

Surfaced in the call but not answered. Worth keeping visible for the next conversation with Huiming rather than something to resolve solo:

- What exact CI thresholds (coverage %, mutation kill rate, allowed flaky-test rate) should gate an agent PR merge?
- How should tests tie back to requirements/specs, so an agent can check a test actually verifies a functional requirement — not just that it passes? (Spec-driven testing.)
- What CI strategy keeps mutation testing practical at PR-level for ORBIT specifically (targeted/diff mutation, sampling, parallelization)?
- How much of this can be automated across different repo layouts/languages vs. needing repo-specific setup? (ORBIT spans Python + JS — a live test of exactly this question.)
- Is there value in an LLM *executing* tests directly rather than generating test code — practical/measurable enough for production use?

---

## Reference Links

- Excalidraw diagram (Huiming, shared in this call): https://excalidraw.com/#json=SFjVytcm2B6EwbmHQ9Lbx,NsTc_cdN1YWjuvs5jjq89Q
- "Factory AI" — referenced as an existing "software factory" / early coding-agent-with-monitoring concept (name only, not independently verified).
- Stripe "Minion" — referenced as a production example of agent-assisted development (name only, not independently verified).

---

## What This Module Does NOT Cover

- ORBIT's product design, scope, or PSM framing — see `00`/`01`/`02`/`03`/`08`/`09`.
- The Codex-as-subagent (`codex-plugin-cc`) workflow — a separate, earlier thread (see the prep deck, `orbit_jbagentic_deck.html`), still valid but not re-covered in this call.
- Keysight's internal codebase or work — out of scope entirely, mentioned only as context for Samy's growing Python/QA fluency.
