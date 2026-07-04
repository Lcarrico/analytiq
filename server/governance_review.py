"""
AI-Assisted Governance Review (R10S2E6-US1 / Architecture v2.1 §17.3.7).

Ranks the low-confidence review queue by supporting evidence so admins clear
the backlog in value order instead of an undifferentiated list:
- usage_frequency — how often the definition's concept is actually analyzed
  (session specs + knowledge-graph references);
- similarity_to_approved — token similarity to an already-accepted
  definition (high similarity → likely fast approve);
- conflict_flags — same-name definitions elsewhere (cites the Metric
  Definition Conflict gate, §16.2 Stage 1).

Deterministic score: 0.5·min(1, usage/5) + 0.4·similarity + 0.3·conflict.
Triage changes ORDER and adds CONTEXT only — approval authority is exactly
the pre-existing role gate (§17.3.7: "admin retains sole approval
authority").
"""
from __future__ import annotations

import json
import re


def _slug(text: str) -> str:
    return re.sub(r'[^a-z0-9]+', '_', (text or '').lower()).strip('_')


def _tokens(text: str) -> set:
    return set(re.findall(r'[a-z0-9]+', (text or '').lower()))


def _similarity(a: str, b: str) -> float:
    ta, tb = _tokens(a), _tokens(b)
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / len(ta | tb)


def _usage_counts(conn) -> dict[str, int]:
    counts: dict[str, int] = {}
    for r in conn.execute('SELECT spec_json FROM session_specs').fetchall():
        spec = json.loads(r['spec_json'])
        for name in [spec.get('target_metric')] + (spec.get('feature_candidates') or []):
            s = _slug(name or '')
            if s:
                counts[s] = counts.get(s, 0) + 1
    for r in conn.execute("SELECT src_node, dst_node FROM kg_edges").fetchall():
        for node in (r['src_node'], r['dst_node']):
            if node.startswith('metric:'):
                s = node.split(':', 1)[1]
                counts[s] = counts.get(s, 0) + 1
    return counts


def annotate_and_rank(conn, items: list[dict]) -> list[dict]:
    usage = _usage_counts(conn)
    approved = conn.execute(
        "SELECT name, definition FROM semantic_definitions WHERE status='accepted'").fetchall()
    all_defs = conn.execute(
        'SELECT id, name, type, explore FROM semantic_definitions').fetchall()

    for item in items:
        s = _slug(item['name'])
        freq = usage.get(s, 0)
        sim = max((_similarity(item.get('definition') or item['name'],
                               (a['definition'] or a['name']))
                   for a in approved), default=0.0)
        conflicts = []
        for d in all_defs:
            if d['id'] != item['id'] and _slug(d['name']) == s and \
                    (d['type'] != item['type'] or d['explore'] != item.get('explore')):
                conflicts.append(
                    f"Metric Definition Conflict (Stage 1, §16.2): '{d['name']}' also "
                    f"defined as {d['type']} in {d['explore']}")
        score = round(0.5 * min(1.0, freq / 5.0) + 0.4 * round(sim, 3)
                      + (0.3 if conflicts else 0.0), 3)
        item['evidence'] = {'usage_frequency': freq,
                            'similarity_to_approved': round(sim, 3),
                            'conflict_flags': conflicts,
                            'evidence_score': score}
    return sorted(items, key=lambda i: -i['evidence']['evidence_score'])
