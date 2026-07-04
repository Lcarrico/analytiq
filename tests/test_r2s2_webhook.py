"""
R2S2E1-US1 — Webhook ingest (per-connection tokened endpoint → events table)
"""


def _mk_webhook(client):
    r = client.post('/api/connections', json={'type': 'webhook', 'name': 'events-in'})
    assert r.status_code == 201
    return r.get_json()


def test_webhook_connection_mints_capability_url(client, db):
    out = _mk_webhook(client)
    assert out['webhook_token']
    assert out['webhook_url'].endswith(out['webhook_token'])
    # only a hash of the token is at rest
    row = db.execute('SELECT account FROM connections WHERE id=?', (out['id'],)).fetchone()
    assert out['webhook_token'] not in (row['account'] or '')


def test_webhook_accepts_json_and_appends_events(client, db):
    out = _mk_webhook(client)
    tok = out['webhook_token']

    r = client.post(f'/api/ingest/webhook/{tok}', json={'event': 'click', 'v': 1})
    assert r.status_code == 201
    client.post(f'/api/ingest/webhook/{tok}', json={'event': 'view', 'v': 2})

    rows = db.execute('SELECT * FROM webhook_events WHERE connection_id=?',
                      (out['id'],)).fetchall()
    assert len(rows) == 2

    events = client.get(f"/api/connections/{out['id']}/events").get_json()
    assert len(events) == 2
    assert events[0]['payload']['event'] in ('click', 'view')

    # bad token → 404; non-JSON body → 400
    assert client.post('/api/ingest/webhook/not-a-token', json={'x': 1}).status_code == 404
    assert client.post(f'/api/ingest/webhook/{tok}', data='plain text',
                       content_type='text/plain').status_code == 400
