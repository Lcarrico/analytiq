"""
Confidence Propagation (R11S1E2-US1 / Architecture v2.1 §17.5.2).

Combines independently produced stage confidences into one propagated value
attached to the assembled artifact:
- intent   — Stage-2 intent_confidence from the confirmed spec
             (0.75 prior when the demo flow skipped explicit confirmation);
- features — 1 − max(leakage_risk) over the enriched feature manifest
             (0.9 prior when no manifest exists);
- model    — validation MAPE mapped to [0,1] as max(0, 1 − MAPE/50)
             (0.85 prior for descriptive artifacts with no model metric).

Combination is the documented deterministic function `weighted_minimum v1`
(all stage weights 1.0 ⇒ plain minimum) — auditable end to end through the
Explainability Engine (§17.5.1), never an opaque score.
"""
from __future__ import annotations

import json

METHOD = 'weighted_minimum v1'
STAGE_WEIGHTS = {'intent': 1.0, 'features': 1.0, 'model': 1.0}
DEFAULTS = {'intent': 0.75, 'features': 0.9, 'model': 0.85}
LOW_THRESHOLD = 0.7
MAPE_SCALE = 50.0


def stage_confidences(conn, session_id: int | None, run_id: int | None) -> dict:
    stages = dict(DEFAULTS)
    if session_id:
        spec = conn.execute('SELECT spec_json FROM session_specs WHERE session_id=? '
                            'ORDER BY spec_version DESC LIMIT 1', (session_id,)).fetchone()
        if spec:
            c = json.loads(spec['spec_json']).get('intent_confidence')
            if isinstance(c, (int, float)):
                stages['intent'] = round(float(c), 3)
        fm = conn.execute('SELECT feature_list_json FROM feature_manifests WHERE session_id=? '
                          'ORDER BY id DESC LIMIT 1', (session_id,)).fetchone()
        if fm:
            risks = [f.get('leakage_risk') or 0.0
                     for f in json.loads(fm['feature_list_json'] or '[]')]
            if risks:
                stages['features'] = round(1.0 - max(risks), 3)
    if run_id:
        run = conn.execute('SELECT mape FROM pipeline_runs WHERE id=?', (run_id,)).fetchone()
        if run and run['mape'] is not None:
            stages['model'] = round(max(0.0, 1.0 - run['mape'] / MAPE_SCALE), 3)
    return stages


def propagate(conn, session_id: int | None, run_id: int | None) -> dict:
    stages = stage_confidences(conn, session_id, run_id)
    weighted = {k: round(v * STAGE_WEIGHTS[k], 3) for k, v in stages.items()}
    value = min(weighted.values())
    return {'confidence': value, 'stages': stages, 'weights': STAGE_WEIGHTS,
            'method': METHOD,
            'level': 'low' if value < LOW_THRESHOLD else 'normal'}
