# ORBIT Context Modules — Reorganized Index (July 2026)
> This is the map of the finalized module set after the sembreak reorganization pass. Replaces the
> module index inside the old `00_MASTER_CONTEXT.md` — that table is also updated to match this, so
> either can be treated as current.

---

## Active Modules (load as needed)

| File | Status this session | Load When |
|---|---|---|
| `00_MASTER_CONTEXT.md` | **Rewritten.** Phase status corrected, compression-removal correction added, module index updated. | ALWAYS |
| `01_AGENT_DESIGN.md` | **Rewritten.** Compression removed from the intervention hierarchy; Hold + Early Departure only; new `NO_INTERVENTION_AVAILABLE` outcome; TC17 added. | Agent behaviour, MAS design, test cases, MQTT |
| `02_GRAPH_AND_SIMULATION.md` | **Confirmed unchanged.** Reviewed for compression references (none found) and route direction (Corridor E already correctly ordered KDOJ→KLG→KDSE→CP...). No edits needed. | Graph/routing, simulation design |
| `03_DASHBOARD_AND_INTEGRATION.md` | **Confirmed unchanged.** Its decision-log example already uses `EARLY_DEPARTURE_ACCEPTED`, not compression. No edits needed. | Dashboard design, API, system integration |
| `05_GROUNDING_CHECKLIST.md` | **Rewritten.** Traps 8–10 marked resolved/historical; new Trap 11 (compression) added as the active one to watch. | Before any design/build decision |
| `06_RESEARCH_FINDINGS.md` | **Confirmed unchanged.** Citation set and research gap statement don't reference compression; still the correct literature base if PSM2 report extends Chapter 2. | Citation questions, PSM2 report continuity |
| `07_UTM_BUS_ROUTES_REFERENCE.md` | **Confirmed unchanged.** Ground truth for corridors/stops; this is the doc that already has Corridor E's stop order right. | Route/stop questions, graph nodes |
| `08_STUDENT_APP_DESIGN.md` | **Confirmed unchanged.** This is the formal design spec (distinct from the built prototype in the repo) — no compression references, still accurate. | App design, demand signal integrity |
| `09_SUPERVISOR_PROJECT_REFERENCE.md` | **Confirmed unchanged.** PAJ project framing is stable and thesis-verified. | PAJ framing, supervisor meeting prep |
| `10_PROTOTYPE_STATUS.md` | **New.** Documents what's actually built in the GitHub repo, what's locked (PWA UX), what's open (dashboard polish, the compression-dependent demo scenario — noted but deliberately not redesigned this session). | Only when work turns to the actual PWA/dashboard repo |
| `ARCHIVE_PSM1_REPORT_AND_PANEL.md` | **New**, replaces the two files below. | Only if PSM2 report writing or viva prep comes up |

## Retired Modules

| File | Why | Where its useful content went |
|---|---|---|
| `04_REPORT_WRITING_GUIDE.md` | PSM1 report is submitted; per-chapter drafting instructions are dead weight now. | Durable conventions (tense rules, citation set pointer, PAJ framing rule) → `ARCHIVE_PSM1_REPORT_AND_PANEL.md` |
| `QnA_SUPERVISOR.md` | Panel round is done; "things not to say" scope-trap content is superseded by the checklist module. | Reusable viva/panel reasoning → `ARCHIVE_PSM1_REPORT_AND_PANEL.md`; scope traps → `05_GROUNDING_CHECKLIST.md` |

Don't load the two retired files going forward — they contain mid-correction framing from before the final thesis PDF existed, which is now stale.

---

## What Was Actually Confirmed This Session (Grounded Against the Real Thesis PDF + Repo)

Spot-checked directly against the finalized, submitted 311-page thesis PDF rather than assumed from the old context modules:

- ✅ Six-step constraint hierarchy — confirmed correct throughout the submitted document, no lingering "five-step" bug.
- ✅ Bus capacity — 28 seats, used consistently.
- ✅ Headway constants — 15-minute minimum gap for early departure, 8-minute hard cap, both confirmed in the SRS requirement text and test cases (TC007_01/02).
- ✅ Corridor scope — Bus B, E, F confirmed as the modeled corridors.
- ✅ Corridor E stop order — KDOJ is correctly the first stop in `07_UTM_BUS_ROUTES_REFERENCE.md` and `02_GRAPH_AND_SIMULATION.md` (KDOJ→KLG→KDSE→CP...). Worth knowing: the **built PWA prototype's mock data has this backwards** (bus reaches KDOJ last) — that's a prototype-level detail, not a context-module error, and per your instruction it's left alone for now.
- ⚠️ Arrival compression — confirmed present in the submitted thesis (design as originally proposed) and confirmed **removed going forward** in every context module per this session's correction. The submitted PDF itself is not edited retroactively.

## What Wasn't Touched (By Your Instruction)

- The actual thesis PDF — not edited.
- The GitHub repo (`AGENTS.md`, `AGENTS_DASHBOARD.md`, `context_modules/`, `dashboard_context_modules/`, `src/`, `dashboard/`) — not edited. `10_PROTOTYPE_STATUS.md` documents its state but makes no changes to it.
- `02`, `03`, `06`, `07`, `08`, `09` — reviewed and confirmed accurate, left as the originals since no correction was needed. If you want their file headers refreshed to match the new "PSM1 complete, sembreak" framing purely for consistency (no content change), say so and I'll do a quick pass — didn't do it by default since it's cosmetic and these files weren't otherwise broken.
