"""
R9S2E4-US1 — Meta-Orchestrator (Architecture v2.1 §17.2.7)

A supervisor above the orchestrator: deterministic arbitration of conflicting
agent outputs, systemic failure triage (one platform alert, not N user
failures), queue reprioritization under load — and no authority whatsoever
to skip a human checkpoint (§18.3 invariant).
"""
import json

from conftest import wait_until


def _run(client, sid):
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json().get('runId')
    if rid:
        wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status')
                   in ('done', 'failed'), timeout=30)
    return rid


def _session(client, **kw):
    return client.post('/api/sessions', json={'metric': 'Net Revenue', **kw}).get_json()['id']


# ── deterministic arbitration ──────────────────────────────────────────────

def test_grain_conflict_arbitrated_deterministically(client, db):
    sid = _session(client)                      # session grain: Location · Day
    # data-modeler output at a different grain (agents disagree)
    db.execute("INSERT INTO gold_tables (session_id, table_name, physical_table, version, status) "
               "VALUES (?, 'gold_net_revenue_location_week_v1', 'g1', 1, 'generated')", (sid,))
    db.commit()

    rid = _run(client, sid)
    assert client.get(f'/api/pipeline/{rid}').get_json()['status'] == 'done'   # arbitrated, not failed

    dec = db.execute("SELECT * FROM meta_decisions WHERE kind='grain_conflict' "
                     'ORDER BY id DESC LIMIT 1').fetchone()
    assert dec is not None
    assert dec['rule'] == 'session_spec_grain_canonical'
    assert 'location_day' in dec['winner']
    assert 'location_week' in dec['loser']

    rid2 = _run(client, sid)                    # identical inputs → identical ruling
    dec2 = db.execute("SELECT * FROM meta_decisions WHERE kind='grain_conflict' "
                      'ORDER BY id DESC LIMIT 1').fetchone()
    assert (dec2['rule'], dec2['winner'], dec2['loser']) == (dec['rule'], dec['winner'], dec['loser'])
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='meta.arbitrated'").fetchone()


def test_no_conflict_records_no_decision(client, db):
    sid = _session(client)
    db.execute("INSERT INTO gold_tables (session_id, table_name, physical_table, version, status) "
               "VALUES (?, 'gold_net_revenue_location_day_v1', 'g2', 1, 'generated')", (sid,))
    db.commit()
    _run(client, sid)
    assert db.execute("SELECT COUNT(*) c FROM meta_decisions WHERE kind='grain_conflict'"
                      ).fetchone()['c'] == 0


# ── systemic failure triage ────────────────────────────────────────────────

def test_repeated_gate_exhaustion_raises_one_platform_alert(client, db, monkeypatch):
    import dag
    monkeypatch.setitem(dag.DAG_EDGE_GATES, ('gold_build', 'model_train'),
                        [('min_training_rows', lambda conn, run_id, ctx:
                          ('BLOCK', {'reason': 'forced by test'}))])
    for _ in range(4):                          # 4 failing runs in the window
        _run(client, _session(client))
    alerts = db.execute("SELECT * FROM alerts WHERE type='meta.systemic_failure'").fetchall()
    assert len(alerts) == 1                     # one platform alert, not four
    detail = json.loads(alerts[0]['detail_json'])
    assert detail['failure_count'] >= 3
    mails = db.execute("SELECT * FROM email_outbox WHERE subject LIKE '%systemic%'").fetchall()
    assert len(mails) == 1
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='meta.failure_triaged'").fetchone()


# ── queue reprioritization ─────────────────────────────────────────────────

def test_reprioritize_puts_user_facing_work_first(client, db):
    import jobs
    order = []
    jobs.register('bg_maintenance', lambda conn, payload: order.append('bg'))
    jobs.register('event_recompute', lambda conn, payload: order.append('user'))
    jobs.enqueue(db, 'bg_maintenance', {})      # enqueued first (lower id)
    jobs.enqueue(db, 'event_recompute', {'session_id': None})

    r = client.post('/api/meta/reprioritize')
    assert r.status_code == 200
    assert r.get_json()['changed'] >= 1

    jobs.process_pending(db)
    assert order[0] == 'user'                   # priority beats insertion order
    dec = db.execute("SELECT * FROM meta_decisions WHERE kind='reprioritization' "
                     'ORDER BY id DESC LIMIT 1').fetchone()
    assert dec is not None


# ── human checkpoints are not skippable ────────────────────────────────────

def test_meta_cannot_skip_human_checkpoint(client, db):
    cid = client.post('/api/connections', json={
        'type': 'snowflake', 'name': 'meta', 'account': 'a', 'username': 'u',
        'password': 'p'}).get_json()['id']
    client.post('/api/governance/run', json={'connectionId': cid})
    wait_until(lambda: (client.get(f'/api/integrations/{cid}/manifest/versions').get_json() or []))
    run_id = client.get(f'/api/integrations/{cid}/manifest').get_json().get('run_id')
    sid = client.post('/api/sessions', json={'connectionId': cid, 'runId': run_id,
                                             'metric': 'Net Revenue'}).get_json()['id']
    assert client.post('/api/pipeline/run', json={'sessionId': sid}).status_code == 409

    r = client.post('/api/meta/override', json={'session_id': sid, 'action': 'skip_checkpoint'})
    assert r.status_code == 409
    assert 'checkpoint' in r.get_json()['error'].lower()
    # still blocked afterwards — the meta layer granted nothing
    assert client.post('/api/pipeline/run', json={'sessionId': sid}).status_code == 409
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='meta.override_refused'").fetchone()


def test_meta_decisions_endpoint(client, db):
    client.post('/api/meta/reprioritize')
    r = client.get('/api/meta/decisions')
    assert r.status_code == 200
    body = r.get_json()
    assert 'decisions' in body and 'alerts' in body
    assert body['decisions'] and {'kind', 'rule', 'created_at'} <= set(body['decisions'][0])
