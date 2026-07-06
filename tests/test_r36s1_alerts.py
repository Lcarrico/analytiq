"""
R36S1E3-US1 (backend, DEP) — alert rules CRUD + deterministic evaluation:
rules persist with kind/condition/delivery, checks run against real
substrate and append trigger history, mute/edit/delete are audited.
"""
from conftest import wait_until


def _governed(client):
    conn = client.post('/api/connections', json={'type': 'snowflake', 'account': 'al',
                                                 'username': 'u', 'password': 'p'}).get_json()
    rid = client.post('/api/governance/run', json={'connectionId': conn['id']}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/governance/{rid}').get_json().get('status')
               in ('done', 'complete'), timeout=30)
    return conn['id']


def test_alert_rules_crud_and_check(client):
    cid = _governed(client)
    client.put('/api/tables/sla', json={'connectionId': cid, 'table': 'fact_revenue',
                                        'max_age_hours': 1})

    r = client.post('/api/alert_rules', json={
        'name': 'POS feed freshness SLA', 'kind': 'freshness',
        'watch': 'fact_revenue', 'connection_id': cid,
        'condition': {'max_age_hours': 1},
        'frequency': 'daily 07:00', 'deliver': ['email']})
    assert r.status_code == 201
    rule = r.get_json()
    assert rule['id']

    # immediate check ran -> at least one trigger row with a real verdict
    d = client.get(f"/api/alert_rules/{rule['id']}").get_json()
    assert d['rule']['name'] == 'POS feed freshness SLA'
    assert d['triggers'] and d['triggers'][0]['status'] in ('firing', 'ok')
    assert d['rule']['status'] in ('firing', 'ok')

    # list carries counts by kind + live status
    lst = client.get('/api/alert_rules').get_json()
    assert lst['counts']['all'] >= 1
    assert lst['counts'].get('freshness', 0) >= 1

    # mute -> status MUTED; unmute via patch
    client.patch(f"/api/alert_rules/{rule['id']}", json={'mute_hours': 24})
    d2 = client.get(f"/api/alert_rules/{rule['id']}").get_json()
    assert d2['rule']['status'] == 'muted'

    # manual re-check appends history
    n0 = len(d2['triggers'])
    client.post(f"/api/alert_rules/{rule['id']}/check")
    d3 = client.get(f"/api/alert_rules/{rule['id']}").get_json()
    assert len(d3['triggers']) == n0 + 1

    # delete
    assert client.delete(f"/api/alert_rules/{rule['id']}").status_code == 204
    assert client.get(f"/api/alert_rules/{rule['id']}").status_code == 404
    logs = client.get('/api/audit-logs?action=alert.created&limit=3').get_json()
    entries = logs if isinstance(logs, list) else logs.get('entries', [])
    assert entries


def test_threshold_rule_fires_on_real_series(client):
    cid = _governed(client)
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    run = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status')
               == 'done', timeout=30)
    client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'Guard Target'})

    # impossible floor -> deterministic FIRING against the real series
    r = client.post('/api/alert_rules', json={
        'name': 'Revenue guard', 'kind': 'threshold', 'watch': 'Net Revenue',
        'session_id': sid, 'condition': {'floor': 10 ** 9},
        'frequency': 'daily', 'deliver': ['email', 'slack']})
    d = client.get(f"/api/alert_rules/{r.get_json()['id']}").get_json()
    assert d['rule']['status'] == 'firing'
    assert 'below' in d['triggers'][0]['message'] or 'floor' in d['triggers'][0]['message']
