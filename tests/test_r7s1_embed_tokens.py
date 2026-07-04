"""
R7S1E2-US1 — Signed HS256 embed tokens: single-artifact scope, allowed_origins,
expiry, and no privilege elevation (read_only cannot write)
"""
from conftest import wait_until


def _artifact(client):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    run = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status') == 'done',
               timeout=30)
    return client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'emb'}).get_json()


def test_jwt_sign_verify_roundtrip(app_mod):
    import embed_tokens as et
    tok = et.sign({'artifact_id': 5, 'workspace_id': 'default', 'scope': 'read_only'},
                  secret='s3', expires_in=3600)
    assert tok.count('.') == 2
    payload = et.verify(tok, secret='s3')
    assert payload['artifact_id'] == 5 and payload['scope'] == 'read_only'

    # tampered signature rejected
    assert et.verify(tok[:-3] + 'xxx', secret='s3') is None
    assert et.verify(tok, secret='different') is None
    expired = et.sign({'artifact_id': 5}, secret='s3', expires_in=-10)
    assert et.verify(expired, secret='s3') is None


def test_embed_token_gates_gold_api_by_origin(client):
    art = _artifact(client)
    r = client.post(f"/api/artifacts/{art['id']}/embed_tokens",
                    json={'scope': 'read_only',
                          'allowed_origins': ['https://partner.example.com']})
    assert r.status_code == 201
    tok = r.get_json()['token']

    ok = client.get(f'/api/gold/default/gold_predictions?embed_token={tok}',
                    headers={'Origin': 'https://partner.example.com'})
    assert ok.status_code == 200

    bad = client.get(f'/api/gold/default/gold_predictions?embed_token={tok}',
                     headers={'Origin': 'https://evil.example.net'})
    assert bad.status_code == 403

    garbage = client.get('/api/gold/default/gold_predictions?embed_token=nope.nope.nope',
                         headers={'Origin': 'https://partner.example.com'})
    assert garbage.status_code == 401


def test_embed_token_cannot_be_elevated_to_writes(client):
    art = _artifact(client)
    tok = client.post(f"/api/artifacts/{art['id']}/embed_tokens",
                      json={'scope': 'read_only', 'allowed_origins': ['*']}).get_json()['token']
    # embed identity is never write-authorized
    r = client.post('/api/artifacts', json={'title': 'x'},
                    headers={'Authorization': f'Embed {tok}'})
    assert r.status_code == 403
    r = client.delete(f"/api/artifacts/{art['id']}",
                      headers={'Authorization': f'Embed {tok}'})
    assert r.status_code == 403
