"""
Sprint 11 — Workspace Services & RBAC
  F-043 Artifact APIs (filters + pagination)
  F-044 Access control: Admin/Analyst mutate, Viewer read-only
  F-045 Manual refresh endpoint (re-run + re-render + audit)
  F-046 Audit log skeleton: append-only, filterable
"""
import json

import pytest
import sqlite3
from conftest import wait_until

VIEWER = {'X-User-Role': 'viewer'}


def _saved_artifact(client):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    run = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status') == 'done',
               timeout=30)
    return client.post(f'/api/sessions/{sid}/save_artifact',
                       json={'title': 'RBAC artifact'}).get_json()


def test_viewer_is_read_only_on_artifacts(client):
    art = _saved_artifact(client)
    aid = art['id']

    # viewer reads fine
    assert client.get('/api/artifacts', headers=VIEWER).status_code == 200
    assert client.get(f'/api/artifacts/{aid}', headers=VIEWER).status_code == 200
    assert client.get(f'/api/artifacts/{aid}/html', headers=VIEWER).status_code == 200

    # viewer cannot mutate
    assert client.post('/api/artifacts', json={'title': 'x'}, headers=VIEWER).status_code == 403
    assert client.delete(f'/api/artifacts/{aid}', headers=VIEWER).status_code == 403
    assert client.post(f'/api/artifacts/{aid}/render', headers=VIEWER).status_code == 403
    assert client.post(f'/api/artifacts/{aid}/refresh', headers=VIEWER).status_code == 403
    assert client.post(f'/api/artifacts/{aid}/shares',
                       json={'email': 'a@b.co'}, headers=VIEWER).status_code == 403

    # analyst can mutate
    assert client.post('/api/artifacts', json={'title': 'ok'},
                       headers={'X-User-Role': 'analyst'}).status_code == 201


def test_manual_refresh_regenerates_run_and_file(client, db):
    art = _saved_artifact(client)
    aid, old_run = art['id'], art['pipeline_run_id']

    r = client.post(f'/api/artifacts/{aid}/refresh')
    assert r.status_code == 200
    out = r.get_json()
    assert out['pipeline_run_id'] != old_run
    assert out['file_version'] == 2   # re-rendered

    # new run has chart data and is done
    rows = db.execute('SELECT COUNT(*) c FROM chart_data WHERE pipeline_run_id=?',
                      (out['pipeline_run_id'],)).fetchone()['c']
    assert rows == 90
    run = client.get(f"/api/pipeline/{out['pipeline_run_id']}").get_json()
    assert run['status'] == 'done'

    assert db.execute("SELECT 1 FROM audit_logs WHERE action='artifact.refreshed'").fetchone()

    # errors
    assert client.post('/api/artifacts/99999/refresh').status_code == 404
    bare = client.post('/api/artifacts', json={'title': 'no run'}).get_json()
    assert client.post(f"/api/artifacts/{bare['id']}/refresh").status_code == 409


def test_audit_log_is_append_only(client, db):
    client.post('/api/artifacts', json={'title': 'audit me'})
    with pytest.raises(sqlite3.IntegrityError):
        db.execute("UPDATE audit_logs SET action='tampered' WHERE id=1")
    with pytest.raises(sqlite3.IntegrityError):
        db.execute('DELETE FROM audit_logs WHERE id=1')


def test_audit_log_filters(client):
    art = _saved_artifact(client)
    client.post(f"/api/artifacts/{art['id']}/refresh")

    all_rows = client.get('/api/audit-logs?limit=100').get_json()
    assert len(all_rows) >= 3

    by_action = client.get('/api/audit-logs?action=artifact.refreshed').get_json()
    assert by_action and all(r['action'] == 'artifact.refreshed' for r in by_action)

    by_resource = client.get('/api/audit-logs?resource_type=pipeline_run').get_json()
    assert by_resource and all(r['resource_type'] == 'pipeline_run' for r in by_resource)

    limited = client.get('/api/audit-logs?limit=2').get_json()
    assert len(limited) == 2

    # pipeline lifecycle events present (append-only skeleton coverage)
    actions = {r['action'] for r in all_rows}
    assert {'pipeline.started', 'pipeline.completed'} <= actions


def test_artifact_list_filters_and_pagination(client):
    for i, (title, typ) in enumerate([('Alpha Forecast', 'Predictive'),
                                      ('Beta Drivers', 'Diagnostic'),
                                      ('Alpha Retro', 'Descriptive')]):
        client.post('/api/artifacts', json={'title': title, 'type': typ})

    res = client.get('/api/artifacts?q=Alpha').get_json()
    assert res['total'] == 2
    assert all('Alpha' in a['title'] for a in res['items'])

    res = client.get('/api/artifacts?type=Diagnostic').get_json()
    assert res['total'] == 1 and res['items'][0]['title'] == 'Beta Drivers'

    res = client.get('/api/artifacts?per_page=2&page=1').get_json()
    assert res['total'] == 3 and len(res['items']) == 2
    res2 = client.get('/api/artifacts?per_page=2&page=2').get_json()
    assert len(res2['items']) == 1
