export const STOPS = [
  { id:"kdoj", name:"KDOJ", full:"Kolej Dato' Onn Jaafar", corridors:["D","E"] },
  { id:"kdse", name:"KDSE", full:"Kolej Datin Seri Endon", corridors:["D","E"] },
  { id:"klg", name:"KLG", full:"Kolej Lembah Gelang", corridors:["D","E"] },
  { id:"kp", name:"KP", full:"Kolej Perdana", corridors:["A","B"] },
  { id:"k910", name:"K9/10", full:"Kolej 9 / Kolej 10", corridors:["B","C"] },
  { id:"ktr", name:"KTR", full:"Kolej Tun Razak", corridors:["F","G"] },
  { id:"ktho", name:"KTHO", full:"Kolej Tun Hussein Onn", corridors:["F","G"] },
  { id:"ktdi", name:"KTDI", full:"Kolej Tun Dr Ismail", corridors:["F","G"] },
  { id:"cp", name:"CP", full:"Canselori / Center Point", corridors:["A","C","D","E","F","G","H"] },
];

export const CORRIDORS = {
  D:{ label:"Canselori (CP)", sub:"via PKU · Pusat Kesihatan", color:"#F59E0B" },
  E:{ label:"Faculty Cluster", sub:"T02 · T06 · T08", color:"#3B5FD4" },
  A:{ label:"Canselori (CP)", sub:"via Jalan Amal", color:"#F59E0B" },
  B:{ label:"Faculty Cluster", sub:"T02 · T04 · T08", color:"#3B5FD4" },
  C:{ label:"KTC · Jalan Amal", sub:"via CP", color:"#7C3AED" },
  F:{ label:"Canselori (CP)", sub:"via KTDI · Jalan Amal", color:"#7C3AED" },
  G:{ label:"Canselori (CP)", sub:"via N24 · SKT · P19", color:"#059669" },
  H:{ label:"Taman Universiti", sub:"V01 · via Jalan Amal", color:"#64748B" },
};

const ROUTE_STOPS = {
  A:["kp","cp","jalan_amal"],
  B:["kp","k910","t02","t04","t08"],
  C:["k910","ktc","cp","jalan_amal"],
  D:["kdoj","klg","kdse","pku","cp","jalan_amal"],
  E:["kdoj","kdse","klg","cp","n24","ktc","t02","t06","t08"],
  F:["ktr","ktho","ktdi","jalan_amal","cp"],
  G:["ktr","ktho","ktdi","n24","skt","p19","cp"],
  H:["cp","jalan_amal","v01"],
};

const ROUTE_STOP_NAMES = {
  kdoj:"KDOJ", klg:"KLG", kdse:"KDSE", kp:"KP", k910:"K9/10", ktr:"KTR",
  ktho:"KTHO", ktdi:"KTDI", cp:"CP", jalan_amal:"Jalan Amal", pku:"PKU",
  n24:"N24", ktc:"KTC", t02:"Cluster T02", t04:"Cluster T04", t06:"Cluster T06",
  t08:"Cluster T08", skt:"SKT", p19:"P19", v01:"V01 (Taman Universiti)",
};

const BUS_PROFILES = {
  A:{ id:"A1", etaMinutes:9, load:8,  lastSeen:"Jalan Amal", followingBus:"A2" },
  B:{ id:"B2", etaMinutes:12,load:11, lastSeen:"Cluster T08", followingBus:"B3" },
  C:{ id:"C2", etaMinutes:10,load:9,  lastSeen:"Jalan Amal", followingBus:"C3" },
  D:{ id:"D2", etaMinutes:11,load:12, lastSeen:"Jalan Amal", followingBus:"D1" },
  E:{ id:"E2", etaMinutes:14,load:14, lastSeen:"PKU", followingBus:"E1" },
  F:{ id:"F2", etaMinutes:13,load:10, lastSeen:"CP", followingBus:"F3" },
  G:{ id:"G2", etaMinutes:15,load:13, lastSeen:"CP", followingBus:"G3" },
  H:{ id:"H1", etaMinutes:8, load:7,  lastSeen:"V01", followingBus:"H1" },
};

const waitingFor = (index) => [4,6,3,5,2][index % 5];

export function getBusInfo(corridor, userStopId) {
  if(corridor === "E" && userStopId === "kdse") return DEMO_BUS;
  const profile=BUS_PROFILES[corridor], route=ROUTE_STOPS[corridor];
  if(!profile || !route) return DEMO_BUS;
  const targetIndex=route.indexOf(userStopId);
  const safeTarget=targetIndex >= 0 ? targetIndex : 0;
  const priorIndexes=[2,1].map(offset=>(safeTarget-offset+route.length)%route.length);
  const lastSeenIndex=(safeTarget-3+route.length)%route.length;
  const approachStops=priorIndexes.map((index,position)=>({
    id:route[index], name:ROUTE_STOP_NAMES[route[index]], waiting:waitingFor(position+safeTarget), isUserStop:false,
  }));
  return {
    id:profile.id, corridor, etaMinutes:profile.etaMinutes, load:profile.load, max:28,
    lastSeen:ROUTE_STOP_NAMES[route[lastSeenIndex]] || profile.lastSeen,
    routeToUser:[...approachStops,{ id:userStopId, name:ROUTE_STOP_NAMES[userStopId], waiting:0, isUserStop:true }],
    followingBus:{ id:profile.followingBus, etaMinutes:profile.etaMinutes+24, status:"Waiting" },
  };
}

export const DEMO_BUS = {
  id:"E1", corridor:"E", etaMinutes:7, load:28, max:28, lastSeen:"Left KDOJ at 7:30",
  routeToUser:[
    { id:"kdoj", name:"KDOJ", waiting:20, isUserStop:false },
    { id:"kdse", name:"KDSE", waiting:0, isUserStop:true },
  ],
  followingBus:{ id:"E2", etaMinutes:27, status:"Scheduled to leave KDOJ at 7:50" },
};

export const RELIEF_BUS = {
  id:"E2", corridor:"E", etaMinutes:27, load:0, max:28, lastSeen:"Waiting at KDOJ for 7:50",
  routeToUser:[
    { id:"kdoj", name:"KDOJ", waiting:2, isUserStop:false },
    { id:"kdse", name:"KDSE", waiting:0, isUserStop:true },
  ],
  followingBus:{ id:"E3", etaMinutes:30, status:"Waiting" },
};

export const INITIAL_WAITING = 17;
export const DEMO_TIMING = { firstBusDelay:3000, dispatchDelay:2000, dispatchEtaNew:17, dispatchHideDelay:7000, boardingDelay:12000, boardingStagger:400, boardingBatch:6, boardingCount:18 };
export const GPS_DETECTION_DELAY = 1500;
export const NEARBY_DISTANCE = 34;
export const ONBOARDING = [
  { emoji:"🚌", headline:"Know when your bus is coming", body:"See the latest arrival time instead of waiting and guessing." },
  { emoji:"📱", headline:"Check the bus before you leave", body:"See how many seats are left and where the bus is now." },
  { emoji:"👥", headline:"At the stop? Join the live queue", body:"Tap once to tell ORBIT that you are waiting for the bus." },
  { emoji:"⚡", headline:"More people waiting can bring help sooner", body:"If it is safe, ORBIT can send a bus out earlier.", italic:true },
  { emoji:"✅", headline:"Tell us when you get on", body:"Your quick reply keeps the queue correct for everyone." },
  { emoji:"🙋", headline:"Missed the bus? You can stay in the queue", body:"Tell ORBIT you missed it so the next bus knows you are still waiting." },
];
