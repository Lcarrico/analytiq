"""
R6S2E3-US1 — Per-panel export, dark mode, print CSS, responsive stacking,
version-history panel, deterministic repair loop (≤2 cycles), branding
"""
from conftest import wait_until


def _rows():
    return [{'day_index': i, 'date': f'Jan {i+1}', 'actual': 600 + i if i < 20 else None,
             'predicted': 590 + i, 'ci_low': 560 + i, 'ci_high': 640 + i,
             'is_forecast': 1 if i >= 20 else 0} for i in range(30)]


def test_theming_export_and_versions_markup():
    import artifact_gen as ag
    html = ag.generate_artifact_html(
        {'id': 3, 'title': 'Polished'}, _rows(),
        {'avgActual': 1, 'mape': 5, 'forecast14Avg': 2},
        versions=[{'version': 2, 'created_at': 'now'}, {'version': 1, 'created_at': 'then'}])
    assert '@media print' in html
    assert 'prefers-color-scheme: dark' in html
    assert '@media (max-width: 768px)' in html
    assert 'function exportPanelJson' in html
    assert 'data-panel="versions"' in html and 'v2' in html
    assert ag.validate_artifact(html)['status'] == 'PASS'


def test_repair_loop_strips_external_resources():
    import artifact_gen as ag
    html = ag.generate_artifact_html({'id': 4, 'title': 'Broken'}, _rows(),
                                     {'avgActual': 1, 'mape': 5, 'forecast14Avg': 2})
    broken = html.replace('<body>',
                          '<body><script src="https://evil.com/x.js"></script>'
                          '<link href="https://evil.com/x.css" rel="stylesheet">')
    assert ag.validate_artifact(broken)['status'] == 'FAIL'
    repaired, cycles, validation = ag.validate_and_repair(broken, max_cycles=2)
    assert validation['status'] == 'PASS'
    assert 1 <= cycles <= 2
    assert 'evil.com' not in repaired

    ok_html, cycles0, v0 = ag.validate_and_repair(html)
    assert cycles0 == 0 and v0['status'] == 'PASS'


def test_workspace_branding_applied(client):
    r = client.put('/api/branding', json={'primary_color': '#aa3366',
                                          'logo_text': 'ACME Analytics',
                                          'font_family': 'Georgia'})
    assert r.status_code == 200
    assert client.put('/api/branding',
                      json={'primary_color': 'reddish'}).status_code == 400

    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    run = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status') == 'done',
               timeout=30)
    art = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'branded'}).get_json()
    client.post(f"/api/artifacts/{art['id']}/render")
    html = client.get(f"/api/artifacts/{art['id']}/html").get_data(as_text=True)
    assert '#aa3366' in html
    assert 'ACME Analytics' in html
    assert 'Georgia' in html
