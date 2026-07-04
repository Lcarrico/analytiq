"""
Sprint 10 — Workspace UI & Save/Share Flow
  F-040 Save artifact flow (session → artifact record → rendered file)
  F-041 Manual share (email validation, role validation, dedupe, notification,
        revoke with 404 on unknown)
  F-042 Artifact preview payload for chat modal
"""
import json

from conftest import wait_until


def _run_pipeline_session(client):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    run = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status') == 'done',
               timeout=30)
    return sid, run['runId']


# ── F-040 save flow ──────────────────────────────────────
def test_save_artifact_from_session(client, db):
    sid, run_id = _run_pipeline_session(client)
    r = client.post(f'/api/sessions/{sid}/save_artifact',
                    json={'title': 'Q3 Net Revenue Forecast', 'owner': 'leo@acme.com'})
    assert r.status_code == 201
    art = r.get_json()
    assert art['pipeline_run_id'] == run_id
    assert art['title'] == 'Q3 Net Revenue Forecast'
    assert art['mape'] == 8.9                     # from the pipeline run
    assert art['owner'] == 'leo@acme.com'
    assert art['file'] and art['file']['version'] == 1  # auto-rendered

    files = client.get(f"/api/artifacts/{art['id']}/files").get_json()
    assert len(files) == 1
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='artifact.saved'").fetchone()


def test_save_artifact_requires_completed_pipeline(client):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    r = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'X'})
    assert r.status_code == 409
    assert client.post('/api/sessions/9999/save_artifact', json={'title': 'X'}).status_code == 404


# ── F-041 sharing ────────────────────────────────────────
def test_share_validation_dedupe_and_notification(client, db):
    sid, run_id = _run_pipeline_session(client)
    art = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'Sharable'}).get_json()
    aid = art['id']

    # invalid email → 400
    assert client.post(f'/api/artifacts/{aid}/shares',
                       json={'email': 'not-an-email'}).status_code == 400
    # invalid role → 400 ('Owner' became a valid role in R7S1E1)
    assert client.post(f'/api/artifacts/{aid}/shares',
                       json={'email': 'kim@acme.com', 'role': 'Superuser'}).status_code == 400

    r = client.post(f'/api/artifacts/{aid}/shares',
                    json={'email': 'kim@acme.com', 'role': 'Editor'})
    assert r.status_code == 201
    share = r.get_json()
    assert share['role'] == 'Editor'

    # duplicate share → 409
    assert client.post(f'/api/artifacts/{aid}/shares',
                       json={'email': 'kim@acme.com', 'role': 'Viewer'}).status_code == 409

    # notification audited
    meta = json.loads(db.execute(
        "SELECT metadata FROM audit_logs WHERE action='share.added'").fetchone()['metadata'])
    assert meta['email'] == 'kim@acme.com'
    assert meta.get('notified') is True

    # revoke works, unknown share 404
    r = client.delete(f"/api/artifacts/{aid}/shares/{share['id']}")
    assert r.status_code == 204
    assert client.delete(f"/api/artifacts/{aid}/shares/{share['id']}").status_code == 404


# ── F-042 preview ────────────────────────────────────────
def test_artifact_preview_payload(client):
    sid, _ = _run_pipeline_session(client)
    art = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'Prev'}).get_json()

    r = client.get(f"/api/artifacts/{art['id']}/preview")
    assert r.status_code == 200
    p = r.get_json()
    assert p['artifact']['id'] == art['id']
    assert 'data-panel="kpi-row"' in p['html']
    assert p['kpis']['mape'] > 0

    # artifact without render → 404 preview
    bare = client.post('/api/artifacts', json={'title': 'bare'}).get_json()
    assert client.get(f"/api/artifacts/{bare['id']}/preview").status_code == 404
