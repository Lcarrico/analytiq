"""
Table health scoring + deterministic DQ gate engine.

Sprint 2: health score 0–100 with penalties (PK, freshness, row count, nulls);
gate evaluation maps per-gate states to PASS | WARN | BLOCK.
Critical (BLOCK): PK uniqueness failure, key-column null-rate failure, PII flag.
Non-critical (WARN): freshness SLA, row-count minimums, any warn state.
"""
from __future__ import annotations

# gates whose 'fail' state blocks downstream ML stages
CRITICAL_GATES = ('pk_gate', 'null_gate')
GATE_FIELDS = ('pk_gate', 'null_gate', 'freshness_gate', 'pii_gate', 'row_min_gate')


def compute_health_score(has_pk: bool, freshness: str, row_count: int,
                         null_pct: float = 0.0) -> int:
    """0–100 health score with PRD-style penalties."""
    score = 100
    if not has_pk:
        score -= 15
    if not freshness or freshness == 'N/A':
        score -= 10
    if row_count < 100:
        score -= 30
    elif row_count < 500:
        score -= 10
    if null_pct > 20:
        score -= 15
    elif null_pct > 5:
        score -= 5
    return max(0, min(100, score))


def ml_ready(health_score: int) -> bool:
    return health_score >= 70


def row_count_to_int(row_count_str) -> int:
    """Parse display strings like '4.2M', '12.8K', '124' back to ints."""
    if isinstance(row_count_str, (int, float)):
        return int(row_count_str)
    s = str(row_count_str or '0').replace(',', '').strip()
    try:
        if s.upper().endswith('M'):
            return int(float(s[:-1]) * 1_000_000)
        if s.upper().endswith('K'):
            return int(float(s[:-1]) * 1_000)
        return int(float(s))
    except ValueError:
        return 0


def evaluate_gates(gates: dict) -> str:
    """Map per-gate states (pass|warn|fail|flag) to PASS | WARN | BLOCK."""
    # PII flag blocks ML use outright
    if gates.get('pii_gate') in ('flag', 'fail', 'block'):
        return 'BLOCK'
    for g in CRITICAL_GATES:
        if gates.get(g) == 'fail':
            return 'BLOCK'
    for g in GATE_FIELDS:
        if gates.get(g) in ('warn', 'fail'):
            return 'WARN'
    return 'PASS'


def gate_report(gates: dict) -> dict:
    """Structured result for one table: status + offending gates + remediation."""
    status = evaluate_gates(gates)
    offending = [g for g in GATE_FIELDS if gates.get(g) not in (None, 'pass')]
    remediation = {
        'pk_gate': 'Add or repair the primary key; deduplicate offending rows.',
        'null_gate': 'Backfill or drop rows with NULL key columns.',
        'freshness_gate': 'Check upstream load schedule; table exceeds freshness SLA.',
        'pii_gate': 'Column(s) flagged as PII — mask upstream or request admin ML approval.',
        'row_min_gate': 'Table has too few rows for reliable modeling.',
    }
    return {
        'status': status,
        'offending_gates': offending,
        'remediation': [remediation[g] for g in offending],
    }


# ─────────────────────────────────────────────────────────
# Sprint 13 / F-053 — rule-level DQ gate engine
# ─────────────────────────────────────────────────────────
import hashlib as _hashlib
import json as _json
from datetime import datetime as _dt, timezone as _tz

MVP_RULES = (
    ('schema_fingerprint',        'Schema fingerprint recorded',      'warning'),
    ('pk_uniqueness',             'Primary key uniqueness',           'critical'),
    ('null_rate_for_key_columns', 'Null rate on key columns',         'critical'),
    ('row_count_minimum',         'Row count minimum',                'warning'),
    ('freshness_sla',             'Freshness SLA',                    'warning'),
    ('pii_detection',             'PII detection',                    'critical'),
    ('distribution_shift',        'Distribution shift (3σ)',          'warning'),
)

_REMEDIATION = {
    'pk_uniqueness': 'Repair or add primary keys; deduplicate offending rows before ML use.',
    'null_rate_for_key_columns': 'Backfill or exclude rows with NULL key columns.',
    'row_count_minimum': 'Widen the date range or coarsen the grain to gather more rows.',
    'freshness_sla': 'Check upstream load schedules; the table exceeds its freshness SLA.',
    'pii_detection': 'Mask or drop PII columns, or request explicit admin ML approval.',
    'distribution_shift': 'Investigate upstream changes; re-baseline if the shift is expected.',
    'schema_fingerprint': 'Regenerate the governance manifest to refresh the fingerprint.',
}


def validate_manifest_input(manifest: dict) -> list[dict]:
    errors = []
    if not isinstance(manifest, dict):
        return [{'code': 'invalid_manifest', 'error': 'manifest must be an object', 'field': None}]
    for f in ('manifest_version', 'workspace_id', 'generated_at'):
        if not manifest.get(f):
            errors.append({'code': 'missing_field', 'error': f'{f} is required', 'field': f})
    if not isinstance(manifest.get('tables'), list):
        errors.append({'code': 'invalid_tables', 'error': 'tables must be a list', 'field': 'tables'})
    return errors


def _worst(outcomes):
    order = {'PASS': 0, 'WARN': 1, 'BLOCK': 2}
    return max(outcomes, key=lambda o: order[o]) if outcomes else 'PASS'


def evaluate_manifest(manifest: dict, baseline: dict | None = None,
                      settings: dict | None = None) -> dict:
    """Evaluate the MVP DQ rule set against a governance manifest.

    Deterministic: identical input manifests produce identical result hashes.
    """
    tables = manifest.get('tables', [])

    def tables_where(gate, states):
        return sorted(t['name'] for t in tables
                      if (t.get('gates') or {}).get(gate) in states)

    rules = []

    def add(rule_id, rule_name, severity, outcome, message, details):
        rules.append({
            'rule_id': rule_id, 'rule_name': rule_name, 'severity': severity,
            'outcome': outcome, 'human_readable_message': message, 'details': details,
            'suggested_remediation': _REMEDIATION.get(rule_id) if outcome != 'PASS' else None,
        })

    names = {r[0]: (r[1], r[2]) for r in MVP_RULES}

    # schema_fingerprint — present when tables have columns enumerated
    missing_cols = sorted(t['name'] for t in tables if not t.get('columns'))
    add('schema_fingerprint', *names['schema_fingerprint'],
        'WARN' if missing_cols else 'PASS',
        ('Some tables have no column fingerprint' if missing_cols
         else 'Schema fingerprint recorded for all tables'),
        {'tables_missing_columns': missing_cols, 'table_count': len(tables)})

    # pk_uniqueness
    off = tables_where('pk_gate', ('fail',))
    warn = tables_where('pk_gate', ('warn',))
    add('pk_uniqueness', *names['pk_uniqueness'],
        'BLOCK' if off else 'WARN' if warn else 'PASS',
        (f'{len(off)} table(s) violate PK uniqueness' if off else
         f'{len(warn)} table(s) have PK warnings' if warn else 'All primary keys unique'),
        {'offending_tables': off or warn})

    # null_rate_for_key_columns
    off = tables_where('null_gate', ('fail',))
    warn = tables_where('null_gate', ('warn',))
    add('null_rate_for_key_columns', *names['null_rate_for_key_columns'],
        'BLOCK' if off else 'WARN' if warn else 'PASS',
        (f'{len(off)} table(s) exceed key-column null thresholds' if off else
         f'{len(warn)} table(s) near null thresholds' if warn else 'Key-column null rates within limits'),
        {'offending_tables': off or warn})

    # row_count_minimum (non-critical per PRD)
    off = tables_where('row_min_gate', ('fail', 'warn'))
    add('row_count_minimum', *names['row_count_minimum'],
        'WARN' if off else 'PASS',
        (f'{len(off)} table(s) below row-count minimums' if off else 'Row counts sufficient'),
        {'offending_tables': off})

    # freshness_sla
    off = tables_where('freshness_gate', ('fail', 'warn'))
    add('freshness_sla', *names['freshness_sla'],
        'WARN' if off else 'PASS',
        (f'{len(off)} table(s) exceed freshness SLA' if off else 'All tables within freshness SLA'),
        {'offending_tables': off})

    # pii_detection — blocked unless approved for ML
    flagged = sorted({t['name'] for t in tables
                      for c in (t.get('columns') or [])
                      if c.get('pii_flags') and not c.get('allow_ml_use')} |
                     set(tables_where('pii_gate', ('flag', 'fail', 'block'))))
    add('pii_detection', *names['pii_detection'],
        'BLOCK' if flagged else 'PASS',
        (f'PII detected in {len(flagged)} table(s) without ML approval' if flagged
         else 'No unapproved PII columns'),
        {'offending_tables': flagged})

    # distribution_shift (3σ) — needs a baseline manifest
    if baseline:
        shifts = []
        prev = {t['name']: row_count_to_int(t.get('row_count')) for t in baseline.get('tables', [])}
        for t in tables:
            if t['name'] in prev and prev[t['name']]:
                cur = row_count_to_int(t.get('row_count'))
                delta = abs(cur - prev[t['name']]) / prev[t['name']]
                if delta > 0.5:  # deterministic 3σ stand-in on row volume
                    shifts.append({'table': t['name'], 'delta_pct': round(delta * 100, 1)})
        add('distribution_shift', *names['distribution_shift'],
            'WARN' if shifts else 'PASS',
            (f'{len(shifts)} table(s) shifted vs baseline' if shifts
             else 'No significant distribution shift vs baseline'),
            {'shifted': shifts, 'baseline_version': baseline.get('manifest_version')})
    else:
        add('distribution_shift', *names['distribution_shift'], 'PASS',
            'No baseline manifest available — first evaluation', {'baseline_version': None})

    # R32S1E4: per-connection rule settings — disabled rules are SKIPPED
    # (excluded from the overall outcome); block_on_failure raises or lowers
    # a failing rule between WARN and BLOCK. Deterministic given settings.
    for r in rules:
        s = (settings or {}).get(r['rule_id'])
        if not s:
            continue
        if not s.get('enabled', 1):
            r['outcome'] = 'SKIPPED'
            r['suggested_remediation'] = None
            r['human_readable_message'] += ' — skipped (rule disabled)'
        elif s.get('block_on_failure') is not None:
            if r['outcome'] == 'BLOCK' and not s['block_on_failure']:
                r['outcome'] = 'WARN'
            elif r['outcome'] == 'WARN' and s['block_on_failure']:
                r['outcome'] = 'BLOCK'

    outcome = _worst([r['outcome'] for r in rules if r['outcome'] != 'SKIPPED'])
    result_hash = _hashlib.sha256(_json.dumps(
        {'rules': rules, 'outcome': outcome,
         'manifest_version': manifest.get('manifest_version')},
        sort_keys=True).encode()).hexdigest()
    return {
        'outcome': outcome,
        'rules': rules,
        'manifest_version': manifest.get('manifest_version'),
        'workspace_id': manifest.get('workspace_id'),
        'result_hash': result_hash,
        'evaluated_at': _dt.now(_tz.utc).isoformat(),
    }


# ─────────────────────────────────────────────────────────
# R3S1E2 — freshness age parsing for SLA evaluation
# ─────────────────────────────────────────────────────────
import re as _re


def parse_freshness_age(freshness: str):
    """'2h ago' → 2, '3d ago' → 72, '30m ago' → 0.5, 'N/A' → None (hours)."""
    if not freshness or freshness == 'N/A':
        return None
    m = _re.match(r'^<?(\d+)\s*(m|h|d)\b', str(freshness).strip())
    if not m:
        return None
    n, unit = int(m.group(1)), m.group(2)
    return {'m': n / 60, 'h': n, 'd': n * 24}[unit]
