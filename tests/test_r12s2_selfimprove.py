"""
R12S2E3-US1 — Self-Improving Platform Loop (Architecture v2.1 §17.4.2)

A background miner turns usage telemetry into four improvement signals —
popular metrics, abandoned filters, repeated edits, recurring failures —
each routed to its consumer with an audit trail proving delivery.
"""
import json


def _spec(client, sid, metric, features=None, key=None):
    return client.post(f'/api/sessions/{sid}/spec',
                       headers={'Idempotency-Key': key} if key else {},
                       json={
        'intent': 'predictive', 'intent_confidence': 0.9, 'analytic_goal': 'g',
        'target_metric': metric, 'feature_candidates': features or [],
        'date_range': {'start': '2023-01-01', 'end': '2023-12-31'},
        'grain': 'Location · Day', 'output_type': 'forecast_dashboard',
        'prediction_horizon': 14, 'explores_used': [],
        'semantic_layer_version': '1.0.0', 'governance_manifest_version': '1.0.0'})


def test_popular_metric_signal_routes_to_benchmarks(client, db):
    for _ in range(3):
        sid = client.post('/api/sessions', json={'metric': 'Hot Metric'}).get_json()['id']
        _spec(client, sid, 'Hot Metric')
    r = client.post('/api/platform/self_improve')
    assert r.status_code == 200
    row = db.execute("SELECT * FROM platform_signals WHERE signal_kind='popular_metric'").fetchone()
    assert row is not None
    assert row['subject'] == 'hot_metric'
    assert row['consumer'] == 'benchmark_library'
    assert json.loads(row['detail_json'])['count'] >= 3
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='signal.delivered'").fetchone()


def test_abandoned_filter_signal_routes_to_planner(client, db):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    _spec(client, sid, 'Net Revenue', features=['promo_flag', 'weather'])
    _spec(client, sid, 'Net Revenue', features=['weather'])      # promo_flag dropped
    client.post('/api/platform/self_improve')
    row = db.execute("SELECT * FROM platform_signals WHERE signal_kind='abandoned_filter'").fetchone()
    assert row is not None
    assert row['subject'] == 'promo_flag'
    assert row['consumer'] == 'planner'


def test_repeated_edit_signal_feeds_semantic_evolution(client, db):
    db.execute("INSERT INTO connections (type, name) VALUES ('snowflake', 'si')")
    cid = db.execute('SELECT id FROM connections ORDER BY id DESC LIMIT 1').fetchone()['id']
    db.execute("INSERT INTO governance_runs (connection_id, status) VALUES (?, 'complete')", (cid,))
    rid = db.execute('SELECT id FROM governance_runs ORDER BY id DESC LIMIT 1').fetchone()['id']
    for _ in range(2):
        db.execute("INSERT INTO semantic_definitions (run_id, type, name, definition, "
                   "confidence, status) VALUES (?, 'Metric', 'fuzzy_metric', 'd', 0.5, 'pending')",
                   (rid,))
    db.commit()
    ids = [r['id'] for r in db.execute(
        "SELECT id FROM semantic_definitions WHERE name='fuzzy_metric'").fetchall()]
    for d in ids:
        client.post(f'/api/reviews/items/{d}', json={'action': 'edit', 'definition': 'better'})

    client.post('/api/platform/self_improve')
    sig = db.execute("SELECT * FROM platform_signals WHERE signal_kind='repeated_edit'").fetchone()
    assert sig is not None and sig['subject'] == 'fuzzy_metric'
    assert sig['consumer'] == 'semantic_evolution'

    # the consumer actually consumes: evolution proposes from the signal
    import semantic_evolution as se
    se.propose(db)
    prop = db.execute("SELECT * FROM semantic_proposals WHERE kind='rename' "
                      "AND subject='fuzzy_metric'").fetchone()
    assert prop is not None
    assert 'edited' in prop['suggestion'].lower() or 'repeated' in prop['suggestion'].lower()


def test_recurring_failure_signal_routes_to_meta(client, db):
    for i in range(3):
        db.execute("INSERT INTO audit_logs (action, resource_type, resource_id, metadata) "
                   "VALUES ('pipeline.gate_blocked', 'pipeline_run', ?, '{}')", (str(i),))
    db.commit()
    client.post('/api/platform/self_improve')
    row = db.execute("SELECT * FROM platform_signals WHERE signal_kind='recurring_failure'").fetchone()
    assert row is not None and row['consumer'] == 'meta_orchestrator'


def test_mining_is_deduped_and_listable(client, db):
    for _ in range(3):
        sid = client.post('/api/sessions', json={'metric': 'Dedup Metric'}).get_json()['id']
        _spec(client, sid, 'Dedup Metric')
    client.post('/api/platform/self_improve')
    client.post('/api/platform/self_improve')
    n = db.execute("SELECT COUNT(*) c FROM platform_signals WHERE subject='dedup_metric'").fetchone()['c']
    assert n == 1
    r = client.get('/api/platform/signals?consumer=benchmark_library')
    assert r.status_code == 200
    rows = r.get_json()['signals']
    assert rows and all(s['consumer'] == 'benchmark_library' for s in rows)
