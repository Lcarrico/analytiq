"""
R3S2E6-US1 — Persistent derived tables + pre-aggregation recommendations
"""
import io

from conftest import wait_until

CSV = (b'order_id,amount,region\n1,10,east\n2,20,east\n3,30,west\n4,40,west\n')


def test_pdt_create_materialize_refresh(client, db):
    up = client.post('/api/uploads', data={'file': (io.BytesIO(CSV), 'sales.csv')},
                     content_type='multipart/form-data').get_json()

    r = client.post('/api/semantic/default/pdts', json={
        'name': 'region_totals',
        'sql': f'SELECT region, SUM(amount) AS total FROM {up["table"]} GROUP BY region'})
    assert r.status_code == 201
    out = r.get_json()
    assert out['table'] == 'pdt_region_totals'
    assert out['row_count'] == 2

    rows = db.execute('SELECT * FROM pdt_region_totals ORDER BY region').fetchall()
    assert [tuple(r_) for r_ in rows] == [('east', 30), ('west', 70)]

    # refresh rematerializes after source change
    db.execute(f'INSERT INTO {up["table"]} VALUES (5, 100, \'north\')')
    db.commit()
    r = client.post('/api/semantic/default/pdts/region_totals/refresh')
    assert r.status_code == 200
    assert r.get_json()['row_count'] == 3

    # unsafe SQL rejected
    for bad in ('DROP TABLE users', 'SELECT 1; DROP TABLE users',
                f'INSERT INTO {up["table"]} VALUES (9,9,"x")', ''):
        assert client.post('/api/semantic/default/pdts',
                           json={'name': 'evil', 'sql': bad}).status_code == 400
    # duplicate name rejected
    assert client.post('/api/semantic/default/pdts', json={
        'name': 'region_totals', 'sql': 'SELECT 1 AS one'}).status_code == 400

    pdts = client.get('/api/semantic/default/pdts').get_json()
    assert pdts[0]['name'] == 'region_totals'
    assert pdts[0]['last_refreshed_at']


def test_preagg_recommendations_from_query_patterns(client):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    run = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status') == 'done',
               timeout=30)
    art = client.post('/api/artifacts', json={'title': 'hot',
                                              'pipeline_run_id': run['runId']}).get_json()
    for _ in range(6):
        client.get(f"/api/artifacts/{art['id']}/chart")

    recs = client.get('/api/semantic/default/preagg_recommendations').get_json()
    assert recs
    top = recs[0]
    assert top['hits'] >= 6
    assert 'summary' in top['suggested_table']
    assert top['reason']
