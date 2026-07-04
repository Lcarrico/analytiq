"""
R5S2E3-US1 — Model card completion (target_type, duration, lineage) + async notify
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


def test_model_card_full_prd_fields_and_notification(client, db):
    cid = client.post('/api/connections', json={
        'type': 'snowflake', 'name': 'mcf', 'account': 'a', 'username': 'u',
        'password': 'p'}).get_json()['id']
    before = len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json() or [])
    client.post('/api/governance/run', json={'connectionId': cid})
    wait_until(lambda: len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json()
                           or []) > before)
    client.post('/api/semantic/default/generate', json={'connectionId': cid})
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    client.post(f'/api/sessions/{sid}/spec', json=dict(SPEC))
    client.post('/api/modeler/generate', json={'sessionId': sid, 'mode': 'execute'})
    jid = client.post('/api/training/run', json={'sessionId': sid}).get_json()['jobId']
    wait_until(lambda: client.get(f'/api/training/jobs/{jid}').get_json().get('status') == 'done',
               timeout=40)

    card_id = client.get(f'/api/training/jobs/{jid}').get_json()['model_card_id']
    card = client.get(f'/api/model_cards/{card_id}').get_json()
    assert card['target_type'] == 'regression'
    assert card['metrics']['training_duration_seconds'] >= 0
    lin = card['lineage']
    assert lin['gold_table'].startswith('analytics_default.gold_')
    assert lin['source_tables'] == ['dim_location', 'fact_revenue']
    assert lin['semantic_layer_version'] == '1.0.0'
    assert lin['governance_manifest_version'] == '1.0.0'

    # async completion notification landed in the outbox
    row = db.execute("SELECT * FROM email_outbox WHERE subject LIKE '%Training%'").fetchone()
    assert row is not None
