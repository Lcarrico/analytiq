"""
R6S2E2-US1 — NL annotations (overlays + is_annotated_event) + metric alert subscriptions
"""
from conftest import wait_until

SPEC = {
    'intent': 'predictive', 'intent_confidence': 0.93, 'analytic_goal': 'g',
    'target_metric': 'Net Revenue',
    'feature_candidates': ['net_revenue', 'day', 'location_id', 'tier'],
    'date_range': {'start': '2023-01-01', 'end': '2023-12-31'},
    'grain': 'Location · Day', 'output_type': 'forecast_dashboard',
    'prediction_horizon': 14, 'explores_used': ['fact_revenue', 'dim_location'],
    'semantic_layer_version': '1.0.0', 'governance_manifest_version': '1.0.0',
}


def _artifact(client):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    run = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status') == 'done',
               timeout=30)
    return sid, client.post(f'/api/sessions/{sid}/save_artifact',
                            json={'title': 'annotated'}).get_json()


def test_annotations_crud_and_overlay(client):
    sid, art = _artifact(client)
    r = client.post(f"/api/artifacts/{art['id']}/annotations",
                    json={'grain_value': 'Feb 1', 'timestamp': '2024-02-01',
                          'text': 'Springfield reopening after renovation'})
    assert r.status_code == 201
    assert client.post(f"/api/artifacts/{art['id']}/annotations", json={}).status_code == 400

    anns = client.get(f"/api/artifacts/{art['id']}/annotations").get_json()
    assert len(anns) == 1 and 'Springfield' in anns[0]['text']

    # re-render → overlay markup present, still valid + self-contained
    client.post(f"/api/artifacts/{art['id']}/render")
    html = client.get(f"/api/artifacts/{art['id']}/html").get_data(as_text=True)
    assert 'annotation-overlay' in html
    assert 'Springfield reopening' in html


def test_annotations_feed_is_annotated_event_feature(client, db):
    cid = client.post('/api/connections', json={
        'type': 'snowflake', 'name': 'an', 'account': 'a', 'username': 'u',
        'password': 'p'}).get_json()['id']
    before = len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json() or [])
    client.post('/api/governance/run', json={'connectionId': cid})
    wait_until(lambda: len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json()
                           or []) > before)
    client.post('/api/semantic/default/generate', json={'connectionId': cid})
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    client.post(f'/api/sessions/{sid}/spec', json=dict(SPEC))
    client.post('/api/modeler/generate', json={'sessionId': sid, 'mode': 'execute'})
    run = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status') == 'done',
               timeout=30)
    art = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'fx'}).get_json()
    client.post(f"/api/artifacts/{art['id']}/annotations",
                json={'timestamp': '2023-06-15', 'text': 'promo day'})

    out = client.post('/api/modeler/enrich', json={'sessionId': sid}).get_json()
    assert 'is_annotated_event' in out['added_features']
    v = db.execute(f'SELECT is_annotated_event FROM "{out["physical_table"]}" '
                   f"WHERE day='2023-06-15' AND location_id=1").fetchone()[0]
    assert v == 1
    v0 = db.execute(f'SELECT is_annotated_event FROM "{out["physical_table"]}" '
                    f"WHERE day='2023-06-14' AND location_id=1").fetchone()[0]
    assert v0 == 0


def test_metric_subscription_triggers_on_refresh(client, db):
    sid, art = _artifact(client)
    r = client.post(f"/api/artifacts/{art['id']}/subscriptions",
                    json={'metric': 'mape', 'threshold': 1.0, 'direction': 'above'})
    assert r.status_code == 201
    client.post(f"/api/artifacts/{art['id']}/subscriptions",
                json={'metric': 'mape', 'threshold': 100.0, 'direction': 'above'})
    assert client.post(f"/api/artifacts/{art['id']}/subscriptions",
                       json={'metric': 'nope', 'threshold': 1}).status_code == 400

    client.post(f"/api/artifacts/{art['id']}/refresh")
    alerts = client.get('/api/alerts?type=metric').get_json()
    assert len(alerts) == 1                       # only the 1.0 threshold fires
    assert alerts[0]['detail']['metric'] == 'mape'
    mail = db.execute("SELECT * FROM email_outbox WHERE subject LIKE '%mape%'").fetchone()
    assert mail is not None
    assert f"/artifacts/{art['id']}" in mail['body_html']   # deep link back
