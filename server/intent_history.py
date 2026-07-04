"""
User Intent History Graph (R10S1E3-US1 / Architecture v2.1 §17.3.5).

Records each user's investigation sequence — question asked, spec confirmed,
artifact built — so a new session is context-aware of what the user was
working toward. Warm-start output is strictly non-committal: likely intent
categories and recently investigated metrics, never a plan (§17.3.5 —
"without pre-committing to any specific dashboard plan").

Primary input to the Adaptive Planning Agent's novice/expert decision
(§17.2.6, R10S2E4).
"""
from __future__ import annotations

import json


def record(conn, user: str, step_kind: str, ref_id=None, session_id=None,
           detail: dict | None = None) -> None:
    assert step_kind in ('question', 'spec', 'artifact')
    conn.execute('INSERT INTO intent_history (user_id, step_kind, ref_id, session_id, detail_json) '
                 'VALUES (?,?,?,?,?)',
                 (user or 'default', step_kind, str(ref_id) if ref_id is not None else None,
                  session_id, json.dumps(detail or {})))
    conn.commit()


def warm_start(conn, user: str, limit: int = 25) -> dict:
    rows = [dict(r) for r in conn.execute(
        'SELECT * FROM intent_history WHERE user_id=? ORDER BY id DESC LIMIT ?',
        (user or 'default', limit)).fetchall()]
    if not rows:
        return {'has_history': False, 'likely_intents': [], 'recent_metrics': [],
                'investigations': 0}
    intents: dict[str, int] = {}
    metrics: list[str] = []
    for r in rows:
        d = json.loads(r['detail_json'] or '{}')
        if d.get('intent'):
            intents[d['intent']] = intents.get(d['intent'], 0) + 1
        m = d.get('metric') or d.get('target_metric')
        if m and m not in metrics:
            metrics.append(m)
    return {
        'has_history': True,
        'likely_intents': [{'intent': k, 'count': v}
                           for k, v in sorted(intents.items(), key=lambda kv: -kv[1])],
        'recent_metrics': metrics[:8],
        'investigations': len(rows),
    }
