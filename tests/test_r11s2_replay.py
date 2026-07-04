"""
R11S2E3-US1 — Artifact Replay / Debugger (Architecture v2.1 §17.5.3)

Any run replays step by step through the DAG showing each node's stored
artifact — read-only, straight from the store. Failed repair attempts are
retained and visible even when a later attempt succeeded.
"""
import json

from conftest import wait_until


def _artifact(client, metric='Net Revenue'):
    sid = client.post('/api/sessions', json={'metric': metric}).get_json()['id']
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done',
               timeout=30)
    art = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'Replay'}).get_json()
    return sid, rid, art


def test_replay_walks_nodes_in_order_with_stored_payloads(client, db):
    sid, rid, art = _artifact(client)
    r = client.get(f'/api/pipeline/{rid}/replay')
    assert r.status_code == 200
    steps = r.get_json()['steps']
    keys = [s['node_key'] for s in steps]
    assert keys == ['ingest_profile', 'session_plan', 'gold_build',
                    'model_train', 'walk_forward', 'viz_specs', 'artifact_ready']
    by = {s['node_key']: s for s in steps}
    assert by['session_plan']['uas_payload']['metric'] == 'Net Revenue'
    assert by['viz_specs']['uas_payload']['metric_format'] == 'currency'
    assert all('gates' in s for s in steps)
    assert all(len(s['content_hash']) == 64 for s in steps)


def test_replay_is_read_only(client, db):
    sid, rid, art = _artifact(client)
    counts = lambda: tuple(db.execute(f'SELECT COUNT(*) c FROM {t}').fetchone()['c']
                           for t in ('uas_artifacts', 'dag_nodes', 'dag_edges',
                                     'chart_data', 'pipeline_runs'))
    before = counts()
    client.get(f'/api/pipeline/{rid}/replay')
    assert counts() == before
    assert client.get('/api/pipeline/999999/replay').status_code == 404


def test_cached_nodes_cite_their_source_run(client, db):
    sid, rid1, _ = _artifact(client, metric='Replay Cache')
    rid2 = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid2}').get_json().get('status') == 'done',
               timeout=30)
    steps = client.get(f'/api/pipeline/{rid2}/replay').get_json()['steps']
    cached = [s for s in steps if s['cached']]
    assert cached and all(s['prior_run_id'] == rid1 for s in cached)


def test_failed_repair_attempts_are_retained(client, db, monkeypatch):
    import artifact_gen as ag
    real = ag.validate_artifact
    calls = {'n': 0}

    def flaky(html):
        calls['n'] += 1
        v = real(html)
        if calls['n'] == 1:                       # first validation fails
            v = dict(v)
            v['status'] = 'FAIL'
            v['checks'] = [{'code': 'aria', 'ok': False, 'detail': 'forced by test'}] + \
                          [c for c in v['checks'] if c['code'] != 'aria']
        return v

    monkeypatch.setattr(ag, 'validate_artifact', flaky)
    sid, rid, art = _artifact(client, metric='Repair Trace')

    rows = db.execute("SELECT * FROM repair_attempts WHERE scope='artifact_render' "
                      'AND artifact_id=?', (art['id'],)).fetchall()
    assert rows                                    # attempt retained
    first = json.loads(rows[0]['detail_json'])
    assert 'aria' in first['failed_checks']
    assert rows[0]['resolved'] == 1                # later attempt succeeded — still visible

    replay = client.get(f'/api/pipeline/{rid}/replay').get_json()
    assert any(a['cycle'] == 1 for a in replay['repair_attempts'])
