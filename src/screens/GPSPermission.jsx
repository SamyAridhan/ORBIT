import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { C, SHADOW } from "../design/tokens";
import { GPS_DETECTION_DELAY, STOPS } from "../data/mockData";
import TopBar from "../components/TopBar";
import { debugLog } from "../utils/debug";

export default function GPSPermission({ selectStop }) {
  const [loading,setLoading]=useState(false),navigate=useNavigate();
  const allow=()=>{debugLog("gps","Simulated detection started",{delay:GPS_DETECTION_DELAY});setLoading(true);setTimeout(()=>{debugLog("gps","KDOJ detected");selectStop(STOPS.find(s=>s.id==="kdoj"),true);navigate("/destination")},GPS_DETECTION_DELAY)};
  return <main className="min-h-full" style={{background:C.bg}}><TopBar title="Find my stop" onBack={()=>navigate("/")}/><div className="flex flex-col items-center px-6 py-10 text-center"><div className="text-[56px]">📍</div><h1 className="mt-4 text-xl font-extrabold" style={{color:C.text}}>Use your location?</h1><p className="mt-3 text-sm leading-relaxed" style={{color:C.textSec}}>ORBIT uses your location once to find the closest bus stop. We do not save or share it.</p><div className="mt-6 rounded-xl p-4 text-left text-xs" style={{background:C.accentLight,color:C.text}}>📌 Prefer not to share it? You can choose your stop yourself.</div><button disabled={loading} onClick={allow} className="mt-7 w-full rounded-xl py-3.5 font-extrabold text-white" style={{background:C.primary,boxShadow:SHADOW.primary}}>{loading?"Finding your stop…":"Use my location"}</button><button disabled={loading} onClick={()=>navigate("/")} className="mt-3 w-full rounded-xl border py-3.5 text-sm font-bold" style={{background:C.bg,borderColor:C.border,color:C.text}}>Choose my stop instead</button></div></main>;
}
