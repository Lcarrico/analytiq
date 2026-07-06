"""R36S3E2 — preferences kv + hashed API keys with revoke -> 410."""


def test_preferences_roundtrip(client):
    d = client.get('/api/settings/preferences').get_json()
    assert d['technical_detail'] is True          # default: admins see detail
    r = client.put('/api/settings/preferences',
                   json={'technical_detail': False, 'density': 'compact'})
    assert r.status_code == 200
    d2 = client.get('/api/settings/preferences').get_json()
    assert d2['technical_detail'] is False
    assert d2['density'] == 'compact'


def test_api_keys_hashed_and_revoke_gives_410(client):
    r = client.post('/api/keys', json={'name': 'ci robot'})
    assert r.status_code == 201
    body = r.get_json()
    raw = body['key']
    assert raw.startswith('aiq_') and len(raw) > 20
    kid = body['id']

    listed = client.get('/api/keys').get_json()['keys']
    row = next(k for k in listed if k['id'] == kid)
    assert raw not in str(listed)                 # raw never listed again
    assert row['prefix'] and raw.startswith(row['prefix'])
    assert row['revoked_at'] is None

    ok = client.get('/api/keys/verify', headers={'X-Api-Key': raw})
    assert ok.status_code == 200 and ok.get_json()['ok'] is True
    bad = client.get('/api/keys/verify', headers={'X-Api-Key': 'aiq_nope'})
    assert bad.status_code == 401

    assert client.delete(f'/api/keys/{kid}').status_code == 200
    gone = client.get('/api/keys/verify', headers={'X-Api-Key': raw})
    assert gone.status_code == 410                # revoked, not unknown
