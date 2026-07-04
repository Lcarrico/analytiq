"""
Intelligent Caching Hierarchy (R8S1E2-US1 / Architecture v2.1 §17.7.3).

Four independent layers — semantic resolutions, query results, viz specs,
rendered artifacts — cached separately so a change to one layer invalidates
the minimum necessary set everywhere else.

Invalidation model: cache keys incorporate the governance-manifest and
semantic-layer version numbers current at write time (where the cached value
depends on them). Readers always supply their *current* context versions, so
a version bump makes stale entries unreachable for exactly the dependents of
the changed definition — other workspaces and version-independent layers
keep hitting. Explicit `invalidate()` covers freshness-driven eviction.

Provider: Redis when REDIS_URL is set (detection only, per platform-service
precedent); otherwise local fallback — SQLite `cache_entries` + counters in
`cache_stats`, both in the per-request/per-test database.

This is the caching substrate the DAG execution model (§17.2.1, R8S2E3)
depends on for its near-zero-latency cache-hit path.
"""
from __future__ import annotations

import json
import os
import time

LAYERS = ('semantic', 'query', 'spec', 'artifact')
DEFAULT_TTL = {'semantic': 3600.0, 'query': 300.0, 'spec': 3600.0, 'artifact': 3600.0}


def provider_mode() -> str:
    return 'redis' if os.environ.get('REDIS_URL') else 'local'


def _full_key(workspace: str, parts, gov_version: str | None, sem_version: str | None) -> str:
    key = f"{workspace}|" + '|'.join(str(p) for p in parts)
    if gov_version is not None or sem_version is not None:
        key += f"|g:{gov_version or '0.0.0'}|s:{sem_version or '0.0.0'}"
    return key


def _bump(conn, layer: str, field: str) -> None:
    conn.execute(
        f"INSERT INTO cache_stats (layer, hits, misses) VALUES (?, 0, 0) "
        f"ON CONFLICT(layer) DO NOTHING", (layer,))
    conn.execute(f"UPDATE cache_stats SET {field} = {field} + 1 WHERE layer = ?", (layer,))
    conn.commit()


def get(conn, layer: str, workspace: str, parts, *, gov_version: str | None = None,
        sem_version: str | None = None):
    assert layer in LAYERS, f'unknown cache layer {layer!r}'
    key = _full_key(workspace, parts, gov_version, sem_version)
    row = conn.execute('SELECT value_json, expires_at FROM cache_entries '
                       'WHERE layer=? AND cache_key=?', (layer, key)).fetchone()
    if not row or row['expires_at'] < time.time():
        if row:                                     # expired → evict
            conn.execute('DELETE FROM cache_entries WHERE layer=? AND cache_key=?', (layer, key))
            conn.commit()
        _bump(conn, layer, 'misses')
        return None
    _bump(conn, layer, 'hits')
    return json.loads(row['value_json'])


def put(conn, layer: str, workspace: str, parts, value, *, gov_version: str | None = None,
        sem_version: str | None = None, ttl: float | None = None) -> str:
    assert layer in LAYERS, f'unknown cache layer {layer!r}'
    key = _full_key(workspace, parts, gov_version, sem_version)
    expires = time.time() + (ttl if ttl is not None else DEFAULT_TTL[layer])
    conn.execute(
        'INSERT INTO cache_entries (layer, cache_key, value_json, gov_version, sem_version, expires_at) '
        'VALUES (?,?,?,?,?,?) ON CONFLICT(layer, cache_key) DO UPDATE SET '
        'value_json=excluded.value_json, expires_at=excluded.expires_at',
        (layer, key, json.dumps(value, default=str), gov_version, sem_version, expires))
    conn.commit()
    return key


def invalidate(conn, layer: str | None = None, key_contains: str | None = None) -> int:
    q, args = 'DELETE FROM cache_entries WHERE 1=1', []
    if layer:
        q += ' AND layer=?'; args.append(layer)
    if key_contains:
        q += ' AND cache_key LIKE ?'; args.append(f'%{key_contains}%')
    cur = conn.execute(q, args)
    conn.commit()
    return cur.rowcount


def stats(conn) -> dict:
    out = {}
    counters = {r['layer']: r for r in conn.execute('SELECT * FROM cache_stats').fetchall()}
    now = time.time()
    for layer in LAYERS:
        c = counters.get(layer)
        hits = c['hits'] if c else 0
        misses = c['misses'] if c else 0
        entries = conn.execute('SELECT COUNT(*) c FROM cache_entries WHERE layer=? AND expires_at>=?',
                               (layer, now)).fetchone()['c']
        total = hits + misses
        out[layer] = {'entries': entries, 'hits': hits, 'misses': misses,
                      'hit_rate': round(hits / total, 3) if total else 0.0}
    return out
