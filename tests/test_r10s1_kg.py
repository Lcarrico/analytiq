"""
R10S1E2-US1 — Workspace Knowledge Graph (Architecture v2.1 §17.3.3)

A typed graph over metrics, dashboards, datasets, concepts, and users —
relationships that are real but don't fit the relational semantic layer.
Populated incrementally from artifacts, specs, and semantic changes.
"""
import json

from conftest import wait_until


def _artifact(client, metric='Net Revenue', title='KG Art'):
    sid = client.post('/api/sessions', json={'metric': metric}).get_json()['id']
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status')
               in ('done', 'failed'), timeout=30)
    art = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': title}).get_json()
    return sid, art


def test_add_edge_accumulates_weight(db):
    import knowledge_graph as kg
    kg.add_edge(db, 'metrics_co_analyzed', 'metric:a', 'metric:b')
    kg.add_edge(db, 'metrics_co_analyzed', 'metric:a', 'metric:b')
    row = db.execute("SELECT * FROM kg_edges WHERE edge_type='metrics_co_analyzed'").fetchone()
    assert row['weight'] == 2.0
    assert db.execute('SELECT COUNT(*) c FROM kg_edges').fetchone()['c'] == 1


def test_artifact_save_ingests_reference_and_investigation_edges(client, db):
    sid, art = _artifact(client)
    ref = db.execute("SELECT * FROM kg_edges WHERE edge_type='dashboard_references_metric' "
                     "AND src_node=?", (f"artifact:{art['id']}",)).fetchone()
    assert ref is not None and ref['dst_node'] == 'metric:net_revenue'
    inv = db.execute("SELECT * FROM kg_edges WHERE edge_type='user_investigates_concept' "
                     "AND dst_node='metric:net_revenue'").fetchone()
    assert inv is not None


def test_spec_feature_candidates_become_co_analysis_edges(client, db):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    client.post(f'/api/sessions/{sid}/spec', json={
        'intent': 'predictive', 'intent_confidence': 0.9, 'analytic_goal': 'g',
        'target_metric': 'Net Revenue', 'feature_candidates': ['avg_ticket', 'foot_traffic'],
        'date_range': {'start': '2023-01-01', 'end': '2023-12-31'},
        'grain': 'Location · Day', 'output_type': 'forecast_dashboard',
        'prediction_horizon': 14, 'explores_used': [],
        'semantic_layer_version': '1.0.0', 'governance_manifest_version': '1.0.0'})
    pairs = {(r['src_node'], r['dst_node']) for r in db.execute(
        "SELECT * FROM kg_edges WHERE edge_type='metrics_co_analyzed'").fetchall()}
    assert ('metric:avg_ticket', 'metric:net_revenue') in pairs
    assert ('metric:foot_traffic', 'metric:net_revenue') in pairs


def test_related_metrics_ranked_by_weight(client, db):
    import knowledge_graph as kg
    for _ in range(3):
        kg.add_edge(db, 'metrics_co_analyzed', 'metric:net_revenue', 'metric:avg_ticket')
    kg.add_edge(db, 'metrics_co_analyzed', 'metric:foot_traffic', 'metric:net_revenue')
    r = client.get('/api/kg/related?metric=Net Revenue')
    assert r.status_code == 200
    rel = r.get_json()['related']
    assert [x['metric'] for x in rel[:2]] == ['avg_ticket', 'foot_traffic']  # weight order
    assert rel[0]['weight'] > rel[1]['weight']
    assert client.get('/api/kg/related?metric=Nothing Here').get_json()['related'] == []
    assert client.get('/api/kg/related').status_code == 400


def test_calculated_metric_records_derivation_edges(client, db):
    schema = {'cubes': [{'name': 'fact_revenue',
                         'measures': [{'name': 'net_revenue', 'sql': 'net_revenue',
                                       'aggregation': 'sum', 'format': 'currency'},
                                      {'name': 'order_count', 'sql': 'order_count',
                                       'aggregation': 'sum', 'format': 'number'}],
                         'dimensions': [], 'joins': []}]}
    db.execute("INSERT INTO semantic_schemas (workspace_id, version, schema_json) "
               "VALUES ('default', '1.0.0', ?)", (json.dumps(schema),))
    db.commit()
    r = client.post('/api/semantic/default/metrics/calculated',
                    json={'name': 'aov', 'expr': 'net_revenue / order_count'})
    assert r.status_code in (200, 201)
    edges = {(e['src_node'], e['dst_node']) for e in db.execute(
        "SELECT * FROM kg_edges WHERE edge_type='metric_derived_from_metric'").fetchall()}
    assert ('metric:aov', 'metric:net_revenue') in edges
    assert ('metric:aov', 'metric:order_count') in edges


def test_rebuild_ingests_dataset_join_edges(client, db):
    schema = {'cubes': [{'name': 'fact_revenue', 'measures': [], 'dimensions': [],
                         'joins': [{'to': 'dim_location', 'on': 'location_id',
                                    'join_type': 'inner'}]}]}
    db.execute("INSERT INTO semantic_schemas (workspace_id, version, schema_json) "
               "VALUES ('default', '1.0.1', ?)", (json.dumps(schema),))
    db.commit()
    r = client.post('/api/kg/rebuild')
    assert r.status_code == 200
    edge = db.execute("SELECT * FROM kg_edges WHERE edge_type='dataset_joins_dataset' "
                      "AND src_node='dataset:fact_revenue'").fetchone()
    assert edge is not None and edge['dst_node'] == 'dataset:dim_location'


def test_co_analysis_recommendations(client, db):
    import knowledge_graph as kg
    kg.add_edge(db, 'user_investigates_concept', 'user:ana@acme.com', 'metric:net_revenue')
    kg.add_edge(db, 'user_investigates_concept', 'user:ana@acme.com', 'metric:churn_rate')
    kg.add_edge(db, 'user_investigates_concept', 'user:bob@acme.com', 'metric:net_revenue')
    r = client.get('/api/kg/co_analysis?metric=net_revenue')
    assert r.status_code == 200
    body = r.get_json()
    assert 'churn_rate' in [m['metric'] for m in body['also_analyzed']]
    assert any(u['user'] == 'ana@acme.com' for u in body['analysts'])
