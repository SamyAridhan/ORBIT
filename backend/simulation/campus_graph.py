"""Corridor E campus graph for the ORBIT MAS backend.

Implements the Block 0 Corridor E subgraph (Task 3 graph + Task 4 get_eta), per
`BLOCK_0_GUIDE.md` and `docs_modules/02_GRAPH_AND_SIMULATION.md`, with the
September-2026 Corridor E correction applied:

- PKU is removed from Corridor E. PKU is a Bus D stop (`D_STOPS` in module 02); it must
  never appear on Corridor E. Its presence here would be a correctness bug.
- The old two-hop ``kdse -> pku -> cp`` is replaced by a single direct ``kdse -> cp`` edge.
- ``cluster_t06`` is deferred/provisional and is modelled absent — the cluster loop runs
  ``cluster_t02 -> cluster_t08`` directly.

Result: 8 nodes, 7 directed edges, forming the single outbound path
``kdoj -> klg -> kdse -> cp -> n24 -> ktc -> cluster_t02 -> cluster_t08``.
Verified: ``kdoj -> cluster_t02 = 23`` min, ``kdoj -> cluster_t08 = 26`` min.
"""

from __future__ import annotations

import networkx as nx

#: Corridor E edges as ``(source, destination, base_travel_minutes)``.
#: Base travel minutes are the estimates from module 02's Corridor E travel-time table,
#: except ``kdse -> cp`` (see placeholder note below). Directed, outbound only.
CORRIDOR_E_EDGES: list[tuple[str, str, int]] = [
    ("kdoj", "klg", 3),           # KDOJ -> KLG
    ("klg", "kdse", 3),           # KLG -> KDSE
    # PLACEHOLDER (not derived): single direct edge replacing the retired two-hop
    # kdse -> pku -> cp (4 + 5). 6 min is a stand-in until the real KDSE->CP segment
    # time is confirmed with Dr Sim / UTM Fleet. Do not present as a measured value.
    ("kdse", "cp", 6),            # KDSE -> CP (placeholder)
    ("cp", "n24", 4),             # CP -> N24
    ("n24", "ktc", 3),            # N24 -> KTC
    ("ktc", "cluster_t02", 4),    # KTC -> Cluster T02
    ("cluster_t02", "cluster_t08", 3),  # Cluster T02 -> T08 (one-way loop; T06 absent)
]


def build_corridor_e_graph() -> nx.DiGraph:
    """Build the directed, weighted Corridor E graph. Implements Block 0 Task 3.

    Each edge carries ``base_time`` (fixed segment estimate) and ``weight`` (used for
    ETA/pathfinding). On build, ``weight`` equals ``base_time``; call
    :func:`update_edge_weights` each tick to fold in live queue data.
    """
    g = nx.DiGraph()
    for source, dest, base_time in CORRIDOR_E_EDGES:
        g.add_edge(source, dest, base_time=base_time, weight=base_time)
    return g


def update_edge_weights(g: nx.DiGraph, queue_states: dict[str, int]) -> None:
    """Refresh edge weights from current queue data (module 02 edge-weight formula).

    ``W_edge = base_time * (1 + 1 / (queue_count_at_destination + 1))``. A higher queue
    at the destination lowers the penalty (bus is drawn there); an empty destination
    approaches a 2x penalty. Mutates ``g`` in place.
    """
    for _source, dest, data in g.edges(data=True):
        queue = queue_states.get(dest, 0)
        data["weight"] = data["base_time"] * (1 + 1 / (queue + 1))


def get_eta(g: nx.DiGraph, source: str, target: str) -> float:
    """Return estimated travel time (minutes) from ``source`` to ``target``.
    Implements Block 0 Task 4.

    Shortest path by ``weight`` via Dijkstra. Returns ``float("inf")`` when no directed
    path exists (e.g. a reverse traversal on this one-way corridor) or when either node
    is absent. See `docs_modules/02_GRAPH_AND_SIMULATION.md`.
    """
    try:
        return nx.dijkstra_path_length(g, source, target, weight="weight")
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        return float("inf")
