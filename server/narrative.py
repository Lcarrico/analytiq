"""
Automatic Narrative Generation (Evo #25, R19S1E1 / arch §17.6.4).

Deterministic narrative built STRICTLY from the artifact's own data contract
and propagated confidence — every number in the text traces to stored facts.
Audience variants: executive leads with the conclusion, engineer leads with
data-quality and confidence detail (§17.6.4).
"""
from __future__ import annotations

import json


def facts_for(conn, artifact_id: int) -> dict | None:
    row = conn.execute('SELECT * FROM artifacts WHERE id=?', (artifact_id,)).fetchone()
    if not row or not row['pipeline_run_id']:
        return None
    art = dict(row)
    rid = art['pipeline_run_id']
    run = conn.execute('SELECT * FROM pipeline_runs WHERE id=?', (rid,)).fetchone()
    sess = conn.execute('SELECT * FROM sessions WHERE id=?', (run['session_id'],)).fetchone()
    dc = {r['component_id']: r for r in conn.execute(
        'SELECT * FROM component_data_contracts WHERE run_id=?', (rid,)).fetchall()}
    ts = dc.get('timeseries_ci')
    fc = dc.get('forecast')
    ranges = json.loads(ts['numeric_ranges_json']) if ts else {}
    conf = json.loads(art['confidence_json'] or '{}') if art.get('confidence_json') else {}
    return {
        'metric': sess['metric'] if sess else 'the metric',
        'history_days': ts['row_count'] if ts else 0,
        'forecast_days': fc['row_count'] if fc else 0,
        'actual_min': ranges.get('actual', {}).get('min'),
        'actual_max': ranges.get('actual', {}).get('max'),
        'actual_mean': ranges.get('actual', {}).get('mean'),
        'mape': art.get('mape'),
        'confidence': art.get('confidence'),
        'confidence_stages': conf.get('stages', {}),
    }


def generate(conn, artifact_id: int, audience: str = 'executive') -> dict | None:
    f = facts_for(conn, artifact_id)
    if f is None:
        return None
    if audience == 'engineer':
        text = (f"Data quality first: {f['history_days']} historical rows passed contract "
                f"validation; propagated confidence {f['confidence']} "
                f"(stages: {', '.join(f'{k} {v}' for k, v in sorted(f['confidence_stages'].items()))}). "
                f"{f['metric']} ranged {f['actual_min']}–{f['actual_max']} "
                f"(mean {f['actual_mean']}); the {f['forecast_days']}-day forecast holds "
                f"validation MAPE {f['mape']}%.")
    elif audience == 'analyst':
        text = (f"{f['metric']} averaged {f['actual_mean']} over {f['history_days']} days "
                f"(range {f['actual_min']}–{f['actual_max']}). The {f['forecast_days']}-day "
                f"forecast carries MAPE {f['mape']}% at confidence {f['confidence']}.")
    else:
        audience = 'executive'
        text = (f"{f['metric']} is projected forward {f['forecast_days']} days on "
                f"{f['history_days']} days of validated history; expect values near "
                f"{f['actual_mean']} with accuracy within {f['mape']}%. One caveat: "
                f"overall confidence is {f['confidence']}.")
    return {'artifact_id': artifact_id, 'audience': audience, 'narrative': text, 'facts': f}
