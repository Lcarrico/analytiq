"""
Secrets provider abstraction (R1S2E3).
Provider: Infisical when INFISICAL_TOKEN is set; otherwise local fallback —
Fernet-encrypted values in the SQLite `secrets` table.
"""
from __future__ import annotations

import os


def provider_mode() -> str:
    return 'infisical' if os.environ.get('INFISICAL_TOKEN') else 'local'


def _fernet():
    import app as app_module
    return app_module._fernet


def put(conn, name: str, value: str) -> None:
    enc = _fernet().encrypt(value.encode()).decode()
    conn.execute(
        'INSERT INTO secrets (name, value_encrypted, updated_at) '
        "VALUES (?, ?, datetime('now')) "
        'ON CONFLICT(name) DO UPDATE SET value_encrypted=excluded.value_encrypted, '
        "updated_at=datetime('now')", (name, enc))
    conn.commit()


def get(conn, name: str) -> str | None:
    row = conn.execute('SELECT value_encrypted FROM secrets WHERE name=?', (name,)).fetchone()
    if not row:
        return None
    return _fernet().decrypt(row['value_encrypted'].encode()).decode()


def delete(conn, name: str) -> None:
    conn.execute('DELETE FROM secrets WHERE name=?', (name,))
    conn.commit()
