import { useMemo, useState } from "react";
import { C } from "./design/tokens";
import { LOG_CFG, SCENARIO_TIMES } from "./data/mockData";
import { useDashboard } from "./hooks/useDashboard";
import Header from "./components/Header";
import PriorityStrip from "./components/PriorityStrip";
import BusCard from "./components/BusCard";
import StopCard from "./components/StopCard";
import LogEntry from "./components/LogEntry";
import DemoControl from "./components/DemoControl";
import OverrideModal from "./components/OverrideModal";

const LEGEND = [
  ["SIGNAL", "Signal"],
  ["EVAL", "Evaluation"],
  ["ACCEPT", "Accepted"],
  ["CLAIM", "Claim"],
  ["SUPPRESSED", "Duplicate suppressed"],
];

export default function App() {
  const dashboard = useDashboard();
  const [modalBus, setModalBus] = useState(null);
  const groups = useMemo(() => ["E", "B", "F"].map(corridor => ({corridor, buses: dashboard.buses.filter(bus => bus.corridor === corridor)})), [dashboard.buses]);
  const active = dashboard.buses.filter(bus => bus.status !== "IDLE").length;
  const high = dashboard.stops.filter(stop => ["HIGH", "CRITICAL"].includes(stop.level)).length;
  const kdoj = dashboard.stops.find(stop => stop.id === "kdoj_e");
  const confirm = () => { dashboard.applyOverride(modalBus.id); setModalBus(null); };

  return (
    <div className="flex h-screen min-w-[1100px] flex-col overflow-hidden" style={{ background: C.bg }}>
      <Header active={active} high={high} decisions={dashboard.logs.length} time={SCENARIO_TIMES[dashboard.step]}/>
      <PriorityStrip step={dashboard.step} stop={kdoj}/>
      <main className="grid min-h-0 flex-1 grid-cols-[minmax(300px,.9fr)_minmax(330px,1fr)_minmax(460px,1.35fr)]">
        <section className="overflow-y-auto border-r p-4" style={{ background: C.card, borderColor: C.border }}>
          <h2 className="mb-3 text-xs font-extrabold tracking-[.16em]" style={{ color: C.textMuted }}>BUS FLEET · 6 VEHICLES</h2>
          <div className="space-y-4">{groups.map(group => <div key={group.corridor}><h3 className="mb-2 text-sm font-extrabold" style={{ color: C.primary }}>Corridor {group.corridor}</h3><div className="space-y-2">{group.buses.map(bus => <BusCard key={bus.id} bus={bus} focused={bus.id === "E2"} onOverride={setModalBus}/>)}</div></div>)}</div>
        </section>
        <section className="overflow-y-auto border-r p-4" style={{ borderColor: C.border }}>
          <h2 className="mb-3 text-xs font-extrabold tracking-[.16em]" style={{ color: C.textMuted }}>STOP DEMAND · 6 MONITORED</h2>
          <div className="space-y-2">{dashboard.stops.map(stop => <StopCard key={stop.id} stop={stop}/>)}</div>
        </section>
        <section className="overflow-y-auto bg-white p-4 pb-28">
          <div className="mb-2 flex items-center"><h2 className="text-xs font-extrabold tracking-[.16em]" style={{ color: C.textMuted }}>AGENT DECISION LOG · LIVE</h2>{dashboard.logs.length > 0 && <span className="ml-auto text-sm font-extrabold" style={{ color: C.primary }}>{dashboard.logs.length} events</span>}</div>
          <div aria-label="Decision log legend" className="mb-3 flex flex-wrap gap-x-3 gap-y-1 border-b pb-2" style={{ borderColor: C.border }}>
            {LEGEND.map(([type,label]) => <span key={type} className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: C.textSec }}><span className="h-2 w-2 rounded-full" style={{ background: LOG_CFG[type].border }}/>{label}</span>)}
          </div>
          {dashboard.logs.length === 0 ? <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed text-sm" style={{ borderColor: C.border, color: C.textMuted }}>Press → or the right-arrow key to begin the replay</div> : <div className="space-y-2">{dashboard.logs.map(entry => <LogEntry key={entry.key} entry={entry}/>)}</div>}
        </section>
      </main>
      <DemoControl step={dashboard.step} totalSteps={dashboard.totalSteps} label={dashboard.stepLabel} onPrev={() => dashboard.goTo(dashboard.step-1)} onNext={() => dashboard.goTo(dashboard.step+1)}/>
      <OverrideModal bus={modalBus} onClose={() => setModalBus(null)} onConfirm={confirm}/>
    </div>
  );
}
