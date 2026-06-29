import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";
import { C } from "../design/tokens";

export default function DemoControl({ step, totalSteps, label, onPrev, onNext }) {
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "ArrowLeft") onPrev();
      if (event.key === "ArrowRight") onNext();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onPrev, onNext]);

  return (
    <div
      className="fixed bottom-2 right-2 z-40 flex items-center gap-0.5 rounded-md border bg-white/90 p-0.5 shadow-sm backdrop-blur"
      style={{ borderColor: C.border }}
    >
      <button
        aria-label="Previous step"
        disabled={step === 0}
        onClick={onPrev}
        className="flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-20"
      >
        <ChevronLeft size={13} strokeWidth={2} />
      </button>
      <div className="flex max-w-64 items-center gap-1.5 px-1">
        <span className="shrink-0 text-[9px] font-semibold tabular-nums text-slate-400">
          {step}/{totalSteps - 1}
        </span>
        <span key={label} className="state-change truncate text-[10px] font-medium text-slate-500">
          {label}
        </span>
      </div>
      <button
        aria-label="Next step"
        disabled={step === totalSteps - 1}
        onClick={onNext}
        className="flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-20"
      >
        <ChevronRight size={13} strokeWidth={2} />
      </button>
    </div>
  );
}
