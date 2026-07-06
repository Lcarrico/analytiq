"""R39S1E1 (deep-dive F-05 / §6 workbench authoring) — the component
registry and the create/delete/duplicate operations, expressed as versioned
DashboardSpec appends with real per-component contracts.

Every mutation: validate against the registry → prove the query plans →
append a new immutable spec version → persist the query contract + result
rows for the session's latest run. Deterministic and audited by callers.
"""
import json
import re

import dashboard_spec as ds
import query_plan as qp

# per-type authoring defaults: required refs + default grid size
TYPE_DEFAULTS = {
    'kpi':       {'needs_metrics': True,  'w': 3,  'h': 2},
    'line':      {'needs_metrics': True,  'w': 12, 'h': 6},
    'bar':       {'needs_metrics': True,  'w': 6,  'h': 6},
    'area':      {'needs_metrics': True,  'w': 12, 'h': 6},
    'scatter':   {'needs_metrics': True,  'w': 6,  'h': 6},
    'table':     {'needs_metrics': True,  'w': 6,  'h': 6},
    'heatmap':   {'needs_metrics': True,  'w': 6,  'h': 6},
    'treemap':   {'needs_metrics': True,  'w': 6,  'h': 6},
    'narrative': {'needs_metrics': False, 'w': 6,  'h': 3},
    'filter':    {'needs_metrics': False, 'w': 3,  'h': 2},
    'spacer':    {'needs_metrics': False, 'w': 3,  'h': 2},
}


class RegistryError(Exception):
    def __init__(self, errors, status=422):
        super().__init__(json.dumps(errors))
        self.errors = errors if isinstance(errors, list) else [errors]
        self.status = status


def _slug(text):
    return re.sub(r'[^a-z0-9]+', '_', (text or '').lower()).strip('_') or 'component'


def _head(conn, session_id):
    row = conn.execute('SELECT * FROM dashboard_specs WHERE session_id=? '
                       'ORDER BY spec_version DESC LIMIT 1', (session_id,)).fetchone()
    if not row:
        raise RegistryError({'code': 'no_spec', 'message':
                             'No dashboard spec for this session yet'}, 409)
    return json.loads(row['spec_json'])


def _fresh_id(spec, base):
    existing = {c['id'] for c in spec.get('components', [])}
    cid, n = base, 2
    while cid in existing:
        cid, n = f'{base}_{n}', n + 1
    return cid


def _place(spec, cid, ctype):
    """Bottom-of-grid auto-placement; the R40 grid editor repacks."""
    d = TYPE_DEFAULTS[ctype]
    cells = spec.setdefault('grid', {}).setdefault('desktop', [])
    bottom = max((c['y'] + c['h'] for c in cells), default=0)
    cells.append({'component_id': cid, 'x': 0, 'y': bottom,
                  'w': d['w'], 'h': d['h']})


def build_component(spec, body):
    ctype = body.get('type')
    if ctype not in TYPE_DEFAULTS:
        raise RegistryError({'code': 'invalid_component_type',
                             'message': f'type must be one of {sorted(TYPE_DEFAULTS)}'})
    title = (body.get('title') or '').strip()
    if not title:
        raise RegistryError({'code': 'component_incomplete', 'message': 'title required'})
    refs = body.get('metric_refs') or []
    if TYPE_DEFAULTS[ctype]['needs_metrics'] and not refs:
        raise RegistryError({'code': 'component_incomplete',
                             'message': f'{ctype} components need metric_refs'})
    return {'id': _fresh_id(spec, _slug(title)), 'type': ctype, 'title': title,
            'metric_refs': refs, 'dimension_refs': body.get('dimension_refs') or [],
            'query_spec': body.get('query_spec') or {'grain': 'daily'},
            'encoding': body.get('encoding') or {}, 'interaction': {},
            'empty_state': 'No data in range', 'error_state': 'Query failed'}


_LAST_PREVIEW = {}


def last_preview_rows(comp_id):
    """Rows executed during the most recent add (same process) — the create
    response carries them so the canvas can render immediately."""
    return _LAST_PREVIEW.pop(comp_id, [])


def _persist_contract_and_data(conn, spec, comp, session_id):
    """Prove the query plans, then persist contract + rows for the latest run."""
    run = conn.execute("SELECT id FROM pipeline_runs WHERE session_id=? "
                       "AND status='done' ORDER BY id DESC LIMIT 1",
                       (session_id,)).fetchone()
    sess = conn.execute('SELECT connection_id FROM sessions WHERE id=?',
                        (session_id,)).fetchone()
    cid_conn = sess['connection_id'] if sess and sess['connection_id'] else None
    if not cid_conn:
        row = conn.execute('SELECT id FROM connections ORDER BY id DESC LIMIT 1').fetchone()
        cid_conn = row['id'] if row else None
    if comp['type'] in ('narrative', 'filter', 'spacer') or not cid_conn:
        return None
    sql, params = qp.compile_component_query(comp, spec, cid_conn)
    info = qp.preview(conn, sql, params, limit=500)
    _LAST_PREVIEW[comp['id']] = info['sample']
    if run:
        conn.execute('INSERT INTO query_contracts (run_id, component_id, sql, '
                     "warehouse_dialect, expected_columns_json, status) "
                     "VALUES (?,?,?,'sqlite',?,'executed')",
                     (run['id'], comp['id'], sql, json.dumps(info['row_shape'])))
        conn.execute('INSERT INTO component_data (run_id, component_id, query_hash, '
                     'rows_json) VALUES (?,?,?,?)',
                     (run['id'], comp['id'], qp.query_hash(sql, params),
                      json.dumps(info['sample'])))
        conn.commit()
    return info


def add_component(conn, session_id, body, author='user'):
    spec = _head(conn, session_id)
    comp = build_component(spec, body)
    spec['components'].append(comp)
    _place(spec, comp['id'], comp['type'])
    errs = ds.validate_spec(spec)
    if errs:
        raise RegistryError(errs)
    _persist_contract_and_data(conn, spec, comp, session_id)
    row = ds.persist(conn, session_id, spec, author=author)
    return comp, row


def delete_component(conn, session_id, comp_id, author='user'):
    spec = _head(conn, session_id)
    before = len(spec['components'])
    spec['components'] = [c for c in spec['components'] if c['id'] != comp_id]
    if len(spec['components']) == before:
        raise RegistryError({'code': 'unknown_component',
                             'message': f'{comp_id!r} is not in the spec'}, 404)
    for bp in spec.get('grid', {}):
        spec['grid'][bp] = [c for c in spec['grid'][bp]
                            if c['component_id'] != comp_id]
    errs = ds.validate_spec(spec)
    if errs:
        raise RegistryError(errs)
    return ds.persist(conn, session_id, spec, author=author)


def duplicate_component(conn, session_id, comp_id, author='user'):
    spec = _head(conn, session_id)
    src = next((c for c in spec['components'] if c['id'] == comp_id), None)
    if not src:
        raise RegistryError({'code': 'unknown_component',
                             'message': f'{comp_id!r} is not in the spec'}, 404)
    comp = json.loads(json.dumps(src))
    comp['id'] = _fresh_id(spec, f"{src['id']}_copy")
    comp['title'] = f"{src['title']} (copy)"
    spec['components'].append(comp)
    _place(spec, comp['id'], comp['type'])
    errs = ds.validate_spec(spec)
    if errs:
        raise RegistryError(errs)
    _persist_contract_and_data(conn, spec, comp, session_id)
    row = ds.persist(conn, session_id, spec, author=author)
    return comp, row
