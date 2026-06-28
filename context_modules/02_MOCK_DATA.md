# 02 — Mock Data

All data lives in `src/data/mockData.js`. Import from here everywhere. Do not hardcode values inline in components.

```js
// src/data/mockData.js

export const STOPS = [
  { id:"kdoj", name:"KDOJ", full:"Kolej Dato' Onn Jaafar",    corridors:["D","E"] },
  { id:"kdse", name:"KDSE", full:"Kolej Datin Seri Endon",    corridors:["D","E"] },
  { id:"klg",  name:"KLG",  full:"Kolej Lembah Gelang",       corridors:["D","E"] },
  { id:"kp",   name:"KP",   full:"Kolej Perdana",             corridors:["A","B"] },
  { id:"k910", name:"K9/10",full:"Kolej 9 / Kolej 10",        corridors:["B","C"] },
  { id:"ktr",  name:"KTR",  full:"Kolej Tun Razak",           corridors:["F","G"] },
  { id:"ktho", name:"KTHO", full:"Kolej Tun Hussein Onn",     corridors:["F","G"] },
  { id:"ktdi", name:"KTDI", full:"Kolej Tun Dr Ismail",       corridors:["F","G"] },
  { id:"cp",   name:"CP",   full:"Canselori / Center Point",  corridors:["A","C","D","E","F","G","H"] },
];

// Corridors keyed by letter. Only include corridors that have a DEST entry.
export const CORRIDORS = {
  D: { label:"Canselori (CP)",   sub:"via PKU · Pusat Kesihatan",  color:"#F59E0B" },
  E: { label:"Faculty Cluster",  sub:"T02 · T06 · T08",            color:"#3B5FD4" },
  A: { label:"Canselori (CP)",   sub:"via Jalan Amal",             color:"#F59E0B" },
  B: { label:"Faculty Cluster",  sub:"T02 · T04 · T08",            color:"#3B5FD4" },
  C: { label:"KTC · Jalan Amal", sub:"via CP",                     color:"#7C3AED" },
  F: { label:"Canselori (CP)",   sub:"via KTDI · Jalan Amal",      color:"#7C3AED" },
  G: { label:"Canselori (CP)",   sub:"via N24 · SKT · P19",        color:"#059669" },
};

// THE demo bus — Bus E2 approaching KDOJ
// routeToUser: ordered stops the bus passes BEFORE reaching the user's stop
export const DEMO_BUS = {
  id:         "E2",
  corridor:   "E",
  etaMinutes: 14,           // initial ETA shown to user
  load:       14,           // current passengers on bus
  max:        28,           // max capacity
  lastSeen:   "PKU",        // last stop the bus passed
  routeToUser: [
    { id:"kdse", name:"KDSE", waiting:8,  isUserStop:false },
    { id:"klg",  name:"KLG",  waiting:5,  isUserStop:false },
    { id:"kdoj", name:"KDOJ", waiting:0,  isUserStop:true  },
    // waiting for KDOJ is set dynamically from the live count, not here
  ],
  followingBus: { id:"E1", etaMinutes:38, status:"At terminus" },
};

// Initial waiting count at user's stop (before user taps)
export const INITIAL_WAITING = 11;

// Demo sequence timing (milliseconds after user taps "I'm waiting here")
export const DEMO_TIMING = {
  extraPeopleDelay:    3000,   // +4 more people join the queue
  extraPeopleCount:    4,
  dispatchDelay:       6000,   // dispatch banner fires, ETA drops
  dispatchEtaNew:      7,      // new ETA in minutes
  dispatchHideDelay:   11000,  // banner dismisses
  boardingDelay:       16000,  // boarding prompt appears
};
```
