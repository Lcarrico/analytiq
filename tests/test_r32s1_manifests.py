"""
R32S1E6-US1 (backend) — manifest versions with statuses + structural diffs:
?diffs=1 annotates each version with ACTIVE / SUPERSEDED / REVIEW REQUIRED
and added/modified/removed table changes vs the previous version.
"""
from conftest import wait_until


def _governed(client):
    conn = client.post('/api/connections', json={'type': 'snowflake', 'account': 'd',
                                                 'username': 'd', 'password': 'd'}).get_json()
    rid = client.post('/api/governance/run', json={'connectionId': conn['id']}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/governance/{rid}').get_json().get('status')
               in ('done', 'complete'), timeout=30)
    return conn['id'], rid


def test_versions_diffs_statuses(client):
    cid, rid = _governed(client)
    # the manifest is saved by the run thread shortly after status flips
    wait_until(lambda: len(client.get(
        f'/api/integrations/{cid}/manifest/versions').get_json()) >= 1, timeout=10)
    vs = client.get(f'/api/integrations/{cid}/manifest/versions?diffs=1').get_json()
    assert len(vs) == 1
    latest = vs[0]
    # pending low-confidence reviews exist right after a run
    assert latest['status'] == 'REVIEW REQUIRED'
    assert {'added', 'modified', 'removed'} <= set(latest['changes'])

    # roll back -> a new immutable version; old one superseded
    client.post(f'/api/integrations/{cid}/manifest/rollback',
                json={'version': latest['version']})
    vs = client.get(f'/api/integrations/{cid}/manifest/versions?diffs=1').get_json()
    assert len(vs) == 2
    assert vs[0]['status'] == 'REVIEW REQUIRED'      # same run, still pending
    assert vs[1]['status'] == 'SUPERSEDED'
    assert vs[0]['changes']['added'] == []           # identical content

    # decide every pending item -> latest becomes ACTIVE
    for it in client.get(f'/api/reviews/{rid}').get_json():
        client.post(f"/api/reviews/items/{it['id']}", json={'action': 'accept'})
    vs = client.get(f'/api/integrations/{cid}/manifest/versions?diffs=1').get_json()
    assert vs[0]['status'] == 'ACTIVE'

    # plain call keeps the legacy shape
    plain = client.get(f'/api/integrations/{cid}/manifest/versions').get_json()
    assert 'status' not in plain[0]
