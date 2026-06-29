import { X } from "lucide-react";
import { C } from "../design/tokens";

export default function OverrideModal({bus,onClose,onConfirm}) {
  if(!bus) return null;
  return <div role="dialog" aria-modal="true" aria-label={`Change Bus ${bus.id} plan`} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60">
    <div className="w-[440px] rounded-2xl border p-6 shadow-2xl" style={{background:C.card,borderColor:C.border}}>
      <div className="flex items-start"><div><h2 className="text-xl font-black" style={{color:C.text}}>Change Bus {bus.id}'s plan?</h2><p className="mt-1 text-sm" style={{color:C.textSec}}>This will cancel the earlier departure and return the bus to its original schedule.</p></div><button aria-label="Close" onClick={onClose} className="ml-auto p-1" style={{color:C.textMuted}}><X/></button></div>
      <div className="mt-5 rounded-xl p-4 text-sm leading-relaxed" style={{background:C.accentLight,color:"#92400E"}}>Bus {bus.id} will stay on the Bus {bus.corridor} route. Only its departure time will change.</div>
      <div className="mt-5 flex justify-end gap-2"><button onClick={onClose} className="rounded-xl border px-5 py-3 text-sm font-bold" style={{borderColor:C.border,color:C.text}}>Keep current plan</button><button onClick={onConfirm} className="rounded-xl px-5 py-3 text-sm font-bold text-white" style={{background:C.red}}>Return to schedule</button></div>
    </div>
  </div>;
}
