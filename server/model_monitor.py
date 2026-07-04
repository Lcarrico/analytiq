"""
Continuous Model Monitoring (R12S2E4-US1 / Architecture v2.1 §17.4.4).

Extends champion/challenger and the MAPE drift threshold (R5S2E2) with
ongoing observation that catches degradation BEFORE accuracy breaches:

- importance drift — the rolling feature-importance ranking is compared to
  the model card's recorded baseline; a Kendall-tau below 0.5 means the
  model is leaning on different features than it was validated on → review
  alert even when MAPE is fine;
- input drift — Population Stability Index between the earliest and latest
  runs' actual distributions; PSI > 0.2 is the conventional drift line.

Both detections emit `drift_detected` platform events, which the
event-driven execution layer (R9S1E3) turns into retrain jobs.
"""
from __future__ import annotations

import json
import math

TAU_THRESHOLD = 0.5
PSI_THRESHOLD = 0.2


def kendall_tau(rank_a: list, rank_b: list) -> float:
    """Kendall rank correlation over the items common to both rankings."""
    common = [x for x in rank_a if x in rank_b]
    n = len(common)
    if n < 2:
        return 1.0
    pos_b = {x: rank_b.index(x) for x in common}
    concordant = discordant = 0
    for i in range(n):
        for j in range(i + 1, n):
            a_order = 1  # common is already in rank_a order
            b_order = 1 if pos_b[common[i]] < pos_b[common[j]] else -1
            if a_order == b_order:
                concordant += 1
            else:
                discordant += 1
    total = concordant + discordant
    return round((concordant - discordant) / total, 3) if total else 1.0


def psi(expected: list, actual: list, bins: int = 10) -> float:
    """Population Stability Index over decile bins of the expected series."""
    if not expected or not actual:
        return 0.0
    srt = sorted(expected)
    edges = [srt[min(len(srt) - 1, int(len(srt) * k / bins))] for k in range(1, bins)]

    def dist(vals):
        counts = [0] * bins
        for v in vals:
            b = 0
            while b < len(edges) and v > edges[b]:
                b += 1
            counts[b] += 1
        return [max(c / len(vals), 1e-4) for c in counts]

    e, a = dist(expected), dist(actual)
    return round(sum((a[i] - e[i]) * math.log(a[i] / e[i]) for i in range(bins)), 4)


def check(conn, session_id: int) -> dict | None:
    sess = conn.execute('SELECT * FROM sessions WHERE id=?', (session_id,)).fetchone()
    if not sess:
        return None
    out = {'importance_drift': {'drifted': False}, 'input_drift': {'drifted': False},
           'triggers': []}

    # importance reordering vs the model card baseline
    card = conn.execute('SELECT * FROM model_cards WHERE session_id=? ORDER BY id DESC LIMIT 1',
                        (session_id,)).fetchone()
    if card:
        baseline = json.loads(card['metrics_json'] or '{}').get('top_features') or []
        baseline = [f['name'] if isinstance(f, dict) else f for f in baseline]
        current = [r['feature'] for r in conn.execute(
            'SELECT feature FROM gold_model_insights WHERE session_id=? AND model_card_id=? '
            'ORDER BY rank', (session_id, card['id'])).fetchall()]
        if baseline and current:
            tau = kendall_tau(baseline, current)
            drifted = tau < TAU_THRESHOLD
            out['importance_drift'] = {'drifted': drifted, 'kendall_tau': tau,
                                       'threshold': TAU_THRESHOLD,
                                       'baseline': baseline, 'current': current}
            if drifted:
                conn.execute('INSERT INTO alerts (type, subject, detail_json) VALUES (?,?,?)',
                             ('model.importance_drift',
                              f'Feature importance reordered for session {session_id} '
                              f'(tau {tau}) — review even though MAPE is within bounds.',
                              json.dumps({'session_id': session_id, 'kendall_tau': tau})))
                out['triggers'].append('importance_drift')

    # input distribution drift: earliest vs latest run actuals
    runs = [r['id'] for r in conn.execute(
        "SELECT DISTINCT pipeline_run_id AS id FROM gold_predictions WHERE session_id=? "
        'ORDER BY pipeline_run_id', (session_id,)).fetchall()]
    if len(runs) >= 2:
        first = [r['actual'] for r in conn.execute(
            'SELECT actual FROM gold_predictions WHERE pipeline_run_id=? AND actual IS NOT NULL',
            (runs[0],)).fetchall()]
        last = [r['actual'] for r in conn.execute(
            'SELECT actual FROM gold_predictions WHERE pipeline_run_id=? AND actual IS NOT NULL',
            (runs[-1],)).fetchall()]
        p = psi(first, last)
        drifted = p > PSI_THRESHOLD
        out['input_drift'] = {'drifted': drifted, 'psi': p, 'threshold': PSI_THRESHOLD,
                              'baseline_run': runs[0], 'current_run': runs[-1]}
        if drifted:
            conn.execute('INSERT INTO alerts (type, subject, detail_json) VALUES (?,?,?)',
                         ('model.input_drift',
                          f'Input distribution shifted for session {session_id} (PSI {p}).',
                          json.dumps({'session_id': session_id, 'psi': p})))
            out['triggers'].append('input_drift')
    conn.commit()

    if out['triggers']:
        import events
        events.emit(conn, 'drift_detected',
                    {'session_id': session_id, 'sources': out['triggers']})
    return out
