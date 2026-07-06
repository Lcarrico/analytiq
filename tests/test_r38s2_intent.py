"""R38S2E2-US1 — intent-shaped composition (deep-dive F-03): descriptive
asks produce no model/forecast; the fixed template + forced horizon die."""
import json

from conftest import wait_until

DESC_ASK = 'Show the net revenue trend across locations'   # 2 descriptive hits → confident
PRED_ASK = 'Forecast net revenue for the next 14 days'


def _flow(client, message):
    p = client.post('/api/sessions/plan', json={'message': message}).get_json()
    assert not p.get('needs_clarification'), p
    sid = client.post('/api/sessions',
                      json={'metric': p['target_metric'],
                            'horizon': p.get('prediction_horizon')}).get_json()['id']
    assert client.post(f'/api/sessions/{sid}/spec', json=p).status_code in (200, 201)
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done',
               timeout=30)
    return p, sid, rid


def test_descriptive_ask_produces_no_model_or_forecast(client, db):
    p, sid, rid = _flow(client, DESC_ASK)
    assert p['intent'] == 'descriptive'
    assert p.get('prediction_horizon') is None          # no forced 14

    spec = client.get(f'/api/sessions/{sid}/dashboard-spec').get_json()['spec']
    assert spec['analysis']['intent'] == 'descriptive'
    types = {c['type'] for c in spec['components']}
    ids = {c['id'] for c in spec['components']}
    assert 'area' not in types and 'forecast' not in ids
    assert 'feature_importance' not in ids

    # the model nodes are honestly skipped, not silently trained
    nodes = {r['node_key']: r['status'] for r in db.execute(
        'SELECT node_key, status FROM dag_nodes WHERE run_id=?', (rid,)).fetchall()}
    assert nodes.get('model_train') == 'skipped'
    assert nodes.get('walk_forward') == 'skipped'

    # saved layout carries only the descriptive sections
    art = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'D'}).get_json()
    sections = [s['id'] for s in json.loads(art['layout_json'])['sections']]
    assert 'forecast' not in sections and 'feature_importance' not in sections
    assert 'timeseries_ci' in sections and 'dimension_breakdown' in sections


def test_predictive_ask_keeps_model_and_forecast(client, db):
    p, sid, rid = _flow(client, PRED_ASK)
    assert p['intent'] == 'predictive'
    spec = client.get(f'/api/sessions/{sid}/dashboard-spec').get_json()['spec']
    ids = {c['id'] for c in spec['components']}
    assert {'forecast', 'feature_importance'} <= ids
    nodes = {r['node_key']: r['status'] for r in db.execute(
        'SELECT node_key, status FROM dag_nodes WHERE run_id=?', (rid,)).fetchall()}
    assert nodes.get('model_train') == 'done'
    art = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'P'}).get_json()
    sections = [s['id'] for s in json.loads(art['layout_json'])['sections']]
    assert {'timeseries_ci', 'dimension_breakdown', 'forecast',
            'feature_importance'} <= set(sections)
