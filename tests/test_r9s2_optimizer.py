"""
R9S2E7-US1 — Autonomous Optimization Jobs (Architecture v2.1 §17.2.9)

Background analysis of query telemetry, cache stats, and the semantic layer
produces reviewable proposals — never auto-applied to warehouse state
(read-only, non-destructive posture of §14.3).
"""
import json


def _seed_slow_gold_reads(db, n=6, ms=900):
    for _ in range(n):
        db.execute("INSERT INTO service_logs (method, path, status, duration_ms) "
                   "VALUES ('GET', '/api/gold/default/gold_predictions', 200, ?)", (ms,))
    db.commit()


def test_scan_proposes_slow_sql_rewrite(client, db):
    _seed_slow_gold_reads(db)
    r = client.post('/api/platform/optimize')
    assert r.status_code == 200
    rows = db.execute("SELECT * FROM optimization_proposals WHERE kind='sql_rewrite'").fetchall()
    assert rows
    ev = json.loads(rows[0]['evidence_json'])
    assert ev['count'] >= 5 and ev['p95_ms'] >= 900
    assert rows[0]['status'] == 'proposed'


def test_scan_is_idempotent_and_respects_existing_indexes(client, db):
    _seed_slow_gold_reads(db)
    client.post('/api/platform/optimize')
    client.post('/api/platform/optimize')          # rescan → no duplicates
    n = db.execute("SELECT COUNT(*) c FROM optimization_proposals WHERE kind='index_recommendation' "
                   "AND target LIKE '%gold_predictions%'").fetchone()['c']
    assert n == 1
    # once the index exists, the recommendation is no longer generated
    db.execute('CREATE INDEX IF NOT EXISTS idx_test_gp_run ON gold_predictions(pipeline_run_id)')
    db.commit()
    db.execute('DELETE FROM optimization_proposals')
    db.commit()
    client.post('/api/platform/optimize')
    n2 = db.execute("SELECT COUNT(*) c FROM optimization_proposals WHERE kind='index_recommendation' "
                    "AND target LIKE '%gold_predictions%'").fetchone()['c']
    assert n2 == 0


def test_scan_proposes_cache_key_restructure(client, db):
    db.execute("INSERT INTO cache_stats (layer, hits, misses) VALUES ('query', 1, 30) "
               "ON CONFLICT(layer) DO UPDATE SET hits=1, misses=30")
    db.commit()
    client.post('/api/platform/optimize')
    row = db.execute("SELECT * FROM optimization_proposals WHERE kind='cache_key_restructure'").fetchone()
    assert row is not None
    assert 'query' in row['target']


def test_expensive_join_crossrefs_m2m_gate(client, db):
    schema = {'cubes': [
        {'name': 'fact_a', 'measures': [], 'dimensions': [],
         'joins': [{'to': 'dim_shared', 'on': 'shared_id', 'join_type': 'inner'}]},
        {'name': 'fact_b', 'measures': [], 'dimensions': [],
         'joins': [{'to': 'dim_shared', 'on': 'shared_id', 'join_type': 'inner'}]},
    ]}
    db.execute("INSERT INTO semantic_schemas (workspace_id, version, schema_json) "
               "VALUES ('default', '8.8.8', ?)", (json.dumps(schema),))
    db.commit()
    client.post('/api/platform/optimize')
    row = db.execute("SELECT * FROM optimization_proposals WHERE kind='semantic_join_fix'").fetchone()
    assert row is not None
    ev = json.loads(row['evidence_json'])
    assert ev['gate_ref'].startswith('Many-to-Many Join')
    assert 'bridge' in row['recommendation'].lower()   # semantic fix, not warehouse DDL


def test_approval_is_admin_only_and_never_auto_applied(client, db):
    _seed_slow_gold_reads(db)
    client.post('/api/platform/optimize')
    pid = db.execute('SELECT id FROM optimization_proposals LIMIT 1').fetchone()['id']

    r = client.post(f'/api/platform/optimizations/{pid}/approve',
                    headers={'X-User-Role': 'viewer'})
    assert r.status_code == 403

    idx_before = db.execute("SELECT COUNT(*) c FROM sqlite_master WHERE type='index'").fetchone()['c']
    r = client.post(f'/api/platform/optimizations/{pid}/approve')
    assert r.status_code == 200
    assert r.get_json()['status'] == 'approved'
    idx_after = db.execute("SELECT COUNT(*) c FROM sqlite_master WHERE type='index'").fetchone()['c']
    assert idx_after == idx_before                     # approval applies NOTHING
    assert client.post(f'/api/platform/optimizations/{pid}/approve').status_code == 409
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='optimization.approved'").fetchone()


def test_reject_and_list_endpoints(client, db):
    _seed_slow_gold_reads(db)
    client.post('/api/platform/optimize')
    rows = client.get('/api/platform/optimizations').get_json()['proposals']
    assert rows and {'kind', 'target', 'recommendation', 'status'} <= set(rows[0])
    pid = rows[-1]['id']
    r = client.post(f'/api/platform/optimizations/{pid}/reject')
    assert r.status_code == 200 and r.get_json()['status'] == 'rejected'
    assert client.post('/api/platform/optimizations/999999/reject').status_code == 404
