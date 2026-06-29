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
  E:["kdoj","klg","kdse","cp","n24","ktc","t02","t06","t08"],
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
  if(corridor === "E" && userStopId === "kdoj") return DEMO_BUS;
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
    followingBus:{ id:profile.followingBus, etaMinutes:profile.etaMinutes+24, status:"At terminus" },
  };
}

export const DEMO_BUS = {
  id:"E2", corridor:"E", etaMinutes:14, load:0, max:28, lastSeen:"Corridor E terminus",
  routeToUser:[
    { id:"kdse", name:"KDSE", waiting:4, isUserStop:false },
    { id:"klg", name:"KLG", waiting:5, isUserStop:false },
    { id:"kdoj", name:"KDOJ", waiting:0, isUserStop:true },
  ],
  followingBus:{ id:"E1", etaMinutes:38, status:"At terminus" },
};

export const INITIAL_WAITING = 11;
export const DEMO_TIMING = { extraPeopleDelay:3000, extraPeopleStagger:650, extraPeopleCount:4, dispatchDelay:6000, dispatchEtaNew:7, dispatchHideDelay:11000, boardingDelay:16000, boardingStagger:400, boardingBatch:4, boardingCount:16 };
export const GPS_DETECTION_DELAY = 1500;
export const NEARBY_DISTANCE = 34;
export const ONBOARDING = [
  { emoji:"🚌", headline:"Waiting for the bus with no idea when it comes?", body:"Every UTM student knows this feeling. ORBIT fixes it." },
  { emoji:"📱", headline:"See live ETA and how full the bus is — from anywhere", body:"Check before you even leave your room. No more guessing." },
  { emoji:"👥", headline:"At the stop? Let the system know you're waiting", body:"When enough of us tap in, the bus can be dispatched earlier — automatically." },
  { emoji:"⚡", headline:"You'll see it happen — and know you helped", body:"Bus E2 is coming 7 minutes earlier. You and 14 others made that happen.", italic:true },
  { emoji:"✅", headline:"Got on the bus? Give ORBIT a quick update", body:"One quick tap keeps the queue accurate — and helps the students waiting behind you." },
  { emoji:"🙋", headline:"Missed it? You're still part of the plan", body:"Tell ORBIT and you'll stay counted, so the next bus can respond when people are left waiting." },
];
