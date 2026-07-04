"""
R4S1E1-US1 — Session history, forking, and templates
"""
from conftest import wait_until

SPEC = {
    'intent': 'predictive', 'intent_confidence': 0.9, 'analytic_goal': 'g',
    'target_metric': 'Net Revenue', 'feature_candidates': ['net_revenue'],
    'date_range': {'start': '2023-01-01', 'end': '2023-12-31'},
    'grain': 'Location · Day', 'output_type': 'forecast_dashboard',
    'prediction_horizon': 14, 'explores_used': ['fact_revenue'],
    'semantic_layer_version': '1.0.0', 'governance_manifest_version': '1.0.0',
}


def test_session_history_lists_specs_and_artifacts(client):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    client.post(f'/api/sessions/{sid}/spec', json=SPEC)
    run = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status') == 'done',
               timeout=30)
    art = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'Hist'}).get_json()

    hist = client.get('/api/sessions').get_json()
    assert len(hist) == 1
    h = hist[0]
    assert h['id'] == sid
    assert h['spec']['target_metric'] == 'Net Revenue'
    assert h['artifacts'][0]['id'] == art['id']


def test_session_forking_with_overrides(client, db):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    client.post(f'/api/sessions/{sid}/spec', json=SPEC)

    r = client.post(f'/api/sessions/{sid}/fork', json={'prediction_horizon': 28})
    assert r.status_code == 201
    fork = r.get_json()
    assert fork['id'] != sid
    assert fork['parent_session_id'] == sid
    forked_spec = client.get(f"/api/sessions/{fork['id']}/spec").get_json()
    assert forked_spec['spec_version'] == 1
    assert forked_spec['spec']['prediction_horizon'] == 28
    assert forked_spec['spec']['target_metric'] == 'Net Revenue'   # inherited
    # parent untouched
    assert client.get(f'/api/sessions/{sid}/spec').get_json()['spec']['prediction_horizon'] == 14

    # forking requires a confirmed spec
    bare = client.post('/api/sessions', json={'metric': 'X'}).get_json()['id']
    assert client.post(f'/api/sessions/{bare}/fork', json={}).status_code == 409
    assert client.post('/api/sessions/9999/fork', json={}).status_code == 404


def test_session_templates(client):
    r = client.post('/api/templates', json={'name': 'Weekly revenue forecast',
                                            'spec': SPEC})
    assert r.status_code == 201
    tid = r.get_json()['id']

    # viewer cannot create templates
    assert client.post('/api/templates', json={'name': 'x', 'spec': SPEC},
                       headers={'X-User-Role': 'viewer'}).status_code == 403
    # invalid template spec rejected
    assert client.post('/api/templates', json={'name': 'bad', 'spec': {'intent': 'x'}}).status_code == 400

    assert client.get('/api/templates').get_json()[0]['name'] == 'Weekly revenue forecast'

    r = client.post(f'/api/sessions/from_template/{tid}', json={'prediction_horizon': 7})
    assert r.status_code == 201
    new = r.get_json()
    spec = client.get(f"/api/sessions/{new['id']}/spec").get_json()['spec']
    assert spec['prediction_horizon'] == 7
    assert spec['target_metric'] == 'Net Revenue'
    assert client.post('/api/sessions/from_template/999', json={}).status_code == 404
