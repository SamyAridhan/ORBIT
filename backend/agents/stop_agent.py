"""Stop Agent logic for the ORBIT MAS backend (Corridor E).

Block 1 Task 1 scope: the demand-level classifier only (TC07). Broadcast /
MQTT behaviour, interchange suppression, adoption scaling, token rate-limiting
and the plausibility filter are later Block 1 tasks and are intentionally NOT
in this module yet.

See `docs_modules/01_AGENT_DESIGN.md` → "Demand Classification".
"""

from __future__ import annotations

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
    whether to broadcast — the table's "Action" column (no broadcast / on change /
    every tick) is Task 2's responsibility and must stay out of this function.

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
