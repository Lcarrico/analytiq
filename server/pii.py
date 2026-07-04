"""
PII detection service — deterministic regex patterns + token-classifier
heuristic (column-name signal × value hit-rate).

Sprint 2 / F-008. Evidence values are stored hashed (sha256, truncated);
raw values never leave this module.
"""
from __future__ import annotations

import hashlib
import re

BLOCK_CONFIDENCE = 0.6  # >= this → column blocked for ML use
_MAX_EVIDENCE = 5

# Order matters: more specific patterns first.
PATTERNS = [
    ('email',       re.compile(r'^[\w.+-]+@[\w-]+\.[\w.-]+$')),
    ('ssn',         re.compile(r'^\d{3}-\d{2}-\d{4}$')),
    ('credit_card', re.compile(r'^(?:\d[ -]?){13,19}$')),
    ('phone',       re.compile(r'^\+?1?[-. (]*\d{3}[-. )]*\d{3}[-. ]*\d{4}$')),
    ('ip',          re.compile(r'^(?:\d{1,3}\.){3}\d{1,3}$')),
    ('name',        re.compile(r'^[A-Z][a-z]+ [A-Z][a-z]+$')),
]

# column-name token → pattern type (the "token classifier")
NAME_TOKENS = {
    'email': 'email', 'e_mail': 'email', 'mail': 'email',
    'ssn': 'ssn', 'social_security': 'ssn', 'social': 'ssn',
    'phone': 'phone', 'mobile': 'phone', 'tel': 'phone', 'telephone': 'phone', 'fax': 'phone',
    'credit_card': 'credit_card', 'card_number': 'credit_card', 'cc_num': 'credit_card', 'pan': 'credit_card',
    'ip': 'ip', 'ip_address': 'ip',
    'first_name': 'name', 'last_name': 'name', 'full_name': 'name', 'surname': 'name',
}


def _luhn_ok(digits: str) -> bool:
    ds = [int(c) for c in re.sub(r'\D', '', digits)]
    if len(ds) < 13:
        return False
    total, parity = 0, len(ds) % 2
    for i, d in enumerate(ds):
        if i % 2 == parity:
            d *= 2
            if d > 9:
                d -= 9
        total += d
    return total % 10 == 0


def match_pattern(value) -> str | None:
    """Return the PII pattern type a single value matches, else None."""
    if not isinstance(value, str) or not value.strip():
        return None
    v = value.strip()
    for ptype, rx in PATTERNS:
        if rx.match(v):
            if ptype == 'credit_card' and not _luhn_ok(v):
                continue
            if ptype == 'phone' and re.fullmatch(r'\d{4}-\d{2}-\d{2}', v):
                continue  # dates are not phone numbers
            return ptype
    return None


def classify_name(column_name: str) -> str | None:
    """Token classifier over the column name; returns a pattern type or None."""
    name = (column_name or '').lower()
    tokens = re.split(r'[^a-z0-9]+', name)
    # exact/bigram token hits (avoid 'email_opt_in' style false positives by
    # requiring the token to be terminal or the whole name)
    joined = '_'.join(t for t in tokens if t)
    for key, ptype in sorted(NAME_TOKENS.items(), key=lambda kv: -len(kv[0])):
        if joined == key or joined.endswith('_' + key) or key + '_' == joined[:len(key) + 1] and key in ('email', 'ssn'):
            return ptype
        if key in tokens and key not in ('mail', 'social', 'tel', 'pan', 'ip'):
            # single-token hit for unambiguous tokens
            if key in ('email', 'ssn', 'phone', 'mobile', 'telephone', 'fax',
                       'credit_card', 'card_number', 'cc_num', 'ip_address',
                       'first_name', 'last_name', 'full_name', 'surname'):
                return ptype
    return None


def _hash_evidence(value: str) -> str:
    return hashlib.sha256(str(value).encode()).hexdigest()[:16]


def scan_column(column_name: str, values: list, max_evidence: int = _MAX_EVIDENCE):
    """Scan a column's sampled values. Returns a pii flag dict or None.

    confidence = value hit-rate, boosted when the column name agrees.
    A pure name-signal without matching values stays below BLOCK_CONFIDENCE.
    """
    non_null = [v for v in (values or []) if v is not None]
    hits: dict[str, list] = {}
    for v in non_null:
        ptype = match_pattern(v)
        if ptype:
            hits.setdefault(ptype, []).append(v)

    name_type = classify_name(column_name)

    if not hits:
        return None  # never flag on name alone — no observed evidence

    ptype, matched = max(hits.items(), key=lambda kv: len(kv[1]))
    hit_rate = len(matched) / max(1, len(non_null))
    # 'name' regex is weak; require name-signal agreement to count at all
    if ptype == 'name' and name_type != 'name' and hit_rate < 0.9:
        return None
    confidence = round(min(0.99, 0.75 * hit_rate + (0.25 if name_type == ptype else 0.0)), 2)
    return {
        'pattern_type': ptype,
        'confidence': confidence,
        'hit_rate': round(hit_rate, 3),
        'evidence': [_hash_evidence(v) for v in matched[:max_evidence]],
    }


def scan_columns(columns: list[dict]) -> dict[str, dict]:
    """columns: [{'name': ..., 'samples': [...]}] → {column_name: flag}"""
    out = {}
    for col in columns:
        flag = scan_column(col.get('name', ''), col.get('samples') or [])
        if flag:
            out[col['name']] = flag
    return out
