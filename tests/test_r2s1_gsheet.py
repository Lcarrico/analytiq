"""
R2S1E2-US1 — Google Sheets connector (low-trust source, auto null warnings)
"""

SHEET_URL = 'https://docs.google.com/spreadsheets/d/1AbC123xyz/edit#gid=0'


def test_gsheet_connection_validates_url(client):
    r = client.post('/api/connections', json={'type': 'gsheet', 'name': 'Ops sheet',
                                              'sheet_url': SHEET_URL})
    assert r.status_code == 201
    assert r.get_json()['type'] == 'gsheet'

    r = client.post('/api/connections', json={'type': 'gsheet', 'name': 'bad'})
    assert r.status_code == 400 and 'sheet_url' in r.get_json()['fields']

    r = client.post('/api/connections', json={'type': 'gsheet', 'name': 'bad',
                                              'sheet_url': 'https://evil.com/x'})
    assert r.status_code == 400 and 'sheet_url' in r.get_json()['fields']


def test_gsheet_profile_is_low_trust_with_null_warnings(client):
    cid = client.post('/api/connections', json={
        'type': 'gsheet', 'name': 'Ops sheet', 'sheet_url': SHEET_URL}).get_json()['id']
    out = client.post(f'/api/connections/{cid}/profile').get_json()
    assert out['trust'] == 'low'
    assert out['warnings']                       # note column has >5% nulls in demo rows
    assert any('null' in w.lower() for w in out['warnings'])
