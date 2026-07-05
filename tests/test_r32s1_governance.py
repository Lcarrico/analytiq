"""
R32S1E1-US1 (backend) — GET /api/governance/summary: the overview's KPI
aggregate (ch15 §1), composed from the real governance substrate
(semantic_definitions, alerts, health_history, dq_gate_results).
"""
from conftest import wait_until


def _run_governance(client):
    conn = client.post('/api/connections', json={'type': 'snowflake', 'account': 'd',
                                                 'username': 'd', 'password': 'd'}).get_json()
    rid = client.post('/api/governance/run', json={'connectionId': conn['id']}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/governance/{rid}').get_json().get('status')
               in ('done', 'complete'), timeout=30)
    return rid


def test_summary_shape_and_review_counts(client):
    _run_governance(client)
    r = client.get('/api/governance/summary')
    assert r.status_code == 200
    d = r.get_json()
    for k in ('awaiting_review', 'review_high', 'pii_flags', 'tables_blocked',
              'freshness_breaches', 'schema_drift', 'contract_failures_7d',
              'health_score', 'health_trend'):
        assert k in d, f'missing {k}'
    # a governance run leaves pending semantic definitions to review
    assert d['awaiting_review'] >= 1
    assert isinstance(d['health_trend'], list)
    assert d['health_score'] is None or 0 <= d['health_score'] <= 100
