"""
Sprint 3 — Semantic Layer Construction
  F-011 Semantic layer builder (manifest → cube_schema)
  F-012 Semantic schema storage, semver versioning, diff, rollback
  F-013 Explore editor API (create/edit/validate, dry-run preview)
  F-014 Human review queue backend + ML pipeline blocking
"""
import json

from conftest import wait_until


def _mk_connection(client):
    return client.post('/api/connections', json={
        'name': 'sem-test', 'type': 'snowflake', 'account': 'acct',
        'username': 'u', 'password': 'p'}).get_json()['id']


def _run_governance(client, cid):
    run_id = client.post('/api/governance/run', json={'connectionId': cid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/governance/{run_id}').get_json().get('status') == 'done')
    wait_until(lambda: client.get(f'/api/integrations/{cid}/manifest').status_code == 200)
    return run_id


SAMPLE_MANIFEST = {
    'manifest_version': '1.0.0', 'workspace_id': 'default', 'integration_id': 1,
    'tables': [
        {'name': 'fact_revenue', 'schema': 'CORE', 'dq_gate_status': 'PASS', 'health_score': 98,
         'columns': [
             {'name': 'revenue_id', 'semantic_type': 'id', 'confidence': 'high'},
             {'name': 'location_id', 'semantic_type': 'id', 'null_pct': 3.5},
             {'name': 'day', 'semantic_type': 'date'},
             {'name': 'net_revenue', 'semantic_type': 'measure', 'confidence': 'high'},
         ]},
        {'name': 'dim_location', 'schema': 'CORE', 'dq_gate_status': 'PASS', 'health_score': 94,
         'columns': [
             {'name': 'location_id', 'semantic_type': 'id'},
             {'name': 'city', 'semantic_type': 'dimension'},
             {'name': 'net_revenue', 'semantic_type': 'measure'},  # duplicate metric name
         ]},
    ],
    'definitions': [
        {'type': 'Metric', 'name': 'Net Revenue', 'confidence': 0.71},
        {'type': 'Metric', 'name': 'Conversion Rate', 'confidence': 0.64},
    ],
    'lineage_edges': [],
}


# ── F-011 generator ──────────────────────────────────────
def test_cube_schema_generation_measures_dimensions_and_confidence():
    import semantic_layer as sl
    schema = sl.build_cube_schema(SAMPLE_MANIFEST)
    cubes = {c['name']: c for c in schema['cubes']}
    assert set(cubes) == {'fact_revenue', 'dim_location'}

    fr = cubes['fact_revenue']
    m = {x['name']: x for x in fr['measures']}
    assert 'net_revenue' in m
    assert m['net_revenue']['aggregation'] == 'sum'
    assert m['net_revenue']['sql'] == 'net_revenue'
    d = {x['name']: x for x in fr['dimensions']}
    assert d['day']['type'] == 'time'
    assert d['day']['is_primary_date'] is True
    for meas in fr['measures']:
        assert meas['confidence'] in ('high', 'medium', 'low')
    # low/medium confidence → not allowed for ML until review
    assert all(('ml_allowed' in meas) for meas in fr['measures'])


def test_cube_schema_dedupes_metrics_and_infers_joins():
    import semantic_layer as sl
    schema = sl.build_cube_schema(SAMPLE_MANIFEST)
    # net_revenue appears in both tables → deduplicated to the prioritized source
    owners = [(c['name'], m['name']) for c in schema['cubes'] for m in c['measures']
              if m['name'] == 'net_revenue']
    assert len(owners) == 1
    assert schema['notes']  # dedup note documented

    fr = next(c for c in schema['cubes'] if c['name'] == 'fact_revenue')
    joins = {j['to']: j for j in fr['joins']}
    assert 'dim_location' in joins  # inferred from location_id convention
    j = joins['dim_location']
    assert j['on'] == 'location_id'
    assert j['join_type'] == 'left'          # null_pct 3.5 > 2 → left join
    assert 'null_pct' in (j.get('note') or '')


def test_cube_schema_validator_structured_errors():
    import semantic_layer as sl
    ok_schema = sl.build_cube_schema(SAMPLE_MANIFEST)
    assert sl.validate_cube_schema(ok_schema) == []

    bad = json.loads(json.dumps(ok_schema))
    fr = next(c for c in bad['cubes'] if c['name'] == 'fact_revenue')
    bad['cubes'].append(fr)                                   # duplicate cube name
    fr['measures'][0].pop('sql', None)                        # missing sql
    fr['joins'] = [{'to': 'nope', 'on': 'x', 'join_type': 'inner'}]
    errs = sl.validate_cube_schema(bad)
    codes = {e['code'] for e in errs}
    assert 'duplicate_cube' in codes
    assert 'missing_sql' in codes
    assert 'unknown_join_target' in codes


def test_cube_schema_output_is_deterministic():
    import semantic_layer as sl
    a = json.dumps(sl.build_cube_schema(SAMPLE_MANIFEST), sort_keys=True)
    b = json.dumps(sl.build_cube_schema(SAMPLE_MANIFEST), sort_keys=True)
    assert a == b


# ── F-012 storage + semver ───────────────────────────────
def test_semantic_schema_persist_versions_diff_rollback(client):
    cid = _mk_connection(client)
    _run_governance(client, cid)

    r = client.post('/api/semantic/default/generate', json={'connectionId': cid})
    assert r.status_code == 201
    assert r.get_json()['version'] == '1.0.0'

    # regenerate with unchanged manifest → patch bump
    r = client.post('/api/semantic/default/generate', json={'connectionId': cid})
    assert r.get_json()['version'] == '1.0.1'

    # structural change via explore creation → major bump
    r = client.post('/api/semantic/default/explores', json={
        'name': 'custom_explore', 'sql_table': 'gold_custom',
        'measures': [{'name': 'total_x', 'sql': 'x', 'aggregation': 'sum'}],
        'dimensions': [{'name': 'day', 'sql': 'day', 'type': 'time'}],
    })
    assert r.status_code == 201
    assert r.get_json()['version'] == '2.0.0'

    versions = [v['version'] for v in client.get('/api/semantic/default/schema/versions').get_json()]
    assert versions == ['2.0.0', '1.0.1', '1.0.0']

    diff = client.get('/api/semantic/default/schema/diff?from=1.0.1&to=2.0.0').get_json()
    assert 'custom_explore' in diff['added_cubes']

    r = client.post('/api/semantic/default/schema/rollback', json={'version': '1.0.1'})
    assert r.status_code == 200
    assert r.get_json()['version'] == '3.0.0'  # rollback is forward-only (structure change => major)
    latest = client.get('/api/semantic/default/schema').get_json()
    assert 'custom_explore' not in [c['name'] for c in latest['schema']['cubes']]


def test_semantic_schema_404_and_version_query(client):
    assert client.get('/api/semantic/default/schema').status_code == 404
    cid = _mk_connection(client)
    _run_governance(client, cid)
    client.post('/api/semantic/default/generate', json={'connectionId': cid})
    r = client.get('/api/semantic/default/schema?version=1.0.0')
    assert r.status_code == 200
    assert client.get('/api/semantic/default/schema?version=3.3.3').status_code == 404


# ── F-013 explore editor ─────────────────────────────────
def test_explore_editor_create_validation_and_dry_run(client):
    cid = _mk_connection(client)
    _run_governance(client, cid)
    client.post('/api/semantic/default/generate', json={'connectionId': cid})

    # invalid create → 400 structured errors, no version bump
    r = client.post('/api/semantic/default/explores', json={
        'name': 'fact_revenue',  # duplicate
        'measures': [{'name': 'm1', 'aggregation': 'sum'}],  # missing sql
    })
    assert r.status_code == 400
    codes = {e['code'] for e in r.get_json()['errors']}
    assert 'duplicate_cube' in codes and 'missing_sql' in codes

    # dry-run edit: validation preview only, no persistence
    before = client.get('/api/semantic/default/schema').get_json()['version']
    r = client.patch('/api/semantic/default/explores/fact_revenue',
                     json={'dry_run': True,
                           'measures': [{'name': 'bad', 'aggregation': 'sum'}]})
    assert r.status_code == 200
    assert r.get_json()['valid'] is False
    assert client.get('/api/semantic/default/schema').get_json()['version'] == before

    # real edit (definition-level) → minor bump
    r = client.patch('/api/semantic/default/explores/fact_revenue',
                     json={'description': 'Revenue facts at location · day grain'})
    assert r.status_code == 200
    v = r.get_json()['version']
    maj, minor, patch = (int(x) for x in v.split('.'))
    assert (minor, patch) >= (1, 0) and v != before

    # unknown explore → 404
    assert client.patch('/api/semantic/default/explores/nope',
                        json={'description': 'x'}).status_code == 404


# ── F-014 review queue ───────────────────────────────────
def test_review_queue_lists_low_confidence_pending(client):
    cid = _mk_connection(client)
    run_id = _run_governance(client, cid)
    queue = client.get(f'/api/reviews/{run_id}').get_json()
    assert queue  # sim data has low-confidence defs
    assert all(item['confidence'] < 0.70 for item in queue)
    assert all(item['status'] == 'pending' for item in queue)


def test_review_actions_accept_edit_reject_with_rbac(client, db):
    cid = _mk_connection(client)
    run_id = _run_governance(client, cid)
    queue = client.get(f'/api/reviews/{run_id}').get_json()
    a, b, c = queue[0]['id'], queue[1]['id'], queue[2]['id']

    # viewer cannot review
    assert client.post(f'/api/reviews/items/{a}', json={'action': 'accept'},
                       headers={'X-User-Role': 'viewer'}).status_code == 403

    r = client.post(f'/api/reviews/items/{a}', json={'action': 'accept'})
    assert r.status_code == 200
    assert r.get_json()['status'] == 'accepted'
    assert r.get_json()['confidence'] >= 0.9  # accept marks high confidence

    r = client.post(f'/api/reviews/items/{b}',
                    json={'action': 'edit', 'definition': 'Better definition text.'})
    assert r.get_json()['definition'] == 'Better definition text.'
    assert r.get_json()['status'] == 'accepted'

    r = client.post(f'/api/reviews/items/{c}', json={'action': 'reject'})
    assert r.get_json()['status'] == 'rejected'

    # invalid action → 400
    assert client.post(f'/api/reviews/items/{a}', json={'action': 'zap'}).status_code == 400

    acts = {r_['action'] for r_ in db.execute(
        "SELECT action FROM audit_logs WHERE resource_type='semantic_definition'").fetchall()}
    assert {'semantic.accepted', 'semantic.edited', 'semantic.rejected'} <= acts

    # queue now empty
    assert client.get(f'/api/reviews/{run_id}').get_json() == []


def test_pipeline_blocked_until_low_confidence_reviewed(client, db):
    cid = _mk_connection(client)
    run_id = _run_governance(client, cid)
    sid = client.post('/api/sessions', json={'connectionId': cid, 'runId': run_id,
                                             'metric': 'Net Revenue'}).get_json()['id']

    r = client.post('/api/pipeline/run', json={'sessionId': sid})
    assert r.status_code == 409
    body = r.get_json()
    assert body['error'] == 'human_review_required'
    assert body['pending_reviews']  # actionable detail
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='pipeline.blocked'").fetchone()

    # clear the queue → pipeline may start
    for item in client.get(f'/api/reviews/{run_id}').get_json():
        client.post(f"/api/reviews/items/{item['id']}", json={'action': 'accept'})
    r = client.post('/api/pipeline/run', json={'sessionId': sid})
    assert r.status_code == 201
    run = r.get_json()
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status') == 'done',
               timeout=20)
