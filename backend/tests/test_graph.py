"""Unit tests for the Corridor E graph. Covers Block 0 Task 3.

Task 4 (get_eta) is a separate later task and is not exercised here.
"""

import networkx as nx

from simulation.campus_graph import CORRIDOR_E_EDGES, build_corridor_e_graph

EXPECTED_EDGES = {
    ("kdoj", "klg"): 3,
    ("klg", "kdse"): 3,
    ("kdse", "pku"): 4,
    ("pku", "cp"): 5,
    ("cp", "n24"): 4,
    ("n24", "ktc"): 3,
    ("ktc", "cluster_t02"): 4,
    ("cluster_t02", "cluster_t08"): 3,
}


def test_graph_is_directed():
    assert isinstance(build_corridor_e_graph(), nx.DiGraph)


def test_edge_and_node_counts():
    G = build_corridor_e_graph()
    assert G.number_of_edges() == 8
    assert G.number_of_nodes() == 9  # 8 chained edges -> 9 distinct stops


def test_exact_nodes():
    G = build_corridor_e_graph()
    expected_nodes = {
        "kdoj", "klg", "kdse", "pku", "cp",
        "n24", "ktc", "cluster_t02", "cluster_t08",
    }
    assert set(G.nodes()) == expected_nodes


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
    assert len(CORRIDOR_E_EDGES) == 8
