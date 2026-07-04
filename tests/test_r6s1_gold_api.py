"""
R6S1E1-US1 — gold.predictions / gold.forecast persistence + paginated gold query API
"""
from conftest import wait_until


def _run(client):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    run = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status') == 'done',
               timeout=30)
    return sid, run['runId']


def test_pipeline_writes_gold_output_tables(client, db):
    sid, run_id = _run(client)
    preds = db.execute('SELECT COUNT(*) c FROM gold_predictions WHERE pipeline_run_id=?',
                       (run_id,)).fetchone()['c']
    fc = db.execute('SELECT COUNT(*) c FROM gold_forecast WHERE pipeline_run_id=?',
                    (run_id,)).fetchone()['c']
    assert preds == 76          # rows with actuals
    assert fc == 14             # forecast horizon rows
    row = db.execute('SELECT * FROM gold_forecast LIMIT 1').fetchone()
    assert row['ci_low'] < row['predicted'] < row['ci_high']


def test_gold_query_api_pagination_and_filters(client):
    sid, run_id = _run(client)
    r = client.get('/api/gold/default/gold_predictions?per_page=10&page=1')
    assert r.status_code == 200
    out = r.get_json()
    assert len(out['rows']) == 10
    assert out['total'] == 76
    assert out['page'] == 1

    p2 = client.get('/api/gold/default/gold_predictions?per_page=10&page=2').get_json()
    assert p2['rows'][0]['day_index'] != out['rows'][0]['day_index']

    f = client.get(f'/api/gold/default/gold_forecast?filter_col=pipeline_run_id'
                   f'&filter_val={run_id}').get_json()
    assert f['total'] == 14

    # second identical call served from cache
    c2 = client.get('/api/gold/default/gold_predictions?per_page=10&page=1').get_json()
    assert c2['cached'] is True

    assert client.get('/api/gold/default/users').status_code == 404       # not a gold table
    assert client.get('/api/gold/default/gold_predictions?filter_col=nope&filter_val=1'
                      ).status_code == 400
    assert client.get('/api/gold/default/gold_predictions?page=zap').status_code == 400
