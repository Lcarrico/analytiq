"""
R4S2E1-US1 — Automatic temporal feature generation + holiday calendars
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
        'type': 'snowflake', 'name': 'fe', 'account': 'a', 'username': 'u',
        'password': 'p'}).get_json()['id']
    before = len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json() or [])
    client.post('/api/governance/run', json={'connectionId': cid})
    wait_until(lambda: len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json()
                           or []) > before)
    client.post('/api/semantic/default/generate', json={'connectionId': cid})
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    client.post(f'/api/sessions/{sid}/spec', json=dict(SPEC))
    client.post('/api/modeler/generate', json={'sessionId': sid, 'mode': 'execute'})
    return sid


def test_holiday_calendar():
    import feature_engineering as fe
    assert fe.is_holiday('2023-07-04') is True     # Independence Day
    assert fe.is_holiday('2023-12-25') is True
    assert fe.is_holiday('2023-03-15') is False
    assert fe.is_holiday('2023-03-15', extra={'2023-03-15'}) is True


def test_enrichment_adds_temporal_features(client, db):
    sid = _gold_session(client)
    r = client.post('/api/modeler/enrich', json={'sessionId': sid})
    assert r.status_code == 201
    out = r.get_json()
    added = set(out['added_features'])
    for f in ('lag_1_target', 'lag_7_target', 'lag_28_target',
              'rolling_mean_7_target', 'rolling_std_7_target', 'streak_up', 'is_holiday'):
        assert f in added, f

    physical = out['physical_table']
    cols = {c[1] for c in db.execute(f'PRAGMA table_info("{physical}")').fetchall()}
    assert 'lag_7_target' in cols and 'is_holiday' in cols

    # lag correctness: lag_1 of day N equals target of day N-1 (same location)
    rows = db.execute(f'SELECT day, lag_1_target, target_net_revenue FROM "{physical}" '
                      f'WHERE location_id=1 ORDER BY day LIMIT 3').fetchall()
    assert rows[1]['lag_1_target'] == rows[0]['target_net_revenue']
    assert rows[0]['lag_1_target'] is not None   # leading gap imputed (R4S2E2)

    # July 4 flagged
    h = db.execute(f'SELECT is_holiday FROM "{physical}" WHERE day=\'2023-07-04\' '
                   f'AND location_id=1').fetchone()[0]
    assert h == 1

    # enriched feature manifest version bumped (minor) + transformations recorded
    fms = client.get(f'/api/feature_manifests?session_id={sid}').get_json()
    latest = fms[0]
    assert latest['enrichment_status'] == 'enriched'
    assert latest['manifest_version'] == '1.1.0'
    lagf = next(f for f in latest['feature_list'] if f['name'] == 'lag_7_target')
    assert lagf['transformations']


def test_custom_holiday_calendar_used(client, db):
    r = client.post('/api/calendars', json={'name': 'company days',
                                            'dates': ['2023-03-15']})
    assert r.status_code == 201
    assert client.post('/api/calendars', json={'name': 'bad', 'dates': ['15/03/2023']}).status_code == 400

    sid = _gold_session(client)
    out = client.post('/api/modeler/enrich', json={'sessionId': sid}).get_json()
    h = db.execute(f'SELECT is_holiday FROM "{out["physical_table"]}" '
                   f"WHERE day='2023-03-15' AND location_id=1").fetchone()[0]
    assert h == 1

    assert client.post('/api/modeler/enrich', json={'sessionId': 9999}).status_code == 409
