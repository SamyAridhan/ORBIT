"""Stop Agent logic for the ORBIT MAS backend (Corridor E).

Block 1 progress:
  Task 1 (TC07) — demand-level classifier: classify_demand + DemandLevel.
  Task 2        — per-tick broadcast decision: decide_broadcast + BroadcastDecision.

Still NOT in this module (later Block 1 tasks): the actual MQTT publish/wiring,
interchange suppression (Task 3), adoption scaling (Tasks 4-5), token rate-limiting
(Task 6), the plausibility filter (Task 7), and is_claimed claim-suppression (Task 8).

See `docs_modules/01_AGENT_DESIGN.md` → "Demand Classification" and "Behaviour Rules".
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import IntEnum


class DemandLevel(IntEnum):
    """Demand level for a stop's queue, per 01_AGENT_DESIGN.md State Variables.

    Defined as an ``IntEnum`` so the levels are ordered
    (``LOW < MEDIUM < HIGH < CRITICAL``). This lets downstream logic and the
    Block 1 Testing Session's "classification is monotonic in queue_count"
    property test compare levels directly, without changing the names in the spec.
    """

    LOW = 0
    MEDIUM = 1
    HIGH = 2
    CRITICAL = 3


def classify_demand(queue_count: int) -> DemandLevel:
    """Map a queue count to its demand level. Implements Block 1 Task 1 (TC07).

    Bands per 01_AGENT_DESIGN.md "Demand Classification" (boundaries exactly as the
    spec table defines them)::

        LOW       queue_count < 5          (0-4)
        MEDIUM    5 <= queue_count <= 15
        HIGH      16 <= queue_count <= 30
        CRITICAL  queue_count > 30         (31+)

    This is a pure ``count -> level`` mapping. It deliberately does NOT decide
    whether to broadcast — that is :func:`decide_broadcast` (Task 2).

    Raises:
        ValueError: if ``queue_count`` is negative. A queue count cannot be below
            zero; surfacing it is preferable to silently bucketing it as LOW.
    """
    if queue_count < 0:
        raise ValueError(f"queue_count must be non-negative, got {queue_count}")
    if queue_count < 5:
        return DemandLevel.LOW
    if queue_count <= 15:
        return DemandLevel.MEDIUM
    if queue_count <= 30:
        return DemandLevel.HIGH
    return DemandLevel.CRITICAL


#: Rule 6 keepalive cadence (01_AGENT_DESIGN.md Behaviour Rule 6): while demand is
#: HIGH or CRITICAL, a broadcast should go out at least this often even without a
#: level change.
KEEPALIVE_INTERVAL = timedelta(seconds=30)


@dataclass(frozen=True)
class BroadcastDecision:
    """Outcome of the per-tick broadcast decision (Block 1 Task 2).

    Attributes:
        should_broadcast: whether a broadcast should fire this tick.
        priority: the CRITICAL priority flag — only True on a CRITICAL broadcast.
        is_keepalive: whether the Rule-6 30s keepalive trigger was due this tick
            (for tracing; see the subsumption note in :func:`decide_broadcast`).
        reason: short human-readable explanation, for logs/traces.
    """

    should_broadcast: bool
    priority: bool
    is_keepalive: bool
    reason: str


def decide_broadcast(
    current_level: DemandLevel,
    previous_level: DemandLevel | None,
    now: datetime,
    last_broadcast_time: datetime | None,
    keepalive_interval: timedelta = KEEPALIVE_INTERVAL,
) -> BroadcastDecision:
    """Decide whether the Stop Agent should broadcast this tick. Implements Block 1 Task 2.

    Realises 01_AGENT_DESIGN.md's Classification "Action" column plus Behaviour
    Rules 3 and 6::

        LOW       never broadcast
        MEDIUM    broadcast only when the level changed since the last tick
        HIGH      broadcast every tick
        CRITICAL  broadcast every tick, with the priority flag set

    Rule 3 (general gate) is realised as "broadcast when level >= HIGH OR the level
    changed", with LOW's "never" taking precedence over the change clause — a change
    *into* LOW does not broadcast. Rule 6 (keepalive) is a secondary, time-based
    trigger: while level >= HIGH, a broadcast is also due once ``keepalive_interval``
    has elapsed since the last broadcast. The two are combined with OR, so the
    keepalive can never suppress the every-tick HIGH/CRITICAL path.

    A ``previous_level`` of ``None`` (first observation) counts as a change.

    This is a pure decision: no MQTT publish (later wiring), and no interchange
    (Task 3) or is_claimed (Task 8) suppression — those gate this decision at the
    call site, leaving this function free of that logic.
    """
    changed = previous_level is None or current_level != previous_level

    # Primary tick-level rule (Action column + Rule 3).
    if current_level == DemandLevel.LOW:
        tick_broadcast = False
    elif current_level >= DemandLevel.HIGH:
        tick_broadcast = True            # every tick
    else:  # MEDIUM
        tick_broadcast = changed         # on change only

    # Secondary keepalive (Rule 6): only while >= HIGH, and only once the interval
    # has elapsed since the last broadcast.
    keepalive_due = (
        current_level >= DemandLevel.HIGH
        and last_broadcast_time is not None
        and (now - last_broadcast_time) >= keepalive_interval
    )

    should_broadcast = tick_broadcast or keepalive_due
    priority = should_broadcast and current_level == DemandLevel.CRITICAL

    if not should_broadcast:
        reason = (
            "LOW: never broadcasts"
            if current_level == DemandLevel.LOW
            else "MEDIUM: level unchanged, suppressed"
        )
    elif tick_broadcast and current_level >= DemandLevel.HIGH:
        reason = f"{current_level.name}: broadcast every tick"
    elif tick_broadcast:  # MEDIUM on change
        reason = "MEDIUM: level changed"
    else:
        # Keepalive drove it with no tick-rule broadcast. Not reachable while HIGH/
        # CRITICAL broadcast every tick (see report's subsumption note); kept for the
        # case where the every-tick path is later gated (e.g. Task 8 suppression).
        reason = f"{current_level.name}: keepalive ({keepalive_interval.total_seconds():.0f}s)"

    return BroadcastDecision(
        should_broadcast=should_broadcast,
        priority=priority,
        is_keepalive=keepalive_due,
        reason=reason,
    )
