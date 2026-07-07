"""R41S1E1 (deep-dive §6 chat authoring) — the dashboard patch engine.

Chat and the workbench express changes as the SAME validated patch ops:
  add_component · remove_component · modify_component · layout · semantic
Layout ops are instant (no data work). Semantic ops (grain/metric/filter
changes) mark dependent components stale for selective recompute (E3).
Every applied patch appends one immutable spec version with per-op
explanations for the preview card.
"""
import json

import component_registry as cr
import dashboard_spec as ds
import grid_layout as gl

LAYOUT_OPS = ('layout',)
SEMANTIC_FIELDS = ('grain', 'time_range', 'comparisons')


class PatchError(Exception):
    def __init__(self, errors, status=422):
        super().__init__(json.dumps(errors))
        self.errors = errors if isinstance(errors, list) else [errors]
        self.status = status


def _head(conn, session_id):
    row = conn.execute('SELECT * FROM dashboard_specs WHERE session_id=? '
                       'ORDER BY spec_version DESC LIMIT 1', (session_id,)).fetchone()
    if not row:
        raise PatchError({'code': 'no_spec',
                          'message': 'No dashboard spec for this session yet'}, 409)
    return json.loads(row['spec_json'])


def _metric_components(spec):
    return [c['id'] for c in spec.get('components', [])
            if c.get('metric_refs') and c.get('type') not in ('narrative', 'filter',
                                                              'spacer')]


def apply_patch(conn, session_id, ops, author='agent'):
    """Validate + apply every op against a working copy, then append ONE
    version. Any invalid op rejects the whole patch (nothing stored)."""
    spec = _head(conn, session_id)
    explained = []
    stale = set()
    classification = 'layout'

    for op in ops or []:
        kind = op.get('op')
        if kind == 'add_component':
            comp = cr.build_component(spec, op.get('component') or {})
            spec['components'].append(comp)
            cr._place(spec, comp['id'], comp['type'])
            explained.append({'op': kind, 'component_id': comp['id'],
                              'summary': f"add {comp['type']} '{comp['title']}' "
                                         f"bound to {', '.join(comp['metric_refs']) or 'no metrics'}",
                              'affected': {'components': [comp['id']],
                                           'metrics': comp['metric_refs'],
                                           'layout': True}})
            classification = 'semantic' if classification != 'semantic' else classification
            stale.add(comp['id'])
        elif kind == 'remove_component':
            cid = op.get('component_id')
            if cid not in {c['id'] for c in spec['components']}:
                raise PatchError({'code': 'unknown_component',
                                  'message': f'{cid!r} is not in the spec'}, 404)
            spec['components'] = [c for c in spec['components'] if c['id'] != cid]
            for bp in spec.get('grid', {}):
                spec['grid'][bp] = [c for c in spec['grid'][bp]
                                    if c['component_id'] != cid]
            explained.append({'op': kind, 'component_id': cid,
                              'summary': f'remove {cid} (reversible via version history)',
                              'affected': {'components': [cid], 'metrics': [],
                                           'layout': True}})
        elif kind == 'modify_component':
            cid = op.get('component_id')
            comp = next((c for c in spec['components'] if c['id'] == cid), None)
            if not comp:
                raise PatchError({'code': 'unknown_component',
                                  'message': f'{cid!r} is not in the spec'}, 404)
            changes = op.get('changes') or {}
            semantic_change = any(k in ('metric_refs', 'dimension_refs', 'query_spec')
                                  for k in changes)
            for k in ('title', 'type', 'encoding', 'metric_refs', 'dimension_refs',
                      'query_spec'):
                if k in changes:
                    comp[k] = changes[k]
            if semantic_change:
                classification = 'semantic'
                stale.add(cid)
                comp['stale'] = True
            explained.append({'op': kind, 'component_id': cid,
                              'summary': f"modify {cid}: {', '.join(sorted(changes))}",
                              'affected': {'components': [cid],
                                           'metrics': changes.get('metric_refs', []),
                                           'layout': 'type' in changes}})
        elif kind == 'layout':
            cid = op.get('component_id')
            cells = {c['component_id']: c for c in spec.get('grid', {}).get('desktop', [])}
            if cid not in cells:
                raise PatchError({'code': 'unknown_component',
                                  'message': f'{cid!r} has no grid cell'}, 404)
            cells[cid] = {**cells[cid], **(op.get('cell') or {}), 'component_id': cid}
            spec['grid']['desktop'] = gl.normalize(list(cells.values()))
            explained.append({'op': kind, 'component_id': cid,
                              'summary': f'move/resize {cid} — layout only, '
                                         'applies instantly, no data rerun',
                              'affected': {'components': [cid], 'metrics': [],
                                           'layout': True}})
        elif kind == 'semantic':
            field, value = op.get('field'), op.get('value')
            if field not in SEMANTIC_FIELDS:
                raise PatchError({'code': 'invalid_semantic_field',
                                  'message': f'field must be one of {SEMANTIC_FIELDS}'})
            spec.setdefault('analysis', {})[field] = value
            affected = _metric_components(spec)
            for c in spec['components']:
                if c['id'] in affected:
                    c['stale'] = True
            stale.update(affected)
            classification = 'semantic'
            explained.append({'op': kind, 'field': field,
                              'summary': f'{field} → {value!r} — reruns '
                                         f'{len(affected)} dependent component(s)',
                              'affected': {'components': affected, 'metrics': [],
                                           'layout': False}})
        else:
            raise PatchError({'code': 'unknown_op', 'message': f'unknown op {kind!r}'})

    errs = ds.validate_spec(spec)
    if errs:
        raise PatchError(errs)
    row = ds.persist(conn, session_id, spec, author=author)
    return {'spec_version': row['spec_version'], 'spec_hash': row['spec_hash'],
            'classification': classification,
            'stale_components': sorted(stale), 'ops': explained}


# ── R41S1E2: deterministic chat → patch planning (doc §6 table) ───────────
import re as _re

_TYPE_WORDS = {'kpi': 'kpi', 'kpis': 'kpi', 'line': 'line', 'lines': 'line',
               'bar': 'bar', 'bars': 'bar', 'bar chart': 'bar', 'area': 'area',
               'table': 'table', 'scatter': 'scatter', 'heatmap': 'heatmap',
               'treemap': 'treemap'}
_GRAINS = ('daily', 'weekly', 'monthly')
_WIDER = ('wider', 'bigger', 'larger')
_NARROWER = ('narrower', 'smaller')
_TALLER = ('taller',)
_SHORTER = ('shorter',)


def _find_component(spec, text):
    """Match a component by id or title fragment."""
    t = text.lower()
    for c in spec.get('components', []):
        tokens = set(_re.split(r'[^a-z0-9]+', c['id'].lower())) \
            | set(_re.split(r'[^a-z0-9]+', c['title'].lower()))
        tokens.discard('')
        if tokens and any(tok in t for tok in tokens if len(tok) > 3):
            return c
    return None


def plan_from_message(spec, message):
    """Message → proposed ops + explanation. Deterministic: catalog/spec
    matching only — canonical decisions stay server-side (doc sequencing)."""
    t = ' ' + _re.sub(r'[^a-z0-9% ]', ' ', (message or '').lower()) + ' '
    t = _re.sub(r'\s+', ' ', t)
    ops, unresolved = [], []

    # grain switch: 'weekly instead of daily' / 'use weekly' — the TARGET
    # grain is the one named first ('X instead of Y' switches to X)
    if 'instead' in t or t.strip().startswith(('use', 'switch')):
        found = sorted((t.index(f' {g} '), g) for g in _GRAINS if f' {g} ' in t)
        if found:
            g = found[0][1]
            return {'ops': [{'op': 'semantic', 'field': 'grain', 'value': g}],
                    'material': True, 'unresolved': [],
                    'explanation': f'Semantic change: grain → {g}. Dependent '
                                   'components rerun and revalidate.'}

    # remove
    m = _re.search(r'\b(remove|delete)\b (.+)', t)
    if m:
        comp = _find_component(spec, m.group(2))
        if comp:
            return {'ops': [{'op': 'remove_component', 'component_id': comp['id']}],
                    'material': True, 'unresolved': [],
                    'explanation': f"Removes '{comp['title']}' — reversible from "
                                   'version history.'}

    # type change: 'turn X into a table'
    m = _re.search(r'\b(turn|make|change)\b (.+?) (into|to) an? (\w+)', t)
    if m and _TYPE_WORDS.get(m.group(4)):
        comp = _find_component(spec, m.group(2))
        if comp:
            new_type = _TYPE_WORDS[m.group(4)]
            return {'ops': [{'op': 'modify_component', 'component_id': comp['id'],
                             'changes': {'type': new_type}}],
                    'material': True, 'unresolved': [],
                    'explanation': f"'{comp['title']}' becomes a {new_type} — "
                                   'metric and query semantics are preserved.'}

    # layout: wider/narrower/taller/shorter
    for words, delta in ((_WIDER, ('w', 3)), (_NARROWER, ('w', -3)),
                         (_TALLER, ('h', 2)), (_SHORTER, ('h', -2))):
        if any(f' {w} ' in t for w in words):
            comp = _find_component(spec, t)
            if comp:
                cell = next((c for c in spec.get('grid', {}).get('desktop', [])
                             if c['component_id'] == comp['id']), None)
                if cell:
                    key, d = delta
                    new = dict(cell)
                    new[key] = max(1, min(new[key] + d,
                                          12 - new['x'] if key == 'w' else new[key] + d))
                    return {'ops': [{'op': 'layout', 'component_id': comp['id'],
                                     'cell': {k: new[k] for k in ('x', 'y', 'w', 'h')}}],
                            'material': False, 'unresolved': [],
                            'explanation': f"Layout-only: '{comp['title']}' "
                                           f'{key} → {new[key]}. Applies instantly, '
                                           'no data rerun.'}

    # add: 'add X [and Y] as (a) kpi/bar/...'
    m = _re.search(r'\badd\b (.+?) as (?:a |an )?([\w ]+)', t)
    if m:
        type_word = next((w for w in _TYPE_WORDS if w in m.group(2)), None)
        ctype = _TYPE_WORDS.get(type_word or '', 'kpi')
        metric_ids = {mm['id']: mm for mm in spec.get('metrics', [])}
        phrases = _re.split(r',| and ', m.group(1))
        for ph in phrases:
            slug = _re.sub(r'[^a-z0-9]+', '_', ph.strip()).strip('_')
            hit = metric_ids.get(slug) or next(
                (mm for mm in metric_ids.values()
                 if mm.get('resolved') and slug and slug in mm['id']), None)
            if hit and hit.get('resolved', True):
                ops.append({'op': 'add_component',
                            'component': {'type': ctype,
                                          'title': hit['label'],
                                          'metric_refs': [hit['id']]}})
            else:
                unresolved.append(ph.strip())
        return {'ops': ops, 'material': bool(ops), 'unresolved': unresolved,
                'explanation': (f'Adds {len(ops)} component(s) with fresh query '
                                'contracts and grid placement.'
                                + (f" Unresolved: {', '.join(unresolved)} — not in "
                                   'the governed plan.' if unresolved else ''))}

    return {'ops': [], 'material': False, 'unresolved': [],
            'explanation': 'No dashboard change recognized — try "add <metric> as '
                           'a KPI", "make <component> wider", "use weekly instead", '
                           'or "turn <component> into a table".'}


def recompute_stale(conn, session_id, source_cid):
    """R41S1E3 — rerun exactly the stale components' queries against the
    session's source, refresh their contracts/data, clear the flags with
    one system-authored version. Untouched components keep their data."""
    import query_plan as qp
    spec = _head(conn, session_id)
    stale = [c for c in spec.get('components', []) if c.get('stale')]
    if not stale:
        return {'recomputed': [], 'spec_version': None}
    run = conn.execute("SELECT id FROM pipeline_runs WHERE session_id=? "
                       "AND status='done' ORDER BY id DESC LIMIT 1",
                       (session_id,)).fetchone()
    recomputed = []
    for comp in stale:
        try:
            sql, params = qp.compile_component_query(comp, spec, source_cid)
            info = qp.preview(conn, sql, params, limit=500)
            if run:
                conn.execute('INSERT INTO component_data (run_id, component_id, '
                             'query_hash, rows_json) VALUES (?,?,?,?)',
                             (run['id'], comp['id'], qp.query_hash(sql, params),
                              json.dumps(info['sample'])))
                conn.execute('INSERT INTO query_contracts (run_id, component_id, sql, '
                             "warehouse_dialect, expected_columns_json, status) "
                             "VALUES (?,?,?,'sqlite',?,'executed')",
                             (run['id'], comp['id'], sql,
                              json.dumps(info['row_shape'])))
            comp.pop('stale', None)
            recomputed.append(comp['id'])
        except Exception:
            comp['error_state'] = 'Recompute failed — previous data retained'
            comp.pop('stale', None)
    conn.commit()
    row = ds.persist(conn, session_id, spec, author='system')
    return {'recomputed': sorted(recomputed), 'spec_version': row['spec_version']}
