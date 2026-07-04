"""
R9S2E6-US1 — Simulation / Sandbox Mode (Architecture v2.1 §17.2.8)

A workspace can branch the artifact graph into an isolated sandbox namespace.
Sandbox work never touches production indices or caches, and promotion
re-runs the full deterministic gate set — sandbox mode is never a
governance bypass.
"""
from conftest import wait_until


def _run(client, sid):
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status')
               in ('done', 'failed'), timeout=30)
    return rid


def _sandbox_artifact(client, title='Sandbox What-If'):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue', 'sandbox': True}).get_json()['id']
    rid = _run(client, sid)
    art = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': title}).get_json()
    return sid, rid, art


def test_sandbox_runs_use_namespaced_uas(client, db):
    sid, rid, art = _sandbox_artifact(client)
    rows = db.execute('SELECT DISTINCT workspace_id FROM uas_artifacts WHERE run_id=?',
                      (rid,)).fetchall()
    assert {r['workspace_id'] for r in rows} == {'sandbox:default'}
    # excluded from the production store listing by default
    listed = client.get(f'/api/uas/artifacts?run_id={rid}').get_json()['artifacts']
    assert listed == []
    # visible when the sandbox namespace is asked for explicitly
    ns = client.get(f'/api/uas/artifacts?run_id={rid}&workspace=sandbox:default').get_json()['artifacts']
    assert ns


def test_sandbox_and_production_caches_are_isolated(client, db):
    prod_sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    _run(client, prod_sid)
    sand_sid = client.post('/api/sessions', json={'metric': 'Net Revenue', 'sandbox': True}).get_json()['id']
    sand_rid = _run(client, sand_sid)
    cached = db.execute('SELECT COUNT(*) c FROM dag_nodes WHERE run_id=? AND cached=1',
                        (sand_rid,)).fetchone()['c']
    assert cached == 0        # identical spec, but namespace-salted hashes → no cross-seeding


def test_sandbox_artifacts_hidden_from_production_surfaces(client, db):
    sid, rid, art = _sandbox_artifact(client, title='Hidden Sandbox Artifact')
    default_list = client.get('/api/artifacts').get_json()
    items = default_list.get('items', default_list) if isinstance(default_list, dict) else default_list
    assert all(a['id'] != art['id'] for a in items)
    sandbox_list = client.get('/api/artifacts?sandbox=1').get_json()
    s_items = sandbox_list.get('items', sandbox_list) if isinstance(sandbox_list, dict) else sandbox_list
    assert any(a['id'] == art['id'] for a in s_items)
    hits = client.get('/api/search?q=Hidden Sandbox').get_json()
    hit_list = hits if isinstance(hits, list) else (hits.get('results') or hits.get('hits') or [])
    assert all(h.get('artifact_id') != art['id'] and h.get('id') != art['id']
               for h in hit_list)


def test_promotion_reruns_full_gate_set_and_promotes(client, db):
    sid, rid, art = _sandbox_artifact(client, title='Promotable')
    r = client.post(f"/api/artifacts/{art['id']}/promote")
    assert r.status_code == 200
    body = r.get_json()
    assert body['gates'] and all(g['status'] == 'PASS' for g in body['gates'])
    default_list = client.get('/api/artifacts').get_json()
    items = default_list.get('items', default_list) if isinstance(default_list, dict) else default_list
    assert any(a['id'] == art['id'] for a in items)   # now in production
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='sandbox.promoted'").fetchone()
    prod_ref = db.execute("SELECT 1 FROM uas_artifacts WHERE workspace_id='default' "
                          "AND artifact_type='artifact_html_ref' AND logical_key LIKE ?",
                          (f"default:artifact_html_ref:a{art['id']}",)).fetchone()
    assert prod_ref


def test_gate_failing_sandbox_artifact_cannot_promote(client, db, monkeypatch):
    import dag
    sid, rid, art = _sandbox_artifact(client, title='Blocked Promo')
    monkeypatch.setitem(dag.DAG_EDGE_GATES, ('gold_build', 'model_train'),
                        [('min_training_rows', lambda conn, run_id, ctx:
                          ('BLOCK', {'reason': 'forced for promotion test'}))])
    r = client.post(f"/api/artifacts/{art['id']}/promote")
    assert r.status_code == 409                       # never a governance bypass
    assert any(g['status'] == 'BLOCK' for g in r.get_json()['gates'])
    default_list = client.get('/api/artifacts').get_json()
    items = default_list.get('items', default_list) if isinstance(default_list, dict) else default_list
    assert all(a['id'] != art['id'] for a in items)   # still sandboxed
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='sandbox.promotion_blocked'").fetchone()


def test_promote_requires_privileged_role(client):
    sid, rid, art = _sandbox_artifact(client, title='Role Gate')
    r = client.post(f"/api/artifacts/{art['id']}/promote", headers={'X-User-Role': 'viewer'})
    assert r.status_code == 403
    assert client.post('/api/artifacts/999999/promote').status_code == 404
