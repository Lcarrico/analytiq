"""R39S1E1-US1 — component registry + create/delete/duplicate as versioned
spec patches with real contracts (deep-dive F-05 server half)."""
import json

from conftest import wait_until


def _built(client):
    conn = client.post('/api/connections', json={'type': 'snowflake', 'account': 'reg',
                                                 'username': 'u', 'password': 'p'}).get_json()
    p = client.post('/api/sessions/plan',
                    json={'message': 'Forecast net revenue for the next 14 days'}).get_json()
    sid = client.post('/api/sessions', json={'metric': p['target_metric'],
                                             'connectionId': conn['id']}).get_json()['id']
    client.post(f'/api/sessions/{sid}/spec', json=p)
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done',
               timeout=30)
    return sid, rid


def test_create_component_appends_version_with_contract_and_data(client, db):
    sid, rid = _built(client)
    v_before = client.get(f'/api/sessions/{sid}/dashboard-spec').get_json()['spec_version']

    r = client.post(f'/api/sessions/{sid}/components',
                    json={'type': 'bar', 'title': 'Revenue by location',
                          'metric_refs': ['net_revenue']})
    assert r.status_code == 201
    d = r.get_json()
    cid = d['component']['id']
    assert d['spec_version'] == v_before + 1
    assert d['component']['type'] == 'bar'

    head = client.get(f'/api/sessions/{sid}/dashboard-spec').get_json()
    spec = head['spec']
    assert any(c['id'] == cid for c in spec['components'])
    placed = [g for g in spec['grid']['desktop'] if g['component_id'] == cid]
    assert placed and placed[0]['w'] >= 1                 # auto-placed on the grid

    qc = db.execute('SELECT * FROM query_contracts WHERE component_id=? AND run_id=?',
                    (cid, rid)).fetchone()
    assert qc and qc['sql'].lower().startswith('select')
    cd = db.execute('SELECT rows_json FROM component_data WHERE component_id=? AND run_id=?',
                    (cid, rid)).fetchone()
    assert cd and json.loads(cd['rows_json'])             # executed for real


def test_invalid_component_rejected_nothing_stored(client, db):
    sid, rid = _built(client)
    v = client.get(f'/api/sessions/{sid}/dashboard-spec').get_json()['spec_version']
    r = client.post(f'/api/sessions/{sid}/components',
                    json={'type': 'bar', 'title': 'X', 'metric_refs': ['ghost_metric']})
    assert r.status_code == 422
    assert client.get(f'/api/sessions/{sid}/dashboard-spec').get_json()['spec_version'] == v

    r2 = client.post(f'/api/sessions/{sid}/components',
                     json={'type': 'hologram', 'title': 'X', 'metric_refs': []})
    assert r2.status_code == 422


def test_delete_and_duplicate_are_versioned(client, db):
    sid, rid = _built(client)
    made = client.post(f'/api/sessions/{sid}/components',
                       json={'type': 'bar', 'title': 'Dup me',
                             'metric_refs': ['net_revenue']}).get_json()
    cid = made['component']['id']

    dup = client.post(f'/api/sessions/{sid}/components/{cid}/duplicate')
    assert dup.status_code == 201
    dup_id = dup.get_json()['component']['id']
    assert dup_id != cid
    spec = client.get(f'/api/sessions/{sid}/dashboard-spec').get_json()['spec']
    assert {c['id'] for c in spec['components']} >= {cid, dup_id}

    gone = client.delete(f'/api/sessions/{sid}/components/{cid}')
    assert gone.status_code == 200
    spec2 = client.get(f'/api/sessions/{sid}/dashboard-spec').get_json()['spec']
    assert cid not in {c['id'] for c in spec2['components']}
    assert all(g['component_id'] != cid for g in spec2['grid']['desktop'])
    assert dup_id in {c['id'] for c in spec2['components']}   # duplicate survives

    # mutations are role-gated like every other artifact mutation
    r = client.post(f'/api/sessions/{sid}/components',
                    json={'type': 'kpi', 'title': 'V', 'metric_refs': ['net_revenue']},
                    headers={'X-User-Role': 'viewer'})
    assert r.status_code == 403


def test_preview_accepts_inline_draft_component(client):
    """R39S1E2 read path: the builder previews a DRAFT before adding it."""
    sid, rid = _built(client)
    r = client.post(f'/api/sessions/{sid}/component-query/preview',
                    json={'component': {'type': 'bar', 'title': 'Draft bar',
                                        'metric_refs': ['net_revenue']}})
    assert r.status_code == 200
    d = r.get_json()
    assert d['row_count'] > 0 and d['sql'].lower().startswith('select')
    assert d['query_hash']

    bad = client.post(f'/api/sessions/{sid}/component-query/preview',
                      json={'component': {'type': 'hologram', 'title': 'X',
                                          'metric_refs': ['net_revenue']}})
    assert bad.status_code == 422


def test_create_returns_data_and_bridges_artifact_layout(client, db):
    """R39S1E2: the create response carries the executed rows, and an
    existing artifact's layout gains the new section (canvas bridge until
    the E3 renderer unification)."""
    import json as _json
    sid, rid = _built(client)
    art = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'B'}).get_json()

    r = client.post(f'/api/sessions/{sid}/components',
                    json={'type': 'bar', 'title': 'Revenue by location',
                          'metric_refs': ['net_revenue']}).get_json()
    assert r['data'] and len(r['data']) > 0               # real executed rows

    art2 = client.get(f"/api/artifacts/{art['id']}").get_json()
    sections = _json.loads(art2['layout_json'])['sections']
    assert any(s['id'] == r['component']['id'] for s in sections)


def test_spec_restore_makes_delete_reversible(client):
    """R39S1E2-US2 — deleting creates a reversible version: restoring an
    older version re-appends its content as the new head."""
    sid, rid = _built(client)
    made = client.post(f'/api/sessions/{sid}/components',
                       json={'type': 'bar', 'title': 'Keep me',
                             'metric_refs': ['net_revenue']}).get_json()
    cid = made['component']['id']
    v_with = made['spec_version']

    client.delete(f'/api/sessions/{sid}/components/{cid}')
    head = client.get(f'/api/sessions/{sid}/dashboard-spec').get_json()
    assert cid not in {c['id'] for c in head['spec']['components']}

    r = client.post(f'/api/sessions/{sid}/dashboard-spec/restore',
                    json={'version': v_with})
    assert r.status_code == 201
    restored = client.get(f'/api/sessions/{sid}/dashboard-spec').get_json()
    assert restored['spec_version'] == head['spec_version'] + 1   # append, not rewrite
    assert cid in {c['id'] for c in restored['spec']['components']}

    missing = client.post(f'/api/sessions/{sid}/dashboard-spec/restore',
                          json={'version': 999})
    assert missing.status_code == 404
