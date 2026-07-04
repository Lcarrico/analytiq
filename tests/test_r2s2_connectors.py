"""
R2S2E4-US1 — Remaining PRD connectors (MySQL, DuckDB, Redshift, Databricks):
validated configs, encrypted credentials, simulated test contracts.
"""

BODIES = {
    'mysql':      {'host': 'db.acme.com', 'database_name': 'shop', 'username': 'root',
                   'password': 'pw-mysql-1'},
    'redshift':   {'host': 'cluster.abc.redshift.amazonaws.com', 'database_name': 'dw',
                   'username': 'awsuser', 'password': 'pw-rs-1'},
    'databricks': {'host': 'adb-123.azuredatabricks.net', 'http_path': '/sql/1.0/wh',
                   'access_token': 'dapi-secret-token'},
    'duckdb':     {'database_path': '/data/analytics.duckdb'},
}


def test_each_connector_registers_with_validation(client, db):
    for ctype, body in BODIES.items():
        r = client.post('/api/connections', json={'type': ctype, 'name': f'{ctype}-conn', **body})
        assert r.status_code == 201, (ctype, r.get_json())
        created = r.get_json()
        assert created['type'] == ctype

        # missing everything → structured 400 listing required fields
        r = client.post('/api/connections', json={'type': ctype, 'name': 'x'})
        assert r.status_code == 400, ctype
        assert set(r.get_json()['fields'])  # at least one required field flagged

    # secrets encrypted at rest for credentialed types
    rows = db.execute('SELECT type, password FROM connections').fetchall()
    stored = {r['type']: r['password'] for r in rows}
    assert 'pw-mysql-1' not in (stored.get('mysql') or '')
    assert 'dapi-secret-token' not in (stored.get('databricks') or '')


def test_connection_test_contract_simulated(client):
    for ctype, body in BODIES.items():
        r = client.post('/api/connections/test', json={'type': ctype, **body})
        assert r.status_code == 200, (ctype, r.get_json())
        out = r.get_json()
        assert out['ok'] is True
        assert out.get('simulated') is True   # offline contract is explicit


def test_unknown_type_still_rejected(client):
    assert client.post('/api/connections',
                       json={'type': 'oracle', 'name': 'x'}).status_code == 400
