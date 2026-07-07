"""R41S1E1-US1 — the dashboard patch engine (deep-dive §6 chat authoring):
classified ops (layout instant · semantic marks dependents stale), validated
before apply, versioned, audited, with per-op explanations for the preview."""
import json

from conftest import wait_until


def _ready(client):
    conn = client.post('/api/connections', json={'type': 'snowflake', 'account': 'pat',
                                                 'username': 'u', 'password': 'p'}).get_json()
    p = client.post('/api/sessions/plan',
                    json={'message': 'Forecast net revenue for the next 14 days'}).get_json()
    sid = client.post('/api/sessions', json={'metric': p['target_metric'],
                                             'connectionId': conn['id']}).get_json()['id']
    client.post(f'/api/sessions/{sid}/spec', json=p)
    return sid


def test_layout_patch_is_instant_and_classified(client, db):
    sid = _ready(client)
    v = client.get(f'/api/sessions/{sid}/dashboard-spec').get_json()['spec_version']
    r = client.post(f'/api/sessions/{sid}/dashboard-patch',
                    json={'ops': [{'op': 'layout',
                                   'component_id': 'forecast',
                                   'cell': {'x': 0, 'y': 0, 'w': 6, 'h': 4}}]})
    assert r.status_code == 200
    d = r.get_json()
    assert d['classification'] == 'layout'
    assert d['stale_components'] == []
    assert d['spec_version'] == v + 1
    assert d['ops'][0]['summary']                      # explained for the preview
    assert db.execute('SELECT COUNT(*) c FROM pipeline_runs').fetchone()['c'] == 0


def test_semantic_patch_marks_dependents_stale(client):
    sid = _ready(client)
    r = client.post(f'/api/sessions/{sid}/dashboard-patch',
                    json={'ops': [{'op': 'semantic', 'field': 'grain',
                                   'value': 'weekly'}]})
    assert r.status_code == 200
    d = r.get_json()
    assert d['classification'] == 'semantic'
    assert len(d['stale_components']) >= 3             # metric components affected

    head = client.get(f'/api/sessions/{sid}/dashboard-spec').get_json()['spec']
    assert head['analysis']['grain'] == 'weekly'
    stale = {c['id'] for c in head['components'] if c.get('stale')}
    assert set(d['stale_components']) == stale


def test_add_and_remove_ops_flow_through_registry_semantics(client):
    sid = _ready(client)
    r = client.post(f'/api/sessions/{sid}/dashboard-patch',
                    json={'ops': [{'op': 'add_component',
                                   'component': {'type': 'bar',
                                                 'title': 'Patched-in bars',
                                                 'metric_refs': ['net_revenue']}}]})
    assert r.status_code == 200
    cid = r.get_json()['ops'][0]['component_id']
    head = client.get(f'/api/sessions/{sid}/dashboard-spec').get_json()['spec']
    assert cid in {c['id'] for c in head['components']}

    r2 = client.post(f'/api/sessions/{sid}/dashboard-patch',
                     json={'ops': [{'op': 'remove_component', 'component_id': cid}]})
    assert r2.status_code == 200
    head2 = client.get(f'/api/sessions/{sid}/dashboard-spec').get_json()['spec']
    assert cid not in {c['id'] for c in head2['components']}


def test_invalid_ops_store_nothing(client):
    sid = _ready(client)
    v = client.get(f'/api/sessions/{sid}/dashboard-spec').get_json()['spec_version']
    r = client.post(f'/api/sessions/{sid}/dashboard-patch',
                    json={'ops': [{'op': 'add_component',
                                   'component': {'type': 'bar', 'title': 'X',
                                                 'metric_refs': ['ghost']}}]})
    assert r.status_code == 422
    assert client.get(f'/api/sessions/{sid}/dashboard-spec').get_json()['spec_version'] == v


def test_chat_messages_plan_deterministic_patches(client):
    """R41S1E2 — post-build chat becomes patch intent (doc §6 table)."""
    sid = _ready(client)

    r = client.post(f'/api/sessions/{sid}/chat-patch',
                    json={'message': 'Add net revenue as a KPI'}).get_json()
    assert r['ops'] and r['ops'][0]['op'] == 'add_component'
    assert r['ops'][0]['component']['type'] == 'kpi'
    assert r['ops'][0]['component']['metric_refs'] == ['net_revenue']
    assert r['material'] is True

    r2 = client.post(f'/api/sessions/{sid}/chat-patch',
                     json={'message': 'Use weekly instead of daily'}).get_json()
    assert r2['ops'][0] == {'op': 'semantic', 'field': 'grain', 'value': 'weekly'}
    assert r2['material'] is True

    r3 = client.post(f'/api/sessions/{sid}/chat-patch',
                     json={'message': 'Make the forecast wider'}).get_json()
    assert r3['ops'][0]['op'] == 'layout'
    assert r3['ops'][0]['component_id'] == 'forecast'
    assert r3['material'] is False                      # layout-only: instant

    r4 = client.post(f'/api/sessions/{sid}/chat-patch',
                     json={'message': 'Turn the dimension breakdown into a table'}).get_json()
    assert r4['ops'][0]['op'] == 'modify_component'
    assert r4['ops'][0]['changes'] == {'type': 'table'}

    # unresolved metrics come back as a visible checklist, never a bad op
    r5 = client.post(f'/api/sessions/{sid}/chat-patch',
                     json={'message': 'Add frobnication rate as a KPI'}).get_json()
    assert r5['ops'] == []
    assert r5['unresolved']


def test_selective_recompute_reruns_only_stale(client, db):
    """R41S1E3 — a semantic patch reruns exactly the dependent components;
    untouched components keep their data; stale flags clear."""
    import json as _json
    sid = _ready(client)
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done',
               timeout=30)

    before = {r['component_id']: (r['query_hash'], r['rows_json']) for r in db.execute(
        'SELECT component_id, query_hash, rows_json FROM component_data '
        'WHERE run_id=? ORDER BY id', (rid,)).fetchall()}

    # stale exactly one component: forecast switches to weekly buckets
    r = client.post(f'/api/sessions/{sid}/dashboard-patch',
                    json={'ops': [{'op': 'modify_component', 'component_id': 'forecast',
                                   'changes': {'query_spec': {'grain': 'weekly'}}}]})
    assert r.get_json()['stale_components'] == ['forecast']

    rc = client.post(f'/api/sessions/{sid}/recompute')
    assert rc.status_code == 200
    d = rc.get_json()
    assert d['recomputed'] == ['forecast']

    after = {r['component_id']: (r['query_hash'], r['rows_json']) for r in db.execute(
        '''SELECT component_id, query_hash, rows_json FROM component_data cd
           WHERE run_id=? AND id = (SELECT MAX(id) FROM component_data
                                    WHERE run_id=? AND component_id=cd.component_id)''',
        (rid, rid)).fetchall()}
    assert after['forecast'][0] != before['forecast'][0]          # new query
    rows = _json.loads(after['forecast'][1])
    assert any('W' in str(x[0]) for x in rows)                    # weekly buckets
    assert after['timeseries_ci'] == before['timeseries_ci']      # untouched

    head = client.get(f'/api/sessions/{sid}/dashboard-spec').get_json()['spec']
    assert not any(c.get('stale') for c in head['components'])


def test_session_hydration_restores_the_workbench(client):
    """R41S1E4 (deep-dive F-12) — deep-linking a session returns messages,
    the confirmed plan, runs, the artifact, and the spec head."""
    conn = client.post('/api/connections', json={'type': 'snowflake', 'account': 'hyd',
                                                 'username': 'u', 'password': 'p'}).get_json()
    p = client.post('/api/sessions/plan',
                    json={'message': 'Forecast net revenue for the next 14 days'}).get_json()
    sid = client.post('/api/sessions', json={'metric': p['target_metric'],
                                             'connectionId': conn['id']}).get_json()['id']
    client.post(f'/api/sessions/{sid}/spec', json=p)
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done',
               timeout=30)
    art = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'H'}).get_json()

    h = client.get(f'/api/sessions/{sid}/hydrate')
    assert h.status_code == 200
    d = h.get_json()
    assert any(m['role'] == 'user' and 'net revenue' in m['text'].lower()
               for m in d['messages'])
    assert d['plan']['target_metric'] == 'Net Revenue'
    assert d['runs'] and d['runs'][0]['id'] == rid
    assert d['artifact']['id'] == art['id']
    assert d['spec_version'] >= 1
