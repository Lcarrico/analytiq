"""
R30S3E5-US1 (backend) — version-history substrate for the topbar Versions
panel: list versions, fetch a specific version's html, append-only restore
(restoring vN mints a NEW top version — never rewrites history; audited).
"""
from conftest import wait_until


def _artifact(client):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done',
               timeout=30)
    return client.post(f'/api/sessions/{sid}/save_artifact',
                       json={'title': 'Versions Art'}).get_json()


def test_versions_list_grows_with_semantic_edits(client):
    art = _artifact(client)
    v = client.get(f"/api/artifacts/{art['id']}/versions")
    assert v.status_code == 200
    first = v.get_json()
    assert [x['version'] for x in first][-1] == 1 and len(first) >= 1

    # a semantic edit re-renders → version bump
    r = client.patch(f"/api/artifacts/{art['id']}/sections/timeseries_ci",
                     json={'chart_type': 'bar'})
    assert r.status_code == 200
    second = client.get(f"/api/artifacts/{art['id']}/versions").get_json()
    assert len(second) == len(first) + 1
    assert second[0]['version'] == first[0]['version'] + 1


def test_html_version_param_and_restore_appends(client):
    art = _artifact(client)
    client.patch(f"/api/artifacts/{art['id']}/sections/timeseries_ci",
                 json={'chart_type': 'bar'})
    versions = client.get(f"/api/artifacts/{art['id']}/versions").get_json()
    top = versions[0]['version']
    assert client.get(f"/api/artifacts/{art['id']}/html?version=1").status_code == 200
    assert client.get(f"/api/artifacts/{art['id']}/html?version=999").status_code == 404

    r = client.post(f"/api/artifacts/{art['id']}/versions/1/restore")
    assert r.status_code == 200
    assert r.get_json()['version'] == top + 1          # append-only
    after = client.get(f"/api/artifacts/{art['id']}/versions").get_json()
    assert after[0]['version'] == top + 1
    audits = client.get('/api/audit-logs?action=artifact.version_restored&limit=5').get_json()
    entries = audits if isinstance(audits, list) else audits.get('entries', [])
    assert any(e.get('action') == 'artifact.version_restored' for e in entries)
    assert client.post(f"/api/artifacts/{art['id']}/versions/999/restore").status_code == 404
