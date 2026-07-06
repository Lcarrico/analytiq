"""
R33S2E1-US1 (backend) — public viewer parity: token-gated read-only chart
data (same expiry/password checks as the html route) + owner contact on meta
so Request-access can be a real mailto.
"""
from conftest import wait_until


def _shared_artifact(client, expires=24):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    run = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status')
               == 'done', timeout=30)
    art = client.post(f'/api/sessions/{sid}/save_artifact',
                      json={'title': 'Share Parity'}).get_json()
    link = client.post(f"/api/artifacts/{art['id']}/share_links",
                       json={'expires_in_hours': expires}).get_json()
    token = link.get('token') or link['url'].split('/')[-1]
    return art, token


def test_public_chart_data(client):
    art, token = _shared_artifact(client)
    r = client.get(f'/api/public/{token}/chart')
    assert r.status_code == 200
    d = r.get_json()
    assert d['kpis'] and isinstance(d['rows'], list) and d['rows']
    assert {'date', 'actual'} <= set(d['rows'][0])

    # expired link -> designed 410, same as the html route
    art2, token2 = _shared_artifact(client)
    client.post(f"/api/artifacts/{art2['id']}/share_links/revoke")
    assert client.get(f'/api/public/{token2}/chart').status_code == 410


def test_meta_owner_contact(client):
    art, token = _shared_artifact(client)
    meta = client.get(f'/api/public/{token}/meta').get_json()
    # contract: the field is always present; populated once a workspace admin
    # account exists (fresh test DBs have none — the viewer hides the mailto)
    assert 'owner_email' in meta


def test_embed_settings_persistence(client):
    """R33S2E2 (DEP): embed settings persist per artifact — the preview page
    reloads with the saved scope/expiry/domains."""
    art, _ = _shared_artifact(client)
    # defaults before any save
    d = client.get(f"/api/artifacts/{art['id']}/embed_settings").get_json()
    assert d['scope'] == 'read_only' and d['allowed_origins'] == ['*']

    r = client.put(f"/api/artifacts/{art['id']}/embed_settings",
                   json={'scope': 'interactive', 'expires_in_hours': 168,
                         'allowed_origins': ['https://acme-portal.example.com'],
                         'refresh': 'on_load'})
    assert r.status_code == 200
    d = client.get(f"/api/artifacts/{art['id']}/embed_settings").get_json()
    assert d['scope'] == 'interactive'
    assert d['expires_in_hours'] == 168
    assert d['allowed_origins'] == ['https://acme-portal.example.com']

    assert client.put('/api/artifacts/999999/embed_settings',
                      json={'scope': 'read_only'}).status_code == 404
    bad = client.put(f"/api/artifacts/{art['id']}/embed_settings",
                     json={'scope': 'nope'})
    assert bad.status_code == 400
