"""
R1S1E1 — Auth service & identity middleware (Clerk/Supabase → local fallback)
Stories: R1S1E1-US1 (register/login/me, hashed tokens), R1S1E1-US2 (bearer
identity resolution with legacy X-User-Role compatibility).
"""
import json
from datetime import datetime, timedelta


def _register(client, email='leo@acme.com', password='s3cret-pass', role='analyst'):
    return client.post('/api/auth/register',
                       json={'email': email, 'password': password, 'role': role})


# ── US1: register / login / me ───────────────────────────
def test_register_validation_and_duplicates(client):
    r = _register(client)
    assert r.status_code == 201
    assert r.get_json()['email'] == 'leo@acme.com'
    assert 'password' not in json.dumps(r.get_json())

    assert _register(client).status_code == 409                      # duplicate
    assert client.post('/api/auth/register',
                       json={'email': 'bad', 'password': 's3cret-pass'}).status_code == 400
    assert client.post('/api/auth/register',
                       json={'email': 'x@y.co', 'password': 'short'}).status_code == 400
    assert client.post('/api/auth/register',
                       json={'email': 'x@y.co', 'password': 's3cret-pass',
                             'role': 'superuser'}).status_code == 400


def test_password_and_token_stored_hashed(client, db):
    _register(client)
    row = db.execute('SELECT * FROM users').fetchone()
    assert 's3cret-pass' not in (row['password_hash'] or '')
    assert row['password_hash'].startswith('pbkdf2$')

    token = client.post('/api/auth/login', json={
        'email': 'leo@acme.com', 'password': 's3cret-pass'}).get_json()['token']
    t = db.execute('SELECT * FROM api_tokens').fetchone()
    assert token not in (t['token_hash'] or '')      # only the hash at rest


def test_login_and_me(client):
    _register(client)
    r = client.post('/api/auth/login', json={'email': 'leo@acme.com',
                                             'password': 's3cret-pass'})
    assert r.status_code == 200
    body = r.get_json()
    assert body['token'] and body['user']['role'] == 'analyst'

    me = client.get('/api/auth/me', headers={'Authorization': f"Bearer {body['token']}"})
    assert me.status_code == 200
    assert me.get_json()['email'] == 'leo@acme.com'

    assert client.post('/api/auth/login', json={'email': 'leo@acme.com',
                                                'password': 'wrong-pass'}).status_code == 401
    assert client.get('/api/auth/me',
                      headers={'Authorization': 'Bearer garbage'}).status_code == 401
    assert client.get('/api/auth/me').status_code == 401


def test_expired_token_rejected(client, db):
    _register(client)
    token = client.post('/api/auth/login', json={
        'email': 'leo@acme.com', 'password': 's3cret-pass'}).get_json()['token']
    db.execute("UPDATE api_tokens SET expires_at=datetime('now', '-1 hour')")
    db.commit()
    assert client.get('/api/auth/me',
                      headers={'Authorization': f'Bearer {token}'}).status_code == 401


def test_auth_events_audited(client, db):
    _register(client)
    client.post('/api/auth/login', json={'email': 'leo@acme.com', 'password': 's3cret-pass'})
    client.post('/api/auth/login', json={'email': 'leo@acme.com', 'password': 'nope-nope'})
    acts = {r['action'] for r in db.execute(
        "SELECT action FROM audit_logs WHERE resource_type='user'").fetchall()}
    assert {'auth.registered', 'auth.login', 'auth.login_failed'} <= acts


# ── US2: identity resolution ─────────────────────────────
def test_bearer_token_overrides_legacy_header(client):
    _register(client, email='v@acme.com', role='viewer')
    token = client.post('/api/auth/login', json={'email': 'v@acme.com',
                                                 'password': 's3cret-pass'}).get_json()['token']
    # viewer token beats a forged admin header
    r = client.post('/api/artifacts', json={'title': 'x'},
                    headers={'Authorization': f'Bearer {token}', 'X-User-Role': 'admin'})
    assert r.status_code == 403
    body = r.get_json()
    assert body['current_role'] == 'viewer'
    assert body['identity_source'] == 'token'

    # admin token works for admin things
    _register(client, email='a@acme.com', role='admin')
    atok = client.post('/api/auth/login', json={'email': 'a@acme.com',
                                                'password': 's3cret-pass'}).get_json()['token']
    assert client.post('/api/artifacts', json={'title': 'ok'},
                       headers={'Authorization': f'Bearer {atok}'}).status_code == 201


def test_token_identity_used_in_audit(client, db):
    _register(client, email='a2@acme.com', role='admin')
    tok = client.post('/api/auth/login', json={'email': 'a2@acme.com',
                                               'password': 's3cret-pass'}).get_json()['token']
    client.post('/api/artifacts', json={'title': 'authored'},
                headers={'Authorization': f'Bearer {tok}'})
    row = db.execute("SELECT user_email FROM audit_logs WHERE action='artifact.created'").fetchone()
    assert row['user_email'] == 'a2@acme.com'


def test_legacy_header_still_works_without_token(client):
    # absent header → dev-mode admin
    assert client.post('/api/artifacts', json={'title': 'legacy'}).status_code == 201
    # explicit viewer header still blocks
    r = client.post('/api/artifacts', json={'title': 'x'},
                    headers={'X-User-Role': 'viewer'})
    assert r.status_code == 403
    assert r.get_json()['identity_source'] == 'header'
