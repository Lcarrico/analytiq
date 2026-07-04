"""
Job queue abstraction (R1S2E4).
Provider: Upstash Redis/QStash when UPSTASH_REDIS_REST_URL is set; otherwise
local fallback — durable SQLite `jobs` table + in-process worker.
"""
from __future__ import annotations

import json
import os
import threading
import time

_handlers: dict = {}
_worker_started = False


def provider_mode() -> str:
    return 'upstash' if os.environ.get('UPSTASH_REDIS_REST_URL') else 'local'


def register(kind: str, fn) -> None:
    _handlers[kind] = fn


def enqueue(conn, kind: str, payload: dict | None = None, max_retries: int = 1) -> int:
    cur = conn.execute(
        'INSERT INTO jobs (kind, payload_json, status, max_retries) '
        "VALUES (?,?, 'queued', ?)", (kind, json.dumps(payload or {}), max_retries))
    conn.commit()
    return cur.lastrowid


def _claim_next(conn, exclude=()):
    # R9S2E4: meta-orchestrator priority first, then FIFO
    q = "SELECT id FROM jobs WHERE status='queued' ORDER BY priority DESC, id LIMIT 50"
    row = next((r for r in conn.execute(q).fetchall() if r['id'] not in exclude), None)
    if not row:
        return None
    cur = conn.execute(
        "UPDATE jobs SET status='running', started_at=datetime('now') "
        "WHERE id=? AND status='queued'", (row['id'],))
    conn.commit()
    if cur.rowcount != 1:      # someone else claimed it
        return None
    return conn.execute('SELECT * FROM jobs WHERE id=?', (row['id'],)).fetchone()


def process_pending(conn) -> int:
    """Worker step: claim + run queued jobs until the queue is empty.
    Returns the number of jobs that reached a terminal/requeued state."""
    processed = 0
    attempted: set = set()   # one attempt per job per pass (retries wait for the next pass)
    while True:
        job = _claim_next(conn, exclude=attempted)
        if not job:
            return processed
        attempted.add(job['id'])
        processed += 1
        kind, jid = job['kind'], job['id']
        handler = _handlers.get(kind)
        try:
            if handler is None:
                raise RuntimeError(f'no handler registered for kind {kind!r}')
            handler(conn, json.loads(job['payload_json'] or '{}'))
            conn.execute("UPDATE jobs SET status='done', completed_at=datetime('now') "
                         'WHERE id=?', (jid,))
        except Exception as exc:
            if job['retries'] < job['max_retries']:
                conn.execute("UPDATE jobs SET status='queued', retries=retries+1, error=? "
                             'WHERE id=?', (str(exc), jid))
            else:
                conn.execute("UPDATE jobs SET status='failed', error=?, "
                             "completed_at=datetime('now') WHERE id=?", (str(exc), jid))
        conn.commit()


def ensure_worker(conn_factory, interval: float = 2.0) -> None:
    """Start the background worker loop once (used by the live server)."""
    global _worker_started
    if _worker_started:
        return
    _worker_started = True

    def _loop():
        while True:
            time.sleep(interval)
            conn = conn_factory()
            try:
                process_pending(conn)
            except Exception:
                pass
            finally:
                try:
                    conn.close()
                except Exception:
                    pass

    threading.Thread(target=_loop, daemon=True).start()
