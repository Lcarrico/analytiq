"""R37S1E2 — control correctness (deep-dive F-06/F-14 backend halves)."""
import json

from conftest import wait_until


def _built(client):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done',
               timeout=30)
    return sid, rid


def test_save_artifact_returns_post_layout_row(client):
    """F-06: the save response must carry the four-section layout it just
    persisted — not the stale pre-layout row."""
    sid, rid = _built(client)
    art = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'T'}).get_json()
    layout = json.loads(art.get('layout_json') or 'null')
    assert layout and len(layout['sections']) == 4
    ids = {s['id'] for s in layout['sections']}
    assert {'timeseries_ci', 'forecast', 'dimension_breakdown',
            'feature_importance'} <= ids


def _artifact(client):
    sid, rid = _built(client)
    art = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'T'}).get_json()
    return art['id']


def test_section_patch_is_role_gated(client):
    """F-14: the section PATCH gets the same ACL as other artifact mutations."""
    aid = _artifact(client)
    r = client.patch(f'/api/artifacts/{aid}/sections/forecast',
                     json={'title': 'X'},
                     headers={'X-User-Role': 'viewer'})
    assert r.status_code == 403
    r2 = client.patch(f'/api/artifacts/{aid}/sections/forecast', json={'title': 'X'})
    assert r2.status_code == 200


def test_move_normalizes_positions(client):
    """F-14: ordinal moves clamp out-of-range targets and never leave
    gapped or duplicated positions."""
    import json as _json
    aid = _artifact(client)
    r = client.patch(f'/api/artifacts/{aid}/sections/forecast',
                     json={'position': 99})
    assert r.status_code == 200
    art = client.get(f'/api/artifacts/{aid}').get_json()
    layout = _json.loads(art['layout_json'])
    positions = sorted(s['position'] for s in layout['sections'])
    assert positions == list(range(len(positions)))          # contiguous 0..n-1
    tail = max(layout['sections'], key=lambda s: s['position'])
    assert tail['id'] == 'forecast'                          # clamped to last


def test_patch_response_carries_real_layout_version(client):
    """F-14: the canvas version chip must reflect reality, not 'v1' forever."""
    aid = _artifact(client)
    r1 = client.patch(f'/api/artifacts/{aid}/sections/forecast',
                      json={'title': 'A'}).get_json()
    r2 = client.patch(f'/api/artifacts/{aid}/sections/forecast',
                      json={'title': 'B'}).get_json()
    assert r2['layout_version'] == r1['layout_version'] + 1
