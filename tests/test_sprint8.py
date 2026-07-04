"""
Sprint 8 — Promotion & Registry
  F-032 Promotion + repair loop (max 3 cycles, human_required on exhaustion)
  F-033 Training result API (status, metrics, links)
  F-034 Model registry storage (model_card + artifact pointers, versioning)
"""
import json

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


def _trained_session(client):
    cid = client.post('/api/connections', json={
        'name': 'pr', 'type': 'snowflake', 'account': 'a', 'username': 'u',
        'password': 'p'}).get_json()['id']
    run_id = client.post('/api/governance/run', json={'connectionId': cid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/governance/{run_id}').get_json().get('status') == 'done')
    wait_until(lambda: client.get(f'/api/integrations/{cid}/manifest').status_code == 200)
    client.post('/api/semantic/default/generate', json={'connectionId': cid})
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    client.post(f'/api/sessions/{sid}/spec', json=dict(SPEC))
    client.post('/api/modeler/generate', json={'sessionId': sid, 'mode': 'execute'})
    job_id = client.post('/api/training/run', json={'sessionId': sid}).get_json()['jobId']
    wait_until(lambda: client.get(f'/api/training/jobs/{job_id}').get_json().get('status') == 'done',
               timeout=30)
    return sid, job_id


def test_promotion_happy_path_registers_model(client, db):
    sid, job_id = _trained_session(client)
    r = client.post(f'/api/training/jobs/{job_id}/promote')
    assert r.status_code == 200
    out = r.get_json()
    assert out['status'] == 'promoted'
    assert out['model_id'].startswith('stm-lite-s')
    assert out['registry_id']
    # repair loop may retune within its 3-cycle budget before promotion succeeds
    assert 0 <= out['repair_cycles'] <= 3
    assert all(v['status'] == 'PASS' for v in out['gates'].values())

    card = client.get(f"/api/model_cards/{out['model_card_id']}").get_json()
    assert card['status'] == 'promoted'

    reg = client.get(f"/api/registry/models/{out['registry_id']}").get_json()
    assert reg['status'] == 'active'
    assert reg['artifact_uri'].startswith('local://')
    assert reg['model_card_id'] == out['model_card_id']
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='model.promoted'").fetchone()


def test_promotion_versioning_archives_previous(client, db):
    sid, job1 = _trained_session(client)
    r1 = client.post(f'/api/training/jobs/{job1}/promote').get_json()

    job2 = client.post('/api/training/run', json={'sessionId': sid}).get_json()['jobId']
    wait_until(lambda: client.get(f'/api/training/jobs/{job2}').get_json().get('status') == 'done',
               timeout=30)
    r2 = client.post(f'/api/training/jobs/{job2}/promote').get_json()

    assert r2['model_version'] == 2
    old = client.get(f"/api/registry/models/{r1['registry_id']}").get_json()
    new = client.get(f"/api/registry/models/{r2['registry_id']}").get_json()
    assert old['status'] == 'archived'
    assert new['status'] == 'active'

    models = client.get(f'/api/registry/models?session_id={sid}').get_json()
    assert len(models) == 2


def test_repair_loop_exhausts_after_three_cycles(client, app_mod, db, monkeypatch):
    import training
    sid, job_id = _trained_session(client)
    monkeypatch.setattr(training, 'MAPE_THRESHOLD', 0.01)  # force gate failure

    r = client.post(f'/api/training/jobs/{job_id}/promote')
    assert r.status_code == 200
    out = r.get_json()
    assert out['status'] == 'failed'
    assert out['repair_cycles'] == 3
    assert out['human_required'] is True
    assert out['gates']['mape_gate']['status'] == 'FAIL'

    card = client.get(f"/api/model_cards/{out['model_card_id']}").get_json()
    assert card['status'] == 'rejected'
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='model.repair_exhausted'").fetchone()
    # no registry entry for failed promotion
    assert client.get(f'/api/registry/models?session_id={sid}').get_json() == []


def test_promotion_edge_cases(client):
    assert client.post('/api/training/jobs/9999/promote').status_code == 404
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    # job not done yet → 409 (create a queued row directly via API path impossible; use gold-less)
    r = client.post('/api/training/run', json={'sessionId': sid})
    assert r.status_code == 409  # no gold — sanity


def test_training_result_api(client):
    sid, job_id = _trained_session(client)
    r = client.get(f'/api/training/result/{sid}')
    assert r.status_code == 200
    res = r.get_json()
    assert res['status'] == 'done'
    assert res['metrics']['val_mape'] > 0
    assert res['links']['model_card'] == f"/api/model_cards/{res['model_card_id']}"
    assert res['links']['trials'] == f'/api/training/jobs/{job_id}/trials'
    assert res['links'].get('registry_model') is None  # not promoted yet

    client.post(f'/api/training/jobs/{job_id}/promote')
    res = client.get(f'/api/training/result/{sid}').get_json()
    assert res['links']['registry_model']

    assert client.get('/api/training/result/424242').status_code == 404
