import { C, personSize } from "../design/tokens";
import PersonSVG from "./PersonSVG";

export default function PeopleQueue({ beforeUser, afterUser, userTapped }) {
  const total=beforeUser+(userTapped?1:0)+afterUser, size=personSize(total);
  const people=[...Array(beforeUser).fill("other"), ...(userTapped?["user"]:[]), ...Array(afterUser).fill("other")];
  return <section className="rounded-2xl border p-4" style={{ background:C.card, borderColor:C.border }}>
    <div className="mb-3 flex items-center justify-between"><h2 className="text-[10px] font-bold tracking-[1.2px]" style={{ color:C.textSec }}>WAITING AT THIS STOP</h2><strong className="text-2xl" style={{ color:C.primaryLight }}>{total}</strong></div>
    <div aria-label={`${total} people waiting`} className="flex flex-wrap gap-[3px]">{people.map((kind,i)=><PersonSVG key={`${kind}-${i}`} size={size} color={kind==="user"?C.userBlue:C.personBlack}/>)}</div>
    {userTapped && <p className="mt-2 text-[11px] font-semibold" style={{ color:C.userBlue }}>🔵 That's you — position {beforeUser+1} in the queue</p>}
  </section>;
}
