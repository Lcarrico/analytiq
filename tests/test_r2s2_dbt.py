"""
R2S2E3-US1 — dbt project import (manifest.json → explores + quality signals)
"""

DBT_MANIFEST = {
    'metadata': {'project_name': 'shop_analytics'},
    'nodes': {
        'model.shop.fct_orders': {
            'resource_type': 'model', 'name': 'fct_orders', 'schema': 'analytics',
            'columns': {
                'order_id': {'name': 'order_id'},
                'order_date': {'name': 'order_date'},
                'total_amount': {'name': 'total_amount'},
                'status': {'name': 'status'},
            },
        },
        'model.shop.dim_customers': {
            'resource_type': 'model', 'name': 'dim_customers', 'schema': 'analytics',
            'columns': {'customer_id': {'name': 'customer_id'},
                        'segment': {'name': 'segment'}},
        },
        'test.shop.unique_fct_orders_order_id': {
            'resource_type': 'test', 'name': 'unique_fct_orders_order_id',
            'test_metadata': {'name': 'unique', 'kwargs': {'column_name': 'order_id',
                                                           'model': 'fct_orders'}},
        },
        'test.shop.not_null_fct_orders_order_date': {
            'resource_type': 'test', 'name': 'not_null_fct_orders_order_date',
            'test_metadata': {'name': 'not_null', 'kwargs': {'column_name': 'order_date',
                                                             'model': 'fct_orders'}},
        },
    },
}


def _cid(client):
    return client.post('/api/connections', json={
        'type': 'snowflake', 'name': 'dbt-src', 'account': 'a', 'username': 'u',
        'password': 'p'}).get_json()['id']


def test_dbt_import_creates_explores_with_quality_signals(client, db):
    cid = _cid(client)
    r = client.post(f'/api/integrations/{cid}/dbt_import', json=DBT_MANIFEST)
    assert r.status_code == 201
    out = r.get_json()
    assert set(out['imported_models']) == {'fct_orders', 'dim_customers'}
    assert out['tests_mapped'] == 2
    assert out['version']  # semantic schema version created

    schema = client.get('/api/semantic/default/schema').get_json()['schema']
    cubes = {c['name']: c for c in schema['cubes']}
    assert 'fct_orders' in cubes and 'dim_customers' in cubes
    fo = cubes['fct_orders']
    assert fo['sql_table'] == 'analytics.fct_orders'
    m = {x['name'] for x in fo['measures']}
    d = {x['name'] for x in fo['dimensions']}
    assert 'total_amount' in m
    assert {'order_id', 'order_date', 'status'} <= d
    # dbt tests inherited as quality signals
    assert any('unique' in n for n in fo['dq_notes'])
    assert any('not_null' in n for n in fo['dq_notes'])
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='dbt.imported'").fetchone()


def test_dbt_import_merges_into_existing_schema_with_bump(client):
    cid = _cid(client)
    client.post(f'/api/integrations/{cid}/dbt_import', json=DBT_MANIFEST)
    v1 = client.get('/api/semantic/default/schema').get_json()['version']
    # re-import (idempotent merge, replaces same-named cubes) → version bump
    r = client.post(f'/api/integrations/{cid}/dbt_import', json=DBT_MANIFEST)
    assert r.get_json()['version'] != v1
    schema = client.get('/api/semantic/default/schema').get_json()['schema']
    assert len([c for c in schema['cubes'] if c['name'] == 'fct_orders']) == 1


def test_dbt_import_validation(client):
    cid = _cid(client)
    assert client.post(f'/api/integrations/{cid}/dbt_import',
                       json={'metadata': {}}).status_code == 400
    assert client.post(f'/api/integrations/{cid}/dbt_import',
                       json={'nodes': {}}).status_code == 400
    assert client.post('/api/integrations/99999/dbt_import',
                       json=DBT_MANIFEST).status_code == 404
