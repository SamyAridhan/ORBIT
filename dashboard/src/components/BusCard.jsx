import { Gauge, MapPin, SlidersHorizontal, TimerReset } from "lucide-react";
import { C, capacityColor } from "../design/tokens";
import { STATUS_CFG } from "../data/mockData";
import CapBar from "./CapBar";

export default function BusCard({ bus, onOverride, focused = false, priorityStop = null }) {
  const cfg = STATUS_CFG[bus.status];
  const border = bus.status === "RECALCULATING" ? C.accent : focused ? C.primaryLight : C.border;

  return (
    <article
      aria-label={`Bus ${bus.id}`}
      aria-current={focused ? "step" : undefined}
      className={`rounded-xl border-2 transition-all ${focused ? "p-3 shadow-sm" : "p-2.5 opacity-80"}`}
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
        <span key={bus.eta} className="state-change ml-auto flex items-center gap-1 font-bold" style={{ color: C.primary }}><TimerReset size={14}/>{bus.eta === 0 ? "Arrived" : `${bus.eta} min`}</span>
      </div>
      {priorityStop && <div className="mt-2 rounded-md px-2 py-1 text-xs font-extrabold" style={{background:C.primaryDim,color:C.primary}}>Heading to busy stop · {priorityStop}</div>}
      <div className="mt-2 flex items-center gap-2">
        <Gauge size={14} color={capacityColor(bus.load,bus.max)}/>
        <CapBar load={bus.load} max={bus.max}/>
        <span key={bus.load} className="state-change text-xs font-bold" style={{ color: capacityColor(bus.load,bus.max) }}>{bus.load}/{bus.max}</span>
        <button
          aria-label={`Change the plan for Bus ${bus.id}`}
          title="Change this bus plan"
          onClick={() => onOverride(bus)}
          className="ml-1 flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold transition-colors hover:border-amber-500 hover:text-amber-600"
          style={{ borderColor: C.border, color: C.textSec }}
        >
          <SlidersHorizontal size={12}/>Change plan
        </button>
      </div>
    </article>
  );
}
