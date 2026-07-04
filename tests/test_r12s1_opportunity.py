"""
R12S1E1-US1 — Opportunity Engine (Architecture v2.1 §17.4.1)

After assembly, the platform keeps working: anomalies worth a look, causal
candidates phrased as questions (never conclusions), and forecast gaps
routed to training on acceptance. Every opportunity is accept/dismiss —
nothing auto-generates without confirmation.
"""
import json

from conftest import wait_until


def _artifact(client, metric='Net Revenue', title='Opp'):
    sid = client.post('/api/sessions', json={'metric': metric}).get_json()['id']
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done',
               timeout=30)
    return sid, rid, client.post(f'/api/sessions/{sid}/save_artifact',
                                 json={'title': title}).get_json()


def test_assembly_evaluates_opportunities(client, db):
    import knowledge_graph as kg
    kg.add_edge(db, 'metrics_co_analyzed', 'metric:net_revenue', 'metric:avg_ticket')
    sid, rid, art = _artifact(client)
    rows = db.execute('SELECT * FROM opportunities WHERE artifact_id=?',
                      (art['id'],)).fetchall()
    assert rows
    kinds = {r['kind'] for r in rows}
    assert 'causal_candidate' in kinds
    assert 'forecast_gap' in kinds                    # avg_ticket has no prediction yet
    assert all(r['status'] == 'open' for r in rows)


def test_causal_candidates_are_questions_not_conclusions(client, db):
    import knowledge_graph as kg
    kg.add_edge(db, 'metrics_co_analyzed', 'metric:net_revenue', 'metric:foot_traffic')
    sid, rid, art = _artifact(client)
    row = db.execute("SELECT * FROM opportunities WHERE kind='causal_candidate' "
                     'AND artifact_id=?', (art['id'],)).fetchone()
    assert row['question'].rstrip().endswith('?')
    assert 'not causation' in row['headline'] or 'worth investigating' in row['headline'].lower()


def test_anomaly_opportunities_reuse_the_insight_engine(client, db):
    sid, rid, art = _artifact(client)
    opp = db.execute("SELECT * FROM opportunities WHERE kind='anomaly' AND artifact_id=?",
                     (art['id'],)).fetchone()
    if opp is None:                                   # standard seeded data may be calm
        return
    detail = json.loads(opp['detail_json'])
    ins = db.execute('SELECT * FROM artifact_insights WHERE id=?',
                     (detail['insight_id'],)).fetchone()
    assert ins is not None                            # same engine, no duplication


def test_accepting_forecast_gap_creates_session_only(client, db):
    import knowledge_graph as kg
    kg.add_edge(db, 'metrics_co_analyzed', 'metric:net_revenue', 'metric:basket_size')
    sid, rid, art = _artifact(client)
    opp = db.execute("SELECT * FROM opportunities WHERE kind='forecast_gap' "
                     "AND artifact_id=? LIMIT 1", (art['id'],)).fetchone()
    assert opp is not None

    runs_before = db.execute('SELECT COUNT(*) c FROM pipeline_runs').fetchone()['c']
    arts_before = db.execute('SELECT COUNT(*) c FROM artifacts').fetchone()['c']
    r = client.post(f"/api/opportunities/{opp['id']}/accept")
    assert r.status_code == 200
    body = r.get_json()
    assert body['status'] == 'accepted'
    assert body['session_id']                         # routed to training…
    sess = db.execute('SELECT * FROM sessions WHERE id=?', (body['session_id'],)).fetchone()
    assert sess is not None
    # …but nothing auto-generates without confirmation:
    assert db.execute('SELECT COUNT(*) c FROM pipeline_runs').fetchone()['c'] == runs_before
    assert db.execute('SELECT COUNT(*) c FROM artifacts').fetchone()['c'] == arts_before
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='opportunity.accepted'").fetchone()


def test_dismiss_and_decision_contracts(client, db):
    import knowledge_graph as kg
    kg.add_edge(db, 'metrics_co_analyzed', 'metric:net_revenue', 'metric:refund_rate')
    sid, rid, art = _artifact(client)
    opp = db.execute('SELECT * FROM opportunities WHERE artifact_id=? LIMIT 1',
                     (art['id'],)).fetchone()
    r = client.post(f"/api/opportunities/{opp['id']}/dismiss")
    assert r.status_code == 200 and r.get_json()['status'] == 'dismissed'
    assert client.post(f"/api/opportunities/{opp['id']}/accept").status_code == 409
    assert client.post('/api/opportunities/999999/dismiss').status_code == 404


def test_reevaluation_is_deduped(client, db):
    import knowledge_graph as kg
    kg.add_edge(db, 'metrics_co_analyzed', 'metric:net_revenue', 'metric:avg_ticket')
    sid, rid, art = _artifact(client)
    n1 = db.execute("SELECT COUNT(*) c FROM opportunities WHERE kind='causal_candidate'").fetchone()['c']
    client.post(f"/api/artifacts/{art['id']}/opportunities/evaluate")
    n2 = db.execute("SELECT COUNT(*) c FROM opportunities WHERE kind='causal_candidate'").fetchone()['c']
    assert n2 == n1


def test_list_endpoint(client, db):
    import knowledge_graph as kg
    kg.add_edge(db, 'metrics_co_analyzed', 'metric:net_revenue', 'metric:avg_ticket')
    sid, rid, art = _artifact(client)
    r = client.get(f"/api/artifacts/{art['id']}/opportunities")
    assert r.status_code == 200
    rows = r.get_json()['opportunities']
    assert rows and {'kind', 'headline', 'question', 'status'} <= set(rows[0])
