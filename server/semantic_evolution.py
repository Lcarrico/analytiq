"""
Automatic Semantic Evolution (R10S2E5-US1 / Architecture v2.1 §17.3.4).

The Semantic Layer Agent continuously proposes improvements to the semantic
model itself: new-metric candidates observed in repeated ad-hoc patterns,
deprecation candidates for unused metrics, rename suggestions, and merge
candidates when two definitions describe the same concept.

Every proposal is queued for admin review — this engine generates
suggestions, it does not mutate the canonical layer. One metric, one
definition (§1.1) is preserved absolutely.

Environment adaptation: merge confidence uses SQL token similarity; the
spec's result-correlation input needs live warehouse history and is recorded
as n/a in evidence (see PROGRESS.md ledger).
"""
from __future__ import annotations

import json
import re

NEW_METRIC_MIN_OCCURRENCES = 3
MERGE_SIMILARITY_THRESHOLD = 0.8
RENAME_SUFFIXES = ('_v2', '_v3', '_new', '_old', '_final', '_copy')


def _slug(text: str) -> str:
    return re.sub(r'[^a-z0-9]+', '_', (text or '').lower()).strip('_')


def _propose(conn, kind, subject, suggestion, evidence) -> bool:
    fp = f'{kind}:{subject}'
    if conn.execute('SELECT 1 FROM semantic_proposals WHERE fingerprint=?', (fp,)).fetchone():
        return False
    conn.execute('INSERT INTO semantic_proposals (kind, subject, suggestion, evidence_json, '
                 "status, fingerprint) VALUES (?,?,?,?, 'proposed', ?)",
                 (kind, subject, suggestion, json.dumps(evidence), fp))
    return True


def _sql_similarity(a: str, b: str) -> float:
    ta = set(re.findall(r'[a-z0-9_]+', (a or '').lower()))
    tb = set(re.findall(r'[a-z0-9_]+', (b or '').lower()))
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / len(ta | tb)


def propose(conn) -> int:
    row = conn.execute("SELECT schema_json FROM semantic_schemas WHERE workspace_id='default' "
                       'ORDER BY id DESC LIMIT 1').fetchone()
    # No schema yet is not a no-op: repeated ad-hoc analysis of undefined
    # metrics is precisely the new-metric signal (§17.3.4).
    schema = json.loads(row['schema_json']) if row else {'cubes': []}
    measures = [(m.get('name'), m.get('sql'), c.get('name'))
                for c in schema.get('cubes') or [] for m in c.get('measures') or []]
    measure_names = {m[0] for m in measures}
    created = 0

    # 1 — new-metric candidates from repeated ad-hoc spec targets
    counts: dict[str, int] = {}
    for r in conn.execute('SELECT spec_json FROM session_specs').fetchall():
        target = _slug(json.loads(r['spec_json']).get('target_metric') or '')
        if target and target not in measure_names:
            counts[target] = counts.get(target, 0) + 1
    for target, n in counts.items():
        if n >= NEW_METRIC_MIN_OCCURRENCES:
            created += _propose(conn, 'new_metric', target,
                                f"'{target}' has been analyzed ad hoc {n} times but has no "
                                f'canonical definition — define it in the semantic layer.',
                                {'occurrences': n})

    # 2 — deprecation candidates: measures with zero recorded references
    referenced = set()
    for r in conn.execute('SELECT spec_json FROM session_specs').fetchall():
        spec = json.loads(r['spec_json'])
        referenced.add(_slug(spec.get('target_metric') or ''))
        for f in spec.get('feature_candidates') or []:
            referenced.add(_slug(f))
    for r in conn.execute("SELECT dst_node FROM kg_edges WHERE dst_node LIKE 'metric:%'").fetchall():
        referenced.add(r['dst_node'].split(':', 1)[1])
    for name, _sql, cube in measures:
        if name and _slug(name) not in referenced:
            created += _propose(conn, 'deprecation', name,
                                f"'{name}' ({cube}) has no recorded references in any session, "
                                f'spec, or knowledge-graph edge — candidate for deprecation.',
                                {'references': 0})

    # 3 — rename suggestions: suffix-shadowed names
    for name, _sql, cube in measures:
        if name and any(name.endswith(s) for s in RENAME_SUFFIXES):
            base = re.sub('|'.join(re.escape(s) + '$' for s in RENAME_SUFFIXES), '', name)
            created += _propose(conn, 'rename', name,
                                f"'{name}' looks like a working-suffix variant — rename or "
                                f"consolidate with '{base}'.",
                                {'suggested_base': base})

    # 3b — repeated-edit signals from the self-improvement loop (§17.4.2):
    # many manual edits of one definition are a rename/refine proposal
    for sig in conn.execute("SELECT * FROM platform_signals WHERE "
                            "signal_kind='repeated_edit' AND consumer='semantic_evolution'"
                            ).fetchall():
        detail = json.loads(sig['detail_json'])
        created += _propose(conn, 'rename', sig['subject'],
                            f"'{sig['subject']}' was manually edited {detail.get('edits')} "
                            f'times in review — refine or rename its canonical definition.',
                            {'source_signal': sig['fingerprint'], 'edits': detail.get('edits')})

    # 4 — merge candidates: SQL similarity ≥ threshold
    for i in range(len(measures)):
        for j in range(i + 1, len(measures)):
            (na, sa, _ca), (nb, sb, _cb) = measures[i], measures[j]
            if not na or not nb:
                continue
            sim = 1.0 if (sa or '') == (sb or '') and sa else _sql_similarity(sa, sb)
            if sim >= MERGE_SIMILARITY_THRESHOLD:
                created += _propose(
                    conn, 'merge', f'{na}+{nb}',
                    f"'{na}' and '{nb}' appear to define the same concept "
                    f'(SQL similarity {round(sim, 2)}) — merge into one canonical metric.',
                    {'sql_similarity': round(sim, 2),
                     'confidence': 'high' if sim == 1.0 else 'medium',
                     'result_correlation': 'n/a in demo stack (no live history)'})
    conn.commit()
    return created
