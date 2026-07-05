"""
R30S1E4-US1 (backend) — PATCH /api/artifacts/<id> {title}: the detail page's
editable h1 needs rename persistence (deviation from the story's "Backend N/A"
line, recorded in Agent Notes: affordance without persistence would lie).
Renames are audited and re-indexed for search.
"""


def _seed(client, title='Detail Rename Art'):
    r = client.post('/api/artifacts', json={'title': title, 'type': 'Predictive'})
    assert r.status_code == 201
    return r.get_json()


def test_rename_persists_and_audits(client):
    art = _seed(client)
    r = client.patch(f"/api/artifacts/{art['id']}", json={'title': 'Renamed Q3 Risk'})
    assert r.status_code == 200
    assert r.get_json()['title'] == 'Renamed Q3 Risk'
    assert client.get(f"/api/artifacts/{art['id']}").get_json()['title'] == 'Renamed Q3 Risk'
    audits = client.get('/api/audit-logs?action=artifact.renamed&limit=10').get_json()
    entries = audits if isinstance(audits, list) else audits.get('entries', audits.get('items', []))
    assert any(e.get('action') == 'artifact.renamed' for e in entries)


def test_rename_rejects_blank_and_unknown(client):
    art = _seed(client)
    assert client.patch(f"/api/artifacts/{art['id']}", json={'title': '  '}).status_code == 400
    assert client.patch(f"/api/artifacts/{art['id']}", json={}).status_code == 400
    assert client.patch('/api/artifacts/999999', json={'title': 'x'}).status_code == 404


def test_rename_reindexes_search(client):
    art = _seed(client, title='Before Rename Unique77')
    client.patch(f"/api/artifacts/{art['id']}", json={'title': 'After Rename Unique88'})
    hits = client.get('/api/search?q=Unique88').get_json()
    items = hits if isinstance(hits, list) else hits.get('results', hits.get('items', []))
    assert any('Unique88' in (h.get('title') or '') for h in items)
