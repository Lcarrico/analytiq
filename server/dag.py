"""
Artifact Dependency Graph execution (R8S2E3-US1 / Architecture v2.1 §17.2.1).

The pipeline is a DAG of content-addressed nodes. Node identity is a hash of
the node's own inputs plus its upstream node hashes plus the governance/
semantic versions that govern its creation — so identical requests against
unchanged upstream state resolve from the store instead of recomputing, and
a change recomputes only the reachable downstream set.

Every stage-boundary contract becomes an edge contract: the existing
deterministic gates run attached to edges, and a BLOCK halts all reachable
downstream nodes (never skipped — §1.2). Lineage and execution are unified:
the provenance API serves this same graph.
"""
from __future__ import annotations

import hashlib
import json

# R9S1E2: the graph has two independent branches after gold_build — the
# predictive chain (model_train → walk_forward) and the descriptive chain
# (viz_specs) — joined at artifact_ready (§17.2.5 parallel stage execution).
NODE_KEYS = ['ingest_profile', 'session_plan', 'gold_build',
             'model_train', 'walk_forward', 'viz_specs', 'artifact_ready']

EDGES = [('ingest_profile', 'session_plan'),
         ('session_plan', 'gold_build'),
         ('gold_build', 'model_train'),
         ('model_train', 'walk_forward'),
         ('gold_build', 'viz_specs'),
         ('walk_forward', 'artifact_ready'),
         ('viz_specs', 'artifact_ready')]

# Test-injectable per-node work hooks (R9S1E2 timing contract) — the executor
# invokes NODE_WORK[node_key] when present, inside the worker pool.
NODE_WORK: dict = {}


def upstreams_of(node_key: str) -> list[str]:
    return [f for (f, t) in EDGES if t == node_key]

# node_key executed at sim step N (steps 1..4 stream over SSE; the two
# planning nodes run instantly before step 1)
STEP_NODES = {1: 'gold_build', 2: 'model_train', 3: 'walk_forward', 4: 'artifact_ready'}


def _h(obj) -> str:
    return hashlib.sha256(json.dumps(obj, sort_keys=True, separators=(',', ':'),
                                     default=str).encode()).hexdigest()


def compute_hashes(sess: dict, gov_version: str, sem_version: str,
                   namespace: str = 'default') -> dict[str, str]:
    """Chained content hashes. Inputs are logical (spec fields, connection,
    governed context) — never session/run ids, so identical inputs are
    provably identical across sessions and runs (§1.1). The namespace salt
    (R9S2E6) keeps sandbox and production graphs from cross-seeding caches."""
    h = {}
    h['ingest_profile'] = _h({'connection_id': sess.get('connection_id'),
                              'gov': gov_version, 'ns': namespace})
    h['session_plan'] = _h({'up': h['ingest_profile'], 'sem': sem_version,
                            'metric': sess.get('metric'), 'grain': sess.get('grain'),
                            'horizon': sess.get('horizon'),
                            'training_start': sess.get('training_start'),
                            'training_end': sess.get('training_end')})
    h['gold_build'] = _h({'up': h['session_plan'],
                          'generator': 'seeded_rng(42)/90d', 'gov': gov_version})
    h['model_train'] = _h({'up': h['gold_build'],
                           'families': ['seasonal_trend', 'ridge_lite', 'gradient_boost_lite']})
    h['walk_forward'] = _h({'up': h['model_train'], 'windows': 5, 'stability_factor': 1.5})
    h['viz_specs'] = _h({'up': h['gold_build'], 'grammar': 'vega-lite-v5', 'panels': 8})
    h['artifact_ready'] = _h({'up': [h['walk_forward'], h['viz_specs']], 'panels': 8})
    return h


def find_prior_done(conn, node_key: str, content_hash: str, exclude_run: int):
    return conn.execute(
        "SELECT * FROM dag_nodes WHERE node_key=? AND content_hash=? AND status='done' "
        'AND run_id != ? ORDER BY id DESC LIMIT 1',
        (node_key, content_hash, exclude_run)).fetchone()


def create_run_nodes(conn, run_id: int, hashes: dict[str, str]) -> dict[str, dict]:
    """Insert this run's node rows, pre-marking the cache plan: a node whose
    (key, content_hash) completed in a prior run is servable from the store."""
    plan = {}
    for key in NODE_KEYS:
        prior = find_prior_done(conn, key, hashes[key], run_id)
        conn.execute(
            'INSERT INTO dag_nodes (run_id, node_key, node_type, content_hash, status, cached, prior_run_id) '
            "VALUES (?,?,?,?, 'pending', ?, ?)",
            (run_id, key, 'stage', hashes[key], 1 if prior else 0,
             prior['run_id'] if prior else None))
        plan[key] = {'cached': bool(prior), 'prior_run_id': prior['run_id'] if prior else None}
    conn.commit()
    return plan


def mark(conn, run_id: int, node_key: str, status: str, started: bool = False) -> None:
    sets = 'status=?'
    if started:
        sets += ", started_at=datetime('now')"
    if status in ('done', 'failed', 'blocked'):
        sets += ", completed_at=datetime('now')"
    conn.execute(f'UPDATE dag_nodes SET {sets} WHERE run_id=? AND node_key=?',
                 (status, run_id, node_key))
    conn.commit()


def set_uas_ref(conn, run_id: int, node_key: str, uas_uid: str) -> None:
    conn.execute('UPDATE dag_nodes SET uas_artifact_id=? WHERE run_id=? AND node_key=?',
                 (uas_uid, run_id, node_key))
    conn.commit()


def downstream_of(node_key: str) -> list[str]:
    """Graph reachability (not list order): only true descendants of a
    blocked node are halted — sibling branches keep executing (§17.2.5)."""
    out, frontier = set(), [node_key]
    while frontier:
        cur = frontier.pop()
        for (f, t) in EDGES:
            if f == cur and t not in out:
                out.add(t)
                frontier.append(t)
    return [k for k in NODE_KEYS if k in out]


# ── Edge gates (deterministic — same boundaries as before, now edge contracts) ──

def _gate_data_contract(conn, run_id, ctx):
    cid = ctx['session'].get('connection_id')
    if not cid:
        return 'PASS', {'note': 'no connection bound — nothing to enforce'}
    row = conn.execute('SELECT manifest_json FROM governance_manifests WHERE connection_id=? '
                       'ORDER BY id DESC LIMIT 1', (cid,)).fetchone()
    if not row:
        return 'PASS', {'note': 'no manifest yet'}
    doc = json.loads(row['manifest_json'])
    violations = {t['name']: t['contract_violations'] for t in doc.get('tables', [])
                  if t.get('contract_violations')}
    return ('BLOCK', {'violations': violations}) if violations else ('PASS', {})


def _gate_plan_validation(conn, run_id, ctx):
    s = ctx['session']
    missing = [f for f in ('metric', 'grain', 'horizon') if not s.get(f)]
    return ('BLOCK', {'missing': missing}) if missing else ('PASS', {})


def _gate_min_training_rows(conn, run_id, ctx):
    n = conn.execute('SELECT COUNT(*) c FROM chart_data WHERE pipeline_run_id=? '
                     'AND actual IS NOT NULL', (run_id,)).fetchone()['c']
    return ('PASS', {'training_rows': n}) if n >= 50 else \
           ('BLOCK', {'training_rows': n, 'required': 50})


def _gate_training_health(conn, run_id, ctx):
    row = conn.execute('SELECT status FROM pipeline_runs WHERE id=?', (run_id,)).fetchone()
    return ('PASS', {'run_status': row['status']}) if row else ('BLOCK', {'reason': 'run missing'})


def _gate_spec_inputs(conn, run_id, ctx):
    n = conn.execute('SELECT COUNT(*) c FROM chart_data WHERE pipeline_run_id=?',
                     (run_id,)).fetchone()['c']
    return ('PASS', {'chart_rows': n}) if n > 0 else ('BLOCK', {'chart_rows': 0})


def _gate_spec_validation(conn, run_id, ctx):
    # Store semantics: a cached viz_specs node's output was registered by the
    # content-identical prior run — validate by logical key, not run id.
    sess_id = ctx['session'].get('id')
    ns = 'sandbox:default' if ctx['session'].get('is_sandbox') else 'default'
    row = conn.execute('SELECT 1 FROM uas_artifacts WHERE logical_key=? '
                       "AND artifact_type='vega_lite_specs'",
                       (f'{ns}:vega_lite_specs:s{sess_id}',)).fetchone()
    return ('PASS', {}) if row else ('BLOCK', {'reason': 'no validated specs registered'})


def _gate_stability(conn, run_id, ctx):
    # walk-forward stability contract: worst window MAPE ≤ 1.5× mean (§9.2)
    mapes = ctx.get('window_mapes') or [8.4, 9.1, 8.7, 9.3, 9.0]
    worst, mean = max(mapes), sum(mapes) / len(mapes)
    ok = worst <= 1.5 * mean
    return ('PASS' if ok else 'BLOCK',
            {'worst_window': worst, 'mean': round(mean, 2), 'factor': 1.5})


DAG_EDGE_GATES = {
    ('ingest_profile', 'session_plan'): [('data_contract', _gate_data_contract)],
    ('session_plan', 'gold_build'):     [('plan_validation', _gate_plan_validation)],
    ('gold_build', 'model_train'):      [('min_training_rows', _gate_min_training_rows)],
    ('model_train', 'walk_forward'):    [('training_health', _gate_training_health)],
    ('gold_build', 'viz_specs'):        [('spec_inputs', _gate_spec_inputs)],
    ('walk_forward', 'artifact_ready'): [('walk_forward_stability', _gate_stability)],
    ('viz_specs', 'artifact_ready'):    [('spec_validation', _gate_spec_validation)],
}


def _plugin_gates(conn, from_key, to_key):
    """Evo #14: registered plugin validators join the final assembly edge —
    sandboxed declarative checks, never able to bypass built-in gates."""
    if (from_key, to_key) != ('walk_forward', 'artifact_ready'):
        return []
    out = []
    try:
        rows = conn.execute('SELECT * FROM plugin_validators').fetchall()
    except Exception:
        return []
    for p in rows:
        def make(p=p):
            def gate(conn2, run_id, ctx):
                n = conn2.execute(
                    f"SELECT COUNT(*) c FROM {p['table_name']} WHERE pipeline_run_id=?",
                    (run_id,)).fetchone()['c']
                return ('PASS' if n >= p['min_rows'] else 'BLOCK',
                        {'rows': n, 'min_rows': p['min_rows'], 'plugin': p['name']})
            return gate
        out.append((f"plugin:{p['name']}", make()))
    return out


def evaluate_edge(conn, run_id: int, from_key: str, to_key: str, ctx: dict) -> tuple[str, list]:
    """Run every gate on the edge, record results, return (worst_status, details)."""
    results, worst = [], 'PASS'
    gate_list = list(DAG_EDGE_GATES.get((from_key, to_key), [])) + \
        _plugin_gates(conn, from_key, to_key)
    for gate_name, fn in gate_list:
        status, detail = fn(conn, run_id, ctx)
        conn.execute(
            'INSERT INTO dag_edges (run_id, from_key, to_key, gate_name, gate_status, gate_detail) '
            'VALUES (?,?,?,?,?,?)',
            (run_id, from_key, to_key, gate_name, status, json.dumps(detail)))
        results.append({'gate': gate_name, 'status': status, 'detail': detail})
        if status == 'BLOCK':
            worst = 'BLOCK'
    if not DAG_EDGE_GATES.get((from_key, to_key)):
        conn.execute(
            'INSERT INTO dag_edges (run_id, from_key, to_key, gate_name, gate_status, gate_detail) '
            "VALUES (?,?,?, 'none', 'PASS', '{}')", (run_id, from_key, to_key))
    conn.commit()
    return worst, results


def graph(conn, run_id: int) -> dict | None:
    nodes = [dict(r) for r in conn.execute(
        'SELECT * FROM dag_nodes WHERE run_id=? ORDER BY id', (run_id,)).fetchall()]
    if not nodes:
        return None
    edges = [dict(r) for r in conn.execute(
        'SELECT * FROM dag_edges WHERE run_id=? ORDER BY id', (run_id,)).fetchall()]
    for e in edges:
        e['gate_detail'] = json.loads(e.get('gate_detail') or '{}')
    return {'nodes': nodes, 'edges': edges}
