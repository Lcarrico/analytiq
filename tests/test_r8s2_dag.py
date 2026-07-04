"""
R8S2E3-US1 — Artifact Dependency Graph execution (Architecture v2.1 §17.2.1)

Pipeline runs execute as a DAG of content-addressed nodes: a re-run recomputes
only nodes whose upstream state changed; every gate is an edge contract;
lineage and execution share one structure.
"""
import json

from conftest import wait_until

# R9S1E2 added the parallel viz_specs branch — the graph is now 7 nodes and
# 7 gated edges, joined at artifact_ready.
NODE_KEYS = ['ingest_profile', 'session_plan', 'gold_build',
             'model_train', 'walk_forward', 'viz_specs', 'artifact_ready']


def _run(client, metric='Net Revenue', horizon=14):
    sid = client.post('/api/sessions', json={'metric': metric, 'horizon': horizon}).get_json()['id']
    return sid, _rerun(client, sid)


def _rerun(client, sid):
    run = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status')
               in ('done', 'failed'), timeout=30)
    return run['runId']


def test_run_builds_full_node_graph_with_gated_edges(client, db):
    sid, run_id = _run(client)
    nodes = db.execute('SELECT * FROM dag_nodes WHERE run_id=? ORDER BY id', (run_id,)).fetchall()
    assert [n['node_key'] for n in nodes] == NODE_KEYS
    for n in nodes:
        assert n['status'] == 'done'
        assert n['cached'] == 0                       # first run computes everything
        assert len(n['content_hash']) == 64
        assert n['completed_at'] is not None
    edges = db.execute('SELECT * FROM dag_edges WHERE run_id=?', (run_id,)).fetchall()
    assert len(edges) == 7                            # R9S1E2: branch edges added
    assert all(e['gate_name'] and e['gate_status'] == 'PASS' for e in edges)


def test_identical_rerun_serves_cached_nodes(client, db):
    sid, run1 = _run(client)
    h1 = {n['node_key']: n['content_hash'] for n in
          db.execute('SELECT * FROM dag_nodes WHERE run_id=?', (run1,)).fetchall()}
    run2 = _rerun(client, sid)
    nodes2 = db.execute('SELECT * FROM dag_nodes WHERE run_id=?', (run2,)).fetchall()
    cached = {n['node_key'] for n in nodes2 if n['cached']}
    assert set(NODE_KEYS) == cached                   # unchanged upstream → all cached
    # deterministic content addressing: identical inputs → identical hashes
    assert {n['node_key']: n['content_hash'] for n in nodes2} == h1
    # cached gold node still serves data for the new run (copied from store)
    preds = db.execute('SELECT COUNT(*) c FROM gold_predictions WHERE pipeline_run_id=?',
                       (run2,)).fetchone()['c']
    assert preds == 76
    assert client.get(f'/api/pipeline/{run2}').get_json()['status'] == 'done'


def test_spec_change_recomputes_minimal_set(client, db):
    sid1, run1 = _run(client, horizon=14)
    # different session, different horizon, same (null) connection + manifest:
    # only the ingest/profile node's inputs are unchanged
    sid2 = client.post('/api/sessions', json={'metric': 'Net Revenue', 'horizon': 30}).get_json()['id']
    run2 = _rerun(client, sid2)
    nodes = {n['node_key']: n for n in
             db.execute('SELECT * FROM dag_nodes WHERE run_id=?', (run2,)).fetchall()}
    assert nodes['ingest_profile']['cached'] == 1     # unchanged upstream state
    for key in ('session_plan', 'gold_build', 'model_train', 'walk_forward',
                'viz_specs', 'artifact_ready'):       # R9S1E2: viz branch recomputes too
        assert nodes[key]['cached'] == 0, key         # changed spec → recompute reachable set


def test_same_inputs_same_hash_across_sessions(client, db):
    """Content identity is input-derived, not session-id-derived (§17.2.1)."""
    sid1, run1 = _run(client, horizon=14)
    sid2 = client.post('/api/sessions', json={'metric': 'Net Revenue', 'horizon': 14}).get_json()['id']
    run2 = _rerun(client, sid2)
    h = lambda run, key: db.execute(
        'SELECT content_hash FROM dag_nodes WHERE run_id=? AND node_key=?',
        (run, key)).fetchone()['content_hash']
    assert h(run1, 'session_plan') == h(run2, 'session_plan')
    assert h(run1, 'gold_build') == h(run2, 'gold_build')


def test_edge_gate_block_halts_downstream(client, db, monkeypatch):
    import app as app_mod
    import dag

    def blocking_gate(conn, run_id, ctx):
        return 'BLOCK', {'reason': 'forced by test (R8S2E3 halt contract)'}

    monkeypatch.setitem(dag.DAG_EDGE_GATES, ('gold_build', 'model_train'),
                        [('min_training_rows', blocking_gate)])
    sid, run_id = _run(client)
    run = client.get(f'/api/pipeline/{run_id}').get_json()
    assert run['status'] == 'failed'
    nodes = {n['node_key']: n for n in
             db.execute('SELECT * FROM dag_nodes WHERE run_id=?', (run_id,)).fetchall()}
    assert nodes['gold_build']['status'] == 'done'    # upstream completed
    for key in ('model_train', 'walk_forward', 'artifact_ready'):
        assert nodes[key]['status'] == 'blocked'      # gate halts true descendants
    # R9S1E2: sibling branch is NOT a descendant of the blocked edge — it runs
    assert nodes['viz_specs']['status'] == 'done'
    edge = db.execute("SELECT * FROM dag_edges WHERE run_id=? AND from_key='gold_build' "
                      "AND to_key='model_train'", (run_id,)).fetchone()
    assert edge['gate_status'] == 'BLOCK'


def test_dag_endpoint_contract(client, db):
    sid, run_id = _run(client)
    r = client.get(f'/api/pipeline/{run_id}/dag')
    assert r.status_code == 200
    body = r.get_json()
    assert {n['node_key'] for n in body['nodes']} == set(NODE_KEYS)
    assert all({'status', 'cached', 'content_hash'} <= set(n) for n in body['nodes'])
    assert len(body['edges']) == 7                    # R9S1E2
    assert all({'from_key', 'to_key', 'gate_name', 'gate_status'} <= set(e) for e in body['edges'])
    assert client.get('/api/pipeline/999999/dag').status_code == 404


def test_steps_and_sse_payloads_carry_node_keys(client, db):
    sid, run_id = _run(client)
    steps = client.get(f'/api/pipeline/{run_id}/steps').get_json()
    keys = [s.get('node_key') for s in steps]
    assert keys == ['gold_build', 'model_train', 'walk_forward', 'artifact_ready']


def test_provenance_unifies_lineage_and_execution(client, db):
    """§17.2.1: the lineage DAG is the literal execution structure."""
    sid, run_id = _run(client)
    art = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'DAG Prov'}).get_json()
    r = client.get(f"/api/artifacts/{art['id']}/provenance").get_json()
    assert 'dag' in r
    assert {n['node_key'] for n in r['dag']['nodes']} == set(NODE_KEYS)
    assert len(r['dag']['edges']) == 7                # R9S1E2
