"""
Governance manifest — versioned semver JSON contract (Sprint 2 / F-007).

Manifests are immutable: every change (re-profile, PII approval, rollback)
creates a NEW version. Semver rules:
  - schema change (tables/columns added, removed, renamed) → MAJOR bump
  - profile-only change (stats, flags, definitions)         → MINOR bump
"""
from __future__ import annotations

import json
from datetime import datetime, timezone

import dq
import pii as pii_mod


def schema_fingerprint(manifest_dict: dict) -> list:
    """Stable structural fingerprint: sorted table → sorted column names."""
    fp = []
    for t in sorted(manifest_dict.get('tables', []), key=lambda t: t['name']):
        fp.append((t['name'], tuple(sorted(c['name'] for c in t.get('columns', [])))))
    return fp


def _bump(version: str, part: str) -> str:
    major, minor, patch = (int(x) for x in version.split('.'))
    if part == 'major':
        return f'{major + 1}.0.0'
    if part == 'minor':
        return f'{major}.{minor + 1}.0'
    return f'{major}.{minor}.{patch + 1}'


def next_version(prev_manifest: dict | None, new_manifest: dict) -> str:
    """Semver for a new manifest given the previous one (or None)."""
    if not prev_manifest:
        return '1.0.0'
    prev_v = prev_manifest.get('manifest_version', '1.0.0')
    if schema_fingerprint(prev_manifest) != schema_fingerprint(new_manifest):
        return _bump(prev_v, 'major')
    return _bump(prev_v, 'minor')


def build_manifest(connection_id: int, run_id: int, tables: list[dict],
                   definitions: list[dict], workspace_id: str = 'default') -> dict:
    """Assemble a governance_manifest from cataloged tables + semantic defs.

    `tables`: rows from cataloged_tables, each optionally carrying a
    'columns' list [{'name','semantic_type','samples'}].
    """
    out_tables = []
    review_required = False
    for t in tables:
        gates = {g: t.get(g, 'pass') for g in dq.GATE_FIELDS}
        columns = []
        table_has_pii = False
        for col in t.get('columns') or []:
            flag = pii_mod.scan_column(col.get('name', ''), col.get('samples'))
            blocked = bool(flag and flag['confidence'] >= pii_mod.BLOCK_CONFIDENCE)
            table_has_pii = table_has_pii or blocked
            columns.append({
                'name': col['name'],
                'semantic_type': col.get('semantic_type', 'unknown'),
                'nullable': col.get('nullable', True),
                'null_pct': col.get('null_pct'),
                'estimated_cardinality': col.get('estimated_cardinality'),
                'pii_flags': flag,
                'allow_ml_use': not blocked,
            })
        if table_has_pii and gates.get('pii_gate') == 'pass':
            gates['pii_gate'] = 'flag'
        status = dq.evaluate_gates(gates)
        if status == 'BLOCK':
            review_required = True
        health = t.get('health_score')
        if health is None:
            health = dq.compute_health_score(
                has_pk=gates.get('pk_gate') == 'pass',
                freshness=t.get('freshness', 'N/A'),
                row_count=dq.row_count_to_int(t.get('row_count')))
        out_tables.append({
            'name': t['name'],
            'schema': t.get('schema_name'),
            'health_score': health,
            'freshness': t.get('freshness'),
            'row_count': t.get('row_count'),
            'gates': gates,
            'dq_gate_status': status,
            'columns': columns,
        })

    low_conf = [d for d in definitions if (d.get('confidence') or 1.0) < 0.70]
    if low_conf:
        review_required = True

    # R3S2E1: infer lineage edges by id-column ownership (fact.<x>_id → dim table)
    id_owner = {}
    for t in tables:
        for col in t.get('columns') or []:
            if str(col.get('name', '')).endswith('_id') and t['name'].startswith('dim'):
                id_owner.setdefault(col['name'], t['name'])
    lineage_edges = []
    for t in tables:
        for col in t.get('columns') or []:
            owner = id_owner.get(col.get('name'))
            if owner and owner != t['name']:
                lineage_edges.append({'from': t['name'], 'to': owner, 'on': col['name']})
    lineage_edges.sort(key=lambda e: (e['from'], e['to']))

    return {
        'manifest_version': None,  # set by save step via next_version()
        'workspace_id': workspace_id,
        'integration_id': connection_id,
        'run_id': run_id,
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'tables': out_tables,
        'definitions': [
            {'type': d.get('type'), 'name': d.get('name'),
             'definition': d.get('definition'), 'confidence': d.get('confidence'),
             'needs_review': (d.get('confidence') or 1.0) < 0.70}
            for d in definitions
        ],
        'lineage_edges': lineage_edges,
        'dq_gate_status': ('BLOCK' if any(t['dq_gate_status'] == 'BLOCK' for t in out_tables)
                           else 'WARN' if any(t['dq_gate_status'] == 'WARN' for t in out_tables)
                           else 'PASS'),
        'human_review_required': review_required,
    }


def save_manifest(conn, connection_id: int, manifest_dict: dict) -> dict:
    """Version + persist a manifest (immutable append). Returns saved dict."""
    prev_row = conn.execute(
        'SELECT manifest_json FROM governance_manifests WHERE connection_id=? '
        'ORDER BY id DESC LIMIT 1', (connection_id,)).fetchone()
    prev = json.loads(prev_row['manifest_json']) if prev_row else None
    manifest_dict['manifest_version'] = next_version(prev, manifest_dict)
    conn.execute(
        'INSERT INTO governance_manifests (connection_id, run_id, version, manifest_json) '
        'VALUES (?,?,?,?)',
        (connection_id, manifest_dict.get('run_id'), manifest_dict['manifest_version'],
         json.dumps(manifest_dict)),
    )
    conn.commit()
    return manifest_dict
