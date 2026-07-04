"""
R7S2E2-US1 — Timezone-aware refresh schedules + artifact thumbnails
"""
from conftest import wait_until


def _artifact(client):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    run = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status') == 'done',
               timeout=30)
    return client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'tz'}).get_json()


def test_schedule_accepts_timezone(client, db):
    art = _artifact(client)
    r = client.put(f"/api/artifacts/{art['id']}/schedule",
                   json={'cron_expr': '0 6 * * *', 'timezone': 'America/New_York'})
    assert r.status_code == 200
    sched = r.get_json()
    assert sched['timezone'] == 'America/New_York'
    assert sched['next_run_at']

    # invalid timezone rejected
    r = client.put(f"/api/artifacts/{art['id']}/schedule",
                   json={'cron_expr': '0 6 * * *', 'timezone': 'Mars/Olympus'})
    assert r.status_code == 400

    # different zones → different UTC next-run instants for the same cron
    art2 = _artifact(client)
    tokyo = client.put(f"/api/artifacts/{art2['id']}/schedule",
                       json={'cron_expr': '0 6 * * *', 'timezone': 'Asia/Tokyo'}).get_json()
    assert tokyo['next_run_at'] != sched['next_run_at']


def test_artifact_thumbnail_svg(client):
    art = _artifact(client)
    r = client.get(f"/api/artifacts/{art['id']}/thumbnail")
    assert r.status_code == 200
    assert r.content_type.startswith('image/svg+xml')
    svg = r.get_data(as_text=True)
    assert svg.startswith('<svg')
    assert 'polyline' in svg or 'path' in svg

    bare = client.post('/api/artifacts', json={'title': 'no-chart'}).get_json()
    assert client.get(f"/api/artifacts/{bare['id']}/thumbnail").status_code == 404

    # list carries thumbnail_url
    lst = client.get('/api/artifacts').get_json()
    assert any(i.get('thumbnail_url', '').endswith('/thumbnail') for i in lst['items'])
