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


def _slug(name):
    return re.sub(r'[^a-z0-9]+', '_', (name or '').lower()).strip('_') or 'metric'


def _fmt_for(name):
    n = (name or '').lower()
    if any(w in n for w in ('revenue', 'value', 'price', 'cost', 'sales')):
        return 'currency'
    if any(w in n for w in ('rate', 'pct', '%', 'gap', 'conversion', 'share')):
        return 'percent'
    return 'number'


# R38S1E2 (deep-dive §5B–C): deterministic derived-metric registry — an LLM
# may phrase the ask, but expansion into dependencies is server-defined.
DERIVED_PATTERNS = (
    (('target gap %', 'target gap pct', 'target gap', 'gap %', 'gap pct'), {
        'id': 'target_gap_pct', 'label': 'Target Gap %',
        'dependencies': ('__primary__', '__primary_target__'),
        'expression': '({p} - {t}) / {t}',
        'zero_denominator': 'null', 'format': 'percent', 'aggregation': 'ratio'}),
    (('average order value', 'aov'), {
        'id': 'average_order_value', 'label': 'Average Order Value',
        'dependencies': ('net_revenue', 'order_count'),
        'expression': 'net_revenue / order_count',
        'zero_denominator': 'null', 'format': 'currency', 'aggregation': 'ratio'}),
    (('conversion rate',), {
        'id': 'conversion_rate', 'label': 'Conversion Rate',
        'dependencies': ('order_count', 'eligible_sessions'),
        'expression': 'order_count / eligible_sessions',
        'zero_denominator': 'null', 'format': 'percent', 'aggregation': 'ratio'}),
)

_SPLIT = re.compile(r',|\band\b|\bvs\.?\b|\bwith\b|\bplus\b')
_NOISE = re.compile(r'\b(forecast|show|display|compare|track|the|next|last|coming|'
                    r'\d+|days?|weeks?|months?|daily|weekly|monthly|for|over|by|me)\b')


def _catalog(manifest, semantic_schema):
    """slug → display label for every governed metric candidate."""
    out = {}
    for d in (manifest or {}).get('definitions') or []:
        if d.get('type') == 'Metric' and d.get('name'):
            out[_slug(d['name'])] = d['name']
    for cube in (semantic_schema or {}).get('cubes') or []:
        for m in cube.get('measures') or []:
            if m.get('name'):
                out[_slug(m['name'])] = m['name'].replace('_', ' ').title()
    return out


def build_metric_inventory(message, manifest, semantic_schema, primary_label):
    """Every named and implied metric, with roles, formats, dependency
    expansion, and explicit unresolved entries (never silently dropped)."""
    catalog = _catalog(manifest, semantic_schema)
    primary_id = _slug(primary_label)
    inv, order = {}, []

    def add(entry):
        if entry['id'] not in inv:
            inv[entry['id']] = entry
            order.append(entry['id'])
        return inv[entry['id']]

    def add_catalog_or_unresolved(slug_id, label, role='supporting'):
        if slug_id in catalog or slug_id == primary_id:
            return add({'id': slug_id, 'label': catalog.get(slug_id, label),
                        'role': role, 'resolved': True,
                        'format': _fmt_for(label), 'aggregation': 'sum'})
        return add({'id': slug_id, 'label': label, 'role': role, 'resolved': False,
                    'format': _fmt_for(label), 'aggregation': 'sum',
                    'reason': 'Not in the governed catalog — run governance on the '
                              'source that carries it, or pick a governed metric.',
                    'suggestions': sorted(catalog.values())[:3]})

    add({'id': primary_id, 'label': primary_label, 'role': 'primary',
         'resolved': True, 'format': _fmt_for(primary_label), 'aggregation': 'sum'})

    text = re.sub(r'[^a-z0-9%, ]', ' ', (message or '').lower())
    for raw in _SPLIT.split(text):
        phrase = _NOISE.sub(' ', raw)
        phrase = re.sub(r'\s+', ' ', phrase).strip(' .')
        if not phrase or _slug(phrase) == primary_id:
            continue
        matched = False
        for keys, tpl in DERIVED_PATTERNS:
            if any(k in phrase for k in keys):
                deps = []
                for d in tpl['dependencies']:
                    if d == '__primary__':
                        deps.append(primary_id)
                    elif d == '__primary_target__':
                        # reuse the target the ask already named (e.g.
                        # 'revenue target'); only mint one if none exists
                        existing = next((i for i in order
                                         if inv[i]['role'] == 'target'), None)
                        tid = existing or f'{primary_id}_target'
                        if not existing:
                            _target_entry(add, primary_id, primary_label)
                        deps.append(tid)
                    else:
                        deps.append(d)
                        add_catalog_or_unresolved(d, d.replace('_', ' ').title())
                add({'id': tpl['id'], 'label': tpl['label'], 'role': 'derived',
                     'resolved': all(inv[d]['resolved'] for d in deps if d in inv),
                     'dependencies': deps,
                     'expression': tpl['expression'].format(
                         p=primary_id, t=f'{primary_id}_target'),
                     'zero_denominator': tpl['zero_denominator'],
                     'format': tpl['format'], 'aggregation': tpl['aggregation'],
                     **({} if all(inv[d]['resolved'] for d in deps if d in inv)
                        else {'reason': 'One or more dependencies are unresolved.'})})
                matched = True
                break
        if matched:
            continue
        if phrase.endswith(' target') or phrase.startswith('target '):
            base = phrase.replace(' target', '').replace('target ', '').strip()
            _target_entry(add, _slug(base) or primary_id, base.title() or primary_label)
            continue
        add_catalog_or_unresolved(_slug(phrase), phrase.title())

    metrics = [inv[i] for i in order]
    unresolved = [{'id': m['id'], 'label': m['label'], 'reason': m.get('reason', '')}
                  for m in metrics if not m['resolved']]
    return metrics, unresolved


def _target_entry(add, base_id, base_label):
    add({'id': f'{base_id}_target', 'label': f'{base_label} Target',
         'role': 'target', 'resolved': False,
         'format': _fmt_for(base_label), 'aggregation': 'sum',
         'reason': 'No governed target source configured yet — targets bind '
                   'under Trust & targets (R42).'})


def propose_components(metrics, intent):
    """Deterministic role-driven component proposals (doc §5B step 5) —
    replaces nothing yet; R38S2E2 swaps the fixed template for these."""
    comps = []
    resolved = [m for m in metrics if m['resolved']]
    for m in resolved:
        comps.append({'type': 'kpi', 'metric_refs': [m['id']],
                      'rationale': f"headline for {m['label']}"})
    primary = next((m for m in metrics if m['role'] == 'primary'), None)
    if primary:
        trend_refs = [primary['id']] + [m['id'] for m in resolved
                                        if m['role'] == 'target']
        comps.append({'type': 'line', 'metric_refs': trend_refs,
                      'rationale': 'trend over the analysis window'})
        if intent == 'predictive':
            comps.append({'type': 'area', 'metric_refs': [primary['id']],
                          'rationale': 'forecast with confidence interval'})
        if intent == 'diagnostic':
            comps.append({'type': 'bar', 'metric_refs': [primary['id']],
                          'rationale': 'driver breakdown'})
    return comps


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
    primary_label = metric or 'Net Revenue'
    metrics_inv, unresolved = build_metric_inventory(message, manifest,
                                                     semantic_schema, primary_label)
    return {
        'metrics': metrics_inv,
        'unresolved': unresolved,
        'components_intent': propose_components(metrics_inv, intent),
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
