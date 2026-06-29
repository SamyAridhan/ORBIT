import {C} from "../design/tokens";

export const INIT_BUSES=[
  {id:"E1",corridor:"E",status:"COMMUTING",position:"KDOJ → KLG",load:18,max:28,eta:31,etaGain:0},
  {id:"E2",corridor:"E",status:"IDLE",position:"Corridor E terminus",load:0,max:28,eta:14,etaGain:0},
  {id:"B1",corridor:"B",status:"COMMUTING",position:"K9/10 → Cluster",load:22,max:28,eta:9,etaGain:0},
  {id:"B2",corridor:"B",status:"IDLE",position:"Terminus",load:0,max:28,eta:26,etaGain:0},
  {id:"B3",corridor:"B",status:"COMMUTING",position:"KP → K9/10",load:12,max:28,eta:17,etaGain:0},
  {id:"F1",corridor:"F",status:"COMMUTING",position:"KTHO → KTDI",load:9,max:28,eta:12,etaGain:0},
];
export const INIT_STOPS=[
  {id:"kdoj_e",name:"KDOJ",corridor:"E",queue:11,level:"MEDIUM",claimedBy:null,lastBus:18},
  {id:"klg_e",name:"KLG",corridor:"E",queue:4,level:"LOW",claimedBy:null,lastBus:6},
  {id:"kdse_e",name:"KDSE",corridor:"E",queue:3,level:"LOW",claimedBy:null,lastBus:4},
  {id:"kp_b",name:"KP",corridor:"B",queue:6,level:"MEDIUM",claimedBy:null,lastBus:12},
  {id:"k910_b",name:"K9/10",corridor:"B",queue:2,level:"LOW",claimedBy:null,lastBus:3},
  {id:"ktr_f",name:"KTR",corridor:"F",queue:5,level:"MEDIUM",claimedBy:null,lastBus:9},
];
const log=(type,agent,event,desc,chips=[])=>({type,agent,event,desc,chips});
export const STEPS=[
  {label:"Initial live state",busPatch:{},stopPatch:{},logs:[]},
  {label:"Student joins KDOJ queue",busPatch:{},stopPatch:{kdoj_e:{queue:12}},logs:[log("SIGNAL","STOP_KDOJ_E","DEMAND_SIGNAL_ACCEPTED","Anonymous student signal accepted · Position 12 · Corridor E")]},
  {label:"Four more students join",busPatch:{},stopPatch:{kdoj_e:{queue:16,level:"HIGH"}},logs:[log("SIGNAL","STOP_KDOJ_E","QUEUE_UPDATED","16 students now waiting for Bus E · HIGH threshold reached")]},
  {label:"Stop Agent broadcasts HIGH demand",busPatch:{},stopPatch:{},logs:[log("BROADCAST","STOP_KDOJ_E","HIGH_DEMAND_BROADCAST","Queue 16 · Corridor E · Published to Bus E agents")]},
  {label:"Idle Bus E2 evaluates the signal",busPatch:{E2:{status:"RECALCULATING"}},stopPatch:{},logs:[log("EVAL","BUS_E2","EARLY_DEPARTURE_EVALUATION","E2 is idle at the Corridor E terminus · Running the six-step hierarchy")]},
  {label:"All early-departure constraints pass",busPatch:{},stopPatch:{},logs:[log("EVAL","BUS_E2","CONSTRAINTS_CHECKED","Early departure is safe and useful for the KDOJ queue",["CORRIDOR ✓","CAPACITY 0/28 ✓","PROTECTED TIME ✓","CLAIM FREE ✓","HEADWAY 22 MIN ✓","UTILITY 0.64 ✓"])]},
  {label:"KDOJ claimed by Bus E2",busPatch:{},stopPatch:{kdoj_e:{claimedBy:"E2"}},logs:[log("CLAIM","BUS_E2","CLAIM_PUBLISHED","tasks/kdoj/claim · KDOJ assigned to E2 before dispatch")]},
  {label:"E2 departs 7 minutes early",busPatch:{E2:{status:"COMMUTING",position:"Terminus → KDSE",eta:7,etaGain:7}},stopPatch:{},logs:[log("ACCEPT","BUS_E2","EARLY_DEPARTURE_ACCEPTED","E2 departed 7 minutes earlier · Original 14-minute arrival updated to 7 minutes")]},
  {label:"Bus E1 suppresses duplicate response",busPatch:{},stopPatch:{},logs:[log("SUPPRESSED","BUS_E1","DUPLICATE_RESPONSE_SUPPRESSED","KDOJ already claimed by E2 · No duplicate intervention issued")]},
  {label:"E2 boards all 16 students at KDOJ",busPatch:{E2:{status:"BOARDING",position:"KDOJ",load:25,eta:0,etaGain:7}},stopPatch:{kdoj_e:{queue:0,level:"LOW",claimedBy:null,lastBus:0}},logs:[log("BOARD","BUS_E2","BOARDING_COMPLETED","E2 boarded 4 at KDSE, 5 at KLG, and all 16 at KDOJ · Load 25/28 · Queue cleared · Claim released")]},
];
export const STATUS_CFG={IDLE:{color:C.textMuted,label:"IDLE"},COMMUTING:{color:C.primary,label:"COMMUTING"},BOARDING:{color:C.success,label:"BOARDING"},RECALCULATING:{color:C.accent,label:"EVALUATING"}};
export const DEMAND_CFG={LOW:{color:C.textMuted,bg:"#F8FAFC",text:C.textSec},MEDIUM:{color:C.accent,bg:C.accentLight,text:"#92400E"},HIGH:{color:C.orange,bg:C.orangeLight,text:"#9A3412"},CRITICAL:{color:C.red,bg:C.redLight,text:"#991B1B"}};
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
