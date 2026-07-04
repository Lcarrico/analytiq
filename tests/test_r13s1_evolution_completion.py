"""
R13/R14 consolidated (files renamed from stray r21s1 labels 2026-07-04 — see
PROGRESS.md Design-Parity adaptation ledger) — Evolution completion: observability-as-artifact
(#21), benchmark library (#13), viz experimentation (#31), plugin validators
(#14), business process integration (#35), template marketplace (#33).
"""
import json

from conftest import wait_until


def _artifact(client, metric='Net Revenue'):
    sid = client.post('/api/sessions', json={'metric': metric}).get_json()['id']
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done',
               timeout=30)
    art = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': f'{metric} Art'}).get_json()
    return sid, rid, art


def test_observability_report_is_a_native_artifact(client, db):
    _artifact(client)
    r = client.post('/api/workspace/observability_report')
    assert r.status_code == 201
    rep = r.get_json()
    f = db.execute('SELECT html FROM artifact_files WHERE artifact_id=? ORDER BY version DESC LIMIT 1',
                   (rep['id'],)).fetchone()
    html = f['html'].lower()
    assert 'cache' in html and 'dispatch' in html and 'repair' in html


def test_benchmarks_registered_never_fabricated(client, db):
    sid, rid, art = _artifact(client)
    r = client.get('/api/metrics/net_revenue/benchmarks')
    assert r.status_code == 200
    b = r.get_json()
    assert b['historical']['mean'] is not None          # from gold tables
    assert b['peer'] is None and b['budget'] is None    # unregistered → never fabricated
    assert client.post('/api/metrics/net_revenue/benchmarks',
                       json={'kind': 'budget', 'value': 50000}).status_code == 201
    b2 = client.get('/api/metrics/net_revenue/benchmarks').get_json()
    assert b2['budget']['value'] == 50000
    assert client.post('/api/metrics/x/benchmarks', json={'kind': 'bogus', 'value': 1}).status_code == 400


def test_viz_alternates_ranked_and_swappable(client, db):
    sid, rid, art = _artifact(client)
    r = client.get(f"/api/artifacts/{art['id']}/viz_alternates?section=timeseries_ci")
    assert r.status_code == 200
    alts = r.get_json()['alternates']
    assert len(alts) >= 2
    assert alts[0]['rank'] == 1 and alts[0]['mark']
    swap = client.post(f"/api/artifacts/{art['id']}/viz_swap",
                       json={'section': 'timeseries_ci', 'mark': alts[1]['mark']})
    assert swap.status_code == 200
    assert swap.get_json()['edit_class'] == 'semantic'   # re-validated path


def test_plugin_validator_joins_the_gate_set(client, db):
    r = client.post('/api/plugins/validators',
                    json={'name': 'min_forecast_rows', 'table': 'gold_forecast',
                          'min_rows': 5})
    assert r.status_code == 201
    sid, rid, art = _artifact(client, metric='Plugin Metric')
    gate = db.execute("SELECT * FROM dag_edges WHERE run_id=? AND gate_name='plugin:min_forecast_rows'",
                      (rid,)).fetchone()
    assert gate is not None and gate['gate_status'] == 'PASS'
    assert client.post('/api/plugins/validators',
                       json={'name': 'x', 'table': 'nope; DROP', 'min_rows': 1}).status_code == 400


def test_outbound_process_integration(client, db):
    r = client.post('/api/integrations/outbound',
                    json={'kind': 'slack', 'target': '#revenue-alerts',
                          'message': 'Net revenue breached its floor'})
    assert r.status_code == 201
    row = db.execute("SELECT * FROM outbound_actions ORDER BY id DESC LIMIT 1").fetchone()
    assert row['kind'] == 'slack' and row['status'] == 'queued'   # console fallback
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='outbound.dispatched'").fetchone()
    assert client.post('/api/integrations/outbound',
                       json={'kind': 'carrier_pigeon', 'target': 'x', 'message': 'y'}).status_code == 400


def test_template_marketplace_roundtrip(client, db):
    sid, rid, art = _artifact(client, metric='Templatable')
    pkg = client.post('/api/templates/package', json={'session_id': sid, 'name': 'Revenue Pack'})
    assert pkg.status_code == 201
    tid = pkg.get_json()['id']
    assert '$METRIC' in pkg.get_json()['plan_template']['target_metric']

    applied = client.post(f'/api/templates/{tid}/apply', json={'metric': 'Average Ticket'})
    assert applied.status_code == 201
    body = applied.get_json()
    assert body['spec']['target_metric'] == 'Average Ticket'   # re-resolved
    assert body['validation']['errors'] == []                  # gates re-ran
    assert body['session_id']
    assert client.post(f'/api/templates/{tid}/apply', json={}).status_code == 400
