"""
R5S1E2-US1 — Seeded random hyperparameter search + RMSE/directional accuracy
+ walk-forward stability gate (worst window ≤ 1.5× mean)
"""
import math

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


def test_random_search_is_seeded_and_prunable():
    import training
    y = _series()
    best1, trials1 = training.random_search(y, horizon=14, n_trials=12, seed=42)
    best2, trials2 = training.random_search(y, horizon=14, n_trials=12, seed=42)
    assert [t['params'] for t in trials1] == [t['params'] for t in trials2]  # seeded
    assert best1['mape'] == best2['mape']
    assert len(trials1) <= 12
    # pruning may stop early after `patience` non-improving trials
    best3, trials3 = training.random_search(y, horizon=14, n_trials=50, seed=1, patience=5)
    assert len(trials3) < 50


def test_fold_metrics_include_rmse_and_directional_accuracy():
    import training
    res = training.walk_forward_backtest(_series(), horizon=14,
                                         params={'family': 'seasonal-trend',
                                                 'season': 'weekday', 'use_trend': True})
    for f in res['folds']:
        assert math.isfinite(f['rmse']) and f['rmse'] > 0
        assert 0.0 <= f['directional_accuracy'] <= 1.0
    assert res['rmse'] > 0
    assert 0.0 <= res['directional_accuracy'] <= 1.0


def test_stability_gate_flags_erratic_windows():
    import training
    stable = {'folds': [{'mape': 8.0}, {'mape': 9.0}, {'mape': 8.5}]}
    erratic = {'folds': [{'mape': 4.0}, {'mape': 4.5}, {'mape': 30.0}]}
    assert training.stability_gate(stable)['status'] == 'PASS'
    g = training.stability_gate(erratic)
    assert g['status'] == 'FAIL'
    assert g['worst'] == 30.0
    assert g['limit'] < 30.0


def test_model_card_carries_full_metrics_and_stability(client, db):
    cid = client.post('/api/connections', json={
        'type': 'snowflake', 'name': 'rs', 'account': 'a', 'username': 'u',
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
    job = client.get(f'/api/training/jobs/{job_id}').get_json()
    card = client.get(f"/api/model_cards/{job['model_card_id']}").get_json()
    for f in card['metrics']['folds']:
        assert 'rmse' in f and 'directional_accuracy' in f
    assert card['gates']['stability_gate']['status'] in ('PASS', 'FAIL')
