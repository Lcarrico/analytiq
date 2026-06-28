"""
Authentication module for AnalytIQ.

Session-based auth using Flask sessions (signed cookies) and
werkzeug password hashing. No extra dependencies beyond Flask.

Designed for easy extension to SSO/OAuth — swap the login
verification in `login()` and add a provider callback route.
"""
import functools

from flask import Blueprint, g, jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

AUTH_SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT NOT NULL UNIQUE,
    name       TEXT NOT NULL,
    password   TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);
"""


def login_required(f):
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
        from app import one
        user = one('SELECT id, email, name, created_at FROM users WHERE id=?', (user_id,))
        if not user:
            session.clear()
            return jsonify({'error': 'Authentication required'}), 401
        g.user = user
        return f(*args, **kwargs)
    return wrapper


@auth_bp.post('/register')
def register():
    from app import execute, one
    b = request.get_json() or {}
    email = (b.get('email') or '').strip().lower()
    name = (b.get('name') or '').strip()
    password = b.get('password') or ''

    if not email or not name or not password:
        return jsonify({'error': 'Email, name, and password are required'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    existing = one('SELECT id FROM users WHERE email=?', (email,))
    if existing:
        return jsonify({'error': 'An account with this email already exists'}), 409

    user_id = execute(
        'INSERT INTO users (email, name, password) VALUES (?, ?, ?)',
        (email, name, generate_password_hash(password)),
    )
    session['user_id'] = user_id
    user = one('SELECT id, email, name, created_at FROM users WHERE id=?', (user_id,))
    return jsonify(user), 201


@auth_bp.post('/login')
def login():
    from app import one
    b = request.get_json() or {}
    email = (b.get('email') or '').strip().lower()
    password = b.get('password') or ''

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = one('SELECT * FROM users WHERE email=?', (email,))
    if not user or not check_password_hash(user['password'], password):
        return jsonify({'error': 'Invalid email or password'}), 401

    session['user_id'] = user['id']
    return jsonify({'id': user['id'], 'email': user['email'], 'name': user['name'], 'created_at': user['created_at']})


@auth_bp.post('/logout')
def logout():
    session.clear()
    return jsonify({'ok': True})


@auth_bp.get('/me')
def me():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify(None)
    from app import one
    user = one('SELECT id, email, name, created_at FROM users WHERE id=?', (user_id,))
    if not user:
        session.clear()
        return jsonify(None)
    return jsonify(user)
