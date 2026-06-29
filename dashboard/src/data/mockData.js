import {C} from "../design/tokens";

export const INIT_BUSES=[
  {id:"E1",corridor:"E",status:"COMMUTING",position:"Approaching KDOJ",load:8,max:28,eta:2,etaGain:0},
  {id:"E2",corridor:"E",status:"IDLE",position:"KDOJ",load:0,max:28,eta:17,etaGain:0},
  {id:"B1",corridor:"B",status:"COMMUTING",position:"K9/10 → Cluster",load:22,max:28,eta:9,etaGain:0},
  {id:"B2",corridor:"B",status:"IDLE",position:"KP",load:0,max:28,eta:26,etaGain:0},
  {id:"B3",corridor:"B",status:"COMMUTING",position:"KP → K9/10",load:12,max:28,eta:17,etaGain:0},
  {id:"F1",corridor:"F",status:"COMMUTING",position:"KTHO → KTDI",load:9,max:28,eta:12,etaGain:0},
];
export const INIT_STOPS=[
  {id:"kdse_e",name:"KDSE",corridor:"E",queue:18,level:"HIGH",claimedBy:null,lastBus:18},
  {id:"kdoj_e",name:"KDOJ",corridor:"E",queue:22,level:"HIGH",claimedBy:null,lastBus:9},
  {id:"klg_e",name:"KLG",corridor:"E",queue:4,level:"LOW",claimedBy:null,lastBus:6},
  {id:"kp_b",name:"KP",corridor:"B",queue:6,level:"MEDIUM",claimedBy:null,lastBus:12},
  {id:"k910_b",name:"K9/10",corridor:"B",queue:2,level:"LOW",claimedBy:null,lastBus:3},
  {id:"ktr_f",name:"KTR",corridor:"F",queue:5,level:"MEDIUM",claimedBy:null,lastBus:9},
];
const log=(type,agent,event,desc,chips=[])=>({type,agent,event,desc,chips});
export const STEPS=[
  {label:"7:40 · E1 approaches two busy stops",busPatch:{},stopPatch:{},logs:[]},
  {label:"E1 fills up at KDOJ",busPatch:{E1:{status:"BOARDING",position:"KDOJ",load:28,eta:1}},stopPatch:{kdoj_e:{queue:2,lastBus:0}},logs:[log("BOARD","Bus E1","BUS_FULL_AT_KDOJ","E1 had 8 passengers and picked up 20 at KDOJ · The bus is now full · 2 students remain")]},
  {label:"KDSE students report that E1 was full",busPatch:{E1:{status:"COMMUTING",position:"KDOJ → KDSE",eta:0}},stopPatch:{},logs:[log("SIGNAL","KDSE stop","MISSED_BUS_REPORTS_RECEIVED","Students at KDSE reported that E1 passed full · 18 are still waiting")]},
  {label:"The system confirms an overflow",busPatch:{},stopPatch:{},logs:[log("BROADCAST","Bus E service","OVERFLOW_CONFIRMED","E1 has no seats left · 2 students remain at KDOJ and 18 remain at KDSE")]},
  {label:"Bus E2 checks if it can leave early",busPatch:{E2:{status:"RECALCULATING"}},stopPatch:{},logs:[log("EVAL","Bus E2","CHECKING_EARLIER_DEPARTURE","E2 is waiting at KDOJ for its 7:50 departure · The system checks a safe earlier time")]},
  {label:"A 7:45 departure passes every check",busPatch:{},stopPatch:{},logs:[log("EVAL","Bus E2","SAFETY_CHECKS_PASSED","E2 can leave at 7:45 without running too close to E1",["SAME ROUTE ✓","28 SEATS FREE ✓","SAFE TIME ✓","NO BUS ASSIGNED ✓","15-MINUTE GAP ✓","5 MIN EARLY ✓"])]},
  {label:"Bus E2 is assigned to the overflow",busPatch:{},stopPatch:{kdse_e:{claimedBy:"E2"},kdoj_e:{claimedBy:"E2"}},logs:[log("CLAIM","Bus E2","BUS_ASSIGNED_TO_OVERFLOW","Bus E2 will collect the students left at KDOJ and KDSE")]},
  {label:"7:45 · Bus E2 leaves five minutes early",busPatch:{E2:{status:"COMMUTING",position:"KDOJ → KDSE",eta:7,etaGain:5}},stopPatch:{},logs:[log("ACCEPT","Bus E2","EARLIER_DEPARTURE_APPROVED","E2 left KDOJ at 7:45 instead of 7:50 · Expected at KDSE at 7:52")]},
  {label:"E2 collects the two students at KDOJ",busPatch:{E2:{load:2}},stopPatch:{kdoj_e:{queue:0,level:"LOW",claimedBy:null,lastBus:0}},logs:[log("BOARD","Bus E2","KDOJ_QUEUE_CLEARED","The 2 students left at KDOJ boarded E2 · 26 seats remain for KDSE")]},
  {label:"7:52 · E2 collects all 18 at KDSE",busPatch:{E2:{status:"BOARDING",position:"KDSE",load:20,eta:0,etaGain:5}},stopPatch:{kdse_e:{queue:0,level:"LOW",claimedBy:null,lastBus:0}},logs:[log("BOARD","Bus E2","KDSE_QUEUE_CLEARED","All 18 students at KDSE boarded E2 · 20 of 28 seats are used · Both overflow queues are clear")]},
];
export const STATUS_CFG={IDLE:{color:C.textMuted,label:"WAITING TO LEAVE"},COMMUTING:{color:C.primary,label:"ON THE WAY"},BOARDING:{color:C.success,label:"BOARDING NOW"},RECALCULATING:{color:C.accent,label:"CHECKING OPTIONS"}};
export const DEMAND_CFG={LOW:{color:C.textMuted,bg:"#F8FAFC",text:C.textSec,label:"QUIET"},MEDIUM:{color:C.accent,bg:C.accentLight,text:"#92400E",label:"GETTING BUSY"},HIGH:{color:C.orange,bg:C.orangeLight,text:"#9A3412",label:"BUSY"},CRITICAL:{color:C.red,bg:C.redLight,text:"#991B1B",label:"VERY BUSY"}};
export const LOG_CFG={SIGNAL:{border:C.primaryLight,bg:"#EFF6FF",icon:"●"},BROADCAST:{border:C.primary,bg:"#EFF6FF",icon:"◉"},EVAL:{border:C.accent,bg:C.accentLight,icon:"⚙"},ACCEPT:{border:C.success,bg:C.successLight,icon:"✓"},CLAIM:{border:C.purple,bg:C.purpleLight,icon:"◆"},SUPPRESSED:{border:C.accent,bg:C.accentLight,icon:"⊘"},REJECT:{border:C.textMuted,bg:"#F8FAFC",icon:"×"},BOARD:{border:C.success,bg:C.successLight,icon:"✓"}};

export const SCENARIO_TIMES=["07:40:00","07:41:00","07:42:00","07:42:10","07:42:20","07:42:30","07:42:40","07:45:00","07:45:20","07:52:00"];

export function deriveState(targetStep){
  let buses=INIT_BUSES.map(bus=>({...bus}));
  let stops=INIT_STOPS.map(stop=>({...stop}));
  let logs=[];
  const end=Math.max(0,Math.min(STEPS.length-1,targetStep));
  for(let index=1;index<=end;index+=1){const step=STEPS[index];buses=buses.map(bus=>step.busPatch[bus.id]?{...bus,...step.busPatch[bus.id]}:bus);stops=stops.map(stop=>step.stopPatch[stop.id]?{...stop,...step.stopPatch[stop.id]}:stop);logs=[...step.logs.map((entry,item)=>({...entry,key:`${index}-${item}`,step:index})).reverse(),...logs];}
  return {buses,stops,logs};
}
