"""
Workspace search (R1S2E7).
Provider: Meilisearch/Typesense when MEILI_HOST is set; otherwise local
fallback — SQLite FTS5 index over artifact titles + linked metric names.
"""
from __future__ import annotations

import json
import os


def provider_mode() -> str:
    return 'meilisearch' if os.environ.get('MEILI_HOST') else 'local'


def ensure_index(conn) -> None:
    conn.execute('CREATE VIRTUAL TABLE IF NOT EXISTS artifacts_fts '
                 'USING fts5(title, metrics, artifact_id UNINDEXED)')
    conn.commit()


def _metric_terms(conn, artifact: dict) -> str:
    """Metric/feature names reachable through the artifact's session lineage."""
    terms = []
    run_id = artifact.get('pipeline_run_id')
    if run_id:
        row = conn.execute('SELECT session_id FROM pipeline_runs WHERE id=?', (run_id,)).fetchone()
        if row and row['session_id']:
            spec_row = conn.execute(
                'SELECT spec_json FROM session_specs WHERE session_id=? '
                'ORDER BY spec_version DESC LIMIT 1', (row['session_id'],)).fetchone()
            if spec_row:
                spec = json.loads(spec_row['spec_json'])
                terms.append(spec.get('target_metric') or '')
                terms.extend(spec.get('feature_candidates') or [])
            sess = conn.execute('SELECT metric FROM sessions WHERE id=?',
                                (row['session_id'],)).fetchone()
            if sess:
                terms.append(sess['metric'] or '')
    return ' '.join(t.replace('_', ' ') for t in terms if t)


def index_artifact(conn, artifact: dict) -> None:
    ensure_index(conn)
    conn.execute('DELETE FROM artifacts_fts WHERE artifact_id=?', (str(artifact['id']),))
    conn.execute('INSERT INTO artifacts_fts (title, metrics, artifact_id) VALUES (?,?,?)',
                 (artifact.get('title') or '', _metric_terms(conn, artifact),
                  str(artifact['id'])))
    conn.commit()


def remove_artifact(conn, artifact_id) -> None:
    ensure_index(conn)
    conn.execute('DELETE FROM artifacts_fts WHERE artifact_id=?', (str(artifact_id),))
    conn.commit()


def search(conn, q: str, limit: int = 20) -> list[dict]:
    ensure_index(conn)
    # sanitize: quoted prefix query per token, avoids FTS syntax injection
    tokens = [t for t in ''.join(ch if ch.isalnum() else ' ' for ch in q).split() if t]
    if not tokens:
        return []
    match = ' '.join(f'"{t}"*' for t in tokens)
    rows = conn.execute(
        'SELECT artifact_id, bm25(artifacts_fts) AS score FROM artifacts_fts '
        'WHERE artifacts_fts MATCH ? ORDER BY score LIMIT ?', (match, limit)).fetchall()
    return [{'artifact_id': int(r['artifact_id']), 'score': round(r['score'], 4)}
            for r in rows]
