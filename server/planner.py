"""
Session planner agent — plain-English utterance → validated session_spec.

Sprint 4 / F-016. Deterministic keyword classifier (no raw data leaves the
semantic layer): intent ∈ {descriptive, diagnostic, predictive, prescriptive}
with a confidence score. Below CLARIFY_THRESHOLD the planner returns exactly
one multiple-choice clarifying question instead of a spec.
"""
from __future__ import annotations

import re

CLARIFY_THRESHOLD = 0.85
VALID_INTENTS = ('descriptive', 'diagnostic', 'predictive', 'prescriptive')
VALID_OUTPUTS = ('kpi_summary', 'driver_analysis', 'forecast_dashboard', 'recommendation')

INTENT_KEYWORDS = {
    'predictive':   ('predict', 'forecast', 'next', 'future', 'will', 'project', 'expect'),
    'diagnostic':   ('why', 'driver', 'cause', 'drop', 'decline', 'anomaly', 'investigate', 'explain'),
    'prescriptive': ('should', 'optimize', 'maximize', 'minimize', 'recommend', 'allocate', 'best way'),
    'descriptive':  ('what', 'show', 'summarize', 'total', 'trend', 'how many', 'last', 'were'),
}
OUTPUT_FOR_INTENT = {
    'descriptive': 'kpi_summary', 'diagnostic': 'driver_analysis',
    'predictive': 'forecast_dashboard', 'prescriptive': 'recommendation',
}
DEFAULT_DATE_RANGE = {'start': '2023-01-01', 'end': '2023-12-31'}
DEFAULT_HORIZON = 14


def classify_intent(text: str) -> tuple[str, float]:
    t = (text or '').lower()
    scores = {intent: sum(1 for kw in kws if kw in t)
              for intent, kws in INTENT_KEYWORDS.items()}
    # priority on ties: predictive/diagnostic/prescriptive beat descriptive
    order = ('predictive', 'diagnostic', 'prescriptive', 'descriptive')
    best = max(order, key=lambda i: (scores[i], -order.index(i)))
    hits = scores[best]
    runner_up = max(v for k, v in scores.items() if k != best)
    if hits == 0:
        return 'descriptive', 0.5
    conf = 0.7 + 0.1 * min(hits, 3) - (0.05 if runner_up >= hits else 0.0)
    return best, round(min(conf, 0.98), 2)


def _parse_horizon(text: str) -> int | None:
    m = re.search(r'next\s+(\d+)\s*(day|week|month)', text.lower())
    if not m:
        return None
    n, unit = int(m.group(1)), m.group(2)
    return n * {'day': 1, 'week': 7, 'month': 30}[unit]


def _parse_grain(text: str) -> str:
    t = text.lower()
    entity = 'Location'
    for word, label in (('location', 'Location'), ('customer', 'Customer'),
                        ('region', 'Region'), ('store', 'Store'), ('channel', 'Channel')):
        if f'by {word}' in t or f'per {word}' in t:
            entity = label
            break
    unit = 'Day'
    if 'weekly' in t or 'per week' in t or 'by week' in t:
        unit = 'Week'
    elif 'monthly' in t or 'per month' in t or 'by month' in t:
        unit = 'Month'
    return f'{entity} · {unit}'


def _match_metric(text: str, manifest: dict | None, semantic_schema: dict | None) -> str | None:
    t = ' ' + re.sub(r'[^a-z0-9 ]', ' ', (text or '').lower()) + ' '
    candidates = []
    for d in (manifest or {}).get('definitions') or []:
        if d.get('type') == 'Metric' and d.get('name'):
            candidates.append(d['name'])
    for cube in (semantic_schema or {}).get('cubes') or []:
        for m in cube.get('measures') or []:
            if m.get('name'):
                candidates.append(m['name'].replace('_', ' ').title())
    # longest name first so 'Net Revenue' beats 'Revenue'
    for name in sorted(set(candidates), key=len, reverse=True):
        if f' {name.lower()} ' in t or name.lower().replace(' ', '') in t.replace(' ', ''):
            return name
    return None


def _feature_candidates(semantic_schema: dict | None) -> tuple[list[str], list[str]]:
    feats, explores = [], []
    for cube in (semantic_schema or {}).get('cubes') or []:
        used = False
        for m in cube.get('measures') or []:
            if m.get('ml_allowed', m.get('confidence') == 'high'):
                feats.append(m['name'])
                used = True
        for d in cube.get('dimensions') or []:
            if d.get('type') in ('time', 'number', 'string', 'boolean'):
                feats.append(d['name'])
                used = True
        if used:
            explores.append(cube['name'])
    # dedupe, keep order
    seen, out = set(), []
    for f in feats:
        if f not in seen:
            seen.add(f)
            out.append(f)
    return out, sorted(set(explores))


def plan_session(message: str, semantic_schema: dict | None = None,
                 manifest: dict | None = None, schema_version: str | None = None,
                 clarify_threshold: float | None = None) -> dict:
    # R10S2E4: the threshold is a per-user/per-workspace tunable; the 0.85
    # module default is the preserved baseline (§17.2.6).
    threshold = CLARIFY_THRESHOLD if clarify_threshold is None else clarify_threshold
    intent, conf = classify_intent(message)
    metric = _match_metric(message, manifest, semantic_schema)
    if metric:
        conf = round(min(conf + 0.1, 0.98), 2)

    if conf < threshold:
        metric_opts = [d['name'] for d in (manifest or {}).get('definitions') or []
                       if d.get('type') == 'Metric'][:3]
        options = ([f'Forecast {m} over the coming weeks' for m in metric_opts[:2]] +
                   ['Explain what drove a recent change',
                    'Summarize current performance'])[:5]
        while len(options) < 3:
            options.append('Something else')
        return {
            'needs_clarification': True,
            'intent_guess': intent,
            'intent_confidence': conf,
            'question': 'What would you like to do with this metric?',
            'options': options[:5],
        }

    horizon = _parse_horizon(message) or (DEFAULT_HORIZON if intent == 'predictive' else None)
    feats, explores = _feature_candidates(semantic_schema)
    return {
        'intent': intent,
        'intent_confidence': conf,
        'analytic_goal': message.strip(),
        'target_metric': metric or 'Net Revenue',
        'feature_candidates': feats,
        'date_range': dict(DEFAULT_DATE_RANGE),
        'grain': _parse_grain(message),
        'output_type': OUTPUT_FOR_INTENT[intent],
        'prediction_horizon': horizon,
        'explores_used': explores,
        'semantic_layer_version': schema_version,
        'governance_manifest_version': (manifest or {}).get('manifest_version'),
    }


def validate_session_spec(spec: dict) -> list[dict]:
    """Strict server-side validation; [] when valid, else structured errors."""
    errors = []

    def err(code, message, field=None):
        errors.append({'code': code, 'error': message, 'field': field})

    if not isinstance(spec, dict):
        return [{'code': 'invalid_spec', 'error': 'spec must be an object', 'field': None}]

    for f in ('target_metric', 'grain', 'output_type', 'analytic_goal'):
        if not spec.get(f):
            err('missing_field', f'{f} is required', f)

    if spec.get('intent') not in VALID_INTENTS:
        err('invalid_intent', f"intent must be one of {VALID_INTENTS}", 'intent')
    conf = spec.get('intent_confidence')
    if not isinstance(conf, (int, float)) or not (0 <= conf <= 1):
        err('invalid_confidence', 'intent_confidence must be within [0, 1]', 'intent_confidence')
    horizon = spec.get('prediction_horizon')
    if horizon is not None and (not isinstance(horizon, int) or horizon <= 0 or horizon > 365):
        err('invalid_horizon', 'prediction_horizon must be a positive integer ≤ 365',
            'prediction_horizon')
    if spec.get('output_type') and spec['output_type'] not in VALID_OUTPUTS:
        err('invalid_output_type', f"output_type must be one of {VALID_OUTPUTS}", 'output_type')
    dr = spec.get('date_range')
    if dr is not None and (not isinstance(dr, dict) or not dr.get('start') or not dr.get('end')):
        err('invalid_date_range', 'date_range requires start and end', 'date_range')
    for f in ('feature_candidates', 'explores_used'):
        v = spec.get(f)
        if v is not None and not isinstance(v, list):
            err('invalid_type', f'{f} must be a list', f)
    return errors
