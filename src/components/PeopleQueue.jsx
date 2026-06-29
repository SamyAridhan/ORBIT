import { C, personSize } from "../design/tokens";
import PersonSVG from "./PersonSVG";

export default function PeopleQueue({ beforeUser, afterUser, userTapped, corridor, stopName, boardedCount = 0 }) {
  const original = [...Array(beforeUser).fill("other"), ...(userTapped ? ["user"] : []), ...Array(afterUser).fill("other")];
  const total = Math.max(0, original.length - boardedCount);
  const size = personSize(total);
  const people = total === 0 ? [] : boardedCount === 0 ? original : userTapped ? [...Array(Math.max(0, total - 1)).fill("other"), "user"] : original.slice(0, total);

  return (
    <section className="rounded-2xl border p-4" style={{ background: C.card, borderColor: C.border }}>
      <h2 className="text-sm font-extrabold" style={{ color: C.text }}>People waiting for Bus {corridor}</h2>
      <p className="mb-3 mt-0.5 text-[11px]" style={{ color: C.textSec }}>
        <strong className="text-base" style={{ color: C.primaryLight }}>{total}</strong> {total === 1 ? "person" : "people"} waiting at {stopName}
      </p>
      <div aria-label={`${total} ${total === 1 ? "person" : "people"} waiting for Bus ${corridor} at ${stopName}`} className="flex flex-wrap items-end gap-[3px]">
        {people.map((kind, i) => (
          <PersonSVG
            key={`${kind}-${i}`}
            size={size}
            color={kind === "user" ? C.userBlue : C.personBlack}
            className="person-enter"
            style={{
              animationDelay: boardedCount > 0 ? "0ms" : i < beforeUser ? `${i * 45}ms` : kind === "other" && i > beforeUser ? `${(i - beforeUser) * 70}ms` : "0ms",
            }}
          />
        ))}
      </div>
      {userTapped && total > 0 && boardedCount > 0 && (
        <p className="mt-2 text-[11px] font-semibold" style={{ color: C.userBlue }}>People are getting on now — you are still in the queue</p>
      )}
      {total === 0 && <p className="mt-2 text-[11px] font-extrabold" style={{ color: C.success }}>Everyone waiting has boarded</p>}
    </section>
  );
}
