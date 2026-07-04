"""
R2S2E2-US1 — REST API source connector (config + poll → rows; offline fixture)
"""


def _mk(client, **extra):
    body = {'type': 'rest_api', 'name': 'orders api',
            'endpoint_url': 'https://api.example.com/orders',
            'auth_header': 'Bearer sk-live-abc123', 'poll_interval_minutes': 15}
    body.update(extra)
    return client.post('/api/connections', json=body)


def test_rest_api_connection_validation_and_encryption(client, db):
    r = _mk(client)
    assert r.status_code == 201
    cid = r.get_json()['id']

    row = db.execute('SELECT * FROM connections WHERE id=?', (cid,)).fetchone()
    assert 'sk-live-abc123' not in (row['password'] or '')     # auth header encrypted

    assert _mk(client, endpoint_url=None).status_code == 400
    assert _mk(client, endpoint_url='ftp://nope').status_code == 400


def test_manual_poll_ingests_rows(client, db):
    cid = _mk(client).get_json()['id']
    r = client.post(f'/api/connections/{cid}/poll')
    assert r.status_code == 201
    out = r.get_json()
    assert out['rows_ingested'] > 0
    assert out['mode'] == 'offline_fixture'      # no network in the sandbox

    events = client.get(f'/api/connections/{cid}/events').get_json()
    assert len(events) == out['rows_ingested']

    client.post(f'/api/connections/{cid}/poll')  # appends
    assert db.execute('SELECT COUNT(*) c FROM webhook_events WHERE connection_id=?',
                      (cid,)).fetchone()['c'] == out['rows_ingested'] * 2
    assert db.execute('SELECT COUNT(*) c FROM poll_runs WHERE connection_id=?',
                      (cid,)).fetchone()['c'] == 2

    assert client.post('/api/connections/99999/poll').status_code == 404
    # polling a non-rest connection → 409
    other = client.post('/api/connections', json={
        'type': 'snowflake', 'name': 'x', 'account': 'a', 'username': 'u',
        'password': 'p'}).get_json()['id']
    assert client.post(f'/api/connections/{other}/poll').status_code == 409


def test_scheduler_runs_due_polls(client, app_mod, db):
    cid = _mk(client).get_json()['id']
    db.execute("UPDATE connections SET next_poll_at=datetime('now', '-5 minutes') WHERE id=?",
               (cid,))
    db.commit()

    ran = app_mod._run_due_api_polls(db)
    assert ran == 1
    assert db.execute('SELECT COUNT(*) c FROM poll_runs').fetchone()['c'] == 1
    nxt = db.execute('SELECT next_poll_at FROM connections WHERE id=?', (cid,)).fetchone()[0]
    assert nxt > db.execute("SELECT datetime('now')").fetchone()[0]   # advanced to future
    assert app_mod._run_due_api_polls(db) == 0                        # nothing due now
