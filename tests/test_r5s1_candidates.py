"""
R5S1E1-US1 — Multi-candidate training (3 families) + automatic ensemble
"""
from conftest import wait_until


def _series(n=200, seed=3):
    s = seed
    out = []
    for i in range(n):
        s = (s * 9301 + 49297) % 233280
        noise = (s / 233280 - 0.5) * 30
        weekday = [0.9, 0.95, 1.0, 1.05, 1.1, 0.8, 0.75][i % 7]
        out.append(600 * weekday * (1 + i / n * 0.2) + noise)
    return out


def test_three_candidate_families_evaluated():
    import training
    res = training.run_candidates(_series(), horizon=14)
    families = {c['family'] for c in res['candidates']}
    assert {'seasonal-trend', 'ridge-lite', 'baseline-naive'} <= families
    for c in res['candidates']:
        assert c['mape'] > 0 and c['params'] is not None
    assert res['winner']['family'] in families | {'ensemble'}
    # candidates ranked
    mapes = [c['mape'] for c in res['candidates']]
    assert res['winner']['mape'] <= min(mapes) or res['winner']['family'] == 'ensemble'


def test_ensemble_considered_when_top_two_close():
    import training
    res = training.run_candidates(_series(), horizon=14)
    top2 = sorted(res['candidates'], key=lambda c: c['mape'])[:2]
    close = abs(top2[0]['mape'] - top2[1]['mape']) / top2[0]['mape'] <= 0.03
    if close:
        assert res['ensemble_evaluated'] is True
    else:
        assert res['ensemble_evaluated'] is False


def test_ridge_lite_model_fits_trend():
    import training
    y = [10 + 2 * i for i in range(60)]           # clean linear trend
    m = training.RidgeLiteModel().fit(y)
    preds = m.predict(60, 5)
    for k, p in enumerate(preds):
        assert abs(p - (10 + 2 * (60 + k))) < 2   # near-perfect extrapolation


def test_job_records_family_leaderboard(client, db):
    cid = client.post('/api/connections', json={
        'type': 'snowflake', 'name': 'mc', 'account': 'a', 'username': 'u',
        'password': 'p'}).get_json()['id']
    before = len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json() or [])
    client.post('/api/governance/run', json={'connectionId': cid})
    wait_until(lambda: len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json()
                           or []) > before)
    client.post('/api/semantic/default/generate', json={'connectionId': cid})
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    client.post(f'/api/sessions/{sid}/spec', json={
        'intent': 'predictive', 'intent_confidence': 0.9, 'analytic_goal': 'g',
        'target_metric': 'Net Revenue', 'feature_candidates': ['net_revenue'],
        'date_range': {'start': '2023-01-01', 'end': '2023-12-31'},
        'grain': 'Location · Day', 'output_type': 'forecast_dashboard',
        'prediction_horizon': 14, 'explores_used': ['fact_revenue'],
        'semantic_layer_version': '1.0.0', 'governance_manifest_version': '1.0.0'})
    client.post('/api/modeler/generate', json={'sessionId': sid, 'mode': 'execute'})
    job_id = client.post('/api/training/run', json={'sessionId': sid}).get_json()['jobId']
    wait_until(lambda: client.get(f'/api/training/jobs/{job_id}').get_json().get('status') == 'done',
               timeout=30)

    trials = client.get(f'/api/training/jobs/{job_id}/trials').get_json()
    families = {t['params'].get('family') for t in trials}
    assert {'seasonal-trend', 'ridge-lite', 'baseline-naive'} <= families

    card = client.get(f"/api/model_cards/{client.get(f'/api/training/jobs/{job_id}').get_json()['model_card_id']}").get_json()
    assert card['algorithm'] in ('seasonal-trend', 'ridge-lite', 'baseline-naive', 'ensemble')
