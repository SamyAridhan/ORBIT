import { useNavigate } from "react-router-dom";
import { C } from "../design/tokens";
import { CORRIDORS } from "../data/mockData";
import TopBar from "../components/TopBar";

export default function Destination({ stop, atStop, selectCorridor }) {
  const navigate=useNavigate();
  return <main className="min-h-full" style={{background:C.bg}}><TopBar title={stop.name} sub={stop.full} badge={atStop} onBack={()=>navigate("/")}/><div className="p-4"><h1 className="text-xl font-extrabold" style={{color:C.text}}>Where are you going?</h1><p className="mt-1 text-xs" style={{color:C.textSec}}>Choose the bus that goes to your destination</p><div className="mt-4 space-y-3">{stop.corridors.filter(key=>CORRIDORS[key]).map(key=>{const corridor=CORRIDORS[key];return <button key={key} onClick={()=>{selectCorridor(key);navigate("/eta")}} className="flex w-full items-center gap-3 rounded-2xl border p-4 text-left shadow-sm" style={{background:C.card,borderColor:C.border}}><span className="text-2xl">🚌</span><span className="flex-1"><strong className="block text-sm" style={{color:C.text}}>{corridor.label}</strong><span className="text-[11px]" style={{color:C.textSec}}>{corridor.sub}</span></span><span className="rounded-lg px-2 py-1.5 text-[10px] font-extrabold" style={{background:`${corridor.color}20`,color:corridor.color}}>Bus {key}</span></button>})}</div>{!atStop&&<div className="mt-5 rounded-xl p-4 text-xs leading-relaxed" style={{background:C.accentLight,color:C.text}}>You can check bus times from anywhere. To join the live queue, you need to be at {stop.name}.</div>}</div></main>;
}
