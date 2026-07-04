"""
Auth service (R1S1E1). Provider: Clerk / Supabase Auth when their env keys
are configured; otherwise a local fallback — SQLite users with PBKDF2-hashed
passwords and opaque bearer tokens stored hashed.
"""
from __future__ import annotations

import hashlib
import hmac
import os
import re
import secrets

TOKEN_TTL_HOURS = 24
ROLES = ('admin', 'analyst', 'viewer')
EMAIL_RE = re.compile(r'^[\w.+-]+@[\w-]+\.[\w.-]+$')
MIN_PASSWORD_LEN = 8
_PBKDF2_ITERS = 120_000


def provider_mode() -> str:
    if os.environ.get('CLERK_SECRET_KEY'):
        return 'clerk'
    if os.environ.get('SUPABASE_URL') and os.environ.get('SUPABASE_ANON_KEY'):
        return 'supabase'
    return 'local'


def hash_password(password: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), _PBKDF2_ITERS)
    return f'pbkdf2${_PBKDF2_ITERS}${salt}${dk.hex()}'


def verify_password(password: str, stored: str) -> bool:
    try:
        _, iters, salt, digest = stored.split('$')
        dk = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), int(iters))
        return hmac.compare_digest(dk.hex(), digest)
    except Exception:
        return False


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def mint_token(conn, user_id: int) -> str:
    raw = secrets.token_urlsafe(32)
    conn.execute(
        "INSERT INTO api_tokens (user_id, token_hash, expires_at) "
        "VALUES (?, ?, datetime('now', ?))",
        (user_id, hash_token(raw), f'+{TOKEN_TTL_HOURS} hours'))
    conn.commit()
    return raw


def resolve_token(conn, raw: str):
    """Return the user row for a live token, else None."""
    if not raw:
        return None
    row = conn.execute(
        "SELECT u.* FROM api_tokens t JOIN users u ON u.id = t.user_id "
        "WHERE t.token_hash=? AND t.expires_at > datetime('now')",
        (hash_token(raw),)).fetchone()
    return dict(row) if row else None


def validate_registration(email: str, password: str, role: str) -> str | None:
    if not email or not EMAIL_RE.match(email):
        return 'A valid email address is required'
    if not password or len(password) < MIN_PASSWORD_LEN:
        return f'Password must be at least {MIN_PASSWORD_LEN} characters'
    if role not in ROLES:
        return f'role must be one of {ROLES}'
    return None
