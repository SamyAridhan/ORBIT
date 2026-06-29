import { C } from "../design/tokens";

export default function FullBusPrompt({show,onMissed}) {
  if(!show) return null;
  return <section className="rounded-2xl border-2 p-4 text-center" style={{background:C.card,borderColor:C.red}}>
    <div className="text-3xl">🚌</div>
    <h2 className="mt-1 text-sm font-extrabold" style={{color:C.text}}>Bus E1 reached KDSE full</h2>
    <p className="mt-1 text-xs" style={{color:C.textSec}}>It left KDOJ full at 7:40 and could not pick you up at KDSE.</p>
    <button onClick={onMissed} className="mt-3 w-full rounded-xl py-3 text-sm font-extrabold text-white" style={{background:C.primary}}>I missed this bus</button>
    <p className="mt-2 text-[10px]" style={{color:C.textMuted}}>Your report keeps you in the queue and helps ORBIT respond.</p>
  </section>;
}
