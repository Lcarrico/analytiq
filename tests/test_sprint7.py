"""
Sprint 7 — Training Orchestrator & Algorithms
  F-027 Training executor (local sync runner, deterministic, real MAPE)
  F-028 Walk-forward backtesting (5 expanding windows)
  F-029 Model card schema generation + persistence
  F-030 Job queue (training_jobs status lifecycle)
  F-031 Trial leaderboard logging
"""
import json
import math

from conftest import wait_until

SPEC = {
    'intent': 'predictive', 'intent_confidence': 0.93,
    'analytic_goal': 'Predict net revenue for the next 14 days by location',
    'target_metric': 'Net Revenue',
    'feature_candidates': ['net_revenue', 'day', 'location_id', 'tier'],
    'date_range': {'start': '2023-01-01', 'end': '2023-12-31'},
    'grain': 'Location · Day', 'output_type': 'forecast_dashboard',
    'prediction_horizon': 14, 'explores_used': ['fact_revenue', 'dim_location'],
    'semantic_layer_version': '1.0.0', 'governance_manifest_version': '1.0.0',
}


def _series(n=200, seed=3):
    """Synthetic learnable series: weekday seasonality + trend + small noise."""
    s = seed
    out = []
    for i in range(n):
        s = (s * 9301 + 49297) % 233280
        noise = (s / 233280 - 0.5) * 30
        weekday = [0.9, 0.95, 1.0, 1.05, 1.1, 0.8, 0.75][i % 7]
        out.append(600 * weekday * (1 + i / n * 0.2) + noise)
    return out


def _gold_session(client):
    cid = client.post('/api/connections', json={
        'name': 'tr', 'type': 'snowflake', 'account': 'a', 'username': 'u',
        'password': 'p'}).get_json()['id']
    run_id = client.post('/api/governance/run', json={'connectionId': cid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/governance/{run_id}').get_json().get('status') == 'done')
    wait_until(lambda: client.get(f'/api/integrations/{cid}/manifest').status_code == 200)
    client.post('/api/semantic/default/generate', json={'connectionId': cid})
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    client.post(f'/api/sessions/{sid}/spec', json=dict(SPEC))
    client.post('/api/modeler/generate', json={'sessionId': sid, 'mode': 'execute'})
    return sid


# ── unit: model + backtest ───────────────────────────────
def test_model_fit_predict_deterministic():
    import training
    y = _series()
    model = training.SeasonalTrendModel(season='weekday', use_trend=True)
    model.fit(y)
    p1 = model.predict(len(y), 14)
    p2 = model.predict(len(y), 14)
    assert p1 == p2
    assert len(p1) == 14
    assert all(v > 0 for v in p1)
    # in-sample fit is meaningfully better than random: MAPE on tail < 20%
    tail_pred = model.predict(len(y) - 14, 14)
    tail_true = y[-14:]
    mape = sum(abs(a - b) / a for a, b in zip(tail_true, tail_pred)) / 14 * 100
    assert mape < 20


def test_walk_forward_backtest_expanding_windows():
    import training
    y = _series()
    res = training.walk_forward_backtest(y, horizon=14, windows=5,
                                         params={'season': 'weekday', 'use_trend': True})
    assert len(res['folds']) == 5
    train_sizes = [f['train_size'] for f in res['folds']]
    assert train_sizes == sorted(train_sizes) and train_sizes[0] < train_sizes[-1]
    for f in res['folds']:
        assert math.isfinite(f['mape']) and 0 <= f['mape'] < 100
    assert math.isfinite(res['mape']) and res['mape'] < 25  # learnable series


def test_trials_leaderboard_selects_best():
    import training
    y = _series()
    best, trials = training.run_trials(y, horizon=14)
    assert len(trials) >= 3
    mapes = [t['mape'] for t in trials]
    assert best['mape'] == min(mapes)
    assert best['params'] in [t['params'] for t in trials]


# ── endpoint: queue lifecycle + model card ───────────────
def test_training_requires_gold_table(client):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    r = client.post('/api/training/run', json={'sessionId': sid})
    assert r.status_code == 409
    assert 'gold' in r.get_json()['error'].lower()
    assert client.post('/api/training/run', json={}).status_code == 400


def test_training_job_lifecycle_and_model_card(client, db):
    sid = _gold_session(client)
    r = client.post('/api/training/run', json={'sessionId': sid})
    assert r.status_code == 201
    job_id = r.get_json()['jobId']

    job = wait_until(lambda: (lambda j: j if j.get('status') == 'done' else None)(
        client.get(f'/api/training/jobs/{job_id}').get_json()), timeout=30)
    assert job['started_at'] and job['completed_at']
    assert job['model_card_id']

    mc = client.get(f"/api/model_cards/{job['model_card_id']}")
    assert mc.status_code == 200
    card = mc.get_json()
    assert card['algorithm']
    assert card['session_id'] == sid
    assert card['feature_manifest_version'] == '1.0.0'
    assert card['gold_table_name'].startswith('analytics_default.gold_')
    m = card['metrics']
    assert 0 < m['val_mape'] < 50
    assert len(m['folds']) == 5
    assert card['gates']['mape_gate']['status'] == 'PASS'   # threshold 15%
    assert card['gates']['overfit_gate']['status'] in ('PASS', 'FAIL')
    assert card['hyperparams']

    # deterministic training: rerun produces identical val_mape
    r2 = client.post('/api/training/run', json={'sessionId': sid})
    job2 = wait_until(lambda: (lambda j: j if j.get('status') == 'done' else None)(
        client.get(f"/api/training/jobs/{r2.get_json()['jobId']}").get_json()), timeout=30)
    card2 = client.get(f"/api/model_cards/{job2['model_card_id']}").get_json()
    assert card2['metrics']['val_mape'] == m['val_mape']

    assert client.get('/api/model_cards/99999').status_code == 404


def test_trials_logged_to_leaderboard_table(client, db):
    sid = _gold_session(client)
    job_id = client.post('/api/training/run', json={'sessionId': sid}).get_json()['jobId']
    wait_until(lambda: client.get(f'/api/training/jobs/{job_id}').get_json().get('status') == 'done',
               timeout=30)
    trials = db.execute('SELECT * FROM model_trials WHERE job_id=? ORDER BY mape', (job_id,)).fetchall()
    assert len(trials) >= 3
    for t in trials:
        assert t['mape'] is not None
        assert json.loads(t['params_json'])
    # leaderboard API
    lb = client.get(f'/api/training/jobs/{job_id}/trials').get_json()
    assert [t['mape'] for t in lb] == sorted(t['mape'] for t in lb)

    # winning trial == model card hyperparams
    job = client.get(f'/api/training/jobs/{job_id}').get_json()
    card = client.get(f"/api/model_cards/{job['model_card_id']}").get_json()
    assert card['hyperparams'] == json.loads(trials[0]['params_json'])


def test_training_jobs_list_and_audit(client, db):
    sid = _gold_session(client)
    job_id = client.post('/api/training/run', json={'sessionId': sid}).get_json()['jobId']
    wait_until(lambda: client.get(f'/api/training/jobs/{job_id}').get_json().get('status') == 'done',
               timeout=30)
    lst = client.get(f'/api/training/jobs?session_id={sid}').get_json()
    assert len(lst) == 1 and lst[0]['id'] == job_id
    acts = {r['action'] for r in db.execute(
        "SELECT action FROM audit_logs WHERE resource_type='training_job'").fetchall()}
    assert {'training.queued', 'training.completed'} <= acts
