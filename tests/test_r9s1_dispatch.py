"""
R9S1E1-US1 — Cost-Aware Orchestration (Architecture v2.1 §17.2.2)

Every dispatched task resolves through the cost ladder — exact cache hit,
then template logic, then small model, and only then the frontier model —
with per-task cost/latency telemetry.
"""


def _plan(client, msg):
    return client.post('/api/sessions/plan', json={'message': msg})


def test_ladder_cache_short_circuits_compute(db):
    import orchestrator
    calls = {'n': 0}

    def compute():
        calls['n'] += 1
        return {'answer': 42}

    r1 = orchestrator.dispatch(db, 'session_planning', ['sig', 'a'], compute)
    assert r1['tier'] == 'frontier_model' and r1['result'] == {'answer': 42}
    r2 = orchestrator.dispatch(db, 'session_planning', ['sig', 'a'], compute)
    assert r2['tier'] == 'cache'
    assert r2['result'] == {'answer': 42}
    assert calls['n'] == 1                      # cache hit never re-computes
    assert r2['est_cost'] == 0.0


def test_template_tier_for_repeat_pattern(db):
    import orchestrator
    r1 = orchestrator.dispatch(db, 'session_planning', ['forecast', 'revenue', 'h14'],
                               lambda: {'h': 14}, pattern=['forecast', 'revenue'])
    r2 = orchestrator.dispatch(db, 'session_planning', ['forecast', 'revenue', 'h30'],
                               lambda: {'h': 30}, pattern=['forecast', 'revenue'])
    assert r1['tier'] == 'frontier_model'
    assert r2['tier'] == 'template'             # seen pattern → template logic
    assert r2['result'] == {'h': 30}
    assert r2['est_cost'] < r1['est_cost']


def test_static_small_model_routing(db):
    import orchestrator
    r = orchestrator.dispatch(db, 'intent_classification', ['what', 'drove', 'revenue'],
                              lambda: {'intent': 'diagnostic'})
    assert r['tier'] == 'small_model'
    assert 0 < r['est_cost'] < 0.01


def test_planner_route_dispatches_through_ladder(client, db):
    m = 'Forecast net revenue for the next 14 days by location'
    assert _plan(client, m).status_code == 200
    rows = db.execute('SELECT * FROM task_dispatches ORDER BY id').fetchall()
    kinds = {r['task_kind'] for r in rows}
    assert {'intent_classification', 'session_planning'} <= kinds
    tiers = {r['task_kind']: r['tier'] for r in rows}
    assert tiers['intent_classification'] == 'small_model'
    assert tiers['session_planning'] == 'frontier_model'      # novel pattern

    assert _plan(client, m).status_code == 200                 # identical repeat
    last = db.execute("SELECT tier FROM task_dispatches WHERE task_kind='session_planning' "
                      'ORDER BY id DESC LIMIT 1').fetchone()
    assert last['tier'] == 'cache'

    # same pattern, different horizon → template tier
    assert _plan(client, 'Forecast net revenue for the next 30 days by location').status_code == 200
    last = db.execute("SELECT tier FROM task_dispatches WHERE task_kind='session_planning' "
                      'ORDER BY id DESC LIMIT 1').fetchone()
    assert last['tier'] == 'template'


def test_dispatch_telemetry_fields_and_aggregation(client, db):
    _plan(client, 'Show revenue by region')
    _plan(client, 'Show revenue by region')
    r = client.get('/api/platform/dispatches')
    assert r.status_code == 200
    body = r.get_json()
    assert set(body['by_tier']) <= {'cache', 'template', 'small_model', 'frontier_model'}
    assert body['by_tier'].get('cache', 0) >= 1
    assert body['est_cost_total'] >= 0
    assert body['count'] >= 4
    row = db.execute('SELECT * FROM task_dispatches LIMIT 1').fetchone()
    assert {'task_kind', 'tier', 'est_cost', 'est_latency_ms', 'signature'} <= set(row.keys())
