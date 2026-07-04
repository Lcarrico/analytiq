"""
R11S2E4-US1 — Artifact Diff Engine (Architecture v2.1 §17.5.4)

Structural, visual diff between any two versions of a dashboard plan,
semantic schema, governance manifest, or model card — leveraging the fact
that every artifact is already versioned.
"""
import json


def test_structural_diff_paths(db):
    import diff_engine as de
    a = {'title': 'Rev', 'time_range': {'grain': 'day'},
         'sections': [{'name': 's1', 'columns': 2}]}
    b = {'title': 'Revenue', 'time_range': {'grain': 'week'},
         'sections': [{'name': 's1', 'columns': 3}, {'name': 's2', 'columns': 1}],
         'filters': ['region']}
    d = de.structural_diff(a, b)
    assert 'filters' in d['added']
    assert any(c['path'] == 'title' and c['to'] == 'Revenue' for c in d['changed'])
    assert any(c['path'] == 'time_range.grain' for c in d['changed'])
    assert any(c['path'] == 'sections[s1].columns' for c in d['changed'])
    assert 'sections[s2]' in d['added']
    assert d['removed'] == []


def _schema(measures):
    return {'cubes': [{'name': 'fact_revenue',
                       'measures': [{'name': n, 'sql': s, 'aggregation': 'sum'}
                                    for n, s in measures],
                       'dimensions': [], 'joins': []}]}


def test_semantic_schema_diff_highlights_metric_lifecycle(client, db):
    for v, measures in (('1.0.0', [('net_revenue', 'net_revenue'), ('old_metric', 'x')]),
                        ('1.1.0', [('net_revenue', 'net_revenue * 1.0'), ('aov', 'rev/orders')])):
        db.execute("INSERT INTO semantic_schemas (workspace_id, version, schema_json) "
                   "VALUES ('default', ?, ?)", (v, json.dumps(_schema(measures))))
    db.commit()
    r = client.get('/api/diff?kind=semantic_schema&a=1.0.0&b=1.1.0')
    assert r.status_code == 200
    body = r.get_json()
    assert body['summary']['added_metrics'] == ['aov']
    assert body['summary']['removed_metrics'] == ['old_metric']       # deprecated
    assert [m['name'] for m in body['summary']['redefined_metrics']] == ['net_revenue']
    assert body['structural']['changed']


def test_dashboard_plan_diff_lists_changed_fields(client, db):
    import uas
    p1 = uas.register(db, 'dashboard_plan', {'metric': 'Net Revenue', 'horizon': 14,
                                             'panels': ['kpi_row', 'forecast']},
                      logical_key='default:dashboard_plan:diff-test')
    p2 = uas.register(db, 'dashboard_plan', {'metric': 'Net Revenue', 'horizon': 30,
                                             'panels': ['kpi_row', 'forecast', 'leaderboard']},
                      logical_key='default:dashboard_plan:diff-test')
    r = client.get(f"/api/diff?kind=dashboard_plan&a={p1['artifact_uid']}&b={p2['artifact_uid']}")
    assert r.status_code == 200
    body = r.get_json()
    assert any(c['path'] == 'horizon' and c['to'] == 30 for c in body['structural']['changed'])
    assert any('leaderboard' in p for p in body['structural']['added'])


def test_model_card_diff(client, db):
    sid = client.post('/api/sessions', json={'metric': 'Diff Cards'}).get_json()['id']
    for algo, mape in (('seasonal_trend', 9.5), ('ridge_lite', 8.1)):
        db.execute("INSERT INTO model_cards (session_id, algorithm, gold_table_name, "
                   "metrics_json, status) VALUES (?, ?, 'g', ?, 'candidate')",
                   (sid, algo, json.dumps({'validation_mape': mape})))
    db.commit()
    ids = [r['id'] for r in db.execute('SELECT id FROM model_cards ORDER BY id DESC LIMIT 2')]
    r = client.get(f'/api/diff?kind=model_card&a={ids[1]}&b={ids[0]}')
    assert r.status_code == 200
    changed_paths = {c['path'] for c in r.get_json()['structural']['changed']}
    assert 'algorithm' in changed_paths
    assert any('validation_mape' in p for p in changed_paths)


def test_diff_error_contracts(client, db):
    assert client.get('/api/diff?kind=nope&a=1&b=2').status_code == 400
    assert client.get('/api/diff?kind=semantic_schema&a=9.9.9&b=8.8.8').status_code == 404
    assert client.get('/api/diff?kind=semantic_schema').status_code == 400
