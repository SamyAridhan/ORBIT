import { ArrowLeft } from "lucide-react";
import { C } from "../design/tokens";

export default function TopBar({ title, sub, onBack, badge, action }) {
  return <header className="flex min-h-[76px] items-center gap-3 px-4 pb-3 pt-[calc(12px+env(safe-area-inset-top))] text-white" style={{ background:C.primary }}>
    {onBack && <button aria-label="Back" onClick={onBack} className="rounded-lg p-2" style={{ background:"rgba(255,255,255,.14)" }}><ArrowLeft size={18}/></button>}
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2"><h1 className="truncate text-lg font-extrabold">{title}</h1>{badge && <span className="rounded-md px-2 py-1 text-[9px] font-extrabold" style={{ background:C.success }}>📍 YOU'RE HERE</span>}</div>
      {sub && <p className="truncate text-[11px] text-white/60">{sub}</p>}
    </div>{action}
  </header>;
}
