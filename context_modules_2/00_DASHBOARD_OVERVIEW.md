# 00 — Dashboard Project Overview

## What this is
A hardcoded React frontend for the ORBIT Fleet Manager Dashboard — the operations layer of a three-layer campus bus coordination system. Built for a university Final Year Project panel presentation at UTM. This is a separate frontend from the student PWA (already built). Both are deployed independently.

## Purpose
Show the examiner what the agents are doing behind the scenes during the student app demo. The dashboard makes the multi-agent coordination visible and auditable. The Decision Log is the centrepiece — it shows every agent decision with the exact constraints checked.

## Critical rule
**No backend. No API calls. No fetch(). All data is hardcoded. All state changes are driven by the manual demo control (← →). Nothing is automated.**

## Tech stack — same as student app, use exactly this
- React 18 + Vite
- Tailwind CSS (utility classes, no custom CSS files)
- React Router not needed (single page, no routing)
- No external state library

## Deploy target
Vercel. Separate repo from student app. Same `vercel.json`:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

## Layout — single page, 3 columns, full browser width
```
┌─────────────────── HEADER BAR ──────────────────────────────────┐
├──── LEFT 22% ────┬──── CENTER 30% ────┬──── RIGHT flex-1 ──────┤
│  Bus Fleet        │  Stop Status        │  Decision Log           │
│  Grouped by       │  6 monitored        │  Scrollable live feed   │
│  corridor         │  stops              │  Newest entry on top    │
├──────────────────────────────────────────────────────────────────┤
│                    DEMO CONTROL (sticky bottom-right)            │
└─────────────────────────────────────────────────────────────────┘
```

## Responsive behavior
Desktop only. Minimum 1024px wide. No mobile layout needed — this is a fleet manager tool shown on a laptop during presentation. Do not add breakpoints.

## Folder structure
```
src/
  main.jsx
  App.jsx               ← single page, no routing
  data/
    mockData.js
  design/
    tokens.js
  components/
    Header.jsx
    BusCard.jsx
    StopCard.jsx
    LogEntry.jsx
    OverrideModal.jsx
    DemoControl.jsx
  hooks/
    useDashboard.js     ← state management: step, buses, stops, logs
vercel.json
```
