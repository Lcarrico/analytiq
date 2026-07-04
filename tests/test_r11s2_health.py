"""
R11S2E5-US1 — Dashboard Health Scoring (Architecture v2.1 §17.5.5)

Every dashboard scored on readability, accessibility, redundancy,
performance, and demonstrated usefulness — a workspace-level quality signal,
not a gate.
"""
import json

from conftest import wait_until


def _artifact(client, metric='Net Revenue', title='Health'):
    sid = client.post('/api/sessions', json={'metric': metric}).get_json()['id']
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done',
               timeout=30)
    return client.post(f'/api/sessions/{sid}/save_artifact', json={'title': title}).get_json()


def test_health_breakdown_has_all_five_components(client, db):
    art = _artifact(client)
    r = client.get(f"/api/artifacts/{art['id']}/health")
    assert r.status_code == 200
    body = r.get_json()
    assert set(body['components']) == {'readability', 'accessibility', 'redundancy',
                                       'performance', 'usefulness'}
    assert 0 <= body['score'] <= 100
    assert body['score'] == round(sum(body['components'].values()) / 5)
    assert client.get('/api/artifacts/999999/health').status_code == 404


def test_accessibility_and_readability_reflect_validation(client, db):
    art = _artifact(client)
    body = client.get(f"/api/artifacts/{art['id']}/health").get_json()
    assert body['components']['accessibility'] == 100      # validator PASS incl. aria
    assert body['components']['readability'] >= 80


def test_redundancy_penalizes_near_duplicates(client, db):
    a1 = _artifact(client, metric='Dup Metric', title='Dup A')
    solo = client.get(f"/api/artifacts/{a1['id']}/health").get_json()
    a2 = _artifact(client, metric='Dup Metric', title='Dup B')
    dup = client.get(f"/api/artifacts/{a1['id']}/health").get_json()
    assert dup['components']['redundancy'] < solo['components']['redundancy']
    unique = _artifact(client, metric='One Of A Kind', title='Solo')
    u = client.get(f"/api/artifacts/{unique['id']}/health").get_json()
    assert u['components']['redundancy'] == 100


def test_usefulness_rises_with_adoption(client, db):
    art = _artifact(client)
    before = client.get(f"/api/artifacts/{art['id']}/health").get_json()
    for _ in range(5):
        db.execute("INSERT INTO artifact_activity (artifact_id, kind, actor) "
                   "VALUES (?, 'view', 'ana@acme.com')", (art['id'],))
    db.commit()
    after = client.get(f"/api/artifacts/{art['id']}/health").get_json()
    assert after['components']['usefulness'] > before['components']['usefulness']


def test_performance_penalizes_slow_gold_reads(client, db):
    art = _artifact(client)
    fast = client.get(f"/api/artifacts/{art['id']}/health").get_json()
    for _ in range(6):
        db.execute("INSERT INTO service_logs (method, path, status, duration_ms) "
                   "VALUES ('GET', '/api/gold/default/gold_predictions', 200, 1200)")
    db.commit()
    slow = client.get(f"/api/artifacts/{art['id']}/health").get_json()
    assert slow['components']['performance'] < fast['components']['performance']


def test_workspace_rollup(client, db):
    _artifact(client, title='R1')
    _artifact(client, title='R2')
    r = client.get('/api/workspace/dashboard_health')
    assert r.status_code == 200
    body = r.get_json()
    assert len(body['artifacts']) >= 2
    scores = [a['score'] for a in body['artifacts']]
    assert body['average'] == round(sum(scores) / len(scores))
