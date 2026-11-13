"""Unit tests for the Stop Agent. Block 1 (design locked 11 Nov 2026).

Task 1  — demand level: every band and fencepost (TC102), negative raises.
Task 3R — CP / Jalan Amal: no `expected` there, everything else unchanged (TC108);
          n24 / ktc are routing nodes, not special here.
Task 2R — StopState is built at every level; nothing gates it (TC101).
Task 4  — waiting count from app signals: one record per token, expiry, feeds
          waiting_app (R1; TC107's Stop-Agent half through a real count).

Run from backend/ with flat imports (from agents.stop_agent ...).
"""

from dataclasses import FrozenInstanceError, replace
from datetime import datetime, timedelta

import pytest

from agents.stop_agent import (
    NO_EXPECTED_STOP_IDS,
    DemandLevel,
    SignalBook,
    SignalRecord,
    SignalStatus,
    StopState,
    add_initial_signal,
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


def _book_with(stop_id, corridor_id, tokens, at):
    book = new_signal_book(stop_id, corridor_id)
    for t in tokens:
        book = add_initial_signal(book, t, at)
    return book


def test_new_book_is_empty_and_counts_zero():
    book = new_signal_book("kdoj", "E")
    assert book.stop_id == "kdoj" and book.corridor_id == "E"
    assert dict(book.records) == {}
    assert waiting_count(book) == 0


def test_initial_signal_adds_one_waiting_record():
    book = add_initial_signal(new_signal_book("kdoj", "E"), "tok-a", T0, destination="cluster_t02")
    assert waiting_count(book) == 1
    rec = book.records["tok-a"]
    assert rec.token == "tok-a"
    assert rec.received_at == T0
    assert rec.destination == "cluster_t02"
    assert rec.status is SignalStatus.WAITING
    assert rec.left_by_departure is None


def test_distinct_tokens_are_distinct_people():
    book = _book_with("kdoj", "E", ["a", "b", "c"], T0)
    assert waiting_count(book) == 3


def test_repeat_initial_from_same_token_is_ignored_and_untouched():
    # One token is never counted more than once at a stop and route (01, TC150's
    # invariant). A repeat does not add, and does not refresh the clock or
    # overwrite the destination.
    first = add_initial_signal(new_signal_book("kdoj", "E"), "tok-a", T0, destination="cluster_t02")
    again = add_initial_signal(first, "tok-a", T0 + timedelta(minutes=10), destination="cluster_t08")
    assert waiting_count(again) == 1
    assert again.records["tok-a"] == first.records["tok-a"]
    assert again.records["tok-a"].received_at == T0
    assert again.records["tok-a"].destination == "cluster_t02"


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
        book.records["z"] = SignalRecord("z", T0)  # type: ignore[index]
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
def test_expiry_boundary_at_default_placeholder(age, kept):
    assert SIGNAL_EXPIRY == timedelta(minutes=30)     # the placeholder in config/thresholds.py
    book = add_initial_signal(new_signal_book("kdoj", "E"), "a", T0)
    assert ("a" in expire_signals(book, T0 + age).records) is kept


def test_expiry_keeps_fresh_and_drops_stale_in_one_book():
    book = new_signal_book("kdoj", "E")
    book = add_initial_signal(book, "old", T0)
    book = add_initial_signal(book, "mid", T0 + timedelta(minutes=10))
    book = add_initial_signal(book, "new", T0 + timedelta(minutes=29))
    now = T0 + timedelta(minutes=35)
    after = expire_signals(book, now)
    assert set(after.records) == {"mid", "new"}
    assert after.records["mid"] == book.records["mid"]   # survivors are unchanged
    assert after.stop_id == "kdoj" and after.corridor_id == "E"


def test_expiry_honours_a_custom_window():
    book = add_initial_signal(new_signal_book("kdoj", "E"), "a", T0)
    assert "a" in expire_signals(book, T0 + timedelta(minutes=45), expiry=timedelta(hours=1)).records
    assert "a" not in expire_signals(book, T0 + timedelta(minutes=5), expiry=timedelta(minutes=5)).records


def test_expiry_applies_to_every_status():
    # A stale record is stale whatever ORBIT last believed about the person.
    book = _book_with("kdoj", "E", ["w", "b", "l"], T0)
    recs = dict(book.records)
    recs["b"] = replace(recs["b"], status=SignalStatus.ASSUMED_BOARDED)
    recs["l"] = replace(recs["l"], status=SignalStatus.LEFT_BEHIND, left_by_departure="E1-0730")
    book = SignalBook("kdoj", "E", recs)
    assert dict(expire_signals(book, T0 + timedelta(minutes=30)).records) == {}


def test_waiting_count_counts_only_waiting_status():
    book = _book_with("kdoj", "E", ["w1", "w2", "b", "l"], T0)
    recs = dict(book.records)
    recs["b"] = replace(recs["b"], status=SignalStatus.ASSUMED_BOARDED)
    recs["l"] = replace(recs["l"], status=SignalStatus.LEFT_BEHIND, left_by_departure="E1-0730")
    assert waiting_count(SignalBook("kdoj", "E", recs)) == 2


def test_waiting_app_from_book_expires_then_counts_without_changing_the_book():
    book = new_signal_book("kdse", "E")
    book = add_initial_signal(book, "stale", T0)
    book = add_initial_signal(book, "fresh", T0 + timedelta(minutes=20))
    now = T0 + timedelta(minutes=31)
    assert waiting_app_from_book(book, now) == 1
    assert set(book.records) == {"stale", "fresh"}     # the caller's book is untouched


def test_real_count_feeds_stop_state():
    # R1: the per-tick state carries the real waiting count. 7 tokens at KDSE -> 7, MEDIUM.
    book = _book_with("kdse", "E", [f"t{i}" for i in range(7)], T0)
    state = build_stop_state("kdse", "E", waiting_app=waiting_app_from_book(book, T0 + timedelta(minutes=1)))
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
