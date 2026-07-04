"""
R11S1E2-US1 — Confidence Propagation (Architecture v2.1 §17.5.2)

Every artifact carries a confidence score inherited from its upstream stages
via a documented deterministic combination (weighted minimum over intent,
feature-leakage, and model-validation confidences). Low confidence is a
flagged-but-rendered state — never an error.
"""
import json

from conftest import wait_until


def _artifact(client, intent_confidence=None, metric='Net Revenue'):
    sid = client.post('/api/sessions', json={'metric': metric}).get_json()['id']
    if intent_confidence is not None:
        client.post(f'/api/sessions/{sid}/spec', json={
            'intent': 'predictive', 'intent_confidence': intent_confidence,
            'analytic_goal': 'g', 'target_metric': metric, 'feature_candidates': [],
            'date_range': {'start': '2023-01-01', 'end': '2023-12-31'},
            'grain': 'Location · Day', 'output_type': 'forecast_dashboard',
            'prediction_horizon': 14, 'explores_used': [],
            'semantic_layer_version': '1.0.0', 'governance_manifest_version': '1.0.0'})
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done',
               timeout=30)
    art = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'Conf'}).get_json()
    return sid, rid, art


def test_weighted_minimum_combination(db, client):
    sid, rid, art = _artifact(client, intent_confidence=0.9)
    db.execute("INSERT INTO feature_manifests (session_id, gold_table_name, manifest_version, "
               "feature_list_json) VALUES (?, 'g', '1.1.0', ?)",
               (sid, json.dumps([{'name': 'lag_7', 'leakage_risk': 0.2},
                                 {'name': 'promo_flag', 'leakage_risk': 0.4}])))
    db.commit()
    import confidence as cf
    out = cf.propagate(db, sid, rid)
    assert out['method'].startswith('weighted_minimum')
    assert out['stages']['intent'] == 0.9
    assert out['stages']['features'] == 0.6          # 1 - max(leakage_risk)
    assert out['stages']['model'] == round(1 - 8.9 / 50, 3)   # MAPE mapped to [0,1]
    assert out['confidence'] == 0.6                  # the weighted minimum


def test_artifact_persists_confidence_with_defaults(client, db):
    sid, rid, art = _artifact(client)                # no spec → default intent prior
    row = db.execute('SELECT confidence, confidence_json FROM artifacts WHERE id=?',
                     (art['id'],)).fetchone()
    assert row['confidence'] is not None
    stages = json.loads(row['confidence_json'])['stages']
    assert {'intent', 'features', 'model'} <= set(stages)
    assert row['confidence'] == min(stages.values())


def test_low_confidence_is_flagged_not_failed(client, db):
    sid, rid, art = _artifact(client, intent_confidence=0.55)
    got = client.get(f"/api/artifacts/{art['id']}").get_json()
    assert got['confidence'] == 0.55
    assert got['confidence_level'] == 'low'          # flagged
    assert got['dq_status'] == 'pass'                # distinct from error/DQ state
    sid2, rid2, art2 = _artifact(client, intent_confidence=0.95)
    got2 = client.get(f"/api/artifacts/{art2['id']}").get_json()
    assert got2['confidence_level'] == 'normal'


def test_explain_includes_confidence_breakdown(client, db):
    sid, rid, art = _artifact(client, intent_confidence=0.8)
    body = client.get(f"/api/artifacts/{art['id']}/explain").get_json()
    assert body['confidence']['confidence'] == 0.8
    assert body['confidence']['method'].startswith('weighted_minimum')
    assert set(body['confidence']['stages']) == {'intent', 'features', 'model'}


def test_identical_inputs_identical_confidence(client, db):
    _, _, a1 = _artifact(client, intent_confidence=0.8, metric='Det A')
    _, _, a2 = _artifact(client, intent_confidence=0.8, metric='Det A')
    c1 = client.get(f"/api/artifacts/{a1['id']}").get_json()['confidence']
    c2 = client.get(f"/api/artifacts/{a2['id']}").get_json()['confidence']
    assert c1 == c2
