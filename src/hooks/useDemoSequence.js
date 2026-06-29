import { useCallback, useEffect, useRef, useState } from "react";
import { DEMO_TIMING } from "../data/mockData";
import { debugLog } from "../utils/debug";

export function useDemoSequence(initialEta, reliefEta) {
  const [eta,setEta]=useState(initialEta);
  const [showFullBus,setShowFullBus]=useState(false);
  const [missedReported,setMissedReported]=useState(false);
  const [showDispatch,setShowDispatch]=useState(false);
  const [showBoarding,setShowBoarding]=useState(false);
  const [boardedCount,setBoardedCount]=useState(0);
  const [started,setStarted]=useState(false);
  const timers=useRef([]);

  const startSequence=useCallback(()=>{debugLog("demo","Waiting sequence started");setStarted(true)},[]);
  const reportMissed=useCallback(()=>{debugLog("demo","Missed full bus reported");setShowFullBus(false);setMissedReported(true);setEta(reliefEta)},[reliefEta]);

  useEffect(()=>{
    if(!started||missedReported) return;
    const timer=setTimeout(()=>{debugLog("demo","E1 arrived full");setShowFullBus(true);setEta(0)},DEMO_TIMING.firstBusDelay);
    timers.current=[timer];
    return()=>clearTimeout(timer);
  },[started,missedReported]);

  useEffect(()=>{
    if(!missedReported) return;
    const boardingTimers=Array.from({length:Math.ceil(DEMO_TIMING.boardingCount/DEMO_TIMING.boardingBatch)},(_,index)=>
      setTimeout(()=>{const count=Math.min(DEMO_TIMING.boardingCount,(index+1)*DEMO_TIMING.boardingBatch);debugLog("demo","Students boarded E2",{count});setBoardedCount(count)},DEMO_TIMING.boardingDelay+((index+1)*DEMO_TIMING.boardingStagger))
    );
    timers.current=[
      ...boardingTimers,
      setTimeout(()=>{debugLog("demo","Early E2 departure approved");setShowDispatch(true);setEta(DEMO_TIMING.dispatchEtaNew)},DEMO_TIMING.dispatchDelay),
      setTimeout(()=>setShowDispatch(false),DEMO_TIMING.dispatchHideDelay),
      setTimeout(()=>{debugLog("demo","E2 arrived at KDSE");setShowBoarding(true)},DEMO_TIMING.boardingDelay),
    ];
    return()=>timers.current.forEach(clearTimeout);
  },[missedReported]);

  return {eta,showFullBus,missedReported,showDispatch,showBoarding,boardedCount,startSequence,reportMissed};
}
