"""
R18S1E1-US1 — Notifications + workspace activity (gap §18-9, §18-11)
R18S1E2-US1 — Comments + team/invites/seats (gap §18-8, §18-4)
Consolidated people-layer substrate.
"""
import json


# ── notifications ──────────────────────────────────────────────────────────

def test_notification_lifecycle(client, db):
    import notifications as nt
    nid = nt.notify(db, 'admin@acme.com', 'alert', 'Drift detected on Net Revenue',
                    link='/app/artifacts/1')
    r = client.get('/api/notifications', headers={'X-User-Role': 'admin'})
    assert r.status_code == 200
    body = r.get_json()
    assert body['unread'] >= 1
    row = next(n for n in body['notifications'] if n['id'] == nid)
    assert row['read'] == 0 and row['kind'] == 'alert'

    assert client.post(f'/api/notifications/{nid}/read').status_code == 200
    assert client.get('/api/notifications').get_json()['unread'] == 0
    nt.notify(db, 'admin@acme.com', 'mention', 'Ana mentioned you')
    nt.notify(db, 'admin@acme.com', 'build', 'Build complete')
    client.post('/api/notifications/read_all')
    assert client.get('/api/notifications').get_json()['unread'] == 0


def test_system_events_fan_into_notifications(client, db):
    # meta systemic alert → notification (people-layer wiring of R9S2E4)
    db.execute("INSERT INTO alerts (type, subject, detail_json) VALUES "
               "('meta.systemic_failure', 'Systemic pipeline failure pattern detected', '{}')")
    db.commit()
    import notifications as nt
    nt.fan_out_alert(db, db.execute('SELECT id FROM alerts ORDER BY id DESC LIMIT 1').fetchone()['id'])
    n = db.execute("SELECT * FROM notifications WHERE kind='alert' ORDER BY id DESC LIMIT 1").fetchone()
    assert n is not None and 'Systemic' in n['message']


def test_workspace_activity_feed(client, db):
    from conftest import wait_until
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done',
               timeout=30)
    client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'Feed Art'})
    r = client.get('/api/workspace/activity?limit=20')
    assert r.status_code == 200
    feed = r.get_json()['events']
    kinds = {e['kind'] for e in feed}
    assert 'build' in kinds and 'governance' in kinds or 'sharing' in kinds or 'build' in kinds
    assert all({'kind', 'summary', 'actor', 'created_at'} <= set(e) for e in feed)
    filtered = client.get('/api/workspace/activity?kind=build').get_json()['events']
    assert all(e['kind'] == 'build' for e in filtered)


# ── comments ───────────────────────────────────────────────────────────────

def _artifact(client):
    from conftest import wait_until
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done',
               timeout=30)
    return client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'C'}).get_json()


def test_comment_threads_with_mentions_and_resolve(client, db):
    art = _artifact(client)
    r = client.post(f"/api/artifacts/{art['id']}/comments",
                    json={'body': 'Why is the Northeast down? @ana@acme.com',
                          'section_id': 'timeseries_ci'})
    assert r.status_code == 201
    cid = r.get_json()['id']
    reply = client.post(f"/api/artifacts/{art['id']}/comments",
                        json={'body': 'Flagship closure on the 12th.', 'parent_id': cid})
    assert reply.status_code == 201

    thread = client.get(f"/api/artifacts/{art['id']}/comments").get_json()['comments']
    root = next(c for c in thread if c['id'] == cid)
    assert root['section_id'] == 'timeseries_ci'
    assert len(root['replies']) == 1
    # @mention produced a notification for ana
    n = db.execute("SELECT * FROM notifications WHERE user_id='ana@acme.com' "
                   "AND kind='mention'").fetchone()
    assert n is not None

    assert client.post(f'/api/comments/{cid}/resolve').status_code == 200
    thread = client.get(f"/api/artifacts/{art['id']}/comments").get_json()['comments']
    assert next(c for c in thread if c['id'] == cid)['resolved'] == 1
    inbox = client.get('/api/comments/inbox?tab=resolved').get_json()['comments']
    assert any(c['id'] == cid for c in inbox)


# ── team / invites / seats ─────────────────────────────────────────────────

def test_invite_lifecycle_and_seats(client, db):
    r = client.post('/api/team/invites', json={'emails': ['new1@acme.com', 'new2@acme.com'],
                                               'role': 'analyst'})
    assert r.status_code == 201
    invites = r.get_json()['invites']
    assert len(invites) == 2 and all(i['token'] for i in invites)
    mails = db.execute("SELECT COUNT(*) c FROM email_outbox WHERE subject LIKE '%invited%'").fetchone()['c']
    assert mails >= 2

    accept = client.post(f"/api/team/invites/{invites[0]['token']}/accept",
                         json={'password': 'pass12345'})
    assert accept.status_code == 200
    roster = client.get('/api/team/roster').get_json()
    emails = {m['email'] for m in roster['members']}
    assert 'new1@acme.com' in emails
    assert roster['seats']['used'] >= 1
    assert roster['seats']['total'] == 25
    pending = [m for m in roster['members'] if m.get('status') == 'invited']
    assert any(m['email'] == 'new2@acme.com' for m in pending)
    assert client.post(f"/api/team/invites/{invites[0]['token']}/accept",
                       json={'password': 'x'}).status_code == 410   # consumed
