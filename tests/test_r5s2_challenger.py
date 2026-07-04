"""
R5S2E1-US1 — Champion/challenger framework with >5% auto-promotion rule
"""
import json

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
    cid = client.post('/api/connections', json={
        'type': 'snowflake', 'name': 'cc', 'account': 'a', 'username': 'u',
        'password': 'p'}).get_json()['id']
    before = len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json() or [])
    client.post('/api/governance/run', json={'connectionId': cid})
    wait_until(lambda: len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json()
                           or []) > before)
    client.post('/api/semantic/default/generate', json={'connectionId': cid})
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    client.post(f'/api/sessions/{sid}/spec', json=dict(SPEC))
    client.post('/api/modeler/generate', json={'sessionId': sid, 'mode': 'execute'})

    def train():
        jid = client.post('/api/training/run', json={'sessionId': sid}).get_json()['jobId']
        wait_until(lambda: client.get(f'/api/training/jobs/{jid}').get_json().get('status') == 'done',
                   timeout=40)
        return jid

    j1 = train()
    champ = client.post(f'/api/training/jobs/{j1}/promote').get_json()
    j2 = train()
    challenger_card = client.get(f'/api/training/jobs/{j2}').get_json()['model_card_id']
    return sid, champ, challenger_card


def test_challenger_registration_and_win_promotion(client, db):
    sid, champ, challenger_card = _champion(client)
    r = client.post('/api/registry/challenger',
                    json={'sessionId': sid, 'modelCardId': challenger_card})
    assert r.status_code == 201
    ch = r.get_json()
    assert ch['status'] == 'challenger'

    # equal metrics → no promotion yet
    r = client.post(f"/api/registry/challenger/{ch['registry_id']}/evaluate")
    assert r.status_code == 200
    assert r.get_json()['outcome'] == 'champion_retained'

    # make the challenger >5% better → auto-promote
    m = json.loads(db.execute('SELECT metrics_json FROM model_cards WHERE id=?',
                              (challenger_card,)).fetchone()['metrics_json'])
    m['val_mape'] = m['val_mape'] * 0.9
    db.execute('UPDATE model_cards SET metrics_json=? WHERE id=?',
               (json.dumps(m), challenger_card))
    db.commit()

    out = client.post(f"/api/registry/challenger/{ch['registry_id']}/evaluate").get_json()
    assert out['outcome'] == 'challenger_promoted'
    assert out['improvement_pct'] > 5

    new = client.get(f"/api/registry/models/{ch['registry_id']}").get_json()
    old = client.get(f"/api/registry/models/{champ['registry_id']}").get_json()
    assert new['status'] == 'active'
    assert old['status'] == 'archived'
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='model.challenger_promoted'").fetchone()


def test_challenger_validation(client):
    assert client.post('/api/registry/challenger', json={}).status_code == 400
    assert client.post('/api/registry/challenger',
                       json={'sessionId': 1, 'modelCardId': 424242}).status_code == 404
    assert client.post('/api/registry/challenger/9999/evaluate').status_code == 404
