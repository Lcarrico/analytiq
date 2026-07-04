"""
Temporal split configuration service (Sprint 5 / F-022).

Deterministic time-based 70/15/15 split over the session date range plus
walk-forward (5 expanding windows) configuration and DQ checks.
"""
from __future__ import annotations

from datetime import date, timedelta

MIN_ROWS = 500
WALK_FORWARD_WINDOWS = 5


def _d(s: str) -> date:
    return date.fromisoformat(s)


def compute_split_config(date_range: dict, row_count: int, horizon: int | None = None) -> dict:
    start, end = _d(date_range['start']), _d(date_range['end'])
    total_days = max((end - start).days + 1, 1)
    train_days = int(round(total_days * 0.70))
    val_days = int(round(total_days * 0.15))

    train_end = start + timedelta(days=train_days - 1)
    val_start = train_end + timedelta(days=1)
    val_end = val_start + timedelta(days=val_days - 1)
    test_start = val_end + timedelta(days=1)

    return {
        'method': 'time_ordered',
        'train':      {'start': start.isoformat(), 'end': train_end.isoformat(), 'pct': 70},
        'validation': {'start': val_start.isoformat(), 'end': val_end.isoformat(), 'pct': 15},
        'test':       {'start': test_start.isoformat(), 'end': end.isoformat(), 'pct': 15},
        'walk_forward': {'windows': WALK_FORWARD_WINDOWS, 'expanding': True},
        'row_count': row_count,
        'horizon': horizon,
    }


def validate_split(cfg: dict, row_count: int, horizon: int | None = None) -> dict:
    """PASS | WARN | BLOCK with actionable remediation."""
    findings, remediation = [], []
    status = 'PASS'

    def worsen(new):
        nonlocal status
        order = {'PASS': 0, 'WARN': 1, 'BLOCK': 2}
        if order[new] > order[status]:
            status = new

    if row_count < MIN_ROWS:
        worsen('BLOCK')
        findings.append(f'row_count {row_count} below minimum {MIN_ROWS}')
        remediation.append(f'Provide at least {MIN_ROWS} rows at this grain '
                           f'(widen the date range or coarsen the grain).')

    test_days = (_d(cfg['test']['end']) - _d(cfg['test']['start'])).days + 1
    if horizon:
        if test_days < horizon:
            worsen('BLOCK')
            findings.append(f'test window {test_days}d shorter than horizon {horizon}d')
            remediation.append('Extend the date range so the test window covers the forecast horizon.')
        elif test_days < horizon * 2:
            worsen('WARN')
            findings.append(f'test window {test_days}d covers less than 2× horizon {horizon}d')
            remediation.append('Consider a longer history for more reliable backtests.')

    total_days = (_d(cfg['test']['end']) - _d(cfg['train']['start'])).days + 1
    if total_days < cfg['walk_forward']['windows'] * 14:
        worsen('WARN')
        findings.append(f'{total_days}d of history is thin for '
                        f"{cfg['walk_forward']['windows']} walk-forward windows")
        remediation.append('Reduce walk-forward windows or widen the training range.')

    return {'status': status, 'findings': findings, 'remediation': remediation}
