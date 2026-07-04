"""
R3S2E3-US1 — Calculated metrics (safe arithmetic over measures) + formats
"""
from conftest import wait_until


def _schema_ready(client):
    cid = client.post('/api/connections', json={
        'type': 'snowflake', 'name': 'cm', 'account': 'a', 'username': 'u',
        'password': 'p'}).get_json()['id']
    before = len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json() or [])
    client.post('/api/governance/run', json={'connectionId': cid})
    wait_until(lambda: len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json()
                           or []) > before)
    client.post('/api/semantic/default/generate', json={'connectionId': cid})
    return cid


def test_calculated_metric_creation(client):
    _schema_ready(client)
    r = client.post('/api/semantic/default/metrics/calculated', json={
        'name': 'revenue_per_second', 'expr': 'net_revenue / duration_sec',
        'format': 'currency'})
    assert r.status_code == 201
    out = r.get_json()
    assert out['version']
    schema = client.get('/api/semantic/default/schema').get_json()['schema']
    all_measures = {m['name']: m for c in schema['cubes'] for m in c['measures']}
    calc = all_measures['revenue_per_second']
    assert calc['aggregation'] == 'derived'
    assert calc['sql'] == 'net_revenue / duration_sec'
    assert calc['format'] == 'currency'
    assert calc['calculated'] is True

    # duplicate name rejected
    assert client.post('/api/semantic/default/metrics/calculated', json={
        'name': 'revenue_per_second', 'expr': 'net_revenue * 2'}).status_code == 400


def test_calculated_metric_expression_safety(client):
    _schema_ready(client)
    for bad_expr in ('made_up_metric * 2', 'net_revenue; DROP TABLE x',
                     '__import__("os")', 'net_revenue +', ''):
        r = client.post('/api/semantic/default/metrics/calculated', json={
            'name': 'bad_metric', 'expr': bad_expr})
        assert r.status_code == 400, bad_expr
    r = client.post('/api/semantic/default/metrics/calculated', json={
        'name': 'ok', 'expr': 'net_revenue * 2', 'format': 'weird-format'})
    assert r.status_code == 400


def test_metric_value_formatting():
    import artifact_gen as ag
    assert ag.format_value(1234.5, 'currency') == '$1,234.50'
    assert ag.format_value(0.0875, 'percent') == '8.75%'
    assert ag.format_value(3661, 'duration') == '1h 1m'
    assert ag.format_value(12847, 'count') == '12,847'
    assert ag.format_value(42, None) == '42'
