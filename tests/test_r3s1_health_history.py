"""
R3S1E1-US1 — Health score trend history + configurable alerting thresholds
"""
from conftest import wait_until


def _mk(client):
    return client.post('/api/connections', json={
        'type': 'snowflake', 'name': 'hh', 'account': 'a', 'username': 'u',
        'password': 'p'}).get_json()['id']


def _gov(client, cid):
    before = len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json() or [])
    run_id = client.post('/api/governance/run', json={'connectionId': cid}).get_json()['runId']
    wait_until(lambda: len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json()
                           or []) > before)
    return run_id


def test_health_history_appended_per_run(client, db):
    cid = _mk(client)
    _gov(client, cid)
    rows = db.execute('SELECT * FROM health_history WHERE connection_id=?', (cid,)).fetchall()
    tables = {r['table_name'] for r in rows}
    assert 'fact_revenue' in tables and 'dim_customer' in tables

    _gov(client, cid)
    series = client.get(f'/api/integrations/{cid}/health_history?table=fact_revenue').get_json()
    assert len(series) == 2
    assert all(s['health_score'] == 98 for s in series)
    assert all(s['run_id'] for s in series)

    everything = client.get(f'/api/integrations/{cid}/health_history').get_json()
    assert len(everything) == 12  # 6 tables × 2 runs


def test_threshold_generates_alerts_and_email(client, db):
    cid = _mk(client)
    r = client.put('/api/governance/thresholds',
                   json={'connectionId': cid, 'min_health': 90})
    assert r.status_code == 200
    assert client.put('/api/governance/thresholds',
                      json={'connectionId': cid, 'min_health': 'high'}).status_code == 400

    _gov(client, cid)
    alerts = client.get('/api/alerts?type=health').get_json()
    flagged = {a['detail']['table'] for a in alerts}
    assert 'raw_clickstream' in flagged          # score 44 < 90
    assert 'dim_customer' in flagged             # score 71 < 90
    assert 'fact_revenue' not in flagged         # 98 ≥ 90
    for a in alerts:
        assert a['type'] == 'health'
        assert a['detail']['health_score'] < 90

    # notification queued in the outbox
    ob = db.execute("SELECT * FROM email_outbox WHERE subject LIKE '%health%'").fetchall()
    assert ob


def test_no_alerts_without_threshold(client):
    cid = _mk(client)
    _gov(client, cid)
    assert client.get('/api/alerts?type=health').get_json() == []
