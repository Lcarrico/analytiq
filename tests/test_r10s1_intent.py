"""
R10S1E3-US1 — User Intent History Graph (Architecture v2.1 §17.3.5)

Per-user investigation sequences (question → spec → artifact) recorded so a
new session can warm-start with likely intent categories — without ever
pre-committing a plan.
"""
from conftest import wait_until


def _spec(client, sid, metric='Net Revenue'):
    return client.post(f'/api/sessions/{sid}/spec', json={
        'intent': 'predictive', 'intent_confidence': 0.9, 'analytic_goal': 'g',
        'target_metric': metric, 'feature_candidates': [],
        'date_range': {'start': '2023-01-01', 'end': '2023-12-31'},
        'grain': 'Location · Day', 'output_type': 'forecast_dashboard',
        'prediction_horizon': 14, 'explores_used': [],
        'semantic_layer_version': '1.0.0', 'governance_manifest_version': '1.0.0'})


def test_investigation_chain_is_recorded(client, db):
    client.post('/api/sessions/plan',
                json={'message': 'Forecast net revenue for the next 14 days by location'})
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    _spec(client, sid)
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done',
               timeout=30)
    art = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'IH Art'}).get_json()

    kinds = [r['step_kind'] for r in db.execute(
        'SELECT * FROM intent_history ORDER BY id').fetchall()]
    assert 'question' in kinds and 'spec' in kinds and 'artifact' in kinds
    assert kinds.index('question') < kinds.index('spec') < kinds.index('artifact')
    art_row = db.execute("SELECT * FROM intent_history WHERE step_kind='artifact' "
                         'ORDER BY id DESC LIMIT 1').fetchone()
    assert art_row['session_id'] == sid


def test_warm_start_ranks_likely_intents(client, db):
    client.post('/api/sessions/plan',
                json={'message': 'Forecast net revenue for the next 14 days by location'})
    client.post('/api/sessions/plan',
                json={'message': 'Forecast average ticket for the next 30 days by store'})
    client.post('/api/sessions/plan', json={'message': 'Show current revenue by region'})

    r = client.get('/api/sessions/warm_start')
    assert r.status_code == 200
    hints = r.get_json()
    assert hints['has_history'] is True
    intents = hints['likely_intents']
    assert intents[0]['intent'] == 'predictive' and intents[0]['count'] >= 2
    assert 'net_revenue' in hints['recent_metrics'] or 'Net Revenue' in hints['recent_metrics']


def test_warm_start_never_precommits_a_plan(client, db):
    client.post('/api/sessions/plan',
                json={'message': 'Forecast net revenue for the next 14 days by location'})
    r = client.get('/api/sessions/warm_start')
    assert r.status_code == 200                      # guard against vacuous pass
    hints = r.get_json()
    assert hints['has_history'] is True
    forbidden = {'grain', 'dashboard_plan', 'sections', 'session_spec', 'output_type'}
    assert forbidden.isdisjoint(hints.keys())


def test_brand_new_user_gets_no_hints(client, db):
    r = client.get('/api/sessions/warm_start')
    assert r.status_code == 200
    hints = r.get_json()
    assert hints['has_history'] is False
    assert hints['likely_intents'] == [] and hints['recent_metrics'] == []
