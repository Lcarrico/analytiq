"""
R3S2E2-US1 — Date + geographic hierarchy auto-detection in the cube builder
"""

MANIFEST = {
    'manifest_version': '1.0.0', 'workspace_id': 'default', 'integration_id': 1,
    'tables': [
        {'name': 'fact_sales', 'schema': 'CORE',
         'columns': [
             {'name': 'sale_id', 'semantic_type': 'id'},
             {'name': 'day', 'semantic_type': 'date'},
             {'name': 'amount', 'semantic_type': 'measure'},
             {'name': 'country', 'semantic_type': 'dimension'},
             {'name': 'region', 'semantic_type': 'dimension'},
             {'name': 'city', 'semantic_type': 'dimension'},
             {'name': 'channel', 'semantic_type': 'dimension'},
         ]},
    ],
    'definitions': [], 'lineage_edges': [],
}


def test_time_dimension_gets_date_hierarchy():
    import semantic_layer as sl
    schema = sl.build_cube_schema(MANIFEST)
    cube = schema['cubes'][0]
    day = next(d for d in cube['dimensions'] if d['name'] == 'day')
    assert day['hierarchy'] == ['year', 'quarter', 'month', 'week', 'day']


def test_geo_hierarchy_detected_and_ordered():
    import semantic_layer as sl
    schema = sl.build_cube_schema(MANIFEST)
    cube = schema['cubes'][0]
    geo = next(h for h in cube['hierarchies'] if h['name'] == 'geo')
    assert geo['levels'] == ['country', 'region', 'city']   # coarse → fine
    # non-geo dims don't join the hierarchy
    assert 'channel' not in geo['levels']

    date_h = next(h for h in cube['hierarchies'] if h['name'] == 'date')
    assert date_h['levels'] == ['year', 'quarter', 'month', 'week', 'day']


def test_no_geo_hierarchy_with_single_level():
    import semantic_layer as sl
    m = {**MANIFEST, 'tables': [{
        'name': 'fact_x', 'schema': 'CORE',
        'columns': [{'name': 'city', 'semantic_type': 'dimension'},
                    {'name': 'amount', 'semantic_type': 'measure'}]}]}
    schema = sl.build_cube_schema(m)
    cube = schema['cubes'][0]
    assert not any(h['name'] == 'geo' for h in cube.get('hierarchies', []))
