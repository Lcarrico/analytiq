"""Infrastructure smoke tests — fixture wiring, schema creation, isolation."""


def test_health_endpoint(client):
    r = client.get('/api/health')
    assert r.status_code == 200
    assert r.get_json() == {'ok': True}


def test_schema_created_fresh(db):
    tables = {r['name'] for r in db.execute(
        "SELECT name FROM sqlite_master WHERE type='table'").fetchall()}
    for t in ('connections', 'governance_runs', 'cataloged_tables', 'semantic_definitions',
              'sessions', 'pipeline_runs', 'artifacts', 'artifact_shares', 'chart_data',
              'artifact_schedules', 'subscriptions', 'audit_logs'):
        assert t in tables, f'missing table {t}'


def test_db_is_isolated_temp_file(app_mod):
    assert 'analytiq.db' not in app_mod._DB_PATH
    assert app_mod._new_conn().execute('SELECT COUNT(*) c FROM connections').fetchone()['c'] == 0
