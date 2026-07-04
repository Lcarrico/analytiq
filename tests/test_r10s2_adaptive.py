"""
R10S2E4-US1 — Adaptive Planning Agent (Architecture v2.1 §17.2.6)

The clarification threshold conditions on the requesting user's demonstrated
expertise (User Intent History Graph) instead of a fixed 0.85 constant —
which remains the preserved baseline default.
"""
import json


AMBIGUOUS = 'How is net revenue trending lately'   # conf 0.8: expert-only band
CONFIDENT = 'Forecast net revenue for the next 14 days by location'


def _build_history(client, n=12):
    for i in range(n):
        client.post('/api/sessions/plan',
                    json={'message': f'Forecast net revenue for the next {i + 2} days by location'})


def test_threshold_endpoint_reports_default_and_mode(client):
    r = client.get('/api/planner/threshold')
    assert r.status_code == 200
    body = r.get_json()
    assert body['base'] == 0.85                       # default preserved
    assert body['mode'] == 'novice'                   # brand-new user
    assert body['effective'] > body['base']           # novices clarify more


def test_workspace_threshold_is_tunable_and_validated(client):
    assert client.put('/api/platform/planner_threshold', json={'threshold': 1.5}).status_code == 400
    r = client.put('/api/platform/planner_threshold', json={'threshold': 0.7})
    assert r.status_code == 200
    assert client.get('/api/planner/threshold').get_json()['base'] == 0.7
    client.put('/api/platform/planner_threshold', json={'threshold': 0.85})
    assert client.put('/api/platform/planner_threshold', json={'threshold': 0.7},
                      headers={'X-User-Role': 'viewer'}).status_code == 403


def test_expert_skips_redundant_clarification_with_assumptions(client, db):
    _build_history(client)                            # long, consistent history
    r = client.get('/api/planner/threshold').get_json()
    assert r['mode'] == 'expert'
    assert r['effective'] < r['base']

    plan = client.post('/api/sessions/plan', json={'message': AMBIGUOUS}).get_json()
    assert not plan.get('needs_clarification')        # proceeds at expert threshold
    assert plan.get('planner_mode') == 'expert'
    assert plan.get('assumptions')                    # defaults surfaced inline
    assert any('grain' in a.lower() for a in plan['assumptions'])


def test_novice_gets_clarifying_question_for_same_message(client, db):
    plan = client.post('/api/sessions/plan', json={'message': AMBIGUOUS}).get_json()
    assert plan.get('needs_clarification') is True    # same message, new user
    assert plan.get('planner_mode') == 'novice'


def test_confident_message_passes_for_everyone(client, db):
    plan = client.post('/api/sessions/plan', json={'message': CONFIDENT}).get_json()
    assert not plan.get('needs_clarification')        # explicit intent needs no history
