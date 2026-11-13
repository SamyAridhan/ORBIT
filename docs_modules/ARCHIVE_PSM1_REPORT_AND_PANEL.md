# ARCHIVE — PSM1 Report Conventions & Panel/Viva Q&A
> Replaces `04_REPORT_WRITING_GUIDE.md` and `QnA_SUPERVISOR.md`. Both are retired as active modules —
> PSM1 is submitted, so chapter-by-chapter drafting guidance and panel-prep framing are no longer live tasks.
> This file keeps only what's still useful going forward: citation/report conventions if PSM2 extends the
> same document, and Q&A logic that's reusable for the eventual PSM2 viva.
> Load this only if report writing or viva prep comes up — not for day-to-day build work.
> **Updated 13 Nov 2026:** the design was replaced on 11 Nov 2026. Answers below that described
> the old design (spam prevention, "on-time bus with high demand ahead") are rewritten; new
> answers are added for the questions the new design will draw. Report conventions are unchanged.

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

**"Why use agents instead of one program?"**
> Each stop and each bus owns its own state and rules, and a small Coordinator owns the one thing that has to be shared — the spare pool. A new bus is a new record, not new code. And if the Coordinator or the message broker goes down, every bus simply runs its timetable — the system degrades to today's service, not to nothing.

**"How does ORBIT relate to the PAJ project?"**
> The PAJ project delivers GPS tracking and ETA prediction — "where is the bus?". ORBIT adds the demand side — "where are the people, and what should Fleet do about it?". They're complementary: ORBIT takes bus position from PAJ's GPS where it exists, from the driver's device where it doesn't, and from the timetable as a last resort.

**"Why not LightGBM/XGBoost like the PAJ project?"**
> The PAJ project trains on months of real GPS operational data — that data exists because collecting it is in their scope. ORBIT is in the pre-data phase; training on simulated data would be circular. Adding up plain travel times is adequate for a fixed-route, low-traffic campus shuttle, and where PAJ's own ETA exists ORBIT uses it.

**"How do you prevent spam demand signals without login?"**
> Three layers: a server-side check that the phone is at the stop (coordinates are used for the check and discarded), one accepted signal per anonymous token per stop and route per 30 minutes, and a strange-count check that flags an implausible number on the dashboard without deleting it. But the real protection is the trigger: ORBIT only sends an extra bus when a bus has really left full and people are really still waiting — fake signals alone can't move a bus. myUTM login is future work.

**"Why not machine learning for the coordination logic itself?"**
> No training data exists — UTM hasn't published APC/boarding records, so any model would train on simulation, which is circular. The decisions are simple enough for rules: count a route against the seats on the coming bus; send a spare when a bus has really left people behind; hold a bus that has caught up with the one ahead (Daganzo & Pilachowski, 2011, show simple headway rules are enough for spacing). ML framing would also shift the project toward research-track evaluation (CGPA 3.30 requirement).

**"The thesis described Hold, Early Departure and arrival compression. Why is the system different now?"** *(Will come up in PSM2)*
> Two documented design corrections. First (July 2026): arrival compression was removed — cutting dwell time saves 5–15 seconds a stop, not minutes. Second (Nov 2026): a whole-system review against UTM's current timetable showed the rest of the timing design didn't fit reality. UTM now runs a bus every 10 minutes at peak, and buses return to the terminus only minutes before their next departure, so "the next bus leaves early" is rarely possible — and moving a departure risks stranding the students who planned for it. The redesign follows one principle: never take away a departure students are counting on; add capacity with a spare bus when a bus has really left people behind. Stating the change and its reasons plainly is stronger than defending a design that wouldn't work.

**"What happens when a bus is full and people are left behind?"**
> If a spare bus can get there before the next scheduled bus, it runs an extra trip — no other bus changes its time. If the spare is further away and the next bus is already at the terminus, the next bus leaves a few minutes early and the spare covers its original time. If neither is possible, ORBIT moves nothing: it alerts the fleet manager and logs the event, which becomes evidence for next semester's timetable.

**"Where do the spare buses come from? Isn't that just adding buses?"**
> No new buses. UTM already runs supplementary buses on fixed timetables (Bus E went from 2 to 6; two are KDOJ-only extras). The design re-designates buses like those as a shared pool. A shared pool covers more with fewer vehicles than a fixed extra per route, because demand moves around from day to day — and a spare only drives when it's needed. This is a stated deployment assumption; the simulator plays it.

**"What if students don't use the app?"**
> ORBIT still works. A full bus is reported by the door counter or the driver's tap, and when it is full the driver is asked one question — whether people had to be turned away. The app makes ORBIT faster and better informed — it adds who was left behind and where they want to go — but it is never required. The system measures the share of riders using the app at each stop during an observation period instead of assuming one.

**"Does the system act on its own?"**
> Only as far as the fleet manager lets it. One setting: ask me first, send automatically and tell me, or off. The driver can always answer "Can't". And before any of that, the system runs in observation mode — it logs what it would have done and is checked against what happened.

**"How do you know it works without real buses?"**
> Software-in-the-loop validation: every component is real; only the outside world (bus positions, crowds, door counts, driver taps) is simulated and fed through the same interfaces real sources would use. The physical parts ORBIT assumes — door counters, driver devices, GPS, the spare pool — are stated deployment assumptions.

---

## What's Been Intentionally Left Out of This Archive

The original `04_REPORT_WRITING_GUIDE.md` contained granular per-chapter drafting instructions (exact paragraph text for Chapter 1–5, figure/table numbering schemes, a "Must Include" checklist). That level of detail was needed while the report was being written; it isn't needed now that it's submitted. If PSM2 needs to extend specific chapters later, re-derive the conventions from the actual submitted PDF rather than from the old planning notes, since the PDF is now the ground truth and the planning notes may have drifted from what was actually written (as several corrections in this project's history already showed).

The original `QnA_SUPERVISOR.md` contained a full "Things NOT to Say" list and detailed scope-trap language tied to specific panel-round corrections. That's now covered by `05_GROUNDING_CHECKLIST.md`, which is the actively maintained scope-trap module.
