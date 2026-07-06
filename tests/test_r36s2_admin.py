"""
R36S2E2-US1 (backend) — admin overview aggregate + roles matrix kv (DEP):
nine live KPI groups; the matrix persists per-permission grants and every
change lands in the audit log.
"""
from conftest import wait_until


def test_admin_overview(client):
    conn = client.post('/api/connections', json={'type': 'snowflake', 'account': 'ad',
                                                 'username': 'u', 'password': 'p'}).get_json()
    rid = client.post('/api/governance/run', json={'connectionId': conn['id']}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/governance/{rid}').get_json().get('status')
               in ('done', 'complete'), timeout=30)

    d = client.get('/api/admin/overview').get_json()
    for k in ('users', 'roles', 'integrations', 'governance_backlog',
              'audit_24h', 'token_usage', 'security_warnings', 'share_links', 'sso'):
        assert k in d, k
    assert d['integrations']['total'] >= 1
    assert d['governance_backlog']['total'] >= 1     # low-confidence defs pending
    assert d['audit_24h']['total'] >= 1              # this run logged actions
    assert d['sso']['status'] in ('LOCAL', 'ENFORCED', 'CONFIGURED')


def test_roles_matrix_kv(client):
    d = client.get('/api/admin/roles').get_json()
    assert 'Create dashboards' in d['permissions']
    assert d['matrix']['Create dashboards']['admin'] is True
    assert d['matrix']['Public sharing']['viewer'] is False
    assert 'View SQL expressions' in d['sensitive']

    r = client.patch('/api/admin/roles', json={
        'permission': 'Public sharing', 'role': 'analyst', 'granted': False})
    assert r.status_code == 200
    d2 = client.get('/api/admin/roles').get_json()
    assert d2['matrix']['Public sharing']['analyst'] is False
    logs = client.get('/api/audit-logs?action=roles.updated&limit=3').get_json()
    entries = logs if isinstance(logs, list) else logs.get('entries', [])
    assert entries


def test_sso_settings_kv(client):
    """R36S2E3 — SSO settings persist in the workspace kv, drive the admin
    overview status, and Test login validates the config (audited)."""
    d = client.get('/api/admin/sso').get_json()
    assert d['status'] == 'LOCAL' and d['enforced'] is False

    r = client.put('/api/admin/sso', json={
        'provider': 'saml', 'sso_url': 'https://acme.okta.com/app/sso/saml',
        'entity_id': 'urn:analytiq:workspace:acme',
        'domains': ['acmeretail.com'], 'default_role': 'analyst',
        'session_hours': 8, 'enforced': True})
    assert r.status_code == 200
    d2 = client.get('/api/admin/sso').get_json()
    assert d2['status'] == 'ENFORCED'
    assert d2['domains'][0]['domain'] == 'acmeretail.com'
    assert d2['domains'][0]['verified'] is True      # deterministic demo verify

    t = client.post('/api/admin/sso/test').get_json()
    assert t['ok'] is True and 'saml' in t['message'].lower()

    ov = client.get('/api/admin/overview').get_json()
    assert ov['sso']['status'] == 'ENFORCED'

    bad = client.put('/api/admin/sso', json={'provider': 'saml', 'sso_url': 'notaurl'})
    assert bad.status_code == 400


def test_admin_security_endpoints(client):
    """R36S2E4 — secrets listing (masked, rotate audited), RLS policy list,
    sharing rules kv + live counts."""
    conn = client.post('/api/connections', json={'type': 'snowflake', 'account': 'sec',
                                                 'username': 'u', 'password': 'p'}).get_json()

    d = client.get('/api/admin/secrets').get_json()
    row = next(r for r in d['secrets'] if r['connection_id'] == conn['id'])
    assert row['credential'].startswith('••••') or '••••' in row['credential']
    assert 'p' not in row['credential']              # never the raw value
    assert row['status'] in ('healthy', 'stale')

    r = client.post(f"/api/admin/secrets/{conn['id']}/rotate")
    assert r.status_code == 200
    logs = client.get('/api/audit-logs?action=secret.rotated&limit=3').get_json()
    entries = logs if isinstance(logs, list) else logs.get('entries', [])
    assert entries

    # RLS list over existing policies
    client.post('/api/admin/rls', json={'table_name': 'artifacts',
                                        'expression': "id > 0"})
    pol = client.get('/api/admin/rls').get_json()
    assert pol['policies'] and pol['policies'][0]['table_name']

    # sharing rules kv + counts
    s = client.get('/api/admin/sharing').get_json()
    assert 'rules' in s and 'counts' in s
    client.put('/api/admin/sharing', json={'public_links': True,
                                           'max_expiration_days': 90,
                                           'allowed_domains': ['*.acme.com'],
                                           'scopes': ['read_only']})
    s2 = client.get('/api/admin/sharing').get_json()
    assert s2['rules']['max_expiration_days'] == 90
    assert s2['rules']['allowed_domains'] == ['*.acme.com']
