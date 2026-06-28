import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import PhoneFrame from "./components/PhoneFrame";
import Onboarding from "./screens/Onboarding";
import Home from "./screens/Home";
import GPSPermission from "./screens/GPSPermission";
import Destination from "./screens/Destination";
import ETA from "./screens/ETA";
import ErrorBoundary from "./components/ErrorBoundary";
import { debugLog } from "./utils/debug";

export default function App() {
  const location=useLocation();
  const [hasVisited,setHasVisited]=useState(()=>Boolean(localStorage.getItem("orbit_visited")));
  const [selectedStop,setSelectedStop]=useState(null),[atStop,setAtStop]=useState(false),[selectedCorridor,setSelectedCorridor]=useState(null);
  useEffect(()=>{debugLog("router","Navigation",{path:location.pathname})},[location.pathname]);
  const selectStop=(stop,isAtStop)=>{debugLog("selection","Stop selected",{stop:stop.id,atStop:isAtStop});setSelectedStop(stop);setAtStop(isAtStop);setSelectedCorridor(null)};
  const selectCorridor=(corridor)=>{debugLog("selection","Corridor selected",{corridor,stop:selectedStop?.id});setSelectedCorridor(corridor)};
  const firstRoute=hasVisited?"/":"/onboarding";
  return <><PhoneFrame><ErrorBoundary key={location.key} scope={`route:${location.pathname}`}><Routes>
    <Route path="/" element={hasVisited?<Home selectStop={selectStop}/>:<Navigate to="/onboarding" replace/>}/>
    <Route path="/onboarding" element={<Onboarding onComplete={()=>setHasVisited(true)}/>}/>
    <Route path="/gps" element={<GPSPermission selectStop={selectStop}/>}/>
    <Route path="/destination" element={selectedStop?<Destination stop={selectedStop} atStop={atStop} selectCorridor={selectCorridor}/>:<Navigate to={firstRoute} replace/>}/>
    <Route path="/eta" element={selectedStop&&selectedCorridor?<ETA stop={selectedStop} atStop={atStop} corridor={selectedCorridor}/>:<Navigate to={firstRoute} replace/>}/>
    <Route path="*" element={<Navigate to={firstRoute} replace/>}/>
  </Routes></ErrorBoundary></PhoneFrame></>;
}
