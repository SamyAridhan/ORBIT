import { useCallback, useEffect, useRef, useState } from "react";
import { DEMO_TIMING } from "../data/mockData";
import { debugLog } from "../utils/debug";

export function useDemoSequence(initialEta) {
  const [eta,setEta]=useState(initialEta), [extraPeople,setExtraPeople]=useState(0), [showDispatch,setShowDispatch]=useState(false), [showBoarding,setShowBoarding]=useState(false), [boardedCount,setBoardedCount]=useState(0), [started,setStarted]=useState(false);
  const timers=useRef([]);
  const startSequence=useCallback(()=>{debugLog("demo","Sequence started");setStarted(value=>value||true)},[]);
  useEffect(()=>{
    if(!started) return;
    const arrivalTimers=Array.from({length:DEMO_TIMING.extraPeopleCount},(_,index)=>
      setTimeout(()=>{const count=index+1;debugLog("demo","Person joined queue",{count});setExtraPeople(count)},DEMO_TIMING.extraPeopleDelay+(index*DEMO_TIMING.extraPeopleStagger))
    );
    const boardingTimers=Array.from({length:Math.ceil(DEMO_TIMING.boardingCount/DEMO_TIMING.boardingBatch)},(_,index)=>
      setTimeout(()=>{const count=Math.min(DEMO_TIMING.boardingCount,(index+1)*DEMO_TIMING.boardingBatch);debugLog("demo","Students boarded",{count});setBoardedCount(count)},DEMO_TIMING.boardingDelay+((index+1)*DEMO_TIMING.boardingStagger))
    );
    timers.current=[
      ...arrivalTimers,
      ...boardingTimers,
      setTimeout(()=>{debugLog("demo","Dispatch activated",{eta:DEMO_TIMING.dispatchEtaNew});setShowDispatch(true);setEta(DEMO_TIMING.dispatchEtaNew);},DEMO_TIMING.dispatchDelay),
      setTimeout(()=>{debugLog("demo","Dispatch banner hidden");setShowDispatch(false)},DEMO_TIMING.dispatchHideDelay),
      setTimeout(()=>{debugLog("demo","Boarding prompt shown");setShowBoarding(true)},DEMO_TIMING.boardingDelay),
    ];
    return ()=>{debugLog("demo","Sequence timers cleaned up");timers.current.forEach(clearTimeout)};
  },[started]);
  return {eta,extraPeople,showDispatch,showBoarding,boardedCount,startSequence};
}
