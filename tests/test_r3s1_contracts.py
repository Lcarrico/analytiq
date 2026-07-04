"""
R3S1E4-US1 — Data contract enforcement (required columns / SLAs → BLOCK)
"""
from conftest import wait_until


def _mk(client):
    return client.post('/api/connections', json={
        'type': 'snowflake', 'name': 'ct', 'account': 'a', 'username': 'u',
        'password': 'p'}).get_json()['id']


def _gov(client, cid):
    before = len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json() or [])
    run_id = client.post('/api/governance/run', json={'connectionId': cid}).get_json()['runId']
    wait_until(lambda: len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json()
                           or []) > before)
    return run_id


def test_contract_crud_and_validation(client):
    cid = _mk(client)
    r = client.put('/api/contracts', json={
        'connectionId': cid, 'table': 'fact_revenue',
        'required_columns': ['revenue_id', 'day'], 'min_rows': 100})
    assert r.status_code == 200
    lst = client.get(f'/api/contracts?connection_id={cid}').get_json()
    assert lst[0]['required_columns'] == ['revenue_id', 'day']

    assert client.put('/api/contracts', json={'table': 'x'}).status_code == 400
    assert client.put('/api/contracts', json={
        'connectionId': cid, 'table': 'x', 'required_columns': 'day'}).status_code == 400
    # viewer cannot define contracts
    assert client.put('/api/contracts', json={'connectionId': cid, 'table': 'x',
                                              'required_columns': []},
                      headers={'X-User-Role': 'viewer'}).status_code == 403


def test_contract_violation_blocks_table_and_pipeline(client, db):
    cid = _mk(client)
    client.put('/api/contracts', json={
        'connectionId': cid, 'table': 'dim_location',
        'required_columns': ['location_id', 'region_code']})  # region_code doesn't exist
    run_id = _gov(client, cid)

    m = client.get(f'/api/integrations/{cid}/manifest').get_json()
    dl = next(t for t in m['tables'] if t['name'] == 'dim_location')
    assert dl['dq_gate_status'] == 'BLOCK'
    assert any('region_code' in v for v in dl['contract_violations'])
    assert m['human_review_required'] is True
    assert client.get('/api/alerts?type=contract').get_json()

    # pipeline start blocked with contract detail (after clearing review queue)
    for item in client.get(f'/api/reviews/{run_id}').get_json():
        client.post(f"/api/reviews/items/{item['id']}", json={'action': 'accept'})
    sid = client.post('/api/sessions', json={'connectionId': cid, 'runId': run_id,
                                             'metric': 'Net Revenue'}).get_json()['id']
    r = client.post('/api/pipeline/run', json={'sessionId': sid})
    assert r.status_code == 409
    body = r.get_json()
    assert body['error'] == 'contract_violation'
    assert body['violations']


def test_satisfied_contract_does_not_block(client):
    cid = _mk(client)
    client.put('/api/contracts', json={
        'connectionId': cid, 'table': 'fact_revenue',
        'required_columns': ['revenue_id', 'day'], 'min_rows': 100})
    run_id = _gov(client, cid)
    m = client.get(f'/api/integrations/{cid}/manifest').get_json()
    fr = next(t for t in m['tables'] if t['name'] == 'fact_revenue')
    assert fr.get('contract_violations') in (None, [])
    assert fr['dq_gate_status'] == 'PASS'
