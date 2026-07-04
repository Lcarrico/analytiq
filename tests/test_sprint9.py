"""
Sprint 9 — Artifact Generator Core
  F-035 Self-contained single-file HTML artifact generator
  F-036 Deterministic artifact validator (meta, aria, self-containment, size)
  F-037 Artifact file storage (versioned, hashed) + HTML serving
  F-038/F-039 KPI row panel + primary time series with CI ribbon
"""
import hashlib

from conftest import wait_until


def _artifact_with_chart(client):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    run = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status') == 'done',
               timeout=30)
    art = client.post('/api/artifacts', json={
        'title': 'Net Revenue Forecast', 'mape': 8.9,
        'pipeline_run_id': run['runId']}).get_json()
    return art['id'], run['runId']


SAMPLE_ROWS = [
    {'day_index': i, 'date': f'Jan {i+1}', 'actual': (600 + i) if i < 20 else None,
     'predicted': 590 + i, 'ci_low': 560 + i, 'ci_high': 640 + i,
     'is_forecast': 1 if i >= 20 else 0}
    for i in range(30)
]
SAMPLE_KPIS = {'avgActual': 610, 'mape': 8.9, 'forecast14Avg': 615}
SAMPLE_META = {'id': 42, 'title': 'Test Artifact', 'type': 'Predictive',
               'owner': 'analyst@acme.com', 'created_at': '2026-07-02'}


# ── F-035/38/39 generation ───────────────────────────────
def test_artifact_html_is_self_contained_with_panels():
    import artifact_gen as ag
    html = ag.generate_artifact_html(SAMPLE_META, SAMPLE_ROWS, SAMPLE_KPIS)
    assert html.startswith('<!DOCTYPE html>')
    # required meta tags
    for meta in ('analytiq:artifact-id', 'analytiq:generated-at', 'analytiq:validator'):
        assert f'name="{meta}"' in html
    assert '<title>' in html
    # KPI row with MAPE badge
    assert 'data-panel="kpi-row"' in html
    assert 'data-kpi="mape"' in html and '8.9' in html
    assert 'data-kpi="avg-actual"' in html and '610' in html
    # time series panel with CI ribbon + both series
    assert 'data-panel="timeseries"' in html
    assert 'aria-label' in html
    assert 'class="ci-ribbon"' in html
    assert 'class="series-actual"' in html and 'class="series-predicted"' in html
    # self-contained: no external fetches
    assert 'http://' not in html and 'https://' not in html
    assert '<script src' not in html and '<link' not in html


def test_artifact_html_deterministic():
    import artifact_gen as ag
    a = ag.generate_artifact_html(SAMPLE_META, SAMPLE_ROWS, SAMPLE_KPIS,
                                  generated_at='2026-07-02T00:00:00Z')
    b = ag.generate_artifact_html(SAMPLE_META, SAMPLE_ROWS, SAMPLE_KPIS,
                                  generated_at='2026-07-02T00:00:00Z')
    assert a == b


# ── F-036 validator ──────────────────────────────────────
def test_artifact_validator_pass_and_failures():
    import artifact_gen as ag
    html = ag.generate_artifact_html(SAMPLE_META, SAMPLE_ROWS, SAMPLE_KPIS)
    res = ag.validate_artifact(html)
    assert res['status'] == 'PASS'
    assert all(c['ok'] for c in res['checks'])

    no_meta = html.replace('analytiq:artifact-id', 'x:y')
    res = ag.validate_artifact(no_meta)
    assert res['status'] == 'FAIL'
    assert any(c['code'] == 'missing_meta' and not c['ok'] for c in res['checks'])

    external = html.replace('<body>', '<body><script src="https://evil.com/x.js"></script>')
    res = ag.validate_artifact(external)
    assert any(c['code'] == 'external_resource' and not c['ok'] for c in res['checks'])

    huge = html + ('<!-- pad -->' * 200_000)
    res = ag.validate_artifact(huge)
    assert any(c['code'] == 'max_size' and not c['ok'] for c in res['checks'])

    no_aria = html.replace('aria-label', 'data-x')
    res = ag.validate_artifact(no_aria)
    assert any(c['code'] == 'aria' and not c['ok'] for c in res['checks'])


# ── F-037 endpoint: render + store + serve ───────────────
def test_render_endpoint_stores_validated_file(client, db):
    art_id, _ = _artifact_with_chart(client)
    r = client.post(f'/api/artifacts/{art_id}/render')
    assert r.status_code == 201
    out = r.get_json()
    assert out['validation']['status'] == 'PASS'
    assert out['size_bytes'] > 1000
    assert len(out['sha256']) == 64

    row = db.execute('SELECT * FROM artifact_files WHERE artifact_id=?', (art_id,)).fetchone()
    assert row is not None
    assert hashlib.sha256(row['html'].encode()).hexdigest() == out['sha256']
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='artifact.rendered'").fetchone()


def test_render_html_served_and_versioned(client):
    art_id, _ = _artifact_with_chart(client)
    assert client.get(f'/api/artifacts/{art_id}/html').status_code == 404  # not rendered yet

    v1 = client.post(f'/api/artifacts/{art_id}/render').get_json()
    resp = client.get(f'/api/artifacts/{art_id}/html')
    assert resp.status_code == 200
    assert resp.content_type.startswith('text/html')
    assert 'data-panel="kpi-row"' in resp.get_data(as_text=True)

    v2 = client.post(f'/api/artifacts/{art_id}/render').get_json()
    assert v2['version'] == v1['version'] + 1
    files = client.get(f'/api/artifacts/{art_id}/files').get_json()
    assert len(files) == 2
    assert files[0]['version'] == 2  # latest first


def test_render_requires_chart_data(client):
    art = client.post('/api/artifacts', json={'title': 'Empty'}).get_json()
    r = client.post(f"/api/artifacts/{art['id']}/render")
    assert r.status_code == 409
    assert client.post('/api/artifacts/99999/render').status_code == 404
