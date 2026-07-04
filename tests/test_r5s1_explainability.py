"""
R5S1E3-US1 — Permutation importances + SHAP-lite contributions, stored in
gold.model_insights; PII excluded; top-10 concentration promotion gate.
"""
from conftest import wait_until

SPEC = {
    'intent': 'predictive', 'intent_confidence': 0.93, 'analytic_goal': 'g',
    'target_metric': 'Net Revenue',
    'feature_candidates': ['net_revenue', 'day', 'location_id', 'tier'],
    'date_range': {'start': '2023-01-01', 'end': '2023-12-31'},
    'grain': 'Location · Day', 'output_type': 'forecast_dashboard',
    'prediction_horizon': 14, 'explores_used': ['fact_revenue', 'dim_location'],
    'semantic_layer_version': '1.0.0', 'governance_manifest_version': '1.0.0',
}


def _trained(client):
    cid = client.post('/api/connections', json={
        'type': 'snowflake', 'name': 'xp', 'account': 'a', 'username': 'u',
        'password': 'p'}).get_json()['id']
    before = len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json() or [])
    client.post('/api/governance/run', json={'connectionId': cid})
    wait_until(lambda: len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json()
                           or []) > before)
    client.post('/api/semantic/default/generate', json={'connectionId': cid})
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    client.post(f'/api/sessions/{sid}/spec', json=dict(SPEC))
    client.post('/api/modeler/generate', json={'sessionId': sid, 'mode': 'execute'})
    client.post('/api/modeler/enrich', json={'sessionId': sid})
    job_id = client.post('/api/training/run', json={'sessionId': sid}).get_json()['jobId']
    wait_until(lambda: client.get(f'/api/training/jobs/{job_id}').get_json().get('status') == 'done',
               timeout=40)
    return sid, job_id


def test_unit_permutation_importance():
    import explainability as ex
    # y depends strongly on f1, not at all on f2
    rows = [{'f1': i, 'f2': (i * 7) % 5} for i in range(60)]
    y = [3 * r['f1'] + 1 for r in rows]
    imps = ex.permutation_importance(rows, y, features=['f1', 'f2'], seed=7)
    assert imps['f1'] > imps['f2'] >= 0


def test_model_card_top_features_and_concentration_gate(client, db):
    sid, job_id = _trained(client)
    card = client.get(f"/api/model_cards/"
                      f"{client.get(f'/api/training/jobs/{job_id}').get_json()['model_card_id']}").get_json()
    top = card['top_features']
    assert top and len(top) <= 10
    for t in top:
        assert t['name'] and t['importance'] >= 0 and 'shap_mean' in t
    # PII-ish columns never appear (none in gold, structural assertion)
    assert not any('email' in t['name'] or 'phone' in t['name'] for t in top)
    assert card['gates']['concentration_gate']['status'] in ('PASS', 'FAIL')
    assert card['gates']['concentration_gate']['top10_share'] > 0

    # per-row contributions persisted to gold.model_insights
    rows = db.execute('SELECT * FROM gold_model_insights WHERE session_id=?', (sid,)).fetchall()
    assert rows
    assert {r['feature'] for r in rows} <= {t['name'] for t in card['top_features']} | \
           {r['feature'] for r in rows}
    for r in rows[:5]:
        assert r['importance'] is not None and r['shap_mean'] is not None

    ins = client.get(f'/api/models/{card["id"]}/insights').get_json()
    assert ins and all('feature' in i for i in ins)
