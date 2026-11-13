"""Departure facts — the contract between the three agents.

Design: docs_modules/01_AGENT_DESIGN.md "Departure facts — the contract between
the three agents". Every time a bus leaves a stop, these facts exist. The Bus
Agent produces :class:`DepartureFacts` (Block 3), the Stop Agent adds its own
part to make a :class:`DepartureSnapshot` (Block 1 Task 6), and the Coordinator
reads the snapshot (Block 4). No agent owns this module, and it is never in
``simulation/``: tests on any one agent fake the others' parts with these shapes.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any


class TurnedAway(str, Enum):
    """The driver's answer to "Did you have to turn people away at the door?" (D1).

    ``None`` on :attr:`DepartureFacts.turned_people_away` means not asked or no
    answer. ``NO`` and unknown (``NOT_SURE`` / ``None``) must stay distinguishable:
    "not sure" is never "nobody was left".
    """

    YES = "yes"
    NO = "no"
    NOT_SURE = "not_sure"


@dataclass(frozen=True)
class DepartureFacts:
    """What the Bus Agent knows when one bus leaves one stop.

    Attributes:
        departure_id: identifies one trip of one bus leaving this stop. Must also
            work for a spare's extra trip, which has no timetable slot. The format
            is settled in Block 3; an opaque string until then.
        bus_id, corridor_id, stop_id: which bus, on which route, left which stop.
        departed_at: when it left.
        left_full: door counter at the seat count, or the driver tapped "full".
        boarded: how many boarded here, from the door counter; ``None`` when the
            bus has none.
        turned_people_away: see :class:`TurnedAway`.

    Raises:
        ValueError: on an empty ``departure_id`` or a negative ``boarded``.
    """

    departure_id: str
    bus_id: str
    corridor_id: str
    stop_id: str
    departed_at: datetime
    left_full: bool
    boarded: int | None = None
    turned_people_away: TurnedAway | None = None

    def __post_init__(self) -> None:
        if not self.departure_id:
            raise ValueError("departure_id must be a non-empty string")
        if self.boarded is not None and self.boarded < 0:
            raise ValueError(f"boarded must be non-negative, got {self.boarded}")


@dataclass(frozen=True)
class DepartureSnapshot:
    """One departure as the Stop Agent recorded it: the facts plus its own part.

    Attributes:
        facts: the Bus Agent's :class:`DepartureFacts`.
        waiting_at_departure: how many app users were waiting at that moment —
            counted *before* anyone is marked as boarded. The live count changes
            straight after, so this is the fixed number the Coordinator compares
            with door-counter boardings (Way 1).
        flagged_at_departure: whether that count was flagged as strange. A flagged
            count is never used for the automatic check (N4).
        still_waiting_tokens: the tokens that said "still waiting" against this
            departure. **Only ever grows** — this is the history, not the live
            state. Held as a set so one person tapping twice is one person. Tokens
            stay inside the Stop Agent; :meth:`to_dict` publishes the count only.
    """

    facts: DepartureFacts
    waiting_at_departure: int
    flagged_at_departure: bool = False
    still_waiting_tokens: frozenset[str] = frozenset()

    @property
    def still_waiting_taps(self) -> int:
        """How many people tapped "still waiting" against this departure (Way 2)."""
        return len(self.still_waiting_tokens)

    def to_dict(self) -> dict[str, Any]:
        """The contract's fields, for a message or a log. No tokens."""
        f = self.facts
        return {
            "departure_id": f.departure_id,
            "bus_id": f.bus_id,
            "corridor_id": f.corridor_id,
            "stop_id": f.stop_id,
            "departed_at": f.departed_at.isoformat(),
            "left_full": f.left_full,
            "boarded": f.boarded,
            "turned_people_away": (
                f.turned_people_away.value if f.turned_people_away is not None else None
            ),
            "waiting_at_departure": self.waiting_at_departure,
            "flagged_at_departure": self.flagged_at_departure,
            "still_waiting_taps": self.still_waiting_taps,
        }
