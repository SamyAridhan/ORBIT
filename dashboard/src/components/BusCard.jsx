import { Gauge, MapPin, RotateCcw, TimerReset } from "lucide-react";
import { C, capacityColor } from "../design/tokens";
import { STATUS_CFG } from "../data/mockData";
import CapBar from "./CapBar";

export default function BusCard({ bus, onOverride }) {
  const cfg = STATUS_CFG[bus.status];
  const border = ["RECALCULATING","VERIFYING"].includes(bus.status) ? C.accent : bus.status === "READY" ? C.success : bus.status === "PASSING_FULL" ? C.red : C.border;
  const waitingToLeave = ["IDLE", "RECALCULATING", "VERIFYING", "READY"].includes(bus.status);

  return (
    <article
      aria-label={`Bus ${bus.id}`}
      className="rounded-xl border-2 p-2.5 transition-all duration-500"
      style={{ background: C.card, borderColor: border }}
    >
      <div className="flex items-center gap-2">
        <strong className="rounded-md px-2 py-1 text-sm text-white" style={{ background: C.primary }}>{bus.id}</strong>
        <span key={`${bus.status}-${bus.etaGain}`} className="state-change flex items-center gap-1 text-xs font-bold" style={{ color: cfg.color }}>
          <span className="h-2 w-2 rounded-full" style={{ background: cfg.color }}/>{cfg.label}
        </span>
        {bus.etaGain > 0 && <span key={bus.etaGain} className="state-change ml-auto rounded-full px-2 py-1 text-xs font-bold" title="Compared with the original schedule" style={{ background: C.successLight, color: C.success }}>{bus.etaGain} min earlier</span>}
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: C.textSec }}>
        <MapPin size={14}/><span key={bus.position} className="state-change truncate">{bus.position}</span>
        <span key={`${bus.status}-${bus.eta}`} className="state-change ml-auto flex items-center gap-1 font-bold" style={{ color: C.primary }}><TimerReset size={14}/>{waitingToLeave?`Leaves in ${bus.eta} min`:bus.eta===0?"At stop":`${bus.eta} min away`}</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Gauge size={14} color={capacityColor(bus.load,bus.max)}/>
        <CapBar load={bus.load} max={bus.max}/>
        <span key={bus.load} className="state-change text-xs font-bold" style={{ color: capacityColor(bus.load,bus.max) }}>{bus.load}/{bus.max}</span>
        {bus.status === "READY" && <button
          aria-label={`Undo ORBIT's change for Bus ${bus.id}`}
          title="Undo ORBIT's departure change"
          onClick={() => onOverride(bus)}
          className="ml-1 flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold text-white transition-opacity hover:opacity-85"
          style={{ borderColor: C.red, background: C.red }}
        >
          <RotateCcw size={12}/>Undo change
        </button>}
      </div>
    </article>
  );
}
