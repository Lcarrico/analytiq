"""
R6S1E2-US1 — Eight standard dashboard panels in the artifact + validator update
"""
from conftest import wait_until

PANELS = ('header', 'kpi-row', 'timeseries', 'feature-importance',
          'dimension-breakdown', 'forecast', 'leaderboard', 'dq-footer')

SPEC = {
    'intent': 'predictive', 'intent_confidence': 0.93, 'analytic_goal': 'g',
    'target_metric': 'Net Revenue',
    'feature_candidates': ['net_revenue', 'day', 'location_id', 'tier'],
    'date_range': {'start': '2023-01-01', 'end': '2023-12-31'},
    'grain': 'Location · Day', 'output_type': 'forecast_dashboard',
    'prediction_horizon': 14, 'explores_used': ['fact_revenue', 'dim_location'],
    'semantic_layer_version': '1.0.0', 'governance_manifest_version': '1.0.0',
}


def test_generator_emits_all_eight_panels_with_fallbacks():
    import artifact_gen as ag
    rows = [{'day_index': i, 'date': f'Jan {i+1}', 'actual': 600 + i if i < 20 else None,
             'predicted': 590 + i, 'ci_low': 560 + i, 'ci_high': 640 + i,
             'is_forecast': 1 if i >= 20 else 0} for i in range(30)]
    html = ag.generate_artifact_html({'id': 1, 'title': 'T'}, rows,
                                     {'avgActual': 1, 'mape': 5, 'forecast14Avg': 2})
    for p in PANELS:
        assert f'data-panel="{p}"' in html, p
    res = ag.validate_artifact(html)
    assert res['status'] == 'PASS'
    assert any(c['code'] == 'panel_set' and c['ok'] for c in res['checks'])

    # validator flags a missing panel
    broken = html.replace('data-panel="forecast"', 'data-panel="gone"')
    res = ag.validate_artifact(broken)
    assert any(c['code'] == 'panel_set' and not c['ok'] for c in res['checks'])


def test_full_stack_artifact_renders_rich_panels(client):
    cid = client.post('/api/connections', json={
        'type': 'snowflake', 'name': 'p8', 'account': 'a', 'username': 'u',
        'password': 'p'}).get_json()['id']
    before = len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json() or [])
    client.post('/api/governance/run', json={'connectionId': cid})
    wait_until(lambda: len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json()
                           or []) > before)
    client.post('/api/semantic/default/generate', json={'connectionId': cid})
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    client.post(f'/api/sessions/{sid}/spec', json=dict(SPEC))
    client.post('/api/modeler/generate', json={'sessionId': sid, 'mode': 'execute'})
    jid = client.post('/api/training/run', json={'sessionId': sid}).get_json()['jobId']
    wait_until(lambda: client.get(f'/api/training/jobs/{jid}').get_json().get('status') == 'done',
               timeout=40)
    run = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status') == 'done',
               timeout=30)
    art = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'Rich'}).get_json()
    client.post(f"/api/artifacts/{art['id']}/render")

    html = client.get(f"/api/artifacts/{art['id']}/html").get_data(as_text=True)
    for p in PANELS:
        assert f'data-panel="{p}"' in html, p
    # rich content: importance bars from the trained model + trial rows + forecast
    assert "imp-bar" in html
    assert 'class="trial-row"' in html
    assert 'class="forecast-point"' in html
    assert 'DQ' in html and 'lineage' in html.lower()
