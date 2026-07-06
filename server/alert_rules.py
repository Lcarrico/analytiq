"""R36S1E3 (DEP) — alert rules: deterministic evaluation per kind against
real substrate. Rules are user-defined watches; every check appends an
immutable trigger row (firing | ok) with a grounded message."""
import json


def evaluate(conn, rule):
    """Return (status, message) for one rule against live data."""
    kind = rule['kind']
    cond = json.loads(rule['condition_json'] or '{}')

    if kind == 'threshold':
        floor = cond.get('floor')
        row = conn.execute(
            'SELECT cd.actual FROM chart_data cd JOIN pipeline_runs pr '
            'ON cd.pipeline_run_id = pr.id WHERE pr.session_id=? AND cd.is_forecast=0 '
            'ORDER BY cd.day_index DESC LIMIT 1', (rule['session_id'],)).fetchone()
        if not row or row['actual'] is None:
            return 'ok', 'no observations yet'
        if floor is not None and row['actual'] < floor:
            return 'firing', (f"latest actual {round(row['actual'], 1)} fell below "
                              f"the floor {floor}")
        return 'ok', f"latest actual {round(row['actual'], 1)} within band"

    if kind == 'freshness':
        import dq
        t = conn.execute(
            'SELECT ct.freshness FROM cataloged_tables ct JOIN governance_runs gr '
            'ON ct.run_id = gr.id WHERE gr.connection_id=? AND ct.name=? '
            'ORDER BY ct.id DESC LIMIT 1',
            (rule['connection_id'], rule['watch'])).fetchone()
        age = dq.parse_freshness_age(t['freshness'] if t else None)
        max_age = cond.get('max_age_hours', 24)
        if age is None:
            return 'ok', 'no sync recorded yet'
        if age > max_age:
            return 'firing', f'last sync {age}h ago exceeds the {max_age}h SLA'
        return 'ok', f'last sync {age}h ago within the {max_age}h SLA'

    if kind == 'schema_drift':
        n = conn.execute("SELECT COUNT(*) AS n FROM alerts WHERE type='drift' "
                         'AND connection_id=?', (rule['connection_id'],)).fetchone()['n']
        return ('firing', f'{n} schema drift events recorded') if n \
            else ('ok', 'no schema drift between manifest versions')

    if kind == 'model_drift':
        import model_monitor as mm
        check = mm.check(conn, rule['session_id']) if rule['session_id'] else None
        trig = (check or {}).get('triggers') or []
        return ('firing', ' · '.join(trig)) if trig \
            else ('ok', 'no drift on the latest monitor check')

    if kind == 'artifact_health':
        a = conn.execute('SELECT dq_status FROM artifacts WHERE id=?',
                         (rule['artifact_id'],)).fetchone() if rule['artifact_id'] else None
        if not a:
            return 'ok', 'artifact not found — nothing to watch'
        return ('ok', 'all gates passed') if a['dq_status'] == 'pass' \
            else ('firing', f"artifact gates report {a['dq_status']}")

    if kind == 'anomaly':
        rows = conn.execute(
            'SELECT cd.actual FROM chart_data cd JOIN pipeline_runs pr '
            'ON cd.pipeline_run_id = pr.id WHERE pr.session_id=? AND cd.is_forecast=0 '
            'ORDER BY cd.day_index DESC LIMIT 28', (rule['session_id'],)).fetchall()
        vals = [r['actual'] for r in rows if r['actual'] is not None]
        if len(vals) < 8:
            return 'ok', 'baseline still forming'
        mu = sum(vals[1:]) / len(vals[1:])
        sd = (sum((v - mu) ** 2 for v in vals[1:]) / len(vals[1:])) ** 0.5 or 1
        z = abs(vals[0] - mu) / sd
        sigma = cond.get('sigma', 3)
        if z > sigma:
            return 'firing', f'latest point {round(z, 1)}σ from the 28d baseline'
        return 'ok', f'latest point {round(z, 1)}σ — inside the {sigma}σ band'

    return 'ok', 'nothing to evaluate'
