"""
R35S2E1-US1 (backend) — source detail aggregate: header facts, health KPIs
(score + delta, healthy tables, freshness vs SLA, 7-day gate tally),
open issues, and the health trend.
"""
from conftest import wait_until


def _governed(client):
    conn = client.post('/api/connections', json={'type': 'snowflake', 'account': 'prod_pos',
                                                 'username': 'u', 'password': 'p'}).get_json()
    rid = client.post('/api/governance/run', json={'connectionId': conn['id']}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/governance/{rid}').get_json().get('status')
               in ('done', 'complete'), timeout=30)
    return conn['id'], rid


def test_source_detail_aggregate(client):
    cid, rid = _governed(client)
    client.put('/api/tables/sla', json={'connectionId': cid, 'table': 'fact_revenue',
                                        'max_age_hours': 1})
    client.post('/api/dq/evaluate', json={'connectionId': cid})

    d = client.get(f'/api/data/sources/{cid}').get_json()
    h = d['header']
    for k in ('name', 'type', 'status', 'issues', 'tables_in_scope', 'owner'):
        assert k in h, k
    assert h['tables_in_scope'] >= 5

    k = d['kpis']
    assert isinstance(k['health']['score'], int)
    assert 'delta' in k['health']
    assert k['tables_healthy']['total'] == h['tables_in_scope']
    assert k['tables_healthy']['ok'] <= k['tables_healthy']['total']
    assert k['freshness']['state'] in ('met', 'at risk', 'breached', 'none')
    assert k['gates_7d']['total'] >= 1            # dq evaluation recorded rules
    assert k['gates_7d']['passed'] <= k['gates_7d']['total']

    assert isinstance(d['issues'], list)
    assert isinstance(d['trend'], list)
    assert client.get('/api/data/sources/999999').status_code == 404


def test_table_detail_aggregate_and_description(client):
    """R35S2E2 — table detail aggregate: profile facts, manifest columns
    (null rates, semantic types, PII masking), gates, SLA posture,
    downstream surfaces; plus the editable business definition (DEP)."""
    cid, rid = _governed(client)
    client.put('/api/tables/sla', json={'connectionId': cid, 'table': 'fact_revenue',
                                        'max_age_hours': 1})

    d = client.get(f'/api/data/tables/{rid}/fact_revenue').get_json()
    assert d['name'] == 'fact_revenue'
    assert d['health_score'] and d['row_count']
    assert d['gates'] and d['gates'].get('pk_gate')
    assert d['sla'] and d['sla']['max_age_hours'] == 1
    cols = {c['name']: c for c in d['columns']}
    assert 'net_revenue' in cols

    pii = client.get(f'/api/data/tables/{rid}/dim_customer').get_json()
    pcols = [c for c in pii['columns'] if c.get('pii_flags')]
    assert pcols                                     # email/phone flagged

    # 'latest' resolves the newest run for lineage deep links
    latest = client.get('/api/data/tables/latest/fact_revenue').get_json()
    assert latest['name'] == 'fact_revenue'

    # editable business definition persists + audits
    r = client.patch(f'/api/data/tables/{rid}/fact_revenue',
                     json={'description': 'One row per location-day of net revenue.'})
    assert r.status_code == 200
    d2 = client.get(f'/api/data/tables/{rid}/fact_revenue').get_json()
    assert d2['description'] == 'One row per location-day of net revenue.'
    assert client.get(f'/api/data/tables/{rid}/nope').status_code == 404
