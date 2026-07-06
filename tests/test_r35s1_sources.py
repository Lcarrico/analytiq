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


def test_upload_profile_flags_pii(client):
    """R35S1E4: the upload profile runs the real PII scan per column so the
    schema-preview step can mask and count flags."""
    import io as _io
    csv = ('visit_date,store_id,manager_email\n'
           '2026-06-28,ST-0042,jane.doe@acme.com\n'
           '2026-06-29,ST-0043,mark.p@acme.com\n')
    r = client.post('/api/uploads', data={
        'file': (_io.BytesIO(csv.encode()), 'traffic.csv')},
        content_type='multipart/form-data')
    assert r.status_code == 201, r.get_json()
    cols = {c['name']: c for c in r.get_json()['profile']['columns']}
    assert cols['manager_email'].get('pii_flags')
    assert not cols['visit_date'].get('pii_flags')
