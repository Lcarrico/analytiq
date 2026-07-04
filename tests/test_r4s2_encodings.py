"""
R4S2E2-US1 — Encoding strategies, robust imputation, collinearity selection
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


def _gold_session(client):
    cid = client.post('/api/connections', json={
        'type': 'snowflake', 'name': 'enc', 'account': 'a', 'username': 'u',
        'password': 'p'}).get_json()['id']
    before = len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json() or [])
    client.post('/api/governance/run', json={'connectionId': cid})
    wait_until(lambda: len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json()
                           or []) > before)
    client.post('/api/semantic/default/generate', json={'connectionId': cid})
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    client.post(f'/api/sessions/{sid}/spec', json=dict(SPEC))
    return sid, client.post('/api/modeler/generate',
                            json={'sessionId': sid, 'mode': 'execute'}).get_json()


def test_unit_encoders_and_imputation():
    import feature_engineering as fe
    oh = fe.one_hot(['gold', 'silver', 'gold', None], 'tier')
    assert oh['tier_gold'] == [1, 0, 1, 0]
    assert oh['tier_silver'] == [0, 1, 0, 0]

    freq = fe.frequency_encode(['a', 'a', 'b', None])
    assert freq[0] == freq[1] > freq[2]
    assert freq[3] is None

    filled, n = fe.impute_measure([10, None, 30, None, 50])
    assert n == 2 and None not in filled

    drops, report = fe.collinear_drops(
        {'x': [1, 2, 3, 4, 5], 'x_copy': [2, 4, 6, 8, 10], 'y': [5, 1, 4, 2, 3]},
        target=[1, 2, 3, 4, 5])
    assert len(drops) == 1 and drops[0] in ('x', 'x_copy')
    assert report[drops[0]]['r'] > 0.95


def test_enrichment_applies_encoding_imputation_selection(client, db):
    sid, gold = _gold_session(client)
    out = client.post('/api/modeler/enrich', json={'sessionId': sid}).get_json()
    dec = out['engineering_decisions']

    # one-hot for low-cardinality tier
    assert dec['encodings']['tier'] == 'one_hot'
    cols = {c[1] for c in db.execute(
        f'PRAGMA table_info("{gold["physical_table"]}")').fetchall()}
    assert {'tier_gold', 'tier_silver', 'tier_bronze'} <= cols

    # imputation ran on the lag columns' leading NULLs (28 days × 8 locations)
    assert dec['imputation']['lag_28_target'] == 224
    remaining = db.execute(f'SELECT COUNT(*) FROM "{gold["physical_table"]}" '
                           f'WHERE lag_28_target IS NULL').fetchone()[0]
    assert remaining == 0

    # collinearity + cap decisions recorded
    assert isinstance(dec['collinearity']['dropped'], list)
    assert dec['feature_count'] <= 200

    fm = client.get(f'/api/feature_manifests?session_id={sid}').get_json()[0]
    assert fm['enrichment_status'] == 'enriched'
    assert any(f['name'] == 'tier_gold' for f in fm['feature_list'])
