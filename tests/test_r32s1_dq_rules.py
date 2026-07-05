"""
R32S1E4-US1 (backend) — DQ rules layer: merged rule catalog (system gates +
custom tests), per-connection enable / block-on-failure settings, and an
engine that honors them (disabled -> SKIPPED, block flag up/downgrades).
"""
from conftest import wait_until


def _connect(client):
    conn = client.post('/api/connections', json={'type': 'snowflake', 'account': 'd',
                                                 'username': 'd', 'password': 'd'}).get_json()
    rid = client.post('/api/governance/run', json={'connectionId': conn['id']}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/governance/{rid}').get_json().get('status')
               in ('done', 'complete'), timeout=30)
    return conn['id']


def test_rules_catalog_merges_system_and_custom(client):
    cid = _connect(client)
    t = client.post('/api/dq/tests', json={'connectionId': cid, 'table': 'artifacts',
                                           'expression': 'id IS NOT NULL'}).get_json()
    rules = client.get(f'/api/dq/rules?connection_id={cid}').get_json()['rules']
    system = [r for r in rules if r['kind'] == 'system']
    custom = [r for r in rules if r['kind'] == 'custom']
    assert len(system) >= 7 and len(custom) == 1
    pk = next(r for r in system if r['rule_id'] == 'pk_uniqueness')
    assert pk['enabled'] is True and pk['block_on_failure'] is True   # critical default
    assert pk['severity'] == 'critical' and pk['threshold']
    fresh = next(r for r in system if r['rule_id'] == 'freshness_sla')
    assert fresh['block_on_failure'] is False                          # warning default
    assert custom[0]['rule_id'] == f"custom:{t['id']}" and custom[0]['enabled'] is True


def test_rule_settings_persist_and_audit(client):
    cid = _connect(client)
    r = client.put('/api/dq/rules/pk_uniqueness',
                   json={'connectionId': cid, 'enabled': False})
    assert r.status_code == 200
    rules = client.get(f'/api/dq/rules?connection_id={cid}').get_json()['rules']
    assert next(x for x in rules if x['rule_id'] == 'pk_uniqueness')['enabled'] is False
    logs = client.get('/api/audit-logs?action=dq.rule_updated&limit=3').get_json()
    entries = logs if isinstance(logs, list) else logs.get('entries', [])
    assert entries
    assert client.put('/api/dq/rules/nope', json={'connectionId': cid,
                                                  'enabled': False}).status_code == 404


def test_custom_test_toggle_and_run_skip(client):
    cid = _connect(client)
    t = client.post('/api/dq/tests', json={'connectionId': cid, 'table': 'artifacts',
                                           'expression': 'id IS NOT NULL'}).get_json()
    client.put(f"/api/dq/rules/custom:{t['id']}", json={'connectionId': cid, 'enabled': False})
    run = client.post(f'/api/dq/tests/run?connection_id={cid}').get_json()
    assert all(r['id'] != t['id'] for r in run['results'])   # disabled test not executed


def test_engine_honors_disable_and_block_flag(client):
    cid = _connect(client)
    base = client.post('/api/dq/evaluate', json={'connectionId': cid}).get_json()
    rules = {r['rule_id']: r for r in base['dq_gate_result']['rules']}
    assert rules['pk_uniqueness']['outcome'] in ('PASS', 'WARN', 'BLOCK')

    # Disable a rule -> SKIPPED, excluded from the overall outcome.
    client.put('/api/dq/rules/pk_uniqueness', json={'connectionId': cid, 'enabled': False})
    res = client.post('/api/dq/evaluate', json={'connectionId': cid}).get_json()
    rules2 = {r['rule_id']: r for r in res['dq_gate_result']['rules']}
    assert rules2['pk_uniqueness']['outcome'] == 'SKIPPED'

    # Turn off block-on-failure for a critical failing rule -> WARN, not BLOCK.
    if rules['pii_detection']['outcome'] == 'BLOCK':
        client.put('/api/dq/rules/pii_detection',
                   json={'connectionId': cid, 'block_on_failure': False})
        res = client.post('/api/dq/evaluate', json={'connectionId': cid}).get_json()
        rules3 = {r['rule_id']: r for r in res['dq_gate_result']['rules']}
        assert rules3['pii_detection']['outcome'] == 'WARN'

    # Escalate a failing warning rule -> BLOCK (409 surfaced).
    failing_warn = next((k for k, v in rules.items() if v['outcome'] == 'WARN'), None)
    if failing_warn:
        client.put(f'/api/dq/rules/{failing_warn}',
                   json={'connectionId': cid, 'block_on_failure': True})
        r = client.post('/api/dq/evaluate', json={'connectionId': cid})
        rules4 = {x['rule_id']: x for x in r.get_json()['dq_gate_result']['rules']}
        assert rules4[failing_warn]['outcome'] == 'BLOCK'
