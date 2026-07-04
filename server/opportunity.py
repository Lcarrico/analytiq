"""
Opportunity Engine (R12S1E1-US1 / Architecture v2.1 §17.4.1).

Runs after every assembled dashboard passes validation and looks for what
the user did not think to ask:
- anomaly       — lifted from the existing insight engine (R7S2E3) — the
                  same detector, referenced by insight_id, never a second
                  implementation;
- causal_candidate — knowledge-graph co-analysis patterns, phrased strictly
                  as a suggested next question (correlation ≠ causation);
- forecast_gap  — related metrics with analysis history but no prediction
                  artifact; accepting routes to Stage 7 by creating a
                  pre-seeded session — the user still confirms the run.

Every opportunity is accept/dismiss. Nothing is ever auto-generated
(no-silent-output principle, §1.2). Decisions feed the Recommendation
Feedback Loop (§17.4.3, R12S1E2).
"""
from __future__ import annotations

import json


def _propose(conn, artifact_id, kind, headline, question, detail) -> bool:
    fp = f"{kind}:{artifact_id}:{detail.get('subject', '')}"
    if conn.execute('SELECT 1 FROM opportunities WHERE fingerprint=?', (fp,)).fetchone():
        return False
    conn.execute('INSERT INTO opportunities (artifact_id, kind, headline, question, '
                 "detail_json, status, fingerprint) VALUES (?,?,?,?,?, 'open', ?)",
                 (artifact_id, kind, headline, question, json.dumps(detail), fp))
    return True


def evaluate(conn, artifact_id: int, insights: list[dict] | None = None,
             user: str = 'default') -> int:
    """Evaluate one assembled artifact. `insights` are rows the existing
    insight engine just produced (anomalies are lifted, not recomputed).
    Categories the user repeatedly dismissed are suppressed until their
    signal strengthens >20% (§17.4.3)."""
    import feedback_loop as fb
    import knowledge_graph as kg
    art = conn.execute('SELECT * FROM artifacts WHERE id=?', (artifact_id,)).fetchone()
    if not art:
        return 0
    run = conn.execute('SELECT * FROM pipeline_runs WHERE id=?',
                       (art['pipeline_run_id'],)).fetchone() if art['pipeline_run_id'] else None
    sess = conn.execute('SELECT * FROM sessions WHERE id=?',
                        (run['session_id'],)).fetchone() if run else None
    if not sess:
        return 0
    metric_slug = kg.slug(sess['metric'])
    created = 0

    # 1 — anomalies: lift the strongest insight (same engine, by reference)
    for ins in (insights or []):
        if ins.get('kind') == 'anomaly':
            created += _propose(
                conn, artifact_id, 'anomaly',
                f"Anomaly detected: {ins['summary']}",
                ins.get('drill_question') or 'What happened on this date?',
                {'insight_id': ins['id'], 'subject': f"insight{ins['id']}"})
            break

    # 2 — causal candidates from co-analysis edges (questions, not claims)
    for rel in kg.related_metrics(conn, sess['metric'], limit=2):
        if fb.is_suppressed(conn, 'opportunity', 'causal_candidate',
                            user=user, signal=rel['weight']):
            continue
        created += _propose(
            conn, artifact_id, 'causal_candidate',
            f"'{rel['metric']}' moves with '{metric_slug}' — worth investigating "
            f'(correlation is not causation).',
            f"Does {rel['metric']} help explain recent changes in {sess['metric']}?",
            {'related_metric': rel['metric'], 'edge_weight': rel['weight'],
             'subject': rel['metric']})

    # 3 — forecast gaps: co-analyzed metrics with no prediction artifact
    for rel in kg.related_metrics(conn, sess['metric'], limit=5):
        if fb.is_suppressed(conn, 'opportunity', 'forecast_gap',
                            user=user, signal=rel['weight']):
            continue
        has_prediction = conn.execute(
            "SELECT 1 FROM sessions s JOIN pipeline_runs p ON p.session_id = s.id "
            "WHERE p.status='done' AND s.metric != '' AND "
            'LOWER(REPLACE(s.metric, \' \', \'_\')) = ? LIMIT 1',
            (rel['metric'],)).fetchone()
        if not has_prediction:
            created += _propose(
                conn, artifact_id, 'forecast_gap',
                f"'{rel['metric']}' is analyzed alongside {sess['metric']} but has "
                f'no forecast yet.',
                f"Should {rel['metric']} get its own forecast?",
                {'metric': rel['metric'], 'subject': f"gap:{rel['metric']}"})
    conn.commit()
    return created
