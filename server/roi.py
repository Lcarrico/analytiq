"""
Automated ROI Tracking (R12S2E5-US1 / Architecture v2.1 §17.4.5).

Measures which dashboards actually influence decisions, not just generation
counts. Adoption signals (documented weights: view 1, export 2, annotation 2,
share 3, fork 3, subscription 4) against per-artifact cost.

Cost model (demo-stack adaptation, see PROGRESS.md ledger): matched
cost-ladder dispatches for the artifact's metric plus a fixed compute charge
per executed DAG node (0.001 per node) — real telemetry where it exists,
a documented constant where the stack has no billable substrate.
"""
from __future__ import annotations

import re

ADOPTION_WEIGHTS = {'view': 1, 'export': 2, 'annotation': 2, 'share': 3,
                    'fork': 3, 'subscription': 4}
NODE_COMPUTE_COST = 0.001


def _slug(text: str) -> str:
    return re.sub(r'[^a-z0-9]+', '_', (text or '').lower()).strip('_')


def artifact_roi(conn, artifact_id: int) -> dict | None:
    art = conn.execute('SELECT * FROM artifacts WHERE id=?', (artifact_id,)).fetchone()
    if not art:
        return None
    counts = {k: 0 for k in ('view', 'export', 'annotation', 'share', 'fork')}
    for r in conn.execute('SELECT kind, COUNT(*) c FROM artifact_activity WHERE artifact_id=? '
                          'GROUP BY kind', (artifact_id,)).fetchall():
        if r['kind'] in counts:
            counts[r['kind']] = r['c']
    subs = conn.execute('SELECT COUNT(*) c FROM metric_subscriptions WHERE artifact_id=?',
                        (artifact_id,)).fetchone()['c']
    annos = conn.execute('SELECT COUNT(*) c FROM artifact_annotations WHERE artifact_id=?',
                         (artifact_id,)).fetchone()['c']
    signals = {'views': counts['view'], 'exports': counts['export'],
               'shares': counts['share'], 'forks': counts['fork'],
               'annotations': max(counts['annotation'], annos),
               'subscriptions': subs}
    adoption = (signals['views'] * ADOPTION_WEIGHTS['view'] +
                signals['exports'] * ADOPTION_WEIGHTS['export'] +
                signals['annotations'] * ADOPTION_WEIGHTS['annotation'] +
                signals['shares'] * ADOPTION_WEIGHTS['share'] +
                signals['forks'] * ADOPTION_WEIGHTS['fork'] +
                signals['subscriptions'] * ADOPTION_WEIGHTS['subscription'])

    # cost: matched dispatches + per-node compute
    run = conn.execute('SELECT * FROM pipeline_runs WHERE id=?',
                       (art['pipeline_run_id'],)).fetchone() if art['pipeline_run_id'] else None
    sess = conn.execute('SELECT * FROM sessions WHERE id=?',
                        (run['session_id'],)).fetchone() if run else None
    dispatch_cost = 0.0
    if sess:
        mslug = _slug(sess['metric'])
        row = conn.execute('SELECT SUM(est_cost) s FROM task_dispatches WHERE signature LIKE ?',
                           (f'%{mslug.replace("_", " ")}%',)).fetchone()
        dispatch_cost = row['s'] or 0.0
    nodes = conn.execute('SELECT COUNT(*) c FROM dag_nodes WHERE run_id=?',
                         (run['id'],)).fetchone()['c'] if run else 0
    est_cost = round(dispatch_cost + nodes * NODE_COMPUTE_COST, 4) or NODE_COMPUTE_COST
    return {'artifact_id': artifact_id, 'signals': signals,
            'adoption_score': adoption, 'est_cost': est_cost,
            'roi_ratio': round(adoption / est_cost, 2)}


def workspace_report(conn, limit: int = 25) -> list[dict]:
    rows = []
    for a in conn.execute('SELECT id, title FROM artifacts WHERE is_sandbox=0 '
                          'ORDER BY id DESC LIMIT ?', (limit,)).fetchall():
        r = artifact_roi(conn, a['id'])
        if r:
            rows.append({'title': a['title'], **r})
    return sorted(rows, key=lambda r: -r['roi_ratio'])
