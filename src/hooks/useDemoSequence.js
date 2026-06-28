import { useCallback, useEffect, useRef, useState } from "react";
import { DEMO_TIMING } from "../data/mockData";
import { debugLog } from "../utils/debug";

export function useDemoSequence(initialEta) {
  const [eta,setEta]=useState(initialEta), [extraPeople,setExtraPeople]=useState(0), [showDispatch,setShowDispatch]=useState(false), [showBoarding,setShowBoarding]=useState(false), [started,setStarted]=useState(false);
  const timers=useRef([]);
  const startSequence=useCallback(()=>{debugLog("demo","Sequence started");setStarted(value=>value||true)},[]);
  useEffect(()=>{
    if(!started) return;
    timers.current=[
      setTimeout(()=>{debugLog("demo","Extra people joined",{count:DEMO_TIMING.extraPeopleCount});setExtraPeople(DEMO_TIMING.extraPeopleCount)},DEMO_TIMING.extraPeopleDelay),
      setTimeout(()=>{debugLog("demo","Dispatch activated",{eta:DEMO_TIMING.dispatchEtaNew});setShowDispatch(true);setEta(DEMO_TIMING.dispatchEtaNew);},DEMO_TIMING.dispatchDelay),
      setTimeout(()=>{debugLog("demo","Dispatch banner hidden");setShowDispatch(false)},DEMO_TIMING.dispatchHideDelay),
      setTimeout(()=>{debugLog("demo","Boarding prompt shown");setShowBoarding(true)},DEMO_TIMING.boardingDelay),
    ];
    return ()=>{debugLog("demo","Sequence timers cleaned up");timers.current.forEach(clearTimeout)};
  },[started]);
  return {eta,extraPeople,showDispatch,showBoarding,startSequence};
}
