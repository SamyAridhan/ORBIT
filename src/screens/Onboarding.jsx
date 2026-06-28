import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { C, SHADOW } from "../design/tokens";
import { ONBOARDING } from "../data/mockData";

export default function Onboarding({ onComplete }) {
  const [index,setIndex]=useState(0), touch=useRef(0), navigate=useNavigate(), card=ONBOARDING[index];
  const complete=()=>{localStorage.setItem("orbit_visited","true");onComplete?.();navigate("/");};
  const next=()=>index===ONBOARDING.length-1?complete():setIndex(index+1);
  return <main className="grid min-h-[100dvh] grid-rows-[auto_minmax(0,1fr)_auto] px-6" style={{background:C.bg}} onTouchStart={e=>touch.current=e.touches[0].clientX} onTouchEnd={e=>{const d=e.changedTouches[0].clientX-touch.current;if(d<-45&&index<3)setIndex(index+1);if(d>45&&index>0)setIndex(index-1)}}>
    <div className="flex justify-end pb-2 pt-[calc(20px+env(safe-area-inset-top))]"><button onClick={complete} className="px-1 py-2 text-xs font-bold" style={{color:C.primary}}>Skip</button></div>
    <div className="flex min-h-0 flex-col items-center justify-center py-4 text-center"><div className="text-7xl">{card.emoji}</div><h1 className="mt-7 text-xl font-extrabold leading-snug" style={{color:C.text}}>{card.headline}</h1><p className={`mt-4 text-sm leading-relaxed ${card.italic?"italic":""}`} style={{color:C.textSec}}>{card.body}</p></div>
    <div className="pb-[calc(24px+env(safe-area-inset-bottom))] pt-3"><div className="mb-5 flex justify-center gap-2">{ONBOARDING.map((_,i)=><button key={i} aria-label={`Go to card ${i+1}`} onClick={()=>setIndex(i)} className="h-[7px] rounded-full transition-all" style={{width:i===index?20:7,background:i===index?C.primary:C.textMuted}}/>)}</div><button onClick={next} className="w-full rounded-xl py-3.5 font-extrabold text-white" style={{background:C.primary,boxShadow:SHADOW.primary}}>{index===3?"Get started →":"Next →"}</button></div>
  </main>;
}
