"""
R1S2E5-US1 — Object storage abstraction (Cloudflare R2 → filesystem fallback)
"""
import os

from conftest import wait_until


def test_storage_roundtrip(app_mod):
    import storage
    assert storage.provider_mode() == 'local'
    res = storage.put('tests/hello.html', '<b>hi</b>')
    assert res['uri'].startswith('local://')
    assert res['size'] == 9 and len(res['sha256']) == 64
    assert storage.get('tests/hello.html') == '<b>hi</b>'
    storage.delete('tests/hello.html')
    assert storage.get('tests/hello.html') is None


def test_artifact_render_writes_through_storage(client, app_mod, db):
    import storage
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    run = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status') == 'done',
               timeout=30)
    art = client.post('/api/artifacts', json={'title': 'stored',
                                              'pipeline_run_id': run['runId']}).get_json()
    out = client.post(f"/api/artifacts/{art['id']}/render").get_json()
    row = db.execute('SELECT * FROM artifact_files WHERE artifact_id=?', (art['id'],)).fetchone()
    assert row['storage_uri'] and row['storage_uri'].startswith('local://')

    key = row['storage_uri'].removeprefix('local://')
    stored = storage.get(key)
    assert stored is not None and 'data-panel="kpi-row"' in stored
    # file physically on disk in the sandboxed storage dir
    base = os.environ['ANALYTIQ_STORAGE_DIR']
    assert os.path.exists(os.path.join(base, key))
