"""
R3S2E5-US1 — Artifact dependency tracking on semantic changes
"""
from conftest import wait_until


def _ready(client):
    cid = client.post('/api/connections', json={
        'type': 'snowflake', 'name': 'imp', 'account': 'a', 'username': 'u',
        'password': 'p'}).get_json()['id']
    before = len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json() or [])
    client.post('/api/governance/run', json={'connectionId': cid})
    wait_until(lambda: len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json()
                           or []) > before)
    client.post('/api/semantic/default/generate', json={'connectionId': cid})
    return cid


def _artifact(client, title, explores):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    run = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status') == 'done',
               timeout=30)
    client.post(f'/api/sessions/{sid}/spec', json={
        'intent': 'predictive', 'intent_confidence': 0.9, 'analytic_goal': 'g',
        'target_metric': 'Net Revenue', 'feature_candidates': ['net_revenue'],
        'date_range': {'start': '2023-01-01', 'end': '2023-12-31'},
        'grain': 'Location · Day', 'output_type': 'forecast_dashboard',
        'prediction_horizon': 14, 'explores_used': explores,
        'semantic_layer_version': '1.0.0', 'governance_manifest_version': '1.0.0'})
    return client.post(f'/api/sessions/{sid}/save_artifact', json={'title': title}).get_json()


def test_explore_edit_reports_impacted_artifacts(client):
    _ready(client)
    hit = _artifact(client, 'Revenue Watch', ['fact_revenue'])
    miss = _artifact(client, 'Sessions Watch', ['fact_sessions'])

    r = client.patch('/api/semantic/default/explores/fact_revenue',
                     json={'description': 'changed meaning'})
    assert r.status_code == 200
    impacted = r.get_json()['impacted_artifacts']
    ids = {a['id'] for a in impacted}
    assert hit['id'] in ids and miss['id'] not in ids


def test_impacts_endpoint_between_versions(client):
    _ready(client)
    art = _artifact(client, 'Impacted', ['fact_revenue'])
    v_from = client.get('/api/semantic/default/schema').get_json()['version']
    v_to = client.patch('/api/semantic/default/explores/fact_revenue',
                        json={'description': 'v2'}).get_json()['version']

    r = client.get(f'/api/semantic/default/impacts?from={v_from}&to={v_to}')
    assert r.status_code == 200
    out = r.get_json()
    assert 'fact_revenue' in out['changed_cubes']
    assert any(a['id'] == art['id'] for a in out['impacted_artifacts'])

    assert client.get('/api/semantic/default/impacts?from=9.9.9&to=1.0.0').status_code == 404
    assert client.get('/api/semantic/default/impacts').status_code == 400
