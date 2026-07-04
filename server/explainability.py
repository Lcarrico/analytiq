"""
Explainability (R5S1E3): permutation feature importance + SHAP-lite mean
contributions computed against the gold table, with PII exclusion.
"""
from __future__ import annotations

import random

import feature_engineering as fe

PII_NAME_TOKENS = ('email', 'phone', 'ssn', 'credit_card', 'ip_address',
                   'first_name', 'last_name', 'full_name')


def _surrogate_score(rows: list[dict], y: list[float], feature: str) -> float:
    """|pearson| of feature vs target — surrogate model relationship."""
    vals = [r.get(feature) for r in rows]
    if any(isinstance(v, str) for v in vals if v is not None):
        return 0.0
    return abs(fe.pearson(vals, y))


def permutation_importance(rows: list[dict], y: list[float],
                           features: list[str], seed: int = 42) -> dict[str, float]:
    """Importance = baseline relationship − relationship after permuting the
    feature (deterministic, seeded)."""
    rng = random.Random(seed)
    out = {}
    for f in features:
        base = _surrogate_score(rows, y, f)
        vals = [r.get(f) for r in rows]
        shuffled = vals[:]
        rng.shuffle(shuffled)
        permuted_rows = [{**r, f: v} for r, v in zip(rows, shuffled)]
        out[f] = round(max(0.0, base - _surrogate_score(permuted_rows, y, f)), 6)
    return out


def shap_lite(rows: list[dict], y: list[float], features: list[str]) -> dict[str, float]:
    """Mean signed contribution: corr-weighted deviation from the feature mean."""
    out = {}
    y_mean = sum(y) / len(y) if y else 0.0
    for f in features:
        vals = [r.get(f) for r in rows]
        if any(isinstance(v, str) for v in vals if v is not None):
            out[f] = 0.0
            continue
        clean = [(v, yy) for v, yy in zip(vals, y) if v is not None]
        if len(clean) < 3:
            out[f] = 0.0
            continue
        corr = fe.pearson([c[0] for c in clean], [c[1] for c in clean])
        f_mean = sum(c[0] for c in clean) / len(clean)
        mean_dev = sum(abs(c[0] - f_mean) for c in clean) / len(clean)
        scale = (abs(y_mean) or 1.0)
        out[f] = round(corr * mean_dev / scale, 6)
    return out


def explain_gold(conn, physical_table: str, target: str,
                 exclude=('day', 'location_id'), top_n: int = 10) -> list[dict]:
    """Full explanation pass over a gold table → ranked feature list."""
    rows = [dict(r) for r in conn.execute(
        f'SELECT * FROM "{physical_table}" ORDER BY location_id, day').fetchall()]
    if not rows:
        return []
    y = [r[target] for r in rows]
    features = [c for c in rows[0]
                if c != target and c not in exclude
                and not any(tok in c.lower() for tok in PII_NAME_TOKENS)]
    imps = permutation_importance(rows, y, features)
    shaps = shap_lite(rows, y, features)
    ranked = sorted(({'name': f, 'importance': imps[f], 'shap_mean': shaps[f]}
                     for f in features), key=lambda x: -x['importance'])
    return ranked[:top_n]


def concentration_gate(ranked: list[dict], threshold: float = 0.70) -> dict:
    """PRD: top-10 features must explain ≥ 70% of total importance."""
    total = sum(r['importance'] for r in ranked) or 0.0
    if total == 0:
        return {'status': 'FAIL', 'top10_share': 0.0, 'threshold': threshold}
    share = sum(r['importance'] for r in ranked[:10]) / total
    return {'status': 'PASS' if share >= threshold else 'FAIL',
            'top10_share': round(share, 4), 'threshold': threshold}
