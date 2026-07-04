"""
R17S1E1-US1 — Per-component query & data contracts (arch §7.2/§7.3) +
workspace gold catalog. The substrate the Inspector Data tab, contracts
screens, and per-section CONTRACT badges consume.
"""
import json

from conftest import wait_until


def _run(client):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done',
               timeout=30)
    return sid, rid


def test_pipeline_persists_query_contracts(client, db):
    sid, rid = _run(client)
    rows = db.execute('SELECT * FROM query_contracts WHERE run_id=?', (rid,)).fetchall()
    comps = {r['component_id'] for r in rows}
    assert {'timeseries_ci', 'forecast', 'kpi_row'} <= comps
    ts = next(r for r in rows if r['component_id'] == 'timeseries_ci')
    assert 'SELECT' in ts['sql'] and str(rid) in ts['sql']
    assert ts['warehouse_dialect'] in ('sqlite', 'duckdb', 'snowflake')
    assert ts['status'] == 'executed'
    assert json.loads(ts['expected_columns_json'])
    assert ts['row_limit'] == 10000                     # chart component cap (§7.1)


def test_pipeline_persists_data_contracts_with_real_stats(client, db):
    sid, rid = _run(client)
    rows = db.execute('SELECT * FROM component_data_contracts WHERE run_id=?', (rid,)).fetchall()
    by = {r['component_id']: r for r in rows}
    assert by['timeseries_ci']['row_count'] == 76
    assert by['forecast']['row_count'] == 14
    assert by['timeseries_ci']['empty_result'] == 0
    cols = json.loads(by['timeseries_ci']['actual_columns_json'])
    names = {c['name'] for c in cols}
    assert {'actual', 'predicted'} <= names
    ranges = json.loads(by['timeseries_ci']['numeric_ranges_json'])
    assert ranges['actual']['min'] <= ranges['actual']['max']


def test_contracts_endpoint(client, db):
    sid, rid = _run(client)
    r = client.get(f'/api/pipeline/{rid}/contracts')
    assert r.status_code == 200
    body = r.get_json()
    assert len(body['query_contracts']) >= 3
    assert len(body['data_contracts']) >= 3
    assert client.get('/api/pipeline/999999/contracts').status_code == 404


def test_gold_catalog_is_workspace_wide(client, db):
    sid1, rid1 = _run(client)
    sid2, rid2 = _run(client)
    r = client.get('/api/gold/catalog')
    assert r.status_code == 200
    rows = r.get_json()['tables']
    runs = {t['run_id'] for t in rows}
    assert {rid1, rid2} <= runs
    t = next(t for t in rows if t['run_id'] == rid1 and t['table'] == 'gold_predictions')
    assert t['row_count'] == 76
    assert t['gate_status'] in ('PASS', 'pass')
