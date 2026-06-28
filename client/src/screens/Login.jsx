import { useState } from 'react';
import { useAuth } from '../auth';
import { C, FONT, MONO } from '../tokens';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, name, password);
      }
    } catch (err) {
      const msg = err.message;
      try { setError(JSON.parse(msg).error); } catch { setError(msg); }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 6,
    border: `1px solid ${C.border}`, fontSize: 14, fontFamily: FONT,
    outline: 'none', transition: 'border-color 0.15s',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: C.bg, fontFamily: FONT,
    }}>
      <div style={{
        width: 380, background: C.surface, borderRadius: 12,
        border: `1px solid ${C.border}`, padding: '40px 32px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 36, height: 36, background: C.primary, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: '#fff', fontWeight: 700,
          }}>A</div>
          <span style={{ fontWeight: 700, fontSize: 22, letterSpacing: '-0.4px' }}>AnalytIQ</span>
        </div>
        <div style={{ fontSize: 10, color: C.textTer, fontFamily: MONO, marginBottom: 28 }}>
          v1.0.0-mvp
        </div>

        <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600 }}>
          {mode === 'login' ? 'Sign in to your account' : 'Create an account'}
        </h2>

        {error && (
          <div style={{
            padding: '10px 12px', borderRadius: 6, marginBottom: 16,
            background: C.errorBg, color: C.error, fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block', color: C.text }}>
                Email
              </label>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                style={inputStyle}
              />
            </div>

            {mode === 'register' && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block', color: C.text }}>
                  Name
                </label>
                <input
                  type="text" required value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  style={inputStyle}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: 'block', color: C.text }}>
                Password
              </label>
              <input
                type="password" required value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'}
                style={inputStyle}
              />
            </div>

            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '11px 0', borderRadius: 6, border: 'none',
                background: C.primary, color: '#fff', fontSize: 14, fontWeight: 600,
                fontFamily: FONT, cursor: loading ? 'wait' : 'pointer',
                opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s',
                marginTop: 4,
              }}
            >
              {loading ? '...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: C.textSec }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            style={{
              background: 'none', border: 'none', color: C.primary,
              fontWeight: 500, cursor: 'pointer', fontFamily: FONT, fontSize: 13,
              padding: 0,
            }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
