import { useCallback, useEffect, useRef, useState } from "react";
import { DEMO_TIMING } from "../data/mockData";
import { debugLog } from "../utils/debug";

export function useDemoSequence(initialEta, reliefEta, scenario = "normal") {
  const [eta, setEta] = useState(initialEta);
  const [showArrivalPrompt, setShowArrivalPrompt] = useState(false);
  const [missedReported, setMissedReported] = useState(false);
  const [showDispatch, setShowDispatch] = useState(false);
  const [showBoarding, setShowBoarding] = useState(false);
  const [boardedCount, setBoardedCount] = useState(0);
  const [started, setStarted] = useState(false);
  const timers = useRef([]);
  const isOverflowScenario = scenario === "overflow";

  const startSequence = useCallback(() => {
    debugLog("demo", "Waiting sequence started", { scenario });
    setStarted(true);
  }, [scenario]);

  const reportMissed = useCallback(() => {
    setShowArrivalPrompt(false);
    if (!isOverflowScenario) {
      debugLog("demo", "Bus missed in normal flow");
      return;
    }
    debugLog("demo", "Missed full bus reported");
    setMissedReported(true);
    setEta(reliefEta);
  }, [isOverflowScenario, reliefEta]);

  const reportBoarded = useCallback(() => {
    debugLog("demo", "Boarded bus confirmed");
    setShowArrivalPrompt(false);
  }, []);

  useEffect(() => {
    if (!started || missedReported) return;
    const timer = setTimeout(() => {
      debugLog("demo", isOverflowScenario ? "E1 arrived at KDSE" : "Bus arrived at stop");
      setEta(0);
      if (isOverflowScenario) setShowArrivalPrompt(true);
      else setShowBoarding(true);
    }, DEMO_TIMING.firstBusDelay);
    timers.current = [timer];
    return () => clearTimeout(timer);
  }, [started, missedReported, isOverflowScenario]);

  useEffect(() => {
    if (!missedReported) return;
    const boardingTimers = Array.from({ length: Math.ceil(DEMO_TIMING.boardingCount / DEMO_TIMING.boardingBatch) }, (_, index) =>
      setTimeout(() => {
        const count = Math.min(DEMO_TIMING.boardingCount, (index + 1) * DEMO_TIMING.boardingBatch);
        debugLog("demo", "Students boarded E2", { count });
        setBoardedCount(count);
      }, DEMO_TIMING.boardingDelay + ((index + 1) * DEMO_TIMING.boardingStagger))
    );
    timers.current = [
      ...boardingTimers,
      setTimeout(() => {
        debugLog("demo", "Early E2 departure approved");
        setShowDispatch(true);
        setEta(DEMO_TIMING.dispatchEtaNew);
      }, DEMO_TIMING.dispatchDelay),
      setTimeout(() => setShowDispatch(false), DEMO_TIMING.dispatchHideDelay),
      setTimeout(() => {
        debugLog("demo", "E2 arrived at KDSE");
        setShowBoarding(true);
      }, DEMO_TIMING.boardingDelay),
    ];
    return () => timers.current.forEach(clearTimeout);
  }, [missedReported]);

  return { eta, showArrivalPrompt, missedReported, showDispatch, showBoarding, boardedCount, startSequence, reportMissed, reportBoarded };
}
