"""
R3S1E5-US1 — Custom DQ test authoring (safe expression subset → SQL checks)
"""
import io


CSV = (b'order_id,amount,status\n1,10.5,new\n2,20.0,shipped\n3,,new\n')


def _upload(client):
    return client.post('/api/uploads', data={'file': (io.BytesIO(CSV), 'orders.csv')},
                       content_type='multipart/form-data').get_json()


def test_expression_compilation_and_safety(client):
    up = _upload(client)
    ok = client.post('/api/dq/tests', json={
        'connectionId': up['connection_id'], 'table': up['table'],
        'expression': 'amount > 0'})
    assert ok.status_code == 201
    body = ok.get_json()
    assert 'SELECT COUNT(*)' in body['compiled_sql']
    assert '"amount" > 0' in body['compiled_sql']

    for bad in ('amount > 0; DROP TABLE users', 'DELETE FROM x', "status = 'a' OR '1'='1",
                'not-a-col! > 3', 'amount >', ''):
        r = client.post('/api/dq/tests', json={
            'connectionId': up['connection_id'], 'table': up['table'], 'expression': bad})
        assert r.status_code == 400, bad

    # IS NOT NULL form supported
    r = client.post('/api/dq/tests', json={
        'connectionId': up['connection_id'], 'table': up['table'],
        'expression': 'amount IS NOT NULL'})
    assert r.status_code == 201


def test_running_tests_evaluates_real_data(client):
    up = _upload(client)
    cid = up['connection_id']
    client.post('/api/dq/tests', json={'connectionId': cid, 'table': up['table'],
                                       'expression': 'amount > 0'})
    client.post('/api/dq/tests', json={'connectionId': cid, 'table': up['table'],
                                       'expression': 'amount IS NOT NULL'})
    client.post('/api/dq/tests', json={'connectionId': cid, 'table': up['table'],
                                       'expression': "status != 'cancelled'"})

    r = client.post(f'/api/dq/tests/run?connection_id={cid}')
    assert r.status_code == 200
    results = {t['expression']: t for t in r.get_json()['results']}
    assert results['amount > 0']['status'] == 'PASS'
    assert results['amount IS NOT NULL']['status'] == 'FAIL'   # row 3 has a null
    assert results['amount IS NOT NULL']['violations'] == 1
    assert results["status != 'cancelled'"]['status'] == 'PASS'

    tests = client.get(f'/api/dq/tests?connection_id={cid}').get_json()
    assert len(tests) == 3
    assert all(t['last_status'] in ('PASS', 'FAIL') for t in tests)
