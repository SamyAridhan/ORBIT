"""Unit tests for the Stop Agent. Block 1 (design locked 11 Nov 2026).

Task 1  — demand level: every band and fencepost (TC102), negative raises.
Task 3R — CP / Jalan Amal: no `expected` there, everything else unchanged (TC108);
          n24 / ktc are routing nodes, not special here.
Task 2R — StopState is built at every level; nothing gates it (TC101).
Task 4  — waiting count from app signals: one record per token, expiry, feeds
          waiting_app (R1; TC107's Stop-Agent half through a real count).
Task 5  — signal types, the lost-track rule, two times on a record (TC103,
          TC151, TC152) and the TC150 state machine (Hypothesis).
Task 6  — after the bus leaves: the snapshot, who is assumed boarded, the attach
          rule, the live map vs the history (TC110, TC142, TC143, TC153, TC154),
          over faked DepartureFacts. The state machine now has departures in it.
Task 7  — the strange-count flag, rule layer: flag, keep, never drop (TC105),
          with property tests on the rule.

Run from backend/ with flat imports (from agents.stop_agent ...).
"""

from dataclasses import FrozenInstanceError, replace
from datetime import datetime, timedelta

import pytest

from hypothesis import given, settings
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
    is_strange_count,
    new_signal_book,
    produces_expected,
    left_behind_by_departure,
    prune_departures,
    record_departure,
    state_from_book,
    waiting_app_from_book,
    waiting_count,
)
from contracts.departure import DepartureFacts
from config.thresholds import SIGNAL_EXPIRY, STRANGE_COUNT_MINIMUM, STRANGE_COUNT_MULTIPLIER

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
    return replace(book, records=recs)


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
# Task 6 — after the bus leaves (pure functions over faked DepartureFacts)
# ---------------------------------------------------------------------------


def at(hour, minute):
    return datetime(2026, 3, 23, hour, minute)


def dep(departure_id, when, full, boarded=None, stop_id="kdse", corridor_id="E"):
    """A faked DepartureFacts, to the contract in 01."""
    return DepartureFacts(departure_id=departure_id, bus_id=departure_id.split("-")[0],
                          corridor_id=corridor_id, stop_id=stop_id, departed_at=when,
                          left_full=full, boarded=boarded)


def _arrivals(book, tokens_and_times):
    for token, when in tokens_and_times:
        book = add_initial_signal(book, token, when)
    return book


def _statuses(book):
    return {t: r.status for t, r in book.records.items()}


W, B, L = SignalStatus.WAITING, SignalStatus.ASSUMED_BOARDED, SignalStatus.LEFT_BEHIND


# --- the departure event: snapshot, then who is assumed boarded ---


def test_departure_for_another_stop_or_route_is_rejected():
    book = new_signal_book("kdse", "E")
    with pytest.raises(ValueError):
        record_departure(book, dep("E1-0730", at(7, 30), True, stop_id="klg"))
    with pytest.raises(ValueError):
        record_departure(book, dep("B1-0730", at(7, 30), True, corridor_id="B"))


def test_no_door_counter_everyone_already_waiting_is_assumed_boarded():
    # "No answer = boarded" (locked). boarded is None -> all of them.
    book = _arrivals(new_signal_book("kdse", "E"), [("a", at(7, 20)), ("b", at(7, 25))])
    after = record_departure(book, dep("E1-0730", at(7, 30), full=False))
    assert _statuses(after) == {"a": B, "b": B}
    assert waiting_count(after) == 0


def test_someone_who_arrives_after_the_bus_has_gone_is_untouched():
    book = _arrivals(new_signal_book("kdse", "E"), [("early", at(7, 20)), ("late", at(7, 35))])
    after = record_departure(book, dep("E1-0730", at(7, 30), full=True))
    assert _statuses(after) == {"early": B, "late": W}
    assert after.departures["E1-0730"].waiting_at_departure == 1   # "late" wasn't there yet


def test_snapshot_is_taken_before_anyone_is_marked():
    book = _arrivals(new_signal_book("kdse", "E"), [(f"t{i}", at(7, 20)) for i in range(10)])
    after = record_departure(book, dep("E1-0730", at(7, 30), full=True, boarded=3))
    snap = after.departures["E1-0730"]
    assert snap.waiting_at_departure == 10        # the fixed number for Way 1
    assert waiting_count(after) == 7              # the live count has already moved on
    assert snap.flagged_at_departure is False     # default until Task 7 feeds it
    assert snap.still_waiting_taps == 0
    assert snap.facts.boarded == 3 and snap.facts.left_full is True


def test_flag_at_departure_is_carried_into_the_snapshot():
    book = add_initial_signal(new_signal_book("kdse", "E"), "a", at(7, 20))
    after = record_departure(book, dep("E1-0730", at(7, 30), True), flagged=True)
    assert after.departures["E1-0730"].flagged_at_departure is True


def test_door_counter_caps_who_is_assumed_boarded_longest_waiting_first():
    # 5 app users waiting; the counter saw 2 board -> only the 2 longest-waiting are
    # removed, never more than actually boarded. The other 3 stay in the count.
    book = _arrivals(new_signal_book("kdse", "E"),
                     [("c", at(7, 22)), ("a", at(7, 10)), ("e", at(7, 28)),
                      ("b", at(7, 15)), ("d", at(7, 25))])
    after = record_departure(book, dep("E1-0730", at(7, 30), full=True, boarded=2))
    assert _statuses(after) == {"a": B, "b": B, "c": W, "d": W, "e": W}
    assert waiting_count(after) == 3


def test_ties_on_start_time_are_broken_by_token_so_it_is_deterministic():
    book = _arrivals(new_signal_book("kdse", "E"), [("z", at(7, 20)), ("m", at(7, 20)), ("a", at(7, 20))])
    after = record_departure(book, dep("E1-0730", at(7, 30), full=True, boarded=1))
    assert _statuses(after) == {"a": B, "m": W, "z": W}


@pytest.mark.parametrize("boarded, still_waiting", [(0, 3), (3, 0), (9, 0)])
def test_door_counter_edges(boarded, still_waiting):
    # 0 boarded -> nobody removed; more boarded than app users (riders without the
    # app) -> everyone removed, never an error.
    book = _arrivals(new_signal_book("kdse", "E"), [("a", at(7, 10)), ("b", at(7, 15)), ("c", at(7, 20))])
    after = record_departure(book, dep("E1-0730", at(7, 30), full=True, boarded=boarded))
    assert waiting_count(after) == still_waiting


def test_a_repeated_departure_message_changes_nothing():
    book = _arrivals(new_signal_book("kdse", "E"), [("a", at(7, 10)), ("b", at(7, 15))])
    once = record_departure(book, dep("E1-0730", at(7, 30), full=True, boarded=1))
    twice = record_departure(once, dep("E1-0730", at(7, 30), full=True, boarded=1))
    assert twice is once
    assert waiting_count(twice) == 1


def test_departure_is_pure_and_remembers_the_last_visit():
    book = add_initial_signal(new_signal_book("kdse", "E"), "a", at(7, 20))
    assert book.last_departure_at is None
    after = record_departure(book, dep("E1-0730", at(7, 30), True))
    assert _statuses(book) == {"a": W} and dict(book.departures) == {}     # input untouched
    assert after.last_departure_at == at(7, 30)
    later = record_departure(after, dep("E3-0740", at(7, 40), False))
    late_msg = record_departure(later, dep("E9-0725", at(7, 25), False))    # an old message arriving late
    assert later.last_departure_at == at(7, 40) and late_msg.last_departure_at == at(7, 40)
    with pytest.raises(TypeError):
        after.departures["x"] = after.departures["E1-0730"]  # type: ignore[index]


# --- the attach rule ---


def test_tc110_one_taps_still_waiting_one_does_not_answer():
    # TC110: the bus passes; one student taps "still waiting", one doesn't answer.
    book = _arrivals(new_signal_book("kdse", "E"), [("taps", at(7, 20)), ("silent", at(7, 21))])
    book = record_departure(book, dep("E1-0730", at(7, 30), full=True))
    book = apply_signal(book, "taps", SignalType.STILL_WAITING, at(7, 31))
    assert book.records["taps"].status is L
    assert book.records["taps"].left_by_departure == "E1-0730"
    assert book.records["silent"].status is B                 # removed as boarded
    assert waiting_count(book) == 1                           # the tapper stays in the count
    assert left_behind_by_departure(book) == {"E1-0730": 1}
    assert book.departures["E1-0730"].still_waiting_taps == 1


def test_tc142_a_late_tap_puts_a_removed_person_back_against_that_departure():
    # TC142: signals; the bus leaves full; no answer, so removed as boarded; 5 minutes
    # later taps "still waiting" -> back as one person, recorded against that departure.
    book = add_initial_signal(new_signal_book("kdse", "E"), "ali", at(7, 25))
    book = record_departure(book, dep("E1-0730", at(7, 30), full=True))
    assert waiting_count(book) == 0
    book = apply_signal(book, "ali", SignalType.STILL_WAITING, at(7, 35))
    rec = book.records["ali"]
    assert len(book.records) == 1 and waiting_count(book) == 1
    assert rec.status is L and rec.left_by_departure == "E1-0730"
    assert rec.started_waiting_at == at(7, 25)                # the start never moved


def test_tc143_a_tap_when_no_bus_has_left_full_confirms_nothing():
    # TC143: the bus had room. The student simply missed it: stays in the waiting
    # count, is not left behind, and the departure's history stays empty.
    book = add_initial_signal(new_signal_book("kdse", "E"), "ali", at(7, 25))
    book = record_departure(book, dep("E1-0730", at(7, 30), full=False))
    book = apply_signal(book, "ali", SignalType.STILL_WAITING, at(7, 32))
    assert book.records["ali"].status is W
    assert book.records["ali"].left_by_departure is None
    assert waiting_count(book) == 1
    assert left_behind_by_departure(book) == {}
    assert book.departures["E1-0730"].still_waiting_taps == 0


def test_a_tap_with_no_departure_at_all_confirms_nothing():
    book = add_initial_signal(new_signal_book("kdse", "E"), "ali", at(7, 25))
    book = apply_signal(book, "ali", SignalType.STILL_WAITING, at(7, 27))
    assert book.records["ali"].status is W and left_behind_by_departure(book) == {}


def test_tc153_record_half_late_tap_goes_to_the_full_bus_not_the_later_one_with_room():
    # TC153 (the record; "no spare" is the Coordinator's): 7:30 leaves full, 7:40
    # leaves with room, a student waiting since 7:25 taps at 7:42 -> left behind by the 7:30.
    book = add_initial_signal(new_signal_book("kdse", "E"), "ali", at(7, 25))
    book = record_departure(book, dep("E1-0730", at(7, 30), full=True))
    book = record_departure(book, dep("E3-0740", at(7, 40), full=False))
    book = apply_signal(book, "ali", SignalType.STILL_WAITING, at(7, 42))
    assert book.records["ali"].status is L
    assert book.records["ali"].left_by_departure == "E1-0730"
    assert book.departures["E1-0730"].still_waiting_taps == 1
    assert book.departures["E3-0740"].still_waiting_taps == 0    # a bus with room left nobody


def test_tc154_a_bus_cannot_have_left_someone_who_was_not_there_yet():
    # TC154: the 7:30 leaves full; a student who started waiting at 7:35 taps.
    book = record_departure(new_signal_book("kdse", "E"), dep("E1-0730", at(7, 30), full=True))
    book = add_initial_signal(book, "late", at(7, 35))
    book = apply_signal(book, "late", SignalType.STILL_WAITING, at(7, 36))
    assert book.records["late"].status is W
    assert book.records["late"].left_by_departure is None
    assert book.departures["E1-0730"].still_waiting_taps == 0


def test_started_waiting_at_the_very_moment_the_bus_left_counts_as_already_there():
    book = add_initial_signal(new_signal_book("kdse", "E"), "edge", at(7, 30))
    book = record_departure(book, dep("E1-0730", at(7, 30), full=True))
    assert book.departures["E1-0730"].waiting_at_departure == 1
    book = apply_signal(book, "edge", SignalType.STILL_WAITING, at(7, 31))
    assert book.records["edge"].left_by_departure == "E1-0730"


def test_most_recent_full_departure_wins():
    book = add_initial_signal(new_signal_book("kdse", "E"), "ali", at(7, 15))
    book = record_departure(book, dep("E1-0720", at(7, 20), full=True, boarded=0))
    book = record_departure(book, dep("E3-0730", at(7, 30), full=True, boarded=0))
    book = apply_signal(book, "ali", SignalType.STILL_WAITING, at(7, 31))
    assert book.records["ali"].left_by_departure == "E3-0730"


def test_left_by_two_buses_live_map_moves_history_keeps_both():
    # Ali is left by the 7:30 and taps. The 7:40 is full too, and he taps again.
    # Live state: he is one person, under the last bus that left him. History: he is
    # in both departures' tap counts, which only grow.
    book = add_initial_signal(new_signal_book("kdse", "E"), "ali", at(7, 25))
    book = record_departure(book, dep("E1-0730", at(7, 30), full=True))
    book = apply_signal(book, "ali", SignalType.STILL_WAITING, at(7, 31))
    assert left_behind_by_departure(book) == {"E1-0730": 1}

    book = record_departure(book, dep("E3-0740", at(7, 40), full=True))     # no door counter
    assert book.records["ali"].status is B                                   # assumed boarded...
    assert left_behind_by_departure(book) == {}
    book = apply_signal(book, "ali", SignalType.STILL_WAITING, at(7, 41))   # ...until he says otherwise

    assert left_behind_by_departure(book) == {"E3-0740": 1}                 # moved, not doubled
    assert sum(left_behind_by_departure(book).values()) == 1 == waiting_count(book)
    assert book.departures["E1-0730"].still_waiting_taps == 1               # history kept
    assert book.departures["E3-0740"].still_waiting_taps == 1


def test_one_person_tapping_twice_against_one_departure_is_one_in_the_history():
    book = add_initial_signal(new_signal_book("kdse", "E"), "ali", at(7, 25))
    book = record_departure(book, dep("E1-0730", at(7, 30), full=True))
    book = apply_signal(book, "ali", SignalType.STILL_WAITING, at(7, 31))
    book = apply_signal(book, "ali", SignalType.STILL_WAITING, at(7, 33))
    # ...and through the restore path: a later bus with room, no answer, another tap.
    book = record_departure(book, dep("E3-0740", at(7, 40), full=False))
    book = apply_signal(book, "ali", SignalType.STILL_WAITING, at(7, 42))
    assert book.records["ali"].left_by_departure == "E1-0730"
    assert book.departures["E1-0730"].still_waiting_taps == 1


def test_door_counter_leaves_a_left_behind_person_attached_until_they_board():
    # Left by the 7:30. The 7:40 has room but the counter saw 0 board here: he is
    # still waiting and still "left by the 7:30" — no tap needed, nothing lost.
    book = add_initial_signal(new_signal_book("kdse", "E"), "ali", at(7, 25))
    book = record_departure(book, dep("E1-0730", at(7, 30), full=True, boarded=0))
    book = apply_signal(book, "ali", SignalType.STILL_WAITING, at(7, 31))
    book = record_departure(book, dep("E3-0740", at(7, 40), full=False, boarded=0))
    assert book.records["ali"].status is L and book.records["ali"].left_by_departure == "E1-0730"
    # When a bus does take him, the live attachment goes; the history stays.
    book = record_departure(book, dep("E5-0750", at(7, 50), full=False, boarded=1))
    assert book.records["ali"].status is B and book.records["ali"].left_by_departure is None
    assert left_behind_by_departure(book) == {}
    assert book.departures["E1-0730"].still_waiting_taps == 1


def test_initial_from_an_assumed_boarded_person_attaches_exactly_like_still_waiting():
    # 13 Nov ruling: an `initial` on an ASSUMED_BOARDED record restores it "exactly
    # like a still waiting" — so after a full bus it records the left-behind too.
    book = add_initial_signal(new_signal_book("kdse", "E"), "ali", at(7, 25))
    book = record_departure(book, dep("E1-0730", at(7, 30), full=True))
    book = apply_signal(book, "ali", SignalType.INITIAL, at(7, 33))
    assert book.records["ali"].status is L and book.records["ali"].left_by_departure == "E1-0730"


@pytest.mark.parametrize("kind", [SignalType.INITIAL, SignalType.TRANSFER])
def test_a_first_initial_and_a_transfer_never_attach(kind):
    book = record_departure(new_signal_book("kdse", "E"), dep("E1-0730", at(7, 30), full=True))
    book = apply_signal(book, "new", kind, at(7, 30))           # same instant as the full bus
    assert book.records["new"].status is W
    assert book.departures["E1-0730"].still_waiting_taps == 0


def test_transfer_restores_but_does_not_claim_a_left_behind():
    book = add_initial_signal(new_signal_book("kdse", "E"), "ali", at(7, 25))
    book = record_departure(book, dep("E1-0730", at(7, 30), full=True))
    book = apply_signal(book, "ali", SignalType.TRANSFER, at(7, 33))
    assert book.records["ali"].status is W and waiting_count(book) == 1


def test_accepted_limit_a_tap_after_expiry_cannot_reach_back_to_an_earlier_bus():
    # The record expired; the tap starts a fresh one, so it can only be attached to
    # buses that leave after the tap. ORBIT does not claim a left-behind it can't support.
    book = add_initial_signal(new_signal_book("kdse", "E"), "ali", at(7, 0))
    book = record_departure(book, dep("E1-0705", at(7, 5), full=True))
    book = expire_signals(book, at(7, 40))
    book = apply_signal(book, "ali", SignalType.STILL_WAITING, at(7, 40))
    assert book.records["ali"].status is W
    assert book.records["ali"].started_waiting_at == at(7, 40)


# --- feeding StopState, and the history bound ---


def test_state_from_book_feeds_waiting_left_behind_and_last_visit():
    book = _arrivals(new_signal_book("kdse", "E"), [(f"t{i}", at(7, 20)) for i in range(10)])
    book = record_departure(book, dep("E1-0730", at(7, 30), full=True, boarded=3))   # t0-t2 board
    for t in ("t3", "t4", "t5", "t6", "t7"):
        book = apply_signal(book, t, SignalType.STILL_WAITING, at(7, 31))
    state = state_from_book(book, at(7, 32), expected=22)
    assert state.stop_id == "kdse" and state.corridor_id == "E"
    assert state.waiting_app == 7                      # 5 left behind + 2 who haven't tapped
    assert dict(state.left_behind_by_departure) == {"E1-0730": 5}
    assert state.left_behind == 5
    assert state.last_bus_visit_time == at(7, 30)
    assert state.expected == 22 and state.level is DemandLevel.MEDIUM
    assert len(book.records) == 10                     # read-only: the caller's book is untouched


def test_state_from_book_before_any_bus_and_at_cp():
    book = add_initial_signal(new_signal_book("cp", "E"), "a", at(7, 20))
    state = state_from_book(book, at(7, 21), expected=9)
    assert state.last_bus_visit_time is None
    assert dict(state.left_behind_by_departure) == {} and state.left_behind == 0
    assert state.expected is None                      # Rule 3 still holds through this path


def test_prune_departures_boundary_and_keeps_attachments_and_last_visit():
    book = add_initial_signal(new_signal_book("kdse", "E"), "ali", at(7, 25))
    book = record_departure(book, dep("E1-0730", at(7, 30), full=True))
    book = apply_signal(book, "ali", SignalType.STILL_WAITING, at(7, 59))
    assert "E1-0730" in prune_departures(book, at(7, 59, ) + timedelta(seconds=59)).departures
    pruned = prune_departures(book, at(8, 0))                     # exactly 30:00 old: forgotten
    assert dict(pruned.departures) == {}
    assert pruned.last_departure_at == at(7, 30)
    assert pruned.records["ali"].left_by_departure == "E1-0730"   # the person keeps the attachment
    assert left_behind_by_departure(pruned) == {"E1-0730": 1}
    assert prune_departures(pruned, at(8, 0)) is pruned


# ---------------------------------------------------------------------------
# Task 7 — the strange-count flag (rule layer): flag, keep, never drop
# ---------------------------------------------------------------------------


def test_tc105_strange_count_is_flagged_kept_and_triggers_nothing():
    # TC105: 40 signals at KDOJ on a quiet Saturday, expected 5 -> count kept,
    # flagged = true, shown; nothing triggered (the Stop Agent only reports).
    book = _book_with("kdoj", "E", [f"t{i}" for i in range(40)], T0)
    state = state_from_book(book, T0 + MIN, expected=5)
    assert state.flagged is True
    assert state.waiting_app == 40                       # kept in full, never dropped
    assert waiting_count(book) == 40 and len(book.records) == 40
    assert state.level is DemandLevel.CRITICAL           # the colour is still just the count
    assert state.left_behind == 0                        # a flag is not a left-behind
    assert state.to_dict()["flagged"] is True and state.to_dict()["waiting_app"] == 40


def test_the_two_numbers_are_the_placeholders_in_config():
    assert STRANGE_COUNT_MULTIPLIER == 3
    assert STRANGE_COUNT_MINIMUM == 10


@pytest.mark.parametrize(
    "count, expected, flagged",
    [
        (15, 5, False),   # exactly 3x: not "more than"
        (16, 5, True),    # just over 3x, and at least the minimum
        (4, 1, False),    # "expected 1, counted 4" — over 3x but below the floor
        (9, 1, False),    # 9x expected, still below the floor
        (10, 1, True),    # at the floor: "at least" the minimum
        (10, 3, True),    # 10 > 9
        (12, 4, False),   # exactly 3x
        (13, 4, True),
        (39, 13, False),  # exactly 3x at a larger number
        (40, 13, True),
        (40, 14, False),  # 40 is not more than 42
        (40, 5, True),    # TC105's numbers
        (0, 0, False),    # nobody expected, nobody came
        (9, 0, False),    # nobody expected, a few came: below the floor
        (10, 0, True),    # nobody expected, ten came
    ],
)
def test_rule_boundaries_more_than_3x_and_at_least_the_minimum(count, expected, flagged):
    assert is_strange_count(count, expected) is flagged


@pytest.mark.parametrize("count", [0, 10, 40, 1000])
def test_no_expected_means_the_rule_flags_nothing(count):
    assert is_strange_count(count, None) is False


@pytest.mark.parametrize("stop_id", ["cp", "jalan_amal", "CP"])
def test_cp_and_jalan_amal_are_never_flagged_by_the_rule_even_if_expected_is_supplied(stop_id):
    # Rule 3 comes first: no `expected` there, so nothing to compare with.
    assert build_stop_state(stop_id, "E", waiting_app=40, expected=5).flagged is False
    book = _book_with(stop_id.lower(), "E", [f"t{i}" for i in range(40)], T0)
    assert state_from_book(book, T0, expected=5).flagged is False
    # ...while the same numbers at an ordinary stop are flagged.
    assert build_stop_state("kdoj", "E", waiting_app=40, expected=5).flagged is True


@pytest.mark.parametrize("kwargs", [{"count": -1, "expected": 5}, {"count": 5, "expected": -1}])
def test_negative_inputs_to_the_rule_raise(kwargs):
    with pytest.raises(ValueError):
        is_strange_count(**kwargs)


def test_custom_placeholders_are_honoured():
    assert is_strange_count(6, 2, multiplier=2, minimum=5) is True      # 6 > 4 and >= 5
    assert is_strange_count(6, 2, multiplier=3, minimum=5) is False     # 6 is not > 6
    assert is_strange_count(6, 2, multiplier=2, minimum=7) is False     # below the floor


def test_another_layer_flagging_is_kept_even_when_the_rule_says_no():
    # `flagged=True` from the caller (Block 11's Isolation Forest) is OR-ed with the rule.
    state = build_stop_state("kdoj", "E", waiting_app=3, expected=20, flagged=True)
    assert state.flagged is True and state.waiting_app == 3


def test_the_rule_compares_waiting_app_not_the_scaled_estimate():
    # `expected` is the whole crowd and `waiting_app` only its app users, so this is
    # conservative until the app share is known — but it is the count ORBIT really has.
    state = build_stop_state("kdoj", "E", waiting_app=5, estimated_total=50, expected=5)
    assert state.flagged is False                 # 5 is below the floor
    assert state.level is DemandLevel.CRITICAL    # the colour does use the estimate


def test_flag_at_departure_comes_from_the_count_at_that_moment():
    # 40 app users waiting when the bus leaves, expected 5 -> the snapshot is flagged
    # and still records all 40. A flagged count is kept; the Coordinator just won't
    # use it for the automatic check.
    book = _book_with("kdoj", "E", [f"t{i}" for i in range(40)], at(7, 20))
    after = record_departure(book, dep("E1-0730", at(7, 30), True, stop_id="kdoj"), expected=5)
    snap = after.departures["E1-0730"]
    assert snap.flagged_at_departure is True
    assert snap.waiting_at_departure == 40


def test_flag_at_departure_ignores_people_who_arrive_afterwards():
    # 12 were waiting when the bus left (not strange against 5: 12 is not > 15). The
    # 30 who turn up later don't reach back into that departure's snapshot.
    book = _book_with("kdoj", "E", [f"e{i}" for i in range(12)], at(7, 20))
    book = _arrivals(book, [(f"l{i}", at(7, 35)) for i in range(30)])
    after = record_departure(book, dep("E1-0730", at(7, 30), True, stop_id="kdoj", boarded=0), expected=5)
    assert after.departures["E1-0730"].waiting_at_departure == 12
    assert after.departures["E1-0730"].flagged_at_departure is False
    assert state_from_book(after, at(7, 36), expected=5).flagged is True     # the live count is


@pytest.mark.parametrize(
    "stop_id, expected, passed_flag, snapshot_flag",
    [
        ("kdoj", None, False, False),   # no model yet: the rule flags nothing
        ("kdoj", None, True, True),     # another layer flagged it
        ("cp", 5, False, False),        # Rule 3: no `expected` at CP
        ("kdoj", 5, False, True),       # the rule
    ],
)
def test_flag_at_departure_sources(stop_id, expected, passed_flag, snapshot_flag):
    book = _book_with(stop_id, "E", [f"t{i}" for i in range(40)], at(7, 20))
    after = record_departure(book, dep("E1-0730", at(7, 30), True, stop_id=stop_id),
                             passed_flag, expected=expected)
    assert after.departures["E1-0730"].flagged_at_departure is snapshot_flag
    assert after.departures["E1-0730"].waiting_at_departure == 40


def test_a_flagged_count_changes_nothing_else_in_the_book():
    # Flag, keep, never drop: same records, same statuses, same history as an
    # unflagged departure with the same facts.
    book = _book_with("kdoj", "E", [f"t{i:02d}" for i in range(40)], at(7, 20))
    facts = dep("E1-0730", at(7, 30), True, stop_id="kdoj", boarded=28)
    flagged = record_departure(book, facts, expected=5)
    plain = record_departure(book, facts)
    assert dict(flagged.records) == dict(plain.records)
    assert waiting_count(flagged) == waiting_count(plain) == 12
    still = apply_signal(flagged, "t39", SignalType.STILL_WAITING, at(7, 31))
    assert still.records["t39"].left_by_departure == "E1-0730"      # taps are still recorded


COUNTS = st.integers(min_value=0, max_value=400)
EXPECTEDS = st.one_of(st.none(), st.integers(min_value=0, max_value=150))


@given(count=COUNTS, expected=EXPECTEDS, already=st.booleans())
def test_property_the_flag_never_changes_the_count(count, expected, already):
    state = build_stop_state("kdoj", "E", waiting_app=count, expected=expected, flagged=already)
    assert state.waiting_app == count
    assert state.to_dict()["waiting_app"] == count
    assert state.level == classify_demand(count)
    assert state.flagged is (already or is_strange_count(count, expected))


@given(low=COUNTS, extra=st.integers(min_value=0, max_value=400), expected=EXPECTEDS)
def test_property_raising_the_count_never_unflags_it(low, extra, expected):
    if is_strange_count(low, expected):
        assert is_strange_count(low + extra, expected)


@given(count=COUNTS, expected=st.integers(min_value=0, max_value=150), less=st.integers(min_value=0, max_value=150))
def test_property_a_lower_expected_never_unflags_it(count, expected, less):
    if is_strange_count(count, expected):
        assert is_strange_count(count, max(0, expected - less))


@given(count=st.integers(min_value=0, max_value=STRANGE_COUNT_MINIMUM - 1), expected=EXPECTEDS)
def test_property_never_flagged_below_the_floor(count, expected):
    assert is_strange_count(count, expected) is False


# ---------------------------------------------------------------------------
# TC150 — one token is never counted more than once at a stop and route.
# Hypothesis state machine over any mix of taps, departures, expiry and pruning.
# Also answers: can a person end up LEFT_BEHIND by a bus that left before they
# started waiting, or by a bus that had room?
# ---------------------------------------------------------------------------

TOKENS = st.sampled_from(["t1", "t2", "t3", "t4", "t5"])
KINDS = st.sampled_from(list(SignalType))


class OneTokenOnePerson(RuleBasedStateMachine):
    """Model: per token, ORBIT believes exactly one of {absent, waiting, boarded}.

    The real book must agree with the model about who counts, must never hold or
    count a token twice, must never refresh `started_waiting_at` while a record
    exists, and every LEFT_BEHIND record must point at a departure that left full
    at or after that person started waiting. Tap histories only grow.
    """

    def __init__(self):
        super().__init__()
        self.book = new_signal_book("kdoj", "E")
        self.now = T0
        self.model: dict[str, str] = {}             # token -> "waiting" | "boarded"
        self.started: dict[str, datetime] = {}
        self.facts: dict[str, DepartureFacts] = {}  # every departure ever, pruned or not
        self.history: dict[str, frozenset] = {}     # departure_id -> tokens seen so far

    @rule(token=TOKENS, kind=KINDS)
    def tap(self, token, kind):
        before = self.model.get(token)
        self.book = apply_signal(self.book, token, kind, self.now)
        if before is None:
            self.model[token] = "waiting"
            self.started[token] = self.now
        elif before == "boarded":
            self.model[token] = "waiting"

    @rule(full=st.booleans(), boarded=st.one_of(st.none(), st.integers(min_value=0, max_value=6)))
    def bus_leaves(self, full, boarded):
        departure_id = f"d{len(self.facts)}"
        facts = DepartureFacts(departure_id=departure_id, bus_id="E1", corridor_id="E",
                               stop_id="kdoj", departed_at=self.now, left_full=full, boarded=boarded)
        self.facts[departure_id] = facts
        present = sorted((t for t, v in self.model.items() if v == "waiting" and self.started[t] <= self.now),
                         key=lambda t: (self.started[t], t))
        for t in (present if boarded is None else present[:boarded]):
            self.model[t] = "boarded"
        self.book = record_departure(self.book, facts)
        assert self.book.departures[departure_id].waiting_at_departure == len(present)

    @rule(minutes=st.integers(min_value=1, max_value=20))
    def time_passes(self, minutes):
        self.now += minutes * MIN
        self.book = prune_departures(expire_signals(self.book, self.now), self.now)
        for t in list(self.model):
            if t not in self.book.records:
                del self.model[t]
                del self.started[t]
        assert set(self.model) == set(self.book.records)

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

    @invariant()
    def left_behind_only_by_a_full_bus_that_left_after_they_started(self):
        for r in self.book.records.values():
            if r.status is SignalStatus.LEFT_BEHIND:
                bus = self.facts[r.left_by_departure]
                assert bus.left_full
                assert bus.departed_at >= r.started_waiting_at
            else:
                assert r.left_by_departure is None

    @invariant()
    def live_map_is_people_and_nobody_is_in_it_twice(self):
        live = left_behind_by_departure(self.book)
        left = sum(1 for r in self.book.records.values() if r.status is SignalStatus.LEFT_BEHIND)
        assert sum(live.values()) == left <= waiting_count(self.book)
        state = state_from_book(self.book, self.now)
        assert state.left_behind == left and state.waiting_app == waiting_count(self.book)

    @invariant()
    def tap_history_only_grows_and_only_on_full_buses(self):
        for departure_id, snap in self.book.departures.items():
            assert self.history.get(departure_id, frozenset()) <= snap.still_waiting_tokens
            self.history[departure_id] = snap.still_waiting_tokens
            if snap.still_waiting_tokens:
                assert snap.facts.left_full


TestTC150OneTokenOnePerson = OneTokenOnePerson.TestCase
TestTC150OneTokenOnePerson.settings = settings(max_examples=300, stateful_step_count=50, deadline=None)
