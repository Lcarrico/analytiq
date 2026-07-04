"""
R7S2E1-US1 — Favorites, tags, list filters, and the artifact activity feed
"""
from conftest import wait_until


def _artifact(client, title='fav'):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    run = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status') == 'done',
               timeout=30)
    return client.post(f'/api/sessions/{sid}/save_artifact', json={'title': title}).get_json()


def test_favorites_and_tags(client):
    a1 = _artifact(client, 'starred one')
    a2 = _artifact(client, 'plain one')

    assert client.post(f"/api/artifacts/{a1['id']}/favorite").status_code == 200
    assert client.put(f"/api/artifacts/{a1['id']}/tags",
                      json={'tags': ['revenue', 'q3']}).status_code == 200
    assert client.put(f"/api/artifacts/{a2['id']}/tags",
                      json={'tags': 'nope'}).status_code == 400

    favs = client.get('/api/artifacts?favorite=1').get_json()
    assert favs['total'] == 1 and favs['items'][0]['id'] == a1['id']
    assert favs['items'][0]['favorite'] == 1
    assert set(favs['items'][0]['tags']) == {'revenue', 'q3'}

    tagged = client.get('/api/artifacts?tag=revenue').get_json()
    assert tagged['total'] == 1 and tagged['items'][0]['id'] == a1['id']

    # unfavorite toggles off
    client.post(f"/api/artifacts/{a1['id']}/favorite")
    assert client.get('/api/artifacts?favorite=1').get_json()['total'] == 0


def test_activity_feed_records_interactions(client):
    art = _artifact(client, 'watched')
    client.get(f"/api/artifacts/{art['id']}")                       # view
    client.post(f"/api/artifacts/{art['id']}/shares",
                json={'email': 'kim@acme.com'})                     # share
    client.post(f"/api/artifacts/{art['id']}/annotations",
                json={'timestamp': '2024-01-05', 'text': 'note'})   # annotate
    client.post(f"/api/artifacts/{art['id']}/subscriptions",
                json={'metric': 'mape', 'threshold': 5})            # subscribe
    client.post(f"/api/artifacts/{art['id']}/favorite")             # favorite

    feed = client.get(f"/api/artifacts/{art['id']}/activity").get_json()
    kinds = [e['kind'] for e in feed]
    for k in ('viewed', 'shared', 'annotated', 'subscribed', 'favorited'):
        assert k in kinds, k
    for e in feed:
        assert 'actor' in e and e['created_at']
    assert client.get('/api/artifacts/99999/activity').status_code == 404
