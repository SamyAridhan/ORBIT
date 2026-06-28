# 00 — Project Overview

## What this is
A hardcoded React PWA frontend for ORBIT — On-Demand, Route-Based Intelligent Transit System. Built for a university Final Year Project panel presentation at UTM (Universiti Teknologi Malaysia). The prototype demonstrates the student-facing layer of a three-layer campus bus coordination system.

## Purpose
Demo only. Make the idea tangible and convincing. Run flawlessly in front of two examiners on a laptop browser and a real phone.

## Critical rule
**No backend. No API calls. No fetch(). All data is hardcoded mock data. All "live updates" are simulated with setTimeout.**

## Tech stack — use exactly this
- React 18 + Vite
- Tailwind CSS (utility classes only, no custom CSS files)
- React Router v6 (for screen navigation)
- localStorage (first-visit onboarding detection)
- Lucide React (icons where needed)
- No Redux, no Zustand, no external state library

## Deploy target
Vercel. Connect GitHub repo. `npm run build`. Add `vercel.json` for SPA routing.

```json
// vercel.json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

## PWA setup (index.html head)
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#1E3A8A" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
```

## Responsive behavior
- Mobile (< 640px): full screen, no phone frame, no chrome
- Desktop (≥ 640px): phone frame centered on screen, max-width 390px, slate background behind

## Folder structure
```
src/
  main.jsx
  App.jsx
  data/
    mockData.js
  design/
    tokens.js
  components/
    PhoneFrame.jsx
    TopBar.jsx
    CapacityBar.jsx
    PersonSVG.jsx
    PeopleQueue.jsx
    RouteTimeline.jsx
    DispatchBanner.jsx
    BoardingPrompt.jsx
  screens/
    Onboarding.jsx
    Home.jsx
    GPSPermission.jsx
    Destination.jsx
    ETA.jsx
  hooks/
    useDemoSequence.js
vercel.json
```
