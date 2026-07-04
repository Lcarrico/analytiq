"""
Sprint 4 — Session Planning & Data Selection UX
  F-016 Session planner agent (intent classification → session_spec,
        clarifying question when confidence < 0.85, server-side validation)
  F-017 Session spec persistence (immutable versions, idempotency, RBAC)
"""
import json

from conftest import wait_until


def _mk_connection(client):
    return client.post('/api/connections', json={
        'name': 'plan-test', 'type': 'snowflake', 'account': 'acct',
        'username': 'u', 'password': 'p'}).get_json()['id']


def _run_governance(client, cid):
    run_id = client.post('/api/governance/run', json={'connectionId': cid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/governance/{run_id}').get_json().get('status') == 'done')
    wait_until(lambda: client.get(f'/api/integrations/{cid}/manifest').status_code == 200)
    return run_id


# ── F-016 planner unit level ─────────────────────────────
def test_intent_classification():
    import planner
    cases = {
        'Predict net revenue for the next 14 days': 'predictive',
        'Forecast weekly sessions by location': 'predictive',
        'Why did conversion rate drop last month?': 'diagnostic',
        'What were total sales by region last quarter?': 'descriptive',
        'How should we allocate inventory to maximize revenue?': 'prescriptive',
    }
    for text, expected in cases.items():
        intent, conf = planner.classify_intent(text)
        assert intent == expected, f'{text!r} → {intent}, expected {expected}'
        assert 0.0 <= conf <= 1.0


def test_plan_session_produces_valid_spec():
    import planner
    schema = {'cubes': [
        {'name': 'fact_revenue',
         'measures': [{'name': 'net_revenue', 'ml_allowed': True, 'confidence': 'high'}],
         'dimensions': [{'name': 'day', 'type': 'time'}, {'name': 'location_id', 'type': 'number'}]},
    ], 'notes': []}
    manifest = {'manifest_version': '1.2.0',
                'definitions': [{'type': 'Metric', 'name': 'Net Revenue', 'confidence': 0.95}]}
    spec = planner.plan_session('Predict net revenue for the next 14 days by location',
                                semantic_schema=schema, schema_version='2.1.0',
                                manifest=manifest)
    assert not spec.get('needs_clarification')
    assert spec['intent'] == 'predictive'
    assert spec['intent_confidence'] >= 0.85
    assert spec['target_metric'] == 'Net Revenue'
    assert spec['prediction_horizon'] == 14
    assert 'Location' in spec['grain']
    assert spec['semantic_layer_version'] == '2.1.0'
    assert spec['governance_manifest_version'] == '1.2.0'
    assert spec['output_type'] == 'forecast_dashboard'
    assert 'net_revenue' in spec['feature_candidates']
    assert 'fact_revenue' in spec['explores_used']
    assert planner.validate_session_spec(spec) == []


def test_ambiguous_utterance_yields_single_clarifying_question():
    import planner
    res = planner.plan_session('revenue?', semantic_schema=None, manifest=None)
    assert res['needs_clarification'] is True
    assert res['question']
    assert 3 <= len(res['options']) <= 5
    assert 'target_metric' not in res


def test_session_spec_validator_structured_errors():
    import planner
    bad = {'intent': 'psychic', 'intent_confidence': 2, 'prediction_horizon': -3}
    errs = planner.validate_session_spec(bad)
    codes = {e['code'] for e in errs}
    assert 'invalid_intent' in codes
    assert 'missing_field' in codes            # target_metric etc.
    assert 'invalid_horizon' in codes
    assert 'invalid_confidence' in codes


# ── F-016 endpoint ───────────────────────────────────────
def test_plan_endpoint_uses_authoritative_versions(client):
    cid = _mk_connection(client)
    _run_governance(client, cid)
    gen = client.post('/api/semantic/default/generate', json={'connectionId': cid}).get_json()

    r = client.post('/api/sessions/plan', json={
        'message': 'Predict net revenue for the next 14 days by location',
        'connectionId': cid})
    assert r.status_code == 200
    spec = r.get_json()
    assert spec['intent'] == 'predictive'
    assert spec['semantic_layer_version'] == gen['version']
    assert spec['governance_manifest_version'] == '1.0.0'

    assert client.post('/api/sessions/plan', json={}).status_code == 400

    # ambiguous → clarification payload, not a spec
    r = client.post('/api/sessions/plan', json={'message': 'revenue?', 'connectionId': cid})
    assert r.status_code == 200
    assert r.get_json()['needs_clarification'] is True


# ── F-017 spec persistence ───────────────────────────────
def _valid_spec():
    return {
        'intent': 'predictive', 'intent_confidence': 0.93,
        'analytic_goal': 'Predict net revenue for the next 14 days by location',
        'target_metric': 'Net Revenue', 'feature_candidates': ['net_revenue'],
        'date_range': {'start': '2023-01-01', 'end': '2023-12-31'},
        'grain': 'Location · Day', 'output_type': 'forecast_dashboard',
        'prediction_horizon': 14, 'explores_used': ['fact_revenue'],
        'semantic_layer_version': '1.0.0', 'governance_manifest_version': '1.0.0',
    }


def test_spec_persist_immutable_versions_and_idempotency(client, db):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    spec = _valid_spec()

    r = client.post(f'/api/sessions/{sid}/spec', json=spec,
                    headers={'Idempotency-Key': 'k-1'})
    assert r.status_code == 201
    assert r.get_json()['spec_version'] == 1

    # identical replay with same key → 200, same version, no new row
    r = client.post(f'/api/sessions/{sid}/spec', json=spec,
                    headers={'Idempotency-Key': 'k-1'})
    assert r.status_code == 200
    assert r.get_json()['spec_version'] == 1
    assert db.execute('SELECT COUNT(*) c FROM session_specs WHERE session_id=?',
                      (sid,)).fetchone()['c'] == 1

    # changed payload → forked new version, prior version retained
    spec2 = dict(spec, prediction_horizon=28)
    r = client.post(f'/api/sessions/{sid}/spec', json=spec2)
    assert r.status_code == 201
    assert r.get_json()['spec_version'] == 2

    latest = client.get(f'/api/sessions/{sid}/spec').get_json()
    assert latest['spec_version'] == 2
    assert latest['spec']['prediction_horizon'] == 28
    v1 = client.get(f'/api/sessions/{sid}/spec?version=1').get_json()
    assert v1['spec']['prediction_horizon'] == 14  # immutable history

    assert db.execute("SELECT 1 FROM audit_logs WHERE action='session.spec_confirmed'").fetchone()


def test_spec_persist_validation_and_rbac(client):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']

    r = client.post(f'/api/sessions/{sid}/spec', json={'intent': 'predictive'})
    assert r.status_code == 400
    assert r.get_json()['errors']

    r = client.post(f'/api/sessions/{sid}/spec', json=_valid_spec(),
                    headers={'X-User-Role': 'viewer'})
    assert r.status_code == 403

    assert client.post('/api/sessions/99999/spec', json=_valid_spec()).status_code == 404
    assert client.get(f'/api/sessions/{sid}/spec').status_code == 404  # none yet
