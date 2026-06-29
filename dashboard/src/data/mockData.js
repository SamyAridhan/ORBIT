import {C} from "../design/tokens";

export const INIT_BUSES=[
  {id:"E1",corridor:"E",status:"BOARDING",position:"KDOJ",load:8,max:28,eta:0,etaGain:0},
  {id:"E2",corridor:"E",status:"IDLE",position:"KDOJ",load:0,max:28,eta:20,etaGain:0},
  {id:"B1",corridor:"B",status:"COMMUTING",position:"K9/10 → Cluster",load:22,max:28,eta:9,etaGain:0},
  {id:"B2",corridor:"B",status:"IDLE",position:"KP",load:0,max:28,eta:26,etaGain:0},
  {id:"B3",corridor:"B",status:"COMMUTING",position:"KP → K9/10",load:12,max:28,eta:17,etaGain:0},
  {id:"F1",corridor:"F",status:"COMMUTING",position:"KTHO → KTDI",load:9,max:28,eta:12,etaGain:0},
];
export const INIT_STOPS=[
  {id:"kdse_e",name:"KDSE",corridor:"E",queue:18,level:"HIGH",claimedBy:null,lastBus:18,busHere:false},
  {id:"kdoj_e",name:"KDOJ",corridor:"E",queue:22,level:"HIGH",claimedBy:null,lastBus:9,busHere:true},
  {id:"klg_e",name:"KLG",corridor:"E",queue:4,level:"LOW",claimedBy:null,lastBus:6},
  {id:"kp_b",name:"KP",corridor:"B",queue:6,level:"MEDIUM",claimedBy:null,lastBus:12},
  {id:"k910_b",name:"K9/10",corridor:"B",queue:2,level:"LOW",claimedBy:null,lastBus:3},
  {id:"ktr_f",name:"KTR",corridor:"F",queue:5,level:"MEDIUM",claimedBy:null,lastBus:9},
];
const log=(type,agent,event,desc,chips=[])=>({type,agent,event,desc,chips});
export const STEPS=[
  {label:"7:30 · E1 starts its route from KDOJ",busPatch:{},stopPatch:{},logs:[]},
  {label:"7:30 · E1 leaves KDOJ full",busPatch:{E1:{status:"COMMUTING",position:"KDOJ → KDSE",load:28,eta:7}},stopPatch:{kdoj_e:{queue:2,level:"LOW",lastBus:0,busHere:false}},logs:[log("IMPACT","KDOJ stop","2_STUDENTS_MISSED_E1","E1 left KDOJ full · 2 students remain at the stop")]},
  {label:"7:37 · E1 cannot pick up the KDSE queue",busPatch:{E1:{status:"PASSING_FULL",position:"KDSE",eta:0}},stopPatch:{kdse_e:{busHere:true}},logs:[log("IMPACT","KDSE stop","18_STUDENTS_MISSED_E1","E1 reached KDSE full · All 18 students remain at the stop")]},
  {label:"Bus E2 starts checking a response",busPatch:{E2:{status:"RECALCULATING"}},stopPatch:{},logs:[]},
  {label:"Bus E2 checks whether early departure is safe",busPatch:{E2:{status:"VERIFYING"}},stopPatch:{},logs:[]},
  {label:"Earlier departure approved · 6 checks passed",busPatch:{E2:{status:"READY"}},stopPatch:{},logs:[log("DECISION","Bus E2","EARLIER_DEPARTURE_APPROVED","Bus E2 will leave at 7:40 instead of 7:50 · All 6 safety checks passed, including a safe 10-minute gap behind E1")]},
  {label:"Bus E2 is assigned to the overflow",busPatch:{},stopPatch:{kdse_e:{claimedBy:"E2"},kdoj_e:{claimedBy:"E2"}},logs:[]},
  {label:"7:40 · E2 collects the KDOJ queue and leaves",busPatch:{E2:{status:"COMMUTING",position:"KDOJ → KDSE",load:2,eta:7,etaGain:10}},stopPatch:{kdoj_e:{queue:0,level:"LOW",claimedBy:null,lastBus:0,busHere:false},kdse_e:{busHere:false}},logs:[log("ACTION","Bus E2","RELIEF_TRIP_STARTED","E2 picked up the 2 students at KDOJ and left at 7:40 · Expected at KDSE at 7:47")]},
  {label:"7:44 · E2 approaches KDSE",busPatch:{E2:{position:"Approaching KDSE",eta:3}},stopPatch:{},logs:[]},
  {label:"7:47 · Both overflow queues are clear",busPatch:{E2:{status:"BOARDING",position:"KDSE",load:20,eta:0,etaGain:10}},stopPatch:{kdse_e:{queue:0,level:"LOW",claimedBy:null,lastBus:0,busHere:true}},logs:[log("RESOLVED","Bus E service","OVERFLOW_CLEARED","Nobody remains at KDOJ or KDSE · Bus E2 now has 20 of 28 seats used")]},
];
export const STATUS_CFG={IDLE:{color:C.textMuted,label:"WAITING TO LEAVE"},COMMUTING:{color:C.primary,label:"ON THE WAY"},BOARDING:{color:C.success,label:"BOARDING NOW"},PASSING_FULL:{color:C.red,label:"FULL · NO PICKUP"},RECALCULATING:{color:C.accent,label:"CHECKING OPTIONS"},VERIFYING:{color:C.accent,label:"CHECKING SAFETY"},READY:{color:C.success,label:"APPROVED · READY"}};
export const DEMAND_CFG={LOW:{color:C.textMuted,bg:"#F8FAFC",text:C.textSec,label:"QUIET"},MEDIUM:{color:C.accent,bg:C.accentLight,text:"#92400E",label:"GETTING BUSY"},HIGH:{color:C.orange,bg:C.orangeLight,text:"#9A3412",label:"BUSY"},CRITICAL:{color:C.red,bg:C.redLight,text:"#991B1B",label:"VERY BUSY"}};
export const LOG_CFG={IMPACT:{border:C.red,bg:C.redLight,icon:"!"},DECISION:{border:C.accent,bg:C.accentLight,icon:"✓"},ACTION:{border:C.primaryLight,bg:"#EFF6FF",icon:"→"},RESOLVED:{border:C.success,bg:C.successLight,icon:"✓"},REJECT:{border:C.textMuted,bg:"#F8FAFC",icon:"×"}};

export const SCENARIO_TIMES=["07:29:50","07:30:00","07:37:00","07:37:10","07:37:20","07:38:00","07:38:10","07:40:00","07:44:00","07:47:00"];

export function deriveState(targetStep){
  let buses=INIT_BUSES.map(bus=>({...bus}));
  let stops=INIT_STOPS.map(stop=>({...stop}));
  let logs=[];
  const end=Math.max(0,Math.min(STEPS.length-1,targetStep));
  for(let index=1;index<=end;index+=1){const step=STEPS[index];buses=buses.map(bus=>step.busPatch[bus.id]?{...bus,...step.busPatch[bus.id]}:bus);stops=stops.map(stop=>step.stopPatch[stop.id]?{...stop,...step.stopPatch[stop.id]}:stop);logs=[...step.logs.map((entry,item)=>({...entry,key:`${index}-${item}`,step:index})).reverse(),...logs];}
  return {buses,stops,logs};
}
