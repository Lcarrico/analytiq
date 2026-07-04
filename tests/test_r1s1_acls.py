"""
R1S1E2-US1 — Resource-level ACLs (restrict-only; Supabase RLS → SQLite fallback)
"""


def _user(client, email, role='analyst'):
    client.post('/api/auth/register', json={'email': email, 'password': 's3cret-pass',
                                            'role': role})
    tok = client.post('/api/auth/login', json={'email': email,
                                               'password': 's3cret-pass'}).get_json()['token']
    return {'Authorization': f'Bearer {tok}'}


def test_acl_put_get_validation_and_rbac(client, db):
    art = client.post('/api/artifacts', json={'title': 'locked'}).get_json()

    viewer = _user(client, 'v@acme.com', 'viewer')
    assert client.put(f"/api/acl/artifact/{art['id']}",
                      json={'entries': [{'principal': 'x@y.co', 'role': 'viewer'}]},
                      headers=viewer).status_code == 403

    r = client.put(f"/api/acl/artifact/{art['id']}",
                   json={'entries': [{'principal': 'ana@acme.com', 'role': 'viewer'},
                                     {'principal': 'ed@acme.com', 'role': 'editor'}]})
    assert r.status_code == 200
    entries = client.get(f"/api/acl/artifact/{art['id']}").get_json()
    assert {e['principal'] for e in entries} == {'ana@acme.com', 'ed@acme.com'}

    assert client.put(f"/api/acl/artifact/{art['id']}",
                      json={'entries': [{'principal': 'x@y.co', 'role': 'god'}]}).status_code == 400
    assert client.put('/api/acl/artifact/99999',
                      json={'entries': []}).status_code == 404
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='acl.updated'").fetchone()


def test_restricted_resource_enforces_acl(client):
    art = client.post('/api/artifacts', json={'title': 'restricted'}).get_json()
    client.put(f"/api/acl/artifact/{art['id']}",
               json={'entries': [{'principal': 'ana@acme.com', 'role': 'viewer'},
                                 {'principal': 'ed@acme.com', 'role': 'editor'}]})

    outsider = _user(client, 'out@acme.com', 'analyst')
    ana = _user(client, 'ana@acme.com', 'analyst')
    ed = _user(client, 'ed@acme.com', 'analyst')

    # not on the ACL → no read, despite analyst workspace role
    assert client.get(f"/api/artifacts/{art['id']}", headers=outsider).status_code == 403
    # ACL viewer → read yes, mutate no (restrict-only: ACL caps workspace role)
    assert client.get(f"/api/artifacts/{art['id']}", headers=ana).status_code == 200
    assert client.delete(f"/api/artifacts/{art['id']}", headers=ana).status_code == 403
    # ACL editor → read + mutate
    assert client.get(f"/api/artifacts/{art['id']}", headers=ed).status_code == 200
    # workspace admin bypasses
    admin = _user(client, 'boss@acme.com', 'admin')
    assert client.get(f"/api/artifacts/{art['id']}", headers=admin).status_code == 200
    assert client.delete(f"/api/artifacts/{art['id']}", headers=ed).status_code == 204


def test_unrestricted_resource_keeps_workspace_defaults(client):
    art = client.post('/api/artifacts', json={'title': 'open'}).get_json()
    ana = _user(client, 'free@acme.com', 'analyst')
    assert client.get(f"/api/artifacts/{art['id']}", headers=ana).status_code == 200
    assert client.delete(f"/api/artifacts/{art['id']}", headers=ana).status_code == 204
