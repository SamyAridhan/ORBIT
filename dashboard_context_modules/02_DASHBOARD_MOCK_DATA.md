# 02 — Mock Data

All data lives in `src/data/mockData.js`. Import from here everywhere.

```js
// src/data/mockData.js

// ── Initial bus states ─────────────────────────────────────────────
export const INIT_BUSES = [
  { id:"E1", corridor:"E", status:"COMMUTING",  position:"KDSE → CP",        load:18, max:28, delta:0 },
  { id:"E2", corridor:"E", status:"IDLE",        position:"Terminus",          load:0,  max:28, delta:0 },
  { id:"B1", corridor:"B", status:"COMMUTING",  position:"K9/10 → Cluster",  load:22, max:28, delta:0 },
  { id:"B2", corridor:"B", status:"IDLE",        position:"Terminus",          load:0,  max:28, delta:0 },
  { id:"B3", corridor:"B", status:"COMMUTING",  position:"KP → K9/10",       load:12, max:28, delta:0 },
  { id:"F1", corridor:"F", status:"COMMUTING",  position:"KTHO → KTDI",      load:9,  max:28, delta:0 },
];

// ── Initial stop states ────────────────────────────────────────────
export const INIT_STOPS = [
  { id:"kdoj_e", name:"KDOJ", corridor:"E", queue:8,  level:"MEDIUM", claimed:false, lastBus:18 },
  { id:"klg_e",  name:"KLG",  corridor:"E", queue:4,  level:"LOW",    claimed:false, lastBus:6  },
  { id:"kdse_e", name:"KDSE", corridor:"E", queue:3,  level:"LOW",    claimed:false, lastBus:4  },
  { id:"kp_b",   name:"KP",   corridor:"B", queue:6,  level:"MEDIUM", claimed:false, lastBus:12 },
  { id:"k910_b", name:"K9/10",corridor:"B", queue:2,  level:"LOW",    claimed:false, lastBus:3  },
  { id:"ktr_f",  name:"KTR",  corridor:"F", queue:5,  level:"MEDIUM", claimed:false, lastBus:9  },
];

// ── Demo steps ─────────────────────────────────────────────────────
// Each step defines:
//   label    — shown in demo control
//   busPatch — partial updates keyed by bus id
//   stopPatch — partial updates keyed by stop id
//   logs     — new log entries added at this step (prepended to log list)
export const STEPS = [
  {
    label:"Initial state — system running",
    busPatch:{}, stopPatch:{}, logs:[],
  },
  {
    label:"KDOJ demand rising — HIGH threshold crossed",
    busPatch:{}, stopPatch:{ kdoj_e:{ queue:18, level:"HIGH" } }, logs:[],
  },
  {
    label:"KDOJ demand — CRITICAL (34 students)",
    busPatch:{}, stopPatch:{ kdoj_e:{ queue:34, level:"CRITICAL" } }, logs:[],
  },
  {
    label:"Stop Agent broadcasts CRITICAL signal",
    busPatch:{}, stopPatch:{},
    logs:[{
      type:"BROADCAST", agent:"STOP_KDOJ_E", event:"CRITICAL_BROADCAST",
      desc:"Queue: 34 · is_claimed: false · Broadcasting to all Bus E agents on corridor",
      chips:[],
    }],
  },
  {
    label:"Bus E2 receives signal — evaluating",
    busPatch:{ E2:{ status:"RECALCULATING" } }, stopPatch:{},
    logs:[{
      type:"EVAL", agent:"BUS_E2", event:"EVALUATING",
      desc:"Received CRITICAL from KDOJ · Running 6-step constraint hierarchy",
      chips:[],
    }],
  },
  {
    label:"All 6 constraints pass — decision made",
    busPatch:{}, stopPatch:{},
    logs:[{
      type:"EVAL", agent:"BUS_E2", event:"CONSTRAINTS_CHECKED",
      desc:"Calculating early departure · Headway gap 22 min · Utility score 0.81",
      chips:["CORRIDOR ✓","CAPACITY ✓","PROT_TIME ✓","CLAIM ✓","HEADWAY ✓","UTILITY 0.81 ✓"],
    }],
  },
  {
    label:"Early departure accepted — Bus E2 departs",
    busPatch:{ E2:{ status:"COMMUTING", position:"En route → KDOJ", delta:-7 } }, stopPatch:{},
    logs:[{
      type:"ACCEPT", agent:"BUS_E2", event:"EARLY_DEPARTURE_ACCEPTED",
      desc:"Departing 7 min early · Queue: 34 · Headway: 22 min · Utility: 0.81",
      chips:[],
    }],
  },
  {
    label:"Claim published — KDOJ locked to Bus E2",
    busPatch:{}, stopPatch:{ kdoj_e:{ claimed:true } },
    logs:[{
      type:"CLAIM", agent:"BUS_E2", event:"CLAIM_PUBLISHED",
      desc:"Published to tasks/kdoj/claim · Stop KDOJ locked for Corridor E",
      chips:[],
    }],
  },
  {
    label:"Bus E1 suppressed by claim lock",
    busPatch:{}, stopPatch:{},
    logs:[{
      type:"REJECT", agent:"BUS_E1", event:"CLAIM_CHECK_FAIL",
      desc:"KDOJ already claimed by E2 · Response suppressed · No action taken",
      chips:[],
    }],
  },
  {
    label:"Bus E2 boarding at KDOJ — queue resolved",
    busPatch:{ E2:{ status:"BOARDING", position:"KDOJ", delta:-7 } },
    stopPatch:{ kdoj_e:{ queue:4, level:"LOW", claimed:false, lastBus:0 } },
    logs:[{
      type:"BOARD", agent:"BUS_E2", event:"BOARDING_AT_KDOJ",
      desc:"Arrived KDOJ · 30 boarded · Residual: 4 · Stop agent reset · Claim released",
      chips:[],
    }],
  },
];

// ── Status display config ──────────────────────────────────────────
export const STATUS_CFG = {
  IDLE:          { color:"#CBD5E1", label:"IDLE" },
  COMMUTING:     { color:"#1E3A8A", label:"COMMUTING" },
  BOARDING:      { color:"#059669", label:"BOARDING" },
  RECALCULATING: { color:"#F59E0B", label:"EVALUATING" },
};

// ── Demand level display config ────────────────────────────────────
export const DEMAND_CFG = {
  LOW:      { color:"#94A3B8", bg:"#F8FAFC", tc:"#475569" },
  MEDIUM:   { color:"#F59E0B", bg:"#FEF3C7", tc:"#92400E" },
  HIGH:     { color:"#EA580C", bg:"#FFEDD5", tc:"#9A3412" },
  CRITICAL: { color:"#DC2626", bg:"#FEE2E2", tc:"#991B1B" },
};

// ── Log entry display config ───────────────────────────────────────
export const LOG_CFG = {
  BROADCAST: { border:"#1E3A8A", bg:"#EFF6FF", icon:"📡" },
  EVAL:      { border:"#F59E0B", bg:"#FEF3C7", icon:"⚙️"  },
  ACCEPT:    { border:"#059669", bg:"#D1FAE5", icon:"✓"  },
  CLAIM:     { border:"#7C3AED", bg:"#EDE9FE", icon:"🔒" },
  REJECT:    { border:"#94A3B8", bg:"#F8FAFC", icon:"✗"  },
  BOARD:     { border:"#059669", bg:"#D1FAE5", icon:"🚏" },
};
```
