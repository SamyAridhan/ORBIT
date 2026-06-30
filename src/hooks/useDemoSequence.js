import { useCallback, useEffect, useRef, useState } from "react";
import { DEMO_TIMING } from "../data/mockData";
import { debugLog } from "../utils/debug";

const progressFor = scenario => scenario === "overflow"
  ? [
      { at: DEMO_TIMING.progressFirstDelay, eta: 5, location: "Leaving KDOJ", loadDelta: 4, servedStopIds: ["kdoj"] },
      { at: DEMO_TIMING.progressSecondDelay, eta: 2, location: "Approaching KDSE", loadDelta: 4, servedStopIds: ["kdoj"] },
    ]
  : [
      { at: DEMO_TIMING.progressFirstDelay, eta: 6, location: "Arrived at KLG", loadDelta: 4, servedStopIds: ["klg"] },
      { at: DEMO_TIMING.progressSecondDelay, eta: 3, location: "Leaving KLG for KDSE", loadDelta: 4, servedStopIds: ["klg"] },
    ];

const boardingTimersFrom = (startAt, label, setBoardedCount) =>
  DEMO_TIMING.boardingOffsets.map((offset, index) =>
    setTimeout(() => {
      const count = Math.min(DEMO_TIMING.boardingCount, index + 1);
      debugLog("demo", label, { count });
      setBoardedCount(count);
    }, startAt + offset)
  );

export function useDemoSequence(initialEta, reliefEta, scenario = "normal") {
  const [eta, setEta] = useState(initialEta);
  const [locationOverride, setLocationOverride] = useState(null);
  const [loadDelta, setLoadDelta] = useState(0);
  const [servedStopIds, setServedStopIds] = useState([]);
  const [queueAdds, setQueueAdds] = useState(0);
  const [showArrivalPrompt, setShowArrivalPrompt] = useState(false);
  const [missedReported, setMissedReported] = useState(false);
  const [showDispatch, setShowDispatch] = useState(false);
  const [showBoarding, setShowBoarding] = useState(false);
  const [boardedCount, setBoardedCount] = useState(0);
  const [started, setStarted] = useState(false);
  const [dispatchAcknowledged, setDispatchAcknowledged] = useState(false);
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
    setLocationOverride("Waiting at KDOJ for its updated departure");
    setLoadDelta(0);
    setServedStopIds([]);
    setDispatchAcknowledged(false);
  }, [isOverflowScenario, reliefEta]);

  const dismissDispatch = useCallback(() => {
    debugLog("demo", "Early departure message dismissed");
    setShowDispatch(false);
    setDispatchAcknowledged(true);
  }, []);

  const reportBoarded = useCallback(() => {
    debugLog("demo", "Boarded bus confirmed");
    setShowArrivalPrompt(false);
  }, []);

  useEffect(() => {
    if (!started || missedReported) return;
    const queueTimers = DEMO_TIMING.queueGrowthTimes.map((delay, index) =>
      setTimeout(() => {
        debugLog("demo", "Another student joined the queue", { count: index + 1 });
        setQueueAdds(index + 1);
      }, delay)
    );
    const progressTimers = progressFor(scenario).map(point =>
      setTimeout(() => {
        debugLog("demo", "Bus progress update", point);
        setEta(point.eta);
        setLocationOverride(point.location);
        setLoadDelta(point.loadDelta);
        setServedStopIds(point.servedStopIds);
      }, point.at)
    );
    const arrivalTimer = setTimeout(() => {
      debugLog("demo", isOverflowScenario ? "E1 arrived at KDSE" : "Bus arrived at stop");
      setEta(0);
      setLocationOverride(null);
      if (isOverflowScenario) setShowArrivalPrompt(true);
      else setShowBoarding(true);
    }, DEMO_TIMING.firstBusDelay);
    const boardingTimers = isOverflowScenario ? [] : boardingTimersFrom(DEMO_TIMING.firstBusDelay, "Students boarded bus", setBoardedCount);
    timers.current = [...queueTimers, ...progressTimers, arrivalTimer, ...boardingTimers];
    return () => timers.current.forEach(clearTimeout);
  }, [started, missedReported, isOverflowScenario, scenario]);

  useEffect(() => {
    if (!missedReported) return;
    const dispatchTimer = setTimeout(() => {
        debugLog("demo", "Early E2 departure approved");
        setShowDispatch(true);
        setEta(DEMO_TIMING.dispatchEtaNew);
        setLocationOverride("Leaving KDOJ earlier than scheduled");
      }, DEMO_TIMING.dispatchDelay);
    timers.current = [dispatchTimer];
    return () => timers.current.forEach(clearTimeout);
  }, [missedReported]);

  useEffect(() => {
    if (!dispatchAcknowledged) return;
    const boardingStart = DEMO_TIMING.postDispatchBoardingDelay;
    const arrivalTimer = setTimeout(() => {
      debugLog("demo", "E2 arrived at KDSE");
      setEta(0);
      setLocationOverride(null);
      setShowBoarding(true);
    }, boardingStart);
    const boardingTimers = boardingTimersFrom(boardingStart, "Students boarded E2", setBoardedCount);
    timers.current = [arrivalTimer, ...boardingTimers];
    return () => timers.current.forEach(clearTimeout);
  }, [dispatchAcknowledged]);

  return {
    eta,
    locationOverride,
    loadDelta,
    servedStopIds,
    queueAdds,
    showArrivalPrompt,
    missedReported,
    showDispatch,
    showBoarding,
    boardedCount,
    startSequence,
    reportMissed,
    reportBoarded,
    dismissDispatch,
  };
}
