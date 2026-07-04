"""
Sprint 6 — Feature Manifest & Versioning (scaffold)
  F-026 feature_manifests row per gold write, semver versions, immutability
        (DB trigger + API 409), JSON-schema validation, audit, GET API
"""
import json

import pytest
import sqlite3
from conftest import wait_until

SPEC = {
    'intent': 'predictive', 'intent_confidence': 0.93,
    'analytic_goal': 'Predict net revenue for the next 14 days by location',
    'target_metric': 'Net Revenue',
    'feature_candidates': ['net_revenue', 'day', 'location_id', 'tier'],
    'date_range': {'start': '2023-01-01', 'end': '2023-12-31'},
    'grain': 'Location · Day', 'output_type': 'forecast_dashboard',
    'prediction_horizon': 14, 'explores_used': ['fact_revenue', 'dim_location'],
    'semantic_layer_version': '1.0.0', 'governance_manifest_version': '1.0.0',
}


def _prepared_session(client, spec=None):
    cid = client.post('/api/connections', json={
        'name': 'fm', 'type': 'snowflake', 'account': 'a', 'username': 'u',
        'password': 'p'}).get_json()['id']
    run_id = client.post('/api/governance/run', json={'connectionId': cid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/governance/{run_id}').get_json().get('status') == 'done')
    wait_until(lambda: client.get(f'/api/integrations/{cid}/manifest').status_code == 200)
    client.post('/api/semantic/default/generate', json={'connectionId': cid})
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    client.post(f'/api/sessions/{sid}/spec', json=spec or dict(SPEC))
    return sid


def test_gold_write_creates_feature_manifest(client, db):
    sid = _prepared_session(client)
    out = client.post('/api/modeler/generate',
                      json={'sessionId': sid, 'mode': 'execute'}).get_json()

    rows = db.execute('SELECT * FROM feature_manifests').fetchall()
    assert len(rows) == 1
    fm = dict(rows[0])
    assert fm['manifest_version'] == '1.0.0'
    assert fm['workspace_id'] == 'default'
    assert fm['session_id'] == sid
    assert fm['gold_table_name'] == out['table_name']
    feats = json.loads(fm['feature_list_json'])
    assert isinstance(feats, list) and feats
    names = {f['name'] for f in feats}
    assert 'tier' in names
    assert all({'name', 'dtype', 'source'} <= set(f) for f in feats)

    # gold table row references the manifest version
    g = db.execute('SELECT manifest_version FROM gold_tables WHERE session_id=?', (sid,)).fetchone()
    assert g['manifest_version'] == '1.0.0'

    # audited
    a = db.execute("SELECT * FROM audit_logs WHERE action='feature_manifest.created'").fetchone()
    assert a is not None
    assert json.loads(a['metadata'])['manifest_version'] == '1.0.0'


def test_feature_manifest_semver_bumps(client, db):
    sid = _prepared_session(client)
    client.post('/api/modeler/generate', json={'sessionId': sid, 'mode': 'execute'})
    client.post('/api/modeler/generate', json={'sessionId': sid, 'mode': 'execute'})
    versions = [r['manifest_version'] for r in db.execute(
        'SELECT manifest_version FROM feature_manifests ORDER BY id').fetchall()]
    assert versions == ['1.0.0', '1.0.1']  # identical feature list → patch

    # changed feature list → minor bump
    spec2 = dict(SPEC, feature_candidates=['net_revenue', 'day', 'location_id'])
    client.post(f'/api/sessions/{sid}/spec', json=spec2)
    client.post('/api/modeler/generate', json={'sessionId': sid, 'mode': 'execute'})
    versions = [r['manifest_version'] for r in db.execute(
        'SELECT manifest_version FROM feature_manifests ORDER BY id').fetchall()]
    assert versions == ['1.0.0', '1.0.1', '1.1.0']


def test_feature_manifest_immutable_at_db_level(client, db):
    sid = _prepared_session(client)
    client.post('/api/modeler/generate', json={'sessionId': sid, 'mode': 'execute'})
    with pytest.raises(sqlite3.IntegrityError):
        db.execute("UPDATE feature_manifests SET manifest_version='9.9.9' WHERE id=1")

    # API refuses mutation with 409
    fm_id = db.execute('SELECT id FROM feature_manifests').fetchone()['id']
    r = client.patch(f'/api/feature_manifests/{fm_id}', json={'manifest_version': '9.9.9'})
    assert r.status_code == 409


def test_feature_manifest_get_api(client, db):
    sid = _prepared_session(client)
    client.post('/api/modeler/generate', json={'sessionId': sid, 'mode': 'execute'})
    fm_id = db.execute('SELECT id FROM feature_manifests').fetchone()['id']

    r = client.get(f'/api/feature_manifests/{fm_id}')
    assert r.status_code == 200
    body = r.get_json()
    assert body['manifest_version'] == '1.0.0'
    assert isinstance(body['feature_list'], list)
    assert client.get('/api/feature_manifests/99999').status_code == 404

    by_session = client.get(f'/api/feature_manifests?session_id={sid}').get_json()
    assert len(by_session) == 1


def test_feature_manifest_schema_validation_unit():
    import feature_manifest as fm
    ok = {'manifest_version': '1.0.0', 'workspace_id': 'default', 'session_id': 3,
          'gold_table_name': 'analytics_default.gold_x_v1', 'generated_at': 'now',
          'feature_list': [{'name': 'tier', 'dtype': 'dimension', 'source': 'dim_location'}]}
    assert fm.validate_feature_manifest(ok) == []

    errs = fm.validate_feature_manifest({'feature_list': 'nope'})
    codes = {e['code'] for e in errs}
    assert 'missing_field' in codes
    assert 'invalid_feature_list' in codes

    errs = fm.validate_feature_manifest(dict(ok, manifest_version='banana'))
    assert 'invalid_semver' in {e['code'] for e in errs}
