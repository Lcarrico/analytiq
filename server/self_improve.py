"""
Self-Improving Platform Loop (R12S2E3-US1 / Architecture v2.1 §17.4.2).

The Evolution Engine's core loop: mine the store and usage telemetry for
platform-level improvement signals and route each to its consumer —

- popular_metric    → benchmark library (build benchmarks for what people
                      actually look at first, §17.6.1);
- abandoned_filter  → planner (a feature added then removed mid-configuration
                      should stop being offered by default, §17.2.6);
- repeated_edit     → semantic evolution (many manual edits of the same
                      definition are a rename/refine proposal, §17.3.4);
- recurring_failure → meta-orchestrator (systemic, not user-facing, §17.2.7).

Every delivery is audited: the trail proves each signal reached its consumer.
"""
from __future__ import annotations

import json
import re

POPULAR_MIN = 3
EDIT_MIN = 2
FAILURE_MIN = 3


def _slug(text: str) -> str:
    return re.sub(r'[^a-z0-9]+', '_', (text or '').lower()).strip('_')


def _emit(conn, kind, subject, consumer, detail) -> bool:
    fp = f'{kind}:{subject}'
    if conn.execute('SELECT 1 FROM platform_signals WHERE fingerprint=?', (fp,)).fetchone():
        return False
    conn.execute('INSERT INTO platform_signals (signal_kind, subject, consumer, detail_json, '
                 "status, fingerprint) VALUES (?,?,?,?, 'delivered', ?)",
                 (kind, subject, consumer, json.dumps(detail), fp))
    conn.execute('INSERT INTO audit_logs (org_id, user_email, action, resource_type, resource_id, metadata) '
                 'VALUES (?,?,?,?,?,?)',
                 (None, None, 'signal.delivered', 'platform_signal', fp,
                  json.dumps({'kind': kind, 'consumer': consumer})))
    return True


def mine(conn) -> int:
    created = 0

    # 1 — popular metrics from confirmed specs
    counts: dict[str, int] = {}
    for r in conn.execute('SELECT spec_json FROM session_specs').fetchall():
        m = _slug(json.loads(r['spec_json']).get('target_metric') or '')
        if m:
            counts[m] = counts.get(m, 0) + 1
    for m, n in counts.items():
        if n >= POPULAR_MIN:
            created += _emit(conn, 'popular_metric', m, 'benchmark_library', {'count': n})

    # 2 — abandoned filters: features present in an earlier spec version but
    # dropped from the final one (added then removed mid-configuration)
    sessions = conn.execute('SELECT DISTINCT session_id FROM session_specs').fetchall()
    for s in sessions:
        versions = conn.execute('SELECT spec_json FROM session_specs WHERE session_id=? '
                                'ORDER BY spec_version', (s['session_id'],)).fetchall()
        if len(versions) < 2:
            continue
        earlier = set()
        for v in versions[:-1]:
            earlier |= {_slug(f) for f in json.loads(v['spec_json']).get('feature_candidates') or []}
        final = {_slug(f) for f in
                 json.loads(versions[-1]['spec_json']).get('feature_candidates') or []}
        for dropped in sorted(earlier - final):
            created += _emit(conn, 'abandoned_filter', dropped, 'planner',
                             {'session_id': s['session_id']})

    # 3 — repeated edits of the same semantic definition
    edits: dict[str, int] = {}
    for r in conn.execute("SELECT resource_id FROM audit_logs WHERE action='semantic.edited'").fetchall():
        d = conn.execute('SELECT name FROM semantic_definitions WHERE id=?',
                         (r['resource_id'],)).fetchone()
        if d:
            edits[d['name']] = edits.get(d['name'], 0) + 1
    for name, n in edits.items():
        if n >= EDIT_MIN:
            created += _emit(conn, 'repeated_edit', name, 'semantic_evolution', {'edits': n})

    # 4 — recurring gate failures
    n_fail = conn.execute("SELECT COUNT(*) c FROM audit_logs WHERE action='pipeline.gate_blocked' "
                          "AND created_at >= datetime('now', '-60 minutes')").fetchone()['c']
    if n_fail >= FAILURE_MIN:
        created += _emit(conn, 'recurring_failure', f'window_failures_{n_fail}',
                         'meta_orchestrator', {'failures': n_fail, 'window_minutes': 60})
    conn.commit()
    return created
