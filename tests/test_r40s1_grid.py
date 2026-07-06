"""R40S1E1-US1 — grid model + layout-patch semantics (deep-dive F-04 server
half / §6 grid behavior): per-breakpoint geometry, normalization after every
mutation, collision resolution, optimistic concurrency, layout-never-reruns."""
import json

from conftest import wait_until


def _built(client):
    conn = client.post('/api/connections', json={'type': 'snowflake', 'account': 'grid',
                                                 'username': 'u', 'password': 'p'}).get_json()
    p = client.post('/api/sessions/plan',
                    json={'message': 'Forecast net revenue for the next 14 days'}).get_json()
    sid = client.post('/api/sessions', json={'metric': p['target_metric'],
                                             'connectionId': conn['id']}).get_json()['id']
    client.post(f'/api/sessions/{sid}/spec', json=p)
    return sid


def _no_overlaps(cells):
    for i, a in enumerate(cells):
        for b in cells[i + 1:]:
            if (a['x'] < b['x'] + b['w'] and b['x'] < a['x'] + a['w']
                    and a['y'] < b['y'] + b['h'] and b['y'] < a['y'] + a['h']):
                return False
    return True


def test_layout_patch_moves_resizes_and_normalizes(client, db):
    sid = _built(client)
    head = client.get(f'/api/sessions/{sid}/dashboard-spec').get_json()
    v = head['spec_version']
    cells = head['spec']['grid']['desktop']
    target = cells[1]['component_id']

    moved = [dict(c) for c in cells]
    moved[1] = {**moved[1], 'x': 6, 'y': 0, 'w': 6, 'h': 4}
    r = client.patch(f'/api/sessions/{sid}/dashboard-spec/grid',
                     json={'base_version': v, 'breakpoint': 'desktop',
                           'cells': moved})
    assert r.status_code == 200
    d = r.get_json()
    assert d['spec_version'] == v + 1
    out = d['grid']['desktop']
    got = next(c for c in out if c['component_id'] == target)
    assert (got['x'], got['w'], got['h']) == (6, 6, 4)
    assert _no_overlaps(out)
    # a layout patch NEVER reruns queries — run count untouched
    n = db.execute('SELECT COUNT(*) c FROM pipeline_runs').fetchone()['c']
    assert n == 0


def test_collisions_resolve_and_bounds_clamp(client):
    sid = _built(client)
    head = client.get(f'/api/sessions/{sid}/dashboard-spec').get_json()
    cells = [dict(c) for c in head['spec']['grid']['desktop']]
    # slam everything onto the same spot, one of them out of bounds
    for c in cells:
        c.update({'x': 8, 'y': 0, 'w': 8, 'h': 4})
    r = client.patch(f'/api/sessions/{sid}/dashboard-spec/grid',
                     json={'base_version': head['spec_version'],
                           'breakpoint': 'desktop', 'cells': cells})
    assert r.status_code == 200
    out = r.get_json()['grid']['desktop']
    assert _no_overlaps(out)
    assert all(c['x'] + c['w'] <= 12 and c['x'] >= 0 and c['y'] >= 0 for c in out)
    assert len(out) == len(cells)                      # nobody dropped


def test_optimistic_concurrency_409(client):
    sid = _built(client)
    head = client.get(f'/api/sessions/{sid}/dashboard-spec').get_json()
    v, cells = head['spec_version'], head['spec']['grid']['desktop']
    ok = client.patch(f'/api/sessions/{sid}/dashboard-spec/grid',
                      json={'base_version': v, 'breakpoint': 'desktop', 'cells': cells})
    assert ok.status_code == 200
    stale = client.patch(f'/api/sessions/{sid}/dashboard-spec/grid',
                         json={'base_version': v, 'breakpoint': 'desktop', 'cells': cells})
    assert stale.status_code == 409
    body = stale.get_json()
    assert body['head_version'] == v + 1               # tells the client where head is
    # no extra version appended by the losing writer
    assert client.get(f'/api/sessions/{sid}/dashboard-spec').get_json()['spec_version'] == v + 1


def test_locked_cells_hold_position_through_normalize(client):
    """R40S1E3 — locked cells keep their geometry; movers resolve around
    them instead of displacing them."""
    sid = _built(client)
    head = client.get(f'/api/sessions/{sid}/dashboard-spec').get_json()
    cells = [dict(c) for c in head['spec']['grid']['desktop']]
    # lock the second cell where it is, then slam another into its spot
    locked = cells[1]
    locked['locked'] = True
    mover = cells[2]
    mover.update({'x': locked['x'], 'y': locked['y']})
    r = client.patch(f'/api/sessions/{sid}/dashboard-spec/grid',
                     json={'base_version': head['spec_version'],
                           'breakpoint': 'desktop', 'cells': cells})
    assert r.status_code == 200
    out = {c['component_id']: c for c in r.get_json()['grid']['desktop']}
    li = out[locked['component_id']]
    assert (li['x'], li['y']) == (locked['x'], locked['y'])   # unmoved
    assert li.get('locked') is True
    m = out[mover['component_id']]
    assert (m['x'], m['y']) != (locked['x'], locked['y'])     # pushed around it
    assert _no_overlaps(list(out.values()))


def test_exported_html_carries_grid_geometry(client):
    """R40S1E4 — the stored/exported render places panels with the SAME
    grid geometry the canvas edits (parity by construction)."""
    conn = client.post('/api/connections', json={'type': 'snowflake', 'account': 'par',
                                                 'username': 'u', 'password': 'p'}).get_json()
    p = client.post('/api/sessions/plan',
                    json={'message': 'Forecast net revenue for the next 14 days'}).get_json()
    sid = client.post('/api/sessions', json={'metric': p['target_metric'],
                                             'connectionId': conn['id']}).get_json()['id']
    client.post(f'/api/sessions/{sid}/spec', json=p)
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done',
               timeout=30)
    art = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'G'}).get_json()

    head = client.get(f'/api/sessions/{sid}/dashboard-spec').get_json()
    cells = [dict(c) for c in head['spec']['grid']['desktop']]
    for c in cells:
        if c['component_id'] == 'timeseries_ci':
            c.update({'x': 0, 'y': 2, 'w': 6, 'h': 6})
        if c['component_id'] == 'forecast':
            c.update({'x': 6, 'y': 2, 'w': 6, 'h': 6})
    r = client.patch(f'/api/sessions/{sid}/dashboard-spec/grid',
                     json={'base_version': head['spec_version'],
                           'breakpoint': 'desktop', 'cells': cells})
    assert r.status_code == 200

    # a layout edit re-renders (R39S1E3); trigger one so the html reflects grid
    client.patch(f"/api/artifacts/{art['id']}/sections/timeseries_ci",
                 json={'title': 'Trend side-by-side'})
    html = client.get(f"/api/artifacts/{art['id']}/export?format=html").get_data(as_text=True)
    assert 'class="grid-wrap"' in html
    assert 'grid-column:1 / span 6' in html.replace(' /', ' /')
    assert 'grid-column:7 / span 6' in html
