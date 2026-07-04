"""
R16S1E1-US1 (backend slice) — plan payloads disclose access limitations
(masked PII columns) so the workbench plan card can render its ACCESS row
(PRD §7.5; gap §21-2).
"""
from conftest import wait_until


def _governed_connection(client):
    cid = client.post('/api/connections', json={
        'type': 'snowflake', 'name': 'wb', 'account': 'a', 'username': 'u',
        'password': 'p'}).get_json()['id']
    before = len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json() or [])
    client.post('/api/governance/run', json={'connectionId': cid})
    wait_until(lambda: len(client.get(f'/api/integrations/{cid}/manifest/versions').get_json()
                           or []) > before)
    return cid


def test_plan_discloses_masked_pii_columns(client, db):
    cid = _governed_connection(client)
    manifest = client.get(f'/api/integrations/{cid}/manifest').get_json()
    pii_cols = [f"{t['name']}.{p['column']}" for t in manifest['manifest']['tables']
                for p in (t.get('pii_flags') or []) if p.get('pii_risk') == 'confirmed'] \
        if isinstance(manifest.get('manifest'), dict) else None

    plan = client.post('/api/sessions/plan',
                       json={'message': 'Forecast net revenue for the next 14 days by location',
                             'connectionId': cid}).get_json()
    assert 'access_limitations' in plan
    al = plan['access_limitations']
    assert al['masked_columns'] is not None            # list, possibly empty
    assert isinstance(al['masked_columns'], list)
    assert al['note']
    # governance sim seeds confirmed-PII columns — they must be disclosed
    assert len(al['masked_columns']) >= 1


def test_plan_without_connection_reports_no_limitations(client, db):
    plan = client.post('/api/sessions/plan',
                       json={'message': 'Forecast net revenue for the next 14 days by location'}
                       ).get_json()
    assert plan['access_limitations']['masked_columns'] == []
