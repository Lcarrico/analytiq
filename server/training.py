"""
Training orchestrator core (Sprint 7).

A deterministic, dependency-free forecaster stands in for XGBoost in the
demo stack (same orchestration contract: trials → walk-forward backtest →
model card + gates). All metrics are genuinely computed from the gold data.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone

MAPE_THRESHOLD = 15.0
OVERFIT_FACTOR = 1.2
WALK_FORWARD_WINDOWS = 5
ALGORITHM_NAME = 'seasonal-trend-gbm-lite'


class SeasonalTrendModel:
    """Weekday-seasonality × linear-trend regressor (deterministic)."""

    def __init__(self, season='weekday', use_trend=True, smoothing=1):
        self.season = season
        self.use_trend = use_trend
        self.smoothing = max(1, int(smoothing))
        self._factors = [1.0] * 7
        self._base = 0.0
        self._slope = 0.0
        self._n = 0

    def fit(self, y: list[float]):
        n = len(y)
        self._n = n
        if n == 0:
            return self
        if self.smoothing > 1:
            y = [sum(y[max(0, i - self.smoothing + 1):i + 1]) /
                 len(y[max(0, i - self.smoothing + 1):i + 1]) for i in range(n)]
        mean = sum(y) / n
        self._base = mean
        if self.use_trend and n > 1:
            xs = range(n)
            x_mean = (n - 1) / 2
            denom = sum((x - x_mean) ** 2 for x in xs)
            self._slope = (sum((x - x_mean) * (v - mean) for x, v in zip(xs, y)) / denom
                           if denom else 0.0)
        if self.season == 'weekday':
            buckets = [[] for _ in range(7)]
            for i, v in enumerate(y):
                detrended = v - self._slope * (i - (n - 1) / 2)
                buckets[i % 7].append(detrended)
            self._factors = [
                (sum(b) / len(b) / mean) if b and mean else 1.0 for b in buckets]
        return self

    def predict(self, start_index: int, horizon: int) -> list[float]:
        out = []
        for k in range(horizon):
            i = start_index + k
            v = self._base + self._slope * (i - (self._n - 1) / 2)
            if self.season == 'weekday':
                v *= self._factors[i % 7]
            out.append(round(max(v, 1e-9), 4))
        return out


class RidgeLiteModel:
    """Closed-form ridge regression on [1, t, weekday dummies] (R5S1E1)."""

    def __init__(self, alpha=1.0, **_):
        self.alpha = alpha
        self._w = None
        self._n = 0

    @staticmethod
    def _features(i):
        row = [1.0, float(i)] + [0.0] * 6
        wd = i % 7
        if wd < 6:
            row[2 + wd] = 1.0
        return row

    def fit(self, y):
        n = len(y)
        self._n = n
        if n == 0:
            return self
        X = [self._features(i) for i in range(n)]
        k = len(X[0])
        # normal equations with ridge: (XtX + aI) w = Xty  (tiny k → direct solve)
        XtX = [[sum(X[r][i] * X[r][j] for r in range(n)) + (self.alpha if i == j else 0)
                for j in range(k)] for i in range(k)]
        Xty = [sum(X[r][i] * y[r] for r in range(n)) for i in range(k)]
        # gaussian elimination
        M = [row[:] + [Xty[i]] for i, row in enumerate(XtX)]
        for col in range(k):
            piv = max(range(col, k), key=lambda r: abs(M[r][col]))
            M[col], M[piv] = M[piv], M[col]
            if abs(M[col][col]) < 1e-12:
                continue
            for r in range(k):
                if r != col and M[r][col]:
                    f = M[r][col] / M[col][col]
                    M[r] = [a - f * b for a, b in zip(M[r], M[col])]
        self._w = [M[i][k] / M[i][i] if abs(M[i][i]) > 1e-12 else 0.0 for i in range(k)]
        return self

    def predict(self, start_index, horizon):
        out = []
        for kk in range(horizon):
            x = self._features(start_index + kk)
            v = sum(w * xi for w, xi in zip(self._w or [], x))
            out.append(round(max(v, 1e-9), 4))
        return out


class NaiveBaselineModel:
    """Repeat the last observed week (seasonal-naive baseline)."""

    def __init__(self, **_):
        self._last_week = [0.0] * 7
        self._n = 0

    def fit(self, y):
        self._n = len(y)
        if y:
            tail = y[-7:] if len(y) >= 7 else y
            self._last_week = [tail[i % len(tail)] for i in range(7)]
        return self

    def predict(self, start_index, horizon):
        return [round(max(self._last_week[(start_index + k) % 7], 1e-9), 4)
                for k in range(horizon)]


MODEL_FAMILIES = {
    'seasonal-trend': lambda params: SeasonalTrendModel(
        **{k: v for k, v in params.items() if k in ('season', 'use_trend', 'smoothing')}),
    'ridge-lite': lambda params: RidgeLiteModel(alpha=params.get('alpha', 1.0)),
    'baseline-naive': lambda params: NaiveBaselineModel(),
}


def make_model(params: dict):
    family = params.get('family', 'seasonal-trend')
    return MODEL_FAMILIES[family](params)


def rmse(actual, predicted):
    pairs = list(zip(actual, predicted))
    if not pairs:
        return float('inf')
    import math as _m
    return round(_m.sqrt(sum((a - p) ** 2 for a, p in pairs) / len(pairs)), 4)


def directional_accuracy(actual, predicted):
    """Share of steps where predicted movement matches actual movement."""
    if len(actual) < 2:
        return 0.0
    hits = sum(1 for i in range(1, len(actual))
               if (actual[i] - actual[i - 1]) * (predicted[i] - predicted[i - 1]) >= 0)
    return round(hits / (len(actual) - 1), 4)


STABILITY_FACTOR = 1.5


def stability_gate(backtest: dict) -> dict:
    """R5S1E2: worst walk-forward window must not exceed 1.5× the mean."""
    mapes = [f['mape'] for f in backtest.get('folds', []) if f.get('mape') is not None]
    if not mapes:
        return {'status': 'FAIL', 'worst': None, 'limit': None}
    mean = sum(mapes) / len(mapes)
    worst = max(mapes)
    limit = round(mean * STABILITY_FACTOR, 4)
    return {'status': 'PASS' if worst <= limit else 'FAIL',
            'worst': round(worst, 4), 'mean': round(mean, 4), 'limit': limit}


def mape(actual: list[float], predicted: list[float]) -> float:
    pairs = [(a, p) for a, p in zip(actual, predicted) if a]
    if not pairs:
        return float('inf')
    return round(sum(abs(a - p) / abs(a) for a, p in pairs) / len(pairs) * 100, 4)


def walk_forward_backtest(y: list[float], horizon: int, windows: int = WALK_FORWARD_WINDOWS,
                          params: dict | None = None) -> dict:
    """Expanding-window walk-forward validation with real MAPE per fold."""
    params = params or {}
    n = len(y)
    horizon = max(1, min(horizon, n // (windows + 1) or 1))
    folds = []
    min_train = max(n - windows * horizon, horizon)
    for w in range(windows):
        train_end = min_train + w * horizon
        test_end = min(train_end + horizon, n)
        if train_end >= n:
            break
        model = (make_model(params) if 'family' in params
                 else SeasonalTrendModel(**params)).fit(y[:train_end])
        preds = model.predict(train_end, test_end - train_end)
        actual = y[train_end:test_end]
        folds.append({
            'fold': w + 1,
            'train_size': train_end,
            'test_size': test_end - train_end,
            'mape': mape(actual, preds),
            'rmse': rmse(actual, preds),
            'directional_accuracy': directional_accuracy(actual, preds),
        })
    overall = round(sum(f['mape'] for f in folds) / len(folds), 4) if folds else float('inf')
    overall_rmse = round(sum(f['rmse'] for f in folds) / len(folds), 4) if folds else float('inf')
    overall_da = round(sum(f['directional_accuracy'] for f in folds) / len(folds), 4) if folds else 0.0
    return {'folds': folds, 'mape': overall, 'rmse': overall_rmse,
            'directional_accuracy': overall_da, 'windows': len(folds), 'horizon': horizon}


TRIAL_GRID = [
    {'season': 'weekday', 'use_trend': True, 'smoothing': 1},
    {'season': 'weekday', 'use_trend': False, 'smoothing': 1},
    {'season': 'none', 'use_trend': True, 'smoothing': 1},
    {'season': 'weekday', 'use_trend': True, 'smoothing': 3},
]


CANDIDATE_GRID = (
    [{'family': 'seasonal-trend', **p} for p in TRIAL_GRID] +
    [{'family': 'ridge-lite', 'alpha': a} for a in (0.5, 1.0, 5.0)] +
    [{'family': 'baseline-naive'}]
)

ENSEMBLE_CLOSE_PCT = 0.03
ENSEMBLE_WIN_PCT = 0.01


class EnsembleModel:
    def __init__(self, models):
        self.models = models

    def fit(self, y):
        for m in self.models:
            m.fit(y)
        return self

    def predict(self, start_index, horizon):
        parts = [m.predict(start_index, horizon) for m in self.models]
        return [round(sum(vals) / len(vals), 4) for vals in zip(*parts)]


SEARCH_SPACE = {
    'seasonal-trend': {'season': ['weekday', 'none'], 'use_trend': [True, False],
                       'smoothing': [1, 3, 5, 7]},
    'ridge-lite': {'alpha': [0.1, 0.5, 1.0, 2.0, 5.0, 10.0]},
}


def random_search(y: list[float], horizon: int, n_trials: int = 30,
                  seed: int = 42, patience: int = 10) -> tuple[dict, list[dict]]:
    """R5S1E2: seeded random hyperparameter search with simple pruning —
    stop after `patience` consecutive non-improving trials."""
    import random as _random
    rng = _random.Random(seed)
    trials, seen = [], set()
    best, since_improved = None, 0
    for _ in range(n_trials):
        family = rng.choice(list(SEARCH_SPACE))
        params = {'family': family}
        for k, vals in SEARCH_SPACE[family].items():
            params[k] = rng.choice(vals)
        key = json.dumps(params, sort_keys=True)
        if key in seen:
            continue
        seen.add(key)
        res = walk_forward_backtest(y, horizon=horizon, params=params)
        trial = {'params': params, 'mape': res['mape'], 'rmse': res['rmse'],
                 'directional_accuracy': res['directional_accuracy'],
                 'folds': res['folds']}
        trials.append(trial)
        if best is None or trial['mape'] < best['mape']:
            best, since_improved = trial, 0
        else:
            since_improved += 1
            if since_improved >= patience:
                break     # pruned
    return best, trials


def run_candidates(y: list[float], horizon: int) -> dict:
    """R5S1E1: evaluate every family; average-ensemble the top-2 when close."""
    per_family = {}
    for params in CANDIDATE_GRID:
        res = walk_forward_backtest(y, horizon=horizon, params=params)
        fam = params['family']
        if fam not in per_family or res['mape'] < per_family[fam]['mape']:
            per_family[fam] = {'family': fam, 'params': params,
                               'mape': res['mape'], 'folds': res['folds']}
    candidates = sorted(per_family.values(), key=lambda c: c['mape'])
    winner = dict(candidates[0])
    ensemble_evaluated = False
    if len(candidates) >= 2 and candidates[0]['mape'] > 0:
        gap = (candidates[1]['mape'] - candidates[0]['mape']) / candidates[0]['mape']
        if gap <= ENSEMBLE_CLOSE_PCT:
            ensemble_evaluated = True
            n = len(y)
            h = max(1, min(horizon, n // 6))
            ens = EnsembleModel([make_model(candidates[0]['params']),
                                 make_model(candidates[1]['params'])]).fit(y[:-h])
            e_mape = mape(y[-h:], ens.predict(n - h, h))
            if e_mape < candidates[0]['mape'] * (1 - ENSEMBLE_WIN_PCT):
                winner = {'family': 'ensemble', 'mape': round(e_mape, 4),
                          'params': {'family': 'ensemble',
                                     'members': [candidates[0]['params'],
                                                 candidates[1]['params']]},
                          'folds': candidates[0]['folds']}
    return {'candidates': candidates, 'winner': winner,
            'ensemble_evaluated': ensemble_evaluated}


def run_trials(y: list[float], horizon: int, grid=None) -> tuple[dict, list[dict]]:
    trials = []
    for params in (grid or TRIAL_GRID):
        res = walk_forward_backtest(y, horizon=horizon, params=params)
        trials.append({'params': params, 'mape': res['mape'], 'folds': res['folds']})
    best = min(trials, key=lambda t: t['mape'])
    return best, trials


def load_gold_series(conn, physical_table: str) -> tuple[list[str], list[float], str]:
    """Aggregate the gold target by day (deterministic ordering)."""
    cols = conn.execute(f'PRAGMA table_info("{physical_table}")').fetchall()
    target = next((c[1] for c in cols if str(c[1]).startswith('target_')), None)
    if not target:
        raise ValueError(f'no target_ column found on {physical_table}')
    rows = conn.execute(
        f'SELECT "day", SUM("{target}") FROM "{physical_table}" '
        f'GROUP BY "day" ORDER BY "day"').fetchall()
    days = [r[0] for r in rows]
    values = [float(r[1]) for r in rows]
    return days, values, target


def evaluate_gates(val_mape: float, test_mape: float) -> dict:
    mape_gate = 'PASS' if val_mape < MAPE_THRESHOLD else 'FAIL'
    overfit_gate = 'PASS' if test_mape <= val_mape * OVERFIT_FACTOR else 'FAIL'
    return {
        'mape_gate': {'status': mape_gate, 'value': val_mape, 'threshold': MAPE_THRESHOLD},
        'overfit_gate': {'status': overfit_gate, 'value': test_mape,
                         'limit': round(val_mape * OVERFIT_FACTOR, 4)},
    }


REPAIR_GRIDS = [
    [{'season': 'weekday', 'use_trend': True, 'smoothing': 5},
     {'season': 'weekday', 'use_trend': True, 'smoothing': 7}],
    [{'season': 'none', 'use_trend': True, 'smoothing': 3},
     {'season': 'none', 'use_trend': False, 'smoothing': 5}],
    [{'season': 'weekday', 'use_trend': False, 'smoothing': 3},
     {'season': 'none', 'use_trend': False, 'smoothing': 1}],
]


def train_session(conn, session_id: int, gold_row: dict, horizon: int = 14,
                  grid=None, spec: dict | None = None) -> dict:
    """Full training pass: trials → best model → holdout test → model card."""
    import time as _time
    _t0 = _time.time()
    days, y, target = load_gold_series(conn, gold_row['physical_table'])
    if len(y) < 30:
        raise ValueError(f'insufficient history: {len(y)} days')

    holdout = max(7, min(horizon, len(y) // 6))
    y_train, y_test = y[:-holdout], y[-holdout:]

    if grid is not None:
        best, trials = run_trials(y_train, horizon=horizon, grid=grid)
        algorithm = ALGORITHM_NAME
        final = SeasonalTrendModel(
            **{k: v for k, v in best['params'].items()
               if k in ('season', 'use_trend', 'smoothing')}).fit(y_train)
    else:
        cand = run_candidates(y_train, horizon=horizon)
        best = cand['winner']
        trials = [{'params': c['params'], 'mape': c['mape'], 'folds': c['folds']}
                  for c in cand['candidates']]
        algorithm = best['family']
        if best['family'] == 'ensemble':
            final = EnsembleModel([make_model(m) for m in
                                   best['params']['members']]).fit(y_train)
        else:
            final = make_model(best['params']).fit(y_train)
    test_preds = final.predict(len(y_train), holdout)
    test_mape = mape(y_test, test_preds)

    gates = evaluate_gates(best['mape'], test_mape)
    gates['stability_gate'] = stability_gate({'folds': best.get('folds', [])})
    card = {
        'algorithm': algorithm,
        'session_id': session_id,
        'gold_table_name': gold_row['table_name'],
        'gold_output_hash': gold_row.get('output_hash'),
        'feature_manifest_version': gold_row.get('manifest_version'),
        'hyperparams': best['params'],
        'metrics': {
            'val_mape': best['mape'],
            'test_mape': test_mape,
            'folds': best['folds'],
            'training_rows': gold_row.get('row_count'),
            'series_days': len(y),
            'holdout_days': holdout,
            'training_duration_seconds': round(_time.time() - _t0, 3),
        },
        'target_type': 'regression',
        'lineage': {
            'gold_table': gold_row.get('table_name'),
            'source_tables': sorted((spec or {}).get('explores_used') or []),
            'semantic_layer_version': (spec or {}).get('semantic_layer_version'),
            'governance_manifest_version': (spec or {}).get('governance_manifest_version'),
        },
        'gates': gates,
        'trained_at': datetime.now(timezone.utc).isoformat(),
        'trials': trials,
        'target_column': target,
    }
    return card
