"""
Sprint 5 — Data Modeler Core
  F-021 Gold table DDL + INSERT-SELECT generation (dialect-aware, governance
        metadata, output_hash, dry_run vs execute)
  F-022 Temporal split configuration service (70/15/15 + walk-forward checks)
  F-023 Grain uniqueness & join fan-out validator
  F-024 Target leakage scan (DROP >0.7, HOLD 0.3–0.7)
  F-025 Gold table writer (materialization + dq gates + audit)
"""
import json

from conftest import wait_until


CUBE_SCHEMA = {'cubes': [
    {'name': 'fact_revenue',
     'sql_table': 'CORE.fact_revenue',
     'measures': [{'name': 'net_revenue', 'sql': 'net_revenue', 'aggregation': 'sum',
                   'ml_allowed': True, 'confidence': 'high'}],
     'dimensions': [{'name': 'day', 'sql': 'day', 'type': 'time', 'is_primary_date': True},
                    {'name': 'location_id', 'sql': 'location_id', 'type': 'number'}],
     'joins': [{'to': 'dim_location', 'on': 'location_id', 'join_type': 'inner'}]},
    {'name': 'dim_location',
     'sql_table': 'CORE.dim_location',
     'measures': [],
     'dimensions': [{'name': 'location_id', 'sql': 'location_id', 'type': 'number'},
                    {'name': 'tier', 'sql': 'tier', 'type': 'string'}],
     'joins': []},
]}

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


# ── F-021 SQL generation ─────────────────────────────────
def test_gold_sql_generation_shape_and_naming():
    import modeler
    out = modeler.generate_gold_sql(SPEC, CUBE_SCHEMA, workspace_id='default',
                                    session_id=7, version=1)
    assert out['table_name'] == 'analytics_default.gold_net_revenue_location_day_v1'
    assert out['ddl'].lstrip().startswith('--')          # governance comment block
    for token in ('manifest_version=1.0.0', 'semantic_layer_version=1.0.0',
                  'session_id=7', 'output_hash='):
        assert token in out['ddl']
    assert 'CREATE TABLE' in out['ddl']
    assert 'INSERT INTO' in out['insert_sql'] and 'SELECT' in out['insert_sql']
    assert 'JOIN' in out['insert_sql']                    # allowed join path used
    assert out['split_config']['train']['pct'] == 70
    assert out['output_hash'] and len(out['output_hash']) == 64


def test_gold_sql_uses_only_semantic_names_and_is_deterministic():
    import modeler
    a = modeler.generate_gold_sql(SPEC, CUBE_SCHEMA, session_id=7, version=1)
    b = modeler.generate_gold_sql(SPEC, CUBE_SCHEMA, session_id=7, version=1)
    assert a['output_hash'] == b['output_hash']
    assert a['ddl'] == b['ddl']

    spec2 = dict(SPEC, prediction_horizon=28)
    c = modeler.generate_gold_sql(spec2, CUBE_SCHEMA, session_id=7, version=1)
    assert c['output_hash'] != a['output_hash']

    # unknown feature names are rejected, never invented
    bad = dict(SPEC, feature_candidates=['net_revenue', 'made_up_column'])
    try:
        modeler.generate_gold_sql(bad, CUBE_SCHEMA, session_id=7, version=1)
        assert False, 'expected GoldGenerationError'
    except modeler.GoldGenerationError as e:
        assert 'made_up_column' in str(e)


# ── F-022 temporal splits ────────────────────────────────
def test_split_config_70_15_15_time_based():
    import splits
    cfg = splits.compute_split_config({'start': '2023-01-01', 'end': '2023-12-31'},
                                      row_count=12847, horizon=14)
    assert cfg['train']['pct'] == 70 and cfg['validation']['pct'] == 15 and cfg['test']['pct'] == 15
    assert cfg['train']['start'] == '2023-01-01'
    assert cfg['test']['end'] == '2023-12-31'
    # time-ordered, contiguous, non-overlapping
    assert cfg['train']['end'] < cfg['validation']['start']
    assert cfg['validation']['end'] < cfg['test']['start']
    assert cfg['walk_forward']['windows'] == 5
    assert cfg['walk_forward']['expanding'] is True
    assert splits.validate_split(cfg, row_count=12847, horizon=14)['status'] == 'PASS'


def test_split_validation_blocks_insufficient_data():
    import splits
    cfg = splits.compute_split_config({'start': '2023-01-01', 'end': '2023-12-31'},
                                      row_count=120, horizon=14)
    res = splits.validate_split(cfg, row_count=120, horizon=14)
    assert res['status'] == 'BLOCK'
    assert any('row' in r.lower() for r in res['remediation'])

    # test window shorter than horizon → not PASS
    cfg2 = splits.compute_split_config({'start': '2023-01-01', 'end': '2023-02-28'},
                                       row_count=5000, horizon=30)
    res2 = splits.validate_split(cfg2, row_count=5000, horizon=30)
    assert res2['status'] in ('WARN', 'BLOCK')


# ── F-023 grain + fan-out ────────────────────────────────
def test_grain_uniqueness_probe_on_real_table(db):
    import modeler
    db.execute('CREATE TABLE g1 (location_id INTEGER, day TEXT, v REAL)')
    db.executemany('INSERT INTO g1 VALUES (?,?,?)',
                   [(1, '2023-01-01', 1.0), (1, '2023-01-02', 2.0), (2, '2023-01-01', 3.0)])
    db.commit()
    res = modeler.validate_grain(db, 'g1', ['location_id', 'day'])
    assert res['status'] == 'PASS'

    db.execute("INSERT INTO g1 VALUES (1, '2023-01-01', 9.9)")  # duplicate key
    db.commit()
    res = modeler.validate_grain(db, 'g1', ['location_id', 'day'])
    assert res['status'] == 'BLOCK'
    assert res['offending_keys']
    assert res['remediation']


def test_fanout_detection_with_remediation():
    import modeler
    schema = json.loads(json.dumps(CUBE_SCHEMA))
    # join on a non-unique, non-id column → fan-out risk
    schema['cubes'][0]['joins'] = [{'to': 'dim_location', 'on': 'tier', 'join_type': 'inner'}]
    res = modeler.detect_fanout(schema, ['fact_revenue', 'dim_location'])
    assert res['status'] in ('WARN', 'BLOCK')
    assert res['findings']
    assert any('dedup' in r.lower() or 'bridge' in r.lower() or 'join' in r.lower()
               for r in res['remediation'])

    ok = modeler.detect_fanout(CUBE_SCHEMA, ['fact_revenue', 'dim_location'])
    assert ok['status'] == 'PASS'


# ── F-024 leakage scan ───────────────────────────────────
def test_leakage_scan_classification():
    import modeler
    res = modeler.scan_leakage(
        ['net_revenue', 'future_net_revenue', 'revenue_next_week', 'lag_7_net_revenue',
         'tier', 'day'],
        target_metric='Net Revenue', horizon=14)
    by_name = {r['feature']: r for r in res['features']}
    assert by_name['net_revenue']['action'] == 'DROP'            # target itself
    assert by_name['future_net_revenue']['action'] == 'DROP'     # future info
    assert by_name['revenue_next_week']['action'] in ('DROP', 'HOLD')
    assert by_name['lag_7_net_revenue']['action'] == 'PASS'      # lagged history ok
    assert by_name['tier']['action'] == 'PASS'
    assert res['dropped'] and 'net_revenue' in res['dropped']
    for r in res['features']:
        assert 0.0 <= r['risk'] <= 1.0


# ── F-025 writer endpoint (dry_run vs execute) ───────────
def _prepared_session(client):
    cid = client.post('/api/connections', json={
        'name': 'mdl', 'type': 'snowflake', 'account': 'a', 'username': 'u',
        'password': 'p'}).get_json()['id']
    run_id = client.post('/api/governance/run', json={'connectionId': cid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/governance/{run_id}').get_json().get('status') == 'done')
    wait_until(lambda: client.get(f'/api/integrations/{cid}/manifest').status_code == 200)
    client.post('/api/semantic/default/generate', json={'connectionId': cid})
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    spec = dict(SPEC)
    client.post(f'/api/sessions/{sid}/spec', json=spec)
    return sid


def test_modeler_dry_run_returns_sql_without_mutation(client, app_mod, db):
    sid = _prepared_session(client)
    r = client.post('/api/modeler/generate', json={'sessionId': sid, 'mode': 'dry_run'})
    assert r.status_code == 200
    out = r.get_json()
    assert out['mode'] == 'dry_run'
    assert 'CREATE TABLE' in out['ddl']
    assert out['dq_gates']['leakage']['dropped']          # target col auto-dropped
    assert out['split_config']['walk_forward']['windows'] == 5

    # nothing materialized, no gold record
    tables = {r_['name'] for r_ in db.execute(
        "SELECT name FROM sqlite_master WHERE type='table'").fetchall()}
    assert not any(t.startswith('analytics_') for t in tables)
    assert db.execute('SELECT COUNT(*) c FROM gold_tables').fetchone()['c'] == 0
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='modeler.dry_run'").fetchone()


def test_modeler_execute_materializes_gold_table(client, db):
    sid = _prepared_session(client)
    r = client.post('/api/modeler/generate', json={'sessionId': sid, 'mode': 'execute'})
    assert r.status_code == 201
    out = r.get_json()
    assert out['mode'] == 'execute'
    assert out['row_count'] >= 500
    assert out['dq_gates']['grain']['status'] == 'PASS'
    assert out['dq_gates']['row_tolerance']['status'] == 'PASS'

    # table exists with that many rows
    physical = out['physical_table']
    n = db.execute(f'SELECT COUNT(*) c FROM "{physical}"').fetchone()['c']
    assert n == out['row_count']

    # gold record persisted + retrievable
    lst = client.get(f'/api/modeler/gold/{sid}').get_json()
    assert len(lst) == 1
    assert lst[0]['status'] == 'written'
    assert lst[0]['output_hash'] == out['output_hash']
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='modeler.executed'").fetchone()

    # second execute bumps version
    r2 = client.post('/api/modeler/generate', json={'sessionId': sid, 'mode': 'execute'})
    assert '_v2' in r2.get_json()['table_name']


def test_modeler_requires_confirmed_spec(client):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    r = client.post('/api/modeler/generate', json={'sessionId': sid})
    assert r.status_code == 409
    assert 'spec' in r.get_json()['error'].lower()
    assert client.post('/api/modeler/generate', json={}).status_code == 400
