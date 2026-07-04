"""
Feature manifest scaffold (Sprint 6 / F-026).

One immutable row per gold-table write. Semver: identical feature list →
patch bump; changed feature list → minor bump; first manifest → 1.0.0.
"""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone

_SEMVER_RE = re.compile(r'^\d+\.\d+\.\d+$')


def validate_feature_manifest(m: dict) -> list[dict]:
    errors = []

    def err(code, message, field=None):
        errors.append({'code': code, 'error': message, 'field': field})

    if not isinstance(m, dict):
        return [{'code': 'invalid_manifest', 'error': 'manifest must be an object', 'field': None}]
    for f in ('manifest_version', 'workspace_id', 'session_id', 'gold_table_name', 'generated_at'):
        if m.get(f) in (None, ''):
            err('missing_field', f'{f} is required', f)
    if m.get('manifest_version') and not _SEMVER_RE.match(str(m['manifest_version'])):
        err('invalid_semver', 'manifest_version must be MAJOR.MINOR.PATCH', 'manifest_version')
    fl = m.get('feature_list')
    if not isinstance(fl, list):
        err('invalid_feature_list', 'feature_list must be a list (empty allowed)', 'feature_list')
    else:
        for f in fl:
            if not isinstance(f, dict) or not f.get('name') or not f.get('dtype') or 'source' not in f:
                err('invalid_feature', 'each feature requires name, dtype, source', 'feature_list')
                break
    return errors


def next_fm_version(prev_version: str | None, prev_features: list | None,
                    new_features: list) -> str:
    if not prev_version:
        return '1.0.0'
    major, minor, patch = (int(x) for x in prev_version.split('.'))
    prev_names = sorted(f.get('name', '') for f in (prev_features or []))
    new_names = sorted(f.get('name', '') for f in (new_features or []))
    if prev_names != new_names:
        return f'{major}.{minor + 1}.0'
    return f'{major}.{minor}.{patch + 1}'


def build_feature_manifest(gold_out: dict, spec: dict, workspace_id: str,
                           session_id: int, cube_schema: dict | None = None) -> dict:
    """Feature list from the gold column set (minus grain keys and target)."""
    sources = {}
    for cube in (cube_schema or {}).get('cubes', []):
        for m in cube.get('measures') or []:
            sources.setdefault(m['name'], cube['name'])
        for d in cube.get('dimensions') or []:
            sources.setdefault(d['name'], cube['name'])

    grain = set(gold_out.get('grain_keys') or [])
    target = gold_out.get('target_column')
    features = [
        {'name': c['name'], 'dtype': c['type'], 'source': sources.get(c['name'], 'gold'),
         'transformations': []}
        for c in gold_out.get('columns') or []
        if c['name'] not in grain and c['name'] != target
    ]
    return {
        'manifest_version': None,  # assigned at save time
        'workspace_id': workspace_id,
        'session_id': session_id,
        'gold_table_name': gold_out.get('table_name'),
        'gold_output_hash': gold_out.get('output_hash'),
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'feature_list': features,
        'enrichment_status': 'scaffold',  # enriched by Stage-3 feature engineering later
    }


def save_feature_manifest(conn, manifest: dict) -> dict:
    """Immutable append with semver assignment; validates before writing."""
    prev = conn.execute(
        'SELECT manifest_version, feature_list_json FROM feature_manifests '
        'WHERE workspace_id=? AND session_id=? ORDER BY id DESC LIMIT 1',
        (manifest['workspace_id'], manifest['session_id'])).fetchone()
    prev_version = prev['manifest_version'] if prev else None
    prev_features = json.loads(prev['feature_list_json']) if prev else None
    manifest['manifest_version'] = next_fm_version(prev_version, prev_features,
                                                   manifest['feature_list'])
    errs = validate_feature_manifest(manifest)
    if errs:
        raise ValueError(f'invalid feature manifest: {errs}')
    cur = conn.execute(
        'INSERT INTO feature_manifests (workspace_id, session_id, gold_table_name, '
        'gold_output_hash, manifest_version, feature_list_json, enrichment_status, generated_at) '
        'VALUES (?,?,?,?,?,?,?,?)',
        (manifest['workspace_id'], manifest['session_id'], manifest['gold_table_name'],
         manifest.get('gold_output_hash'), manifest['manifest_version'],
         json.dumps(manifest['feature_list']), manifest.get('enrichment_status', 'scaffold'),
         manifest['generated_at']))
    conn.commit()
    manifest['id'] = cur.lastrowid
    return manifest
