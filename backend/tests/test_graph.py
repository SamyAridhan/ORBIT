"""Unit tests for the Corridor E graph and ETA. Covers Block 0 Task 3 and Task 4.

Unified suite: the trunk's structural/ETA tests plus the parallel rebuild's extra
coverage (edge-weight refresh, absent-node ETA, direct T02->T08 edge).
"""

import networkx as nx
import pytest

from simulation.campus_graph import (
    CORRIDOR_E_EDGES,
    build_corridor_e_graph,
    get_eta,
    update_edge_weights,
)

EXPECTED_EDGES = {
    ("kdoj", "klg"): 3,
    ("klg", "kdse"): 3,
    ("kdse", "cp"): 6,   # Sep 2026 correction: direct KDSE->CP, no PKU
    ("cp", "n24"): 4,
    ("n24", "ktc"): 3,
    ("ktc", "cluster_t02"): 4,
    ("cluster_t02", "cluster_t08"): 3,
}


def test_graph_is_directed():
    assert isinstance(build_corridor_e_graph(), nx.DiGraph)


def test_edge_and_node_counts():
    G = build_corridor_e_graph()
    assert G.number_of_edges() == 7
    assert G.number_of_nodes() == 8  # 7 chained edges -> 8 distinct stops


def test_exact_nodes():
    G = build_corridor_e_graph()
    expected_nodes = {
        "kdoj", "klg", "kdse", "cp",
        "n24", "ktc", "cluster_t02", "cluster_t08",
    }
    assert set(G.nodes()) == expected_nodes


def test_no_pku_node():
    # PKU was a Bus D stop mistakenly copied into Corridor E; must be absent.
    assert "pku" not in build_corridor_e_graph().nodes()


def test_no_cluster_t06_node():
    # cluster_t06 is provisional / deferred for Block 0.
    assert "cluster_t06" not in build_corridor_e_graph().nodes()


def test_edges_have_correct_base_time_and_weight():
    G = build_corridor_e_graph()
    assert set(G.edges()) == set(EXPECTED_EDGES)
    for (u, v), base_time in EXPECTED_EDGES.items():
        data = G.get_edge_data(u, v)
        assert data["base_time"] == base_time
        # weight initialises to base_time before any demand-aware refresh
        assert data["weight"] == base_time


def test_edge_list_matches_module_source():
    # guard against drift between the module constant and the built graph
    assert len(CORRIDOR_E_EDGES) == 7


def test_get_eta_full_corridor():
    # KDOJ -> Cluster T08 traverses all 7 edges: 3+3+6+4+3+4+3 = 26
    G = build_corridor_e_graph()
    assert get_eta(G, "kdoj", "cluster_t08") == 26


def test_get_eta_partial_corridor():
    # KDOJ -> Cluster T02 is the first 6 edges: 3+3+6+4+3+4 = 23
    G = build_corridor_e_graph()
    assert get_eta(G, "kdoj", "cluster_t02") == 23


def test_get_eta_no_path_returns_inf():
    # edges are one-way downstream; there is no path back upstream
    G = build_corridor_e_graph()
    assert get_eta(G, "cluster_t08", "kdoj") == float("inf")


# --- Additional coverage carried over from the parallel rebuild ---

def test_direct_t02_t08_edge_exists():
    # cluster_t06 is absent, so the cluster loop runs T02 -> T08 directly
    assert build_corridor_e_graph().has_edge("cluster_t02", "cluster_t08")


def test_get_eta_absent_node_returns_inf():
    # get_eta must return inf (not raise NodeNotFound) for a node off the corridor,
    # e.g. the deliberately-excluded PKU.
    G = build_corridor_e_graph()
    assert get_eta(G, "kdoj", "pku") == float("inf")


def test_update_edge_weights_applies_queue_penalty():
    # W = base * (1 + 1/(queue+1)); an empty destination => 2x base.
    G = build_corridor_e_graph()
    update_edge_weights(G, {})  # all queues zero
    assert G["kdoj"]["klg"]["weight"] == pytest.approx(6.0)   # 3 * (1 + 1/1)
    # A busy destination lowers the penalty toward base.
    update_edge_weights(G, {"klg": 9})
    assert G["kdoj"]["klg"]["weight"] == pytest.approx(3.3)   # 3 * (1 + 1/10)
    assert G["kdoj"]["klg"]["base_time"] == 3                 # base unchanged
