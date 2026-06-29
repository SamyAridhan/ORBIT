import {C} from "../design/tokens";

export const INIT_BUSES=[
  {id:"E1",corridor:"E",status:"COMMUTING",position:"KDSE → KLG",load:18,max:28,eta:31,etaGain:0},
  {id:"E2",corridor:"E",status:"IDLE",position:"KDOJ",load:0,max:28,eta:14,etaGain:0},
  {id:"B1",corridor:"B",status:"COMMUTING",position:"K9/10 → Cluster",load:22,max:28,eta:9,etaGain:0},
  {id:"B2",corridor:"B",status:"IDLE",position:"KP",load:0,max:28,eta:26,etaGain:0},
  {id:"B3",corridor:"B",status:"COMMUTING",position:"KP → K9/10",load:12,max:28,eta:17,etaGain:0},
  {id:"F1",corridor:"F",status:"COMMUTING",position:"KTHO → KTDI",load:9,max:28,eta:12,etaGain:0},
];
export const INIT_STOPS=[
  {id:"kdse_e",name:"KDSE",corridor:"E",queue:11,level:"MEDIUM",claimedBy:null,lastBus:18},
  {id:"kdoj_e",name:"KDOJ",corridor:"E",queue:5,level:"MEDIUM",claimedBy:null,lastBus:9},
  {id:"klg_e",name:"KLG",corridor:"E",queue:4,level:"LOW",claimedBy:null,lastBus:6},
  {id:"kp_b",name:"KP",corridor:"B",queue:6,level:"MEDIUM",claimedBy:null,lastBus:12},
  {id:"k910_b",name:"K9/10",corridor:"B",queue:2,level:"LOW",claimedBy:null,lastBus:3},
  {id:"ktr_f",name:"KTR",corridor:"F",queue:5,level:"MEDIUM",claimedBy:null,lastBus:9},
];
const log=(type,agent,event,desc,chips=[])=>({type,agent,event,desc,chips});
export const STEPS=[
  {label:"Buses are running normally",busPatch:{},stopPatch:{},logs:[]},
  {label:"KDSE queue rises to 12",busPatch:{},stopPatch:{kdse_e:{queue:12}},logs:[]},
  {label:"KDSE queue reaches 16 students",busPatch:{},stopPatch:{kdse_e:{queue:16,level:"HIGH"}},logs:[log("SIGNAL","KDSE stop","MORE_STUDENTS_WAITING","The KDSE queue grew to 16 students · The stop is now busy")]},
  {label:"KDSE reports a busy queue",busPatch:{},stopPatch:{},logs:[log("BROADCAST","KDSE stop","BUSY_STOP_REPORTED","KDSE told the Bus E services that 16 students are waiting")]},
  {label:"Bus E2 checks if it can leave early",busPatch:{E2:{status:"RECALCULATING"}},stopPatch:{},logs:[log("EVAL","Bus E2","CHECKING_EARLIER_DEPARTURE","E2 is waiting at KDOJ · The system checks whether it can leave early")]},
  {label:"All safety checks pass",busPatch:{},stopPatch:{},logs:[log("EVAL","Bus E2","SAFETY_CHECKS_PASSED","Bus E2 can leave early safely and help the KDSE queue",["SAME ROUTE ✓","28 SEATS FREE ✓","SAFE TIME ✓","NO BUS ASSIGNED ✓","22-MINUTE GAP ✓","WORTH SENDING ✓"])]},
  {label:"Bus E2 is assigned to KDSE",busPatch:{},stopPatch:{kdse_e:{claimedBy:"E2"}},logs:[log("CLAIM","Bus E2","BUS_ASSIGNED_TO_KDSE","Bus E2 is now responsible for picking up the KDSE queue")]},
  {label:"Bus E2 leaves 7 minutes early",busPatch:{E2:{status:"COMMUTING",position:"KDOJ → KDSE",load:5,eta:7,etaGain:7}},stopPatch:{kdoj_e:{queue:0,lastBus:0}},logs:[log("ACCEPT","Bus E2","EARLIER_DEPARTURE_APPROVED","E2 picked up 5 students at KDOJ and left 7 minutes early · KDSE arrival changed from 14 minutes to 7 minutes")]},
  {label:"Bus E1 avoids a duplicate response",busPatch:{},stopPatch:{},logs:[log("SUPPRESSED","Bus E1","EXTRA_RESPONSE_AVOIDED","Bus E2 is already handling KDSE · Bus E1 continues its normal trip")]},
  {label:"Bus E2 picks up all 16 students",busPatch:{E2:{status:"BOARDING",position:"KDSE",load:21,eta:0,etaGain:7}},stopPatch:{kdse_e:{queue:0,level:"LOW",claimedBy:null,lastBus:0}},logs:[log("BOARD","Bus E2","STUDENTS_PICKED_UP","E2 picked up 5 students at KDOJ and all 16 at KDSE · 21 of 28 seats are now used · Nobody is left waiting at KDSE")]},
];
export const STATUS_CFG={IDLE:{color:C.textMuted,label:"WAITING TO LEAVE"},COMMUTING:{color:C.primary,label:"ON THE WAY"},BOARDING:{color:C.success,label:"BOARDING NOW"},RECALCULATING:{color:C.accent,label:"CHECKING OPTIONS"}};
export const DEMAND_CFG={LOW:{color:C.textMuted,bg:"#F8FAFC",text:C.textSec,label:"QUIET"},MEDIUM:{color:C.accent,bg:C.accentLight,text:"#92400E",label:"GETTING BUSY"},HIGH:{color:C.orange,bg:C.orangeLight,text:"#9A3412",label:"BUSY"},CRITICAL:{color:C.red,bg:C.redLight,text:"#991B1B",label:"VERY BUSY"}};
export const LOG_CFG={SIGNAL:{border:C.primaryLight,bg:"#EFF6FF",icon:"●"},BROADCAST:{border:C.primary,bg:"#EFF6FF",icon:"◉"},EVAL:{border:C.accent,bg:C.accentLight,icon:"⚙"},ACCEPT:{border:C.success,bg:C.successLight,icon:"✓"},CLAIM:{border:C.purple,bg:C.purpleLight,icon:"◆"},SUPPRESSED:{border:C.accent,bg:C.accentLight,icon:"⊘"},REJECT:{border:C.textMuted,bg:"#F8FAFC",icon:"×"},BOARD:{border:C.success,bg:C.successLight,icon:"✓"}};

export const SCENARIO_TIMES=["09:41:07","09:41:10","09:41:13","09:41:16","09:41:19","09:41:22","09:41:25","09:41:28","09:41:31","09:41:34"];

export function deriveState(targetStep){
  let buses=INIT_BUSES.map(bus=>({...bus}));
  let stops=INIT_STOPS.map(stop=>({...stop}));
  let logs=[];
  const end=Math.max(0,Math.min(STEPS.length-1,targetStep));
  for(let index=1;index<=end;index+=1){const step=STEPS[index];buses=buses.map(bus=>step.busPatch[bus.id]?{...bus,...step.busPatch[bus.id]}:bus);stops=stops.map(stop=>step.stopPatch[stop.id]?{...stop,...step.stopPatch[stop.id]}:stop);logs=[...step.logs.map((entry,item)=>({...entry,key:`${index}-${item}`,step:index})).reverse(),...logs];}
  return {buses,stops,logs};
}
