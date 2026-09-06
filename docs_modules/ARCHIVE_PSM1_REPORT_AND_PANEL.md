# ARCHIVE — PSM1 Report Conventions & Panel/Viva Q&A
> Replaces `04_REPORT_WRITING_GUIDE.md` and `QnA_SUPERVISOR.md`. Both are retired as active modules —
> PSM1 is submitted, so chapter-by-chapter drafting guidance and panel-prep framing are no longer live tasks.
> This file keeps only what's still useful going forward: citation/report conventions if PSM2 extends the
> same document, and Q&A logic that's reusable for the eventual PSM2 viva.
> Load this only if report writing or viva prep comes up — not for day-to-day build work.

---

## Report Conventions Worth Keeping for PSM2

- **Report structure:** 5 chapters (Intro, Lit Review, Methodology, Design, Conclusion) + SRS/SDD/STD as appendices. PSM1 used this structure; PSM2 will extend rather than restructure it — confirm with Dr Sim before assuming, but there's no indication a chapter format change is expected.
- **Tense convention:** PSM1 chapters were written in future/planning tense as a proposal. PSM2 chapters describing completed implementation work should shift to past/present tense ("the system implements...", "test results show..."), since by PSM2 those things will genuinely have happened. Chapter 5's conclusion is the exception in both phases — always present-achievement + future-plan.
- **Citation set:** the full literature review citation list (Wooldridge & Jennings 1995, Noor et al. 2021, Meignan et al. 2007, Jäger et al. 2018, Daganzo & Pilachowski 2011, Liu et al. 2008, Al-Turjman et al. 2019, the PAJ project itself) lives in `06_RESEARCH_FINDINGS.md`, which remains an active module — not archived.
- **PAJ framing:** ORBIT is complementary to, never competing with, Dr Sim's PAJ-funded GPS project. This framing is locked and used throughout the submitted thesis — keep it identical in any PSM2 writing. Full detail in `09_SUPERVISOR_PROJECT_REFERENCE.md`.
- **Track language:** System Development track, never research-track language ("prove", "hypothesis", "statistical significance"). This still applies to all PSM2 writing.
- **AI-usage documentation:** the submitted thesis includes a reflective appendix documenting AI tool usage in report preparation (the "Prompt X.X" style audit entries, e.g. the six-step/five-step hierarchy audit). If PSM2 has a similar requirement, follow the same format — it's already proven to satisfy the university's expectations once.

---

## Durable Viva/Panel Q&A Logic

These are reusable answers — the underlying reasoning holds regardless of which panel or viva they're used in. Update numbers/dates if asked again in PSM2, but the logic doesn't change.

**"Why use agents instead of a simple scheduler?"**
> A centralised scheduler needs complete real-time knowledge of the whole network to decide anything; any communication failure takes down the whole system. With agents, each bus and stop has local knowledge and local decision-making, and coordination emerges from message passing. It's also more extensible — a new corridor means two new agents, not a redesign of central logic.

**"How does ORBIT relate to the PAJ project?"**
> The PAJ project delivers GPS tracking and ETA prediction — it solves bus visibility. ORBIT is the coordination intelligence layer above that — it solves bus intelligence. They're complementary: ORBIT is designed to consume the PAJ project's GPS feed directly through a pluggable ETA calculator, no architectural changes required when that feed goes live.

**"Why not LightGBM/XGBoost like the PAJ project?"**
> The PAJ project trains on months of real GPS operational data — that data exists because collecting it is in their scope. ORBIT is in the pre-data phase; training on simulated data would be circular. Graph-based ETA is adequate for a fixed-route, low-traffic-variance campus shuttle. The pluggable `ETACalculator` interface supports an ML swap-in once real data accumulates.

**"How do you prevent spam demand signals without login?"**
> Three layered controls: geofence validation (GPS must be within 80m of the declared stop), session token rate limiting (one accepted signal per stop/corridor per 30 min, same pattern as CMU's Tiramisu), and an Isolation Forest plausibility filter in the Stop Agent. myUTM login integration is documented as future work.

**"Why not machine learning for the coordination logic itself?"**
> No training data exists — UTM hasn't published APC/boarding records, so any model would train on simulation, which is circular. Rule-based coordination is sufficient per Daganzo & Pilachowski (2011), who showed cooperative headway control rules achieve 53–78% variance reduction. ML framing would also shift the project toward research-track evaluation (CGPA 3.30 requirement), which this project isn't positioned for.

**"What happens if a bus is on-time, on-schedule, and demand is high ahead of it — what does the system do?"** *(New answer, post-compression-removal — will likely come up in PSM2)*
> Honestly, nothing timing-wise — and that's by design, not a gap. A moving, on-schedule bus has no safe way to speed up without altering the fixed route or cutting boarding time below what passengers need. The system logs `NO_INTERVENTION_AVAILABLE` and, if the demand stays CRITICAL for several consecutive broadcasts, flags it to the fleet manager as a signal that an extra trip may be warranted. An earlier design used "arrival compression" (reduced dwell time) to claim an intervention existed here, but that mechanism can only realistically save 5–15 seconds per stop — not enough to matter — so it was removed. Stating this limitation plainly is stronger than claiming a fix that doesn't actually work.

---

## What's Been Intentionally Left Out of This Archive

The original `04_REPORT_WRITING_GUIDE.md` contained granular per-chapter drafting instructions (exact paragraph text for Chapter 1–5, figure/table numbering schemes, a "Must Include" checklist). That level of detail was needed while the report was being written; it isn't needed now that it's submitted. If PSM2 needs to extend specific chapters later, re-derive the conventions from the actual submitted PDF rather than from the old planning notes, since the PDF is now the ground truth and the planning notes may have drifted from what was actually written (as several corrections in this project's history already showed).

The original `QnA_SUPERVISOR.md` contained a full "Things NOT to Say" list and detailed scope-trap language tied to specific panel-round corrections. That's now covered by `05_GROUNDING_CHECKLIST.md`, which is the actively maintained scope-trap module.
