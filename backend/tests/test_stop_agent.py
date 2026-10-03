"""Unit tests for the Stop Agent. Block 1.

Task 1 (TC07): demand classification — every band and fencepost.
Task 2: per-tick broadcast decision — per-level behaviour, Rule 3 change gate,
Rule 6 keepalive, and the priority flag.

Run from backend/ with flat imports (from agents.stop_agent ...).
"""

from datetime import datetime, timedelta

import pytest

from agents.stop_agent import (
    BroadcastDecision,
    DemandLevel,
    classify_demand,
    decide_broadcast,
)

# ---------------------------------------------------------------------------
# Task 1 — classification (TC07)
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "count, expected",
    [
        (0, DemandLevel.LOW),        # bottom of range
        (3, DemandLevel.LOW),        # TC07: queue = 3 -> LOW
        (4, DemandLevel.LOW),        # top edge of LOW (< 5)
        (5, DemandLevel.MEDIUM),     # bottom edge of MEDIUM
        (10, DemandLevel.MEDIUM),    # mid MEDIUM
        (15, DemandLevel.MEDIUM),    # top edge of MEDIUM (<= 15)
        (16, DemandLevel.HIGH),      # bottom edge of HIGH
        (25, DemandLevel.HIGH),      # mid HIGH
        (30, DemandLevel.HIGH),      # top edge of HIGH (<= 30)
        (31, DemandLevel.CRITICAL),  # bottom edge of CRITICAL (> 30)
        (100, DemandLevel.CRITICAL), # well into CRITICAL
    ],
)
def test_classify_demand_bands_and_boundaries(count, expected):
    assert classify_demand(count) == expected


def test_tc07_queue_three_is_low():
    # TC07 (01_AGENT_DESIGN.md black-box test case): queue_count = 3 -> LOW
    assert classify_demand(3) is DemandLevel.LOW


def test_demand_level_is_ordered():
    # LOW < MEDIUM < HIGH < CRITICAL — supports the monotonicity property test later.
    assert DemandLevel.LOW < DemandLevel.MEDIUM < DemandLevel.HIGH < DemandLevel.CRITICAL


def test_negative_queue_count_raises():
    # A queue count cannot be negative; classify_demand surfaces it rather than bucketing.
    with pytest.raises(ValueError):
        classify_demand(-1)


# ---------------------------------------------------------------------------
# Task 2 — broadcast decision
# ---------------------------------------------------------------------------

T0 = datetime(2026, 3, 23, 7, 0, 0)          # arbitrary fixed sim time
RECENT = T0 - timedelta(seconds=5)           # last broadcast 5s ago (within keepalive)
STALE = T0 - timedelta(seconds=31)           # last broadcast 31s ago (keepalive elapsed)


def test_low_never_broadcasts_even_on_change():
    # LOW is an absolute "never" — even a HIGH -> LOW change must not broadcast.
    d = decide_broadcast(DemandLevel.LOW, DemandLevel.HIGH, T0, RECENT)
    assert d.should_broadcast is False
    assert d.priority is False
    assert d.is_keepalive is False


def test_low_from_none_does_not_broadcast():
    d = decide_broadcast(DemandLevel.LOW, None, T0, None)
    assert d.should_broadcast is False


def test_medium_broadcasts_on_change():
    # LOW -> MEDIUM is a change: MEDIUM broadcasts on change.
    d = decide_broadcast(DemandLevel.MEDIUM, DemandLevel.LOW, T0, None)
    assert d.should_broadcast is True
    assert d.priority is False
    assert d.is_keepalive is False


def test_medium_unchanged_does_not_broadcast():
    # Sustained MEDIUM with no level change: no broadcast.
    d = decide_broadcast(DemandLevel.MEDIUM, DemandLevel.MEDIUM, T0, RECENT)
    assert d.should_broadcast is False


def test_medium_first_observation_counts_as_change():
    # previous_level None is treated as a change -> first MEDIUM broadcasts.
    d = decide_broadcast(DemandLevel.MEDIUM, None, T0, None)
    assert d.should_broadcast is True


def test_medium_no_keepalive_even_when_stale():
    # Rule 6 keepalive applies only to >= HIGH; a stale MEDIUM still does not fire.
    d = decide_broadcast(DemandLevel.MEDIUM, DemandLevel.MEDIUM, T0, STALE)
    assert d.should_broadcast is False
    assert d.is_keepalive is False


def test_high_broadcasts_every_tick_even_unchanged():
    d = decide_broadcast(DemandLevel.HIGH, DemandLevel.HIGH, T0, RECENT)
    assert d.should_broadcast is True
    assert d.priority is False
    assert d.is_keepalive is False  # 5s since last -> keepalive not yet due


def test_critical_broadcasts_every_tick_with_priority():
    d = decide_broadcast(DemandLevel.CRITICAL, DemandLevel.CRITICAL, T0, RECENT)
    assert d.should_broadcast is True
    assert d.priority is True


def test_change_into_high_broadcasts():
    d = decide_broadcast(DemandLevel.HIGH, DemandLevel.LOW, T0, None)
    assert d.should_broadcast is True
    assert d.priority is False


def test_change_into_critical_broadcasts_with_priority():
    d = decide_broadcast(DemandLevel.CRITICAL, DemandLevel.LOW, T0, None)
    assert d.should_broadcast is True
    assert d.priority is True


def test_keepalive_fires_for_sustained_high_without_change():
    # Sustained HIGH, no change, >30s since last broadcast: keepalive trigger is due.
    # (should_broadcast is already True via every-tick; is_keepalive marks Rule 6 fired.)
    d = decide_broadcast(DemandLevel.HIGH, DemandLevel.HIGH, T0, STALE)
    assert d.should_broadcast is True
    assert d.is_keepalive is True


def test_keepalive_due_for_sustained_critical():
    d = decide_broadcast(DemandLevel.CRITICAL, DemandLevel.CRITICAL, T0, STALE)
    assert d.should_broadcast is True
    assert d.priority is True
    assert d.is_keepalive is True


def test_priority_only_set_on_critical_not_high():
    assert decide_broadcast(DemandLevel.HIGH, DemandLevel.HIGH, T0, RECENT).priority is False
    assert decide_broadcast(DemandLevel.CRITICAL, DemandLevel.CRITICAL, T0, RECENT).priority is True


def test_decision_consumes_levels_from_classifier():
    # Integration: decide_broadcast takes levels (from classify_demand), not raw counts.
    level = classify_demand(20)  # -> HIGH
    d = decide_broadcast(level, classify_demand(3), T0, RECENT)  # prev LOW
    assert level is DemandLevel.HIGH
    assert d.should_broadcast is True


def test_returns_broadcast_decision_type():
    assert isinstance(
        decide_broadcast(DemandLevel.LOW, None, T0, None), BroadcastDecision
    )
