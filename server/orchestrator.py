"""
Cost-Aware Orchestration (R9S1E1-US1 / Architecture v2.1 §17.2.2).

Every task resolves through a cost ladder before touching a large model:
exact cache hit → deterministic template logic → small model → frontier
model. Each dispatch records estimated cost/latency telemetry consumed by
the Real-Time Observability feed (§17.7.2).

Environment adaptation (see PROGRESS.md ledger): this stack has no LLM
endpoint, so "model" tiers execute the same deterministic engines used
everywhere else — the ladder's routing decisions, short-circuits, and
telemetry are real; the per-tier cost/latency figures are the simulated
model economics.
"""
from __future__ import annotations

import json
import time

import cache_hier

TIERS = ('cache', 'template', 'small_model', 'frontier_model')

# (est_cost USD, est_latency_ms) per tier — simulated model economics
TIER_ECONOMICS = {
    'cache':          (0.0,    2),
    'template':       (0.0005, 12),
    'small_model':    (0.002,  380),
    'frontier_model': (0.030,  2200),
}

# R20S1E1: simulated token counts per tier for metering/billing
TIER_TOKENS = {'cache': 0, 'template': 40, 'small_model': 900, 'frontier_model': 6500}

# Tasks that never need the frontier model (§17.2.2 tiered routing)
SMALL_MODEL_TASKS = {'intent_classification', 'chart_type_selection', 'routine_repair'}


def _sig(parts) -> str:
    return '|'.join(str(p) for p in parts)


def _record(conn, task_kind, tier, signature, workspace):
    cost, latency = TIER_ECONOMICS[tier]
    conn.execute(
        'INSERT INTO task_dispatches (task_kind, tier, est_cost, est_latency_ms, signature, workspace_id, tokens) '
        'VALUES (?,?,?,?,?,?,?)',
        (task_kind, tier, cost, latency, signature, workspace, TIER_TOKENS.get(tier, 0)))
    conn.commit()
    return cost, latency


def dispatch(conn, task_kind: str, signature_parts, compute, *,
             pattern=None, workspace: str = 'default') -> dict:
    """Resolve a task through the cost ladder. `compute` is only invoked when
    the cache can't serve the result. `pattern` (optional) is the
    generalized signature used for template matching."""
    signature = _sig(signature_parts)

    # 1 — exact cache hit
    cached = cache_hier.get(conn, 'semantic', workspace, ['dispatch', task_kind, signature])
    if cached is not None:
        cost, latency = _record(conn, task_kind, 'cache', signature, workspace)
        return {'tier': 'cache', 'result': cached, 'est_cost': cost, 'est_latency_ms': latency}

    # 2 — deterministic template logic for previously seen patterns
    pattern_key = _sig(pattern) if pattern else None
    tier = None
    if pattern_key:
        seen = conn.execute('SELECT 1 FROM task_templates WHERE task_kind=? AND pattern_key=?',
                            (task_kind, pattern_key)).fetchone()
        if seen:
            tier = 'template'

    # 3/4 — model tiers
    if tier is None:
        tier = 'small_model' if task_kind in SMALL_MODEL_TASKS else 'frontier_model'

    result = compute()
    cost, latency = _record(conn, task_kind, tier, signature, workspace)

    # future dispatches: exact repeats hit the cache; same pattern hits template
    cache_hier.put(conn, 'semantic', workspace, ['dispatch', task_kind, signature], result)
    if pattern_key and tier != 'template':
        conn.execute('INSERT OR IGNORE INTO task_templates (task_kind, pattern_key, template_json) '
                     'VALUES (?,?,?)', (task_kind, pattern_key, json.dumps(result, default=str)))
        conn.commit()
    return {'tier': tier, 'result': result, 'est_cost': cost, 'est_latency_ms': latency}


def aggregate(conn) -> dict:
    rows = conn.execute('SELECT tier, task_kind, est_cost FROM task_dispatches').fetchall()
    by_tier, by_task, total = {}, {}, 0.0
    for r in rows:
        by_tier[r['tier']] = by_tier.get(r['tier'], 0) + 1
        by_task[r['task_kind']] = by_task.get(r['task_kind'], 0) + 1
        total += r['est_cost']
    return {'count': len(rows), 'by_tier': by_tier, 'by_task': by_task,
            'est_cost_total': round(total, 5)}
