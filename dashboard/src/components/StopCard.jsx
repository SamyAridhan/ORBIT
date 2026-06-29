import { LockKeyhole } from "lucide-react";
import { C } from "../design/tokens";
import { DEMAND_CFG } from "../data/mockData";

export default function StopCard({stop}) {
  const cfg=DEMAND_CFG[stop.level];
  const semantic=stop.level==="CRITICAL"?C.red:stop.level==="HIGH"?C.orange:C.border;
  return <article aria-label={`Stop ${stop.name}`} className="rounded-xl border-2 p-3 transition-all duration-500" style={{background:C.card,borderColor:semantic}}>
    <div className="flex items-center gap-2">
      <h3 className="text-base font-extrabold" style={{color:C.text}}>{stop.name}</h3>
      <span className="rounded-md px-2 py-0.5 text-xs font-bold" style={{background:C.border,color:C.textSec}}>Bus {stop.corridor}</span>
      {stop.claimedBy&&<span className="ml-auto flex items-center gap-1 text-xs font-bold" style={{color:C.purple}}><LockKeyhole size={15}/>Bus {stop.claimedBy} assigned</span>}
    </div>
    <div className="mt-2 flex items-baseline gap-2">
      <strong key={stop.queue} className="state-change text-4xl font-black leading-none" style={{color:stop.level==="HIGH"?C.orange:stop.level==="CRITICAL"?C.red:C.text}}>{stop.queue}</strong>
      <p className="text-sm font-semibold" style={{color:C.textSec}}>people waiting</p>
    </div>
    <span key={stop.level} className="state-change mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-extrabold" style={{background:cfg.bg,color:cfg.text}}><span className={`h-2 w-2 rounded-full ${stop.level==="CRITICAL"?"critical-pulse":""}`} style={{background:cfg.color}}/>{cfg.label}</span>
    <p className="mt-2 text-xs" style={{color:C.textMuted}}>{stop.busHere?"A bus is here now":stop.lastBus===0?"A bus just served this stop":`Last bus was ${stop.lastBus} min ago`}</p>
  </article>;
}
