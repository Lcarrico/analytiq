"""
R32S2E3-US1 (backend) — bounded field-picker preview: deterministic seeded
rows over schema-validated dimensions/measures, 100-row cap, elapsed time,
and a series-cardinality estimate that warns before a fan-out.
"""
from conftest import wait_until


def _seeded(client):
    conn = client.post('/api/connections', json={'type': 'snowflake', 'account': 'd',
                                                 'username': 'd', 'password': 'd'}).get_json()
    rid = client.post('/api/governance/run', json={'connectionId': conn['id']}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/governance/{rid}').get_json().get('status')
               in ('done', 'complete'), timeout=30)
    wait_until(lambda: len(client.get(
        f"/api/integrations/{conn['id']}/manifest/versions").get_json()) >= 1, timeout=10)
    r = client.post('/api/semantic/default/generate', json={'connectionId': conn['id']})
    return r.get_json()['schema']


def test_preview_bounded_and_deterministic(client):
    schema = _seeded(client)
    cube = next(c for c in schema['cubes'] if c['measures'] and c['dimensions'])
    dim, ms = cube['dimensions'][0]['name'], cube['measures'][0]['name']

    r = client.post('/api/semantic/default/preview',
                    json={'dimensions': [dim], 'measures': [ms]})
    assert r.status_code == 200
    d = r.get_json()
    assert d['columns'] == [dim, ms]
    assert 0 < len(d['rows']) <= 100 and d['capped'] is True
    assert d['elapsed_ms'] >= 0 and isinstance(d['series_estimate'], int)

    # deterministic: identical field set -> identical rows
    d2 = client.post('/api/semantic/default/preview',
                     json={'dimensions': [dim], 'measures': [ms]}).get_json()
    assert d2['rows'] == d['rows']

    # unknown fields rejected; empty selection rejected
    assert client.post('/api/semantic/default/preview',
                       json={'dimensions': ['nope'], 'measures': [ms]}).status_code == 400
    assert client.post('/api/semantic/default/preview',
                       json={'dimensions': [], 'measures': []}).status_code == 400


def test_preview_cardinality_warning(client):
    schema = _seeded(client)
    cubes = [c for c in schema['cubes'] if c['dimensions']]
    dims = [d['name'] for c in cubes for d in c['dimensions']][:6]
    ms = next(m['name'] for c in schema['cubes'] for m in c.get('measures', []))
    d = client.post('/api/semantic/default/preview',
                    json={'dimensions': dims, 'measures': [ms]}).get_json()
    # many dimensions multiply the series estimate; warning text appears
    assert d['series_estimate'] > 100
    assert d.get('warning')


def test_pdt_dry_run(client):
    _seeded(client)
    r = client.post('/api/semantic/default/pdts',
                    json={'name': 'drv_probe', 'sql': 'SELECT 1 AS one', 'dry_run': True})
    assert r.status_code == 200
    d = r.get_json()
    assert d['valid'] is True and d['row_count'] == 1 and d.get('dry_run') is True
    listing = client.get('/api/semantic/default/pdts').get_json()
    rows = listing if isinstance(listing, list) else listing.get('pdts', [])
    names = [p['name'] for p in rows]
    assert 'drv_probe' not in names                      # nothing persisted
    bad = client.post('/api/semantic/default/pdts',
                      json={'name': 'drv_bad', 'sql': 'DROP TABLE x', 'dry_run': True})
    assert bad.status_code == 400


def test_left_join_appears_for_nullable_fk(client):
    schema = _seeded(client)
    joins = [j for c in schema['cubes'] for j in c.get('joins', [])]
    assert any(j['join_type'] == 'left' for j in joins)   # fan-out risk surfaced
