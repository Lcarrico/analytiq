"""
Workspace Knowledge Graph (R10S1E2-US1 / Architecture v2.1 §17.3.3).

Typed edges over metrics, dashboards, datasets, concepts, and users —
relationships that are real but do not fit the relational semantic layer:
which dashboards reference a metric, who investigates what, which metrics are
co-analyzed, which datasets join, and how metrics derive from one another.

Powers "related metrics" and "other teams analyze this" recommendations, and
feeds the Opportunity Engine (§17.4.1) with co-analysis candidates. The graph
grows incrementally on artifact/spec/semantic writes; a full rebuild endpoint
re-derives dataset edges from the current semantic schema.
"""
from __future__ import annotations

import json
import re

EDGE_TYPES = ('dashboard_references_metric', 'user_investigates_concept',
              'metrics_co_analyzed', 'dataset_joins_dataset',
              'metric_derived_from_metric')


def slug(text: str) -> str:
    return re.sub(r'[^a-z0-9]+', '_', (text or '').lower()).strip('_')


def add_edge(conn, edge_type: str, src: str, dst: str, weight: float = 1.0) -> None:
    assert edge_type in EDGE_TYPES, f'unknown edge type {edge_type!r}'
    if edge_type == 'metrics_co_analyzed':       # symmetric — store sorted
        src, dst = sorted((src, dst))
    conn.execute(
        'INSERT INTO kg_edges (edge_type, src_node, dst_node, weight) VALUES (?,?,?,?) '
        'ON CONFLICT(edge_type, src_node, dst_node) DO UPDATE SET '
        "weight = weight + excluded.weight, updated_at = datetime('now')",
        (edge_type, src, dst, weight))
    conn.commit()


def ingest_artifact(conn, artifact_id: int) -> int:
    """Incremental ingest on artifact create (§17.3.3): reference,
    investigation, and co-analysis edges from the artifact's lineage."""
    art = conn.execute('SELECT * FROM artifacts WHERE id=?', (artifact_id,)).fetchone()
    if not art:
        return 0
    run = conn.execute('SELECT * FROM pipeline_runs WHERE id=?',
                       (art['pipeline_run_id'],)).fetchone() if art['pipeline_run_id'] else None
    sess = conn.execute('SELECT * FROM sessions WHERE id=?',
                        (run['session_id'],)).fetchone() if run else None
    n = 0
    if sess:
        m = f"metric:{slug(sess['metric'])}"
        add_edge(conn, 'dashboard_references_metric', f'artifact:{artifact_id}', m); n += 1
        if art['owner']:
            add_edge(conn, 'user_investigates_concept', f"user:{art['owner']}", m); n += 1
    return n


def ingest_spec(conn, session_id: int, spec: dict) -> int:
    """Co-analysis edges from a confirmed session spec."""
    target = f"metric:{slug(spec.get('target_metric') or '')}"
    n = 0
    for cand in spec.get('feature_candidates') or []:
        add_edge(conn, 'metrics_co_analyzed', target, f'metric:{slug(cand)}'); n += 1
    return n


def ingest_semantic_schema(conn, schema: dict) -> int:
    """Dataset-join edges from the current semantic schema."""
    n = 0
    for cube in schema.get('cubes') or []:
        for j in cube.get('joins') or []:
            if j.get('to'):
                add_edge(conn, 'dataset_joins_dataset',
                         f"dataset:{cube.get('name')}", f"dataset:{j['to']}"); n += 1
    return n


def rebuild(conn) -> int:
    row = conn.execute("SELECT schema_json FROM semantic_schemas WHERE workspace_id='default' "
                       'ORDER BY id DESC LIMIT 1').fetchone()
    n = 0
    if row:
        n += ingest_semantic_schema(conn, json.loads(row['schema_json']))
    for art in conn.execute('SELECT id FROM artifacts').fetchall():
        n += ingest_artifact(conn, art['id'])
    return n


def related_metrics(conn, metric: str, limit: int = 10) -> list[dict]:
    """Neighbors of a metric across co-analysis, derivation, and shared
    dashboards, ranked by summed edge weight."""
    node = f'metric:{slug(metric)}'
    scores: dict[str, float] = {}
    for r in conn.execute(
            "SELECT * FROM kg_edges WHERE edge_type IN "
            "('metrics_co_analyzed', 'metric_derived_from_metric') "
            'AND (src_node=? OR dst_node=?)', (node, node)).fetchall():
        other = r['dst_node'] if r['src_node'] == node else r['src_node']
        if other.startswith('metric:') and other != node:
            scores[other] = scores.get(other, 0.0) + r['weight']
    ranked = sorted(scores.items(), key=lambda kv: -kv[1])[:limit]
    return [{'metric': k.split(':', 1)[1], 'weight': v} for k, v in ranked]


def co_analysis(conn, metric: str, limit: int = 10) -> dict:
    """Who analyzes this metric, and what else do they analyze."""
    node = f'metric:{slug(metric)}'
    analysts = [r['src_node'] for r in conn.execute(
        "SELECT src_node FROM kg_edges WHERE edge_type='user_investigates_concept' "
        'AND dst_node=? ORDER BY weight DESC LIMIT ?', (node, limit)).fetchall()]
    also: dict[str, float] = {}
    for a in analysts:
        for r in conn.execute(
                "SELECT dst_node, weight FROM kg_edges WHERE "
                "edge_type='user_investigates_concept' AND src_node=? AND dst_node != ?",
                (a, node)).fetchall():
            also[r['dst_node']] = also.get(r['dst_node'], 0.0) + r['weight']
    return {'analysts': [{'user': a.split(':', 1)[1]} for a in analysts],
            'also_analyzed': [{'metric': k.split(':', 1)[1], 'weight': v}
                              for k, v in sorted(also.items(), key=lambda kv: -kv[1])[:limit]]}
