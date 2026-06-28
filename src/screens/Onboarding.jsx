import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { C, SHADOW } from "../design/tokens";
import { ONBOARDING } from "../data/mockData";

export default function Onboarding({ onComplete }) {
  const [index,setIndex]=useState(0), touch=useRef(0), navigate=useNavigate(), card=ONBOARDING[index];
  useEffect(()=>{
    document.documentElement.classList.add("onboarding-active");
    document.body.classList.add("onboarding-active");
    return ()=>{
      document.documentElement.classList.remove("onboarding-active");
      document.body.classList.remove("onboarding-active");
    };
  },[]);
  const complete=()=>{localStorage.setItem("orbit_visited","true");onComplete?.();navigate("/");};
  const next=()=>index===ONBOARDING.length-1?complete():setIndex(index+1);
  return <main className="grid h-[100dvh] overflow-hidden grid-rows-[auto_minmax(0,1fr)_auto] px-6" style={{background:C.bg}} onTouchStart={e=>touch.current=e.touches[0].clientX} onTouchEnd={e=>{const d=e.changedTouches[0].clientX-touch.current;if(d<-45&&index<ONBOARDING.length-1)setIndex(index+1);if(d>45&&index>0)setIndex(index-1)}}>
    <div className="flex justify-end pb-1 pt-[calc(12px+env(safe-area-inset-top))]"><button onClick={complete} className="px-1 py-2 text-xs font-bold" style={{color:C.primary}}>Skip</button></div>
    <div className="flex min-h-0 flex-col items-center justify-center py-2 text-center"><div className="text-6xl">{card.emoji}</div><h1 className="mt-5 text-xl font-extrabold leading-snug" style={{color:C.text}}>{card.headline}</h1><p className={`mt-3 text-sm leading-relaxed ${card.italic?"italic":""}`} style={{color:C.textSec}}>{card.body}</p></div>
    <div className="pb-[calc(16px+env(safe-area-inset-bottom))] pt-2"><div className="mb-4 flex justify-center gap-2">{ONBOARDING.map((_,i)=><button key={i} aria-label={`Go to card ${i+1}`} onClick={()=>setIndex(i)} className="h-[7px] rounded-full transition-all" style={{width:i===index?20:7,background:i===index?C.primary:C.textMuted}}/>)}</div><button onClick={next} className="w-full rounded-xl py-3.5 font-extrabold text-white" style={{background:C.primary,boxShadow:SHADOW.primary}}>{index===ONBOARDING.length-1?"Get started →":"Next →"}</button></div>
  </main>;
}
