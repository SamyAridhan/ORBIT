# AGENTS_DASHBOARD.md — ORBIT Fleet Dashboard

The dashboard lives in `dashboard/` as a separate Vite application and Vercel project. Read `context_modules_2/00` through `05` for supporting design context, but use this file when they conflict with the implemented student PWA.

## Locked corrections

- The dashboard replays the exact student-PWA scenario: E2 is already commuting at 14/28, KDOJ grows from 11 to 16, and ETA improves from 14 to 7.
- The intervention is arrival compression, not an early departure by an empty terminus bus.
- Buses never change corridors. Fleet override cancels a timing intervention and returns a bus to its planned timing; it never changes a route vector.
- Ten steps, numbered 0–9. Every state is derived by replaying immutable step data from the initial state.
- No backend, APIs, WebSockets, MQTT connection, or automatic timers. The arrow control is the only demo-step driver.
- Desktop operations interface with readable 12–16px typography, designed for a 1366×768 presentation display.

## Required validation

- Replay 0→9→0 repeatedly without state drift.
- Direct jumps to any step must equal sequential replay to that step.
- Modal actions must not alter canonical replay state; changing steps clears any simulated override.
- `npm test` and `npm run build` must pass inside `dashboard/`.
