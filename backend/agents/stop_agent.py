"""Stop Agent logic for the ORBIT MAS backend (Bus E first).

Design: docs_modules/01_AGENT_DESIGN.md "Stop Agent" (locked 11 Nov 2026).
Requirement IDs: docs_modules/14_SYSTEM_REQUIREMENTS.md.

Block 1 state of this module:
  Task 1  — demand level (display colour only): classify_demand + DemandLevel.   TC101, TC102
  Task 2R — the per-tick state the Stop Agent publishes, built at EVERY level:
            StopState + build_stop_state. (Task 9 "state message" pulled forward
            and merged here.) There is deliberately no "should I report?" gate.   TC101
  Task 3R — CP and Jalan Amal: app signals there count like anywhere else; the
            only special case is that no schedule-based `expected` number is
            produced for them: NO_EXPECTED_STOP_IDS + produces_expected.          TC108

  Task 4  — the waiting count from app signals: one SignalRecord per token in a
            SignalBook (one book per stop + route). expire_signals,
            waiting_count, waiting_app_from_book. Feeds StopState.waiting_app. R1, TC107
  Task 5  — signal types (`initial`, `still_waiting`, `transfer`) as updates to
            that record, the lost-track rule, and the two times on a record:
            apply_signal (add_initial_signal is its `initial` shorthand).  TC103, TC150-152

Not here yet: the after-the-bus transitions, the per-departure snapshot and
left_behind attachment (Task 6), the strange-count flag (Task 7), the move
between two books on a transfer (Task 8). Until then those fields carry plain
defaults. MQTT publishing is Block 5.

This module never imports from simulation/ — agents must not know the simulator
exists (AGENTS_BACKEND.md section 4).
"""

from __future__ import annotations

from dataclasses import dataclass, replace
from datetime import datetime, timedelta
from enum import Enum, IntEnum
from types import MappingProxyType
from typing import Any, Mapping

from config.thresholds import SIGNAL_EXPIRY


# ---------------------------------------------------------------------------
# Task 1 — demand level (a colour, nothing more)
# ---------------------------------------------------------------------------


class DemandLevel(IntEnum):
    """Demand level of a stop's count, per 01 "Demand level — a colour, nothing more".

    Levels are shown on the dashboard and in the app. They trigger nothing (R1).
    Defined as an ``IntEnum`` so the levels are ordered (``LOW < MEDIUM < HIGH <
    CRITICAL``) for the Block 1 Testing Session's monotonicity property test.
    """

    LOW = 0
    MEDIUM = 1
    HIGH = 2
    CRITICAL = 3


def classify_demand(queue_count: int) -> DemandLevel:
    """Map a count to its display level. Implements Block 1 Task 1 (TC101, TC102).

    Bands per 01 (cut-offs are placeholders)::

        LOW       count < 5          (0-4)
        MEDIUM    5 <= count <= 15
        HIGH      16 <= count <= 30
        CRITICAL  count > 30         (31+)

    Pure ``count -> level``. It does not decide anything — nothing does, on a level.

    Raises:
        ValueError: if ``queue_count`` is negative. A count cannot be below zero;
            surfacing it is preferable to silently bucketing it as LOW.
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


# ---------------------------------------------------------------------------
# Task 3R — CP and Jalan Amal: counted like anywhere else, but no `expected`
# ---------------------------------------------------------------------------

#: Stops for which the Stop Agent does NOT produce a schedule-based ``expected``
#: number (01 Stop Agent Rule 3; TC108). Seven routes pass through CP; with nobody
#: using the app there ORBIT can't tell who wants which bus, so it doesn't guess.
#: App signals at these stops count exactly like anywhere else (S6) — this set
#: silences nothing. It is also NOT module 02's routing ``INTERCHANGE_NODES`` list
#: (which adds n24 and ktc): that is a routing fact and says nothing about demand.
NO_EXPECTED_STOP_IDS = frozenset({"cp", "jalan_amal"})


def produces_expected(stop_id: str) -> bool:
    """Whether a schedule-based ``expected`` number is produced for ``stop_id``.

    Implements 01 Stop Agent Rule 3 (TC108). Keys off the canonical stop id,
    case-insensitively, so the set stays in one place.
    """
    return stop_id.lower() not in NO_EXPECTED_STOP_IDS


# ---------------------------------------------------------------------------
# Task 2R (+ Task 9) — the state published on every report tick
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class StopState:
    """What one Stop Agent (stop + route) publishes on every report tick.

    Fields per 01 Stop Agent "State" and the 13 Nov ruling that ``left_behind`` is
    kept per departure. Build it with :func:`build_stop_state`, which derives
    ``level`` and ``left_behind`` and applies Rule 3 — don't construct it by hand.

    Attributes:
        stop_id, corridor_id: which stop, for which route.
        waiting_app: students who picked this route here in the app and haven't boarded.
        left_behind: total of ``left_behind_by_departure`` (the overflow trigger's half).
        left_behind_by_departure: ``{departure_id: count}`` — a "still waiting" tap
            attaches to the most recent departure of this route from this stop.
        expected: schedule-based estimate; ``None`` at CP and Jalan Amal. Never a trigger.
        estimated_total: ``waiting_app`` scaled by the learned app share; ``None`` until
            the share is known (R12).
        app_share: learned share of riders here who use the app; ``None`` until learned.
        level: display colour, from the best count available (``estimated_total`` if
            known, otherwise ``waiting_app``).
        flagged: the count looks strange (Task 7). Flagged counts are kept, never dropped.
        last_bus_visit_time: when a bus last departed this stop; ``None`` if never.
    """

    stop_id: str
    corridor_id: str
    waiting_app: int
    left_behind: int
    left_behind_by_departure: Mapping[str, int]
    expected: int | None
    estimated_total: int | None
    app_share: float | None
    level: DemandLevel
    flagged: bool
    last_bus_visit_time: datetime | None

    def to_dict(self) -> dict[str, Any]:
        """The state message's ``data`` payload (03 "Stop state" shape).

        ``level`` is serialised by name (``"MEDIUM"``); the by-departure map is a
        plain dict. ``minutes_since_last_bus`` is derived at send time, not here.
        """
        return {
            "stop_id": self.stop_id,
            "corridor_id": self.corridor_id,
            "waiting_app": self.waiting_app,
            "left_behind": self.left_behind,
            "left_behind_by_departure": dict(self.left_behind_by_departure),
            "expected": self.expected,
            "estimated_total": self.estimated_total,
            "app_share": self.app_share,
            "level": self.level.name,
            "flagged": self.flagged,
            "last_bus_visit_time": (
                self.last_bus_visit_time.isoformat() if self.last_bus_visit_time else None
            ),
        }


def build_stop_state(
    stop_id: str,
    corridor_id: str,
    waiting_app: int = 0,
    *,
    left_behind_by_departure: Mapping[str, int] | None = None,
    expected: int | None = None,
    estimated_total: int | None = None,
    app_share: float | None = None,
    flagged: bool = False,
    last_bus_visit_time: datetime | None = None,
) -> StopState:
    """Build the per-tick state. Implements Block 1 Task 2R / Task 9 (TC101, TC108).

    Called on every report tick, at every level — there is no condition under which a
    Stop Agent stays silent (01 Stop Agent Rule 1; R1). The level is a by-product of
    the count, never a reason to publish or not.

    - ``level`` = :func:`classify_demand` of the best count available: ``estimated_total``
      once the app share is known, otherwise ``waiting_app`` (01 "Demand level").
    - ``left_behind`` = sum of ``left_behind_by_departure``.
    - Rule 3: for CP and Jalan Amal ``expected`` is forced to ``None`` whatever the
      caller passed — this builder is the one place the Stop Agent produces its state,
      so the rule is enforced here rather than in every caller.

    Raises:
        ValueError: on a negative ``waiting_app``, ``estimated_total`` or per-departure
            count. Counts cannot be below zero.
    """
    if waiting_app < 0:
        raise ValueError(f"waiting_app must be non-negative, got {waiting_app}")
    if estimated_total is not None and estimated_total < 0:
        raise ValueError(f"estimated_total must be non-negative, got {estimated_total}")

    by_departure = dict(left_behind_by_departure or {})
    for departure_id, count in by_departure.items():
        if count < 0:
            raise ValueError(
                f"left_behind for departure {departure_id!r} must be non-negative, got {count}"
            )

    best_count = estimated_total if estimated_total is not None else waiting_app

    return StopState(
        stop_id=stop_id,
        corridor_id=corridor_id,
        waiting_app=waiting_app,
        left_behind=sum(by_departure.values()),
        left_behind_by_departure=MappingProxyType(by_departure),
        expected=expected if produces_expected(stop_id) else None,
        estimated_total=estimated_total,
        app_share=app_share,
        level=classify_demand(best_count),
        flagged=flagged,
        last_bus_visit_time=last_bus_visit_time,
    )


# ---------------------------------------------------------------------------
# Tasks 4 + 5 — app signals: one record per token, three signal types,
#               the lost-track rule, two times on a record
# ---------------------------------------------------------------------------


class SignalStatus(str, Enum):
    """What ORBIT currently believes about one person (one token) at a stop + route.

    ``WAITING`` and ``LEFT_BEHIND`` both count as waiting — a left-behind person is
    still at the stop and hasn't boarded; ``LEFT_BEHIND`` only adds *which bus* left
    them (Task 6). ``ASSUMED_BOARDED`` is the one status that does not count. One
    record per token means one token is never counted more than once at a stop and
    route (01 "One phone is one person"; TC150).
    """

    WAITING = "waiting"
    ASSUMED_BOARDED = "assumed_boarded"
    LEFT_BEHIND = "left_behind"


class SignalType(str, Enum):
    """The three app signals (01 "One phone is one person"; `demand/signal`).

    ``INITIAL`` — "I'm waiting": a new person, or nothing if ORBIT already has them.
    ``STILL_WAITING`` — "the bus passed and I'm still here": an update about a known
    person. ``TRANSFER`` — "I've arrived here by changing bus": likewise an update;
    the removal from the other book is Task 8. Neither update ever adds a second
    person.
    """

    INITIAL = "initial"
    STILL_WAITING = "still_waiting"
    TRANSFER = "transfer"


@dataclass(frozen=True)
class SignalRecord:
    """One person's signal at one stop for one route, keyed by their anonymous token.

    Two times, on purpose (01 Stop Agent "Built shape"):

    - ``started_waiting_at`` — when ORBIT first saw this person waiting. **Never
      refreshed by a tap.** It decides which departures could have left them behind
      (a bus can only have left someone who was already waiting when it left).
    - ``last_heard_at`` — the latest accepted ``still_waiting`` / ``transfer`` (or the
      tap that created or restored the record). **Expiry runs on this one.**

    Attributes:
        token: the app's anonymous token. No name, no student ID (S9).
        destination: the stop they picked, if the app sent one.
        status: see :class:`SignalStatus`.
        left_by_departure: the departure that left them, once Task 6 attaches one.
    """

    token: str
    started_waiting_at: datetime
    last_heard_at: datetime
    destination: str | None = None
    status: SignalStatus = SignalStatus.WAITING
    left_by_departure: str | None = None


@dataclass(frozen=True)
class SignalBook:
    """All known tokens for one Stop Agent (one stop, one route). Immutable.

    ``records`` is a read-only ``token -> SignalRecord`` view. Every operation
    below returns a new book and leaves its input untouched, so the functions
    are pure: time is passed in, nothing is read from a clock or from
    ``simulation/``.
    """

    stop_id: str
    corridor_id: str
    records: Mapping[str, SignalRecord]


def new_signal_book(stop_id: str, corridor_id: str) -> SignalBook:
    """An empty book for ``stop_id`` on route ``corridor_id``."""
    return SignalBook(stop_id=stop_id, corridor_id=corridor_id, records=MappingProxyType({}))


def _with_record(book: SignalBook, record: SignalRecord) -> SignalBook:
    records = dict(book.records)
    records[record.token] = record
    return SignalBook(
        stop_id=book.stop_id, corridor_id=book.corridor_id, records=MappingProxyType(records)
    )


def apply_signal(
    book: SignalBook,
    token: str,
    signal_type: SignalType,
    now: datetime,
    destination: str | None = None,
) -> SignalBook:
    """Apply one app signal to the book. Implements Block 1 Task 5 (Task 4's `initial`).

    The whole rule set, from 01 "One phone is one person" and the 13 Nov rulings:

    - **Unknown token** (never seen, or expired): any signal type creates one
      ``WAITING`` record with both times = ``now``. A `still_waiting` from a token
      ORBIT has forgotten still counts, as one person — expiry is bookkeeping, not
      evidence that nobody is there (TC151).
    - **Known, ``ASSUMED_BOARDED``:** any signal type *restores* the person to
      ``WAITING`` — "any tap from a person ORBIT has lost track of puts them back,
      as one person" (TC152). ``started_waiting_at`` is kept; ``last_heard_at`` =
      ``now``; ``left_by_departure`` is cleared.
    - **Known, ``WAITING`` or ``LEFT_BEHIND``:** `initial` changes **nothing** — not
      the status, not either clock (TC103: a repeat within the record's life is
      ignored silently). `still_waiting` and `transfer` refresh ``last_heard_at``
      only; status is left for Task 6 to decide.

    A ``destination`` given on a create or restore is stored; on a refresh it
    replaces the stored one if given. Never adds a second record for a token.

    Raises:
        ValueError: on an empty token.
    """
    if not token:
        raise ValueError("token must be a non-empty string")

    existing = book.records.get(token)

    if existing is None:
        return _with_record(
            book,
            SignalRecord(
                token=token, started_waiting_at=now, last_heard_at=now, destination=destination
            ),
        )

    if existing.status is SignalStatus.ASSUMED_BOARDED:
        return _with_record(
            book,
            replace(
                existing,
                status=SignalStatus.WAITING,
                last_heard_at=now,
                left_by_departure=None,
                destination=destination if destination is not None else existing.destination,
            ),
        )

    if signal_type is SignalType.INITIAL:
        return book

    return _with_record(
        book,
        replace(
            existing,
            last_heard_at=now,
            destination=destination if destination is not None else existing.destination,
        ),
    )


def add_initial_signal(
    book: SignalBook, token: str, now: datetime, destination: str | None = None
) -> SignalBook:
    """Record an ``initial`` ("I'm waiting") signal. Shorthand for :func:`apply_signal`."""
    return apply_signal(book, token, SignalType.INITIAL, now, destination)


def expire_signals(
    book: SignalBook, now: datetime, expiry: timedelta = SIGNAL_EXPIRY
) -> SignalBook:
    """Drop every record last heard from ``expiry`` or more before ``now``.

    Implements 01 "When a signal stops counting — the signal gets too old". Runs on
    ``last_heard_at``, so a `still_waiting` keeps a person alive and a repeat
    `initial` does not (it never touches the clock). ``expiry`` defaults to the one
    30-minute placeholder in ``config/thresholds.py``, which is also the
    one-signal-per-token window: after it, a new `initial` is a fresh person. A
    record exactly ``expiry`` old is dropped. Applies to every status.
    """
    kept = {t: r for t, r in book.records.items() if now - r.last_heard_at < expiry}
    if len(kept) == len(book.records):
        return book
    return SignalBook(
        stop_id=book.stop_id, corridor_id=book.corridor_id, records=MappingProxyType(kept)
    )


def waiting_count(book: SignalBook) -> int:
    """How many people the book holds who haven't boarded: every status except
    ``ASSUMED_BOARDED``. A left-behind person is still waiting. One per token."""
    return sum(1 for r in book.records.values() if r.status is not SignalStatus.ASSUMED_BOARDED)


def waiting_app_from_book(
    book: SignalBook, now: datetime, expiry: timedelta = SIGNAL_EXPIRY
) -> int:
    """The ``waiting_app`` number for a report tick: expire stale signals, then count.

    This is what feeds :func:`build_stop_state` (R1; the Stop-Agent half of TC107
    through a real count). It does not change the caller's book — call
    :func:`expire_signals` and keep the result if the stale records should go.
    """
    return waiting_count(expire_signals(book, now, expiry))
