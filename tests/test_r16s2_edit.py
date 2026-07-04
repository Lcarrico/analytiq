"""
R16S2E4-US1 — Canvas edit endpoints (PRD §7.9; Evolution #32 first slice)

Artifacts gain a sections layout. Edits classify as layout-only
(deterministic, no data-path re-validation) or semantic (re-render through
the validated assembly path). Every edit is versioned, never destructive.
"""
import json

from conftest import wait_until


def _artifact(client):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done',
               timeout=30)
    return client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'Edit Me'}).get_json()


def test_saved_artifact_carries_a_sections_layout(client, db):
    art = _artifact(client)
    row = db.execute('SELECT layout_json FROM artifacts WHERE id=?', (art['id'],)).fetchone()
    layout = json.loads(row['layout_json'])
    ids = [s['id'] for s in layout['sections']]
    assert 'timeseries_ci' in ids and 'forecast' in ids
    assert all({'id', 'title', 'mark', 'position'} <= set(s) for s in layout['sections'])


def test_layout_edit_is_deterministic_and_versioned(client, db):
    art = _artifact(client)
    files_before = db.execute('SELECT COUNT(*) c FROM artifact_files WHERE artifact_id=?',
                              (art['id'],)).fetchone()['c']
    r = client.patch(f"/api/artifacts/{art['id']}/sections/timeseries_ci",
                     json={'title': 'Revenue trajectory'})
    assert r.status_code == 200
    body = r.get_json()
    assert body['edit_class'] == 'layout'
    layout = json.loads(db.execute('SELECT layout_json FROM artifacts WHERE id=?',
                                   (art['id'],)).fetchone()['layout_json'])
    sec = next(s for s in layout['sections'] if s['id'] == 'timeseries_ci')
    assert sec['title'] == 'Revenue trajectory'
    # layout-only: no re-render of the assembled html
    assert db.execute('SELECT COUNT(*) c FROM artifact_files WHERE artifact_id=?',
                      (art['id'],)).fetchone()['c'] == files_before
    # but the edit is versioned in the store
    assert db.execute("SELECT COUNT(*) c FROM uas_artifacts WHERE logical_key LIKE ? ",
                      (f"%artifact_layout:a{art['id']}",)).fetchone()['c'] >= 1
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='artifact.edited'").fetchone()


def test_reorder_swaps_positions(client, db):
    art = _artifact(client)
    r = client.patch(f"/api/artifacts/{art['id']}/sections/timeseries_ci",
                     json={'position': 1})
    assert r.status_code == 200
    layout = json.loads(db.execute('SELECT layout_json FROM artifacts WHERE id=?',
                                   (art['id'],)).fetchone()['layout_json'])
    by_id = {s['id']: s['position'] for s in layout['sections']}
    assert by_id['timeseries_ci'] == 1


def test_semantic_edit_rerenders_through_assembly(client, db):
    art = _artifact(client)
    files_before = db.execute('SELECT COUNT(*) c FROM artifact_files WHERE artifact_id=?',
                              (art['id'],)).fetchone()['c']
    r = client.patch(f"/api/artifacts/{art['id']}/sections/timeseries_ci",
                     json={'chart_type': 'area'})
    assert r.status_code == 200
    assert r.get_json()['edit_class'] == 'semantic'
    assert db.execute('SELECT COUNT(*) c FROM artifact_files WHERE artifact_id=?',
                      (art['id'],)).fetchone()['c'] == files_before + 1   # re-rendered version


def test_edit_contracts(client, db):
    art = _artifact(client)
    assert client.patch(f"/api/artifacts/{art['id']}/sections/nope",
                        json={'title': 'x'}).status_code == 404
    assert client.patch(f"/api/artifacts/{art['id']}/sections/forecast",
                        json={'bogus_field': 1}).status_code == 400
    assert client.patch('/api/artifacts/999999/sections/forecast',
                        json={'title': 'x'}).status_code == 404
