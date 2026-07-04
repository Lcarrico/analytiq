"""
Notifications (R18S1E1 / gap §18-9). In-app inbox with unread state,
mention fan-out, and alert fan-in — the people-layer substrate the bell
badge, drawer, and steward-ping loop consume.
"""
from __future__ import annotations

import re


def notify(conn, user_id: str, kind: str, message: str, link: str | None = None) -> int:
    cur = conn.execute('INSERT INTO notifications (user_id, kind, message, link) '
                       'VALUES (?,?,?,?)', (user_id or 'default', kind, message, link))
    conn.commit()
    return cur.lastrowid


def fan_out_alert(conn, alert_id: int, recipients=('admin@acme.com',)) -> int:
    row = conn.execute('SELECT * FROM alerts WHERE id=?', (alert_id,)).fetchone()
    if not row:
        return 0
    n = 0
    for r in recipients:
        notify(conn, r, 'alert', row['subject'] or row['type'], link='/app/alerts')
        n += 1
    return n


def fan_out_mentions(conn, body: str, link: str | None, author: str) -> list[str]:
    mentioned = re.findall(r'@([\w.+-]+@[\w-]+\.[\w.]+)', body or '')
    for email in mentioned:
        notify(conn, email, 'mention', f'{author} mentioned you: {body[:120]}', link)
    return mentioned
