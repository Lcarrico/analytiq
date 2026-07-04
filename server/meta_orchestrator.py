"""
Meta-Orchestrator (R9S2E4-US1 / Architecture v2.1 §17.2.7).

Supervises cross-agent health above the orchestrator:
- arbitrates conflicting agent outputs with the same deterministic posture as
  the repair-loop rules (§10.3) — never an ad hoc judgment call;
- triages repeated repair/gate exhaustion into ONE platform-level alert
  instead of N independent user-facing failures;
- reprioritizes queued work under load (user-facing kinds first);
- and holds no authority to skip a human checkpoint (§18.3 invariant —
  refusal is enforced and audited here).
"""
from __future__ import annotations

import json

TRIAGE_WINDOW_MINUTES = 15
TRIAGE_THRESHOLD = 3
USER_FACING_KINDS = {'event_recompute', 'artifact_refresh'}
USER_FACING_PRIORITY = 10


def _audit(conn, action, rid, meta):
    conn.execute('INSERT INTO audit_logs (org_id, user_email, action, resource_type, resource_id, metadata) '
                 'VALUES (?,?,?,?,?,?)',
                 (None, None, action, 'meta', str(rid) if rid is not None else None,
                  json.dumps(meta)))


def record_decision(conn, kind: str, rule: str, winner: str, loser: str,
                    run_id: int | None = None, detail: dict | None = None) -> int:
    cur = conn.execute(
        'INSERT INTO meta_decisions (kind, rule, winner, loser, run_id, detail_json) '
        'VALUES (?,?,?,?,?,?)',
        (kind, rule, winner, loser, run_id, json.dumps(detail or {})))
    _audit(conn, 'meta.arbitrated' if kind != 'reprioritization' else 'meta.reprioritized',
           cur.lastrowid, {'kind': kind, 'rule': rule, 'winner': winner})
    conn.commit()
    return cur.lastrowid


def arbitrate_grain(conn, run_id: int, session: dict, modeler_grain_slug: str,
                    session_grain_slug: str) -> dict:
    """Deterministic rule: the session spec's grain is canonical — it is the
    semantic-layer vocabulary the user confirmed at the Stage-3 checkpoint.
    The modeler output is re-keyed downstream; nothing fails."""
    record_decision(conn, 'grain_conflict', 'session_spec_grain_canonical',
                    winner=session_grain_slug, loser=modeler_grain_slug,
                    run_id=run_id,
                    detail={'session_id': session.get('id'),
                            'session_grain': session.get('grain')})
    return {'winner': session_grain_slug}


def triage_failure(conn, run_id: int, reason: str) -> None:
    """Repeated exhaustion in a short window is a systemic signal: raise one
    platform alert (deduped per window), not another user-facing failure."""
    _audit(conn, 'meta.failure_triaged', run_id, {'reason': reason})
    n = conn.execute(
        "SELECT COUNT(*) c FROM audit_logs WHERE action IN "
        "('pipeline.gate_blocked', 'meta.failure_triaged') "
        "AND action='meta.failure_triaged' "
        "AND created_at >= datetime('now', ?)",
        (f'-{TRIAGE_WINDOW_MINUTES} minutes',)).fetchone()['c']
    if n < TRIAGE_THRESHOLD:
        conn.commit()
        return
    already = conn.execute(
        "SELECT 1 FROM alerts WHERE type='meta.systemic_failure' "
        "AND created_at >= datetime('now', ?)",
        (f'-{TRIAGE_WINDOW_MINUTES} minutes',)).fetchone()
    if already:
        conn.commit()
        return
    conn.execute('INSERT INTO alerts (type, subject, detail_json) VALUES (?,?,?)',
                 ('meta.systemic_failure',
                  'Systemic pipeline failure pattern detected',
                  json.dumps({'failure_count': n, 'window_minutes': TRIAGE_WINDOW_MINUTES,
                              'last_reason': reason})))
    conn.commit()


def reprioritize(conn) -> int:
    """User-facing queued work jumps ahead of background maintenance."""
    changed = 0
    for kind in USER_FACING_KINDS:
        cur = conn.execute(
            "UPDATE jobs SET priority=? WHERE kind=? AND status='queued' AND priority < ?",
            (USER_FACING_PRIORITY, kind, USER_FACING_PRIORITY))
        changed += cur.rowcount
    record_decision(conn, 'reprioritization', 'user_facing_first',
                    winner=','.join(sorted(USER_FACING_KINDS)) or '-', loser='background',
                    detail={'changed': changed})
    return changed


def refuse_override(conn, session_id, action: str) -> dict:
    """§18.3: the meta-orchestrator can reprioritize around a pending human
    checkpoint but can never skip one."""
    _audit(conn, 'meta.override_refused', session_id, {'action': action})
    conn.commit()
    return {'error': 'Human checkpoints cannot be skipped — the meta-orchestrator '
                     'may reprioritize work around a pending checkpoint but never '
                     'bypass it (Architecture §18.3).'}
