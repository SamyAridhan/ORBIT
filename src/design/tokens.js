export const C = {
  bg: "#F0F4FF", card: "#FFFFFF", primary: "#1E3A8A", primaryLight: "#3B5FD4",
  accent: "#F59E0B", accentLight: "#FEF3C7", success: "#059669", successLight: "#D1FAE5",
  red: "#DC2626", yellow: "#CA8A04", text: "#0F172A", textSec: "#64748B",
  textMuted: "#94A3B8", border: "#E2E8F0", userBlue: "#2563EB", personBlack: "#334155",
};

export const SHADOW = { primary: "0 4px 14px rgba(30,58,138,0.35)" };
export const capColor = (load, max) => load / max < 0.6 ? C.success : load / max < 0.85 ? C.yellow : C.red;
export const personSize = (total) => total <= 8 ? 22 : total <= 16 ? 18 : total <= 28 ? 15 : total <= 45 ? 12 : total <= 70 ? 10 : 8;
