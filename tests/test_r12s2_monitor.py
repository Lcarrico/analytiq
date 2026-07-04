"""
R12S2E4-US1 — Continuous Model Monitoring (Architecture v2.1 §17.4.4)

Beyond the MAPE threshold: rolling feature-importance reordering
(Kendall-tau vs the model card's baseline) and input distribution drift
(PSI) both trigger review — and fire event-driven retrain triggers — even
when accuracy has not yet breached.
"""
import json

from conftest import wait_until


def test_kendall_tau_deterministic(db):
    import model_monitor as mm
    assert mm.kendall_tau(['a', 'b', 'c', 'd'], ['a', 'b', 'c', 'd']) == 1.0
    assert mm.kendall_tau(['a', 'b', 'c', 'd'], ['d', 'c', 'b', 'a']) == -1.0
    mid = mm.kendall_tau(['a', 'b', 'c', 'd'], ['b', 'a', 'c', 'd'])
    assert -1.0 < mid < 1.0
    assert mm.kendall_tau([], []) == 1.0


def test_psi_detects_shift(db):
    import model_monitor as mm
    base = [100 + (i % 10) for i in range(200)]
    same = [100 + ((i + 3) % 10) for i in range(200)]
    shifted = [160 + (i % 10) for i in range(200)]
    assert mm.psi(base, same) < 0.1
    assert mm.psi(base, shifted) > 0.2


def _session_with_model(client, db, baseline, current):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    db.execute("INSERT INTO model_cards (session_id, algorithm, gold_table_name, "
               "metrics_json, status) VALUES (?, 'seasonal_trend', 'g', ?, 'promoted')",
               (sid, json.dumps({'validation_mape': 8.9,
                                 'top_features': baseline})))
    cid = db.execute('SELECT id FROM model_cards ORDER BY id DESC LIMIT 1').fetchone()['id']
    for rank, feat in enumerate(current, start=1):
        db.execute('INSERT INTO gold_model_insights (session_id, model_card_id, feature, '
                   'importance, rank) VALUES (?,?,?,?,?)',
                   (sid, cid, feat, 1.0 / rank, rank))
    db.commit()
    return sid


def test_importance_reorder_alerts_even_when_mape_is_fine(client, db):
    sid = _session_with_model(client, db,
                              baseline=['lag_7', 'promo', 'dow', 'holiday'],
                              current=['holiday', 'dow', 'promo', 'lag_7'])
    jobs_before = db.execute("SELECT COUNT(*) c FROM jobs WHERE kind='event_retrain'").fetchone()['c']
    r = client.post(f'/api/models/{sid}/monitor')
    assert r.status_code == 200
    body = r.get_json()
    assert body['importance_drift']['drifted'] is True
    assert body['importance_drift']['kendall_tau'] < 0.5
    assert db.execute("SELECT 1 FROM alerts WHERE type='model.importance_drift'").fetchone()
    ev = db.execute("SELECT * FROM platform_events WHERE event_type='drift_detected' "
                    'ORDER BY id DESC LIMIT 1').fetchone()
    assert ev is not None                             # event-driven retrain path
    assert db.execute("SELECT COUNT(*) c FROM jobs WHERE kind='event_retrain'").fetchone()['c'] \
        == jobs_before + 1


def test_stable_importances_do_not_alert(client, db):
    sid = _session_with_model(client, db,
                              baseline=['lag_7', 'promo', 'dow', 'holiday'],
                              current=['lag_7', 'promo', 'dow', 'holiday'])
    r = client.post(f'/api/models/{sid}/monitor')
    body = r.get_json()
    assert body['importance_drift']['drifted'] is False
    assert not db.execute("SELECT 1 FROM alerts WHERE type='model.importance_drift'").fetchone()


def test_input_distribution_drift_fires(client, db):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    r1 = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{r1}').get_json().get('status') == 'done',
               timeout=30)
    # second run with a shifted actual distribution (synthetic drifted data)
    lid = db.execute('INSERT INTO pipeline_runs (session_id, status, current_step) '
                     "VALUES (?, 'done', 4)", (sid,)).lastrowid
    for i in range(76):
        db.execute('INSERT INTO gold_predictions (pipeline_run_id, session_id, day_index, '
                   'date, actual, predicted, ci_low, ci_high) VALUES (?,?,?,?,?,?,?,?)',
                   (lid, sid, i, f'Day {i}', 1400 + (i % 10) * 5, 1400, 1300, 1500))
    db.commit()
    r = client.post(f'/api/models/{sid}/monitor')
    body = r.get_json()
    assert body['input_drift']['drifted'] is True
    assert body['input_drift']['psi'] > 0.2
    assert db.execute("SELECT 1 FROM alerts WHERE type='model.input_drift'").fetchone()


def test_monitor_contracts(client, db):
    assert client.post('/api/models/999999/monitor').status_code == 404


def test_monitor_by_artifact_route(client, db):
    sid = _session_with_model(client, db,
                              baseline=['lag_7', 'promo', 'dow', 'holiday'],
                              current=['holiday', 'dow', 'promo', 'lag_7'])
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done',
               timeout=30)
    art = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'Mon'}).get_json()
    r = client.post(f"/api/artifacts/{art['id']}/monitor")
    assert r.status_code == 200
    assert r.get_json()['importance_drift']['drifted'] is True
    assert client.post('/api/artifacts/999999/monitor').status_code == 404
