"""R38S1E1 (deep-dive §5A) — the durable DashboardSpec.

One canonical, versioned object connecting planning, execution, canvas,
export, sharing, and presentation: a metric inventory with roles and
dependency closure, the analysis frame, dimensions/filters, components
bound to metrics with per-component query specs, per-breakpoint grid
geometry, trust evidence, and lifecycle. Validation is deterministic and
server-side; storage is immutable-append with a stable content hash.
"""
import hashlib
import json

ROLES = ('primary', 'supporting', 'derived', 'target', 'diagnostic', 'predictive')
INTENTS = ('descriptive', 'diagnostic', 'predictive', 'prescriptive')
COMPONENT_TYPES = ('kpi', 'line', 'bar', 'area', 'scatter', 'table', 'heatmap',
                   'treemap', 'narrative', 'filter', 'spacer')
GRID_COLS = 12
BREAKPOINTS = ('desktop', 'tablet', 'mobile')


def stable_hash(spec) -> str:
    raw = json.dumps(spec, sort_keys=True, separators=(',', ':'), default=str)
    return hashlib.sha256(raw.encode()).hexdigest()


def _err(code, where, msg):
    return {'code': code, 'where': where, 'message': msg}


def validate_spec(spec) -> list:
    """Structured errors; [] means valid. Deterministic — same spec, same
    verdict — so agents and the UI can rely on it identically."""
    errs = []
    if not isinstance(spec, dict):
        return [_err('not_an_object', '$', 'spec must be a JSON object')]

    metrics = spec.get('metrics') or []
    if not metrics:
        errs.append(_err('no_metrics', 'metrics', 'at least one metric is required'))
    ids = [m.get('id') for m in metrics]
    dupes = {i for i in ids if ids.count(i) > 1}
    if dupes:
        errs.append(_err('duplicate_metric_id', 'metrics', f'duplicated: {sorted(dupes)}'))
    id_set = set(ids)

    for m in metrics:
        w = f"metrics[{m.get('id')}]"
        if not m.get('id') or not m.get('label'):
            errs.append(_err('metric_incomplete', w, 'id and label are required'))
        if m.get('role') not in ROLES:
            errs.append(_err('invalid_role', w,
                             f"role must be one of {ROLES}, got {m.get('role')!r}"))
        if m.get('role') == 'derived':
            deps = m.get('dependencies') or []
            if not deps:
                errs.append(_err('derived_without_dependencies', w,
                                 'derived metrics must list their dependencies'))
            missing = [d for d in deps if d not in id_set]
            if missing:
                errs.append(_err('unresolved_dependency', w,
                                 f'dependencies not in the metric inventory: {missing}'))
            expr = m.get('expression') or ''
            if '/' in expr and not m.get('zero_denominator'):
                errs.append(_err('zero_denominator_rule_missing', w,
                                 'division present — declare zero_denominator '
                                 "behaviour ('null' | 'zero' | 'skip')"))

    analysis = spec.get('analysis') or {}
    if analysis.get('intent') not in INTENTS:
        errs.append(_err('invalid_intent', 'analysis.intent',
                         f'intent must be one of {INTENTS}'))

    comps = spec.get('components') or []
    comp_ids = [c.get('id') for c in comps]
    cdupes = {i for i in comp_ids if comp_ids.count(i) > 1}
    if cdupes:
        errs.append(_err('duplicate_component_id', 'components', f'duplicated: {sorted(cdupes)}'))
    dim_ids = {d.get('id') for d in (spec.get('dimensions') or [])}
    for c in comps:
        w = f"components[{c.get('id')}]"
        if not c.get('id') or not c.get('type') or not c.get('title'):
            errs.append(_err('component_incomplete', w, 'id, type and title are required'))
        if c.get('type') not in COMPONENT_TYPES:
            errs.append(_err('invalid_component_type', w,
                             f"type must be one of {COMPONENT_TYPES}"))
        bad = [r for r in (c.get('metric_refs') or []) if r not in id_set]
        if bad:
            errs.append(_err('unknown_metric_ref', w, f'unknown metric refs: {bad}'))
        badd = [r for r in (c.get('dimension_refs') or []) if r not in dim_ids]
        if badd:
            errs.append(_err('unknown_dimension_ref', w, f'unknown dimension refs: {badd}'))

    grid = spec.get('grid') or {}
    comp_id_set = set(comp_ids)
    for bp, cells in grid.items():
        if bp not in BREAKPOINTS:
            errs.append(_err('invalid_breakpoint', f'grid.{bp}',
                             f'breakpoints: {BREAKPOINTS}'))
            continue
        for cell in cells or []:
            w = f"grid.{bp}[{cell.get('component_id')}]"
            if cell.get('component_id') not in comp_id_set:
                errs.append(_err('grid_unknown_component', w,
                                 'grid cell references a component not in components[]'))
            x, y, wd, h = (cell.get('x'), cell.get('y'), cell.get('w'), cell.get('h'))
            if any(not isinstance(v, int) or v < 0 for v in (x, y, wd, h)) \
                    or wd < 1 or h < 1:
                errs.append(_err('grid_geometry_invalid', w,
                                 'x/y ≥ 0 and w/h ≥ 1 integers required'))
                continue
            if x + wd > GRID_COLS:
                errs.append(_err('grid_out_of_bounds', w,
                                 f'x+w must fit the {GRID_COLS}-column grid'))
    return errs


def persist(conn, session_id, spec, author='agent'):
    """Immutable-append with a deterministic bump: version = head + 1,
    parent = head. Returns the stored row (dict)."""
    errs = validate_spec(spec)
    if errs:
        raise ValueError(json.dumps(errs))
    head = conn.execute('SELECT spec_version FROM dashboard_specs WHERE session_id=? '
                        'ORDER BY spec_version DESC LIMIT 1', (session_id,)).fetchone()
    parent = head['spec_version'] if head else None
    version = (parent or 0) + 1
    cur = conn.execute(
        'INSERT INTO dashboard_specs (session_id, spec_version, parent_version, '
        "spec_json, spec_hash, author, validation_status) VALUES (?,?,?,?,?,?,'valid')",
        (session_id, version, parent, json.dumps(spec), stable_hash(spec), author))
    conn.commit()
    row = conn.execute('SELECT * FROM dashboard_specs WHERE id=?',
                       (cur.lastrowid,)).fetchone()
    return dict(row)
