import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { C, SHADOW } from "../design/tokens";
import { CORRIDORS, DEMO_TIMING, INITIAL_WAITING, RELIEF_BUS, getBusInfo } from "../data/mockData";
import { useDemoSequence } from "../hooks/useDemoSequence";
import TopBar from "../components/TopBar";
import CapacityBar from "../components/CapacityBar";
import PeopleQueue from "../components/PeopleQueue";
import RouteTimeline from "../components/RouteTimeline";
import DispatchBanner from "../components/DispatchBanner";
import BoardingPrompt from "../components/BoardingPrompt";
import FullBusPrompt from "../components/FullBusPrompt";
import { debugLog } from "../utils/debug";

export default function ETA({ stop, atStop, corridor }) {
  const [userTapped, setUserTapped] = useState(false);
  const navigate = useNavigate();
  const bus = getBusInfo(corridor, stop.id);
  const scenario = corridor === "E" && stop.id === "kdse" ? "overflow" : "normal";
  const { eta, locationOverride, loadDelta, queueAdds, showArrivalPrompt, missedReported, showDispatch, showBoarding, boardedCount, startSequence, reportMissed, reportBoarded } = useDemoSequence(bus.etaMinutes, RELIEF_BUS.etaMinutes, scenario);
  const activeBus = missedReported ? RELIEF_BUS : bus;
  const boardingBus = missedReported ? RELIEF_BUS : bus;
  const total = INITIAL_WAITING + (userTapped ? 1 : 0) + queueAdds;
  const remaining = Math.max(0, total - boardedCount);
  const currentLoad = Math.min(activeBus.max, activeBus.load + loadDelta);
  const liveLoad = Math.min(activeBus.max, currentLoad + boardedCount);

  const tap = () => {
    if (!atStop || userTapped) {
      debugLog("demand", "Tap ignored", { atStop, userTapped });
      return;
    }
    debugLog("demand", "User joined queue", { bus: bus.id, stop: stop.id, corridor });
    setUserTapped(true);
    startSequence();
  };

  return (
    <main className="min-h-full" style={{ background: C.bg }}>
      <TopBar title={stop.name} sub={CORRIDORS[corridor]?.label} badge={atStop} onBack={() => navigate("/destination")} />
      <div className="space-y-3 p-3">
        <FullBusPrompt show={showArrivalPrompt} bus={bus} stop={stop} onBoarded={reportBoarded} onMissed={reportMissed} />
        <DispatchBanner show={showDispatch} busId={RELIEF_BUS.id} departureStop="KDOJ" newEta={DEMO_TIMING.dispatchEtaNew} oldEta={RELIEF_BUS.etaMinutes} totalWaiting={total} />
        <BoardingPrompt show={showBoarding} bus={boardingBus} stop={stop} />

        <section className="rounded-2xl border p-3" style={{ background: C.card, borderColor: C.border }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[9px] font-bold tracking-wider" style={{ color: C.textSec }}>NEXT BUS</p>
                <span className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-extrabold tracking-wider" style={{ background: C.successLight, color: C.success }}>
                  <span className="live-dot h-1.5 w-1.5 rounded-full" style={{ background: C.success }} />LIVE
                </span>
              </div>
              <h2 className="text-lg font-extrabold leading-tight" style={{ color: C.text }}>Bus {activeBus.id}</h2>
              <p className="mt-0.5 text-[10px]" style={{ color: C.textSec }}>
                {showBoarding ? `Boarding now at ${stop.name}` : locationOverride || activeBus.lastSeen}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <strong className="text-[30px] font-black leading-none transition-colors" style={{ color: missedReported && eta < RELIEF_BUS.etaMinutes ? C.success : C.primary }}>{showBoarding ? 0 : eta}</strong>
              <span className="ml-1 text-xs font-bold" style={{ color: C.textSec }}>min</span>
            </div>
          </div>
          <div className="mt-2.5"><CapacityBar load={showBoarding ? liveLoad : currentLoad} max={activeBus.max} /></div>
        </section>

        <PeopleQueue beforeUser={INITIAL_WAITING} afterUser={queueAdds} userTapped={userTapped} corridor={corridor} stopName={stop.name} boardedCount={boardedCount} />

        {userTapped ? (
          <div className="rounded-xl p-4" style={{ background: C.successLight, color: C.success }}>
            <strong className="text-sm">✓ {missedReported ? "Don’t worry, you’re still in the queue" : "You’re in the live queue"}</strong>
            <p className="mt-1 text-[11px]">{missedReported ? `ORBIT is checking the next best Bus ${corridor} option for you.` : `We’ll tell you when Bus ${bus.id} is close.`}</p>
          </div>
        ) : (
          <>
            <button disabled={!atStop} onClick={tap} className="w-full rounded-xl py-3.5 font-extrabold text-white disabled:cursor-not-allowed" style={{ background: atStop ? C.primary : C.border, color: atStop ? C.card : C.textMuted, boxShadow: atStop ? SHADOW.primary : "none" }}>
              {atStop ? "I'm waiting for this bus" : `🔒 Go to ${stop.name} to join the queue`}
            </button>
            <p className="px-3 text-center text-[10px]" style={{ color: C.textSec }}>
              {atStop ? "This adds you to the live queue and helps ORBIT respond to demand" : "You need to be at the stop before you can join its live queue."}
            </p>
          </>
        )}

        <RouteTimeline bus={activeBus} liveWaitingAtUserStop={remaining} />
      </div>
    </main>
  );
}
