"""
R7S2E3-US1 — Proactive insight detection (SpotIQ-style) + workspace health
dashboard generated as an AnalytIQ artifact
"""
from conftest import wait_until


def _artifact(client):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    run = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status') == 'done',
               timeout=30)
    return client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'ins'}).get_json()


def test_insight_scan_dismiss_and_drill(client, db):
    art = _artifact(client)
    r = client.post(f"/api/artifacts/{art['id']}/insights/scan")
    assert r.status_code == 201
    insights = r.get_json()['insights']
    assert insights
    kinds = {i['kind'] for i in insights}
    assert kinds <= {'anomaly', 'trend', 'weekday_pattern'}
    assert 'weekday_pattern' in kinds          # seeded data has strong weekday cycle
    for i in insights:
        assert i['summary'] and i['drill_question']

    listed = client.get(f"/api/artifacts/{art['id']}/insights").get_json()
    assert len(listed) == len(insights)

    # dismiss removes from the default list
    first = listed[0]['id']
    assert client.post(f'/api/insights/{first}/dismiss').status_code == 200
    assert len(client.get(f"/api/artifacts/{art['id']}/insights").get_json()) == len(insights) - 1

    # one-click drill-in creates a new session planned from the insight
    second = client.get(f"/api/artifacts/{art['id']}/insights").get_json()[0]
    r = client.post(f"/api/insights/{second['id']}/drill")
    assert r.status_code == 201
    out = r.get_json()
    assert out['session_id']
    assert out['plan'].get('needs_clarification') or \
        out['plan'].get('intent') in ('descriptive', 'diagnostic', 'predictive', 'prescriptive')
    assert client.post('/api/insights/99999/drill').status_code == 404


def test_workspace_health_dashboard_is_an_artifact(client):
    # generate some workspace history first
    cid = client.post('/api/connections', json={
        'type': 'snowflake', 'name': 'hd', 'account': 'a', 'username': 'u',
        'password': 'p'}).get_json()['id']
    before = len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json() or [])
    client.post('/api/governance/run', json={'connectionId': cid})
    wait_until(lambda: len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json()
                           or []) > before)

    r = client.post('/api/workspace/health_dashboard')
    assert r.status_code == 201
    art = r.get_json()
    assert art['type'] == 'Workspace Health'
    assert art['file']['validation_status'] == 'PASS'

    html = client.get(f"/api/artifacts/{art['id']}/html").get_data(as_text=True)
    assert 'data-panel="kpi-row"' in html
    assert 'Workspace health' in html or 'Workspace Health' in html
