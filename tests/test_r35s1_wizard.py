"""
R35S1E3-US1 (backend) — snowflake wizard substrate: latency on the test
call, deterministic scope preview (schemas -> tables + rows + PII-likely),
and REAL scope enforcement — a connection created with selected_tables only
catalogs those tables on its governance run.
"""
from conftest import wait_until


def test_connection_test_reports_latency(client):
    r = client.post('/api/connections/test',
                    json={'type': 'snowflake', 'account': 'a', 'username': 'u',
                          'password': 'p'})
    d = r.get_json()
    assert d['ok'] is True
    assert isinstance(d.get('latency_ms'), (int, float))


def test_preview_scope_deterministic(client):
    r = client.post('/api/connections/preview_scope',
                    json={'type': 'snowflake', 'account': 'a', 'username': 'u',
                          'password': 'p'})
    assert r.status_code == 200
    d = r.get_json()
    names = {t['name'] for s in d['schemas'] for t in s['tables']}
    assert {'fact_revenue', 'dim_customer'} <= names
    cust = next(t for s in d['schemas'] for t in s['tables']
                if t['name'] == 'dim_customer')
    assert cust['pii_likely'] is True
    assert cust['rows']
    # same call twice -> identical payload
    d2 = client.post('/api/connections/preview_scope',
                     json={'type': 'snowflake', 'account': 'a', 'username': 'u',
                           'password': 'p'}).get_json()
    assert d2 == d


def test_scope_enforced_on_governance(client):
    conn = client.post('/api/connections',
                       json={'type': 'snowflake', 'account': 'scoped', 'username': 'u',
                             'password': 'p',
                             'selected_tables': ['fact_revenue', 'dim_location']}).get_json()
    rid = client.post('/api/governance/run', json={'connectionId': conn['id']}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/governance/{rid}').get_json().get('status')
               in ('done', 'complete'), timeout=30)
    tables = client.get(f'/api/tables/{rid}').get_json()
    names = {t['name'] for t in tables}
    assert names == {'fact_revenue', 'dim_location'}
