"""R37S1E1-US1 — trust surfaces render from evidence only (deep-dive F-10).
The plan payload carries a derived trust block; the contracts payload derives
per-contract SQL safety instead of the UI hard-coding green badges."""
from conftest import wait_until


def _governed(client):
    conn = client.post('/api/connections', json={'type': 'snowflake', 'account': 't',
                                                 'username': 't', 'password': 't'}).get_json()
    rid = client.post('/api/governance/run', json={'connectionId': conn['id']}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/governance/{rid}').get_json().get('status')
               in ('done', 'complete'), timeout=30)
    wait_until(lambda: len(client.get(
        f"/api/integrations/{conn['id']}/manifest/versions").get_json()) >= 1, timeout=10)
    r = client.post('/api/semantic/default/generate',
                    json={'connectionId': conn['id']})
    assert r.status_code in (200, 201)
    return conn['id']


def test_plan_trust_block_is_evidence_bound(client):
    # fresh workspace: no semantic schema, no manifest → ungoverned, stated
    p = client.post('/api/sessions/plan',
                    json={'message': 'Forecast net revenue for the next 14 days'}).get_json()
    assert p['trust']['governed'] is False
    assert p['trust']['schema_version'] is None

    _governed(client)
    p2 = client.post('/api/sessions/plan',
                     json={'message': 'Forecast net revenue for the next 14 days'}).get_json()
    assert p2['trust']['governed'] is True
    assert p2['trust']['schema_version']
    assert p2['trust']['manifest_version']


def test_contract_payload_derives_sql_safety(client, db):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done',
               timeout=30)
    d = client.get(f'/api/pipeline/{rid}/contracts').get_json()
    assert d['trust']['contracts'] >= 3
    assert d['trust']['sql_validated'] is True
    assert all(qc['sql_safe'] is True for qc in d['query_contracts'])

    # a tampered (unsafe) contract flips the derivation — never hard-coded
    db.execute("UPDATE query_contracts SET sql='DROP TABLE artifacts' "
               'WHERE run_id=? AND component_id=?', (rid, 'forecast'))
    db.commit()
    d2 = client.get(f'/api/pipeline/{rid}/contracts').get_json()
    assert d2['trust']['sql_validated'] is False
    bad = next(q for q in d2['query_contracts'] if q['component_id'] == 'forecast')
    assert bad['sql_safe'] is False
