"""
Stage-3 feature engineering (R4S2E1/E2): temporal features, holiday calendars,
encodings, imputation, and collinearity-based selection over gold tables.
"""
from __future__ import annotations

import math

LAGS = (1, 3, 7, 14, 28)
ROLLING = (7, 14, 28)
MAX_FEATURES = 200
COLLINEARITY_R = 0.95
ONE_HOT_MAX_CARDINALITY = 10

# US federal holidays (2023–2024) — deterministic built-in calendar
US_FEDERAL_HOLIDAYS = {
    '2023-01-01', '2023-01-02', '2023-01-16', '2023-02-20', '2023-05-29',
    '2023-06-19', '2023-07-04', '2023-09-04', '2023-10-09', '2023-11-10',
    '2023-11-23', '2023-12-25',
    '2024-01-01', '2024-01-15', '2024-02-19', '2024-05-27', '2024-06-19',
    '2024-07-04', '2024-09-02', '2024-10-14', '2024-11-11', '2024-11-28',
    '2024-12-25',
}


def is_holiday(day: str, extra: set | None = None) -> bool:
    return day in US_FEDERAL_HOLIDAYS or (extra is not None and day in extra)


def temporal_features(series: list[float]) -> dict[str, list]:
    """Per-group ordered target series → feature columns (None-padded)."""
    n = len(series)
    out: dict[str, list] = {}
    for lag in LAGS:
        out[f'lag_{lag}_target'] = [series[i - lag] if i >= lag else None for i in range(n)]
    for w in ROLLING:
        means, stds = [], []
        for i in range(n):
            window = series[max(0, i - w + 1):i + 1]
            if len(window) < 2:
                means.append(window[0] if window else None)
                stds.append(0.0 if window else None)
                continue
            mu = sum(window) / len(window)
            means.append(round(mu, 4))
            stds.append(round(math.sqrt(sum((v - mu) ** 2 for v in window) /
                                        (len(window) - 1)), 4))
        out[f'rolling_mean_{w}_target'] = means
        out[f'rolling_std_{w}_target'] = stds
    streak = []
    run = 0
    for i in range(n):
        if i > 0 and series[i] > series[i - 1]:
            run += 1
        else:
            run = 0
        streak.append(run)
    out['streak_up'] = streak
    return out


def pearson(a: list[float], b: list[float]) -> float:
    pairs = [(x, y) for x, y in zip(a, b) if x is not None and y is not None]
    if len(pairs) < 3:
        return 0.0
    xs, ys = zip(*pairs)
    mx, my = sum(xs) / len(xs), sum(ys) / len(ys)
    cov = sum((x - mx) * (y - my) for x, y in pairs)
    vx = math.sqrt(sum((x - mx) ** 2 for x in xs))
    vy = math.sqrt(sum((y - my) ** 2 for y in ys))
    if vx == 0 or vy == 0:
        return 0.0
    return cov / (vx * vy)


def collinear_drops(columns: dict[str, list], target: list[float]) -> tuple[list, dict]:
    """Drop the member of each highly-correlated pair with lower target-MI proxy
    (|corr with target| stands in for mutual information)."""
    names = list(columns)
    target_rel = {n: abs(pearson(columns[n], target)) for n in names}
    dropped, report = [], {}
    for i, a in enumerate(names):
        if a in dropped:
            continue
        for b in names[i + 1:]:
            if b in dropped:
                continue
            r = pearson(columns[a], columns[b])
            if abs(r) > COLLINEARITY_R:
                loser = a if target_rel[a] < target_rel[b] else b
                dropped.append(loser)
                report[loser] = {'correlated_with': b if loser == a else a,
                                 'r': round(r, 4)}
    return dropped, report


def one_hot(values: list, prefix: str) -> dict[str, list]:
    cats = sorted({v for v in values if v is not None})
    return {f'{prefix}_{str(c).lower()}': [1 if v == c else 0 for v in values]
            for c in cats}


def frequency_encode(values: list) -> list:
    from collections import Counter
    counts = Counter(v for v in values if v is not None)
    total = max(1, sum(counts.values()))
    return [round(counts.get(v, 0) / total, 6) if v is not None else None for v in values]


def impute_measure(values: list, window: int = 7) -> tuple[list, int]:
    """Rolling-median imputation for numeric series; returns (filled, n_imputed)."""
    filled, imputed = [], 0
    for i, v in enumerate(values):
        if v is not None:
            filled.append(v)
            continue
        recent = [x for x in values[max(0, i - window):i] if x is not None]
        if recent:
            srt = sorted(recent)
            filled.append(srt[len(srt) // 2])
        else:
            filled.append(0)
        imputed += 1
    return filled, imputed
