"""
Data Modeler core (Sprint 5) — gold table SQL generation, grain uniqueness
probe, join fan-out detection, and target-leakage scanning.

All SQL is produced through the warehouse dialect layer; feature names come
exclusively from the semantic layer (nothing is invented).
"""
from __future__ import annotations

import hashlib
import json
import re

import splits as splits_mod
import warehouse

LEAK_DROP = 0.7
LEAK_HOLD = 0.3


class GoldGenerationError(Exception):
    pass


def _slug(text: str) -> str:
    return re.sub(r'[^a-z0-9]+', '_', (text or '').lower()).strip('_')


def _grain_keys(grain: str) -> list[dict]:
    """'Location · Day' → grain key columns with semantic types."""
    parts = [p.strip().lower() for p in re.split(r'[·xX/,]| by ', grain or '') if p.strip()]
    keys = []
    for p in parts:
        if p in ('day', 'week', 'month', 'date'):
            keys.append({'name': 'day', 'type': 'date'})
        else:
            keys.append({'name': f'{_slug(p)}_id', 'type': 'id'})
    return keys or [{'name': 'day', 'type': 'date'}]


def _schema_columns(cube_schema: dict) -> dict[str, dict]:
    cols = {}
    for cube in cube_schema.get('cubes', []):
        for m in cube.get('measures') or []:
            cols.setdefault(m['name'], {'cube': cube['name'], 'kind': 'measure', 'def': m})
        for d in cube.get('dimensions') or []:
            cols.setdefault(d['name'], {'cube': cube['name'], 'kind': 'dimension', 'def': d})
    return cols


def scan_leakage(feature_names: list[str], target_metric: str, horizon: int | None = None) -> dict:
    """Deterministic leakage risk per feature; DROP > 0.7, HOLD 0.3–0.7."""
    target_slug = _slug(target_metric)
    target_tokens = set(target_slug.split('_'))
    out = []
    for f in feature_names:
        fl = f.lower()
        risk = 0.0
        reasons = []
        safe_lag = bool(re.search(r'(^|_)(lag|trailing|rolling|prior|past)(_|\d)', fl))
        if _slug(f) == target_slug:
            risk, reasons = 1.0, ['feature is the prediction target']
        elif re.search(r'(^|_)(future|next|ahead|label|outcome|target)(_|$)', fl) and not safe_lag:
            risk = 0.85
            reasons = ['name indicates future/label information']
            if target_tokens & set(_slug(f).split('_')):
                risk = 0.95
                reasons.append('references the target metric')
        elif (target_tokens & set(_slug(f).split('_'))) and not safe_lag:
            risk = 0.5
            reasons = ['shares tokens with the target metric — verify timing']
        elif safe_lag:
            risk = 0.1
            reasons = ['lagged/rolling history is safe by construction']
        action = 'DROP' if risk > LEAK_DROP else 'HOLD' if risk >= LEAK_HOLD else 'PASS'
        out.append({'feature': f, 'risk': round(risk, 2), 'action': action, 'reasons': reasons})
    return {
        'features': out,
        'dropped': [r['feature'] for r in out if r['action'] == 'DROP'],
        'held': [r['feature'] for r in out if r['action'] == 'HOLD'],
    }


def detect_fanout(cube_schema: dict, explores_used: list[str]) -> dict:
    """Join-path fan-out heuristic: joining on non-id, non-unique columns."""
    findings, remediation = [], []
    status = 'PASS'
    cubes = {c['name']: c for c in cube_schema.get('cubes', [])}
    for name in explores_used or []:
        cube = cubes.get(name)
        if not cube:
            continue
        for j in cube.get('joins') or []:
            target = cubes.get(j.get('to'))
            if not target:
                continue
            key = j.get('on', '')
            target_dim = next((d for d in target.get('dimensions') or []
                               if d.get('name') == key), None)
            looks_like_key = key.endswith('_id') or (target_dim or {}).get('type') == 'number'
            if not looks_like_key:
                status = 'WARN'
                findings.append({
                    'from': name, 'to': j.get('to'), 'on': key,
                    'issue': f'join key {key!r} is not a unique id column — '
                             f'many-to-many fan-out risk'})
                remediation.extend([
                    f'Add a deduplication key on {j.get("to")}.{key} before joining.',
                    f'Switch the join to a bridge table between {name} and {j.get("to")}.',
                    'Or aggregate the right side to the join key grain first.'])
    return {'status': status, 'findings': findings, 'remediation': remediation}


def validate_grain(conn, table: str, keys: list[str]) -> dict:
    """Real GROUP BY probe for duplicate grain keys on a SQLite table."""
    d = warehouse.get_dialect('sqlite')
    qt = d.quote_identifier(table)
    key_sql = ', '.join(d.quote_identifier(k) for k in keys)
    rows = conn.execute(
        f'SELECT {key_sql}, COUNT(*) AS n FROM {qt} '
        f'GROUP BY {key_sql} HAVING COUNT(*) > 1 LIMIT 5').fetchall()
    if not rows:
        return {'status': 'PASS', 'offending_keys': [], 'remediation': []}
    return {
        'status': 'BLOCK',
        'offending_keys': [dict(zip(keys + ['count'], tuple(r))) for r in rows],
        'remediation': [
            f'Deduplicate rows on ({", ".join(keys)}) before the gold write.',
            'Check the join path for fan-out (many-to-many joins multiply rows).'],
    }


def generate_gold_sql(spec: dict, cube_schema: dict, workspace_id: str = 'default',
                      dialect_name: str = 'sqlite', session_id=None, version: int = 1) -> dict:
    """session_spec + cube_schema → {ddl, insert_sql, split_config, output_hash}."""
    d = warehouse.get_dialect(dialect_name)
    known = _schema_columns(cube_schema)

    unknown = [f for f in spec.get('feature_candidates') or [] if f not in known]
    if unknown:
        raise GoldGenerationError(
            f'feature(s) not present in the semantic layer: {", ".join(unknown)} — '
            f'gold generation never invents columns')

    grain_cols = _grain_keys(spec.get('grain', ''))
    grain_names = [g['name'] for g in grain_cols]
    target_col = f"target_{_slug(spec.get('target_metric'))}"

    leakage = scan_leakage(spec.get('feature_candidates') or [],
                           spec.get('target_metric'), spec.get('prediction_horizon'))
    dropped = set(leakage['dropped'])
    feature_cols = []
    for f in spec.get('feature_candidates') or []:
        if f in dropped or f in grain_names:
            continue
        kind = known[f]['kind']
        ftype = 'measure' if kind == 'measure' else (
            'date' if known[f]['def'].get('type') == 'time' else
            'flag' if known[f]['def'].get('type') == 'boolean' else 'dimension')
        feature_cols.append({'name': f, 'type': ftype})

    table_name = (f'analytics_{workspace_id}.gold_{_slug(spec.get("target_metric"))}'
                  f'_{_slug(spec.get("grain"))}_v{version}')

    columns = ([{'name': g['name'], 'type': g['type']} for g in grain_cols] +
               feature_cols + [{'name': target_col, 'type': 'measure'}])
    ddl_body = d.compile_create_table({'table': table_name, 'if_not_exists': True,
                                       'columns': columns})

    # INSERT-SELECT over the allowed join path (source explores only)
    explores = spec.get('explores_used') or []
    cubes = {c['name']: c for c in cube_schema.get('cubes', [])}
    base = next((e for e in explores if e in cubes and cubes[e].get('measures')),
                explores[0] if explores else None)
    if base is None or base not in cubes:
        raise GoldGenerationError('no usable explore in explores_used')
    select_cols = ', '.join(d.quote_identifier(c['name']) for c in columns[:-1])
    src = d.quote_identifier(cubes[base].get('sql_table') or base)
    join_sql = ''
    for j in cubes[base].get('joins') or []:
        if j['to'] in explores and j['to'] in cubes:
            jt = 'LEFT JOIN' if j.get('join_type') == 'left' else 'JOIN'
            tgt = d.quote_identifier(cubes[j['to']].get('sql_table') or j['to'])
            key = d.quote_identifier(j['on'])
            join_sql += f' {jt} {tgt} USING ({key})'
    insert_sql = (f'INSERT INTO {d.quote_identifier(table_name)} '
                  f'SELECT {select_cols}, '
                  f'{d.quote_identifier(_slug(spec.get("target_metric")))} AS '
                  f'{d.quote_identifier(target_col)} '
                  f'FROM {src}{join_sql}')

    split_config = splits_mod.compute_split_config(
        spec.get('date_range') or {'start': '2023-01-01', 'end': '2023-12-31'},
        row_count=0, horizon=spec.get('prediction_horizon'))

    hash_input = json.dumps({
        'spec': {k: spec.get(k) for k in ('target_metric', 'grain', 'feature_candidates',
                                          'date_range', 'prediction_horizon',
                                          'semantic_layer_version',
                                          'governance_manifest_version')},
        'table': table_name, 'columns': columns,
    }, sort_keys=True)
    output_hash = hashlib.sha256(hash_input.encode()).hexdigest()

    header = (f'-- gold table generated by AnalytIQ data modeler\n'
              f'-- manifest_version={spec.get("governance_manifest_version")} '
              f'semantic_layer_version={spec.get("semantic_layer_version")} '
              f'session_id={session_id} output_hash={output_hash}\n')

    return {
        'table_name': table_name,
        'ddl': header + ddl_body,
        'insert_sql': insert_sql,
        'split_config': split_config,
        'output_hash': output_hash,
        'columns': columns,
        'grain_keys': grain_names,
        'target_column': target_col,
        'leakage': leakage,
    }
