# ORBIT Repo — Claude Code Orientation

This repo has three areas, each with its own instruction file. Read the relevant one before
working in that area — don't assume backend conventions apply to frontend code or vice versa.

- `src/` (student PWA) — see `AGENTS.md`. Prototype, built, shows the OLD flow. Don't modify
  without explicit instruction (rebuilt on the new flow in Block 12).
- `dashboard/` (fleet dashboard) — see `AGENTS_DASHBOARD.md`. Prototype, shows the OLD flow.
  Don't modify without explicit instruction (reworked in Block 13).
- `backend/` (MAS backend, Python) — see `AGENTS_BACKEND.md` for full context.
  This is the active build area. `backend/CLAUDE.md` has the essential rules auto-loaded;
  `AGENTS_BACKEND.md` has the complete brief including architecture, process, and reporting protocol.

Full project design context lives in `docs_modules/` — see `docs_modules/README_MODULE_INDEX.md`
for what's in each file and when to load it. `docs_modules/00_MASTER_CONTEXT.md` is the
always-load file for project-wide context. **The modules dated 13 Nov 2026 win** over anything
older — including older chats, the submitted thesis, the prototypes, and any instruction file
that still states the July 2026 rules.

## Key project-wide rules (design locked 11 Nov 2026, modules 13 Nov 2026)

- **ORBIT never takes away a departure students are counting on.** A spare bus adds capacity.
  The only early move is a pull-forward of the next bus, and only when a spare covers its
  original time and the spare's driver has accepted first.
- **No rerouting.** Buses never change routes or stops. A spare on an extra trip drives that
  route's normal path.
- **Act only on a confirmed overflow:** a bus really left full AND people are really still
  waiting. Not a prediction, not a demand level. Demand levels are display colours only.
- **Three agents:** Stop Agent (counts and reports every tick), Bus Agent (state, driver screen,
  instructions; spares are Bus Agents too), Coordinator (route totals, spare pool, decisions).
- **Holding exists only to keep buses spaced** (too close behind the bus ahead, at a control
  point, at peak). Never as a response to a queue.
- **Arrival compression is forbidden.** Removed design error (July 2026) — do not implement,
  reference, or name anything `*compression*` or `ARRIVAL_COMPRESSION*` in new code. The
  prototypes still contain it; removal is Blocks 12–13. The word "compression" is absent from
  `src/`/`dashboard/` — search for the symptom ("14 min → 7 min"). See
  `docs_modules/05_GROUNDING_CHECKLIST.md` Trap 11.
- **The July 2026 rules are gone** (Hold/Early Departure for a queue, six-step Bus Agent
  hierarchy, 85% capacity lock, 12-min window, claim-lock, `NO_INTERVENTION_AVAILABLE`,
  "CP and Jalan Amal never signal", adoption-rate scaling, 1.5× missed-bus weight,
  queue-adjusted ETA). Do not bring them back. See `05_GROUNDING_CHECKLIST.md` Trap 12.
- **Rule-based decision path.** The only AI in it is the Isolation Forest flag on strange counts.
- **System Development track FYP.** Frame everything as requirements met and test cases passed,
  not research/comparison.
- Requirements with IDs: `docs_modules/14_SYSTEM_REQUIREMENTS.md`. Build progress:
  `docs_modules/12_BUILD_MILESTONES.md` — check it before starting work.
- **Git persistence (`docs_modules/13_GIT_PERSISTENCE_PROTOCOL.md`):** `git fetch origin --prune`
  at session start; push at session end; every report names the branch and says "pushed: yes/no".
  Working branch: `claude/funny-knuth-w6dibj`. "Done" = pushed to origin and re-fetchable.
