# ORBIT MAS Backend — Claude Code Instructions

For the complete brief (architecture, process, reporting protocol), read `AGENTS_BACKEND.md`
at the repo root. This file contains the essential rules that must be in context for every
backend session.

## What you're building

Multi-Agent System backend in `backend/`: Stop Agents + Bus Agents communicating over MQTT,
with a FastAPI API layer, NetworkX campus graph, and time-aware demand simulation.
Three corridors in scope: Bus B, E, F. Corridor E is the reference implementation.

## Non-negotiable rules

| Rule | Detail |
|---|---|
| **No rerouting** | Buses never change corridors or stops. |
| **Exactly two interventions** | Hold (bus ahead of schedule) or Early Departure (bus idle at terminus, last resort). Nothing else. |
| **Arrival compression is forbidden** | Removed design error. Do not implement, reference, or create anything named `*compression*` or `ARRIVAL_COMPRESSION*`. See `05_GROUNDING_CHECKLIST.md` Trap 11. |
| **"No safe intervention" is valid** | COMMUTING + on-time/behind + high demand ahead = `NO_INTERVENTION_AVAILABLE`. Don't invent workarounds. |
| **Interchange stops never dispatch** | CP and Jalan Amal are waypoints only — no dispatch signals. |
| **Early departure is bounded** | Terminus only. Headway gap >= 15 min. Max 8 min early. Utility >= 0.6. All four conditions, every time. |
| **Only one AI/ML component** | Isolation Forest in Stop Agent for anomaly detection only. No other ML/AI. |
| **Corridor filter first** | Bus Agent ignores signals from stops not on its corridor before checking anything else. |
| **Claim-lock protocol** | Exactly one Bus Agent claims a demand signal. Never both, never neither. |

## Placeholder constants

Keep these in one location (e.g. `config/thresholds.py`), marked as placeholders:

| Value | Placeholder | Status |
|---|---|---|
| Bus capacity | 28 seats | Not finalized |
| Early departure min headway gap | 15 min | Loosely grounded |
| Early departure max advance | 8 min | Loosely grounded |
| Capacity lock threshold | 85% | No grounding |
| Utility score threshold | 0.6 | No grounding |

## Code expectations

- Python 3.11+, type hints on signatures
- Small, single-responsibility functions — easy to property-test
- Tests alongside every task (pytest, in `backend/tests/`)
- Don't modify `src/` or `dashboard/` unless explicitly told to
- Check `docs_modules/12_BUILD_MILESTONES.md` for current progress before starting work
- Don't tick milestone boxes yourself — report completion for review
