"""
Autonomous Optimization Jobs (R9S2E7-US1 / Architecture v2.1 §17.2.9).

Periodically mines query telemetry (`service_logs`), cache statistics, and
the semantic layer for warehouse-level improvement opportunities. Every
finding is a reviewable proposal in `optimization_proposals` — recommendations
are NEVER applied automatically (read-only, non-destructive posture, §14.3).
Expensive shared-key joins are cross-referenced against the Many-to-Many
Join gate (§16.2, Stage 1): a semantic-layer fix beats a warehouse index.
"""
from __future__ import annotations

import json
import re

SLOW_MS = 500
SLOW_MIN_COUNT = 5
LOW_HIT_RATE = 0.4
MIN_CACHE_TRAFFIC = 10


def _fingerprint(kind: str, target: str) -> str:
    return f'{kind}:{target}'


def _propose(conn, kind: str, target: str, recommendation: str, evidence: dict) -> bool:
    fp = _fingerprint(kind, target)
    if conn.execute('SELECT 1 FROM optimization_proposals WHERE fingerprint=?', (fp,)).fetchone():
        return False
    conn.execute('INSERT INTO optimization_proposals (kind, target, recommendation, '
                 "evidence_json, status, fingerprint) VALUES (?,?,?,?, 'proposed', ?)",
                 (kind, target, recommendation, json.dumps(evidence), fp))
    return True


def _p95(values):
    if not values:
        return 0
    v = sorted(values)
    return v[min(len(v) - 1, int(round(0.95 * (len(v) - 1))))]


def analyze(conn) -> int:
    """Run all analyzers; returns the number of new proposals."""
    created = 0

    # 1 — slow gold-layer queries → SQL rewrite proposals
    rows = conn.execute("SELECT path, duration_ms FROM service_logs "
                        "WHERE path LIKE '/api/gold/%' AND duration_ms >= ?", (SLOW_MS,)).fetchall()
    by_path: dict[str, list] = {}
    for r in rows:
        by_path.setdefault(r['path'], []).append(r['duration_ms'])
    for path, durations in by_path.items():
        if len(durations) < SLOW_MIN_COUNT:
            continue
        table = path.rstrip('/').rsplit('/', 1)[-1]
        created += _propose(
            conn, 'sql_rewrite', path,
            f'Rewrite the hot query on {table}: add a time-bounded WHERE clause and '
            f'route through a pre-aggregated summary table (see §3.5).',
            {'count': len(durations), 'p95_ms': _p95(durations)})

        # 2 — same hot table: index recommendation, skipped when covered
        m = re.match(r'^[a-z0-9_]+$', table or '')
        if m:
            has_index = conn.execute(
                "SELECT 1 FROM sqlite_master WHERE type='index' AND tbl_name=? "
                "AND (sql LIKE '%pipeline_run_id%' OR name LIKE '%run%')", (table,)).fetchone()
            table_exists = conn.execute(
                "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", (table,)).fetchone()
            if table_exists and not has_index:
                created += _propose(
                    conn, 'index_recommendation', table,
                    f'Add an index on {table}(pipeline_run_id) — hot filter column '
                    f'for artifact refresh reads.',
                    {'reads': len(durations)})

    # 3 — cold cache layers → key restructure proposals
    for s in conn.execute('SELECT * FROM cache_stats').fetchall():
        total = s['hits'] + s['misses']
        if total >= MIN_CACHE_TRAFFIC and (s['hits'] / total) < LOW_HIT_RATE:
            created += _propose(
                conn, 'cache_key_restructure', f"layer:{s['layer']}",
                f"Hit rate on the '{s['layer']}' cache layer is "
                f"{round(100 * s['hits'] / total)}% — restructure keys (coarser time "
                f"floor, drop volatile parts) so repeat traffic can hit (§17.7.3).",
                {'hits': s['hits'], 'misses': s['misses']})

    # 4 — expensive shared-key joins ↔ Many-to-Many Join gate (§16.2 Stage 1)
    row = conn.execute("SELECT schema_json FROM semantic_schemas WHERE workspace_id='default' "
                       'ORDER BY id DESC LIMIT 1').fetchone()
    if row:
        schema = json.loads(row['schema_json'])
        seen: dict[tuple, list] = {}
        for cube in schema.get('cubes') or []:
            for j in cube.get('joins') or []:
                seen.setdefault((j.get('to'), j.get('on')), []).append(cube.get('name'))
        for (target, on_key), cubes in seen.items():
            if len(cubes) >= 2:
                created += _propose(
                    conn, 'semantic_join_fix', f'{target} on {on_key}',
                    f'{len(cubes)} explores join {target} on {on_key} — fan-out risk. '
                    f'Define a bridge table / pre-aggregation in the semantic layer '
                    f'rather than a warehouse-level optimization.',
                    {'gate_ref': 'Many-to-Many Join (Stage 1, §16.2)',
                     'cubes': sorted(c for c in cubes if c)})
    conn.commit()
    return created
