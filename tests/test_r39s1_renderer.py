"""R39S1E3-US1 — every surface renders from the spec (deep-dive F-08):
canvas edits drive the exported artifact; authored components appear in the
artifact HTML; html export works again."""
import json

from conftest import wait_until


def _built(client):
    conn = client.post('/api/connections', json={'type': 'snowflake', 'account': 'rnd',
                                                 'username': 'u', 'password': 'p'}).get_json()
    p = client.post('/api/sessions/plan',
                    json={'message': 'Forecast net revenue for the next 14 days'}).get_json()
    sid = client.post('/api/sessions', json={'metric': p['target_metric'],
                                             'connectionId': conn['id']}).get_json()['id']
    client.post(f'/api/sessions/{sid}/spec', json=p)
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done',
               timeout=30)
    art = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'R'}).get_json()
    return sid, rid, art['id']


def _html(client, aid):
    r = client.get(f'/api/artifacts/{aid}/export?format=html')
    assert r.status_code == 200, r.get_json()
    assert 'text/html' in r.content_type
    return r.get_data(as_text=True)


def test_layout_edits_rerender_the_artifact(client):
    sid, rid, aid = _built(client)
    html1 = _html(client, aid)
    assert 'data-panel="timeseries"' in html1

    # a LAYOUT-ONLY edit (title) must re-render the shared artifact (F-08)
    client.patch(f'/api/artifacts/{aid}/sections/timeseries_ci',
                 json={'title': 'Trend renamed r39'})
    html2 = _html(client, aid)
    assert 'Trend renamed r39' in html2

    # a semantic edit still re-renders
    client.patch(f'/api/artifacts/{aid}/sections/dimension_breakdown',
                 json={'chart_type': 'bar'})
    assert _html(client, aid)


def test_authored_components_render_on_the_artifact(client):
    sid, rid, aid = _built(client)
    made = client.post(f'/api/sessions/{sid}/components',
                       json={'type': 'bar', 'title': 'Authored revenue bars',
                             'metric_refs': ['net_revenue']}).get_json()
    html = _html(client, aid)
    assert 'Authored revenue bars' in html
    assert f'data-panel="{made["component"]["id"]}"' in html

    client.delete(f"/api/sessions/{sid}/components/{made['component']['id']}")
    html2 = _html(client, aid)
    assert 'Authored revenue bars' not in html2
