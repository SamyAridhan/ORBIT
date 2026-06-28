# 05 — Design Tokens

## Colors
```js
// src/design/tokens.js
export const C = {
  // Backgrounds
  bg:           "#F0F4FF",   // app background (light blue-grey)
  card:         "#FFFFFF",   // card background

  // Brand
  primary:      "#1E3A8A",   // deep navy blue — main brand, TopBar, primary buttons
  primaryLight: "#3B5FD4",   // lighter blue for accents

  // Semantic
  accent:       "#F59E0B",   // amber — Bus D/A corridors, warnings, info boxes
  accentLight:  "#FEF3C7",   // amber background tint
  success:      "#059669",   // green — confirmed, boarded, good capacity
  successLight: "#D1FAE5",   // green background tint
  red:          "#DC2626",   // danger — full bus, critical warning
  yellow:       "#CA8A04",   // warning — medium capacity

  // Text
  text:         "#0F172A",   // primary text
  textSec:      "#64748B",   // secondary text
  textMuted:    "#94A3B8",   // muted/captions

  // UI
  border:       "#E2E8F0",   // card borders, dividers

  // Person icons
  userBlue:     "#2563EB",   // the user's person icon
  personBlack:  "#334155",   // other waiting people (dark slate, not pure black)
};
```

## Typography

| Use | Size | Weight |
|---|---|---|
| Screen headlines | 18–20px | 800 |
| Card headlines | 14–16px | 800 |
| Body text | 12–13px | 400 |
| Secondary text | 11–12px | 400 |
| Captions/labels | 9–10px | 600–700 |
| Uppercase labels | 9–10px | 700, letter-spacing 1–1.5px |
| Large ETA number | 30–32px | 900 |

Font: system-ui / -apple-system / BlinkMacSystemFont / "Segoe UI" / sans-serif

## Border radius

| Element | Radius |
|---|---|
| Phone frame | 36px |
| Cards | 13–16px |
| Buttons (primary) | 10–12px |
| Badges/pills | 6–8px |
| Small items | 6–8px |

## Spacing

Consistent gap between stacked cards in ETA screen: 10–12px.
Card internal padding: 12–16px.
TopBar internal padding: 10–14px vertical, 14–16px horizontal.

## Capacity bar colors

```js
const capColor = (load, max) => {
  const pct = load / max;
  if (pct < 0.60) return C.success;  // green
  if (pct < 0.85) return C.yellow;   // yellow
  return C.red;                       // red
};
```

## Person icon size tiers

```js
const personSize = (total) => {
  if (total <= 8)  return 22;
  if (total <= 16) return 18;
  if (total <= 28) return 15;
  if (total <= 45) return 12;
  if (total <= 70) return 10;
  return 8;
};
```

## Corridor badge colors

Each corridor card on the destination screen uses the corridor's `color` from CORRIDORS in mockData.js. The badge background is `color + "20"` (20% opacity hex), text is the full color.

## Button styles

**Primary button:**
- Background: `C.primary`
- Text: white
- Padding: 13–14px vertical
- Border radius: 10–12px
- Box shadow: `0 4px 14px rgba(30,58,138,0.35)`
- Font weight: 800

**Secondary button:**
- Background: `C.bg`
- Text: `C.text`
- Border: `1.5px solid C.border`
- Same radius/padding

**Disabled button:**
- Background: `C.border`
- Text: `C.textMuted`
- Cursor: not-allowed

## Status bar (top of phone frame)
- Background: `C.primary`
- Padding: 9px 18px 5px
- Left: time "9:41" white 11px 600
- Right: signal "●●●" white 10px
