"""Unit tests for Stop Agent demand classification. Block 1 Task 1 (TC07).

Covers every band and every fencepost per 01_AGENT_DESIGN.md "Demand Classification".
"""

import pytest

from agents.stop_agent import DemandLevel, classify_demand


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
