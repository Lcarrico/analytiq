"""
HS256 embed tokens (R7S1E2) — hand-rolled JWT (no external dependency).
Single-purpose: one artifact_id + workspace_id; allowed_origins enforced
server-side; read_only scope can never be elevated to writes.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()


def _unb64(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + '=' * (-len(s) % 4))


def sign(payload: dict, secret: str, expires_in: int = 86400) -> str:
    header = {'alg': 'HS256', 'typ': 'JWT'}
    body = {**payload, 'exp': int(time.time()) + expires_in, 'iat': int(time.time())}
    signing_input = f'{_b64(json.dumps(header).encode())}.{_b64(json.dumps(body).encode())}'
    sig = hmac.new(secret.encode(), signing_input.encode(), hashlib.sha256).digest()
    return f'{signing_input}.{_b64(sig)}'


def verify(token: str, secret: str) -> dict | None:
    try:
        head, body, sig = token.split('.')
        expected = hmac.new(secret.encode(), f'{head}.{body}'.encode(),
                            hashlib.sha256).digest()
        if not hmac.compare_digest(_b64(expected), sig):
            return None
        payload = json.loads(_unb64(body))
        if payload.get('exp', 0) < time.time():
            return None
        return payload
    except Exception:
        return None


def workspace_secret(workspace_id: str) -> str:
    """Deterministic per-workspace signing secret derived from the app key."""
    import os
    root = os.environ.get('CREDENTIAL_ENCRYPTION_KEY', 'dev')
    return hashlib.sha256(f'{root}:{workspace_id}:embed'.encode()).hexdigest()
