import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { C, SHADOW } from "../design/tokens";
import { CORRIDORS, DEMO_TIMING, INITIAL_WAITING, getBusInfo } from "../data/mockData";
import { useDemoSequence } from "../hooks/useDemoSequence";
import TopBar from "../components/TopBar";
import CapacityBar from "../components/CapacityBar";
import PeopleQueue from "../components/PeopleQueue";
import RouteTimeline from "../components/RouteTimeline";
import DispatchBanner from "../components/DispatchBanner";
import BoardingPrompt from "../components/BoardingPrompt";
import { debugLog } from "../utils/debug";

export default function ETA({ stop, atStop, corridor }) {
  const [userTapped,setUserTapped]=useState(false),navigate=useNavigate();
  const bus=getBusInfo(corridor,stop.id);
  const {eta,extraPeople,showDispatch,showBoarding,startSequence}=useDemoSequence(bus.etaMinutes);
  const total=INITIAL_WAITING+(userTapped?1:0)+extraPeople;
  const tap=()=>{if(!atStop||userTapped){debugLog("demand","Tap ignored",{atStop,userTapped});return}debugLog("demand","User joined queue",{bus:bus.id,stop:stop.id,corridor});setUserTapped(true);startSequence()};
  return <main className="min-h-full" style={{background:C.bg}}><TopBar title={stop.name} sub={CORRIDORS[corridor]?.label} badge={atStop} onBack={()=>navigate("/destination")}/><div className="space-y-3 p-3">
    <DispatchBanner show={showDispatch} busId={bus.id} newEta={DEMO_TIMING.dispatchEtaNew} oldEta={bus.etaMinutes} totalWaiting={total}/><BoardingPrompt show={showBoarding} bus={bus} stop={stop}/>
    <section className="rounded-2xl border p-3" style={{background:C.card,borderColor:C.border}}><div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-bold tracking-wider" style={{color:C.textSec}}>NEXT BUS</p><h2 className="text-lg font-extrabold leading-tight" style={{color:C.text}}>Bus {bus.id}</h2><p className="mt-0.5 text-[10px]" style={{color:C.textSec}}>Last seen at {bus.lastSeen}</p></div><div className="shrink-0 text-right"><strong className="text-[30px] font-black leading-none transition-colors" style={{color:eta<bus.etaMinutes?C.success:C.primary}}>{eta}</strong><span className="ml-1 text-xs font-bold" style={{color:C.textSec}}>min</span></div></div><div className="mt-2.5"><CapacityBar load={bus.load} max={bus.max}/></div></section>
    <PeopleQueue beforeUser={INITIAL_WAITING} afterUser={extraPeople} userTapped={userTapped} corridor={corridor} stopName={stop.name}/>
    {!atStop&&<div className="rounded-xl p-3 text-xs" style={{background:C.accentLight,color:C.text}}>You're viewing live info. When you arrive at {stop.name}, the system can count you too.</div>}
    {userTapped?<div className="rounded-xl p-4" style={{background:C.successLight,color:C.success}}><strong className="text-sm">✓ You're counted — position {INITIAL_WAITING+1} in queue</strong><p className="mt-1 text-[11px]">We'll notify you when Bus {bus.id} is close</p></div>:<><button disabled={!atStop} onClick={tap} className="w-full rounded-xl py-3.5 font-extrabold text-white disabled:cursor-not-allowed" style={{background:atStop?C.primary:C.border,color:atStop?C.card:C.textMuted,boxShadow:atStop?SHADOW.primary:"none"}}>I'm waiting here</button><p className="px-3 text-center text-[10px]" style={{color:C.textSec}}>{atStop?"Lets the system know — helps bring the bus sooner when enough of us are waiting":`Available when you arrive at ${stop.name}`}</p></>}
    <RouteTimeline bus={bus} liveWaitingAtUserStop={total}/>
  </div></main>;
}
