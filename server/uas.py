"""
Unified Artifact Store (R8S1E1-US1 / Architecture v2.1 §17.3.2).

Every generated object — session specs, dashboard plans, gold table refs,
model cards, assembled artifact refs — is a versioned, content-addressed,
immutable record in one store with a common metadata schema. This store is
the substrate the DAG execution model (§17.2.1, R8S2E3) runs against.

Identity: content_hash = sha256(canonical payload | governance manifest
version | semantic layer version). Identical inputs under identical governed
context are provably identical (§1.1). New content under the same logical
key appends version N+1 — rows are never mutated (enforced by triggers).
"""
from __future__ import annotations

import hashlib
import json
import uuid


def canonical(payload) -> str:
    return json.dumps(payload, sort_keys=True, separators=(',', ':'), default=str)


def content_hash(payload, gov_version: str, sem_version: str) -> str:
    raw = f"{canonical(payload)}|gov:{gov_version}|sem:{sem_version}"
    return hashlib.sha256(raw.encode()).hexdigest()


def _row_dict(row):
    d = dict(row)
    d['upstream_artifact_ids'] = json.loads(d.get('upstream_artifact_ids') or '[]')
    return d


def register(conn, artifact_type: str, payload, *, logical_key: str | None = None,
             upstream: list[str] | None = None, gov_version: str = '0.0.0',
             sem_version: str = '0.0.0', agent: str = 'system',
             workspace_id: str = 'default', run_id: int | None = None,
             audit: bool = True) -> dict:
    """Idempotent, content-addressed registration. Returns the row dict."""
    gov_version = gov_version or '0.0.0'
    sem_version = sem_version or '0.0.0'
    if logical_key is None:
        scope = f"r{run_id}" if run_id is not None else 'global'
        logical_key = f"{workspace_id}:{artifact_type}:{scope}"
    h = content_hash(payload, gov_version, sem_version)

    latest = conn.execute(
        'SELECT * FROM uas_artifacts WHERE logical_key=? ORDER BY version DESC LIMIT 1',
        (logical_key,)).fetchone()
    if latest and latest['content_hash'] == h:
        return _row_dict(latest)                      # identical → reuse

    version = (latest['version'] + 1) if latest else 1
    uid = uuid.uuid4().hex
    conn.execute(
        'INSERT INTO uas_artifacts (artifact_uid, logical_key, artifact_type, version, '
        'content_hash, upstream_artifact_ids, governance_manifest_version, '
        'semantic_layer_version, created_by_agent, workspace_id, run_id, payload_json) '
        'VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        (uid, logical_key, artifact_type, version, h,
         json.dumps(upstream or []), gov_version, sem_version, agent,
         workspace_id, run_id, canonical(payload)))
    if audit:
        conn.execute(
            'INSERT INTO audit_logs (org_id, user_email, action, resource_type, resource_id, metadata) '
            'VALUES (?,?,?,?,?,?)',
            (None, None, 'uas.registered', 'uas_artifact', uid,
             json.dumps({'artifact_type': artifact_type, 'version': version,
                         'logical_key': logical_key, 'content_hash': h})))
    conn.commit()
    return _row_dict(conn.execute(
        'SELECT * FROM uas_artifacts WHERE artifact_uid=?', (uid,)).fetchone())


def get_by_uid(conn, uid: str) -> dict | None:
    row = conn.execute('SELECT * FROM uas_artifacts WHERE artifact_uid=?', (uid,)).fetchone()
    return _row_dict(row) if row else None


def latest_by_logical(conn, logical_key: str) -> dict | None:
    row = conn.execute(
        'SELECT * FROM uas_artifacts WHERE logical_key=? ORDER BY version DESC LIMIT 1',
        (logical_key,)).fetchone()
    return _row_dict(row) if row else None


def versions_of(conn, uid: str) -> list[dict] | None:
    row = conn.execute('SELECT logical_key FROM uas_artifacts WHERE artifact_uid=?', (uid,)).fetchone()
    if not row:
        return None
    rows = conn.execute(
        'SELECT * FROM uas_artifacts WHERE logical_key=? ORDER BY version DESC',
        (row['logical_key'],)).fetchall()
    return [_row_dict(r) for r in rows]


def list_artifacts(conn, artifact_type: str | None = None, run_id: int | None = None,
                   workspace_id: str | None = None, limit: int = 200) -> list[dict]:
    """List store rows. With run_id, returns the run's nodes plus their full
    upstream closure — reused (content-cached) upstream nodes belong to the
    run's lineage even when first registered by an earlier run."""
    q, args = 'SELECT * FROM uas_artifacts WHERE 1=1', []
    if artifact_type:
        q += ' AND artifact_type=?'; args.append(artifact_type)
    if workspace_id:
        q += ' AND workspace_id=?'; args.append(workspace_id)
    else:
        # R9S2E6: sandbox namespaces are excluded from production indices
        q += " AND workspace_id NOT LIKE 'sandbox:%'"
    if run_id is not None:
        q += ' AND run_id=?'; args.append(run_id)
    q += ' ORDER BY id DESC LIMIT ?'; args.append(limit)
    rows = [_row_dict(r) for r in conn.execute(q, args).fetchall()]

    if run_id is not None:                            # upstream closure
        seen = {r['artifact_uid']: r for r in rows}
        frontier = [u for r in rows for u in r['upstream_artifact_ids']]
        while frontier:
            uid = frontier.pop()
            if uid in seen:
                continue
            row = get_by_uid(conn, uid)
            if row:
                seen[uid] = row
                frontier.extend(row['upstream_artifact_ids'])
        rows = sorted(seen.values(), key=lambda r: r['id'])
    return rows


def provenance_chain(conn, terminal_uid: str) -> list[dict]:
    """Upstream closure of a terminal node, ordered source → output
    (topological: every node appears after all of its upstreams)."""
    terminal = get_by_uid(conn, terminal_uid)
    if not terminal:
        return []
    nodes: dict[str, dict] = {}

    def visit(uid):
        if uid in nodes:
            return
        row = get_by_uid(conn, uid)
        if not row:
            return
        nodes[uid] = row
        for up in row['upstream_artifact_ids']:
            visit(up)

    visit(terminal_uid)
    ordered, placed = [], set()
    def place(uid):
        row = nodes.get(uid)
        if not row or uid in placed:
            return
        for up in row['upstream_artifact_ids']:
            place(up)
        placed.add(uid)
        ordered.append(row)
    place(terminal_uid)
    return ordered
