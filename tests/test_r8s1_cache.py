"""
R8S1E2-US1 — Intelligent Caching Hierarchy (Architecture v2.1 §17.7.3)

Independent cache layers (semantic / query / spec / artifact) whose keys embed
governance-manifest and semantic-layer versions, so a version change
invalidates the minimum necessary set. Provider: Redis when REDIS_URL is set,
else in-process + SQLite fallback.
"""
import time

from conftest import wait_until


def _run_pipeline(client):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    run = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status') == 'done',
               timeout=30)
    return sid, run['runId']


def test_stats_endpoint_reports_four_layers(client):
    r = client.get('/api/platform/cache')
    assert r.status_code == 200
    layers = r.get_json()['layers']
    assert set(layers) == {'semantic', 'query', 'spec', 'artifact'}
    for name, s in layers.items():
        assert {'entries', 'hits', 'misses', 'hit_rate'} <= set(s)


def test_platform_status_includes_cache_mode(client):
    body = client.get('/api/platform/status').get_json()
    services = body.get('services', body)
    assert 'cache' in services
    mode = services['cache'] if isinstance(services['cache'], str) else services['cache'].get('mode')
    assert mode == 'local'          # zero-key fallback active


def test_gold_reads_flow_through_query_layer(client, db):
    sid, run_id = _run_pipeline(client)
    r1 = client.get('/api/gold/default/gold_predictions?per_page=5').get_json()
    assert r1['cached'] is False
    r2 = client.get('/api/gold/default/gold_predictions?per_page=5').get_json()
    assert r2['cached'] is True
    assert r2['rows'] == r1['rows']

    stats = client.get('/api/platform/cache').get_json()['layers']['query']
    assert stats['hits'] >= 1 and stats['misses'] >= 1
    assert stats['entries'] >= 1


def test_ttl_expiry(db):
    import cache_hier as ch
    ch.put(db, 'query', 'default', ['t1'], {'v': 1}, ttl=0.05)
    assert ch.get(db, 'query', 'default', ['t1']) == {'v': 1}
    time.sleep(0.08)
    assert ch.get(db, 'query', 'default', ['t1']) is None


def test_semantic_version_bump_invalidates_minimum_set(db):
    import cache_hier as ch
    # w1 query entry under sem 1.0.0; w2 query entry under its own 2.0.0;
    # w1 artifact entry keyed by artifact file version (not sem version)
    ch.put(db, 'query', 'w1', ['gold_predictions', 'p1'], {'rows': [1]},
           gov_version='1.0.0', sem_version='1.0.0')
    ch.put(db, 'query', 'w2', ['gold_predictions', 'p1'], {'rows': [2]},
           gov_version='1.0.0', sem_version='2.0.0')
    ch.put(db, 'artifact', 'w1', ['artifact', '7', 'v1'], {'html': 'x'})

    assert ch.get(db, 'query', 'w1', ['gold_predictions', 'p1'],
                  gov_version='1.0.0', sem_version='1.0.0') is not None

    # semantic definition change in w1 → its version advances
    new_sem = '1.1.0'
    assert ch.get(db, 'query', 'w1', ['gold_predictions', 'p1'],
                  gov_version='1.0.0', sem_version=new_sem) is None      # invalidated
    assert ch.get(db, 'query', 'w2', ['gold_predictions', 'p1'],
                  gov_version='1.0.0', sem_version='2.0.0') is not None  # ws survives
    assert ch.get(db, 'artifact', 'w1', ['artifact', '7', 'v1']) is not None  # layer survives


def test_explicit_invalidate_by_layer(db):
    import cache_hier as ch
    ch.put(db, 'spec', 'default', ['c1'], {'mark': 'line'})
    ch.put(db, 'artifact', 'default', ['a1'], {'html': 'y'})
    n = ch.invalidate(db, layer='spec')
    assert n == 1
    assert ch.get(db, 'spec', 'default', ['c1']) is None
    assert ch.get(db, 'artifact', 'default', ['a1']) is not None
