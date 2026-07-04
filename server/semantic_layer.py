"""
Semantic layer builder — governance_manifest → cube_schema (Sprint 3 / F-011)
plus deterministic validation and semver rules for schema versions (F-012).

The generated schema is deterministic (stable ordering) so versions diff
cleanly. Low/medium-confidence items carry ml_allowed=False until reviewed.
"""
from __future__ import annotations

import json

VALID_AGGREGATIONS = ('sum', 'avg', 'min', 'max', 'count', 'count_distinct', 'derived')
LEFT_JOIN_NULL_PCT = 2.0
DATE_HIERARCHY = ['year', 'quarter', 'month', 'week', 'day']
# coarse → fine ladder used to order detected geographic levels
GEO_LADDER = ['country', 'territory', 'state', 'region', 'city', 'zip', 'postal_code']


def _confidence_of(col: dict) -> str:
    c = col.get('confidence') or col.get('definition_confidence')
    if isinstance(c, (int, float)):
        return 'high' if c >= 0.8 else 'medium' if c >= 0.6 else 'low'
    return c if c in ('high', 'medium', 'low') else 'medium'


def build_cube_schema(manifest: dict) -> dict:
    """Convert a governance manifest into a Cube-style schema JSON."""
    # metric ownership priority: fact tables first, then alphabetical
    tables = sorted(manifest.get('tables', []),
                    key=lambda t: (0 if t['name'].startswith('fact') else 1, t['name']))
    table_names = [t['name'] for t in tables]

    # id-column ownership map for join inference: column name → owning dim table
    id_owner = {}
    for t in tables:
        for col in t.get('columns') or []:
            if col.get('semantic_type') == 'id' and t['name'].startswith('dim'):
                id_owner.setdefault(col['name'], t['name'])

    seen_measures: dict[str, str] = {}   # metric name → owning cube (dedup)
    notes: list[str] = []
    cubes = []
    for t in tables:
        measures, dimensions, joins = [], [], []
        primary_date_set = False
        for col in sorted(t.get('columns') or [], key=lambda c: c['name']):
            st = col.get('semantic_type', 'unknown')
            conf = _confidence_of(col)
            if st == 'measure':
                if col['name'] in seen_measures:
                    notes.append(
                        f"Deduplicated metric '{col['name']}': kept source "
                        f"{seen_measures[col['name']]}, dropped duplicate in {t['name']}.")
                    continue
                seen_measures[col['name']] = t['name']
                measures.append({
                    'name': col['name'],
                    'sql': col['name'],
                    'aggregation': 'sum',
                    'description': col.get('description'),
                    'format': col.get('format'),
                    'allowed_filter_dimensions': None,
                    'confidence': conf,
                    'ml_allowed': conf == 'high',
                })
            elif st in ('dimension', 'flag', 'geo', 'text'):
                dimensions.append({
                    'name': col['name'], 'sql': col['name'],
                    'type': 'boolean' if st == 'flag' else 'geo' if st == 'geo' else 'string',
                    'confidence': conf,
                })
            elif st == 'date':
                dimensions.append({
                    'name': col['name'], 'sql': col['name'], 'type': 'time',
                    'is_primary_date': not primary_date_set,
                    'hierarchy': list(DATE_HIERARCHY),
                    'confidence': conf,
                })
                primary_date_set = True
            elif st == 'id':
                # join inference by column-name convention
                owner = id_owner.get(col['name'])
                if owner and owner != t['name']:
                    null_pct = col.get('null_pct') or 0
                    jt = 'left' if null_pct > LEFT_JOIN_NULL_PCT else 'inner'
                    joins.append({
                        'to': owner, 'on': col['name'], 'join_type': jt,
                        'note': (f'left join due to null_pct {null_pct}% > '
                                 f'{LEFT_JOIN_NULL_PCT}%') if jt == 'left' else None,
                    })
                dimensions.append({
                    'name': col['name'], 'sql': col['name'], 'type': 'number',
                    'confidence': conf,
                })
        # R3S2E2: hierarchies — date (always, when a time dim exists) + geo ladder
        hierarchies = []
        if any(d.get('type') == 'time' for d in dimensions):
            hierarchies.append({'name': 'date', 'levels': list(DATE_HIERARCHY)})
        dim_names = {d['name'].lower() for d in dimensions}
        geo_levels = [lvl for lvl in GEO_LADDER if lvl in dim_names]
        if len(geo_levels) >= 2:
            hierarchies.append({'name': 'geo', 'levels': geo_levels})

        cubes.append({
            'name': t['name'],
            'hierarchies': hierarchies,
            'sql_table': f"{t.get('schema') or 'public'}.{t['name']}",
            'description': t.get('description'),
            'dq_gate_status': t.get('dq_gate_status', 'PASS'),
            'measures': measures,
            'dimensions': dimensions,
            'joins': sorted(joins, key=lambda j: j['to']),
        })

    return {
        'schema_type': 'cube',
        'generator': 'analytiq-semantic-builder',
        'source_manifest_version': manifest.get('manifest_version'),
        'workspace_id': manifest.get('workspace_id', 'default'),
        'cubes': sorted(cubes, key=lambda c: c['name']),
        'notes': sorted(notes),
    }


def validate_cube_schema(schema: dict) -> list[dict]:
    """Deterministic validator; returns [] when valid, else structured errors."""
    errors = []

    def err(code, message, where=None):
        errors.append({'code': code, 'error': message, 'where': where})

    if not isinstance(schema, dict) or not isinstance(schema.get('cubes'), list):
        err('invalid_schema', 'schema must contain a list of cubes')
        return errors

    names = [c.get('name') for c in schema['cubes']]
    for n in {n for n in names if names.count(n) > 1}:
        err('duplicate_cube', f'cube name {n!r} appears more than once', n)

    known = set(names)
    for cube in schema['cubes']:
        cname = cube.get('name')
        if not cname:
            err('missing_name', 'cube requires a name')
            continue
        for m in cube.get('measures') or []:
            if not m.get('name'):
                err('missing_name', 'measure requires a name', cname)
            if not m.get('sql'):
                err('missing_sql', f"measure {m.get('name')!r} requires sql", cname)
            if m.get('aggregation') not in VALID_AGGREGATIONS:
                err('invalid_aggregation',
                    f"measure {m.get('name')!r} aggregation must be one of {VALID_AGGREGATIONS}",
                    cname)
        for d in cube.get('dimensions') or []:
            if not d.get('name'):
                err('missing_name', 'dimension requires a name', cname)
            if not d.get('sql'):
                err('missing_sql', f"dimension {d.get('name')!r} requires sql", cname)
        for j in cube.get('joins') or []:
            if j.get('to') not in known:
                err('unknown_join_target', f"join target {j.get('to')!r} is not a cube", cname)
            if j.get('join_type') not in ('inner', 'left'):
                err('invalid_join_type', f"join_type {j.get('join_type')!r} invalid", cname)
            if not j.get('on'):
                err('missing_join_key', 'join requires "on"', cname)

    return errors


# ── semver rules for schema versions ─────────────────────
def _structure_fp(schema: dict):
    fp = []
    for c in sorted(schema.get('cubes', []), key=lambda c: c.get('name') or ''):
        fp.append((c.get('name'),
                   tuple(sorted(m.get('name') or '' for m in c.get('measures') or [])),
                   tuple(sorted(d.get('name') or '' for d in c.get('dimensions') or []))))
    return fp


def next_schema_version(prev_schema: dict | None, prev_version: str | None,
                        new_schema: dict) -> str:
    """major on structural change, minor on definition change, patch otherwise."""
    if not prev_schema or not prev_version:
        return '1.0.0'
    major, minor, patch = (int(x) for x in prev_version.split('.'))
    if _structure_fp(prev_schema) != _structure_fp(new_schema):
        return f'{major + 1}.0.0'
    if json.dumps(prev_schema, sort_keys=True) != json.dumps(new_schema, sort_keys=True):
        return f'{major}.{minor + 1}.0'
    return f'{major}.{minor}.{patch + 1}'


def diff_schemas(old: dict, new: dict) -> dict:
    """Cube-level diff for audit / review UIs."""
    old_cubes = {c['name']: c for c in old.get('cubes', [])}
    new_cubes = {c['name']: c for c in new.get('cubes', [])}
    added = sorted(set(new_cubes) - set(old_cubes))
    removed = sorted(set(old_cubes) - set(new_cubes))
    changed = sorted(
        n for n in set(old_cubes) & set(new_cubes)
        if json.dumps(old_cubes[n], sort_keys=True) != json.dumps(new_cubes[n], sort_keys=True))
    return {'added_cubes': added, 'removed_cubes': removed, 'changed_cubes': changed}
