"""
R31S2E1-US1 (backend) — GET /api/activity: a typed projection over audit_logs
for the Recent Activity page (App Home.dc.html frame 02): kind buckets
(build/governance/data/share/model/alert/system), human title + mono meta
lines, entity links, cursor pagination, kind filtering.
"""
from conftest import wait_until


def _seed_events(client):
    art = client.post('/api/artifacts', json={'title': 'Activity Seed Art'}).get_json()
    client.patch(f"/api/artifacts/{art['id']}", json={'title': 'Activity Seed Art v2'})
    client.post('/api/artifacts', json={'title': 'Activity Seed Art B'})
    client.post('/api/artifacts', json={'title': 'Activity Seed Art C'})
    return art


def test_activity_projection_shape_and_kinds(client):
    _seed_events(client)
    r = client.get('/api/activity')
    assert r.status_code == 200
    d = r.get_json()
    assert 'items' in d and isinstance(d['items'], list) and d['items']
    top = d['items'][0]
    for f in ('id', 'kind', 'actor', 'title', 'meta', 'link', 'at'):
        assert f in top, f'missing {f}'
    kinds = {i['kind'] for i in d['items']}
    assert kinds <= {'build', 'governance', 'data', 'share', 'model', 'alert', 'system'}
    assert any(i['kind'] == 'build' for i in d['items'])   # artifact events map to build
    # newest first
    ids = [i['id'] for i in d['items']]
    assert ids == sorted(ids, reverse=True)


def test_activity_kind_filter_and_cursor(client):
    _seed_events(client)
    builds = client.get('/api/activity?kind=build').get_json()['items']
    assert builds and all(i['kind'] == 'build' for i in builds)

    page1 = client.get('/api/activity?limit=2').get_json()
    assert len(page1['items']) == 2 and page1.get('next_cursor')
    page2 = client.get(f"/api/activity?limit=2&cursor={page1['next_cursor']}").get_json()
    assert page2['items']
    assert page2['items'][0]['id'] < page1['items'][-1]['id'] or \
           page2['items'][0]['id'] == page1['items'][-1]['id'] - 1 or \
           page2['items'][0]['id'] < page1['items'][0]['id']
    ids1 = {i['id'] for i in page1['items']}
    ids2 = {i['id'] for i in page2['items']}
    assert not (ids1 & ids2)
