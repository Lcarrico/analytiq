"""
R10S1E1-US1 — Persistent Agent Memory (Architecture v2.1 §17.3.1)

Durable, per-workspace/per-user memory for agents: preference categories,
PII-gated writes, weight decay, and strictly non-overriding integration —
stored preference is a prior, never a constraint, on the planner's next plan.
"""
import json

import pytest


def test_remember_recall_and_reinforcement(db):
    import agent_memory as am
    e1 = am.remember(db, 'planner', 'filter_pattern', 'grain:net_revenue', 'Location · Week')
    assert e1['weight'] == 1.0
    e2 = am.remember(db, 'planner', 'filter_pattern', 'grain:net_revenue', 'Location · Week')
    assert e2['id'] == e1['id']
    assert e2['weight'] > e1['weight']          # reinforcement
    got = am.recall(db, 'planner', category='filter_pattern')
    assert got and got[0]['value'] == 'Location · Week'
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='memory.remembered'").fetchone()


def test_pii_values_rejected_at_write(db):
    import agent_memory as am
    for bad in ('john.doe@acme.com', '123-45-6789'):
        with pytest.raises(ValueError):
            am.remember(db, 'planner', 'filter_pattern', 'k', bad)
    assert db.execute('SELECT COUNT(*) c FROM agent_memory').fetchone()['c'] == 0
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='memory.pii_rejected'").fetchone()


def test_unused_memories_decay_out_of_recall(db):
    import agent_memory as am
    am.remember(db, 'planner', 'chart_type_default', 'revenue', 'line')
    db.execute("UPDATE agent_memory SET last_used = datetime('now', '-90 days')")
    db.commit()
    assert am.recall(db, 'planner', category='chart_type_default') == []   # decayed
    am.remember(db, 'planner', 'chart_type_default', 'revenue', 'line')   # re-touch
    assert am.recall(db, 'planner', category='chart_type_default')


def test_invalid_category_rejected(db):
    import agent_memory as am
    with pytest.raises(ValueError):
        am.remember(db, 'planner', 'not_a_category', 'k', 'v')


def test_planner_uses_memory_as_prior_never_override(client, db):
    import agent_memory as am
    # learned preference: this workspace analyzes revenue weekly
    am.remember(db, 'planner', 'filter_pattern', 'grain_pref', 'Customer · Week')
    am.remember(db, 'planner', 'filter_pattern', 'grain_pref', 'Customer · Week')

    # ambiguous message (no grain tokens) → memory prior applies
    r = client.post('/api/sessions/plan',
                    json={'message': 'Forecast net revenue for the next quarter'}).get_json()
    assert r.get('grain') == 'Customer · Week'
    assert r.get('memory_applied') is True

    # explicit instruction in the current turn always wins over memory
    r2 = client.post('/api/sessions/plan',
                     json={'message': 'Forecast net revenue for the next 14 days by location'}).get_json()
    assert r2.get('grain') == 'Location · Day'
    assert not r2.get('memory_applied')


def test_spec_confirmation_writes_grain_pattern(client, db):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    client.post(f'/api/sessions/{sid}/spec', json={
        'intent': 'predictive', 'intent_confidence': 0.9, 'analytic_goal': 'g',
        'target_metric': 'Net Revenue', 'feature_candidates': [],
        'date_range': {'start': '2023-01-01', 'end': '2023-12-31'},
        'grain': 'Region · Month', 'output_type': 'forecast_dashboard',
        'prediction_horizon': 14, 'explores_used': [],
        'semantic_layer_version': '1.0.0', 'governance_manifest_version': '1.0.0'})
    row = db.execute("SELECT * FROM agent_memory WHERE category='filter_pattern' "
                     "AND value='Region · Month'").fetchone()
    assert row is not None


def test_memory_api_list_and_delete(client, db):
    r = client.post('/api/memory', json={'agent': 'viz', 'category': 'chart_type_default',
                                         'key': 'revenue', 'value': 'line'})
    assert r.status_code == 201
    mid = r.get_json()['id']
    assert client.post('/api/memory', json={'agent': 'viz', 'category': 'bogus',
                                            'key': 'k', 'value': 'v'}).status_code == 400
    rows = client.get('/api/memory?agent=viz').get_json()['memories']
    assert any(m['id'] == mid for m in rows)
    assert client.delete(f'/api/memory/{mid}').status_code == 204
    assert client.delete(f'/api/memory/{mid}').status_code == 404
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='memory.forgotten'").fetchone()


def test_insight_dismissal_is_remembered(client, db):
    db.execute("INSERT INTO artifacts (title, type, owner, dq_status) "
               "VALUES ('Insight Host', 'Predictive', 'a@acme.com', 'pass')")
    aid = db.execute('SELECT id FROM artifacts ORDER BY id DESC LIMIT 1').fetchone()['id']
    db.execute("INSERT INTO artifact_insights (artifact_id, kind, summary) "
               "VALUES (?, 'anomaly', 'Spike on Tuesday')", (aid,))
    db.commit()
    iid = db.execute('SELECT id FROM artifact_insights ORDER BY id DESC LIMIT 1').fetchone()['id']
    client.post(f'/api/insights/{iid}/dismiss')
    row = db.execute("SELECT * FROM agent_memory WHERE category='dismissed_insight'").fetchone()
    assert row is not None and 'anomaly' in row['mem_key']
