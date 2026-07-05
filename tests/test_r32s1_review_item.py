"""
R32S1E3-US1 (backend) — GET /api/reviews/items/<id>: the definition-review
diff's data — the pending item, its accepted CURRENT counterpart (same name)
when one exists, and the affected built dashboards.
"""
from conftest import wait_until


def _run_governance(client):
    conn = client.post('/api/connections', json={'type': 'snowflake', 'account': 'd',
                                                 'username': 'd', 'password': 'd'}).get_json()
    rid = client.post('/api/governance/run', json={'connectionId': conn['id']}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/governance/{rid}').get_json().get('status')
               in ('done', 'complete'), timeout=30)
    return rid


def test_review_item_detail_shape(client):
    rid = _run_governance(client)
    items = client.get(f'/api/reviews/{rid}').get_json()
    assert items
    it = items[0]
    r = client.get(f"/api/reviews/items/{it['id']}")
    assert r.status_code == 200
    d = r.get_json()
    for k in ('item', 'current', 'affected_count', 'affected'):
        assert k in d
    assert d['item']['id'] == it['id']
    assert isinstance(d['affected'], list)
    assert client.get('/api/reviews/items/999999').status_code == 404
