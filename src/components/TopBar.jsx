import { ArrowLeft } from "lucide-react";
import { C } from "../design/tokens";
import orbitLogo from "../../assets/ORBIT_logo.png";

export default function TopBar({ title, sub, onBack, badge, action }) {
  const showLogo = !onBack && title === "ORBIT";

  return (
    <header className="flex min-h-[86px] items-center gap-3 px-4 pb-4 pt-[calc(14px+env(safe-area-inset-top))] text-white" style={{ background: C.primary }}>
      {onBack && (
        <button aria-label="Back" onClick={onBack} className="rounded-lg p-2" style={{ background: "rgba(255,255,255,.14)" }}>
          <ArrowLeft size={18} />
        </button>
      )}
      {showLogo && (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white p-0.5 shadow-sm">
          <img src={orbitLogo} alt="" className="h-full w-full object-contain" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="truncate text-lg font-extrabold">{title}</h1>
          {badge && <span className="rounded-md px-2 py-1 text-[9px] font-extrabold" style={{ background: C.success }}>AT THIS STOP</span>}
        </div>
        {sub && <p className="truncate text-[11px] text-white/60">{sub}</p>}
      </div>
      {action}
    </header>
  );
}
