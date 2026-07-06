"""
R35S1E1-US1 (backend) — sources list aggregate: one row per connection with
kind, status, health, last sync, SLA posture, table + issue counts.
"""
from conftest import wait_until


def _governed_connection(client):
    conn = client.post('/api/connections', json={'type': 'snowflake', 'account': 'prod_pos',
                                                 'username': 'u', 'password': 'p'}).get_json()
    rid = client.post('/api/governance/run', json={'connectionId': conn['id']}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/governance/{rid}').get_json().get('status')
               in ('done', 'complete'), timeout=30)
    return conn['id']


def test_sources_aggregate(client):
    cid = _governed_connection(client)
    client.put('/api/tables/sla', json={'connectionId': cid, 'table': 'fact_revenue',
                                        'max_age_hours': 1})
    d = client.get('/api/data/sources').get_json()
    row = next(r for r in d['sources'] if r['id'] == cid)
    for k in ('name', 'type', 'kind', 'status', 'health', 'last_sync',
              'sla', 'tables', 'issues'):
        assert k in row, k
    assert row['kind'] == 'warehouse'
    assert row['tables'] >= 5                      # sim catalog
    assert isinstance(row['health'], int)
    assert row['sla']['label']                     # e.g. '1h'
    assert row['sla']['state'] in ('met', 'at risk', 'breached', 'none')
    assert d['total'] >= 1


def test_sources_empty(client):
    d = client.get('/api/data/sources').get_json()
    assert d['sources'] == [] and d['total'] == 0
