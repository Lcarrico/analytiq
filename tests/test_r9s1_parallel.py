"""
R9S1E2-US1 — Parallel Stage Execution (Architecture v2.1 §17.2.5)

Independent DAG branches execute concurrently in worker pools under a
per-workspace concurrency budget; fan-in join points re-validate gates
before assembly.
"""
import time

from conftest import wait_until


def _timed_run(client, metric):
    sid = client.post('/api/sessions', json={'metric': metric}).get_json()['id']
    t0 = time.monotonic()
    run = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status')
               in ('done', 'failed'), timeout=30)
    return sid, run['runId'], time.monotonic() - t0


def _instrument(monkeypatch, seconds):
    import dag
    slow = lambda conn, run_id, ctx: time.sleep(seconds)
    monkeypatch.setitem(dag.NODE_WORK, 'model_train', slow)
    monkeypatch.setitem(dag.NODE_WORK, 'viz_specs', slow)


def test_independent_branches_run_concurrently(client, db, monkeypatch):
    _instrument(monkeypatch, 0.5)
    sid, run_id, elapsed = _timed_run(client, 'Parallel A')
    assert client.get(f'/api/pipeline/{run_id}').get_json()['status'] == 'done'
    # two 0.5s branches in parallel: well under the 1.0s serial sum
    assert elapsed < 0.95, f'branches did not overlap (took {elapsed:.2f}s)'
    # both branch nodes actually ran (not cached, not skipped)
    rows = {r['node_key']: r for r in db.execute(
        'SELECT * FROM dag_nodes WHERE run_id=?', (run_id,)).fetchall()}
    assert rows['model_train']['status'] == 'done'
    assert rows['viz_specs']['status'] == 'done'


def test_budget_one_serializes_branches(client, db, monkeypatch):
    _instrument(monkeypatch, 0.5)
    r = client.put('/api/platform/concurrency', json={'budget': 1})
    assert r.status_code == 200
    try:
        sid, run_id, elapsed = _timed_run(client, 'Serial B')
        assert client.get(f'/api/pipeline/{run_id}').get_json()['status'] == 'done'
        assert elapsed >= 0.95, f'budget=1 should serialize (took {elapsed:.2f}s)'
    finally:
        client.put('/api/platform/concurrency', json={'budget': 4})


def test_results_identical_parallel_vs_serial(client, db, monkeypatch):
    sid1, run1, _ = _timed_run(client, 'Same Result')
    client.put('/api/platform/concurrency', json={'budget': 1})
    try:
        sid2 = client.post('/api/sessions', json={'metric': 'Same Result'}).get_json()['id']
        run2 = client.post('/api/pipeline/run', json={'sessionId': sid2}).get_json()['runId']
        wait_until(lambda: client.get(f'/api/pipeline/{run2}').get_json().get('status')
                   in ('done', 'failed'), timeout=30)
    finally:
        client.put('/api/platform/concurrency', json={'budget': 4})
    counts = lambda run: (
        db.execute('SELECT COUNT(*) c FROM gold_predictions WHERE pipeline_run_id=?', (run,)).fetchone()['c'],
        db.execute('SELECT COUNT(*) c FROM gold_forecast WHERE pipeline_run_id=?', (run,)).fetchone()['c'])
    assert counts(run1) == counts(run2) == (76, 14)
    h = lambda run: {r['node_key']: r['content_hash'] for r in db.execute(
        'SELECT * FROM dag_nodes WHERE run_id=?', (run,)).fetchall()}
    assert h(run1) == h(run2)                     # identical inputs → identical graph


def test_join_point_revalidates_both_incoming_gates(client, db):
    sid, run_id, _ = _timed_run(client, 'Join Gate')
    gates = db.execute("SELECT gate_name, gate_status FROM dag_edges WHERE run_id=? "
                       "AND to_key='artifact_ready'", (run_id,)).fetchall()
    names = {g['gate_name'] for g in gates}
    assert names == {'walk_forward_stability', 'spec_validation'}   # barrier condition
    assert all(g['gate_status'] == 'PASS' for g in gates)


def test_budget_endpoint_validation(client):
    assert client.put('/api/platform/concurrency', json={'budget': 0}).status_code == 400
    assert client.put('/api/platform/concurrency', json={'budget': 'x'}).status_code == 400
    r = client.put('/api/platform/concurrency', json={'budget': 8})
    assert r.status_code == 200 and r.get_json()['budget'] == 8
    client.put('/api/platform/concurrency', json={'budget': 4})
