"""
R32S2E1-US1 (backend) — semantic layer overview: workspace summary KPIs and
per-explore rows (tables, counts, health, confidence, used-by) computed from
the latest cube schema + governance manifest.
"""
from conftest import wait_until


def _governed(client):
    conn = client.post('/api/connections', json={'type': 'snowflake', 'account': 'd',
                                                 'username': 'd', 'password': 'd'}).get_json()
    rid = client.post('/api/governance/run', json={'connectionId': conn['id']}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/governance/{rid}').get_json().get('status')
               in ('done', 'complete'), timeout=30)
    wait_until(lambda: len(client.get(
        f"/api/integrations/{conn['id']}/manifest/versions").get_json()) >= 1, timeout=10)
    return conn['id']


def test_summary_and_explores(client):
    cid = _governed(client)
    gen = client.post('/api/semantic/default/generate', json={'connectionId': cid})
    assert gen.status_code == 201
    schema = gen.get_json()['schema']
    cubes = schema['cubes']

    s = client.get('/api/semantic/default/summary').get_json()
    assert s['exists'] is True
    assert s['version']            # semver string, e.g. '1.0.0'
    assert s['explores'] == len(cubes)
    assert s['metrics']['total'] == sum(len(c['measures']) for c in cubes)
    assert (s['metrics']['governed'] + s['metrics']['draft']) == s['metrics']['total']
    assert s['dimensions'] == sum(len(c['dimensions']) for c in cubes)
    assert s['join_paths'] == sum(len(c['joins']) for c in cubes)
    assert isinstance(s['conflicts'], int)
    assert s['manifest']['version']    # manifest semver string
    assert s['manifest']['status'] in ('ACTIVE', 'REVIEW REQUIRED', 'SUPERSEDED')

    ex = client.get('/api/semantic/default/explores').get_json()['explores']
    assert len(ex) == len(cubes)
    row = next(r for r in ex if r['metrics'] > 0)
    for k in ('name', 'tables', 'metrics', 'dimensions', 'joins',
              'health', 'confidence', 'used_by'):
        assert k in row
    assert isinstance(row['tables'], list) and row['tables']
    assert row['health'] is None or isinstance(row['health'], (int, float))
    assert 0 <= row['confidence'] <= 1
    assert isinstance(row['used_by'], int)


def test_summary_empty_workspace(client):
    s = client.get('/api/semantic/nonexistent-ws/summary').get_json()
    assert s['exists'] is False and s['explores'] == 0


def test_conflicts_endpoint(client):
    """R32S2E2: conflicted vocabulary — pending def sharing a name with an
    accepted def, with both ids so the UI can deep-link the diff screen."""
    cid1 = _governed(client)
    r1 = client.get('/api/governance/latest').get_json()['run_id']
    items = client.get(f'/api/reviews/{r1}').get_json()
    target = next(i for i in items if i['name'] == 'Conversion Rate')
    client.post(f"/api/reviews/items/{target['id']}", json={'action': 'accept'})

    cid2 = _governed(client)   # second run re-proposes the same names
    conflicts = client.get('/api/semantic/default/conflicts').get_json()['conflicts']
    row = next(c for c in conflicts if c['name'] == 'Conversion Rate')
    assert row['pending_id'] and row['accepted_id']
    assert 0 < row['pending_confidence'] < 1
