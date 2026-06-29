import { AlertTriangle, Bus, Users } from "lucide-react";
import { C } from "../design/tokens";

export default function PriorityStrip({ step, stop, overflowTotal, overflowStopCount }) {
  const assigned = step >= 6 && step <= 8;
  const arrived = step === 9;
  const evaluating = step >= 2 && step <= 5;
  const high = stop.level === "HIGH";

  return (
    <section
      aria-label="Most important update"
      className="state-change flex h-10 shrink-0 items-center gap-3 border-b px-5 text-sm"
      style={{background:arrived?C.successLight:high||assigned?C.orangeLight:C.card,borderColor:arrived?C.success:high||assigned?C.orange:C.border}}
    >
      {arrived?<Bus size={16} color={C.success}/>:high||evaluating?<AlertTriangle size={16} color={C.orange}/>:<Users size={16} color={C.primary}/>} 
      <strong style={{color:arrived?C.success:high||evaluating?C.orange:C.primary}}>{arrived?"Bus E2 is here":evaluating?`${overflowTotal} students left behind`:high?"Busy stop":"Most people waiting"}</strong>
      <span className="h-4 w-px" style={{background:C.border}}/>
      {!evaluating&&<span className="font-bold" style={{color:C.text}}>{stop.name}</span>}
      {!arrived&&!evaluating&&<span style={{color:C.textSec}}>{stop.queue} students waiting</span>}
      {evaluating&&<span style={{color:C.textSec}}>Across {overflowStopCount} Bus E stops</span>}
      {assigned&&<span className="ml-auto rounded-full bg-white px-2.5 py-1 text-xs font-extrabold" style={{color:C.purple}}>Bus E2 assigned</span>}
      {arrived&&<span style={{color:C.textSec}}>All 18 students are on board · Nobody left waiting</span>}
    </section>
  );
}
