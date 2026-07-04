"""
R10S2E5-US1 — Automatic Semantic Evolution (Architecture v2.1 §17.3.4)

The semantic layer continuously proposes improvements to itself — new-metric
candidates, deprecations, renames, merges — queued for admin review. The
canonical schema NEVER auto-mutates (One-Metric-One-Definition, §1.1).
"""
import json


def _seed_schema(db, measures):
    schema = {'cubes': [{'name': 'fact_revenue',
                         'measures': [{'name': n, 'sql': s, 'aggregation': 'sum'}
                                      for n, s in measures],
                         'dimensions': [], 'joins': []}]}
    db.execute("INSERT INTO semantic_schemas (workspace_id, version, schema_json) "
               "VALUES ('default', '1.0.0', ?)", (json.dumps(schema),))
    db.commit()
    return schema


def _spec(client, sid, metric):
    return client.post(f'/api/sessions/{sid}/spec', json={
        'intent': 'predictive', 'intent_confidence': 0.9, 'analytic_goal': 'g',
        'target_metric': metric, 'feature_candidates': [],
        'date_range': {'start': '2023-01-01', 'end': '2023-12-31'},
        'grain': 'Location · Day', 'output_type': 'forecast_dashboard',
        'prediction_horizon': 14, 'explores_used': [],
        'semantic_layer_version': '1.0.0', 'governance_manifest_version': '1.0.0'})


def test_repeated_adhoc_metric_becomes_new_metric_candidate(client, db):
    _seed_schema(db, [('net_revenue', 'net_revenue')])
    for _ in range(3):
        sid = client.post('/api/sessions', json={'metric': 'Basket Size'}).get_json()['id']
        _spec(client, sid, 'Basket Size')
    r = client.post('/api/semantic/evolve')
    assert r.status_code == 200
    row = db.execute("SELECT * FROM semantic_proposals WHERE kind='new_metric'").fetchone()
    assert row is not None and row['subject'] == 'basket_size'
    assert json.loads(row['evidence_json'])['occurrences'] >= 3


def test_unreferenced_measure_becomes_deprecation_candidate(client, db):
    _seed_schema(db, [('net_revenue', 'net_revenue'), ('dead_metric', 'dead_metric')])
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    _spec(client, sid, 'Net Revenue')            # net_revenue is referenced
    client.post('/api/semantic/evolve')
    subs = {r['subject'] for r in db.execute(
        "SELECT * FROM semantic_proposals WHERE kind='deprecation'").fetchall()}
    assert 'dead_metric' in subs
    assert 'net_revenue' not in subs


def test_identical_sql_measures_become_merge_candidate(client, db):
    _seed_schema(db, [('net_revenue', 'net_revenue'), ('revenue_total', 'net_revenue')])
    client.post('/api/semantic/evolve')
    row = db.execute("SELECT * FROM semantic_proposals WHERE kind='merge'").fetchone()
    assert row is not None
    ev = json.loads(row['evidence_json'])
    assert ev['sql_similarity'] == 1.0
    assert ev['confidence'] == 'high'


def test_suffixed_measure_becomes_rename_candidate(client, db):
    _seed_schema(db, [('net_revenue', 'net_revenue'), ('net_revenue_v2', 'net_revenue_new')])
    client.post('/api/semantic/evolve')
    row = db.execute("SELECT * FROM semantic_proposals WHERE kind='rename'").fetchone()
    assert row is not None and row['subject'] == 'net_revenue_v2'


def test_proposals_dedupe_and_canonical_schema_never_mutates(client, db):
    _seed_schema(db, [('net_revenue', 'net_revenue'), ('revenue_total', 'net_revenue')])
    client.post('/api/semantic/evolve')
    client.post('/api/semantic/evolve')          # rescan: no duplicates
    n = db.execute("SELECT COUNT(*) c FROM semantic_proposals WHERE kind='merge'").fetchone()['c']
    assert n == 1

    before = db.execute("SELECT COUNT(*) c, MAX(version) v FROM semantic_schemas").fetchone()
    pid = db.execute('SELECT id FROM semantic_proposals LIMIT 1').fetchone()['id']
    assert client.post(f'/api/semantic/proposals/{pid}/approve',
                       headers={'X-User-Role': 'viewer'}).status_code == 403
    r = client.post(f'/api/semantic/proposals/{pid}/approve')
    assert r.status_code == 200 and r.get_json()['status'] == 'approved'
    after = db.execute("SELECT COUNT(*) c, MAX(version) v FROM semantic_schemas").fetchone()
    assert (before['c'], before['v']) == (after['c'], after['v'])   # never auto-mutates
    assert client.post(f'/api/semantic/proposals/{pid}/approve').status_code == 409
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='semantic.proposal_approved'").fetchone()


def test_list_endpoint(client, db):
    _seed_schema(db, [('net_revenue', 'net_revenue'), ('revenue_total', 'net_revenue')])
    client.post('/api/semantic/evolve')
    rows = client.get('/api/semantic/proposals').get_json()['proposals']
    assert rows and {'kind', 'subject', 'suggestion', 'status'} <= set(rows[0])
