import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { C, SHADOW } from "../design/tokens";
import { STOPS } from "../data/mockData";
import TopBar from "../components/TopBar";

export default function Home({ selectStop }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const filtered = useMemo(
    () => STOPS.filter(stop => `${stop.name} ${stop.full}`.toLowerCase().includes(query.toLowerCase())),
    [query]
  );
  const choose = (stop, atStop = false) => {
    selectStop(stop, atStop);
    navigate("/destination");
  };

  return (
    <main className="min-h-full" style={{ background: C.bg }}>
      <TopBar
        title="ORBIT"
        sub="UTM campus buses"
        action={
          <button onClick={() => navigate("/onboarding")} className="rounded-lg border border-white/30 px-2 py-1.5 text-[10px] font-bold">
            How it works
          </button>
        }
      />
      <div className="p-4">
        <h1 className="text-xl font-extrabold" style={{ color: C.text }}>Which bus stop are you at?</h1>
        <p className="mt-1 text-xs" style={{ color: C.textSec }}>Use your location or choose a stop below</p>

        <button onClick={() => navigate("/gps")} className="mt-4 w-full rounded-xl py-3.5 text-sm font-extrabold text-white" style={{ background: C.primary, boxShadow: SHADOW.primary }}>
          📍 Use my location
        </button>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-3" size={17} color={C.textMuted} />
          <input
            aria-label="Search stops"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search stops"
            className="w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none"
            style={{ background: C.card, borderColor: C.border, color: C.text }}
          />
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl border" style={{ background: C.card, borderColor: C.border }}>
          {filtered.map(stop => (
            <button key={stop.id} onClick={() => choose(stop)} className="grid w-full grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 border-b p-3 text-left last:border-0" style={{ borderColor: C.border }}>
              <span className="row-span-2 text-xl">🚏</span>
              <span className="min-w-0">
                <strong className="block text-sm" style={{ color: C.text }}>{stop.name}</strong>
                <span className="block break-words text-[11px]" style={{ color: C.textSec }}>{stop.full}</span>
              </span>
              <span className="flex min-w-0 flex-wrap gap-1">
                {stop.corridors.map(corridor => (
                  <i key={corridor} className="whitespace-nowrap rounded px-1.5 py-1 text-[9px] font-bold not-italic" style={{ background: C.bg, color: C.primary }}>
                    Bus {corridor}
                  </i>
                ))}
              </span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
