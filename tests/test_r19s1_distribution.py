"""
R19S1E1-US1 — Distribution: narrative engine (Evo #25), embed render route
with origin enforcement, PDF/PNG export, artifact duplicate, share metadata.
"""
import json

from conftest import wait_until


def _artifact(client, title='Dist'):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done',
               timeout=30)
    return client.post(f'/api/sessions/{sid}/save_artifact', json={'title': title}).get_json()


def test_narrative_is_grounded_and_audience_tailored(client, db):
    art = _artifact(client)
    ex = client.get(f"/api/artifacts/{art['id']}/narrative?audience=executive").get_json()
    an = client.get(f"/api/artifacts/{art['id']}/narrative?audience=engineer").get_json()
    assert ex['audience'] == 'executive' and an['audience'] == 'engineer'
    assert ex['narrative'] != an['narrative']
    # grounded: every number cited must come from the data contract values
    assert str(ex['facts']['forecast_days']) in ex['narrative']
    assert 'confidence' in an['narrative'].lower()
    # deterministic
    again = client.get(f"/api/artifacts/{art['id']}/narrative?audience=executive").get_json()
    assert again['narrative'] == ex['narrative']
    assert client.get('/api/artifacts/999999/narrative').status_code == 404


def test_embed_route_enforces_allowed_origins(client, db):
    art = _artifact(client)
    tok = client.post(f"/api/artifacts/{art['id']}/embed_tokens",
                      json={'scope': 'read_only',
                            'allowed_origins': ['https://intranet.acme.com']}).get_json()['token']
    ok = client.get(f'/embed/{tok}', headers={'Origin': 'https://intranet.acme.com'})
    assert ok.status_code == 200
    assert b'<html' in ok.data or b'<!DOCTYPE' in ok.data
    bad = client.get(f'/embed/{tok}', headers={'Origin': 'https://evil.example'})
    assert bad.status_code == 403
    assert client.get('/embed/not-a-token').status_code in (401, 404)


def test_pdf_and_png_export(client, db):
    art = _artifact(client)
    pdf = client.get(f"/api/artifacts/{art['id']}/export/pdf")
    assert pdf.status_code == 200
    assert pdf.data.startswith(b'%PDF')
    png = client.get(f"/api/artifacts/{art['id']}/export/png")
    assert png.status_code == 200
    assert png.data[:8] == b'\\x89PNG\\r\\n\\x1a\\n'.decode('unicode_escape').encode('latin1')


def test_duplicate_artifact(client, db):
    art = _artifact(client, title='Original')
    r = client.post(f"/api/artifacts/{art['id']}/duplicate")
    assert r.status_code == 201
    dup = r.get_json()
    assert dup['id'] != art['id']
    assert dup['title'] == 'Original (copy)'
    assert dup['pipeline_run_id'] == art['pipeline_run_id']
    assert client.post('/api/artifacts/999999/duplicate').status_code == 404


def test_public_share_metadata(client, db):
    art = _artifact(client)
    link = client.post(f"/api/artifacts/{art['id']}/share_links",
                       json={'expires_in_hours': 24}).get_json()
    token = link['token'] if 'token' in link else link['url'].rsplit('/', 1)[-1]
    meta = client.get(f'/api/public/{token}/meta')
    assert meta.status_code == 200
    body = meta.get_json()
    assert body['title']
    assert 'freshness_hours' in body
    assert body['expires_at']
    assert client.get('/api/public/xyz/meta').status_code == 404
