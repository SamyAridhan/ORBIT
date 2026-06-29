import {C,capacityColor} from "../design/tokens";
export default function CapBar({load,max}){return <div className="h-2 flex-1 overflow-hidden rounded-full" style={{background:C.border}}><div className="h-full rounded-full transition-all duration-300" style={{background:capacityColor(load,max),width:`${Math.min(100,load/max*100)}%`}}/></div>}
