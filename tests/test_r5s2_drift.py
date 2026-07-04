"""
R5S2E2-US1 — Model drift monitoring on refresh + one-click retrain
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


def _full_stack(client):
    cid = client.post('/api/connections', json={
        'type': 'snowflake', 'name': 'dr', 'account': 'a', 'username': 'u',
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
    promo = client.post(f'/api/training/jobs/{jid}/promote').get_json()
    run = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status') == 'done',
               timeout=30)
    art = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'drifty'}).get_json()
    return sid, promo, art


def test_refresh_detects_drift_against_baseline(client, db):
    sid, promo, art = _full_stack(client)
    # force a tight baseline so the rolling window clearly exceeds 1.5×
    card = db.execute('SELECT * FROM model_cards WHERE id=?',
                      (promo['model_card_id'],)).fetchone()
    m = json.loads(card['metrics_json'])
    m['val_mape'] = 1.0
    db.execute('UPDATE model_cards SET metrics_json=? WHERE id=?',
               (json.dumps(m), card['id']))
    db.commit()

    client.post(f"/api/artifacts/{art['id']}/refresh")
    drift = client.get(f"/api/artifacts/{art['id']}/drift").get_json()
    assert drift['status'] == 'drifting'
    assert drift['history']
    h = drift['history'][0]['detail']
    assert h['rolling_mape'] > h['baseline_mape'] * 1.5
    assert db.execute("SELECT 1 FROM alerts WHERE type='model_drift'").fetchone()


def test_no_drift_when_within_bounds(client, db):
    sid, promo, art = _full_stack(client)
    card = db.execute('SELECT * FROM model_cards WHERE id=?',
                      (promo['model_card_id'],)).fetchone()
    m = json.loads(card['metrics_json'])
    m['val_mape'] = 50.0                      # generous baseline → no drift
    db.execute('UPDATE model_cards SET metrics_json=? WHERE id=?',
               (json.dumps(m), card['id']))
    db.commit()
    client.post(f"/api/artifacts/{art['id']}/refresh")
    assert client.get(f"/api/artifacts/{art['id']}/drift").get_json()['status'] == 'healthy'


def test_one_click_retrain_advances_window_and_archives(client, db):
    sid, promo, art = _full_stack(client)
    r = client.post(f'/api/models/{sid}/retrain')
    assert r.status_code == 201
    out = r.get_json()
    assert out['jobId']
    spec = client.get(f'/api/sessions/{sid}/spec').get_json()['spec']
    assert spec['date_range']['start'] > '2023-01-01'    # rolling window advanced
    assert spec['date_range']['end'] > '2023-12-31'

    old = client.get(f"/api/registry/models/{promo['registry_id']}").get_json()
    assert old['status'] == 'archived'                    # archived, not deleted
    wait_until(lambda: client.get(f"/api/training/jobs/{out['jobId']}").get_json()
               .get('status') == 'done', timeout=40)
    assert client.post('/api/models/9999/retrain').status_code == 404
