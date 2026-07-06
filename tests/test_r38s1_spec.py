"""R38S1E1-US1 — DashboardSpec model + validator (deep-dive §5A).
One canonical, versioned, immutable-append object: metrics with roles and
dependency closure, analysis, dimensions/filters, components bound to
metrics, per-breakpoint grid, trust, lifecycle."""
import json

import pytest


def _valid_spec():
    return {
        'metrics': [
            {'id': 'net_revenue', 'label': 'Net Revenue', 'role': 'primary',
             'format': 'currency', 'aggregation': 'sum'},
            {'id': 'revenue_target', 'label': 'Revenue Target', 'role': 'target',
             'format': 'currency', 'aggregation': 'sum'},
            {'id': 'target_gap_pct', 'label': 'Target Gap %', 'role': 'derived',
             'format': 'percent', 'aggregation': 'ratio',
             'expression': '(net_revenue - revenue_target) / revenue_target',
             'dependencies': ['net_revenue', 'revenue_target'],
             'zero_denominator': 'null'},
        ],
        'analysis': {'intent': 'descriptive', 'questions': ['How is revenue pacing?'],
                     'time_range': {'days': 90}, 'grain': 'daily', 'comparisons': []},
        'dimensions': [{'id': 'region', 'label': 'Region'}],
        'global_filters': [], 'component_filters': [],
        'components': [
            {'id': 'kpi_net_revenue', 'type': 'kpi', 'title': 'Net Revenue',
             'metric_refs': ['net_revenue'], 'dimension_refs': [],
             'query_spec': {'grain': 'daily'}, 'encoding': {}, 'interaction': {},
             'empty_state': 'No data in range', 'error_state': 'Query failed'},
            {'id': 'trend', 'type': 'line', 'title': 'Revenue trend',
             'metric_refs': ['net_revenue', 'revenue_target'], 'dimension_refs': [],
             'query_spec': {'grain': 'daily'}, 'encoding': {'x': 'day', 'y': 'value'},
             'interaction': {}, 'empty_state': 'No data', 'error_state': 'Failed'},
        ],
        'grid': {'desktop': [
            {'component_id': 'kpi_net_revenue', 'x': 0, 'y': 0, 'w': 3, 'h': 2},
            {'component_id': 'trend', 'x': 0, 'y': 2, 'w': 12, 'h': 6},
        ]},
        'trust': {}, 'lifecycle': {'author': 'agent'},
    }


def test_validator_truth_table():
    import sys
    sys.path.insert(0, 'server')
    import dashboard_spec as ds

    assert ds.validate_spec(_valid_spec()) == []

    bad = _valid_spec()
    bad['metrics'][2]['dependencies'] = ['net_revenue', 'ghost_metric']
    errs = ds.validate_spec(bad)
    assert any(e['code'] == 'unresolved_dependency' for e in errs)

    bad = _valid_spec()
    bad['components'][0]['metric_refs'] = ['ghost']
    assert any(e['code'] == 'unknown_metric_ref' for e in ds.validate_spec(bad))

    bad = _valid_spec()
    bad['grid']['desktop'][1]['w'] = 14
    assert any(e['code'] == 'grid_out_of_bounds' for e in ds.validate_spec(bad))

    bad = _valid_spec()
    del bad['metrics'][2]['zero_denominator']
    assert any(e['code'] == 'zero_denominator_rule_missing' for e in ds.validate_spec(bad))

    bad = _valid_spec()
    bad['metrics'][0]['role'] = 'headline'
    assert any(e['code'] == 'invalid_role' for e in ds.validate_spec(bad))

    # stable hash: key order must not matter
    a = ds.stable_hash(_valid_spec())
    flipped = json.loads(json.dumps(_valid_spec()))
    flipped['metrics'][0] = dict(reversed(list(flipped['metrics'][0].items())))
    assert ds.stable_hash(flipped) == a


def test_specs_are_immutable_append_with_version_bump(client, db):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    r1 = client.post(f'/api/sessions/{sid}/dashboard-spec', json=_valid_spec())
    assert r1.status_code == 201
    v1 = r1.get_json()
    assert v1['spec_version'] == 1 and v1['parent_version'] is None

    changed = _valid_spec()
    changed['components'][1]['title'] = 'Revenue trend v2'
    v2 = client.post(f'/api/sessions/{sid}/dashboard-spec', json=changed).get_json()
    assert v2['spec_version'] == 2 and v2['parent_version'] == 1
    assert v2['spec_hash'] != v1['spec_hash']

    head = client.get(f'/api/sessions/{sid}/dashboard-spec').get_json()
    assert head['spec_version'] == 2
    assert head['spec']['components'][1]['title'] == 'Revenue trend v2'

    with pytest.raises(Exception):
        db.execute('UPDATE dashboard_specs SET spec_version=99 WHERE id=?', (v1['id'],))
        db.commit()


def test_invalid_spec_is_rejected_not_stored(client, db):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    bad = _valid_spec()
    bad['components'][0]['metric_refs'] = ['ghost']
    r = client.post(f'/api/sessions/{sid}/dashboard-spec', json=bad)
    assert r.status_code == 422
    assert any(e['code'] == 'unknown_metric_ref' for e in r.get_json()['errors'])
    n = db.execute('SELECT COUNT(*) c FROM dashboard_specs').fetchone()['c']
    assert n == 0


def test_plan_approval_emits_dashboard_spec_v1(client):
    """R38S1E1-US2 — confirming a plan derives and persists DashboardSpec v1
    (the bridge: today's composition, encoded in the durable object; the
    multi-metric derivation replaces it in R38S1E2/R38S2)."""
    p = client.post('/api/sessions/plan',
                    json={'message': 'Forecast net revenue for the next 14 days'}).get_json()
    assert not p.get('needs_clarification')
    sid = client.post('/api/sessions',
                      json={'metric': p['target_metric'],
                            'horizon': p.get('prediction_horizon') or 14}).get_json()['id']
    r = client.post(f'/api/sessions/{sid}/spec', json=p)
    assert r.status_code in (200, 201)

    head = client.get(f'/api/sessions/{sid}/dashboard-spec')
    assert head.status_code == 200
    d = head.get_json()
    assert d['spec_version'] == 1
    spec = d['spec']
    assert spec['metrics'][0]['role'] == 'primary'
    assert spec['analysis']['intent'] in ('descriptive', 'diagnostic',
                                          'predictive', 'prescriptive')
    comp_ids = {c['id'] for c in spec['components']}
    assert len(comp_ids) >= 4
    placed = {c['component_id'] for c in spec['grid']['desktop']}
    assert placed == comp_ids                       # every component is placed
