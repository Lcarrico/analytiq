"""R38S2E1 — source-bound component queries (deep-dive F-01 groundwork).
Each connection materializes its own deterministic demo-warehouse tables
(seeded by connection identity — the zero-key adaptation of 'different
sources hold different data'); components compile to validated read-only
SQL against those tables, with a preview of shape/rows/hash/cost."""
import json

from conftest import wait_until


def _conn(client, account):
    return client.post('/api/connections',
                       json={'type': 'snowflake', 'account': account,
                             'username': 'u', 'password': 'p'}).get_json()


def test_source_tables_are_per_connection_and_differ(client, db):
    a = _conn(client, 'alpha')
    b = _conn(client, 'beta')
    for c in (a, b):
        n = db.execute(f"SELECT COUNT(*) c FROM src_{c['id']}_fact_revenue").fetchone()['c']
        assert n > 0
    sa = db.execute(f"SELECT ROUND(SUM(net_revenue),2) s FROM src_{a['id']}_fact_revenue").fetchone()['s']
    sb = db.execute(f"SELECT ROUND(SUM(net_revenue),2) s FROM src_{b['id']}_fact_revenue").fetchone()['s']
    assert sa != sb                     # different sources, different data

    # deterministic: the same connection identity always seeds the same data
    a2 = _conn(client, 'alpha')
    sa2 = db.execute(f"SELECT ROUND(SUM(net_revenue),2) s FROM src_{a2['id']}_fact_revenue").fetchone()['s']
    assert sa2 == sa


def test_component_query_compiles_validates_and_previews(client):
    conn = _conn(client, 'gamma')
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue',
                                             'connectionId': conn['id']}).get_json()['id']
    p = client.post('/api/sessions/plan',
                    json={'message': 'Forecast net revenue for the next 14 days'}).get_json()
    assert client.post(f'/api/sessions/{sid}/spec', json=p).status_code in (200, 201)

    r = client.post(f'/api/sessions/{sid}/component-query/preview',
                    json={'component_id': 'timeseries_ci'})
    assert r.status_code == 200
    d = r.get_json()
    sql = d['sql'].lower()
    assert sql.startswith('select') and f"src_{conn['id']}_fact_revenue" in sql
    assert d['row_shape'] and d['row_count'] > 0
    assert d['query_hash'] and len(d['query_hash']) == 64
    assert d['cost']['rows_scanned'] > 0
    # stable: same spec, same hash
    d2 = client.post(f'/api/sessions/{sid}/component-query/preview',
                     json={'component_id': 'timeseries_ci'}).get_json()
    assert d2['query_hash'] == d['query_hash']

    bad = client.post(f'/api/sessions/{sid}/component-query/preview',
                      json={'component_id': 'nope'})
    assert bad.status_code == 404


def _built_on(client, account):
    """plan → session bound to a fresh connection → confirm → run."""
    conn = _conn(client, account)
    p = client.post('/api/sessions/plan',
                    json={'message': 'Forecast net revenue for the next 14 days'}).get_json()
    sid = client.post('/api/sessions', json={'metric': p['target_metric'],
                                             'connectionId': conn['id']}).get_json()['id']
    assert client.post(f'/api/sessions/{sid}/spec', json=p).status_code in (200, 201)
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done',
               timeout=30)
    return conn['id'], sid, rid


def test_chart_data_is_source_bound(client, db):
    """Deep-dive F-01 kill: the run's chart rows derive from the session's
    SOURCE — two sources produce different, fixture-predicted values."""
    ca, sa, ra = _built_on(client, 'source-one')
    cb, sb, rb = _built_on(client, 'source-two')

    rows_a = db.execute('SELECT date, actual FROM chart_data WHERE pipeline_run_id=? '
                        'AND is_forecast=0 ORDER BY day_index', (ra,)).fetchall()
    rows_b = db.execute('SELECT date, actual FROM chart_data WHERE pipeline_run_id=? '
                        'AND is_forecast=0 ORDER BY day_index', (rb,)).fetchall()
    assert len(rows_a) == 76 and len(rows_b) == 76        # contract preserved
    assert [r['actual'] for r in rows_a] != [r['actual'] for r in rows_b]

    # binding proof: actuals equal the source's daily sums for those dates
    for r in (rows_a[0], rows_a[40], rows_a[75]):
        src = db.execute(f'SELECT ROUND(SUM(net_revenue), 2) s FROM src_{ca}_fact_revenue '
                         'WHERE day=?', (r['date'],)).fetchone()['s']
        assert abs(r['actual'] - src) < 0.01

    n_forecast = db.execute('SELECT COUNT(*) c FROM chart_data WHERE pipeline_run_id=? '
                            'AND is_forecast=1', (ra,)).fetchone()['c']
    assert n_forecast == 14


def test_component_data_persisted_per_component(client, db):
    cid, sid, rid = _built_on(client, 'source-three')
    rows = db.execute('SELECT component_id, query_hash, rows_json FROM component_data '
                      'WHERE run_id=?', (rid,)).fetchall()
    comp_ids = {r['component_id'] for r in rows}
    assert {'kpi_row', 'timeseries_ci', 'forecast', 'dimension_breakdown',
            'feature_importance'} <= comp_ids
    import json as _json
    for r in rows:
        assert len(r['query_hash']) == 64
        assert _json.loads(r['rows_json'])                # real result rows
