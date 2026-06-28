import { C } from "../design/tokens";

export default function DispatchBanner({ show, newEta, oldEta, totalWaiting, busId }) {
  return <section aria-hidden={!show} className={`overflow-hidden rounded-2xl transition-all duration-[400ms] ${show?"max-h-64 translate-y-0 p-4 opacity-100":"pointer-events-none max-h-0 -translate-y-2 px-4 py-0 opacity-0"}`} style={{ background:C.primary }}>
    <h2 className="text-sm font-extrabold text-white">🚌 Bus coming sooner</h2><p className="mt-1 text-xs text-white/80">Bus {busId} is leaving <strong>{oldEta-newEta} minutes earlier</strong> than scheduled. You and {totalWaiting} others waiting here made that happen.</p>
    <div className="mt-3 flex items-end justify-between rounded-xl p-3" style={{ background:"rgba(255,255,255,.12)" }}><span className="text-[10px] font-bold uppercase tracking-wider text-white/60">Updated ETA</span><div><strong className="text-2xl text-white">{newEta} min</strong><span className="ml-2 text-xs text-white/60 line-through">was {oldEta}</span></div></div>
  </section>;
}
