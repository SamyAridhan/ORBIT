import { AlertTriangle, Bus, Users } from "lucide-react";
import { C } from "../design/tokens";

export default function PriorityStrip({ step, stop }) {
  const assigned = step >= 7 && step <= 8;
  const arrived = step === 9;
  const high = stop.level === "HIGH";

  return (
    <section
      aria-label="Current operational priority"
      className="flex h-10 shrink-0 items-center gap-3 border-b px-5 text-sm"
      style={{background:arrived?C.successLight:high||assigned?C.orangeLight:C.card,borderColor:arrived?C.success:high||assigned?C.orange:C.border}}
    >
      {arrived?<Bus size={16} color={C.success}/>:high?<AlertTriangle size={16} color={C.orange}/>:<Users size={16} color={C.primary}/>} 
      <strong style={{color:arrived?C.success:high?C.orange:C.primary}}>{arrived?"E2 arrived":high?"High demand":"Highest demand"}</strong>
      <span className="h-4 w-px" style={{background:C.border}}/>
      <span className="font-bold" style={{color:C.text}}>KDOJ</span>
      {!arrived&&<span style={{color:C.textSec}}>{stop.queue} students waiting</span>}
      {assigned&&<span className="ml-auto rounded-full bg-white px-2.5 py-1 text-xs font-extrabold" style={{color:C.purple}}>Response assigned to E2</span>}
      {arrived&&<span style={{color:C.textSec}}>Boarding prompt sent to 16 students</span>}
    </section>
  );
}
