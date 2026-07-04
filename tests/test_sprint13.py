"""
Sprint 13 — Deterministic Gate APIs & Query Endpoints
  F-053 DQ Gate engine: rule-level dq_gate_result, 409-on-BLOCK API contract,
        persistence (hash + trace_id), audit, query endpoint
  F-054 Governance manifest API: table pagination
"""
import json

from conftest import wait_until

MVP_RULES = {'schema_fingerprint', 'pk_uniqueness', 'null_rate_for_key_columns',
             'row_count_minimum', 'freshness_sla', 'pii_detection', 'distribution_shift'}


def _mk_connection(client):
    return client.post('/api/connections', json={
        'name': 'dq', 'type': 'snowflake', 'account': 'a', 'username': 'u',
        'password': 'p'}).get_json()['id']


def _run_governance(client, cid):
    run_id = client.post('/api/governance/run', json={'connectionId': cid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/governance/{run_id}').get_json().get('status') == 'done')
    wait_until(lambda: client.get(f'/api/integrations/{cid}/manifest').status_code == 200)
    return run_id


def _clean_manifest():
    return {
        'manifest_version': '1.0.0', 'workspace_id': 'default',
        'integration_id': 1, 'generated_at': '2026-07-02T00:00:00Z',
        'tables': [{
            'name': 'fact_ok', 'schema': 'CORE', 'health_score': 98,
            'freshness': '1h ago', 'row_count': '10,000',
            'gates': {'pk_gate': 'pass', 'null_gate': 'pass', 'freshness_gate': 'pass',
                      'pii_gate': 'pass', 'row_min_gate': 'pass'},
            'dq_gate_status': 'PASS',
            'columns': [{'name': 'id', 'semantic_type': 'id', 'pii_flags': None,
                         'allow_ml_use': True}],
        }],
        'definitions': [], 'lineage_edges': [],
        'dq_gate_status': 'PASS', 'human_review_required': False,
    }


# ── unit: rule engine ────────────────────────────────────
def test_evaluate_manifest_rule_coverage_and_outcomes():
    import dq
    res = dq.evaluate_manifest(_clean_manifest())
    assert res['outcome'] == 'PASS'
    assert {r['rule_id'] for r in res['rules']} == MVP_RULES
    for r in res['rules']:
        assert r['outcome'] == 'PASS'
        assert r['rule_name'] and r['severity'] in ('critical', 'warning')
        assert 'human_readable_message' in r

    bad = _clean_manifest()
    bad['tables'][0]['gates']['pk_gate'] = 'fail'
    bad['tables'][0]['gates']['pii_gate'] = 'flag'
    bad['tables'][0]['gates']['freshness_gate'] = 'warn'
    res = dq.evaluate_manifest(bad)
    assert res['outcome'] == 'BLOCK'
    by_id = {r['rule_id']: r for r in res['rules']}
    assert by_id['pk_uniqueness']['outcome'] == 'BLOCK'
    assert by_id['pk_uniqueness']['suggested_remediation']
    assert by_id['pii_detection']['outcome'] == 'BLOCK'
    assert by_id['freshness_sla']['outcome'] == 'WARN'
    assert by_id['pk_uniqueness']['details']['offending_tables'] == ['fact_ok']


def test_evaluate_manifest_deterministic_hash():
    import dq
    a, b = dq.evaluate_manifest(_clean_manifest()), dq.evaluate_manifest(_clean_manifest())
    assert a['result_hash'] == b['result_hash']
    changed = _clean_manifest()
    changed['tables'][0]['gates']['row_min_gate'] = 'fail'
    assert dq.evaluate_manifest(changed)['result_hash'] != a['result_hash']


def test_evaluate_manifest_input_validation():
    import dq
    errs = dq.validate_manifest_input({'tables': []})
    codes = {e['code'] for e in errs}
    assert 'missing_field' in codes  # manifest_version, workspace_id, generated_at
    assert dq.validate_manifest_input(_clean_manifest()) == []


# ── API contract ─────────────────────────────────────────
def test_dq_evaluate_endpoint_blocks_with_409(client, db):
    cid = _mk_connection(client)
    _run_governance(client, cid)  # sim manifest has PII + pk failures → BLOCK

    r = client.post('/api/dq/evaluate', json={'connectionId': cid})
    assert r.status_code == 409
    res = r.get_json()['dq_gate_result']
    assert res['outcome'] == 'BLOCK'
    assert res['trace_id'] and res['evaluated_at']
    assert res['manifest_version'] == '1.0.0'

    row = db.execute('SELECT * FROM dq_gate_results ORDER BY id DESC').fetchone()
    assert row is not None
    assert row['outcome'] == 'BLOCK'
    assert row['result_hash'] == res['result_hash']
    assert row['trace_id'] == res['trace_id']
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='dq.evaluated'").fetchone()


def test_dq_evaluate_endpoint_pass_and_validation(client):
    r = client.post('/api/dq/evaluate', json={'manifest': _clean_manifest()})
    assert r.status_code == 200
    assert r.get_json()['dq_gate_result']['outcome'] == 'PASS'

    r = client.post('/api/dq/evaluate', json={'manifest': {'tables': []}})
    assert r.status_code == 400
    assert r.get_json()['errors']

    r = client.post('/api/dq/evaluate', json={})
    assert r.status_code == 400

    r = client.post('/api/dq/evaluate', json={'connectionId': 999999})
    assert r.status_code == 404


def test_dq_results_query_endpoint(client):
    cid = _mk_connection(client)
    _run_governance(client, cid)
    client.post('/api/dq/evaluate', json={'connectionId': cid})
    client.post('/api/dq/evaluate', json={'connectionId': cid})

    rows = client.get(f'/api/dq/results?connection_id={cid}').get_json()
    assert len(rows) == 2
    assert rows[0]['id'] > rows[1]['id']  # latest first
    for row in rows:
        assert row['outcome'] in ('PASS', 'WARN', 'BLOCK')
        assert row['result_hash']
        assert row['rules']  # parsed JSON payload


# ── F-054 manifest table pagination ──────────────────────
def test_manifest_table_pagination(client):
    cid = _mk_connection(client)
    _run_governance(client, cid)
    full = client.get(f'/api/integrations/{cid}/manifest').get_json()
    total = len(full['tables'])
    assert total >= 3

    r = client.get(f'/api/integrations/{cid}/manifest?table_page=1&table_per_page=2').get_json()
    assert len(r['tables']) == 2
    assert r['table_total'] == total
    assert r['table_page'] == 1

    r2 = client.get(f'/api/integrations/{cid}/manifest?table_page=2&table_per_page=2').get_json()
    assert len(r2['tables']) == 2
    assert r['tables'][0]['name'] != r2['tables'][0]['name']
