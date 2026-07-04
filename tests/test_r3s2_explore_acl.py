"""
R3S2E4-US1 — Explore-level access control (restrict who can use/edit explores)
"""
from conftest import wait_until


def _schema_ready(client):
    cid = client.post('/api/connections', json={
        'type': 'snowflake', 'name': 'ea', 'account': 'a', 'username': 'u',
        'password': 'p'}).get_json()['id']
    before = len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json() or [])
    client.post('/api/governance/run', json={'connectionId': cid})
    wait_until(lambda: len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json()
                           or []) > before)
    client.post('/api/semantic/default/generate', json={'connectionId': cid})
    return cid


def _user(client, email, role='analyst'):
    client.post('/api/auth/register', json={'email': email, 'password': 's3cret-pass',
                                            'role': role})
    tok = client.post('/api/auth/login', json={'email': email,
                                               'password': 's3cret-pass'}).get_json()['token']
    return {'Authorization': f'Bearer {tok}'}


def test_explore_acl_set_and_edit_enforcement(client):
    _schema_ready(client)
    r = client.put('/api/acl/explore/fact_revenue',
                   json={'entries': [{'principal': 'ed@acme.com', 'role': 'editor'}]})
    assert r.status_code == 200
    assert client.put('/api/acl/explore/no_such_cube',
                      json={'entries': []}).status_code == 404

    outsider = _user(client, 'out2@acme.com', 'analyst')
    ed = _user(client, 'ed@acme.com', 'analyst')
    assert client.patch('/api/semantic/default/explores/fact_revenue',
                        json={'description': 'x'}, headers=outsider).status_code == 403
    assert client.patch('/api/semantic/default/explores/fact_revenue',
                        json={'description': 'granted edit'}, headers=ed).status_code == 200


def test_planner_excludes_restricted_explores(client):
    cid = _schema_ready(client)
    client.put('/api/acl/explore/fact_revenue',
               json={'entries': [{'principal': 'insider@acme.com', 'role': 'viewer'}]})

    outsider = _user(client, 'nope@acme.com', 'analyst')
    plan = client.post('/api/sessions/plan',
                       json={'message': 'Predict net revenue for the next 14 days by location',
                             'connectionId': cid},
                       headers=outsider).get_json()
    assert 'fact_revenue' not in (plan.get('explores_used') or [])
    assert 'net_revenue' not in (plan.get('feature_candidates') or [])

    insider = _user(client, 'insider@acme.com', 'analyst')
    plan = client.post('/api/sessions/plan',
                       json={'message': 'Predict net revenue for the next 14 days by location',
                             'connectionId': cid},
                       headers=insider).get_json()
    assert 'fact_revenue' in plan['explores_used']

    # header-mode admin (dev) unaffected
    plan = client.post('/api/sessions/plan',
                       json={'message': 'Predict net revenue for the next 14 days by location',
                             'connectionId': cid}).get_json()
    assert 'fact_revenue' in plan['explores_used']
