"""
R4S2E3-US1 — Leakage HITL confirmation + reviewed custom feature injection
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


def _gold_session(client):
    cid = client.post('/api/connections', json={
        'type': 'snowflake', 'name': 'lk', 'account': 'a', 'username': 'u',
        'password': 'p'}).get_json()['id']
    before = len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json() or [])
    client.post('/api/governance/run', json={'connectionId': cid})
    wait_until(lambda: len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json()
                           or []) > before)
    client.post('/api/semantic/default/generate', json={'connectionId': cid})
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    client.post(f'/api/sessions/{sid}/spec', json=dict(SPEC))
    client.post('/api/modeler/generate', json={'sessionId': sid, 'mode': 'execute'})
    return sid


def test_custom_feature_review_and_application(client, db):
    sid = _gold_session(client)
    client.post('/api/modeler/enrich', json={'sessionId': sid})

    # safe custom feature over existing gold columns → pending review
    r = client.post('/api/modeler/custom_features', json={
        'sessionId': sid, 'name': 'rev_vs_week',
        'expr': 'target_net_revenue / rolling_mean_7_target'})
    assert r.status_code == 201
    cf = r.get_json()
    assert cf['status'] == 'pending_review'
    assert cf['leakage']['action'] in ('PASS', 'HOLD')

    # unsafe expressions rejected
    for bad in ('__import__("os")', 'target_net_revenue; DROP TABLE x', 'nope_col * 2', ''):
        assert client.post('/api/modeler/custom_features', json={
            'sessionId': sid, 'name': 'bad', 'expr': bad}).status_code == 400

    # cannot apply before approval
    assert client.post(f"/api/modeler/custom_features/{cf['id']}/apply").status_code == 409
    assert client.post(f"/api/modeler/custom_features/{cf['id']}/approve").status_code == 200
    r = client.post(f"/api/modeler/custom_features/{cf['id']}/apply")
    assert r.status_code == 200

    gold = client.get(f'/api/modeler/gold/{sid}').get_json()[0]
    cols = {c[1] for c in db.execute(
        f'PRAGMA table_info("{gold["physical_table"]}")').fetchall()}
    assert 'rev_vs_week' in cols
    v = db.execute(f'SELECT rev_vs_week FROM "{gold["physical_table"]}" '
                   f'WHERE rolling_mean_7_target > 0 LIMIT 1').fetchone()[0]
    assert v is not None and v > 0


def test_hold_features_block_training_until_confirmed(client):
    sid = _gold_session(client)
    client.post('/api/modeler/enrich', json={'sessionId': sid})

    # leaky-named custom feature → HOLD, approved + applied, then gates training
    cf = client.post('/api/modeler/custom_features', json={
        'sessionId': sid, 'name': 'net_revenue_vs_peers',
        'expr': 'lag_1_target * 1.0'}).get_json()
    assert cf['leakage']['action'] == 'HOLD'
    client.post(f"/api/modeler/custom_features/{cf['id']}/approve")
    client.post(f"/api/modeler/custom_features/{cf['id']}/apply")

    r = client.post('/api/training/run', json={'sessionId': sid})
    assert r.status_code == 409
    body = r.get_json()
    assert body['error'] == 'leakage_confirmation_required'
    assert 'net_revenue_vs_peers' in body['held_features']

    # explicit human confirmation unblocks
    r = client.post('/api/modeler/leakage/confirm', json={
        'sessionId': sid, 'features': ['net_revenue_vs_peers'],
        'justification': 'value is a lag — name is misleading but safe'})
    assert r.status_code == 200
    job = client.post('/api/training/run', json={'sessionId': sid})
    assert job.status_code == 201
