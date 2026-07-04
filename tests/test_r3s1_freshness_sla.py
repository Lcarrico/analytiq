"""
R3S1E2-US1 — Per-table freshness SLA configuration driving the freshness gate
"""
from conftest import wait_until


def _mk(client):
    return client.post('/api/connections', json={
        'type': 'snowflake', 'name': 'sla', 'account': 'a', 'username': 'u',
        'password': 'p'}).get_json()['id']


def _gov(client, cid):
    before = len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json() or [])
    client.post('/api/governance/run', json={'connectionId': cid})
    wait_until(lambda: len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json()
                           or []) > before)


def test_parse_freshness_age():
    import dq
    assert dq.parse_freshness_age('2h ago') == 2
    assert dq.parse_freshness_age('3d ago') == 72
    assert dq.parse_freshness_age('30m ago') == 0.5
    assert dq.parse_freshness_age('<1h ago') == 1
    assert dq.parse_freshness_age('N/A') is None


def test_sla_config_and_violation_flow(client, db):
    cid = _mk(client)
    r = client.put('/api/tables/sla', json={'connectionId': cid, 'table': 'fact_revenue',
                                            'max_age_hours': 1})
    assert r.status_code == 200
    assert client.put('/api/tables/sla',
                      json={'connectionId': cid, 'table': 'x',
                            'max_age_hours': -3}).status_code == 400
    assert client.put('/api/tables/sla', json={'table': 'x'}).status_code == 400

    slas = client.get(f'/api/tables/sla?connection_id={cid}').get_json()
    assert slas == [{'connection_id': cid, 'table_name': 'fact_revenue',
                     'max_age_hours': 1, **{k: slas[0][k] for k in ('id', 'updated_at')}}]

    _gov(client, cid)
    m = client.get(f'/api/integrations/{cid}/manifest').get_json()
    fr = next(t for t in m['tables'] if t['name'] == 'fact_revenue')
    # fact_revenue freshness is '2h ago' > 1h SLA → gate warns
    assert fr['gates']['freshness_gate'] == 'warn'
    assert fr['dq_gate_status'] in ('WARN', 'BLOCK')

    alerts = client.get('/api/alerts?type=freshness').get_json()
    assert any(a['detail']['table'] == 'fact_revenue' for a in alerts)
    assert db.execute("SELECT 1 FROM email_outbox WHERE subject LIKE '%freshness%'").fetchone()


def test_sla_within_bounds_keeps_pass(client):
    cid = _mk(client)
    client.put('/api/tables/sla', json={'connectionId': cid, 'table': 'dim_location',
                                        'max_age_hours': 100})
    _gov(client, cid)
    m = client.get(f'/api/integrations/{cid}/manifest').get_json()
    dl = next(t for t in m['tables'] if t['name'] == 'dim_location')
    assert dl['gates']['freshness_gate'] == 'pass'   # '6h ago' ≤ 100h
    assert client.get('/api/alerts?type=freshness').get_json() == []
