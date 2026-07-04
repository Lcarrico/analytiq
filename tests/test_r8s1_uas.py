"""
R8S1E1-US1 — Unified Artifact Store (Architecture v2.1 §17.3.2)

Every pipeline-stage output stored as a versioned, content-addressed artifact
in one immutable store with the §17.3.2 common metadata schema.
"""
import json
import sqlite3

import pytest
from conftest import wait_until


def _run_pipeline(client):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    run = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()
    wait_until(lambda: client.get(f"/api/pipeline/{run['runId']}").get_json().get('status') == 'done',
               timeout=30)
    return sid, run['runId']


def _save_artifact(client, sid):
    r = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'UAS Test Artifact'})
    assert r.status_code == 201
    return r.get_json()


# ── register(): idempotent, content-addressed, versioned ──────────────────

def test_register_is_idempotent_and_content_addressed(db):
    import uas
    a1 = uas.register(db, 'session_spec', {'metric': 'Net Revenue', 'grain': 'day'},
                      logical_key='w1:session_spec:t1', gov_version='1.0.0',
                      sem_version='1.0.0', agent='planner')
    a2 = uas.register(db, 'session_spec', {'metric': 'Net Revenue', 'grain': 'day'},
                      logical_key='w1:session_spec:t1', gov_version='1.0.0',
                      sem_version='1.0.0', agent='planner')
    # identical payload+context → same artifact, same hash, no new version
    assert a1['artifact_uid'] == a2['artifact_uid']
    assert a1['content_hash'] == a2['content_hash']
    assert a1['version'] == a2['version'] == 1

    a3 = uas.register(db, 'session_spec', {'metric': 'Net Revenue', 'grain': 'week'},
                      logical_key='w1:session_spec:t1', gov_version='1.0.0',
                      sem_version='1.0.0', agent='planner')
    assert a3['version'] == 2
    assert a3['content_hash'] != a1['content_hash']
    assert a3['artifact_uid'] != a1['artifact_uid']


def test_context_versions_are_part_of_identity(db):
    import uas
    a1 = uas.register(db, 'query_contract', {'sql': 'SELECT 1'},
                      logical_key='w1:qc:c1', gov_version='1.0.0', sem_version='1.0.0')
    a2 = uas.register(db, 'query_contract', {'sql': 'SELECT 1'},
                      logical_key='w1:qc:c1', gov_version='1.0.0', sem_version='1.1.0')
    # same payload under a different semantic version is a different artifact
    assert a2['content_hash'] != a1['content_hash']
    assert a2['version'] == 2


def test_store_is_immutable_append_only(db):
    import uas
    a = uas.register(db, 'model_card', {'algo': 'ridge'}, logical_key='w1:mc:1')
    with pytest.raises(sqlite3.IntegrityError):
        db.execute('UPDATE uas_artifacts SET payload_json=? WHERE artifact_uid=?',
                   ('{"tampered": true}', a['artifact_uid']))
    with pytest.raises(sqlite3.IntegrityError):
        db.execute('DELETE FROM uas_artifacts WHERE artifact_uid=?', (a['artifact_uid'],))


# ── pipeline + artifact save register the full chain ──────────────────────

def test_pipeline_registers_stage_chain(client, db):
    sid, run_id = _run_pipeline(client)
    art = _save_artifact(client, sid)

    rows = client.get(f'/api/uas/artifacts?run_id={run_id}').get_json()['artifacts']
    types = {r['artifact_type'] for r in rows}
    assert {'session_spec', 'dashboard_plan', 'gold_predictions_ref',
            'gold_forecast_ref', 'artifact_html_ref'} <= types

    by_type = {r['artifact_type']: r for r in rows}
    spec_uid = by_type['session_spec']['artifact_uid']
    plan = by_type['dashboard_plan']
    assert spec_uid in plan['upstream_artifact_ids']
    for t in ('gold_predictions_ref', 'gold_forecast_ref'):
        assert plan['artifact_uid'] in by_type[t]['upstream_artifact_ids']
    html_up = set(by_type['artifact_html_ref']['upstream_artifact_ids'])
    assert {by_type['gold_predictions_ref']['artifact_uid'],
            by_type['gold_forecast_ref']['artifact_uid']} <= html_up

    # §17.3.2 common schema fields all populated
    for r in rows:
        assert r['content_hash'] and len(r['content_hash']) == 64
        assert r['governance_manifest_version'] is not None
        assert r['semantic_layer_version'] is not None
        assert r['created_by_agent']
        assert r['version'] >= 1


def test_identical_rerun_reuses_content_addressed_nodes(client, db):
    """Same session re-run: stage payloads identical → same content hashes
    (identical inputs provably identical — §1.1 determinism)."""
    sid, run1 = _run_pipeline(client)
    h1 = {r['artifact_type']: r['content_hash'] for r in
          client.get(f'/api/uas/artifacts?run_id={run1}').get_json()['artifacts']}
    run2 = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{run2}').get_json().get('status') == 'done',
               timeout=30)
    h2 = {r['artifact_type']: r['content_hash'] for r in
          client.get(f'/api/uas/artifacts?run_id={run2}').get_json()['artifacts']}
    assert h1['session_spec'] == h2['session_spec']
    assert h1['dashboard_plan'] == h2['dashboard_plan']


# ── API contracts ──────────────────────────────────────────────────────────

def test_uas_get_and_versions_api(client, db):
    import uas
    uas.register(db, 'semantic_schema', {'v': 1}, logical_key='w1:ss:1')
    a2 = uas.register(db, 'semantic_schema', {'v': 2}, logical_key='w1:ss:1')

    r = client.get(f"/api/uas/artifacts/{a2['artifact_uid']}")
    assert r.status_code == 200
    body = r.get_json()
    assert body['payload'] == {'v': 2}
    assert body['artifact_type'] == 'semantic_schema'

    assert client.get('/api/uas/artifacts/nope-not-a-uid').status_code == 404

    vs = client.get(f"/api/uas/artifacts/{a2['artifact_uid']}/versions").get_json()['versions']
    assert [v['version'] for v in vs] == [2, 1]      # newest first

    filt = client.get('/api/uas/artifacts?type=semantic_schema').get_json()['artifacts']
    assert filt and all(f['artifact_type'] == 'semantic_schema' for f in filt)


def test_artifact_provenance_endpoint(client, db):
    sid, run_id = _run_pipeline(client)
    art = _save_artifact(client, sid)
    r = client.get(f"/api/artifacts/{art['id']}/provenance")
    assert r.status_code == 200
    chain = r.get_json()['chain']
    types = [c['artifact_type'] for c in chain]
    assert types[0] == 'session_spec'                # ordered source → output
    assert types[-1] == 'artifact_html_ref'
    assert {'dashboard_plan', 'gold_predictions_ref', 'gold_forecast_ref'} <= set(types)
    assert client.get('/api/artifacts/999999/provenance').status_code == 404


def test_registration_is_audited(client, db):
    sid, run_id = _run_pipeline(client)
    n = db.execute("SELECT COUNT(*) c FROM audit_logs WHERE action='uas.registered'").fetchone()['c']
    assert n >= 4
