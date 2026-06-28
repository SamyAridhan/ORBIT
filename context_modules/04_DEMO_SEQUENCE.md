# 04 — The Demo Sequence

This is the single most important thing to get right. The sequence must run automatically and flawlessly after the user taps "I'm waiting here."

## Initial state (when ETA screen first loads with atStop=true)

| Element | Value |
|---|---|
| ETA | 14 minutes |
| Bus load | 14/28 seats |
| People waiting at stop | 11 (all black) |
| "I'm waiting here" button | Active, visible |
| DispatchBanner | Hidden |
| BoardingPrompt | Hidden |

## Step 0 — User taps "I'm waiting here"

Happens immediately on tap, no delay:
- Button disappears, replaced by green confirmation card
- Confirmation card: "✓ You're counted — position 12 in queue"
- Sub: "We'll notify you when Bus E2 is close"
- A new **blue** person icon appears at position 12 in the people queue (after the 11 black ones)
- `startSequence()` is called, starting all timers

## Step 1 — 3 seconds after tap

- 4 more **black** person icons appear in the people queue (positions 13–16)
- Total showing: 11 black + 1 blue (user) + 4 black = 16 people
- The count number in the queue header updates to 16

## Step 2 — 6 seconds after tap

- DispatchBanner animates in (opacity + slide down)
- Banner content: "Bus E2 is leaving **7 minutes earlier** than scheduled. You and 16 others waiting here made that happen."
- ETA number in the main ETA card updates from 14 → 7 (with color change to green momentarily)
- Inside banner: updated ETA "7 min" with strikethrough "was 14"

## Step 3 — 11 seconds after tap

- DispatchBanner animates out (opacity + slide up)
- ETA card remains at 7 minutes

## Step 4 — 16 seconds after tap

- BoardingPrompt card appears (slides in or fades in)
- Shows: "Bus E2 just arrived at KDOJ · Did you get on?"
- Two buttons: "✓ I'm on the bus" | "✗ I missed it"

## Step 5 — User responds to boarding prompt

**If "✓ I'm on the bus":**
- Buttons disappear, replaced by "Safe trip! 👋" in green
- Sequence ends

**If "✗ I missed it":**
- Show: "Still counted. Bus E1 in ~24 min."
- Sequence ends

**If no response (demo):**
- Boarding prompt can stay open indefinitely (no auto-dismiss in the POC)

## Presenter narration guide (for reference only, not in code)

1. Open app → tap "Find my stop automatically" → KDOJ detected → tap Faculty Cluster
2. ETA screen loads — "14 minutes away, 14 of 28 seats used. Route timeline shows the bus will pick up 8 more at KDSE, 5 at KLG — only about 1 seat left by the time it reaches KDOJ. 11 people already waiting."
3. Tap "I'm waiting here" → blue person appears at position 12
4. "Three seconds later — 4 more students join — now 16 people."
5. "Six seconds — the system fires. Bus E2 departing 7 minutes earlier. You and 16 others made that happen." Point to banner and ETA change.
6. "Boarding prompt — the bus has arrived. Did you get on?"

Total sequence: ~20 seconds from tap to boarding prompt.

## One rule for the ETA screen

The ETA screen's "I'm waiting here" button must ONLY be active when `atStop === true`. When `atStop === false` (browsing from room), the button is rendered but disabled with grey styling and the text below reads: "Available when you arrive at [stop.name]".
