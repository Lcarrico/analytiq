"""
Dashboard Health Scoring (R11S2E5-US1 / Architecture v2.1 §17.5.5).

Composite quality signal per dashboard, mean of five 0–100 components:
- readability   — validator checks from assembly (−15 per failed check);
- accessibility — the aria gate result from the same validator (§16.2 Stage 9);
- redundancy    — knowledge-graph near-duplicates: other dashboards on the
                  same metric (−15 each, floor 40) — feeds reuse, not sprawl;
- performance   — p95 gold-layer read latency (100 up to 250ms, scaled down
                  to 20 at 2s+);
- usefulness    — adoption signals (views/shares/forks/annotations):
                  40 + 12·count, capped at 100.

A signal for admins — never a delivery gate.
"""
from __future__ import annotations

import json


def _validator(conn, artifact_id):
    row = conn.execute('SELECT validator_json FROM artifact_files WHERE artifact_id=? '
                       'ORDER BY version DESC LIMIT 1', (artifact_id,)).fetchone()
    return json.loads(row['validator_json'] or '{}') if row else {}


def _p95_gold_latency(conn):
    rows = [r['duration_ms'] for r in conn.execute(
        "SELECT duration_ms FROM service_logs WHERE path LIKE '/api/gold/%' "
        'AND duration_ms IS NOT NULL').fetchall()]
    if not rows:
        return None
    rows.sort()
    return rows[min(len(rows) - 1, int(round(0.95 * (len(rows) - 1))))]


def score(conn, artifact_id: int) -> dict | None:
    art = conn.execute('SELECT * FROM artifacts WHERE id=?', (artifact_id,)).fetchone()
    if not art:
        return None
    v = _validator(conn, artifact_id)
    checks = v.get('checks') or []
    failed = [c for c in checks if not c.get('ok')]
    readability = max(40, 100 - 15 * len(failed))
    aria_ok = all(c.get('ok') for c in checks if c.get('code') == 'aria')
    accessibility = 100 if aria_ok else 0

    run = conn.execute('SELECT * FROM pipeline_runs WHERE id=?',
                       (art['pipeline_run_id'],)).fetchone() if art['pipeline_run_id'] else None
    sess = conn.execute('SELECT * FROM sessions WHERE id=?',
                        (run['session_id'],)).fetchone() if run else None
    redundancy = 100
    if sess:
        import knowledge_graph as kg
        node = f"metric:{kg.slug(sess['metric'])}"
        dups = conn.execute("SELECT COUNT(*) c FROM kg_edges WHERE "
                            "edge_type='dashboard_references_metric' AND dst_node=?",
                            (node,)).fetchone()['c']
        redundancy = max(40, 100 - 15 * max(0, dups - 1))

    p95 = _p95_gold_latency(conn)
    if p95 is None or p95 <= 250:
        performance = 100
    else:
        performance = max(20, round(100 - (p95 - 250) / 1750 * 80))

    activity = conn.execute('SELECT COUNT(*) c FROM artifact_activity WHERE artifact_id=?',
                            (artifact_id,)).fetchone()['c']
    usefulness = min(100, 40 + 12 * activity)

    components = {'readability': readability, 'accessibility': accessibility,
                  'redundancy': redundancy, 'performance': performance,
                  'usefulness': usefulness}
    return {'artifact_id': artifact_id, 'score': round(sum(components.values()) / 5),
            'components': components}
