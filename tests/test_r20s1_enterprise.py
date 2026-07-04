"""
R20S1E1-US1 — Enterprise: token metering + plan entitlements + billing,
RLS policies with enforcement + simulator, audit severity + export.
"""
import json

from conftest import wait_until


def test_dispatches_meter_tokens_and_usage_rolls_up(client, db):
    client.post('/api/sessions/plan',
                json={'message': 'Forecast net revenue for the next 14 days by location'})
    r = client.get('/api/billing/usage')
    assert r.status_code == 200
    u = r.get_json()
    assert u['cycle']['tokens_used'] > 0
    assert u['cycle']['included'] > 0
    caps = {c['capability'] for c in u['by_capability']}
    assert 'session_planning' in caps
    assert u['thresholds']['soft'] == [50, 75, 90]
    assert u['thresholds']['status'] in ('ok', 'soft_50', 'soft_75', 'soft_90', 'capped')


def test_plan_entitlements_gate_public_links(client, db):
    from conftest import wait_until as w
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    w(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done', timeout=30)
    art = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'Ent'}).get_json()

    assert client.put('/api/billing/plan', json={'plan': 'starter'}).status_code == 200
    r = client.post(f"/api/artifacts/{art['id']}/share_links", json={'expires_in_hours': 24})
    assert r.status_code == 403
    assert 'plan' in r.get_json()['error'].lower() or 'upgrade' in r.get_json()['error'].lower()
    client.put('/api/billing/plan', json={'plan': 'team'})
    assert client.post(f"/api/artifacts/{art['id']}/share_links",
                       json={'expires_in_hours': 24}).status_code in (200, 201)
    assert client.put('/api/billing/plan', json={'plan': 'bogus'}).status_code == 400


def test_rls_policy_enforced_on_gold_reads(client, db):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done',
               timeout=30)
    r = client.post('/api/admin/rls', json={'table_name': 'gold_predictions',
                                            'expression': "day_index < 10", 'status': 'on'})
    assert r.status_code == 201
    rows = client.get('/api/gold/default/gold_predictions?per_page=100').get_json()
    assert rows['total'] == 10                          # policy filtered
    assert all(x['day_index'] < 10 for x in rows['rows'])
    # simulator explains what a user sees
    sim = client.post('/api/admin/rls/simulate',
                      json={'table_name': 'gold_predictions'}).get_json()
    assert sim['visible_rows'] == 10
    assert sim['policy']['expression'] == 'day_index < 10'
    # unsafe expression rejected
    assert client.post('/api/admin/rls', json={'table_name': 'gold_predictions',
                                               'expression': '1; DROP TABLE x',
                                               'status': 'on'}).status_code == 400


def test_audit_severity_and_export(client, db):
    client.post('/api/sessions/plan',
                json={'message': 'Forecast net revenue for the next 14 days by location'})
    csv = client.get('/api/audit-logs/export?format=csv')
    assert csv.status_code == 200
    assert csv.data.decode().splitlines()[0].startswith('id,action,severity')
    js = client.get('/api/audit-logs/export?format=json')
    assert js.status_code == 200
    rows = js.get_json()['events']
    assert rows and all('severity' in r for r in rows)
    assert client.get('/api/audit-logs/export?format=xml').status_code == 400
