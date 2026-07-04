"""
R9S1E3-US1 — Event-Driven Execution (Architecture v2.1 §17.2.4)

A trigger layer above the DAG scheduler: data/schema events, drift events,
and business events initiate targeted recompute without a user turn.
"""
import json

from conftest import wait_until


def _connection(client):
    return client.post('/api/connections', json={
        'type': 'snowflake', 'name': 'ev', 'account': 'a', 'username': 'u',
        'password': 'p'}).get_json()['id']


def _governed(client, cid):
    before = len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json() or [])
    client.post('/api/governance/run', json={'connectionId': cid})
    wait_until(lambda: len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json()
                           or []) > before)


def test_emit_records_processes_and_audits(client, db):
    r = client.post('/api/platform/events',
                    json={'event_type': 'business_event', 'payload': {'crm_stage': 'closed_won'}})
    assert r.status_code == 201
    ev = r.get_json()
    assert ev['status'] == 'processed'
    row = db.execute('SELECT * FROM platform_events WHERE id=?', (ev['id'],)).fetchone()
    assert row['event_type'] == 'business_event'
    n = db.execute("SELECT COUNT(*) c FROM audit_logs WHERE action='event.emitted'").fetchone()['c']
    assert n >= 1


def test_manifest_update_triggers_targeted_recompute(client, db):
    cid = _connection(client)
    _governed(client, cid)
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue', 'connectionId': cid}).get_json()['id']
    run1 = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{run1}').get_json().get('status') == 'done', timeout=30)

    # unrelated session on no connection — must not be recomputed
    other_sid = client.post('/api/sessions', json={'metric': 'Untouched'}).get_json()['id']

    runs_before = db.execute('SELECT COUNT(*) c FROM pipeline_runs').fetchone()['c']
    r = client.post('/api/platform/events',
                    json={'event_type': 'manifest_updated', 'payload': {'connection_id': cid}})
    assert r.status_code == 201
    client.post('/api/platform/jobs/drain', json={})      # deterministic worker step

    runs = db.execute('SELECT * FROM pipeline_runs ORDER BY id').fetchall()
    assert len(runs) == runs_before + 1                   # exactly one targeted recompute
    new_run = runs[-1]
    assert new_run['session_id'] == sid                   # the affected session, not the other
    wait_until(lambda: client.get(f"/api/pipeline/{new_run['id']}").get_json().get('status')
               in ('done', 'failed'), timeout=30)
    assert client.get(f"/api/pipeline/{new_run['id']}").get_json()['status'] == 'done'


def test_drift_event_enqueues_retrain(client, db):
    cid = _connection(client)
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue', 'connectionId': cid}).get_json()['id']
    run1 = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{run1}').get_json().get('status') == 'done', timeout=30)

    client.post('/api/platform/events',
                json={'event_type': 'drift_detected', 'payload': {'session_id': sid}})
    job = db.execute("SELECT * FROM jobs WHERE kind='event_retrain' ORDER BY id DESC LIMIT 1").fetchone()
    assert job is not None
    n = db.execute("SELECT COUNT(*) c FROM audit_logs WHERE action='event.trigger_fired'").fetchone()['c']
    assert n >= 1


def test_metric_threshold_event_opens_investigation(client, db):
    client.post('/api/platform/events',
                json={'event_type': 'metric_threshold_breached',
                      'payload': {'metric': 'net_revenue', 'value': 120, 'threshold': 100}})
    row = db.execute('SELECT * FROM opportunity_investigations ORDER BY id DESC LIMIT 1').fetchone()
    assert row is not None
    assert row['status'] == 'open'
    assert 'net_revenue' in row['payload_json']


def test_webhook_ingest_emits_data_arrived(client, db):
    cid = client.post('/api/connections', json={'type': 'webhook', 'name': 'wh'}).get_json()
    token = cid.get('webhook_token') or cid.get('token')
    assert token
    client.post(f'/api/ingest/webhook/{token}', json={'value': 1})
    ev = db.execute("SELECT * FROM platform_events WHERE event_type='data_arrived' "
                    'ORDER BY id DESC LIMIT 1').fetchone()
    assert ev is not None
    assert str(cid['id']) in ev['payload_json']


def test_events_list_endpoint(client):
    client.post('/api/platform/events', json={'event_type': 'business_event', 'payload': {}})
    r = client.get('/api/platform/events?limit=10')
    assert r.status_code == 200
    evs = r.get_json()['events']
    assert evs and {'event_type', 'status', 'created_at'} <= set(evs[0])
    assert client.post('/api/platform/events', json={'payload': {}}).status_code == 400
