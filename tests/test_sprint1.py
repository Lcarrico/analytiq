"""
Sprint 1 — Integration & Ingestion APIs
Covers (Flask/SQLite equivalents of the spec):
  F-001 Connector registration: input validation, encrypted credential storage,
        masked responses, RBAC (admin-only create/delete), audit trail
  F-002 Warehouse interface abstraction (dialect-aware, parameterized SQL)
  F-005 Ingestion profiling job framework (sample + column profiling,
        semantic type heuristics, confidence)
"""
import json
import threading

import pytest
from conftest import wait_until


SNOWFLAKE_BODY = {
    'name': 'ACME Snowflake', 'type': 'snowflake', 'account': 'xyz.snowflakecomputing.com',
    'username': 'analytics_user', 'password': 'hunter2-secret',
    'warehouse': 'COMPUTE_WH', 'database_name': 'ANALYTICS_DB', 'schema_name': 'PUBLIC',
}


# ── F-001: validation ────────────────────────────────────
def test_create_connection_rejects_missing_required_fields(client):
    r = client.post('/api/connections', json={'type': 'snowflake', 'name': 'x'})
    assert r.status_code == 400
    body = r.get_json()
    assert body['error'] == 'Validation failed'
    for f in ('account', 'username', 'password'):
        assert f in body['fields']

    r = client.post('/api/connections', json={'type': 'postgres', 'host': 'db.example.com'})
    assert r.status_code == 400
    fields = r.get_json()['fields']
    for f in ('database_name', 'username', 'password'):
        assert f in fields

    r = client.post('/api/connections', json={'type': 'bigquery'})
    assert r.status_code == 400
    fields = r.get_json()['fields']
    for f in ('project_id', 'credentials_json'):
        assert f in fields


def test_create_connection_rejects_unknown_type(client):
    r = client.post('/api/connections', json={'type': 'oracle', 'name': 'x'})
    assert r.status_code == 400
    assert 'type' in r.get_json()['fields']


# ── F-001/F-003: encrypted at rest, masked in responses ──
def test_credentials_encrypted_at_rest_and_masked_in_api(client, db, app_mod):
    r = client.post('/api/connections', json=SNOWFLAKE_BODY)
    assert r.status_code == 201
    created = r.get_json()
    cid = created['id']

    # masked in create response
    assert created['password'] == app_mod.MASKED_PASSWORD
    assert 'hunter2' not in json.dumps(created)

    # encrypted at rest (never plaintext in DB)
    row = db.execute('SELECT username, password FROM connections WHERE id=?', (cid,)).fetchone()
    assert row['password'] != 'hunter2-secret'
    assert 'hunter2' not in (row['password'] or '')
    assert app_mod.decrypt(row['password']) == 'hunter2-secret'
    assert app_mod.decrypt(row['username']) == 'analytics_user'

    # masked in list + detail responses too
    for payload in (client.get('/api/connections').get_json(),
                    [client.get(f'/api/connections/{cid}').get_json()]):
        assert 'hunter2' not in json.dumps(payload)


# ── F-001: RBAC (server-side, X-User-Role) ───────────────
def test_rbac_non_admin_cannot_create_or_delete(client):
    r = client.post('/api/connections', json=SNOWFLAKE_BODY, headers={'X-User-Role': 'Viewer'})
    assert r.status_code == 403
    assert r.get_json()['required_role'] == 'admin'

    # admin creates one
    r = client.post('/api/connections', json=SNOWFLAKE_BODY, headers={'X-User-Role': 'Admin'})
    assert r.status_code == 201
    cid = r.get_json()['id']

    r = client.delete(f'/api/connections/{cid}', headers={'X-User-Role': 'analyst'})
    assert r.status_code == 403
    # still there
    assert client.get(f'/api/connections/{cid}').status_code == 200
    # admin delete works
    assert client.delete(f'/api/connections/{cid}', headers={'X-User-Role': 'admin'}).status_code == 204


def test_registration_audit_logged_with_outcome(client, db):
    client.post('/api/connections', json=SNOWFLAKE_BODY)
    rows = db.execute("SELECT * FROM audit_logs WHERE action='connection.created'").fetchall()
    assert len(rows) == 1
    meta = json.loads(rows[0]['metadata'])
    assert meta['type'] == 'snowflake'
    assert 'hunter2' not in rows[0]['metadata']  # no secrets in audit trail

    # failed validation is audited too
    client.post('/api/connections', json={'type': 'snowflake'})
    rows = db.execute("SELECT * FROM audit_logs WHERE action='connection.rejected'").fetchall()
    assert len(rows) == 1


# ── F-002: warehouse dialect layer ───────────────────────
def test_warehouse_compile_select_is_parameterized():
    from warehouse import get_dialect
    d = get_dialect('sqlite')
    sql, params = d.compile_select({
        'table': 'events',
        'columns': ['id', 'name'],
        'where': {'status': "active'; DROP TABLE events;--"},
        'limit': 10,
    })
    assert sql == 'SELECT "id", "name" FROM "events" WHERE "status" = ? LIMIT ?'
    assert params == ["active'; DROP TABLE events;--", 10]
    assert 'DROP TABLE' not in sql  # injection payload stays out of SQL text


def test_warehouse_dialect_quoting_and_placeholders():
    from warehouse import get_dialect
    sqlite, pg, sf = get_dialect('sqlite'), get_dialect('postgres'), get_dialect('snowflake')
    assert sqlite.quote_identifier('weird col') == '"weird col"'
    assert sqlite.quote_identifier('a"b') == '"a""b"'
    assert sqlite.parameterize() == '?'
    assert pg.parameterize() == '%s'
    assert sf.parameterize() == '%s'
    sql, _ = pg.compile_select({'table': 't', 'columns': ['a'], 'where': {'b': 1}})
    assert sql == 'SELECT "a" FROM "t" WHERE "b" = %s'


def test_warehouse_create_table_and_insert_select_run_on_sqlite(db):
    from warehouse import get_dialect
    d = get_dialect('sqlite')
    ddl = d.compile_create_table({
        'table': 'gold_revenue',
        'if_not_exists': True,
        'columns': [
            {'name': 'location_id', 'type': 'id'},
            {'name': 'day', 'type': 'date'},
            {'name': 'net_revenue', 'type': 'measure'},
            {'name': 'is_forecast', 'type': 'flag'},
            {'name': 'tier', 'type': 'dimension'},
        ],
    })
    db.execute(ddl)  # must be valid SQLite DDL
    db.execute("INSERT INTO gold_revenue VALUES (1, '2024-01-01', 99.5, 0, 'gold')")

    sql, params = d.compile_insert_select({
        'target': 'gold_revenue_copy',
        'columns': ['location_id', 'day', 'net_revenue', 'is_forecast', 'tier'],
        'select': {'table': 'gold_revenue', 'columns': ['location_id', 'day', 'net_revenue', 'is_forecast', 'tier']},
    })
    db.execute(ddl.replace('gold_revenue', 'gold_revenue_copy'))
    db.execute(sql, params)
    assert db.execute('SELECT COUNT(*) c FROM gold_revenue_copy').fetchone()['c'] == 1


def test_warehouse_errors_and_registry():
    import warehouse
    with pytest.raises(warehouse.UnknownDialectError):
        warehouse.get_dialect('oracle')
    with pytest.raises(warehouse.SqlCompileError) as ei:
        warehouse.get_dialect('sqlite').compile_select({'columns': ['a']})  # no table
    assert ei.value.code == 'invalid_spec'
    with pytest.raises(warehouse.UnsupportedFeatureError):
        warehouse.get_dialect('sqlite').compile_create_table({
            'table': 't', 'columns': [{'name': 'x', 'type': 'quantum'}]})

    class MockDialect(warehouse.SQLiteDialect):
        name = 'mock'
    warehouse.register_dialect('mock', MockDialect)
    assert warehouse.get_dialect('mock').name == 'mock'


def test_warehouse_concurrent_compiles_are_safe():
    from warehouse import get_dialect
    d = get_dialect('sqlite')
    results, errs = [], []

    def compile_one(i):
        try:
            sql, params = d.compile_select({'table': f't{i}', 'columns': ['a'], 'where': {'k': i}})
            results.append((sql, params))
        except Exception as e:  # pragma: no cover
            errs.append(e)

    threads = [threading.Thread(target=compile_one, args=(i,)) for i in range(10)]
    [t.start() for t in threads]
    [t.join() for t in threads]
    assert not errs
    assert len(results) == 10
    assert all(p[1][0] == int(p[0].split('"t')[1][0]) for p in results)


# ── F-005: ingestion profiling ───────────────────────────
def test_profiler_column_statistics(db):
    db.execute('CREATE TABLE src_orders (order_id INTEGER, amount REAL, status TEXT, '
               'created_at TEXT, is_gift INTEGER, note TEXT)')
    rows = []
    for i in range(100):
        rows.append((
            i + 1,
            (i % 10) * 10.0,
            ['new', 'shipped', 'returned'][i % 3],
            f'2024-01-{(i % 28) + 1:02d}',
            i % 2,
            None if i % 4 == 0 else 'x' * 60,
        ))
    db.executemany('INSERT INTO src_orders VALUES (?,?,?,?,?,?)', rows)
    db.commit()

    from profiler import profile_table
    prof = profile_table(db, 'src_orders')
    assert prof['table'] == 'src_orders'
    assert prof['row_count'] == 100
    assert prof['sampled_rows'] == 100  # < 10k → full table
    cols = {c['name']: c for c in prof['columns']}

    assert cols['order_id']['semantic_type'] == 'id'
    assert cols['order_id']['distinct_count'] == 100
    assert cols['order_id']['null_pct'] == 0
    assert cols['order_id']['min'] == 1 and cols['order_id']['max'] == 100

    amt = cols['amount']
    assert amt['semantic_type'] == 'measure'
    assert amt['mean'] == pytest.approx(45.0)
    assert amt['p50'] == pytest.approx(40.0, abs=10.01)
    assert amt['stddev'] > 0

    st = cols['status']
    assert st['semantic_type'] == 'dimension'
    assert st['distinct_count'] == 3
    assert set(v['value'] for v in st['top_5_values']) == {'new', 'shipped', 'returned'}

    assert cols['created_at']['semantic_type'] == 'date'
    assert cols['is_gift']['semantic_type'] == 'flag'
    assert cols['note']['null_pct'] == pytest.approx(25.0)
    assert cols['note']['semantic_type'] == 'text'
    for c in prof['columns']:
        assert c['definition_confidence'] in ('high', 'medium', 'low')


def test_profiler_samples_large_tables(db):
    db.execute('CREATE TABLE big_t (v INTEGER)')
    db.executemany('INSERT INTO big_t VALUES (?)', [(i,) for i in range(12000)])
    db.commit()
    from profiler import profile_table
    prof = profile_table(db, 'big_t')
    assert prof['row_count'] == 12000
    assert prof['sampled_rows'] == 10000


def test_profile_endpoint_creates_job_and_stores_column_stats(client, db):
    cid = client.post('/api/connections', json=SNOWFLAKE_BODY).get_json()['id']
    r = client.post(f'/api/connections/{cid}/profile')
    assert r.status_code == 201
    job = r.get_json()
    assert job['status'] == 'done'
    assert job['connection_id'] == cid
    assert job['row_count'] > 0
    names = {c['name'] for c in job['columns']}
    assert names  # has profiled columns
    for c in job['columns']:
        for k in ('null_pct', 'distinct_count', 'semantic_type', 'definition_confidence', 'top_5_values'):
            assert k in c

    # persisted + listable
    lst = client.get(f'/api/connections/{cid}/profiles').get_json()
    assert len(lst) == 1 and lst[0]['id'] == job['id']

    # audited
    row = db.execute("SELECT * FROM audit_logs WHERE action='profile.completed'").fetchone()
    assert row is not None

    # unknown connection → 404
    assert client.post('/api/connections/99999/profile').status_code == 404
