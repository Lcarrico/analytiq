"""R38S2E1 (deep-dive F-01/§5B step 6) — per-component query plans.

Compiles a component's query spec into read-only, dialect-quoted SQL against
the session connection's demo-warehouse tables (src_{cid}_*), validates it,
and previews row shape, row count, a stable content hash, and a cost
estimate. Deterministic: same spec → same SQL → same hash.
"""
import hashlib

import warehouse

GRAIN_SQL = {                      # SQLite date bucketing per analysis grain
    'daily': "%Y-%m-%d",
    'weekly': "%Y-W%W",
    'monthly': "%Y-%m",
}


class QueryPlanError(Exception):
    def __init__(self, code, message):
        super().__init__(message)
        self.code = code


def source_table(cid, name='fact_revenue'):
    return f'src_{cid}_{name}'


def compile_component_query(component, spec, cid):
    """component + spec context → (sql, params). SELECT-only by construction."""
    d = warehouse.get_dialect('sqlite')
    ctype = component.get('type')
    grain = (component.get('query_spec') or {}).get('grain') \
        or (spec.get('analysis') or {}).get('grain') or 'daily'
    grain = grain if grain in GRAIN_SQL else 'daily'
    fact = d.quote_identifier(source_table(cid))
    bucket = f"strftime('{GRAIN_SQL[grain]}', {d.quote_identifier('day')})"

    if ctype == 'kpi':
        sql = (f'SELECT ROUND(SUM({d.quote_identifier("net_revenue")}), 2) AS value, '
               f'COUNT(*) AS rows_in FROM {fact}')
        return sql, []
    if ctype in ('line', 'area'):
        sql = (f'SELECT {bucket} AS bucket, '
               f'ROUND(SUM({d.quote_identifier("net_revenue")}), 2) AS value '
               f'FROM {fact} GROUP BY bucket ORDER BY bucket')
        return sql, []
    if ctype in ('bar', 'table', 'heatmap', 'treemap'):
        dim = d.quote_identifier('location_id')
        sql = (f'SELECT {dim} AS dimension, '
               f'ROUND(SUM({d.quote_identifier("net_revenue")}), 2) AS value '
               f'FROM {fact} GROUP BY {dim} ORDER BY value DESC')
        return sql, []
    raise QueryPlanError('unsupported_component_type',
                         f'No query template for component type {ctype!r}')


def query_hash(sql, params=()):
    raw = sql + '|' + '|'.join(str(p) for p in params)
    return hashlib.sha256(raw.encode()).hexdigest()


def preview(conn, sql, params=(), limit=5):
    """Execute read-only and describe the result — shape, count, sample,
    and a rows-scanned cost estimate."""
    cur = conn.execute(sql, params)
    cols = [c[0] for c in cur.description]
    rows = cur.fetchall()
    scanned = 0
    low = sql.lower()
    if ' from ' in low:
        base = low.split(' from ', 1)[1].split()[0].strip('"')
        try:
            scanned = conn.execute(
                f'SELECT COUNT(*) FROM "{base}"').fetchone()[0]
        except Exception:
            scanned = len(rows)
    return {'row_shape': cols, 'row_count': len(rows),
            'sample': [list(r) for r in rows[:limit]],
            'cost': {'rows_scanned': scanned}}
