"""
Multi-Agent Collaboration Model (R9S2E5-US1 / Architecture v2.1 §17.2.3).

Agents are permanent, addressable responders that can be consulted by other
agents mid-task — e.g. the visualization agent asks the semantic-layer agent
for a metric's display format instead of guessing, failing validation, and
burning a repair cycle.

Every consultation is recorded (`agent_consultations`), audited, and — when a
run context is supplied — broadcast on the streaming event protocol as a
first-class `agent_consultation` event. Collaboration is never a hidden side
channel.
"""
from __future__ import annotations

import json
import re


def _audit(conn, action, meta):
    conn.execute('INSERT INTO audit_logs (org_id, user_email, action, resource_type, resource_id, metadata) '
                 'VALUES (?,?,?,?,?,?)',
                 (None, None, action, 'agent_consultation', None, json.dumps(meta)))


def _slug(text: str) -> str:
    return re.sub(r'[^a-z0-9]+', '_', (text or '').lower()).strip('_')


# ── Responders (deterministic engines — no LLM in this stack) ──────────────

def _respond_semantic(conn, question: dict) -> dict:
    kind = question.get('kind')
    if kind == 'metric_format':
        metric = question.get('metric') or ''
        mslug = _slug(metric)
        row = conn.execute("SELECT schema_json FROM semantic_schemas WHERE workspace_id='default' "
                           'ORDER BY id DESC LIMIT 1').fetchone()
        if row:
            schema = json.loads(row['schema_json'])
            for cube in schema.get('cubes') or []:
                for m in cube.get('measures') or []:
                    if _slug(m.get('name') or '') == mslug and m.get('format'):
                        return {'format': m['format'], 'source': 'semantic_schema',
                                'cube': cube.get('name')}
        # canonical heuristic fallback (documented in §8.2 format rules)
        if re.search(r'revenue|price|cost|spend|sales|amount', mslug):
            fmt = 'currency'
        elif re.search(r'rate|pct|percent|ratio|share', mslug):
            fmt = 'percent'
        else:
            fmt = 'number'
        return {'format': fmt, 'source': 'heuristic'}
    return {'error': f'unsupported question kind {kind!r}'}


RESPONDERS = {
    'semantic_layer_agent': _respond_semantic,
}


def consult(conn, from_agent: str, to_agent: str, question: dict, *,
            run_id: int | None = None, broadcaster=None) -> dict:
    responder = RESPONDERS.get(to_agent)
    if responder is None:
        _audit(conn, 'agent.consult_failed',
               {'from': from_agent, 'to': to_agent, 'reason': 'unknown agent'})
        conn.commit()
        raise ValueError(f'unknown agent {to_agent!r}')
    answer = responder(conn, question)
    conn.execute('INSERT INTO agent_consultations (from_agent, to_agent, question_json, '
                 'answer_json, run_id) VALUES (?,?,?,?,?)',
                 (from_agent, to_agent, json.dumps(question), json.dumps(answer), run_id))
    _audit(conn, 'agent.consulted',
           {'from': from_agent, 'to': to_agent, 'kind': question.get('kind'), 'run_id': run_id})
    conn.commit()
    if broadcaster is not None:
        broadcaster({'event_type': 'agent_consultation', 'from_agent': from_agent,
                     'to_agent': to_agent, 'kind': question.get('kind'), 'run_id': run_id})
    return answer
