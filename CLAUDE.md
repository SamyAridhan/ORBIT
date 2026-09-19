# ORBIT Repo — Claude Code Orientation

This repo has three areas, each with its own instruction file. Read the relevant one before
working in that area — don't assume backend conventions apply to frontend code or vice versa.

- `src/` (student PWA) — see `AGENTS.md`. Prototype, built, mostly locked. Don't modify
  without explicit instruction.
- `dashboard/` (fleet dashboard) — see `AGENTS_DASHBOARD.md`. Prototype, being reworked.
  Don't modify without explicit instruction.
- `backend/` (MAS backend, Python) — see `AGENTS_BACKEND.md` for full context.
  This is the active build area. `backend/CLAUDE.md` has the essential rules auto-loaded;
  `AGENTS_BACKEND.md` has the complete brief including architecture, process, and reporting protocol.

Full project design context lives in `docs_modules/` — see `docs_modules/README_MODULE_INDEX.md`
for what's in each file and when to load it. `docs_modules/00_MASTER_CONTEXT.md` is the
always-load file for project-wide context.

## Key project-wide rules

- **No rerouting.** Buses never change corridors or stops.
- **Exactly two interventions:** Hold and Early Departure. Nothing else.
- **Arrival compression is forbidden.** Removed design error — do not implement, reference, or
  name anything `*compression*` or `ARRIVAL_COMPRESSION*` in new code. Existing prototype
  references are a known open issue (Block 9). See `docs_modules/05_GROUNDING_CHECKLIST.md` Trap 11.
- **System Development track FYP.** Frame everything as software validation, not research/comparison.
- Build progress is tracked in `docs_modules/12_BUILD_MILESTONES.md` — check it before starting work.
