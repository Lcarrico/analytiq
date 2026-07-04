"""
Recommendation Feedback Loop (R12S1E2-US1 / Architecture v2.1 §17.4.3).

Tracks every recommendation the platform makes against whether the user
accepted, dismissed, or ignored it. Dismissal is a first-class signal, not
silently discarded: three dismissals of a category suppress future surfacing
for that user until the underlying signal strengthens by more than 20%
(§5.5's dismissed-insight rule, generalized). Acceptance rates per type are
exposed for the observability dashboard (§17.7.2).
"""
from __future__ import annotations

DECISIONS = ('accept', 'dismiss', 'ignore')
SUPPRESS_AFTER = 3
STRENGTHEN_FACTOR = 1.2


def record(conn, rec_type: str, rec_id, decision: str, *, category: str | None = None,
           user: str = 'default', signal: float | None = None) -> None:
    if decision not in DECISIONS:
        raise ValueError(f'decision must be one of {DECISIONS}')
    conn.execute('INSERT INTO recommendation_feedback (rec_type, rec_id, category, decision, '
                 'user_id, signal) VALUES (?,?,?,?,?,?)',
                 (rec_type, str(rec_id), category, decision, user, signal))
    conn.commit()


def is_suppressed(conn, rec_type: str, category: str, *, user: str = 'default',
                  signal: float | None = None) -> bool:
    """True when the user dismissed this category ≥3 times and the current
    signal has not strengthened >20% beyond the strongest dismissed one."""
    rows = conn.execute(
        "SELECT signal FROM recommendation_feedback WHERE rec_type=? AND category=? "
        "AND user_id=? AND decision='dismiss'", (rec_type, category, user)).fetchall()
    if len(rows) < SUPPRESS_AFTER:
        return False
    baselines = [r['signal'] for r in rows if r['signal'] is not None]
    if signal is not None and baselines:
        return signal <= max(baselines) * STRENGTHEN_FACTOR
    return True


def acceptance_rates(conn) -> list[dict]:
    out = {}
    field = {'accept': 'accepted', 'dismiss': 'dismissed', 'ignore': 'ignored'}
    for r in conn.execute('SELECT rec_type, decision, COUNT(*) c FROM recommendation_feedback '
                          'GROUP BY rec_type, decision').fetchall():
        t = out.setdefault(r['rec_type'], {'rec_type': r['rec_type'], 'accepted': 0,
                                           'dismissed': 0, 'ignored': 0})
        t[field[r['decision']]] += r['c']
    for t in out.values():
        total = t['accepted'] + t['dismissed'] + t['ignored']
        t['acceptance_rate'] = round(t['accepted'] / total, 3) if total else 0.0
    return list(out.values())
