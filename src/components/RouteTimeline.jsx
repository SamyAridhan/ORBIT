import { C } from "../design/tokens";
import CapacityBar from "./CapacityBar";
import BusLoader from "./BusLoader";

export default function RouteTimeline({ bus, liveWaitingAtUserStop }) {
  let running=bus.load;
  const stops=bus.routeToUser.map(stop=>{ if(!stop.isUserStop) running=Math.min(bus.max,running+stop.waiting); return {...stop,running}; });
  const seats=bus.max-running;
  const forecast=seats<=0?"⚠️ Bus may be full by the time it reaches you":seats<=3?`⚠️ Only ~${seats} seat${seats===1?"":"s"} left for you`:`✓ ~${seats} seats expected for you`;
  return <section className="rounded-2xl border p-4" style={{ background:C.card, borderColor:C.border }}>
    <div className="mb-4 rounded-xl p-3" style={{ background:C.bg }}><div className="mb-3 flex items-center gap-3"><BusLoader size={69}/><div><h2 className="text-sm font-extrabold" style={{ color:C.text }}>Bus {bus.id}</h2><p className="text-[11px]" style={{ color:C.textSec }}>Last seen: {bus.lastSeen}</p></div></div><CapacityBar load={bus.load} max={bus.max}/></div>
    <div className="ml-3">
      {stops.map((stop)=><div key={stop.id} className={`relative border-l-2 pb-5 pl-6 last:pb-1`} style={{ borderColor:stop.isUserStop?C.primaryLight:C.border }}>
        <span className={`absolute rounded-full ${stop.isUserStop?"-left-[8px] top-0 h-[14px] w-[14px] border-[3px]":"-left-[5px] top-1 h-2 w-2"}`} style={{ background:stop.isUserStop?C.primaryLight:C.textMuted, borderColor:C.card }}/>
        <div className={stop.isUserStop?"rounded-xl p-3":""} style={stop.isUserStop?{ background:C.bg }:undefined}>
          <p className="text-xs font-extrabold" style={{ color:C.text }}>{stop.name}{stop.isUserStop?" — Your stop":` · ${stop.waiting} boarding here`}</p>
          {stop.isUserStop?<><p className="mt-1 text-[11px]" style={{ color:C.textSec }}>{liveWaitingAtUserStop} people waiting here</p><p className="mt-1 text-[11px] font-bold" style={{ color:seats<=3?C.red:C.success }}>{forecast}</p></>:<p className="mt-1 text-[11px]" style={{ color:stop.running/bus.max>=.85?C.red:C.textSec }}>→ {stop.running}/{bus.max} after this stop</p>}
        </div>
      </div>)}
    </div>
  </section>;
}
