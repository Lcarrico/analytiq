"""
R1S2E7-US1 — Full-text workspace search (Meilisearch → SQLite FTS5 fallback)
"""
from conftest import wait_until


def _artifact_via_session(client, title, metric='Net Revenue'):
    sid = client.post('/api/sessions', json={'metric': metric}).get_json()['id']
    run = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status') == 'done',
               timeout=30)
    client.post(f'/api/sessions/{sid}/spec', json={
        'intent': 'predictive', 'intent_confidence': 0.9, 'analytic_goal': 'g',
        'target_metric': metric, 'feature_candidates': ['net_revenue'],
        'date_range': {'start': '2023-01-01', 'end': '2023-12-31'},
        'grain': 'Location · Day', 'output_type': 'forecast_dashboard',
        'prediction_horizon': 14, 'explores_used': ['fact_revenue'],
        'semantic_layer_version': '1.0.0', 'governance_manifest_version': '1.0.0'})
    return client.post(f'/api/sessions/{sid}/save_artifact', json={'title': title}).get_json()


def test_search_by_title_and_metric_name(client):
    a1 = _artifact_via_session(client, 'Quarterly Revenue Outlook', 'Net Revenue')
    a2 = _artifact_via_session(client, 'Churn Deep Dive', 'Conversion Rate')

    hits = client.get('/api/search?q=Quarterly').get_json()
    assert [h['id'] for h in hits] == [a1['id']]

    # metric-name match even though the title doesn't contain it
    hits = client.get('/api/search?q=conversion').get_json()
    assert a2['id'] in [h['id'] for h in hits]
    assert all('score' in h or 'title' in h for h in hits)


def test_search_index_stays_in_sync(client):
    art = client.post('/api/artifacts', json={'title': 'Ephemeral Report'}).get_json()
    assert client.get('/api/search?q=Ephemeral').get_json()

    client.delete(f"/api/artifacts/{art['id']}")
    assert client.get('/api/search?q=Ephemeral').get_json() == []


def test_search_validation_and_mode(client):
    assert client.get('/api/search').status_code == 400
    assert client.get('/api/search?q=').status_code == 400
    assert client.get('/api/platform/status').get_json()['search']['mode'] == 'local'
