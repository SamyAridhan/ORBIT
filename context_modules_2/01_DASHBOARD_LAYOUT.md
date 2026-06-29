# 01 — Layout and Panel Specifications

## Overall structure

The app is one full-height flex column:
```
<div style="min-height:100vh, display:flex, flexDirection:column">
  <Header />                          ← fixed top, flexShrink:0
  <div style="flex:1, display:flex, overflow:hidden">
    <LeftPanel />                     ← 22% width, overflowY:auto
    <CenterPanel />                   ← 30% width, overflowY:auto
    <RightPanel />                    ← flex:1, overflowY:auto
  </div>
  <DemoControl />                     ← sticky bottom
</div>
```

Each inner panel scrolls independently. The header and demo control never scroll.

---

## Header bar

Full width, primary blue background (#1E3A8A), padding 9px 16px.

Left side:
- Title: "ORBIT Fleet Dashboard" — white, 13px, weight 800
- Sub: "UTM Campus Bus · Multi-Agent Coordination View" — white/45, 8px

Right side (flex-end, gap 10px):
- Status pill: "[N] active" — green fill
- Status pill: "[N] critical" OR "all clear" — red fill if critical count > 0, grey if 0
- Status pill: "[N] decisions" — white/12 background, white text
- Time: "09:41:07" — monospace, white/35, 9px

Status pills: background from token, 9px text, weight 700, padding 3px 8px, borderRadius 20px.

---

## Left panel — Bus Fleet

Background: white. Width: 22%. Min-width: 170px. Border-right: 1px solid border color.
Padding: 10px 8px. OverflowY: auto.

**Grouped by corridor. Three groups in this order: Corridor E → Corridor B → Corridor F.**

Each group:
- Section label: corridor name (e.g. "Corridor E") — 8px, weight 700, muted, uppercase, letter-spacing 1.5px
- Margin-bottom 12px per group
- BusCard components for each bus in that corridor

See `03_DASHBOARD_COMPONENTS.md` for BusCard spec.

Buses in each group (from mockData.js):
- Corridor E: E1, E2
- Corridor B: B1, B2, B3
- Corridor F: F1

---

## Center panel — Stop Status

Background: #F0F4FF (bg token). Width: 30%. Border-right: 1px solid border color.
Padding: 10px 9px. OverflowY: auto.

Section label: "STOP STATUS · 6 MONITORED" — same style as left panel labels.

Six StopCard components, one per monitored stop, in this order:
1. KDOJ (Corridor E)
2. KLG (Corridor E)
3. KDSE (Corridor E)
4. KP (Corridor B)
5. K9/10 (Corridor B)
6. KTR (Corridor F)

See `03_DASHBOARD_COMPONENTS.md` for StopCard spec.

---

## Right panel — Decision Log

Background: white. Flex: 1 (takes remaining width).
Padding: 10px 9px. OverflowY: auto.

Section label row: "DECISION LOG · LIVE FEED" left, event count right (primary blue) — only shown when logs.length > 0.

When empty: centered placeholder text "Press → to start the demo sequence" — muted, 11px.

Log entries: newest on top. Each is a LogEntry component. See `03_DASHBOARD_COMPONENTS.md`.

---

## Demo control — sticky bottom

Position: sticky, bottom: 0. Z-index: 40. Flex row, justify-content: flex-end.
Background: transparent (the column backgrounds show through).
Padding: 10px 14px.

**Expanded state:**
Dark primary blue pill, border-radius 14px, padding 9px 12px, shadow.
Contents (left to right):
- ← button (disabled grey when step === 0)
- Center text block: "STEP X / 9" in caps/muted above, step label in white 10px below
- → button (disabled grey when step === STEPS.length - 1, green background when active)
- ✕ button (collapses to icon)

**Collapsed state:**
Single circular button (42×42px), primary blue, ⚡ icon, same shadow. Click to expand.

**← behavior:** go back one step (recompute state from step 0 to step-1). Disabled at step 0.
**→ behavior:** advance one step (recompute state from step 0 to step+1). Disabled at last step.

State is always derived by replaying from scratch — see `useDashboard.js` spec in `03_DASHBOARD_COMPONENTS.md`.
