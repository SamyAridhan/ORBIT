# 05 — Design Tokens

Same color system as the student app. Copy this exactly into `src/design/tokens.js`.

```js
export const C = {
  // Backgrounds
  bg:           "#F0F4FF",
  card:         "#FFFFFF",

  // Brand
  primary:      "#1E3A8A",
  primaryDim:   "#1E3A8A22",

  // Semantic
  success:      "#059669",
  successLight: "#D1FAE5",
  accent:       "#F59E0B",
  accentLight:  "#FEF3C7",
  red:          "#DC2626",
  redLight:     "#FEE2E2",
  orange:       "#EA580C",
  orangeLight:  "#FFEDD5",
  purple:       "#7C3AED",
  purpleLight:  "#EDE9FE",

  // Text
  text:         "#0F172A",
  textSec:      "#64748B",
  textMuted:    "#94A3B8",

  // UI
  border:       "#E2E8F0",
};
```

## Typography

| Element | Size | Weight |
|---|---|---|
| Dashboard title | 13px | 800 |
| Section labels | 8px | 700, uppercase, letter-spacing 1.5px |
| Bus ID badge | 10px | 800 |
| Status label | 9px | 600 |
| Stop name | 12px | 800 |
| Queue count | 38px | 900 |
| Log agent name | 10px | 800 |
| Log event name | 11px | 700 |
| Log description | 10px | 400 |
| Chip text | 9px | 700 |
| Timestamp | 9px | 400, monospace |
| Delta badge | 9px | 800 |
| Demo control step label | 10px | 600 |
| Demo control step number | 7px | 700, uppercase |

## Borders and radius

| Element | Radius |
|---|---|
| Cards (BusCard, StopCard) | 9px |
| Log entries | 0 8px 8px 0 (left border flush) |
| Override modal | 14px |
| Buttons | 7–9px |
| Status pills in header | 20px |
| Demand level pill | 20px |

## CSS animation

CRITICAL demand dot pulses. Define once in index.css or a style tag:
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.45; }
}
```
Apply: `animation: pulse 1.4s ease-in-out infinite` on the dot element inside a CRITICAL demand pill.

## Capacity bar colors (same as student app)
- < 60% full → #059669 (green)
- 60–84% full → #F59E0B (amber)
- ≥ 85% full → #DC2626 (red)

## Status dot glow (COMMUTING and BOARDING buses)
```
box-shadow: 0 0 0 2px [status_color]30
```
This creates a soft ring around the dot. Only for COMMUTING and BOARDING — not IDLE or RECALCULATING.

## Override modal overlay
```
background: rgba(15, 23, 42, 0.55)
```
