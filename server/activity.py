"""
R31S2E1-US1 — the Recent Activity projection: audit_logs → typed, human feed
items for /app/activity (App Home.dc.html frame 02). Pure read-side; the
append-only audit log stays the source of truth.
"""
import json

KIND_PREFIXES = (
    ('build',      ('artifact.', 'pipeline.', 'session.')),
    ('governance', ('governance.', 'semantic.', 'review.', 'manifest.', 'definition.')),
    ('data',       ('connection.', 'schema.', 'drift.', 'table.', 'ingest.', 'source.')),
    ('share',      ('share_link.', 'share.', 'comment.', 'embed.', 'export.')),
    ('model',      ('model.', 'training.', 'retrain.', 'champion.')),
    ('alert',      ('alert.', 'subscription.', 'threshold.')),
)

LINKS = {
    'artifact': '/app/artifacts/{id}',
    'session': '/app/create/{id}',
    'connection': '/app/data/sources',
    'governance_run': '/app/governance',
}


def _kind(action):
    for kind, prefixes in KIND_PREFIXES:
        if action.startswith(prefixes):
            return kind
    return 'system'


def _title(row, meta):
    action = row['action']
    verb = action.split('.', 1)[-1].replace('_', ' ')
    subject = meta.get('title') or meta.get('to') or row['resource_type']
    return f"{verb} · {subject}"


def _meta_line(row, meta):
    parts = [row['action']]
    for k in ('from', 'expires_in_hours', 'restored_from', 'new_version', 'revoked', 'section'):
        if meta.get(k) is not None:
            parts.append(f"{k} {meta[k]}")
    return ' · '.join(str(p) for p in parts[:3])


def project(db, kind=None, cursor=None, limit=20):
    q = 'SELECT * FROM audit_logs WHERE 1=1'
    args = []
    if cursor:
        q += ' AND id < ?'
        args.append(int(cursor))
    q += ' ORDER BY id DESC LIMIT ?'
    args.append(int(limit) * 6 if kind else int(limit) + 1)
    rows = [dict(r) for r in db.execute(q, args).fetchall()]

    items = []
    for r in rows:
        k = _kind(r['action'])
        if kind and k != kind:
            continue
        try:
            meta = json.loads(r.get('metadata') or '{}')
        except Exception:
            meta = {}
        link_tpl = LINKS.get(r['resource_type'])
        items.append({
            'id': r['id'],
            'kind': k,
            'actor': r.get('user_email') or 'system',
            'title': _title(r, meta),
            'meta': _meta_line(r, meta),
            'entity_type': r['resource_type'],
            'entity_id': r.get('resource_id'),
            'link': link_tpl.format(id=r.get('resource_id')) if link_tpl and r.get('resource_id') else None,
            'at': r.get('created_at'),
        })
        if len(items) >= int(limit) + 1:
            break

    has_more = len(items) > int(limit)
    items = items[:int(limit)]
    return {
        'items': items,
        'next_cursor': items[-1]['id'] if has_more and items else None,
    }
