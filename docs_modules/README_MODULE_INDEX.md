# ORBIT Context Modules — Index (13 Nov 2026)
> The map of the module set after the design was locked on 11 Nov 2026 and written into every
> module on 13 Nov 2026. Replaces the July 2026 index.
> Refined the same afternoon after Coddy's sync report (three ways to know people were left behind,
> late "still waiting" taps, the prompted driver question, hold needs GPS) — see `00` design change log.
> If any other document — an older chat, the thesis, the prototypes, `CLAUDE.md` or `docs_modules/`
> in the repo before Coddy syncs them — disagrees with a module dated 13 Nov 2026, the module wins.

---

## Active modules

| File | What changed on 13 Nov 2026 | Load when |
|---|---|---|
| `00_MASTER_CONTEXT.md` | **Rewritten.** Phase status, design change log (July + Nov 2026), new principles, deployment assumptions, placeholders, module index. | ALWAYS |
| `01_AGENT_DESIGN.md` | **Rewritten.** Stop Agent, Bus Agent, Coordinator; spare bus (three cases); confirmed trigger; whole-route count; holding; manager setting; driver answers; message topics; test cases TC101–TC141. | Agent behaviour, rules, tests |
| `02_GRAPH_AND_SIMULATION.md` | **Rewritten.** Both Bus E paths; arrival times from plain travel times; timetable and fleet as data files; injector feeds door counts and driver taps; scenario library; observation mode. | Routes, simulation, validation |
| `03_DASHBOARD_AND_INTEGRATION.md` | **Rewritten.** Endpoints for students, drivers and the manager; message shapes; dashboard with approval and planning reports; backend folder layout. | Dashboard, API, integration |
| `05_GROUNDING_CHECKLIST.md` | **Rewritten.** Trap 11 kept; new Traps 12–16 (old rules, never take a departure away, acting on a guess, assumed ≠ built, PSM2 scope ≠ design scope). | Before any design or build decision |
| `06_RESEARCH_FINDINGS.md` | **Updated.** "Apply to your system" notes brought to the current design; Bartholdi & Eisenstein added; new Part 11 (real-world precedents) and Part 12 (adoption evidence). PSM1 report paragraphs marked as such. | Citations, PSM2 report |
| `07_UTM_BUS_ROUTES_REFERENCE.md` | **Rewritten** from the Oct 2026 driver sheets. The 2019/2023 content is gone. | Route and stop questions |
| `08_STUDENT_APP_DESIGN.md` | **Rewritten.** Destination first, transfers, "did you get on?", how full, notices, driver mode, flag-not-block, corrected privacy statement, how students come to use it (locked 13 Nov, with sources). | App design |
| `09_SUPERVISOR_PROJECT_REFERENCE.md` | **Updated.** ORBIT's position wording, GPS source order, separate app, Phase 1 coverage risk. PAJ facts unchanged. | PAJ framing |
| `10_PROTOTYPE_STATUS.md` | **Updated.** New section: where the prototypes stand against the Nov 2026 design. The old "rebuild around Early Departure" plan is void. | Any frontend work |
| `11_TESTING_QA_JBAGENTIC.md` | **Updated.** Test targets moved to the Coordinator; "no double claim" became the one-job invariant. | Test infrastructure |
| `12_BUILD_MILESTONES.md` | **Replanned.** Blocks 0–13 around the new design; Block 1 Tasks 2 and 3 marked for rework; TC cross-reference. | **Every build session** |
| `13_GIT_PERSISTENCE_PROTOCOL.md` | Unchanged. | Every build session |
| `claude/14_SYSTEM_REQUIREMENTS.md` | **New.** What ORBIT must do, with IDs; maps the PSM1 use cases to the new design. | Design, tests, PSM2 documents |
| `ARCHIVE_PSM1_REPORT_AND_PANEL.md` | **Updated.** Viva answers rewritten for the new design; new answers added. | PSM2 report or viva prep only |
| `README_MODULE_INDEX.md` | This file. | Rarely |

## Design record and working notes (in `claude/`)

| File | What it is |
|---|---|
| `claude/ORBIT_DESIGN_REVIEW_OPEN_DECISIONS.md` | The decisions locked on 11 Nov 2026 and their reasons; what is still open; assumptions Samy sets; the Oct 2026 timetable facts. The "why" behind the modules. |
| `claude/ORBIT_REAL_WORLD_PRECEDENTS.md` | Real transport systems that work this way, with links. |
| `claude/CODDY_CATCHUP_BRIEF.md` | The note that brings Claude Code up to date before the build resumes. |

New files written by Chatty land in `claude/` — that is how the Project tool names them. In the repo's `docs_modules/` they sit beside the others.

The Project's own instructions were replaced on 13 Nov 2026 (Samy pasted the new text), so they now match these modules.

## Retired

| File | Why |
|---|---|
| `04_REPORT_WRITING_GUIDE.md`, `QnA_SUPERVISOR.md` | PSM1-era; durable content is in `ARCHIVE_PSM1_REPORT_AND_PANEL.md`. |
| The July 2026 editions of `00`, `01`, `05` | Hold + Early Departure, six-step hierarchy, "interchange stops never signal". Replaced. |

---

## Where to find things

| Question | File |
|---|---|
| What must ORBIT do? | `claude/14_SYSTEM_REQUIREMENTS.md` |
| What exactly happens when a bus leaves people behind? | `01` — "What happens — three cases" |
| Why a spare pool? Why confirmed-first? | `claude/ORBIT_DESIGN_REVIEW_OPEN_DECISIONS.md` 3.1; `01` |
| Is there a real system like this? | `claude/ORBIT_REAL_WORLD_PRECEDENTS.md`; `06` Part 11 |
| How do students come to use the app? | `08` — "How students come to use it"; sources in `06` Part 12 |
| What is the current UTM timetable? | `07` |
| What is built, and what's next? | `12` |
| Is this an old rule? | `05` Trap 12; `00` design change log |
| What does ORBIT assume but not build? | `00` — "Deployment assumptions"; `14` |
| What's still undecided? | `00` — "Still open or deferred"; the tracker, section 4 |

---

## Not touched

- The submitted PSM1 thesis.
- The GitHub repo. Coddy syncs `docs_modules/` and `CLAUDE.md` from this module set when the build resumes (`claude/CODDY_CATCHUP_BRIEF.md`).
- The prototypes (`src/`, `dashboard/`, `AGENTS.md`, `AGENTS_DASHBOARD.md`, `context_modules/`, `context_modules_2/`).
