"""
Sprint 2 — Governance Agent & UI
  F-006 Governance pipeline: manifest emission, dq_gate SSE events
  F-007 Governance manifest schema (versioned semver JSON, immutable, rollback)
  F-008 PII detection service (regex + token classifier, hashed evidence,
        ML blocking + admin approval)
  Table health scoring engine (PK / freshness / row-count / null penalties)
"""
import json
from queue import Queue, Empty

from conftest import wait_until


def _mk_connection(client):
    return client.post('/api/connections', json={
        'name': 'gov-test', 'type': 'snowflake', 'account': 'acct',
        'username': 'u', 'password': 'p',
    }).get_json()['id']


def _run_governance(client, cid):
    before = len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json() or [])
    run_id = client.post('/api/governance/run', json={'connectionId': cid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/governance/{run_id}').get_json().get('status') == 'done')
    # wait for THIS run's manifest version (a previous run's manifest may already exist)
    wait_until(lambda: len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json()
                           or []) > before)
    return run_id


# ── PII service ──────────────────────────────────────────
def test_pii_regex_patterns():
    import pii
    hits = {
        'email': 'user@example.com', 'ssn': '123-45-6789', 'phone': '555-123-4567',
        'credit_card': '4111111111111111', 'ip': '192.168.10.44',
    }
    for ptype, sample in hits.items():
        assert pii.match_pattern(sample) == ptype, f'{sample} should match {ptype}'
    for clean in ('hello world', '42', 'shipped', '2024-01-01'):
        assert pii.match_pattern(clean) is None


def test_pii_scan_column_confidence_and_hashed_evidence():
    import pii
    emails = [f'user{i}@corp.com' for i in range(50)]
    flag = pii.scan_column('email', emails)
    assert flag['pattern_type'] == 'email'
    assert flag['confidence'] >= 0.6
    assert flag['evidence'] and len(flag['evidence']) <= 5
    assert all('@' not in e and 'corp.com' not in e for e in flag['evidence'])  # hashed

    # name signal alone (no matching values) → low confidence, below block threshold
    weak = pii.scan_column('email_opt_in', ['yes', 'no', 'yes'])
    assert weak is None or weak['confidence'] < 0.6

    assert pii.scan_column('amount', [1.5, 2.5, 9.0]) is None


def test_health_score_penalties():
    import dq
    assert dq.compute_health_score(has_pk=True, freshness='2h ago', row_count=1_000_000) == 100
    assert dq.compute_health_score(has_pk=False, freshness='2h ago', row_count=1_000_000) == 85
    assert dq.compute_health_score(has_pk=True, freshness='N/A', row_count=1_000_000) == 90
    assert dq.compute_health_score(has_pk=True, freshness='2h ago', row_count=450) == 90
    assert dq.compute_health_score(has_pk=True, freshness='2h ago', row_count=50) == 70
    assert dq.compute_health_score(has_pk=False, freshness='N/A', row_count=10,
                                   null_pct=60) >= 0  # floors at 0, never negative


def test_dq_gate_engine_mapping():
    import dq
    base = {'pk_gate': 'pass', 'null_gate': 'pass', 'freshness_gate': 'pass',
            'pii_gate': 'pass', 'row_min_gate': 'pass'}
    assert dq.evaluate_gates(base) == 'PASS'
    assert dq.evaluate_gates({**base, 'pk_gate': 'fail'}) == 'BLOCK'          # critical
    assert dq.evaluate_gates({**base, 'null_gate': 'fail'}) == 'BLOCK'        # critical
    assert dq.evaluate_gates({**base, 'pii_gate': 'flag'}) == 'BLOCK'         # PII blocks ML
    assert dq.evaluate_gates({**base, 'freshness_gate': 'fail'}) == 'WARN'    # non-critical
    assert dq.evaluate_gates({**base, 'row_min_gate': 'fail'}) == 'WARN'      # non-critical
    assert dq.evaluate_gates({**base, 'null_gate': 'warn'}) == 'WARN'


# ── manifest generation via governance run ──────────────
def test_governance_run_emits_manifest_v1(client):
    cid = _mk_connection(client)
    _run_governance(client, cid)

    r = client.get(f'/api/integrations/{cid}/manifest')
    assert r.status_code == 200
    m = r.get_json()
    assert m['manifest_version'] == '1.0.0'
    assert m['integration_id'] == cid
    assert m['generated_at']
    assert m['human_review_required'] is True  # sim defs include low-confidence
    assert isinstance(m['tables'], list) and m['tables']
    by_name = {t['name']: t for t in m['tables']}
    assert 'dim_customer' in by_name
    cust_cols = {c['name']: c for c in by_name['dim_customer']['columns']}
    email_flags = cust_cols['email']['pii_flags']
    assert email_flags and email_flags['pattern_type'] == 'email'
    assert email_flags['confidence'] >= 0.6
    assert cust_cols['email']['allow_ml_use'] is False
    for t in m['tables']:
        assert t['dq_gate_status'] in ('PASS', 'WARN', 'BLOCK')
        assert 0 <= t['health_score'] <= 100
    assert by_name['dim_customer']['dq_gate_status'] == 'BLOCK'  # has PII


def test_manifest_minor_bump_on_rerun_and_version_query(client):
    cid = _mk_connection(client)
    _run_governance(client, cid)
    _run_governance(client, cid)

    latest = client.get(f'/api/integrations/{cid}/manifest').get_json()
    assert latest['manifest_version'] == '1.1.0'  # same schema → minor bump

    versions = client.get(f'/api/integrations/{cid}/manifest/versions').get_json()
    assert [v['version'] for v in versions] == ['1.1.0', '1.0.0']

    old = client.get(f'/api/integrations/{cid}/manifest?version=1.0.0')
    assert old.status_code == 200
    assert old.get_json()['manifest_version'] == '1.0.0'  # immutable history

    assert client.get(f'/api/integrations/{cid}/manifest?version=9.9.9').status_code == 404


def test_manifest_major_bump_on_schema_change_unit():
    import manifest
    prev = {'manifest_version': '1.2.0',
            'tables': [{'name': 't1', 'columns': [{'name': 'a'}, {'name': 'b'}]}]}
    same_schema = {'tables': [{'name': 't1', 'columns': [{'name': 'a'}, {'name': 'b'}]}]}
    changed = {'tables': [{'name': 't1', 'columns': [{'name': 'a'}, {'name': 'c'}]}]}
    added_tbl = {'tables': prev['tables'] + [{'name': 't2', 'columns': [{'name': 'x'}]}]}
    assert manifest.next_version(prev, same_schema) == '1.3.0'
    assert manifest.next_version(prev, changed) == '2.0.0'
    assert manifest.next_version(prev, added_tbl) == '2.0.0'
    assert manifest.next_version(None, same_schema) == '1.0.0'


def test_manifest_404_before_any_run(client):
    cid = _mk_connection(client)
    assert client.get(f'/api/integrations/{cid}/manifest').status_code == 404


# ── PII approval flow ────────────────────────────────────
def test_approve_pii_admin_only_creates_new_version_and_audit(client, db):
    cid = _mk_connection(client)
    _run_governance(client, cid)

    r = client.post(f'/api/integrations/{cid}/manifest/approve_pii',
                    json={'columns': [{'table': 'dim_customer', 'column': 'email'}]},
                    headers={'X-User-Role': 'viewer'})
    assert r.status_code == 403

    r = client.post(f'/api/integrations/{cid}/manifest/approve_pii',
                    json={'columns': [{'table': 'dim_customer', 'column': 'email'}],
                          'justification': 'masked upstream'},
                    headers={'X-User-Role': 'admin'})
    assert r.status_code == 200
    m = r.get_json()
    assert m['manifest_version'] == '1.1.0'  # new immutable minor version
    cust = next(t for t in m['tables'] if t['name'] == 'dim_customer')
    email = next(c for c in cust['columns'] if c['name'] == 'email')
    assert email['allow_ml_use'] is True
    assert email['pii_flags']  # flag retained for audit visibility

    # previous version untouched
    v1 = client.get(f'/api/integrations/{cid}/manifest?version=1.0.0').get_json()
    cust1 = next(t for t in v1['tables'] if t['name'] == 'dim_customer')
    email1 = next(c for c in cust1['columns'] if c['name'] == 'email')
    assert email1['allow_ml_use'] is False

    row = db.execute("SELECT * FROM audit_logs WHERE action='manifest.pii_approved'").fetchone()
    assert row is not None
    meta = json.loads(row['metadata'])
    assert meta['justification'] == 'masked upstream'

    # empty columns → 400
    r = client.post(f'/api/integrations/{cid}/manifest/approve_pii', json={},
                    headers={'X-User-Role': 'admin'})
    assert r.status_code == 400


def test_manifest_rollback_creates_new_version(client, db):
    cid = _mk_connection(client)
    _run_governance(client, cid)
    _run_governance(client, cid)  # → 1.1.0

    r = client.post(f'/api/integrations/{cid}/manifest/rollback',
                    json={'version': '1.0.0'}, headers={'X-User-Role': 'admin'})
    assert r.status_code == 200
    m = r.get_json()
    assert m['manifest_version'] == '1.2.0'   # immutable append, not overwrite
    assert m['rolled_back_from'] == '1.0.0'

    versions = [v['version'] for v in
                client.get(f'/api/integrations/{cid}/manifest/versions').get_json()]
    assert versions == ['1.2.0', '1.1.0', '1.0.0']

    assert client.post(f'/api/integrations/{cid}/manifest/rollback',
                       json={'version': '8.8.8'}, headers={'X-User-Role': 'admin'}).status_code == 404
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='manifest.rolled_back'").fetchone()


# ── SSE dq_gate events ───────────────────────────────────
def test_gov_stream_broadcasts_dq_gate_events(client, app_mod, db):
    cid = _mk_connection(client)
    # create run row directly so the queue is registered before the sim starts
    cur = db.execute("INSERT INTO governance_runs (connection_id,status,current_step) VALUES (?,?,0)",
                     (cid, 'running'))
    db.commit()
    run_id = cur.lastrowid

    q = Queue()
    with app_mod._gov_lock:
        app_mod._gov_clients.setdefault(run_id, []).append(q)

    app_mod.simulate_governance(run_id)

    events = []

    def drain():
        try:
            while True:
                events.append(q.get(timeout=0.2))
        except Empty:
            return events

    wait_until(lambda: client.get(f'/api/governance/{run_id}').get_json().get('status') == 'done')
    drain()
    types = [e.get('type') for e in events if isinstance(e, dict)]
    dq_events = [e for e in events if e.get('type') == 'dq_gate']
    assert dq_events, f'expected dq_gate events, got types={types}'
    for e in dq_events:
        assert e['table'] and e['gate_status'] in ('PASS', 'WARN', 'BLOCK')
    assert any(e.get('type') == 'agent_complete' for e in events)
