"""
R36S1E1-US1 (backend) — gold tables list + detail aggregates: modeler gold
rows with grain, gate tallies and linked surfaces; detail carries real
schema (PRAGMA), humanized gates, artifacts, and the feature manifest.
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


def _gold(client):
    conn = client.post('/api/connections', json={'type': 'snowflake', 'account': 'g',
                                                 'username': 'u', 'password': 'p'}).get_json()
    client.post('/api/governance/run', json={'connectionId': conn['id']})
    wait_until(lambda: len(client.get(
        f"/api/integrations/{conn['id']}/manifest/versions").get_json() or []) >= 1,
        timeout=15)
    client.post('/api/semantic/default/generate', json={'connectionId': conn['id']})
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    client.post(f'/api/sessions/{sid}/spec', json=dict(SPEC))
    client.post('/api/modeler/generate', json={'sessionId': sid, 'mode': 'execute'})
    return sid


def test_gold_list_and_detail(client):
    sid = _gold(client)
    d = client.get('/api/gold/tables').get_json()
    row = next(r for r in d['tables'] if r['session_id'] == sid)
    for k in ('id', 'table_name', 'grain', 'version', 'row_count', 'status',
              'gates', 'linked'):
        assert k in row, k
    assert row['status'] == 'written'
    assert row['gates']['total'] >= 3 and row['gates']['passed'] <= row['gates']['total']

    det = client.get(f"/api/gold/tables/{row['id']}").get_json()
    assert det['table_name'] == row['table_name']
    assert det['columns'] and {'name', 'type'} <= set(det['columns'][0])
    assert det['gate_list'] and all('name' in g_ and 'status' in g_
                                    for g_ in det['gate_list'])
    assert det['feature_manifest'] and det['feature_manifest']['version']
    assert client.get('/api/gold/tables/999999').status_code == 404


def test_data_contracts_overview(client):
    """R36S1E2 — data contracts overview: per-contract posture with 30-day
    failure counts, blocking state from the latest manifest, and affected
    artifacts."""
    conn = client.post('/api/connections', json={'type': 'snowflake', 'account': 'dc',
                                                 'username': 'u', 'password': 'p'}).get_json()
    # contract that the sim catalog will violate (impossible min_rows)
    client.put('/api/contracts', json={'connectionId': conn['id'], 'table': 'fact_revenue',
                                       'required_columns': ['order_id_missing'],
                                       'min_rows': 10})
    rid = client.post('/api/governance/run', json={'connectionId': conn['id']}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/governance/{rid}').get_json().get('status')
               in ('done', 'complete'), timeout=30)
    wait_until(lambda: len(client.get(
        f"/api/integrations/{conn['id']}/manifest/versions").get_json() or []) >= 1,
        timeout=10)

    d = client.get('/api/contracts/overview').get_json()
    row = next(r for r in d['contracts'] if r['table'] == 'fact_revenue')
    assert row['required_columns'] == ['order_id_missing']
    assert row['blocking'] is True                 # violated on the latest run
    assert row['failures_30d'] >= 1                # contract alert recorded
    assert isinstance(row['affected'], list)
