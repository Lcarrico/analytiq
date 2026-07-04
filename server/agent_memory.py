"""
Persistent Agent Memory (R10S1E1-US1 / Architecture v2.1 §17.3.1).

Durable, per-workspace/per-user memory so the platform gets measurably
better at serving a workspace instead of resetting every prompt.

Governance:
- Memory is itself a governed artifact type: values pass the same PII
  pattern gate as Stage-0 source data (§3.3) — PII is rejected at write.
- Memory informs but never silently overrides an explicit user instruction
  in the current turn: it is a prior, not a constraint (enforced at the
  planner integration point, asserted in tests).
- Unused entries decay (half-life weighting) and stop influencing plans.
- Every write and delete is audited.
"""
from __future__ import annotations

import json

import pii

CATEGORIES = ('chart_type_default', 'dismissed_insight',
              'semantic_suggestion_feedback', 'filter_pattern')
RECALL_MIN_WEIGHT = 0.5
HALF_LIFE_DAYS = 30.0
REINFORCE_STEP = 0.5
MAX_WEIGHT = 5.0


def _audit(conn, action, rid, meta):
    conn.execute('INSERT INTO audit_logs (org_id, user_email, action, resource_type, resource_id, metadata) '
                 'VALUES (?,?,?,?,?,?)',
                 (None, None, action, 'agent_memory', str(rid) if rid else None, json.dumps(meta)))


def remember(conn, agent: str, category: str, key: str, value: str, *,
             user: str = 'default', workspace: str = 'default') -> dict:
    if category not in CATEGORIES:
        raise ValueError(f'unknown memory category {category!r}')
    hit = pii.match_pattern(str(value))
    if hit:
        _audit(conn, 'memory.pii_rejected', None,
               {'agent': agent, 'category': category, 'pattern': hit})
        conn.commit()
        raise ValueError(f'value matches PII pattern {hit!r} — memory writes are PII-gated (§3.3)')

    row = conn.execute('SELECT * FROM agent_memory WHERE workspace_id=? AND user_id=? '
                       'AND agent=? AND category=? AND mem_key=?',
                       (workspace, user, agent, category, key)).fetchone()
    if row:
        weight = min(MAX_WEIGHT, row['weight'] + REINFORCE_STEP)
        conn.execute("UPDATE agent_memory SET value=?, weight=?, last_used=datetime('now') "
                     'WHERE id=?', (str(value), weight, row['id']))
        mid = row['id']
    else:
        cur = conn.execute(
            'INSERT INTO agent_memory (workspace_id, user_id, agent, category, mem_key, value, weight) '
            'VALUES (?,?,?,?,?,?,1.0)', (workspace, user, agent, category, key, str(value)))
        mid = cur.lastrowid
    _audit(conn, 'memory.remembered', mid, {'agent': agent, 'category': category, 'key': key})
    conn.commit()
    return dict(conn.execute('SELECT * FROM agent_memory WHERE id=?', (mid,)).fetchone())


def recall(conn, agent: str, *, category: str | None = None, user: str = 'default',
           workspace: str = 'default') -> list[dict]:
    """Entries whose decayed weight clears the recall threshold, best first.
    effective = weight * 0.5 ** (days_unused / half_life)."""
    q = ("SELECT *, (julianday('now') - julianday(last_used)) AS days_unused "
         'FROM agent_memory WHERE workspace_id=? AND user_id=? AND agent=?')
    args = [workspace, user, agent]
    if category:
        q += ' AND category=?'; args.append(category)
    rows = [dict(r) for r in conn.execute(q, args).fetchall()]
    for r in rows:
        r['effective_weight'] = r['weight'] * (0.5 ** ((r['days_unused'] or 0) / HALF_LIFE_DAYS))
    live = [r for r in rows if r['effective_weight'] >= RECALL_MIN_WEIGHT]
    return sorted(live, key=lambda r: -r['effective_weight'])


def forget(conn, mem_id: int) -> bool:
    row = conn.execute('SELECT * FROM agent_memory WHERE id=?', (mem_id,)).fetchone()
    if not row:
        return False
    conn.execute('DELETE FROM agent_memory WHERE id=?', (mem_id,))
    _audit(conn, 'memory.forgotten', mem_id, {'agent': row['agent'], 'category': row['category']})
    conn.commit()
    return True
