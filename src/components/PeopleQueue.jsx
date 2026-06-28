import { C, personSize } from "../design/tokens";
import PersonImage from "./PersonImage";

export default function PeopleQueue({ beforeUser, afterUser, userTapped, corridor, stopName }) {
  const total=beforeUser+(userTapped?1:0)+afterUser, size=personSize(total);
  const people=[...Array(beforeUser).fill("other"), ...(userTapped?["user"]:[]), ...Array(afterUser).fill("other")];
  return <section className="rounded-2xl border p-4" style={{ background:C.card, borderColor:C.border }}>
    <h2 className="text-sm font-extrabold" style={{color:C.text}}>Queue for Bus {corridor}</h2>
    <p className="mb-3 mt-0.5 text-[11px]" style={{color:C.textSec}}><strong className="text-base" style={{color:C.primaryLight}}>{total}</strong> {total===1?"person":"people"} waiting at {stopName}</p>
    <div aria-label={`${total} people waiting for Bus ${corridor} at ${stopName}`} className="flex flex-wrap items-end gap-[3px]">{people.map((kind,i)=><PersonImage key={`${kind}-${i}`} size={size} isUser={kind==="user"}/>)}</div>
    {userTapped && <p className="mt-2 text-[11px] font-semibold" style={{ color:C.userBlue }}>The blue person is you — position {beforeUser+1} in the queue</p>}
  </section>;
}
