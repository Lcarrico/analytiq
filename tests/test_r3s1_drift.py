"""
R3S1E3-US1 — Schema drift detection + alerting on manifest saves
"""
import json

from conftest import wait_until


def _mk(client):
    return client.post('/api/connections', json={
        'type': 'snowflake', 'name': 'drift', 'account': 'a', 'username': 'u',
        'password': 'p'}).get_json()['id']


def _gov(client, cid):
    before = len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json() or [])
    client.post('/api/governance/run', json={'connectionId': cid})
    wait_until(lambda: len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json()
                           or []) > before)


def test_schema_change_raises_drift_alert(client, app_mod, db):
    cid = _mk(client)
    _gov(client, cid)

    # same-schema save (PII approval) → no drift
    client.post(f'/api/integrations/{cid}/manifest/approve_pii',
                json={'columns': [{'table': 'dim_customer', 'column': 'email'}]})
    assert client.get(f'/api/integrations/{cid}/drift').get_json() == []

    # structural change (column dropped) saved through the drift-aware path
    m = client.get(f'/api/integrations/{cid}/manifest').get_json()
    changed = json.loads(json.dumps(m))
    changed['tables'] = [t for t in changed['tables'] if t['name'] != 'raw_clickstream']
    app_mod._save_manifest_with_drift(db, cid, changed)

    drift = client.get(f'/api/integrations/{cid}/drift').get_json()
    assert len(drift) == 1
    d = drift[0]['detail']
    assert 'raw_clickstream' in d['removed_tables']
    assert d['from_version'] and d['to_version'].startswith('2.')  # major bump
    assert db.execute("SELECT 1 FROM email_outbox WHERE subject LIKE '%drift%'").fetchone()


def test_first_manifest_never_drifts(client):
    cid = _mk(client)
    _gov(client, cid)
    assert client.get(f'/api/integrations/{cid}/drift').get_json() == []
