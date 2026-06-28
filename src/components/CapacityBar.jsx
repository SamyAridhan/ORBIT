import { C, capColor } from "../design/tokens";

export default function CapacityBar({ load, max }) {
  return <div>
    <div className="mb-1.5 flex justify-between text-[9px] font-bold tracking-wider" style={{ color:C.textSec }}><span>SEATS</span><span>{max-load} of {max} left</span></div>
    <div className="h-2 overflow-hidden rounded-full" style={{ background:C.border }}><div className="h-full rounded-full transition-all" style={{ width:`${Math.min(100, load/max*100)}%`, background:capColor(load,max) }}/></div>
  </div>;
}
