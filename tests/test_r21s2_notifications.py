"""
R21S2E4-US1 (backend) — notifications contract lock for the parity drawer.
The frame groups rows by day and tints by kind; the API must expose
kind / created_at / link / read per row (fields existed before this story —
this test pins them so the drawer can't be starved by a refactor).
"""


def test_notifications_rows_expose_kind_created_at_link(client):
    # seed a mention through the public comment path (same as R18 flow —
    # artifact requires a completed pipeline run first)
    from conftest import wait_until
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done',
               timeout=30)
    art = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'Bell contract'}).get_json()
    client.post(f"/api/artifacts/{art['id']}/comments",
                json={'body': 'Ping @admin@acme.com — drawer contract', 'section_id': 's1'})

    data = client.get('/api/notifications').get_json()
    assert set(data.keys()) >= {'notifications', 'unread'}
    assert data['unread'] >= 1
    row = data['notifications'][0]
    for field in ('id', 'kind', 'message', 'link', 'read', 'created_at'):
        assert field in row, f'missing {field}'
    kinds = {r['kind'] for r in data['notifications']}
    assert 'mention' in kinds  # mention flag == kind (no separate column needed)


def test_mark_all_read_still_clears(client):
    client.post('/api/notifications/read_all')
    data = client.get('/api/notifications').get_json()
    assert data['unread'] == 0
