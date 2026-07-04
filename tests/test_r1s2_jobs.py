"""
R1S2E4-US1 — Job queue abstraction (Upstash/QStash → SQLite table + worker)
"""


def test_enqueue_claim_complete_lifecycle(app_mod, db):
    import jobs
    results = []
    jobs.register('echo', lambda conn, payload: results.append(payload['v']))

    jid = jobs.enqueue(db, 'echo', {'v': 42})
    row = db.execute('SELECT * FROM jobs WHERE id=?', (jid,)).fetchone()
    assert row['status'] == 'queued' and row['kind'] == 'echo'

    assert jobs.process_pending(db) == 1
    row = db.execute('SELECT * FROM jobs WHERE id=?', (jid,)).fetchone()
    assert row['status'] == 'done'
    assert row['started_at'] and row['completed_at']
    assert results == [42]

    # nothing left → no-op
    assert jobs.process_pending(db) == 0


def test_failed_handler_retries_then_fails(app_mod, db):
    import jobs
    calls = {'n': 0}

    def boom(conn, payload):
        calls['n'] += 1
        raise RuntimeError('kaboom')

    jobs.register('boom', boom)
    jid = jobs.enqueue(db, 'boom', {}, max_retries=1)

    jobs.process_pending(db)                       # attempt 1 → re-queued
    row = db.execute('SELECT * FROM jobs WHERE id=?', (jid,)).fetchone()
    assert row['status'] == 'queued' and row['retries'] == 1

    jobs.process_pending(db)                       # attempt 2 → failed
    row = db.execute('SELECT * FROM jobs WHERE id=?', (jid,)).fetchone()
    assert row['status'] == 'failed'
    assert 'kaboom' in row['error']
    assert calls['n'] == 2


def test_unknown_kind_fails_gracefully(app_mod, db):
    import jobs
    jid = jobs.enqueue(db, 'nope-kind', {}, max_retries=0)
    jobs.process_pending(db)
    row = db.execute('SELECT * FROM jobs WHERE id=?', (jid,)).fetchone()
    assert row['status'] == 'failed'
    assert 'handler' in row['error']


def test_platform_jobs_endpoint(client, app_mod, db):
    import jobs
    jobs.register('noop', lambda conn, payload: None)
    jobs.enqueue(db, 'noop', {'a': 1})
    jobs.enqueue(db, 'noop', {'a': 2})
    jobs.process_pending(db)

    rows = client.get('/api/platform/jobs?kind=noop').get_json()
    assert len(rows) == 2
    assert all(r['status'] == 'done' for r in rows)
    assert client.get('/api/platform/jobs?status=queued').get_json() == []
