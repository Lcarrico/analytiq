"""
R12S1E2-US1 — Recommendation Feedback Loop (Architecture v2.1 §17.4.3)

Every recommendation records its outcome. Dismissal is a first-class signal:
three dismissals of a category suppress it for that user until the
underlying signal strengthens by more than 20%. Acceptance rates per type
are exposed for observability.
"""
import json

from conftest import wait_until


def _artifact(client, metric='Net Revenue', title='FB'):
    sid = client.post('/api/sessions', json={'metric': metric}).get_json()['id']
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done',
               timeout=30)
    return sid, client.post(f'/api/sessions/{sid}/save_artifact',
                            json={'title': title}).get_json()


def test_record_and_acceptance_rates(client, db):
    import feedback_loop as fb
    fb.record(db, 'opportunity', 1, 'accept', category='causal_candidate')
    fb.record(db, 'opportunity', 2, 'dismiss', category='causal_candidate')
    fb.record(db, 'opportunity', 3, 'dismiss', category='forecast_gap')
    fb.record(db, 'semantic_proposal', 4, 'accept', category='merge')
    fb.record(db, 'suggestion', 5, 'ignore', category='deeper_cut')

    r = client.get('/api/platform/feedback')
    assert r.status_code == 200
    rates = {x['rec_type']: x for x in r.get_json()['types']}
    assert rates['opportunity']['accepted'] == 1
    assert rates['opportunity']['dismissed'] == 2
    assert rates['opportunity']['acceptance_rate'] == round(1 / 3, 3)
    assert rates['semantic_proposal']['acceptance_rate'] == 1.0
    assert rates['suggestion']['ignored'] == 1


def test_opportunity_decisions_are_recorded_automatically(client, db):
    import knowledge_graph as kg
    kg.add_edge(db, 'metrics_co_analyzed', 'metric:net_revenue', 'metric:avg_ticket')
    sid, art = _artifact(client)
    rows = db.execute("SELECT * FROM opportunities WHERE artifact_id=? AND status='open'",
                      (art['id'],)).fetchall()
    client.post(f"/api/opportunities/{rows[0]['id']}/accept")
    client.post(f"/api/opportunities/{rows[1]['id']}/dismiss")
    fb = db.execute("SELECT * FROM recommendation_feedback WHERE rec_type='opportunity'").fetchall()
    decisions = {r['decision'] for r in fb}
    assert {'accept', 'dismiss'} <= decisions
    assert all(r['category'] for r in fb)


def test_semantic_and_optimization_decisions_recorded(client, db):
    db.execute("INSERT INTO semantic_proposals (kind, subject, suggestion, status, fingerprint) "
               "VALUES ('merge', 'a+b', 'merge them', 'proposed', 'fb-merge')")
    db.execute("INSERT INTO optimization_proposals (kind, target, recommendation, status, fingerprint) "
               "VALUES ('sql_rewrite', '/api/gold/x', 'rewrite', 'proposed', 'fb-sql')")
    db.commit()
    sp = db.execute("SELECT id FROM semantic_proposals WHERE fingerprint='fb-merge'").fetchone()['id']
    op = db.execute("SELECT id FROM optimization_proposals WHERE fingerprint='fb-sql'").fetchone()['id']
    client.post(f'/api/semantic/proposals/{sp}/approve')
    client.post(f'/api/platform/optimizations/{op}/reject')
    types = {r['rec_type'] for r in db.execute('SELECT * FROM recommendation_feedback').fetchall()}
    assert {'semantic_proposal', 'optimization'} <= types


def test_three_dismissals_suppress_category(client, db):
    import knowledge_graph as kg
    kg.add_edge(db, 'metrics_co_analyzed', 'metric:net_revenue', 'metric:avg_ticket')
    for i in range(3):
        sid, art = _artifact(client, title=f'Sup{i}')
        row = db.execute("SELECT * FROM opportunities WHERE artifact_id=? AND "
                         "kind='causal_candidate' AND status='open'", (art['id'],)).fetchone()
        assert row is not None, f'round {i} should still surface'
        client.post(f"/api/opportunities/{row['id']}/dismiss")

    sid, art = _artifact(client, title='Sup3')       # 4th artifact: suppressed now
    row = db.execute("SELECT * FROM opportunities WHERE artifact_id=? AND "
                     "kind='causal_candidate'", (art['id'],)).fetchone()
    assert row is None


def test_stronger_signal_lifts_suppression(client, db):
    import knowledge_graph as kg
    kg.add_edge(db, 'metrics_co_analyzed', 'metric:net_revenue', 'metric:avg_ticket')
    for i in range(3):
        sid, art = _artifact(client, title=f'Lift{i}')
        row = db.execute("SELECT * FROM opportunities WHERE artifact_id=? AND "
                         "kind='causal_candidate' AND status='open'", (art['id'],)).fetchone()
        client.post(f"/api/opportunities/{row['id']}/dismiss")

    # signal strengthens well beyond +20% (edge weight 1 → 2)
    kg.add_edge(db, 'metrics_co_analyzed', 'metric:net_revenue', 'metric:avg_ticket')
    sid, art = _artifact(client, title='Lift3')
    row = db.execute("SELECT * FROM opportunities WHERE artifact_id=? AND "
                     "kind='causal_candidate'", (art['id'],)).fetchone()
    assert row is not None                            # resurfaced


def test_generic_feedback_endpoint(client, db):
    r = client.post('/api/feedback', json={'rec_type': 'benchmark', 'rec_id': 7,
                                           'decision': 'ignore', 'category': 'peer_group'})
    assert r.status_code == 201
    assert client.post('/api/feedback', json={'rec_type': 'x', 'rec_id': 1,
                                              'decision': 'meh'}).status_code == 400
