"""
Event-Driven Execution (R9S1E3-US1 / Architecture v2.1 §17.2.4).

A trigger layer above the DAG scheduler: pipeline work is initiated by
events, not only user turns or cron refreshes. Data/schema events target the
minimal downstream recompute set (content addressing does the minimizing —
unchanged nodes resolve from the store); drift events start retrain cycles;
business events open Opportunity Engine investigations (fleshed out in R12).

Every trigger firing is a first-class audit event.
"""
from __future__ import annotations

import json


def _audit(conn, action, rid, meta):
    conn.execute('INSERT INTO audit_logs (org_id, user_email, action, resource_type, resource_id, metadata) '
                 'VALUES (?,?,?,?,?,?)',
                 (None, None, action, 'platform_event', str(rid), json.dumps(meta)))


def emit(conn, event_type: str, payload: dict | None = None) -> dict:
    payload = payload or {}
    cur = conn.execute('INSERT INTO platform_events (event_type, payload_json, status) '
                       "VALUES (?,?, 'queued')", (event_type, json.dumps(payload)))
    ev_id = cur.lastrowid
    _audit(conn, 'event.emitted', ev_id, {'event_type': event_type})
    fired = []
    for handler in TRIGGERS.get(event_type, []):
        handler(conn, ev_id, payload)
        fired.append(handler.__name__)
        _audit(conn, 'event.trigger_fired', ev_id,
               {'event_type': event_type, 'handler': handler.__name__})
    conn.execute("UPDATE platform_events SET status='processed', processed_at=datetime('now') "
                 'WHERE id=?', (ev_id,))
    conn.commit()
    row = conn.execute('SELECT * FROM platform_events WHERE id=?', (ev_id,)).fetchone()
    return dict(row)


# ── Trigger handlers ───────────────────────────────────────────────────────

def _recompute_affected(conn, ev_id, payload):
    """schema_changed / manifest_updated / data_arrived: enqueue a targeted
    recompute per affected session (latest completed run). The DAG's content
    addressing guarantees only nodes reachable from the change recompute."""
    import jobs
    cid = payload.get('connection_id')
    if cid is None:
        return
    sessions = conn.execute(
        'SELECT DISTINCT s.id FROM sessions s JOIN pipeline_runs p ON p.session_id = s.id '
        "WHERE s.connection_id=? AND p.status='done'", (cid,)).fetchall()
    for s in sessions:
        jobs.enqueue(conn, 'event_recompute', {'session_id': s['id'], 'event_id': ev_id})


def _retrain_on_drift(conn, ev_id, payload):
    import jobs
    sid = payload.get('session_id')
    if sid is None:
        return
    jobs.enqueue(conn, 'event_retrain', {'session_id': sid, 'event_id': ev_id})


def _open_investigation(conn, ev_id, payload):
    conn.execute('INSERT INTO opportunity_investigations (event_id, payload_json, status) '
                 "VALUES (?,?, 'open')", (ev_id, json.dumps(payload)))


TRIGGERS = {
    'schema_changed':           [_recompute_affected],
    'manifest_updated':         [_recompute_affected],
    'data_arrived':             [],
    'drift_detected':           [_retrain_on_drift],
    'metric_threshold_breached': [_open_investigation],
    'business_event':           [],
}
