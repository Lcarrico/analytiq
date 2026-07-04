"""
Ingestion profiling — sample source tables, compute per-column statistics,
and classify semantic types with a confidence level.

Sprint 1 / F-005:
- samples up to SAMPLE_LIMIT rows per table (full table below the limit)
- per column: null_pct, distinct_count, min, max, p25/p50/p75, mean, stddev,
  top_5_values
- semantic_type ∈ dimension|measure|date|id|text|flag|geo|unknown via
  deterministic heuristics (name signal + value signal) → definition_confidence
"""
from __future__ import annotations

import math
import re
from collections import Counter

SAMPLE_LIMIT = 10_000

_DATE_RE = re.compile(
    r'^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$')
_ID_NAME_RE = re.compile(r'(^id$|_id$|^uuid$|_uuid$|^pk_|_key$)', re.I)
_DATE_NAME_RE = re.compile(r'(date|_at$|^ts$|timestamp|time$|day$|month$|year$)', re.I)
_FLAG_NAME_RE = re.compile(r'(^is_|^has_|_flag$|^flag_|enabled$|active$)', re.I)
_MEASURE_NAME_RE = re.compile(
    r'(amount|revenue|total|count|price|cost|sales|value|quantity|qty|rate|'
    r'score|spend|profit|margin|sum|avg|num_)', re.I)
_GEO_NAME_RE = re.compile(r'(lat$|^lat|lng$|lon$|longitude|latitude|geo|zipcode|postal)', re.I)
_TEXT_AVG_LEN = 40


def _percentile(sorted_vals, q):
    if not sorted_vals:
        return None
    idx = (len(sorted_vals) - 1) * q
    lo, hi = int(math.floor(idx)), int(math.ceil(idx))
    if lo == hi:
        return sorted_vals[lo]
    frac = idx - lo
    return sorted_vals[lo] * (1 - frac) + sorted_vals[hi] * frac


def _is_number(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def _classify(name, non_null, numeric_vals, distinct_count, total_non_null):
    """Return (semantic_type, confidence) from name + value signals."""
    all_numeric = total_non_null > 0 and len(numeric_vals) == total_non_null
    distinct_ratio = (distinct_count / total_non_null) if total_non_null else 0

    # value signals
    is_flag_vals = (all_numeric and set(numeric_vals) <= {0, 1}) or \
                   (total_non_null > 0 and {str(v).lower() for v in non_null} <= {'true', 'false', '0', '1', 'y', 'n'})
    str_vals = [v for v in non_null if isinstance(v, str)]
    is_date_vals = bool(str_vals) and len(str_vals) == total_non_null and \
        all(_DATE_RE.match(v) for v in str_vals[:200])
    avg_len = (sum(len(v) for v in str_vals) / len(str_vals)) if str_vals else 0
    is_id_vals = all_numeric and distinct_ratio >= 0.99 and distinct_count == total_non_null
    is_texty = bool(str_vals) and avg_len > _TEXT_AVG_LEN
    is_low_card_str = bool(str_vals) and not is_date_vals and distinct_ratio <= 0.5 and distinct_count <= 1000

    # name signals
    name_id, name_date = _ID_NAME_RE.search(name), _DATE_NAME_RE.search(name)
    name_flag, name_measure = _FLAG_NAME_RE.search(name), _MEASURE_NAME_RE.search(name)
    name_geo = _GEO_NAME_RE.search(name)

    # combine: both signals → high, one → medium, weak fallback → low
    if name_id and is_id_vals:
        return 'id', 'high'
    if name_flag and is_flag_vals:
        return 'flag', 'high'
    if name_date and is_date_vals:
        return 'date', 'high'
    if name_geo and (all_numeric or is_low_card_str):
        return 'geo', 'high'
    if name_measure and all_numeric and not is_flag_vals:
        return 'measure', 'high'

    if is_date_vals:
        return 'date', 'medium'
    if is_flag_vals and (name_flag or distinct_count <= 2):
        return 'flag', 'medium'
    if name_id and (distinct_ratio >= 0.9 or not total_non_null):
        return 'id', 'medium'
    if is_id_vals:
        return 'id', 'medium'
    if is_texty:
        return 'text', 'medium'
    if is_low_card_str:
        return 'dimension', 'medium'
    if all_numeric:
        return 'measure', 'medium'
    if str_vals:
        return 'dimension', 'low'
    return 'unknown', 'low'


def profile_values(name: str, values: list) -> dict:
    """Profile a single column given its (sampled) values."""
    total = len(values)
    non_null = [v for v in values if v is not None]
    nulls = total - len(non_null)
    numeric = sorted(v for v in non_null if _is_number(v))
    distinct = set()
    for v in non_null:
        try:
            distinct.add(v)
        except TypeError:
            distinct.add(str(v))
    distinct_count = len(distinct)

    mean = stddev = p25 = p50 = p75 = None
    if numeric:
        mean = sum(numeric) / len(numeric)
        if len(numeric) > 1:
            var = sum((v - mean) ** 2 for v in numeric) / (len(numeric) - 1)
            stddev = math.sqrt(var)
        else:
            stddev = 0.0
        p25, p50, p75 = (_percentile(numeric, q) for q in (0.25, 0.50, 0.75))

    if numeric and len(numeric) == len(non_null):
        vmin, vmax = numeric[0], numeric[-1]
    elif non_null:
        try:
            svals = sorted(non_null, key=lambda v: (str(type(v)), str(v)))
            vmin, vmax = svals[0], svals[-1]
        except Exception:
            vmin = vmax = None
    else:
        vmin = vmax = None

    top5 = [{'value': v, 'count': c} for v, c in Counter(
        v if isinstance(v, (str, int, float, bool)) else str(v) for v in non_null
    ).most_common(5)]

    semantic_type, confidence = _classify(name, non_null, numeric, distinct_count, len(non_null))
    return {
        'name': name,
        'null_pct': round(nulls * 100.0 / total, 2) if total else 0.0,
        'distinct_count': distinct_count,
        'min': vmin, 'max': vmax,
        'p25': p25, 'p50': p50, 'p75': p75,
        'mean': round(mean, 6) if mean is not None else None,
        'stddev': round(stddev, 6) if stddev is not None else None,
        'top_5_values': top5,
        'semantic_type': semantic_type,
        'definition_confidence': confidence,
    }


def profile_rows(table: str, columns: list[str], rows: list[tuple],
                 row_count: int | None = None) -> dict:
    """Profile pre-fetched rows (list of tuples aligned with `columns`)."""
    return {
        'table': table,
        'row_count': row_count if row_count is not None else len(rows),
        'sampled_rows': len(rows),
        'columns': [profile_values(col, [r[i] for r in rows]) for i, col in enumerate(columns)],
    }


def profile_table(conn, table: str, sample_limit: int = SAMPLE_LIMIT) -> dict:
    """Profile a table in a SQLite connection, sampling up to sample_limit rows."""
    if not re.match(r'^[A-Za-z_][A-Za-z0-9_]*$', table):
        raise ValueError(f'invalid table name: {table!r}')
    qt = '"' + table.replace('"', '""') + '"'
    row_count = conn.execute(f'SELECT COUNT(*) FROM {qt}').fetchone()[0]
    cur = conn.execute(f'SELECT * FROM {qt} LIMIT ?', (sample_limit,))
    columns = [d[0] for d in cur.description]
    rows = [tuple(r) for r in cur.fetchall()]
    return profile_rows(table, columns, rows, row_count=row_count)
