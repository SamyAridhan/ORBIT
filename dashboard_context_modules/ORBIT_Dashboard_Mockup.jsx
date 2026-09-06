import { useState, useCallback } from "react";

const C = {
  bg:"#F0F4FF", card:"#FFFFFF",
  primary:"#1E3A8A", primaryDim:"#1E3A8A22",
  success:"#059669", successLight:"#D1FAE5",
  accent:"#F59E0B", accentLight:"#FEF3C7",
  red:"#DC2626", redLight:"#FEE2E2",
  orange:"#EA580C", orangeLight:"#FFEDD5",
  text:"#0F172A", textSec:"#64748B", textMuted:"#94A3B8",
  border:"#E2E8F0", purple:"#7C3AED", purpleLight:"#EDE9FE",
};

const DEMAND_CFG = {
  LOW:      { color:"#94A3B8", bg:"#F8FAFC", tc:"#475569" },
  MEDIUM:   { color:C.accent,  bg:C.accentLight, tc:"#92400E" },
  HIGH:     { color:C.orange,  bg:C.orangeLight, tc:"#9A3412" },
  CRITICAL: { color:C.red,     bg:C.redLight,    tc:"#991B1B" },
};

const STATUS_CFG = {
  IDLE:          { color:"#CBD5E1", label:"IDLE" },
  COMMUTING:     { color:C.primary, label:"COMMUTING" },
  BOARDING:      { color:C.success, label:"BOARDING" },
  RECALCULATING: { color:C.accent,  label:"EVALUATING" },
};

const LOG_CFG = {
  BROADCAST: { border:C.primary, bg:"#EFF6FF", icon:"📡" },
  EVAL:      { border:C.accent,  bg:C.accentLight, icon:"⚙️"  },
  ACCEPT:    { border:C.success, bg:C.successLight, icon:"✓"  },
  CLAIM:     { border:C.purple,  bg:C.purpleLight,  icon:"🔒" },
  REJECT:    { border:"#94A3B8", bg:"#F8FAFC",      icon:"✗"  },
  BOARD:     { border:C.success, bg:C.successLight, icon:"🚏" },
};

// ── Initial state ──────────────────────────────────────────────────
const INIT_BUSES = [
  { id:"E1", corridor:"E", status:"COMMUTING",  position:"KDSE → CP",       load:18, max:28, delta:0  },
  { id:"E2", corridor:"E", status:"IDLE",        position:"Terminus",         load:0,  max:28, delta:0  },
  { id:"B1", corridor:"B", status:"COMMUTING",  position:"K9/10 → Cluster", load:22, max:28, delta:0  },
  { id:"B2", corridor:"B", status:"IDLE",        position:"Terminus",         load:0,  max:28, delta:0  },
  { id:"B3", corridor:"B", status:"COMMUTING",  position:"KP → K9/10",      load:12, max:28, delta:0  },
  { id:"F1", corridor:"F", status:"COMMUTING",  position:"KTHO → KTDI",     load:9,  max:28, delta:0  },
];

const INIT_STOPS = [
  { id:"kdoj_e", name:"KDOJ", corridor:"E", queue:8,  level:"MEDIUM", claimed:false, lastBus:18 },
  { id:"klg_e",  name:"KLG",  corridor:"E", queue:4,  level:"LOW",    claimed:false, lastBus:6  },
  { id:"kdse_e", name:"KDSE", corridor:"E", queue:3,  level:"LOW",    claimed:false, lastBus:4  },
  { id:"kp_b",   name:"KP",   corridor:"B", queue:6,  level:"MEDIUM", claimed:false, lastBus:12 },
  { id:"k910_b", name:"K9/10",corridor:"B", queue:2,  level:"LOW",    claimed:false, lastBus:3  },
  { id:"ktr_f",  name:"KTR",  corridor:"F", queue:5,  level:"MEDIUM", claimed:false, lastBus:9  },
];

// ── Demo steps: each defines incremental patches + new log entries ──
const STEPS = [
  { label:"Initial state — system running",
    busPatch:{}, stopPatch:{}, logs:[] },
  { label:"KDOJ demand rising — HIGH threshold crossed",
    busPatch:{}, stopPatch:{ kdoj_e:{queue:18, level:"HIGH"} }, logs:[] },
  { label:"KDOJ demand — CRITICAL (34 students)",
    busPatch:{}, stopPatch:{ kdoj_e:{queue:34, level:"CRITICAL"} }, logs:[] },
  { label:"Stop Agent broadcasts CRITICAL signal",
    busPatch:{}, stopPatch:{},
    logs:[{ type:"BROADCAST", agent:"STOP_KDOJ_E", event:"CRITICAL_BROADCAST",
      desc:"Queue: 34 · is_claimed: false · Broadcasting to all Bus E agents on corridor",
      chips:[] }] },
  { label:"Bus E2 receives signal — evaluating",
    busPatch:{ E2:{status:"RECALCULATING"} }, stopPatch:{},
    logs:[{ type:"EVAL", agent:"BUS_E2", event:"EVALUATING",
      desc:"Received CRITICAL from KDOJ · Running 6-step constraint hierarchy",
      chips:[] }] },
  { label:"All 6 constraints pass — decision made",
    busPatch:{}, stopPatch:{},
    logs:[{ type:"EVAL", agent:"BUS_E2", event:"CONSTRAINTS_CHECKED",
      desc:"Calculating early departure · Headway gap 22 min · Utility 0.81",
      chips:["CORRIDOR ✓","CAPACITY ✓","PROT_TIME ✓","CLAIM ✓","HEADWAY ✓","UTILITY 0.81 ✓"] }] },
  { label:"Early departure accepted — Bus E2 departs",
    busPatch:{ E2:{status:"COMMUTING", position:"En route → KDOJ", delta:-7} }, stopPatch:{},
    logs:[{ type:"ACCEPT", agent:"BUS_E2", event:"EARLY_DEPARTURE_ACCEPTED",
      desc:"Departing 7 min early · Queue: 34 · Headway: 22 min · Utility: 0.81",
      chips:[] }] },
  { label:"Claim published — KDOJ locked to Bus E2",
    busPatch:{}, stopPatch:{ kdoj_e:{claimed:true} },
    logs:[{ type:"CLAIM", agent:"BUS_E2", event:"CLAIM_PUBLISHED",
      desc:"Published to tasks/kdoj/claim · Stop KDOJ locked for Corridor E",
      chips:[] }] },
  { label:"Bus E1 suppressed by claim lock",
    busPatch:{}, stopPatch:{},
    logs:[{ type:"REJECT", agent:"BUS_E1", event:"CLAIM_CHECK_FAIL",
      desc:"KDOJ already claimed by E2 · Response suppressed · No action taken",
      chips:[] }] },
  { label:"Bus E2 boarding at KDOJ — queue resolved",
    busPatch:{ E2:{status:"BOARDING", position:"KDOJ", delta:-7} },
    stopPatch:{ kdoj_e:{queue:4, level:"LOW", claimed:false, lastBus:0} },
    logs:[{ type:"BOARD", agent:"BUS_E2", event:"BOARDING_AT_KDOJ",
      desc:"Arrived KDOJ · 30 boarded · Residual: 4 · Stop agent reset · Claim released",
      chips:[] }] },
];

// ── Derive full state at any step by replaying from step 0 ──────────
function deriveState(targetStep) {
  let buses = INIT_BUSES.map(b=>({...b}));
  let stops = INIT_STOPS.map(s=>({...s}));
  let logs  = [];
  for (let i = 1; i <= targetStep; i++) {
    const s = STEPS[i];
    buses = buses.map(b => s.busPatch[b.id]  ? {...b, ...s.busPatch[b.id]}  : b);
    stops = stops.map(st=> s.stopPatch[st.id] ? {...st,...s.stopPatch[st.id]}: st);
    s.logs.forEach((l,j) => logs.unshift({...l, _key:`${i}-${j}`}));
  }
  return { buses, stops, logs };
}

// ── Atoms ──────────────────────────────────────────────────────────
function CapBar({ load, max }) {
  const p = max>0?load/max:0;
  const c = p<0.6?C.success:p<0.85?C.accent:C.red;
  return (
    <div style={{ background:C.border, borderRadius:4, height:5, overflow:"hidden", flex:1 }}>
      <div style={{ width:`${p*100}%`, background:c, height:"100%", borderRadius:4, transition:"width 0.4s" }}/>
    </div>
  );
}

// ── BusCard ────────────────────────────────────────────────────────
function BusCard({ bus, onOverride }) {
  const sc = STATUS_CFG[bus.status]||STATUS_CFG.IDLE;
  const pc = bus.load/bus.max;
  const cc = pc<0.6?C.success:pc<0.85?C.accent:C.red;
  return (
    <div style={{
      background:C.card, borderRadius:9, padding:"9px 10px", marginBottom:5,
      border:`1.5px solid ${bus.status==="RECALCULATING"?C.accent:C.border}`,
      transition:"border-color 0.3s",
    }}>
      {/* ID + corridor + delta */}
      <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:6 }}>
        <span style={{ background:C.primary, color:"white", fontSize:10, fontWeight:800, padding:"1px 6px", borderRadius:5 }}>
          {bus.id}
        </span>
        {bus.delta!==0 && (
          <span style={{
            background:bus.delta<0?C.successLight:C.redLight,
            color:bus.delta<0?C.success:C.red,
            fontSize:9, fontWeight:800, padding:"1px 6px", borderRadius:5,
          }}>
            {bus.delta<0?`↑${Math.abs(bus.delta)}m early`:`↓${bus.delta}m late`}
          </span>
        )}
      </div>
      {/* status + position */}
      <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:6 }}>
        <span style={{ width:6, height:6, borderRadius:"50%", background:sc.color, flexShrink:0,
          boxShadow:bus.status==="COMMUTING"||bus.status==="BOARDING"?`0 0 0 2px ${sc.color}30`:"none" }}/>
        <span style={{ fontSize:9, fontWeight:600, color:sc.color }}>{sc.label}</span>
        <span style={{ fontSize:9, color:C.textMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>
          {bus.position}
        </span>
      </div>
      {/* capacity */}
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:7 }}>
        <CapBar load={bus.load} max={bus.max}/>
        <span style={{ fontSize:9, fontWeight:700, color:cc, whiteSpace:"nowrap" }}>{bus.load}/{bus.max}</span>
      </div>
      {/* override */}
      <button onClick={()=>onOverride(bus)} style={{
        width:"100%", padding:"4px", background:"transparent",
        border:`1px solid ${C.border}`, borderRadius:5,
        color:C.textMuted, fontSize:9, fontWeight:600, cursor:"pointer",
      }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent;}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textMuted;}}>
        Override
      </button>
    </div>
  );
}

// ── StopCard ───────────────────────────────────────────────────────
function StopCard({ stop }) {
  const dc = DEMAND_CFG[stop.level];
  const crit = stop.level==="CRITICAL";
  return (
    <div style={{
      background:C.card, borderRadius:9, padding:"10px 12px", marginBottom:6,
      border:`1.5px solid ${crit?C.red:C.border}`, transition:"border-color 0.3s",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
        <span style={{ fontSize:12, fontWeight:800, color:C.text }}>{stop.name}</span>
        <span style={{ background:C.border, color:C.textSec, fontSize:8, fontWeight:700, padding:"1px 5px", borderRadius:4 }}>
          {stop.corridor}
        </span>
        <div style={{ flex:1 }}/>
        {stop.claimed && <span style={{ fontSize:13 }} title="Claimed">🔒</span>}
      </div>
      <div style={{ display:"flex", alignItems:"flex-end", gap:8, marginBottom:6 }}>
        <div style={{
          fontSize:38, fontWeight:900, lineHeight:1,
          color:crit?C.red:stop.level==="HIGH"?C.orange:C.text,
          transition:"color 0.3s",
        }}>
          {stop.queue}
        </div>
        <div style={{ paddingBottom:5 }}>
          <span style={{
            background:dc.bg, color:dc.tc, border:`1px solid ${dc.color}44`,
            fontSize:8, fontWeight:700, padding:"2px 6px", borderRadius:20,
            display:"inline-flex", alignItems:"center", gap:3,
          }}>
            <span style={{ width:5, height:5, borderRadius:"50%", background:dc.color, flexShrink:0,
              animation:crit?"pulse 1.4s ease-in-out infinite":"none" }}/>
            {stop.level}
          </span>
        </div>
      </div>
      <div style={{ fontSize:9, color:C.textMuted }}>
        Last bus {stop.lastBus===0?"just now":`${stop.lastBus} min ago`}
      </div>
    </div>
  );
}

// ── LogEntry ───────────────────────────────────────────────────────
function LogEntry({ entry, stepNum }) {
  const lc = LOG_CFG[entry.type]||LOG_CFG.EVAL;
  const mins = ["07","06","05","04","03","02","01","00","00","00"];
  const time = `09:41:${mins[Math.min(stepNum,9)]}`;
  return (
    <div style={{
      borderLeft:`3px solid ${lc.border}`, background:lc.bg,
      borderRadius:"0 8px 8px 0", padding:"9px 11px", marginBottom:6,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
        <span style={{ fontSize:12 }}>{lc.icon}</span>
        <span style={{ fontSize:10, fontWeight:800, color:C.text, flex:1 }}>{entry.agent}</span>
        <span style={{ fontSize:9, color:C.textMuted, fontFamily:"monospace" }}>{time}</span>
      </div>
      <div style={{ fontSize:11, fontWeight:700, color:lc.border, marginBottom:4 }}>{entry.event}</div>
      <div style={{ fontSize:10, color:C.textSec, lineHeight:1.5, marginBottom:entry.chips?.length?6:0 }}>
        {entry.desc}
      </div>
      {entry.chips?.length>0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
          {entry.chips.map(c=>(
            <span key={c} style={{
              background:C.successLight, color:C.success,
              fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:12,
              border:`1px solid ${C.success}44`,
            }}>{c}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Override modal ─────────────────────────────────────────────────
function OverrideModal({ bus, onClose, onConfirm }) {
  if (!bus) return null;
  return (
    <div style={{
      position:"absolute", inset:0, background:"rgba(15,23,42,0.55)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:50, borderRadius:12,
    }}>
      <div style={{ background:C.card, borderRadius:14, padding:"22px 24px", width:300, border:`1.5px solid ${C.border}` }}>
        <div style={{ fontSize:14, fontWeight:800, color:C.text, marginBottom:4 }}>Override Bus {bus.id}</div>
        <div style={{ fontSize:11, color:C.textSec, marginBottom:12, lineHeight:1.5 }}>
          Current: {bus.delta!==0?`EARLY_DEPARTURE (${Math.abs(bus.delta)} min early)`:"Following fixed schedule"}
        </div>
        <div style={{ background:C.accentLight, borderRadius:8, padding:"9px 11px", marginBottom:14, fontSize:10, color:"#92400E", lineHeight:1.5 }}>
          ⚠️ Publishes to <code style={{ fontFamily:"monospace" }}>admin/override</code> via MQTT. Bus {bus.id} updates its route vector immediately.
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onConfirm} style={{ flex:1, padding:"9px", background:C.red, color:"white", border:"none", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer" }}>
            Confirm
          </button>
          <button onClick={onClose} style={{ flex:1, padding:"9px", background:C.bg, color:C.text, border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:12, cursor:"pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState(0);
  const [{ buses, stops, logs }, setState] = useState(deriveState(0));
  const [controlOpen, setControlOpen] = useState(true);
  const [overrideBus, setOverrideBus] = useState(null);

  const goTo = useCallback((n) => {
    const clamped = Math.max(0, Math.min(STEPS.length-1, n));
    setStep(clamped);
    setState(deriveState(clamped));
  }, []);

  const handleOverrideConfirm = () => {
    const entry = {
      type:"REJECT", agent:`BUS_${overrideBus.id}`, event:"FLEET_MANAGER_OVERRIDE",
      desc:`Override confirmed. Published to admin/override. Bus ${overrideBus.id} reverts to fixed schedule.`,
      chips:[], _key:`override-${Date.now()}`,
    };
    setState(prev => ({
      ...prev,
      logs:[entry, ...prev.logs],
      buses:prev.buses.map(b=>b.id===overrideBus.id?{...b,delta:0,status:"IDLE"}:b),
    }));
    setOverrideBus(null);
  };

  // Group buses by corridor
  const corridorGroups = [
    { label:"Corridor E", buses:buses.filter(b=>b.corridor==="E") },
    { label:"Corridor B", buses:buses.filter(b=>b.corridor==="B") },
    { label:"Corridor F", buses:buses.filter(b=>b.corridor==="F") },
  ];

  const criticalCount = stops.filter(s=>s.level==="CRITICAL").length;
  const activeCount   = buses.filter(b=>b.status!=="IDLE").length;

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", display:"flex", flexDirection:"column", position:"relative" }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      {/* Header */}
      <div style={{ background:C.primary, padding:"9px 16px", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
        <div>
          <div style={{ color:"white", fontSize:13, fontWeight:800 }}>ORBIT Fleet Dashboard</div>
          <div style={{ color:"rgba(255,255,255,0.45)", fontSize:8 }}>UTM Campus Bus · Multi-Agent Coordination View</div>
        </div>
        <div style={{ flex:1 }}/>
        {[
          { t:`${activeCount} active`, c:C.success, bg:C.successLight, tc:"#065F46" },
          { t:criticalCount>0?`${criticalCount} critical`:"all clear", c:criticalCount>0?C.red:"#94A3B8", bg:criticalCount>0?C.redLight:"#F8FAFC", tc:criticalCount>0?"#991B1B":"#475569" },
          { t:`${logs.length} decisions`, c:"white", bg:"rgba(255,255,255,0.12)", tc:"white" },
        ].map(p=>(
          <span key={p.t} style={{ background:p.bg, color:p.tc, fontSize:9, fontWeight:700, padding:"3px 8px", borderRadius:20 }}>{p.t}</span>
        ))}
        <span style={{ color:"rgba(255,255,255,0.35)", fontSize:9, fontFamily:"monospace" }}>09:41:07</span>
      </div>

      {/* Columns */}
      <div style={{ flex:1, display:"flex", overflow:"hidden", position:"relative" }}>
        {overrideBus && <OverrideModal bus={overrideBus} onClose={()=>setOverrideBus(null)} onConfirm={handleOverrideConfirm}/>}

        {/* LEFT — Fleet grouped by corridor */}
        <div style={{ width:"22%", minWidth:170, borderRight:`1px solid ${C.border}`, padding:"10px 8px", overflowY:"auto", background:"white" }}>
          {corridorGroups.map(g=>(
            <div key={g.label} style={{ marginBottom:12 }}>
              <div style={{ fontSize:8, fontWeight:700, color:C.textMuted, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6, paddingLeft:2 }}>
                {g.label}
              </div>
              {g.buses.map(b=><BusCard key={b.id} bus={b} onOverride={setOverrideBus}/>)}
            </div>
          ))}
        </div>

        {/* CENTER — Stop status */}
        <div style={{ width:"30%", borderRight:`1px solid ${C.border}`, padding:"10px 9px", overflowY:"auto", background:C.bg }}>
          <div style={{ fontSize:8, fontWeight:700, color:C.textMuted, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
            STOP STATUS · 6 MONITORED
          </div>
          {stops.map(s=><StopCard key={s.id} stop={s}/>)}
        </div>

        {/* RIGHT — Decision log */}
        <div style={{ flex:1, padding:"10px 9px", overflowY:"auto", background:"white" }}>
          <div style={{ fontSize:8, fontWeight:700, color:C.textMuted, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8, display:"flex", justifyContent:"space-between" }}>
            <span>DECISION LOG · LIVE FEED</span>
            {logs.length>0&&<span style={{ color:C.primary }}>{logs.length} events</span>}
          </div>
          {logs.length===0?(
            <div style={{ textAlign:"center", padding:"40px 10px", color:C.textMuted, fontSize:11 }}>
              Press → to start the demo sequence
            </div>
          ):logs.map((l,i)=><LogEntry key={l._key} entry={l} stepNum={step-i}/>)}
        </div>
      </div>

      {/* Demo control — sticky bottom */}
      <div style={{ position:"sticky", bottom:0, display:"flex", justifyContent:"flex-end", padding:"10px 14px", pointerEvents:"none" }}>
        <div style={{ pointerEvents:"all" }}>
          {controlOpen?(
            <div style={{ background:C.primary, borderRadius:14, padding:"9px 12px", boxShadow:"0 8px 24px rgba(30,58,138,0.35)", display:"flex", alignItems:"center", gap:8, minWidth:260 }}>
              <button onClick={()=>goTo(step-1)} disabled={step===0}
                style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:7, color:step===0?"rgba(255,255,255,0.25)":"white", padding:"6px 10px", cursor:step===0?"default":"pointer", fontSize:13, fontWeight:700 }}>
                ←
              </button>
              <div style={{ flex:1, textAlign:"center" }}>
                <div style={{ color:"rgba(255,255,255,0.5)", fontSize:7, letterSpacing:1, textTransform:"uppercase" }}>
                  STEP {step} / {STEPS.length-1}
                </div>
                <div style={{ color:"white", fontSize:10, fontWeight:600, marginTop:1, lineHeight:1.3 }}>
                  {STEPS[step].label}
                </div>
              </div>
              <button onClick={()=>goTo(step+1)} disabled={step===STEPS.length-1}
                style={{ background:step===STEPS.length-1?"rgba(255,255,255,0.1)":C.success, border:"none", borderRadius:7, color:step===STEPS.length-1?"rgba(255,255,255,0.25)":"white", padding:"6px 10px", cursor:step===STEPS.length-1?"default":"pointer", fontSize:13, fontWeight:700 }}>
                →
              </button>
              <button onClick={()=>setControlOpen(false)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.3)", cursor:"pointer", fontSize:10, padding:"0 2px" }}>✕</button>
            </div>
          ):(
            <button onClick={()=>setControlOpen(true)} style={{ background:C.primary, border:"none", borderRadius:"50%", width:42, height:42, color:"white", fontSize:16, cursor:"pointer", boxShadow:"0 4px 16px rgba(30,58,138,0.4)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              ⚡
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
