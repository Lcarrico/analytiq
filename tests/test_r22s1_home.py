"""
R22S1E1-US1 (backend) — GET /api/home/summary: the workspace-home widget
aggregate (App Home.dc.html Frame 01), composed from existing tables.
Admin sees the usage block; viewers don't (frame marks it ADMIN).
"""
from conftest import wait_until


def _seed_artifact(client, title='Home Widget Art'):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done',
               timeout=30)
    return client.post(f'/api/sessions/{sid}/save_artifact', json={'title': title}).get_json()


def test_home_summary_shape(client):
    art = _seed_artifact(client)
    r = client.get('/api/home/summary')
    assert r.status_code == 200
    d = r.get_json()

    # widgets, per frame order
    for key in ('greeting', 'date_line', 'recents', 'health', 'runs', 'alerts',
                'review', 'suggested', 'recently_viewed', 'usage'):
        assert key in d, f'missing {key}'

    assert isinstance(d['recents'], list) and d['recents']
    top = d['recents'][0]
    for f in ('id', 'title', 'health', 'age'):
        assert f in top
    assert any(a['id'] == art['id'] for a in d['recents'])

    h = d['health']
    assert isinstance(h['score'], (int, float)) and 0 <= h['score'] <= 100
    assert isinstance(h['rows'], list) and len(h['rows']) == 4  # sources/freshness/drift/pii
    assert all({'label', 'value'} <= set(row) for row in h['rows'])

    assert isinstance(d['runs'], list)      # active pipeline runs (may be empty)
    assert isinstance(d['alerts'], list)
    assert isinstance(d['review'], dict) and 'count' in d['review'] and 'items' in d['review']
    assert isinstance(d['suggested'], list)
    assert isinstance(d['recently_viewed'], list)

    # dev-fallback identity is admin → usage block present w/ real meter fields
    assert d['usage'] and 'tokens_used' in d['usage'] and 'pct' in d['usage']


def test_home_summary_hides_usage_from_viewers(client):
    client.post('/api/auth/register',
                json={'email': 'homeviewer@acme.com', 'password': 'pass12345', 'role': 'viewer'})
    tok = client.post('/api/auth/login',
                      json={'email': 'homeviewer@acme.com', 'password': 'pass12345'}
                      ).get_json()['token']
    r = client.get('/api/home/summary', headers={'Authorization': f'Bearer {tok}'})
    assert r.status_code == 200
    assert r.get_json()['usage'] is None
