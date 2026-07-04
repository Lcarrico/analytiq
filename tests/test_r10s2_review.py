"""
R10S2E6-US1 — AI-Assisted Governance Review (Architecture v2.1 §17.3.7)

The admin review queue is triaged by supporting evidence — usage frequency,
similarity to already-approved definitions, and conflict flags — with every
item annotated. Approval authority is unchanged: triage only reorders.
"""
import json


def _def(db, run_id, name, dtype='Metric', definition='', confidence=0.5,
         explore='fact_revenue', status='pending'):
    db.execute('INSERT INTO semantic_definitions (run_id, type, name, definition, confidence, '
               'explore, status) VALUES (?,?,?,?,?,?,?)',
               (run_id, dtype, name, definition, confidence, explore, status))
    db.commit()
    return db.execute('SELECT id FROM semantic_definitions ORDER BY id DESC LIMIT 1').fetchone()['id']


def _run(db):
    db.execute("INSERT INTO connections (type, name) VALUES ('snowflake', 'rev')")
    cid = db.execute('SELECT id FROM connections ORDER BY id DESC LIMIT 1').fetchone()['id']
    db.execute("INSERT INTO governance_runs (connection_id, status) VALUES (?, 'complete')", (cid,))
    db.commit()
    return db.execute('SELECT id FROM governance_runs ORDER BY id DESC LIMIT 1').fetchone()['id']


def _spec_for(client, metric):
    sid = client.post('/api/sessions', json={'metric': metric}).get_json()['id']
    client.post(f'/api/sessions/{sid}/spec', json={
        'intent': 'predictive', 'intent_confidence': 0.9, 'analytic_goal': 'g',
        'target_metric': metric, 'feature_candidates': [],
        'date_range': {'start': '2023-01-01', 'end': '2023-12-31'},
        'grain': 'Location · Day', 'output_type': 'forecast_dashboard',
        'prediction_horizon': 14, 'explores_used': [],
        'semantic_layer_version': '1.0.0', 'governance_manifest_version': '1.0.0'})


def test_ranked_queue_annotates_all_three_evidence_kinds(client, db):
    rid = _run(db)
    _def(db, rid, 'basket_size', definition='average items per order')
    r = client.get(f'/api/reviews/{rid}?ranked=1')
    assert r.status_code == 200
    items = r.get_json()
    assert items
    ev = items[0]['evidence']
    assert {'usage_frequency', 'similarity_to_approved', 'conflict_flags',
            'evidence_score'} <= set(ev)


def test_usage_frequency_ranks_referenced_definitions_first(client, db):
    rid = _run(db)
    _def(db, rid, 'basket_size')
    _def(db, rid, 'untouched_metric')
    _spec_for(client, 'Basket Size')
    _spec_for(client, 'Basket Size')
    items = client.get(f'/api/reviews/{rid}?ranked=1').get_json()
    assert items[0]['name'] == 'basket_size'
    assert items[0]['evidence']['usage_frequency'] >= 2
    assert items[0]['evidence']['evidence_score'] > items[-1]['evidence']['evidence_score']


def test_similarity_to_already_approved_definition(client, db):
    rid = _run(db)
    _def(db, rid, 'net_revenue', definition='total revenue net of discounts and refunds',
         status='accepted')
    _def(db, rid, 'gross_revenue', definition='total revenue net of discounts')  # similar
    _def(db, rid, 'weird_flag', definition='boolean sensor bit')                 # dissimilar
    items = client.get(f'/api/reviews/{rid}?ranked=1').get_json()
    by = {i['name']: i['evidence'] for i in items}
    assert by['gross_revenue']['similarity_to_approved'] > by['weird_flag']['similarity_to_approved']
    assert items[0]['name'] == 'gross_revenue'


def test_conflicting_definitions_are_flagged_with_gate_ref(client, db):
    rid = _run(db)
    _def(db, rid, 'net_revenue', dtype='Metric', explore='fact_revenue')
    _def(db, rid, 'net_revenue', dtype='Dimension', explore='fact_sessions')
    items = client.get(f'/api/reviews/{rid}?ranked=1').get_json()
    flagged = [i for i in items if i['evidence']['conflict_flags']]
    assert len(flagged) == 2
    assert any('Metric Definition Conflict' in f for f in flagged[0]['evidence']['conflict_flags'])


def test_scores_are_deterministic(client, db):
    rid = _run(db)
    _def(db, rid, 'basket_size', definition='avg items')
    a = client.get(f'/api/reviews/{rid}?ranked=1').get_json()
    b = client.get(f'/api/reviews/{rid}?ranked=1').get_json()
    assert a[0]['evidence'] == b[0]['evidence']


def test_legacy_queue_order_and_authority_unchanged(client, db):
    rid = _run(db)
    d1 = _def(db, rid, 'a_metric', confidence=0.3)
    d2 = _def(db, rid, 'b_metric', confidence=0.2)
    legacy = client.get(f'/api/reviews/{rid}').get_json()
    assert [i['id'] for i in legacy] == [d2, d1]      # confidence ASC preserved
    # triage never grants authority: viewer still cannot decide
    r = client.post(f'/api/reviews/items/{d1}', json={'action': 'accept'},
                    headers={'X-User-Role': 'viewer'})
    assert r.status_code == 403


def test_latest_governance_run_endpoint(client, db):
    # R10S2E6 (UI reachability): the triage surface deep-links to the newest run
    assert client.get('/api/governance/latest').status_code == 404
    rid = _run(db)
    r = client.get('/api/governance/latest')
    assert r.status_code == 200 and r.get_json()['run_id'] == rid
