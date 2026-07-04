"""
Sprint 12 — Frontend Onboarding & UX Resilience (backend support)
  F-047 Workspace status endpoint driving the onboarding CTA
  F-048 Resilient JSON error contracts (404/405 JSON, input validation 400)
"""
from conftest import wait_until


def test_workspace_status_empty_suggests_connect(client):
    r = client.get('/api/workspace/status')
    assert r.status_code == 200
    s = r.get_json()
    assert s['connections'] == 0
    assert s['governance_runs'] == 0
    assert s['artifacts'] == 0
    assert s['next_step'] == 'connect'
    assert s['onboarding_complete'] is False


def test_workspace_status_progresses(client):
    cid = client.post('/api/connections', json={
        'name': 'ws', 'type': 'snowflake', 'account': 'a', 'username': 'u',
        'password': 'p'}).get_json()['id']
    s = client.get('/api/workspace/status').get_json()
    assert s['connections'] == 1
    assert s['next_step'] == 'scan'

    run_id = client.post('/api/governance/run', json={'connectionId': cid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/governance/{run_id}').get_json().get('status') == 'done')
    # defs are committed shortly after the run flips to done — wait for them
    wait_until(lambda: client.get('/api/workspace/status').get_json()['pending_reviews'] > 0)
    s = client.get('/api/workspace/status').get_json()
    assert s['governance_runs'] == 1
    assert s['pending_reviews'] > 0
    assert s['next_step'] == 'review'

    # clear review queue → next step analyze
    for item in client.get(f'/api/reviews/{run_id}').get_json():
        client.post(f"/api/reviews/items/{item['id']}", json={'action': 'accept'})
    s = client.get('/api/workspace/status').get_json()
    assert s['next_step'] == 'analyze'

    # artifact exists → onboarding complete
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    run = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status') == 'done',
               timeout=30)
    client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'First'})
    s = client.get('/api/workspace/status').get_json()
    assert s['artifacts'] == 1
    assert s['onboarding_complete'] is True
    assert s['next_step'] == 'explore'


def test_unknown_route_returns_json_404(client):
    r = client.get('/api/nope/nothing')
    assert r.status_code == 404
    assert r.get_json()['error']

    r = client.put('/api/health')  # wrong method
    assert r.status_code == 405
    assert r.get_json()['error']


def test_bad_pagination_input_returns_400_json(client):
    r = client.get('/api/artifacts?page=banana')
    assert r.status_code == 400
    assert 'page' in r.get_json()['error']
    r = client.get('/api/artifacts?per_page=zap')
    assert r.status_code == 400
