"""Unit tests for the departure-facts contract (01 "Departure facts"). Block 1 Task 6."""

from dataclasses import FrozenInstanceError, replace
from datetime import datetime

import pytest

from contracts.departure import DepartureFacts, DepartureSnapshot, TurnedAway

T730 = datetime(2026, 3, 23, 7, 30)


def _facts(**kw):
    base = dict(departure_id="dep-1", bus_id="E1", corridor_id="E", stop_id="kdse",
                departed_at=T730, left_full=True)
    base.update(kw)
    return DepartureFacts(**base)


def test_facts_defaults_and_frozen():
    f = _facts()
    assert f.boarded is None                      # no door counter
    assert f.turned_people_away is None           # not asked / no answer
    with pytest.raises(FrozenInstanceError):
        f.left_full = False  # type: ignore[misc]


@pytest.mark.parametrize("bad", [{"departure_id": ""}, {"boarded": -1}])
def test_facts_reject_bad_values(bad):
    with pytest.raises(ValueError):
        _facts(**bad)


def test_boarded_zero_is_allowed_and_is_not_none():
    assert _facts(boarded=0).boarded == 0


def test_no_and_unknown_stay_distinguishable():
    # "Not sure" or no answer is unknown, never "nobody was left" (D1, TC146).
    no, unsure, silent = (_facts(turned_people_away=TurnedAway.NO),
                          _facts(turned_people_away=TurnedAway.NOT_SURE), _facts())
    assert no.turned_people_away is TurnedAway.NO
    assert unsure.turned_people_away is TurnedAway.NOT_SURE
    assert silent.turned_people_away is None
    assert len({no.turned_people_away, unsure.turned_people_away, silent.turned_people_away}) == 3


def test_snapshot_defaults_and_tap_count_is_people_not_taps():
    snap = DepartureSnapshot(facts=_facts(), waiting_at_departure=10)
    assert snap.flagged_at_departure is False
    assert snap.still_waiting_taps == 0
    twice = replace(snap, still_waiting_tokens=snap.still_waiting_tokens | {"ali"} | {"ali"})
    assert twice.still_waiting_taps == 1


def test_snapshot_to_dict_carries_the_contract_and_no_tokens():
    snap = DepartureSnapshot(
        facts=_facts(boarded=3, turned_people_away=TurnedAway.NOT_SURE),
        waiting_at_departure=10, flagged_at_departure=True,
        still_waiting_tokens=frozenset({"a", "b"}),
    )
    assert snap.to_dict() == {
        "departure_id": "dep-1", "bus_id": "E1", "corridor_id": "E", "stop_id": "kdse",
        "departed_at": "2026-03-23T07:30:00", "left_full": True, "boarded": 3,
        "turned_people_away": "not_sure",
        "waiting_at_departure": 10, "flagged_at_departure": True, "still_waiting_taps": 2,
    }
