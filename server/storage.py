"""
Object storage abstraction (R1S2E5).
Provider: Cloudflare R2 when R2_ACCOUNT_ID (+keys) set; otherwise local
fallback — files under ANALYTIQ_STORAGE_DIR (default <repo>/storage).
"""
from __future__ import annotations

import hashlib
import os
from pathlib import Path


def provider_mode() -> str:
    return 'r2' if os.environ.get('R2_ACCOUNT_ID') else 'local'


def _base() -> Path:
    p = Path(os.environ.get('ANALYTIQ_STORAGE_DIR')
             or Path(__file__).resolve().parent.parent / 'storage')
    p.mkdir(parents=True, exist_ok=True)
    return p


def _path(key: str) -> Path:
    key = key.lstrip('/').replace('..', '_')
    p = _base() / key
    p.parent.mkdir(parents=True, exist_ok=True)
    return p


def put(key: str, data: str | bytes) -> dict:
    raw = data.encode() if isinstance(data, str) else data
    _path(key).write_bytes(raw)
    return {'uri': f'local://{key.lstrip("/")}', 'size': len(raw),
            'sha256': hashlib.sha256(raw).hexdigest(), 'mode': provider_mode()}


def get(key: str) -> str | None:
    p = _path(key)
    if not p.exists():
        return None
    return p.read_text(encoding='utf-8')


def delete(key: str) -> None:
    p = _path(key)
    if p.exists():
        p.unlink()
