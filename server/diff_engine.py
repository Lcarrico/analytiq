"""
Artifact Diff Engine (R11S2E4-US1 / Architecture v2.1 §17.5.4).

Structural diff between any two versions of a dashboard plan, semantic
schema, governance manifest, or model card. Lists of dicts are matched by
their identity key ('name'/'id'/'panel') so a reordered list is not a wall of
false changes. Semantic diffs additionally summarize the metric lifecycle:
added, deprecated (removed), and redefined metrics — directly useful for
reviewing Automatic Semantic Evolution proposals (§17.3.4).
"""
from __future__ import annotations

import json

IDENTITY_KEYS = ('name', 'id', 'panel', 'node_key')


def _key_of(item):
    if isinstance(item, dict):
        for k in IDENTITY_KEYS:
            if item.get(k) is not None:
                return str(item[k])
    return None


def structural_diff(a, b, prefix: str = '') -> dict:
    out = {'added': [], 'removed': [], 'changed': []}

    def walk(x, y, path):
        if isinstance(x, dict) and isinstance(y, dict):
            for k in x:
                p = f'{path}.{k}' if path else str(k)
                if k not in y:
                    out['removed'].append(p)
                else:
                    walk(x[k], y[k], p)
            for k in y:
                if k not in x:
                    out['added'].append(f'{path}.{k}' if path else str(k))
        elif isinstance(x, list) and isinstance(y, list):
            xk = { _key_of(i): i for i in x if _key_of(i) is not None }
            yk = { _key_of(i): i for i in y if _key_of(i) is not None }
            if xk or yk:                       # keyed-list matching
                for k, item in xk.items():
                    p = f'{path}[{k}]'
                    if k not in yk:
                        out['removed'].append(p)
                    else:
                        walk(item, yk[k], p)
                for k in yk:
                    if k not in xk:
                        out['added'].append(f'{path}[{k}]')
            else:                              # plain lists by value
                for i, item in enumerate(y):
                    if item not in x:
                        out['added'].append(f'{path}[{item}]')
                for i, item in enumerate(x):
                    if item not in y:
                        out['removed'].append(f'{path}[{item}]')
        else:
            if x != y:
                out['changed'].append({'path': path, 'from': x, 'to': y})

    walk(a, b, prefix)
    return out


def _measures(schema: dict) -> dict:
    return {m.get('name'): m for c in schema.get('cubes') or []
            for m in c.get('measures') or [] if m.get('name')}


def semantic_summary(schema_a: dict, schema_b: dict) -> dict:
    ma, mb = _measures(schema_a), _measures(schema_b)
    added = sorted(set(mb) - set(ma))
    removed = sorted(set(ma) - set(mb))
    redefined = []
    for name in sorted(set(ma) & set(mb)):
        changes = structural_diff(ma[name], mb[name])
        if changes['changed'] or changes['added'] or changes['removed']:
            redefined.append({'name': name, 'changes': changes})
    return {'added_metrics': added, 'removed_metrics': removed,
            'redefined_metrics': redefined}
