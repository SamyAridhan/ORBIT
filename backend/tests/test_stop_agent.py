"""Unit tests for the Stop Agent. Block 1 (design locked 11 Nov 2026).

Task 1  — demand level: every band and fencepost (TC102), negative raises.
Task 3R — CP / Jalan Amal: no `expected` there, everything else unchanged (TC108);
          n24 / ktc are routing nodes, not special here.
Task 2R — StopState is built at every level; nothing gates it (TC101).
Task 4  — waiting count from app signals: one record per token, expiry, feeds
          waiting_app (R1; TC107's Stop-Agent half through a real count).
Task 5  — signal types, the lost-track rule, two times on a record (TC103,
          TC151, TC152) and the TC150 state machine (Hypothesis).

Run from backend/ with flat imports (from agents.stop_agent ...).
"""

from dataclasses import FrozenInstanceError, replace
from datetime import datetime, timedelta

import pytest

from hypothesis import settings
from hypothesis import strategies as st
from hypothesis.stateful import RuleBasedStateMachine, invariant, rule

from agents.stop_agent import (
    NO_EXPECTED_STOP_IDS,
    DemandLevel,
    SignalBook,
    SignalRecord,
    SignalStatus,
    SignalType,
    StopState,
    add_initial_signal,
    apply_signal,
    build_stop_state,
    classify_demand,
    expire_signals,
    new_signal_book,
    produces_expected,
    waiting_app_from_book,
    waiting_count,
)
from config.thresholds import SIGNAL_EXPIRY

# ---------------------------------------------------------------------------
# Task 1 — demand level (TC102)
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "count, expected_level",
    [
        (0, DemandLevel.LOW),         # bottom of range
        (3, DemandLevel.LOW),         # TC101's count
        (4, DemandLevel.LOW),         # top edge of LOW (< 5)
        (5, DemandLevel.MEDIUM),      # TC102: bottom edge of MEDIUM
        (10, DemandLevel.MEDIUM),     # mid MEDIUM
        (15, DemandLevel.MEDIUM),     # TC102: top edge of MEDIUM (<= 15)
        (16, DemandLevel.HIGH),       # TC102: bottom edge of HIGH
        (25, DemandLevel.HIGH),       # mid HIGH
        (30, DemandLevel.HIGH),       # TC102: top edge of HIGH (<= 30)
        (31, DemandLevel.CRITICAL),   # TC102: bottom edge of CRITICAL (> 30)
        (100, DemandLevel.CRITICAL),  # well into CRITICAL
    ],
)
def test_classify_demand_bands_and_boundaries(count, expected_level):
    assert classify_demand(count) == expected_level


def test_demand_level_is_ordered():
    # LOW < MEDIUM < HIGH < CRITICAL — the Testing Session's monotonicity property needs this.
    assert DemandLevel.LOW < DemandLevel.MEDIUM < DemandLevel.HIGH < DemandLevel.CRITICAL


def test_negative_queue_count_raises():
    # TC102: a negative count raises rather than being bucketed as LOW.
    with pytest.raises(ValueError):
        classify_demand(-1)


# ---------------------------------------------------------------------------
# Task 3R — CP and Jalan Amal: no `expected`, nothing else special (TC108)
# ---------------------------------------------------------------------------


def test_cp_and_jalan_amal_produce_no_expected():
    assert NO_EXPECTED_STOP_IDS == frozenset({"cp", "jalan_amal"})
    assert produces_expected("cp") is False
    assert produces_expected("jalan_amal") is False


def test_no_expected_lookup_is_case_insensitive():
    assert produces_expected("CP") is False
    assert produces_expected("Jalan_Amal") is False


def test_routing_shared_nodes_and_ordinary_stops_do_produce_expected():
    # Ordinary stops produce `expected`...
    assert produces_expected("kdoj") is True
    assert produces_expected("kdse") is True
    assert produces_expected("cluster_t08") is True
    # ...and n24 / ktc are module-02 ROUTING shared nodes, not demand-special stops.
    # That routing list must never be reused for anything about counting people.
    assert produces_expected("n24") is True
    assert produces_expected("ktc") is True


@pytest.mark.parametrize("stop_id", ["cp", "jalan_amal", "CP"])
def test_tc108_expected_is_none_at_cp_and_jalan_amal_even_if_supplied(stop_id):
    # TC108: whatever the schedule model offers, the state carries no `expected` here.
    state = build_stop_state(stop_id, "E", waiting_app=4, expected=22)
    assert state.expected is None


def test_tc108_other_stops_keep_expected():
    assert build_stop_state("kdoj", "E", waiting_app=4, expected=22).expected == 22


@pytest.mark.parametrize("count", [0, 3, 9, 20, 45])
def test_cp_signals_count_like_anywhere_else(count):
    # S6 (the half of TC107 that lives in the Stop Agent): a student at CP who picks
    # Bus E is counted for Bus E at CP, at every level. Nothing is silenced.
    state = build_stop_state("cp", "E", waiting_app=count)
    assert state.waiting_app == count
    assert state.level == classify_demand(count)


# ---------------------------------------------------------------------------
# Task 2R / Task 9 — the state is built on every tick, at every level (TC101)
# ---------------------------------------------------------------------------

T0 = datetime(2026, 3, 23, 7, 0, 0)  # arbitrary fixed sim time


def test_tc101_low_stop_still_produces_a_state():
    # TC101: 3 people waiting -> level LOW, and the state is still produced.
    state = build_stop_state("kdoj", "E", waiting_app=3)
    assert isinstance(state, StopState)
    assert state.level is DemandLevel.LOW
    assert state.waiting_app == 3


@pytest.mark.parametrize("count", [0, 4, 5, 15, 16, 30, 31, 100])
def test_state_is_produced_at_every_level(count):
    # No level, high or low, changes whether a state exists. Levels trigger nothing.
    state = build_stop_state("kdoj", "E", waiting_app=count)
    assert isinstance(state, StopState)
    assert state.level == classify_demand(count)


def test_level_comes_from_classifier_on_waiting_app_by_default():
    assert build_stop_state("kdoj", "E", waiting_app=20).level is DemandLevel.HIGH
    assert build_stop_state("kdoj", "E", waiting_app=0).level is DemandLevel.LOW


def test_level_uses_estimated_total_once_app_share_is_known():
    # 01: the level uses the best count available — estimated_total once known.
    state = build_stop_state("kdoj", "E", waiting_app=3, estimated_total=20, app_share=0.15)
    assert state.level is DemandLevel.HIGH          # from 20, not from 3
    assert state.waiting_app == 3                    # the raw app count is still carried
    assert state.estimated_total == 20
    assert state.app_share == 0.15


def test_defaults_for_fields_later_tasks_feed():
    state = build_stop_state("klg", "E")
    assert state.stop_id == "klg" and state.corridor_id == "E"
    assert state.waiting_app == 0
    assert state.left_behind == 0
    assert dict(state.left_behind_by_departure) == {}
    assert state.expected is None
    assert state.estimated_total is None
    assert state.app_share is None
    assert state.flagged is False
    assert state.last_bus_visit_time is None
    assert state.level is DemandLevel.LOW


def test_left_behind_total_is_sum_of_by_departure():
    state = build_stop_state(
        "kdse", "E", waiting_app=7, left_behind_by_departure={"E1-0730": 4, "E3-0740": 3}
    )
    assert state.left_behind == 7
    assert dict(state.left_behind_by_departure) == {"E1-0730": 4, "E3-0740": 3}


def test_by_departure_map_is_read_only_and_copied():
    source = {"E1-0730": 2}
    state = build_stop_state("kdse", "E", left_behind_by_departure=source)
    source["E1-0730"] = 99                                  # mutating the input...
    assert state.left_behind_by_departure["E1-0730"] == 2   # ...doesn't touch the state
    with pytest.raises(TypeError):
        state.left_behind_by_departure["E1-0730"] = 5       # and the view can't be written


def test_flag_and_last_visit_are_carried_through():
    state = build_stop_state("kdoj", "E", waiting_app=40, expected=5, flagged=True,
                             last_bus_visit_time=T0)
    assert state.flagged is True          # flagged, and the count is kept (40), never dropped
    assert state.waiting_app == 40
    assert state.last_bus_visit_time == T0


def test_state_is_frozen():
    state = build_stop_state("kdoj", "E", waiting_app=1)
    with pytest.raises(FrozenInstanceError):
        state.waiting_app = 2  # type: ignore[misc]


@pytest.mark.parametrize(
    "kwargs",
    [
        {"waiting_app": -1},
        {"estimated_total": -1},
        {"left_behind_by_departure": {"E1-0730": -1}},
    ],
)
def test_negative_counts_raise(kwargs):
    with pytest.raises(ValueError):
        build_stop_state("kdoj", "E", **kwargs)


def test_to_dict_matches_message_shape():
    state = build_stop_state("kdoj", "E", waiting_app=9, expected=22,
                             left_behind_by_departure={"E1-0730": 1}, last_bus_visit_time=T0)
    d = state.to_dict()
    assert d == {
        "stop_id": "kdoj",
        "corridor_id": "E",
        "waiting_app": 9,
        "left_behind": 1,
        "left_behind_by_departure": {"E1-0730": 1},
        "expected": 22,
        "estimated_total": None,
        "app_share": None,
        "level": "MEDIUM",                      # serialised by name, per 03's shape
        "flagged": False,
        "last_bus_visit_time": "2026-03-23T07:00:00",
    }
    assert type(d["left_behind_by_departure"]) is dict   # a plain dict, not the read-only view


# ---------------------------------------------------------------------------
# Task 4 — waiting count from app signals (R1)
# ---------------------------------------------------------------------------

MIN = timedelta(minutes=1)


def _book_with(stop_id, corridor_id, tokens, at):
    book = new_signal_book(stop_id, corridor_id)
    for t in tokens:
        book = add_initial_signal(book, t, at)
    return book


def _with_status(book, token, status, **changes):
    recs = dict(book.records)
    recs[token] = replace(recs[token], status=status, **changes)
    return SignalBook(book.stop_id, book.corridor_id, recs)


def test_new_book_is_empty_and_counts_zero():
    book = new_signal_book("kdoj", "E")
    assert book.stop_id == "kdoj" and book.corridor_id == "E"
    assert dict(book.records) == {}
    assert waiting_count(book) == 0


def test_initial_signal_adds_one_waiting_record_with_both_times():
    book = add_initial_signal(new_signal_book("kdoj", "E"), "tok-a", T0, destination="cluster_t02")
    assert waiting_count(book) == 1
    rec = book.records["tok-a"]
    assert rec.token == "tok-a"
    assert rec.started_waiting_at == T0
    assert rec.last_heard_at == T0
    assert rec.destination == "cluster_t02"
    assert rec.status is SignalStatus.WAITING
    assert rec.left_by_departure is None


def test_distinct_tokens_are_distinct_people():
    assert waiting_count(_book_with("kdoj", "E", ["a", "b", "c"], T0)) == 3


def test_tc103_repeat_initial_within_the_window_is_ignored_and_untouched():
    # TC103: the same token signals twice within 30 min -> counted once. The repeat
    # does not add, does not refresh either clock, does not overwrite the destination.
    first = add_initial_signal(new_signal_book("kdoj", "E"), "tok-a", T0, destination="cluster_t02")
    again = add_initial_signal(first, "tok-a", T0 + 10 * MIN, destination="cluster_t08")
    assert waiting_count(again) == 1
    assert again.records["tok-a"] == first.records["tok-a"]
    assert again is first                                   # literally nothing changed


def test_empty_token_raises():
    with pytest.raises(ValueError):
        add_initial_signal(new_signal_book("kdoj", "E"), "", T0)


def test_operations_are_pure_and_the_book_is_read_only():
    book = _book_with("kdoj", "E", ["a"], T0)
    before = dict(book.records)
    later = add_initial_signal(book, "b", T0)
    expired = expire_signals(later, T0 + timedelta(hours=2))
    assert dict(book.records) == before          # input untouched by add...
    assert waiting_count(later) == 2             # ...and by expire
    assert waiting_count(expired) == 0
    with pytest.raises(TypeError):
        book.records["z"] = SignalRecord("z", T0, T0)  # type: ignore[index]
    with pytest.raises(FrozenInstanceError):
        book.stop_id = "klg"  # type: ignore[misc]


@pytest.mark.parametrize(
    "age, kept",
    [
        (timedelta(0), True),
        (timedelta(minutes=29, seconds=59), True),   # a tick younger than expiry: kept
        (timedelta(minutes=30), False),               # exactly expiry old: dropped
        (timedelta(minutes=31), False),
        (timedelta(hours=3), False),
    ],
)
def test_expiry_boundary_at_the_one_placeholder(age, kept):
    assert SIGNAL_EXPIRY == timedelta(minutes=30)     # the one 30-min setting in config/thresholds.py
    book = add_initial_signal(new_signal_book("kdoj", "E"), "a", T0)
    assert ("a" in expire_signals(book, T0 + age).records) is kept


def test_expiry_keeps_fresh_and_drops_stale_in_one_book():
    book = new_signal_book("kdoj", "E")
    book = add_initial_signal(book, "old", T0)
    book = add_initial_signal(book, "mid", T0 + 10 * MIN)
    book = add_initial_signal(book, "new", T0 + 29 * MIN)
    after = expire_signals(book, T0 + 35 * MIN)
    assert set(after.records) == {"mid", "new"}
    assert after.records["mid"] == book.records["mid"]   # survivors are unchanged
    assert after.stop_id == "kdoj" and after.corridor_id == "E"


def test_expiry_honours_a_custom_window():
    book = add_initial_signal(new_signal_book("kdoj", "E"), "a", T0)
    assert "a" in expire_signals(book, T0 + 45 * MIN, expiry=timedelta(hours=1)).records
    assert "a" not in expire_signals(book, T0 + 5 * MIN, expiry=5 * MIN).records


def test_expiry_applies_to_every_status():
    # A stale record is stale whatever ORBIT last believed about the person.
    book = _book_with("kdoj", "E", ["w", "b", "l"], T0)
    book = _with_status(book, "b", SignalStatus.ASSUMED_BOARDED)
    book = _with_status(book, "l", SignalStatus.LEFT_BEHIND, left_by_departure="dep-1")
    assert dict(expire_signals(book, T0 + 30 * MIN).records) == {}


def test_waiting_count_excludes_only_assumed_boarded():
    # waiting_app = people who haven't boarded. A LEFT_BEHIND person is still waiting;
    # only ASSUMED_BOARDED drops out. (Corrects Task 4, which counted WAITING only.)
    book = _book_with("kdoj", "E", ["w1", "w2", "b", "l"], T0)
    book = _with_status(book, "b", SignalStatus.ASSUMED_BOARDED)
    book = _with_status(book, "l", SignalStatus.LEFT_BEHIND, left_by_departure="dep-1")
    assert waiting_count(book) == 3


def test_waiting_app_from_book_expires_then_counts_without_changing_the_book():
    book = new_signal_book("kdse", "E")
    book = add_initial_signal(book, "stale", T0)
    book = add_initial_signal(book, "fresh", T0 + 20 * MIN)
    assert waiting_app_from_book(book, T0 + 31 * MIN) == 1
    assert set(book.records) == {"stale", "fresh"}     # the caller's book is untouched


def test_real_count_feeds_stop_state():
    # R1: the per-tick state carries the real waiting count. 7 tokens at KDSE -> 7, MEDIUM.
    book = _book_with("kdse", "E", [f"t{i}" for i in range(7)], T0)
    state = build_stop_state("kdse", "E", waiting_app=waiting_app_from_book(book, T0 + MIN))
    assert state.waiting_app == 7
    assert state.level is DemandLevel.MEDIUM


def test_tc107_stop_agent_half_through_a_real_count_at_cp():
    # TC107 (Stop-Agent half): three students at CP who picked Bus E are counted
    # for Bus E at CP, through the real signal book; no `expected` is produced there.
    book = _book_with("cp", "E", ["a", "b", "c"], T0)
    state = build_stop_state("cp", "E", waiting_app=waiting_app_from_book(book, T0), expected=12)
    assert state.waiting_app == 3
    assert state.level is DemandLevel.LOW
    assert state.expected is None


# ---------------------------------------------------------------------------
# Task 5 — signal types, the lost-track rule, two times on a record
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("kind", list(SignalType))
def test_any_signal_from_an_unknown_token_creates_one_waiting_person(kind):
    book = apply_signal(new_signal_book("kdoj", "E"), "tok", kind, T0, destination="cluster_t02")
    rec = book.records["tok"]
    assert waiting_count(book) == 1
    assert rec.status is SignalStatus.WAITING
    assert rec.started_waiting_at == T0 and rec.last_heard_at == T0
    assert rec.destination == "cluster_t02"


def test_tc151_still_waiting_from_an_expired_token_creates_the_record():
    # TC151: the record expired (forgotten); a late "still waiting" creates it again,
    # counted as one person. Expiry is bookkeeping, not evidence that nobody is there.
    book = add_initial_signal(new_signal_book("kdoj", "E"), "tok", T0)
    book = expire_signals(book, T0 + 40 * MIN)
    assert waiting_count(book) == 0
    book = apply_signal(book, "tok", SignalType.STILL_WAITING, T0 + 40 * MIN)
    assert waiting_count(book) == 1
    rec = book.records["tok"]
    assert rec.started_waiting_at == T0 + 40 * MIN      # ORBIT had forgotten the original start
    assert rec.last_heard_at == T0 + 40 * MIN


def test_tc151_still_waiting_from_a_never_seen_token_creates_the_record():
    book = apply_signal(new_signal_book("kdoj", "E"), "ghost", SignalType.STILL_WAITING, T0)
    assert waiting_count(book) == 1
    assert book.records["ghost"].status is SignalStatus.WAITING


@pytest.mark.parametrize("kind", list(SignalType))
def test_tc152_any_tap_restores_an_assumed_boarded_person_as_one(kind):
    # TC152: ORBIT assumed they boarded; they tap "I'm waiting" (or anything) ->
    # restored like a "still waiting"; one person, never two; original start kept.
    book = add_initial_signal(new_signal_book("kdoj", "E"), "tok", T0, destination="cluster_t02")
    book = _with_status(book, "tok", SignalStatus.ASSUMED_BOARDED)
    assert waiting_count(book) == 0
    back = apply_signal(book, "tok", kind, T0 + 12 * MIN)
    rec = back.records["tok"]
    assert waiting_count(back) == 1 and len(back.records) == 1
    assert rec.status is SignalStatus.WAITING
    assert rec.started_waiting_at == T0                 # never refreshed
    assert rec.last_heard_at == T0 + 12 * MIN           # refreshed
    assert rec.left_by_departure is None
    assert rec.destination == "cluster_t02"             # kept when the tap gives none


def test_restore_clears_a_previous_departure_attachment():
    book = add_initial_signal(new_signal_book("kdoj", "E"), "tok", T0)
    book = _with_status(book, "tok", SignalStatus.ASSUMED_BOARDED, left_by_departure="dep-old")
    back = apply_signal(book, "tok", SignalType.STILL_WAITING, T0 + MIN)
    assert back.records["tok"].left_by_departure is None


@pytest.mark.parametrize("kind", [SignalType.STILL_WAITING, SignalType.TRANSFER])
@pytest.mark.parametrize("status", [SignalStatus.WAITING, SignalStatus.LEFT_BEHIND])
def test_updates_refresh_last_heard_only(kind, status):
    # still_waiting / transfer on a person ORBIT already has: last_heard_at moves,
    # started_waiting_at does not, status is left for Task 6, no second record.
    book = add_initial_signal(new_signal_book("kdoj", "E"), "tok", T0)
    book = _with_status(book, "tok", status, left_by_departure="dep-1" if status is SignalStatus.LEFT_BEHIND else None)
    after = apply_signal(book, "tok", kind, T0 + 7 * MIN)
    rec = after.records["tok"]
    assert len(after.records) == 1 and waiting_count(after) == 1
    assert rec.started_waiting_at == T0
    assert rec.last_heard_at == T0 + 7 * MIN
    assert rec.status is status
    assert rec.left_by_departure == book.records["tok"].left_by_departure


@pytest.mark.parametrize("status", [SignalStatus.WAITING, SignalStatus.LEFT_BEHIND])
def test_repeat_initial_on_a_known_person_changes_nothing_not_even_the_clock(status):
    book = add_initial_signal(new_signal_book("kdoj", "E"), "tok", T0)
    book = _with_status(book, "tok", status)
    assert apply_signal(book, "tok", SignalType.INITIAL, T0 + 29 * MIN) is book


def test_repeat_initial_taps_cannot_keep_a_record_alive():
    # Chatty's question: with expiry on last_heard_at, can repeat `initial` taps keep a
    # record alive past the window? No — they never touch the clock.
    book = add_initial_signal(new_signal_book("kdoj", "E"), "tok", T0)
    for m in (5, 10, 15, 20, 25, 29):
        book = apply_signal(book, "tok", SignalType.INITIAL, T0 + m * MIN)
    assert book.records["tok"].last_heard_at == T0
    assert "tok" not in expire_signals(book, T0 + 30 * MIN).records
    # ...after which a new `initial` is a fresh person with fresh times.
    fresh = add_initial_signal(expire_signals(book, T0 + 30 * MIN), "tok", T0 + 30 * MIN)
    assert fresh.records["tok"].started_waiting_at == T0 + 30 * MIN


def test_still_waiting_does_keep_a_record_alive():
    book = add_initial_signal(new_signal_book("kdoj", "E"), "tok", T0)
    book = apply_signal(book, "tok", SignalType.STILL_WAITING, T0 + 25 * MIN)
    assert "tok" in expire_signals(book, T0 + 40 * MIN).records
    assert "tok" not in expire_signals(book, T0 + 55 * MIN).records
    assert book.records["tok"].started_waiting_at == T0       # the start never moved


def test_update_with_a_destination_replaces_the_stored_one():
    book = add_initial_signal(new_signal_book("kdoj", "E"), "tok", T0, destination="cluster_t02")
    book = apply_signal(book, "tok", SignalType.TRANSFER, T0 + MIN, destination="cluster_t08")
    assert book.records["tok"].destination == "cluster_t08"
    book = apply_signal(book, "tok", SignalType.STILL_WAITING, T0 + 2 * MIN)
    assert book.records["tok"].destination == "cluster_t08"   # none given: kept


# ---------------------------------------------------------------------------
# TC150 — one token is never counted more than once at a stop and route
# (Hypothesis state machine over any mix of signals, expiry and Task 6's removal)
# ---------------------------------------------------------------------------

TOKENS = st.sampled_from(["t1", "t2", "t3", "t4", "t5"])
KINDS = st.sampled_from(list(SignalType))


class OneTokenOnePerson(RuleBasedStateMachine):
    """Model: per token, ORBIT believes exactly one of {absent, waiting, boarded}.

    The real book must never hold two records for one token, must count a token
    at most once, must never refresh `started_waiting_at` while a record exists,
    and must agree with the model about who counts.
    """

    def __init__(self):
        super().__init__()
        self.book = new_signal_book("kdoj", "E")
        self.now = T0
        self.model: dict[str, str] = {}       # token -> "waiting" | "boarded"
        self.started: dict[str, datetime] = {}

    @rule(token=TOKENS, kind=KINDS)
    def tap(self, token, kind):
        before = self.model.get(token)
        self.book = apply_signal(self.book, token, kind, self.now)
        if before is None:
            self.model[token] = "waiting"; self.started[token] = self.now
        elif before == "boarded":
            self.model[token] = "waiting"
        # before == "waiting": nothing changes in the model

    @rule(minutes=st.integers(min_value=1, max_value=20))
    def time_passes(self, minutes):
        self.now += minutes * MIN
        self.book = expire_signals(self.book, self.now)
        for t in list(self.model):
            if t not in self.book.records:
                del self.model[t]; del self.started[t]
        assert set(self.model) == set(self.book.records)

    @rule(token=TOKENS)
    def bus_leaves_and_they_dont_answer(self, token):
        # Task 6's removal, faked: a known waiting person is assumed boarded.
        if token in self.book.records and self.book.records[token].status is not SignalStatus.ASSUMED_BOARDED:
            self.book = _with_status(self.book, token, SignalStatus.ASSUMED_BOARDED)
            self.model[token] = "boarded"

    @invariant()
    def one_record_per_token_and_counted_at_most_once(self):
        assert all(r.token == t for t, r in self.book.records.items())
        assert waiting_count(self.book) <= len(self.book.records)
        assert waiting_count(self.book) == sum(1 for v in self.model.values() if v == "waiting")

    @invariant()
    def started_waiting_never_moves_and_never_after_last_heard(self):
        for t, r in self.book.records.items():
            assert r.started_waiting_at == self.started[t]
            assert r.started_waiting_at <= r.last_heard_at <= self.now


TestTC150OneTokenOnePerson = OneTokenOnePerson.TestCase
TestTC150OneTokenOnePerson.settings = settings(max_examples=200, stateful_step_count=40, deadline=None)
