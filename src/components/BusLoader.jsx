import { useEffect, useRef, useState } from "react";
import lottieModule from "lottie-web/build/player/lottie_light.js";
import busLoaderAnimation from "../../assets/Busloader.json";
import { C } from "../design/tokens";
import { debugError, debugLog } from "../utils/debug";

export default function BusLoader({ size=44, className="" }) {
  const containerRef=useRef(null);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{
    if(!containerRef.current) return undefined;
    let player;
    try {
      const lottie=lottieModule?.default || lottieModule;
      player=lottie.loadAnimation({
        container:containerRef.current,
        renderer:"svg",
        loop:true,
        autoplay:true,
        animationData:JSON.parse(JSON.stringify(busLoaderAnimation)),
        rendererSettings:{preserveAspectRatio:"xMidYMid meet"},
      });
      player.setSpeed(2);
      const ready=()=>debugLog("lottie","Bus animation ready",{size});
      const failedData=()=>{debugError("lottie",new Error("Animation data failed"),{size});setFailed(true)};
      player.addEventListener("DOMLoaded",ready);
      player.addEventListener("data_failed",failedData);
      return ()=>{
        player.removeEventListener("DOMLoaded",ready);
        player.removeEventListener("data_failed",failedData);
        player.destroy();
      };
    } catch(error) {
      debugError("lottie",error,{size});
      setFailed(true);
      return ()=>player?.destroy();
    }
  },[size]);
  if(failed) return <div aria-label="Bus animation unavailable" className={`flex shrink-0 items-center justify-center rounded-lg text-xs font-black ${className}`} role="img" style={{width:size,height:size,background:C.primary,color:C.card}}>BUS</div>;
  return <div
    aria-label="Animated bus"
    className={`shrink-0 overflow-hidden ${className}`}
    role="img"
    style={{ width:size, height:size }}
  >
    <div ref={containerRef} className="h-full w-full"/>
  </div>;
}
