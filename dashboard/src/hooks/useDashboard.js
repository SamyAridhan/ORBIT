import {useCallback,useMemo,useState} from "react";
import {deriveState,STEPS} from "../data/mockData";

export function useDashboard(){
  const [step,setStep]=useState(0),[override,setOverride]=useState(null);
  const canonical=useMemo(()=>deriveState(step),[step]);
  const state=useMemo(()=>{
    if(!override)return canonical;
    return {...canonical,buses:canonical.buses.map(bus=>bus.id===override?{...bus,status:"COMMUTING",etaGain:0}:bus),logs:[{type:"REJECT",agent:"Fleet manager",event:"BUS_RETURNED_TO_SCHEDULE",desc:`Bus ${override} returned to its original schedule`,chips:[],key:`override-${override}`,step},...canonical.logs]};
  },[canonical,override,step]);
  const goTo=useCallback(target=>{setStep(Math.max(0,Math.min(STEPS.length-1,target)));setOverride(null)},[]);
  return {...state,step,totalSteps:STEPS.length,stepLabel:STEPS[step].label,goTo,applyOverride:setOverride};
}
