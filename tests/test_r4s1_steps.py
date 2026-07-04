"""
R4S1E3-US1 — Cell-based pipeline step audit trail + related analysis suggestions
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


def test_pipeline_records_labelled_step_cards(client):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    run = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status') == 'done',
               timeout=30)
    steps = client.get(f"/api/pipeline/{run['runId']}/steps").get_json()
    assert len(steps) == 4
    assert [s['step'] for s in steps] == [1, 2, 3, 4]
    for s in steps:
        assert s['label']
        assert s['description']                       # plain-English
        assert isinstance(s['input_schema'], list)
        assert isinstance(s['output_schema'], list)
    assert 'gold' in steps[0]['label'].lower() or 'feature' in steps[0]['label'].lower()

    # flag a step for review
    r = client.post(f"/api/pipeline/{run['runId']}/steps/2/flag",
                    json={'reason': 'check the split'})
    assert r.status_code == 200
    steps = client.get(f"/api/pipeline/{run['runId']}/steps").get_json()
    assert steps[1]['flagged'] == 1


def test_related_analysis_suggestions(client):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    client.post(f'/api/sessions/{sid}/spec', json=SPEC)
    # sibling sessions provide cross-workspace patterns
    other = client.post('/api/sessions', json={'metric': 'Conversion Rate'}).get_json()['id']
    client.post(f'/api/sessions/{other}/spec',
                json=dict(SPEC, target_metric='Conversion Rate'))

    sugg = client.get(f'/api/sessions/{sid}/suggestions').get_json()
    assert 3 <= len(sugg) <= 5
    assert all(s['question'] and s['intent'] for s in sugg)
    joined = ' '.join(s['question'] for s in sugg)
    assert 'Net Revenue' in joined                       # variations on current spec
    assert any('Conversion Rate' in s['question'] for s in sugg)  # from sibling session

    assert client.get('/api/sessions/9999/suggestions').status_code == 404
