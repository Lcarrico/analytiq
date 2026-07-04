"""
R12S2E5-US1 — Automated ROI Tracking (Architecture v2.1 §17.4.5)

Which dashboards actually inform decisions: adoption signals per artifact
against dispatch-telemetry cost — reported as a native AnalytIQ artifact
(the platform demonstrates its own value with its own pipeline).
"""
import json

from conftest import wait_until


def _artifact(client, title='ROI Art'):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done',
               timeout=30)
    return client.post(f'/api/sessions/{sid}/save_artifact', json={'title': title}).get_json()


def test_artifact_roi_composes_adoption_and_cost(client, db):
    art = _artifact(client)
    for kind in ('view', 'view', 'share', 'fork'):
        db.execute("INSERT INTO artifact_activity (artifact_id, kind, actor) VALUES (?,?, 'a@x')",
                   (art['id'], kind))
    db.commit()
    r = client.get(f"/api/artifacts/{art['id']}/roi")
    assert r.status_code == 200
    body = r.get_json()
    assert body['signals']['views'] == 2
    assert body['signals']['shares'] == 1
    assert body['signals']['forks'] == 1
    # documented weights: view 1, export 2, annotation 2, share 3, fork 3, subscription 4
    assert body['adoption_score'] == 2 * 1 + 3 + 3
    assert body['est_cost'] > 0                      # dispatch + compute cost model
    assert body['roi_ratio'] == round(body['adoption_score'] / body['est_cost'], 2)
    assert client.get('/api/artifacts/999999/roi').status_code == 404


def test_adoption_score_monotonic_in_signals(client, db):
    art = _artifact(client, title='Mono')
    base = client.get(f"/api/artifacts/{art['id']}/roi").get_json()['adoption_score']
    db.execute("INSERT INTO artifact_activity (artifact_id, kind, actor) VALUES (?, 'view', 'a')",
               (art['id'],))
    db.commit()
    assert client.get(f"/api/artifacts/{art['id']}/roi").get_json()['adoption_score'] == base + 1


def test_roi_report_is_a_native_artifact(client, db):
    _artifact(client, title='Reported On')
    arts_before = db.execute('SELECT COUNT(*) c FROM artifacts').fetchone()['c']
    r = client.post('/api/workspace/roi_report')
    assert r.status_code == 201
    rep = r.get_json()
    assert db.execute('SELECT COUNT(*) c FROM artifacts').fetchone()['c'] == arts_before + 1
    f = db.execute('SELECT * FROM artifact_files WHERE artifact_id=? ORDER BY version DESC LIMIT 1',
                   (rep['id'],)).fetchone()
    assert f is not None
    assert 'Reported On' in f['html']                 # per-artifact rows present
    assert 'adoption' in f['html'].lower()
    validation = json.loads(f['validator_json'] or '{}')
    assert validation.get('status') == 'PASS'         # own pipeline, own gates
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='workspace.roi_report'").fetchone()


def test_roi_report_role_gate(client):
    assert client.post('/api/workspace/roi_report',
                       headers={'X-User-Role': 'viewer'}).status_code == 403
