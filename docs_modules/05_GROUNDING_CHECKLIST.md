# ADDITIONS TO 05_GROUNDING_CHECKLIST.md
> Updated June 2026. Trap 8 below has been corrected — the previous version of this entry was checked against the actual SRS and SDD and found to be wrong. Two new traps added (Trap 9, Trap 10) based on errors actually caught this session.
> All other existing content in this file (Traps 1–7, the pre-SDD/STD checklist, the table numbering guard, the Chapter 3 scope guard) remains valid and unchanged.

---

## CORRECTED: Trap 8 — Sequence Diagram Coverage Misrepresentation

> **This entry replaces the previous version of Trap 8, which was wrong.** The previous version claimed SD001 covers UC1+UC2+UC5 and SD002 covers UC6+UC7+UC8+UC9+UC12, with UC10 having no sequence diagram at all. This was checked directly against the actual SRS and SDD documents and does not match either of them. The SDD's own Appendix A traceability matrix and its §5.8 descriptive headings both independently confirm: SD001 = UC2+UC5 only, SD002 = UC6+UC7+UC8 only. The previous version of this entry appears to have been an aspirational correction that was never actually applied to the SDD draft.

The real structure has two tiers, and conflating them is the actual trap to avoid:

- **The SRS gives every one of the 12 use cases its own dedicated sequence diagram** — Figures 2.4.1b through 2.4.12b, one per user story, with a clean 1:1 UC correspondence (since each user story maps to exactly one use case).
- **The SDD then layers five additional composite/direct sequence diagrams on top of this** for the most operationally significant flows: SD001 (UC2+UC5, composite), SD002 (UC6+UC7+UC8, composite), SD003 (UC3, direct reuse), SD004 (UC4, direct reuse), SD005 (UC11, direct reuse).
- UC1, UC9, UC10, and UC12 do **not** appear in any SDD composite/direct sequence diagram — but they are **not uncovered**, since each has its own dedicated SRS sequence diagram (Figures 2.4.1b, 2.4.9b, 2.4.10b, 2.4.12b respectively).

| ❌ Wrong | ✅ Correct |
|---|---|
| "SD001 covers UC2 (Submit Demand Signal)" | "SD001 covers UC2 and UC5 as a composite flow" |
| "SD002 covers UC6, UC7, UC8, UC9, and UC12" | "SD002 covers UC6, UC7, and UC8 as a composite chain" |
| "UC10 has no sequence diagram" | "UC10 has its own dedicated sequence diagram in the SRS (Figure 2.4.10b); it has no SDD-level composite/direct diagram, since the SDD's five diagrams focus on the most operationally significant flows" |
| "UC1/UC9/UC12 have no sequence diagram" | Same correction as UC10 — each has a dedicated SRS diagram, just not an SDD one |

**Always refer to Table 4.2** (now retitled "Sequence Diagram Coverage by Use Case" in the refined Chapter 4) when introducing sequence diagrams. This table now shows both tiers — the SRS column and the SDD column — specifically to prevent the conflation above.

---

## NEW: Trap 9 — PSM1/PSM2 Phase Confusion

This project went through an extended period where its own context modules incorrectly described the current semester as "PSM2." This was checked and corrected: the project is in **PSM1**, due 25 June 2026 (confirmed by the SRS cover page: "SECJ 3032: Software Engineering FYP1, Semester 01, 2026/2027"). PSM2 does not begin until March 2027, after an industrial training placement running September 2026 – February 2027.

| ❌ Wrong | ✅ Correct |
|---|---|
| "PSM2 is currently active" | "PSM1 is currently active, due 25 June 2026; PSM2 begins March 2027" |
| "Development continues immediately after this submission with no gap" | "A buffer sprint follows submission, then an internship placement (Sep 2026–Feb 2027) with weekends-only development, then PSM2 resumes full-time in March 2027" |
| Treating the student app, MAS backend, and dashboard as built/tested in the current semester | Only the student app (Sprints P1.S1–P1.S4) is targeted for partial completion in PSM1; the MAS backend and dashboard are PSM2 (Phase 2/3) work |
| Referencing a "PSM2 Progress 1 / Progress 2" deliverable structure for the current semester's SRS/SDD/STD work | These are **PSM1** Progress 1 (SRS) and Progress 2 (SDD, STD, chapters) deliverables |

**Before writing or editing anything that mentions a timeline, deadline, or "current phase," check `00_MASTER_CONTEXT.md`'s "ORBIT Development Roadmap" section first** — it is the corrected, single source of truth for all dates and phase boundaries.

---

## NEW: Trap 10 — "Five-Step" vs "Six-Step" Bus Agent Constraint Hierarchy

The Bus Agent constraint hierarchy has **six** steps (corridor filter → capacity check → protected-time check → claim check → intervention selection → overflow flag), as specified in `01_AGENT_DESIGN.md`. The phrase "five-step constraint hierarchy" is a recurring wording bug found in multiple places across this project's documents during this session's review:

- Found and fixed in the refined Chapter 3 (two instances) and Chapter 4 (Table 4.3) drafts.
- **Still present and unfixed, as of last check, in the actual STD document** (page 3, overview paragraph).
- The corresponding activity diagram (`ORBIT_Activity_Diagram.xml`) also still labels a 5-step process — flagged for manual correction.
- Not yet checked: whether this phrase also appears anywhere in the SDD body text.

| ❌ Wrong | ✅ Correct |
|---|---|
| "five-step constraint hierarchy" | "six-step constraint hierarchy" |
| Listing only 5 of the 6 steps when summarising the hierarchy | corridor filter, capacity check, protected-time check, claim check, intervention selection, overflow flag — all six |

**Before finalising any document, search it for "five-step" or "five step" and fix any remaining instances.**

---

## Existing Scope Trap (Trap 1–7) — Unchanged, See Original File

Traps 1 through 7, the pre-SDD/STD checklist, the Chapter 4 table numbering guard, and the Chapter 3 scope guard from the original version of this file are all still accurate and have not been touched. Refer to the existing file content for those sections.
