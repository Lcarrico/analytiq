"""
R3S2E1-US1 — Lineage: manifest edges populated + DAG endpoint w/ downstream artifacts
"""
from conftest import wait_until


def _mk(client):
    return client.post('/api/connections', json={
        'type': 'snowflake', 'name': 'lin', 'account': 'a', 'username': 'u',
        'password': 'p'}).get_json()['id']


def _gov(client, cid):
    before = len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json() or [])
    run_id = client.post('/api/governance/run', json={'connectionId': cid}).get_json()['runId']
    wait_until(lambda: len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json()
                           or []) > before)
    return run_id


def test_manifest_lineage_edges_populated(client):
    cid = _mk(client)
    _gov(client, cid)
    m = client.get(f'/api/integrations/{cid}/manifest').get_json()
    edges = m['lineage_edges']
    assert edges
    pairs = {(e['from'], e['to']) for e in edges}
    assert ('fact_revenue', 'dim_location') in pairs      # via location_id
    assert ('fact_sessions', 'dim_customer') in pairs     # via customer_id
    assert all(e['on'] for e in edges)


def test_lineage_dag_endpoint_with_downstream_artifacts(client):
    cid = _mk(client)
    run_id = _gov(client, cid)

    # produce a downstream artifact tied to this connection's session
    for item in client.get(f'/api/reviews/{run_id}').get_json():
        client.post(f"/api/reviews/items/{item['id']}", json={'action': 'accept'})
    sid = client.post('/api/sessions', json={'connectionId': cid, 'runId': run_id,
                                             'metric': 'Net Revenue'}).get_json()['id']
    run = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status') == 'done',
               timeout=30)
    art = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'Lineage art'}).get_json()

    dag = client.get(f'/api/lineage/{cid}').get_json()
    kinds = {n['kind'] for n in dag['nodes']}
    assert {'table', 'artifact'} <= kinds
    tbl_nodes = {n['id']: n for n in dag['nodes'] if n['kind'] == 'table'}
    assert 'fact_revenue' in tbl_nodes
    assert tbl_nodes['fact_revenue']['health_score'] == 98
    art_nodes = [n for n in dag['nodes'] if n['kind'] == 'artifact']
    assert any(n['label'] == 'Lineage art' for n in art_nodes)
    # artifact edge exists from a table to the artifact
    assert any(e['to'] == f"artifact:{art['id']}" for e in dag['edges'])

    assert client.get('/api/lineage/99999').status_code == 404
