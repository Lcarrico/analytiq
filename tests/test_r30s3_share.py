"""
R30S3E4-US1 (backend) — share-link revocation for the canonical share modal's
red "Revoke link": expiry-based (no schema change), audited. Revoked links die
on the public route immediately.
"""
from conftest import wait_until


def _artifact_with_file(client):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done',
               timeout=30)
    return client.post(f'/api/sessions/{sid}/save_artifact',
                       json={'title': 'Share Revoke Art'}).get_json()


def test_revoke_kills_active_links_and_audits(client):
    art = _artifact_with_file(client)
    link = client.post(f"/api/artifacts/{art['id']}/share_links", json={}).get_json()
    assert client.get(link['url']).status_code == 200

    r = client.post(f"/api/artifacts/{art['id']}/share_links/revoke")
    assert r.status_code == 200
    assert r.get_json()['revoked'] >= 1
    assert client.get(link['url']).status_code in (404, 410)

    audits = client.get('/api/audit-logs?action=share_link.revoked&limit=5').get_json()
    entries = audits if isinstance(audits, list) else audits.get('entries', audits.get('items', []))
    assert any(e.get('action') == 'share_link.revoked' for e in entries)


def test_revoke_unknown_artifact_404(client):
    assert client.post('/api/artifacts/999999/share_links/revoke').status_code == 404
