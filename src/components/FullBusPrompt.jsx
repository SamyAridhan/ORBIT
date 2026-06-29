import { useState } from "react";
import { C } from "../design/tokens";

export default function FullBusPrompt({ show, bus, stop, onBoarded, onMissed }) {
  const [answer, setAnswer] = useState(null);
  if (!show) return null;

  const respond = value => {
    setAnswer(value);
    value === "boarded" ? onBoarded?.() : onMissed?.();
  };

  return (
    <section className="rounded-2xl border-2 p-4 text-center" style={{ background: C.card, borderColor: C.primaryLight }}>
      <div className="text-3xl">🚌</div>
      <h2 className="mt-1 text-sm font-extrabold" style={{ color: C.text }}>Bus {bus.id} just arrived at {stop.name}</h2>
      <p className="mt-1 text-xs" style={{ color: C.textSec }}>Did you get on?</p>
      {!answer ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={() => respond("boarded")} className="rounded-xl px-2 py-3 text-[11px] font-extrabold text-white" style={{ background: C.primary }}>Yes, I got on</button>
          <button onClick={() => respond("missed")} className="rounded-xl border px-2 py-3 text-[11px] font-extrabold" style={{ background: C.bg, borderColor: C.border, color: C.text }}>No, I missed it</button>
        </div>
      ) : (
        <p className="mt-4 text-sm font-extrabold" style={{ color: answer === "boarded" ? C.success : C.primary }}>
          {answer === "boarded" ? "Great, you’re on board. Have a safe trip." : "No worries — we’ll keep you in the queue and look for the next best bus."}
        </p>
      )}
      {!answer && <p className="mt-2 text-[10px]" style={{ color: C.textMuted }}>Your reply helps keep the live queue correct.</p>}
    </section>
  );
}
