"""
R33S1E1-US1 (backend) — models overview aggregate: 6 KPIs + a model table
row per registry entry with typed status (CHAMPION / RUN FAILED / TRAINING),
purpose from the session, accuracy from the model card, and action hints.
"""
from conftest import wait_until

SPEC = {
    'intent': 'predictive', 'intent_confidence': 0.93, 'analytic_goal': 'g',
    'target_metric': 'Net Revenue',
    'feature_candidates': ['net_revenue', 'day', 'location_id', 'tier'],
    'date_range': {'start': '2023-01-01', 'end': '2023-12-31'},
    'grain': 'Location · Day', 'output_type': 'forecast_dashboard',
    'prediction_horizon': 14, 'explores_used': ['fact_revenue', 'dim_location'],
    'semantic_layer_version': '1.0.0', 'governance_manifest_version': '1.0.0',
}


def _champion(client):
    conn = client.post('/api/connections', json={'type': 'snowflake', 'account': 'a',
                                                 'username': 'u', 'password': 'p'}).get_json()
    client.post('/api/governance/run', json={'connectionId': conn['id']})
    wait_until(lambda: len(client.get(
        f"/api/integrations/{conn['id']}/manifest/versions").get_json() or []) >= 1,
        timeout=15)
    client.post('/api/semantic/default/generate', json={'connectionId': conn['id']})
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    client.post(f'/api/sessions/{sid}/spec', json=dict(SPEC))
    client.post('/api/modeler/generate', json={'sessionId': sid, 'mode': 'execute'})
    job_id = client.post('/api/training/run', json={'sessionId': sid}).get_json()['jobId']
    wait_until(lambda: client.get(f'/api/training/jobs/{job_id}').get_json().get('status')
               == 'done', timeout=40)
    r = client.post(f'/api/training/jobs/{job_id}/promote')
    assert r.status_code in (200, 201), r.get_json()
    return sid, job_id


def test_models_overview_kpis_and_rows(client):
    sid, job_id = _champion(client)
    d = client.get('/api/models/overview').get_json()

    k = d['kpis']
    for key in ('promoted', 'runs_30d', 'failed', 'retrain_due',
                'champ_challenger', 'prediction_tables'):
        assert key in k and isinstance(k[key], int)
    assert k['promoted'] >= 1
    assert k['runs_30d'] >= 1
    assert k['prediction_tables'] >= 1          # gold table materialized

    rows = d['models']
    assert rows
    row = rows[0]
    for key in ('registry_id', 'model_id', 'status', 'purpose', 'algorithm',
                'last_trained', 'accuracy', 'session_id', 'card_id'):
        assert key in row, key
    assert row['status'] == 'CHAMPION'
    assert 'Net Revenue' in row['purpose']
    assert row['accuracy']['label'] in ('MAPE', 'AUC', 'MAE')
    assert row['accuracy']['value'] is not None


def test_models_overview_empty_db(client):
    d = client.get('/api/models/overview').get_json()
    assert d['models'] == []
    assert d['kpis']['promoted'] == 0


def test_two_sessions_same_spec_get_isolated_gold(client):
    """R33S1E2 collateral: identical specs across sessions must not share a
    physical gold table — the second write used to collide (duplicate grain
    keys -> status 'blocked' -> training 409)."""
    conn = client.post('/api/connections', json={'type': 'snowflake', 'account': 'a',
                                                 'username': 'u', 'password': 'p'}).get_json()
    client.post('/api/governance/run', json={'connectionId': conn['id']})
    wait_until(lambda: len(client.get(
        f"/api/integrations/{conn['id']}/manifest/versions").get_json() or []) >= 1,
        timeout=15)
    client.post('/api/semantic/default/generate', json={'connectionId': conn['id']})

    golds = []
    for _ in range(2):
        sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
        client.post(f'/api/sessions/{sid}/spec', json=dict(SPEC))
        r = client.post('/api/modeler/generate', json={'sessionId': sid, 'mode': 'execute'})
        assert r.status_code in (200, 201), r.get_json()
        g = client.get(f'/api/modeler/gold/{sid}').get_json()[0]
        golds.append(g)
        assert g['status'] == 'written', g['dq_gates'].get('grain')
        j = client.post('/api/training/run', json={'sessionId': sid})
        assert j.status_code == 201, j.get_json()

    assert golds[0]['physical_table'] != golds[1]['physical_table']
