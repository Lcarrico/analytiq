"""
R1S2E6-US1 — Structured request logs + latency metrics + email outbox
(Better Stack / Resend → SQLite service_logs / email_outbox fallbacks)
"""


def test_requests_logged_with_latency(client, db):
    client.get('/api/health')
    client.get('/api/workspace/status')
    rows = db.execute("SELECT * FROM service_logs ORDER BY id").fetchall()
    paths = [r['path'] for r in rows]
    assert '/api/health' in paths and '/api/workspace/status' in paths
    for r in rows:
        assert r['method'] == 'GET'
        assert r['status'] == 200
        assert r['duration_ms'] is not None and r['duration_ms'] >= 0


def test_platform_logs_and_metrics_endpoints(client):
    for _ in range(5):
        client.get('/api/health')
    logs = client.get('/api/platform/logs?limit=3').get_json()
    assert len(logs) == 3
    assert all('duration_ms' in r for r in logs)

    m = client.get('/api/platform/metrics').get_json()
    assert m['requests'] >= 5
    assert m['latency_ms']['p50'] >= 0
    assert m['latency_ms']['p95'] >= m['latency_ms']['p50']
    assert '/api/health' in m['by_path']


def test_email_outbox_records_messages(client, db, app_mod):
    # a share triggers a notification email → outbox row in queued (dev) mode
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    run = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()
    from conftest import wait_until
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status') == 'done',
               timeout=30)
    art = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'obs'}).get_json()
    client.post(f"/api/artifacts/{art['id']}/shares", json={'email': 'kim@acme.com'})

    row = db.execute("SELECT * FROM email_outbox WHERE recipient='kim@acme.com'").fetchone()
    assert row is not None
    assert row['status'] == 'queued'          # no RESEND key in the sandbox
    assert row['subject']

    outbox = client.get('/api/platform/outbox').get_json()
    assert any(o['recipient'] == 'kim@acme.com' for o in outbox)
