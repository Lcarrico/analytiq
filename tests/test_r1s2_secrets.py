"""
R1S2E3-US1 — Secrets provider abstraction (Infisical → local Fernet fallback)
+ /api/platform/status service-mode reporting.
"""


def test_secrets_store_roundtrip_encrypted(app_mod, db):
    import secrets_store
    secrets_store.put(db, 'warehouse/password', 'hunter2-secret')
    assert secrets_store.get(db, 'warehouse/password') == 'hunter2-secret'

    row = db.execute("SELECT * FROM secrets WHERE name='warehouse/password'").fetchone()
    assert 'hunter2' not in (row['value_encrypted'] or '')

    secrets_store.put(db, 'warehouse/password', 'rotated-secret')   # upsert
    assert secrets_store.get(db, 'warehouse/password') == 'rotated-secret'
    assert db.execute('SELECT COUNT(*) c FROM secrets').fetchone()['c'] == 1

    secrets_store.delete(db, 'warehouse/password')
    assert secrets_store.get(db, 'warehouse/password') is None


def test_secrets_provider_mode_detection(monkeypatch):
    import secrets_store
    monkeypatch.delenv('INFISICAL_TOKEN', raising=False)
    assert secrets_store.provider_mode() == 'local'
    monkeypatch.setenv('INFISICAL_TOKEN', 'x')
    assert secrets_store.provider_mode() == 'infisical'


def test_platform_status_reports_service_modes(client):
    r = client.get('/api/platform/status')
    assert r.status_code == 200
    s = r.get_json()
    # zero-key sandbox → every service must be in local/fallback mode
    assert s['auth']['mode'] == 'local'
    assert s['secrets']['mode'] == 'local'
    for svc in ('auth', 'secrets', 'queue', 'storage', 'search', 'email', 'logging'):
        assert svc in s
        assert s[svc]['mode']
        assert s[svc]['fallback_active'] in (True, False)
