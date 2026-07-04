"""
Organizational Knowledge Reuse (R10S2E7-US1 / Architecture v2.1 §17.3.6).

Similarity matching over prior validated dashboard plans (Unified Artifact
Store) plus knowledge-graph relatedness surfaces candidate starting points
for new requests. Applying a candidate constructs a fresh spec for the NEW
session and re-runs the full spec validation gate set — reuse accelerates
planning, it never skips governance (§17.3.6).
"""
from __future__ import annotations

import json
import re

SIMILARITY_FLOOR = 0.35
KG_BOOST = 0.2


def _slug(text: str) -> str:
    return re.sub(r'[^a-z0-9]+', '_', (text or '').lower()).strip('_')


def _tokens(text: str) -> set:
    return set(re.findall(r'[a-z0-9]+', (text or '').lower()))


def _metric_similarity(a: str, b: str) -> float:
    ta, tb = _tokens(a), _tokens(b)
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / len(ta | tb)


def _kg_related(conn, metric_a: str, metric_b: str) -> bool:
    na, nb = f'metric:{_slug(metric_a)}', f'metric:{_slug(metric_b)}'
    lo, hi = sorted((na, nb))
    row = conn.execute(
        "SELECT 1 FROM kg_edges WHERE edge_type IN "
        "('metrics_co_analyzed', 'metric_derived_from_metric') "
        'AND ((src_node=? AND dst_node=?) OR (src_node=? AND dst_node=?))',
        (lo, hi, hi, lo)).fetchone()
    return row is not None


def find_candidates(conn, metric: str, grain: str | None = None, limit: int = 5) -> list[dict]:
    rows = conn.execute(
        "SELECT * FROM uas_artifacts WHERE artifact_type='dashboard_plan' "
        "AND workspace_id NOT LIKE 'sandbox:%' ORDER BY id DESC LIMIT 100").fetchall()
    seen_keys, cands = set(), []
    for r in rows:
        if r['logical_key'] in seen_keys:                 # newest version only
            continue
        seen_keys.add(r['logical_key'])
        payload = json.loads(r['payload_json'])
        sim = 0.6 * _metric_similarity(metric, payload.get('metric') or '')
        if grain and payload.get('grain') == grain:
            sim += 0.2
        related = _kg_related(conn, metric, payload.get('metric') or '')
        if related:
            sim += KG_BOOST
        if _slug(metric) == _slug(payload.get('metric') or ''):
            sim += 0.4                                    # exact concept match
        sim = round(min(1.0, sim), 3)
        # KG-related concepts surface even without text overlap — expressing
        # exactly the relationships the relational model can't (§17.3.3)
        if sim >= SIMILARITY_FLOOR or related:
            cands.append({'plan_uid': r['artifact_uid'], 'similarity': sim,
                          'kg_related': related,
                          'payload': {k: payload.get(k) for k in
                                      ('metric', 'grain', 'horizon', 'title')},
                          'plan_version': r['version']})
    return sorted(cands, key=lambda c: -c['similarity'])[:limit]


def build_spec_from_plan(payload: dict, session: dict) -> dict:
    """Draft a session spec for the NEW session from a prior plan. The draft
    still passes through planner.validate_session_spec — full gate set."""
    return {
        'intent': 'predictive',
        'intent_confidence': 0.9,
        'analytic_goal': f"Reused plan: {payload.get('title') or payload.get('metric')}",
        'target_metric': payload.get('metric'),
        'feature_candidates': [],
        'date_range': {'start': session.get('training_start') or '2023-01-01',
                       'end': session.get('training_end') or '2023-12-31'},
        'grain': payload.get('grain') or session.get('grain') or 'Location · Day',
        'output_type': 'forecast_dashboard',
        'prediction_horizon': payload.get('horizon') or session.get('horizon') or 14,
        'explores_used': [],
        'semantic_layer_version': '1.0.0',
        'governance_manifest_version': '1.0.0',
    }
