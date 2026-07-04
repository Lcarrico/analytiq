"""
R10S2E7-US1 — Organizational Knowledge Reuse (Architecture v2.1 §17.3.6)

One analyst's validated dashboard plan accelerates the next similar request —
surfaced as candidate starting points with similarity scores. Reuse always
re-runs full validation for the new requester's context: it accelerates
planning, it never skips governance.
"""
import json

from conftest import wait_until


def _plan_for(client, metric, sandbox=False):
    sid = client.post('/api/sessions', json={'metric': metric, 'sandbox': sandbox}).get_json()['id']
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status')
               in ('done', 'failed'), timeout=30)
    return sid, rid


def test_candidates_surface_with_similarity(client, db):
    _plan_for(client, 'Net Revenue')
    r = client.get('/api/reuse_candidates?metric=Net Revenue')
    assert r.status_code == 200
    cands = r.get_json()['candidates']
    assert cands and cands[0]['similarity'] >= 0.6
    assert cands[0]['plan_uid']
    assert cands[0]['payload']['metric'] == 'Net Revenue'
    assert client.get('/api/reuse_candidates?metric=Quantum Flux').get_json()['candidates'] == []
    assert client.get('/api/reuse_candidates').status_code == 400


def test_candidates_ranked_by_similarity(client, db):
    _plan_for(client, 'Net Revenue')
    _plan_for(client, 'Average Ticket')
    cands = client.get('/api/reuse_candidates?metric=net revenue').get_json()['candidates']
    assert cands[0]['payload']['metric'] == 'Net Revenue'
    if len(cands) > 1:
        assert cands[0]['similarity'] > cands[1]['similarity']


def test_sandbox_plans_never_surface(client, db):
    _plan_for(client, 'Secret Sandbox Metric', sandbox=True)
    cands = client.get('/api/reuse_candidates?metric=Secret Sandbox Metric').get_json()['candidates']
    assert cands == []


def test_kg_relatedness_boosts_similarity(client, db):
    import knowledge_graph as kg
    _plan_for(client, 'Average Ticket')
    base = client.get('/api/reuse_candidates?metric=Net Revenue').get_json()['candidates']
    base_score = next((c['similarity'] for c in base
                       if c['payload']['metric'] == 'Average Ticket'), 0.0)
    kg.add_edge(db, 'metrics_co_analyzed', 'metric:net_revenue', 'metric:average_ticket')
    boosted = client.get('/api/reuse_candidates?metric=Net Revenue').get_json()['candidates']
    boosted_score = next(c['similarity'] for c in boosted
                         if c['payload']['metric'] == 'Average Ticket')
    assert boosted_score > base_score
    assert any(c.get('kg_related') for c in boosted)


def test_reuse_applies_only_through_full_validation(client, db):
    _plan_for(client, 'Net Revenue')
    cand = client.get('/api/reuse_candidates?metric=Net Revenue').get_json()['candidates'][0]

    new_sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    r = client.post(f"/api/sessions/{new_sid}/reuse/{cand['plan_uid']}")
    assert r.status_code == 201
    body = r.get_json()
    assert body['validation']['errors'] == []          # gates re-ran, clean
    assert body['spec']['target_metric'] == 'Net Revenue'
    assert body['spec_version'] >= 1
    stored = db.execute('SELECT * FROM session_specs WHERE session_id=? '
                        'ORDER BY spec_version DESC LIMIT 1', (new_sid,)).fetchone()
    assert stored is not None
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='plan.reused'").fetchone()


def test_reuse_negative_paths(client, db):
    sid, rid = _plan_for(client, 'Net Revenue')
    new_sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    # not a dashboard plan artifact → 422
    gold = db.execute("SELECT artifact_uid FROM uas_artifacts WHERE "
                      "artifact_type='gold_predictions_ref' LIMIT 1").fetchone()
    assert client.post(f"/api/sessions/{new_sid}/reuse/{gold['artifact_uid']}").status_code == 422
    assert client.post(f'/api/sessions/{new_sid}/reuse/no-such-uid').status_code == 404
    assert client.post(f"/api/sessions/999999/reuse/{gold['artifact_uid']}").status_code == 404
