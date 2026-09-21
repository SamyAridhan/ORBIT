"""Corridor E campus graph.

Implements Block 0 Task 3 (see BLOCK_0_GUIDE.md) and the Corridor E graph
described in docs_modules/02_GRAPH_AND_SIMULATION.md. Corridor E (KDOJ ->
Faculty Cluster) is the reference corridor; B and F follow later.

Directed weighted graph: directed because campus segments are largely one-way,
weighted because edge weights encode base travel time in minutes. `get_eta`
(Task 4) is intentionally NOT in this file yet.

NOTE (spec inconsistency flagged to review): module 02's Corridor E base
travel-time table gives the stop sequence used below
(kdoj -> klg -> kdse -> pku -> cp -> n24 -> ktc -> cluster_t02 -> cluster_t08).
Module 02's separate `E_STOPS` list instead omits `pku` (kdse -> cp direct) and
adds `cluster_t06`, but provides no travel times for that topology, so it is not
buildable as-is. This file follows the weighted table, which module 02 itself
marks as pending ground-truth confirmation.
"""

import networkx as nx

# (from_stop, to_stop, base_travel_minutes) — from 02_GRAPH_AND_SIMULATION.md
# "Approximate Base Travel Times" table for Corridor E. Times are estimates
# pending verification with UTM Fleet / Dr Sim (see module 02).
CORRIDOR_E_EDGES: list[tuple[str, str, int]] = [
    ("kdoj", "klg", 3),
    ("klg", "kdse", 3),
    ("kdse", "pku", 4),
    ("pku", "cp", 5),
    ("cp", "n24", 4),
    ("n24", "ktc", 3),
    ("ktc", "cluster_t02", 4),
    ("cluster_t02", "cluster_t08", 3),
]


def build_corridor_e_graph() -> nx.DiGraph:
    """Build the directed weighted Corridor E graph. Implements Block 0 Task 3.

    Each edge carries `base_time` (immutable segment estimate) and `weight`
    (initialised to base_time; the demand-aware weight refresh in module 02
    updates `weight` per tick without touching `base_time`).
    """
    G = nx.DiGraph()
    for u, v, base_time in CORRIDOR_E_EDGES:
        G.add_edge(u, v, base_time=base_time, weight=base_time)
    return G
