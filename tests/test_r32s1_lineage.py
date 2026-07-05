"""
R32S1E5-US1 (backend) — lineage graph covers all six node kinds: the
connection itself becomes a source node feeding root tables, accepted
metric definitions join the graph, and table nodes carry row counts so
the details panel is fully live.
"""
from conftest import wait_until


def _governed_connection(client):
    conn = client.post('/api/connections', json={'type': 'snowflake', 'account': 'd',
                                                 'username': 'd', 'password': 'd'}).get_json()
    rid = client.post('/api/governance/run', json={'connectionId': conn['id']}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/governance/{rid}').get_json().get('status')
               in ('done', 'complete'), timeout=30)
    return conn['id'], rid


def test_lineage_has_source_metric_and_rowcounts(client):
    cid, rid = _governed_connection(client)
    items = client.get(f'/api/reviews/{rid}').get_json()
    metric = next(i for i in items if (i['type'] or '').lower() == 'metric')
    client.post(f"/api/reviews/items/{metric['id']}", json={'action': 'accept'})

    g = client.get(f'/api/lineage/{cid}').get_json()
    kinds = {n['kind'] for n in g['nodes']}
    assert {'source', 'table', 'metric'} <= kinds

    src = next(n for n in g['nodes'] if n['kind'] == 'source')
    assert any(e['from'] == src['id'] for e in g['edges'])          # source feeds roots

    mnode = next(n for n in g['nodes'] if n['kind'] == 'metric')
    assert metric['name'] in mnode['label']
    assert any(e['to'] == mnode['id'] for e in g['edges'])          # something defines it

    tables = [n for n in g['nodes'] if n['kind'] == 'table']
    assert tables and all('row_count' in t for t in tables)
