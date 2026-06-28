import { C } from "../design/tokens";

export default function PhoneFrame({ children }) {
  return <div className="min-h-[100dvh] w-full sm:px-6" style={{ background:C.border }}>
    <div className="mx-auto min-h-[100dvh] w-full sm:max-w-[520px] sm:shadow-2xl" style={{ background:C.bg }}>
      {children}
    </div>
  </div>;
}
