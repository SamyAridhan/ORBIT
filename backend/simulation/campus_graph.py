"""Corridor E campus graph and ETA.

Implements Block 0 Task 3 (graph) and Task 4 (get_eta); see BLOCK_0_GUIDE.md
and docs_modules/02_GRAPH_AND_SIMULATION.md. Corridor E (KDOJ -> Faculty
Cluster) is the reference corridor; B and F follow later.

Directed weighted graph: directed because campus segments are largely one-way,
weighted because edge weights encode base travel time in minutes.

Corridor E correction (Sep 2026): PKU was removed — it is a Bus D stop that
had leaked into Corridor E's travel-time table. Confirmed against the official
UTM Fleet Bus E driver sheets (E1/E3/E5): Bus E runs KDOJ/KLG/KDSE -> Cluster
via CP -> N24 -> KTC with no PKU. The old KDSE->PKU(4) + PKU->CP(5) pair is now
a single direct KDSE->CP segment; 6 min is a flagged placeholder.
"""

import networkx as nx

# (from_stop, to_stop, base_travel_minutes) — from 02_GRAPH_AND_SIMULATION.md
# corrected Corridor E base travel-time table. Times are estimates pending
# verification with UTM Fleet / Dr Sim (kdse->cp = 6 is a flagged placeholder).
CORRIDOR_E_EDGES: list[tuple[str, str, int]] = [
    ("kdoj", "klg", 3),
    ("klg", "kdse", 3),
    ("kdse", "cp", 6),
    ("cp", "n24", 4),
    ("n24", "ktc", 3),
    ("ktc", "cluster_t02", 4),
    ("cluster_t02", "cluster_t08", 3),
]


def build_corridor_e_graph() -> nx.DiGraph:
    """Build the directed weighted Corridor E graph. Implements Block 0 Task 3.

    8 nodes, 7 edges, no pku node. Each edge carries `base_time` (immutable
    segment estimate) and `weight` (initialised to base_time; the demand-aware
    weight refresh in module 02 updates `weight` per tick without touching
    `base_time`).
    """
    G = nx.DiGraph()
    for u, v, base_time in CORRIDOR_E_EDGES:
        G.add_edge(u, v, base_time=base_time, weight=base_time)
    return G


def get_eta(G: nx.DiGraph, source: str, target: str) -> float:
    """Return estimated travel time in minutes via Dijkstra shortest path.

    Implements Block 0 Task 4 (see 02_GRAPH_AND_SIMULATION.md). Returns
    float('inf') when no path exists between source and target.
    """
    try:
        return nx.dijkstra_path_length(G, source, target, weight="weight")
    except nx.NetworkXNoPath:
        return float("inf")
