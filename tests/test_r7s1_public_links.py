"""
R7S1E1-US1 — Owner share role + password-optional public links with expiry
"""
from conftest import wait_until


def _rendered_artifact(client):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    run = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status') == 'done',
               timeout=30)
    return client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'pub'}).get_json()


def test_owner_role_accepted_in_shares(client):
    art = _rendered_artifact(client)
    r = client.post(f"/api/artifacts/{art['id']}/shares",
                    json={'email': 'own@acme.com', 'role': 'Owner'})
    assert r.status_code == 201
    assert r.get_json()['role'] == 'Owner'


def test_public_share_link_lifecycle(client, db):
    art = _rendered_artifact(client)
    r = client.post(f"/api/artifacts/{art['id']}/share_links",
                    json={'expires_in_hours': 24})
    assert r.status_code == 201
    link = r.get_json()
    assert link['token'] and link['url'].endswith(link['token'])

    # anonymous access (no auth headers) serves the snapshot
    resp = client.get(f"/api/public/{link['token']}")
    assert resp.status_code == 200
    assert resp.content_type.startswith('text/html')
    assert 'data-panel="kpi-row"' in resp.get_data(as_text=True)

    client.get(f"/api/public/{link['token']}")
    row = db.execute('SELECT view_count FROM share_links WHERE token_hash IS NOT NULL').fetchone()
    assert row['view_count'] == 2

    # expiry honored
    db.execute("UPDATE share_links SET expires_at=datetime('now', '-1 hour')")
    db.commit()
    assert client.get(f"/api/public/{link['token']}").status_code == 410
    assert client.get('/api/public/not-a-token').status_code == 404


def test_password_protected_link(client):
    art = _rendered_artifact(client)
    link = client.post(f"/api/artifacts/{art['id']}/share_links",
                       json={'password': 'open-sesame'}).get_json()
    assert client.get(f"/api/public/{link['token']}").status_code == 401
    assert client.get(f"/api/public/{link['token']}?password=wrong").status_code == 401
    assert client.get(f"/api/public/{link['token']}?password=open-sesame").status_code == 200

    # unrendered artifact can't be linked
    bare = client.post('/api/artifacts', json={'title': 'bare'}).get_json()
    assert client.post(f"/api/artifacts/{bare['id']}/share_links", json={}).status_code == 409
