// R31S1E1-US1 (program R30–R36) — standalone auth (`Auth.dc.html`): every
// screen is a centered 420px card on the #f2f4f8 stage with a blue radial
// glow and the logo pinned top-center — never inside the app shell. Login
// carries labeled fields, a forgot-password link, three SSO buttons (visual
// states over demo auth — callbacks land in R31S1E2) and the magic-link box
// (demo confirmation; outbox stub optional). Register is the frame's 4-step
// wizard (Account → Workspace → Role → Kickoff) driving the REAL
// register→login APIs. The old in-shell forms' "PBKDF2…" / "Agent memory"
// copy is gone everywhere (vocab ledger pruned in r30s3_vocab).
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Btn } from '../components/ui';
import { Logo } from '../components/icons';
import { FONT, MONO, P } from '../tokens';
import { api, auth } from '../api';

const field = { height: 38, borderRadius: 8, border: `1px solid ${P.borderStrong}`,
                padding: '0 12px', fontSize: 13.5, fontFamily: FONT, color: P.ink,
                outline: 'none', width: '100%' };
const label = { fontSize: 12, fontWeight: 600, color: P.body, fontFamily: FONT };

export function AuthStage({ children, glow = 'rgba(37,99,235,.08)' }) {
  return (
    <div data-testid="auth-stage"
         style={{ minHeight: '100vh', background: P.authStage, position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '90px 16px 40px' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: `radial-gradient(420px 260px at 50% 0%, ${glow}, transparent 70%)` }} />
      <div style={{ position: 'absolute', top: 26, left: '50%', transform: 'translateX(-50%)' }}>
        <Logo size={22} />
      </div>
      {children}
    </div>
  );
}

export function AuthCard({ children, width = 420, testid = 'auth-card' }) {
  return (
    <div data-testid={testid}
         style={{ position: 'relative', width, maxWidth: '94vw', background: '#fff',
                  border: `1px solid ${P.border}`, borderRadius: 14, boxSizing: 'border-box',
                  boxShadow: '0 12px 40px rgba(15,23,42,.08)', padding: 32,
                  display: 'flex', flexDirection: 'column', gap: 16 }}>
      {children}
    </div>
  );
}

const SSO = ['Continue with Google', 'Continue with Microsoft', 'Enterprise SSO'];

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const submit = async () => {
    setBusy(true); setErr('');
    try {
      const r = await api.login({ email, password });
      auth.save(r.token, r.user);
      navigate('/app');
    } catch {
      setErr('Those credentials didn’t match — try again.');
    } finally { setBusy(false); }
  };

  return (
    <AuthStage>
      <AuthCard>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: P.ink, fontFamily: FONT }}>
            Log in
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: P.muted, fontFamily: FONT }}>
            Welcome back to your workspace.
          </p>
        </div>
        {err && <div style={{ fontSize: 12.5, fontFamily: FONT, color: P.red }}>{err}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={label}>Email</label>
          <input data-testid="login-email" value={email} onChange={e => setEmail(e.target.value)}
                 style={field} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <label style={label}>Password</label>
            <Link data-testid="forgot-link" to="/forgot-password"
                  style={{ fontSize: 12, color: P.accentHover, fontFamily: FONT }}>
              Forgot password?
            </Link>
          </div>
          <input data-testid="login-password" type="password" value={password}
                 onChange={e => setPassword(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && submit()} style={field} />
        </div>
        <button data-testid="login-submit" onClick={submit} disabled={busy}
                style={{ height: 40, borderRadius: 9, border: 'none', background: P.accent,
                         color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: FONT,
                         cursor: 'pointer' }}>
          {busy ? 'Signing in…' : 'Log in'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ flex: 1, height: 1, background: P.borderRow }} />
          <span style={{ fontFamily: MONO, fontSize: 10, color: P.faint }}>OR</span>
          <span style={{ flex: 1, height: 1, background: P.borderRow }} />
        </div>
        {SSO.map(s => (
          <button key={s} onClick={() => navigate('/sso/callback')}
                  style={{ height: 38, borderRadius: 9, border: `1px solid ${P.borderStrong}`,
                           background: '#fff', color: P.body, fontSize: 13, fontWeight: 500,
                           fontFamily: FONT, cursor: 'pointer' }}>
            {s}
          </button>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: 10, border: `1px dashed ${P.borderStrong}`, borderRadius: 9,
                      background: P.tableHeadBg }}>
          {magicSent ? (
            <span data-testid="magic-link-sent"
                  style={{ fontSize: 12.5, color: P.green, fontFamily: FONT }}>
              A sign-in link is on its way{email ? ` to ${email}` : ''} (demo outbox).
            </span>
          ) : (
            <>
              <span style={{ fontSize: 12.5, color: P.muted, fontFamily: FONT }}>
                Prefer a magic link?
              </span>
              <span data-testid="magic-link-send" onClick={() => setMagicSent(true)}
                    style={{ fontSize: 12.5, fontWeight: 600, color: P.accentHover,
                             cursor: 'pointer', fontFamily: FONT }}>
                Email me a link
              </span>
            </>
          )}
        </div>
      </AuthCard>
      <div style={{ position: 'absolute', bottom: 22, display: 'flex', gap: 16,
                    fontSize: 12.5, fontFamily: FONT, color: P.muted }}>
        <Link to="/register" style={{ color: P.accentHover, fontWeight: 600 }}>Create account</Link>
        <Link to="/security">Privacy &amp; security</Link>
      </div>
    </AuthStage>
  );
}

const ROLES = [
  ['business', 'Business User', 'I ask questions and consume dashboards'],
  ['analyst', 'Analyst', 'I build and refine analyses for others'],
  ['admin', 'Data Admin', 'I manage sources, governance and access'],
  ['executive', 'Executive', 'I want answers and alerts, not tooling'],
];
const PATHS = [
  ['sample', 'Start with sample data', 'Retail dataset preloaded — build in 60 seconds'],
  ['warehouse', 'Connect a warehouse', 'Snowflake, BigQuery, Databricks, Redshift…'],
  ['upload', 'Upload a file', 'CSV, XLSX or Parquet — profiled on upload'],
];
const STEPS = ['Account', 'Workspace', 'Role', 'Kickoff'];
const strength = (pw) => Math.min(4, [pw.length >= 8, pw.length >= 12,
  /[A-Z]/.test(pw) && /[a-z]/.test(pw), /\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)]
  .filter(Boolean).length);

export function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', password: '', workspace: '' });
  const [role, setRole] = useState('analyst');
  const [invites, setInvites] = useState([]);
  const [inviteDraft, setInviteDraft] = useState('');
  const [path, setPath] = useState('sample');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const create = async () => {
    setBusy(true); setErr('');
    try {
      // demo maps the persona cards onto the platform's real roles
      const apiRole = role === 'analyst' ? 'analyst' : role === 'admin' ? 'admin' : 'viewer';
      await api.register({ email: form.email, password: form.password, role: apiRole });
      const r = await api.login({ email: form.email, password: form.password });
      auth.save(r.token, r.user);
      navigate('/onboarding/workspace');   // R31S1E3 — register → onboarding flow
    } catch (e) {
      let m = e.message; try { m = JSON.parse(e.message)?.error || m; } catch { /* raw */ }
      setErr(m); setBusy(false);
    }
  };

  const canContinue = step === 0
    ? form.name && form.email && form.password.length >= 8
    : step === 1 ? form.workspace : true;

  return (
    <AuthStage>
      <AuthCard>
        <div data-testid="register-stepper"
             style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {STEPS.map((s, i) => (
            <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: i < 3 ? 1 : 0 }}>
              <span data-testid={`step-dot-${i}`}
                    style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                             display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                             fontFamily: MONO, fontSize: 11, fontWeight: 600,
                             background: i < step ? P.greenBg : i === step ? P.accent : '#fff',
                             border: i > step ? `1px solid ${P.borderStrong}` : 'none',
                             color: i < step ? P.green : i === step ? '#fff' : P.faint }}>
                {i < step ? (
                  <svg width="9" height="9" viewBox="0 0 9 9">
                    <path d="m1.5 4.5 2 2 4-4.5" fill="none" stroke={P.green}
                          strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ) : i + 1}
              </span>
              {i === step && (
                <span style={{ fontSize: 12, fontWeight: 600, color: P.ink, fontFamily: FONT }}>{s}</span>
              )}
              {i < 3 && <span style={{ flex: 1, height: 2, background: i < step ? P.greenBg : P.borderRow }} />}
            </span>
          ))}
        </div>

        {err && <div style={{ fontSize: 12.5, fontFamily: FONT, color: P.red }}>{err}</div>}

        {step === 0 && (
          <>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: P.ink, fontFamily: FONT }}>
                Create your account
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: P.muted, fontFamily: FONT }}>
                Free 14-day trial. No credit card required.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={label}>Full name</label>
              <input data-testid="reg-name" value={form.name} onChange={set('name')} style={field} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={label}>Work email</label>
              <input data-testid="reg-email" value={form.email} onChange={set('email')} style={field} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={label}>Password (12+ characters)</label>
              <input data-testid="reg-password" type="password" value={form.password}
                     onChange={set('password')} style={field} />
              <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                {[0, 1, 2, 3].map(i => (
                  <span key={i} data-testid="strength-seg" data-on={String(i < strength(form.password))}
                        style={{ flex: 1, height: 3, borderRadius: 2,
                                 background: i < strength(form.password) ? P.green : P.border }} />
                ))}
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: P.ink, fontFamily: FONT }}>
              Name your workspace
            </h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={label}>Workspace name</label>
              <input data-testid="reg-workspace" value={form.workspace} onChange={set('workspace')}
                     placeholder="Acme Retail" style={field} />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: P.ink, fontFamily: FONT }}>
                What best describes you?
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: P.muted, fontFamily: FONT }}>
                We&rsquo;ll tune defaults and permissions to fit.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {ROLES.map(([key, title, sub]) => {
                const sel = role === key;
                return (
                  <div key={key} data-testid={`role-${key}`} onClick={() => setRole(key)}
                       style={{ position: 'relative', borderRadius: 11, padding: sel ? 15 : 16,
                                cursor: 'pointer',
                                border: sel ? `2px solid ${P.accent}` : `1px solid ${P.border}`,
                                background: sel ? P.selectedRow : '#fff' }}>
                    {sel && (
                      <span style={{ position: 'absolute', top: 10, right: 10, width: 18, height: 18,
                                     borderRadius: '50%', background: P.accent, display: 'inline-flex',
                                     alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="9" height="9" viewBox="0 0 9 9">
                          <path d="m1.5 4.5 2 2 4-4.5" fill="none" stroke="#fff"
                                strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </span>
                    )}
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: P.ink, fontFamily: FONT }}>
                      {title}
                    </div>
                    <div style={{ fontSize: 11.5, lineHeight: 1.45, color: P.muted,
                                  fontFamily: FONT, marginTop: 4 }}>{sub}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: P.ink, fontFamily: FONT }}>
              Kick off your workspace
            </h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={label}>Invite teammates (optional)</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
                            border: `1px solid ${P.borderStrong}`, borderRadius: 8, padding: 8 }}>
                {invites.map(i => (
                  <span key={i} data-testid="invite-chip"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                                 background: P.accentSoft, color: P.accentHover, fontFamily: MONO,
                                 fontSize: 11, borderRadius: 999, padding: '3px 9px' }}>
                    {i}
                    <span onClick={() => setInvites(list => list.filter(x => x !== i))}
                          style={{ cursor: 'pointer', color: P.faint }}>×</span>
                  </span>
                ))}
                <input data-testid="invite-input" value={inviteDraft}
                       onChange={e => setInviteDraft(e.target.value)}
                       onKeyDown={e => {
                         if (e.key === 'Enter' && inviteDraft.trim()) {
                           setInvites(list => [...list, inviteDraft.trim()]);
                           setInviteDraft('');
                         }
                       }}
                       placeholder="Add email…"
                       style={{ border: 'none', outline: 'none', fontSize: 12.5,
                                fontFamily: FONT, flex: 1, minWidth: 120 }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={label}>Choose your first path</label>
              {PATHS.map(([key, title, sub]) => {
                const sel = path === key;
                return (
                  <div key={key} data-testid={`path-${key}`} onClick={() => setPath(key)}
                       style={{ display: 'flex', gap: 12, alignItems: 'center', borderRadius: 10,
                                padding: sel ? 11 : 12, cursor: 'pointer',
                                border: sel ? `2px solid ${P.accent}` : `1px solid ${P.border}`,
                                background: sel ? P.selectedRow : '#fff' }}>
                    <span style={{ width: 34, height: 34, borderRadius: 9, background: P.accentSoft,
                                   flexShrink: 0, display: 'inline-flex', alignItems: 'center',
                                   justifyContent: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 14 14">
                        <rect x="2" y="2" width="10" height="10" rx="2.5" fill="none"
                              stroke={P.accent} strokeWidth="1.4" />
                      </svg>
                    </span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: P.ink, fontFamily: FONT }}>
                        {title}
                      </div>
                      <div style={{ fontSize: 11.5, color: P.muted, fontFamily: FONT }}>{sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
          {step === 0 ? (
            <Link to="/login" style={{ fontSize: 12.5, color: P.muted, fontFamily: FONT }}>
              Back to log in
            </Link>
          ) : (
            <span onClick={() => setStep(s => s - 1)}
                  style={{ fontSize: 12.5, color: P.muted, fontFamily: FONT, cursor: 'pointer' }}>
              ← Back
            </span>
          )}
          {step < 3 ? (
            <Btn data-testid="reg-continue" disabled={!canContinue}
                 onClick={() => setStep(s => s + 1)} style={{ marginLeft: 'auto' }}>
              Continue →
            </Btn>
          ) : (
            <Btn data-testid="reg-create" disabled={busy || !form.email || !form.password}
                 onClick={create} style={{ marginLeft: 'auto' }}>
              {busy ? 'Creating…' : 'Create workspace →'}
            </Btn>
          )}
        </div>
      </AuthCard>
    </AuthStage>
  );
}

// ── R31S1E2-US1 — secondary states ──────────────────────────────────────────

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  return (
    <AuthStage>
      <AuthCard width={340}>
        {!sent ? (
          <>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: P.ink, fontFamily: FONT }}>
                Reset password
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 12.5, color: P.muted, fontFamily: FONT }}>
                We&rsquo;ll email you a reset link.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={label}>Email</label>
              <input data-testid="forgot-email" value={email}
                     onChange={e => setEmail(e.target.value)} style={field} />
            </div>
            <button data-testid="forgot-send" onClick={() => email.trim() && setSent(true)}
                    style={{ height: 38, borderRadius: 9, border: 'none', background: P.accent,
                             color: '#fff', fontSize: 13.5, fontWeight: 600, fontFamily: FONT,
                             cursor: 'pointer' }}>
              Send reset link
            </button>
            <Link to="/login" style={{ fontSize: 12.5, color: P.muted, fontFamily: FONT }}>
              ← Back to log in
            </Link>
          </>
        ) : (
          <>
            <span style={{ width: 46, height: 46, borderRadius: '50%', background: P.greenBg,
                           display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                           alignSelf: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="m4 9.5 3.5 3.5L14 5.5" fill="none" stroke={P.green}
                      strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: P.ink,
                         fontFamily: FONT, textAlign: 'center' }}>
              Check your email
            </h2>
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: P.muted,
                        fontFamily: FONT, textAlign: 'center' }}>
              If <span style={{ fontFamily: MONO }}>{email}</span> has an account, a reset
              link is on its way. It expires in 30 minutes.
            </p>
            <span data-testid="forgot-resend"
                  style={{ fontSize: 12.5, fontWeight: 600, color: P.accentHover,
                           fontFamily: FONT, textAlign: 'center', cursor: 'pointer' }}>
              Resend email
            </span>
          </>
        )}
      </AuthCard>
    </AuthStage>
  );
}

export function VerifyEmail() {
  return (
    <AuthStage>
      <AuthCard width={400}>
        <span data-testid="verify-tile"
              style={{ position: 'relative', width: 64, height: 64, borderRadius: 18,
                       background: P.accentSoft, display: 'inline-flex', alignItems: 'center',
                       justifyContent: 'center', alignSelf: 'center' }}>
          <svg width="26" height="22" viewBox="0 0 26 22">
            <rect x="1.5" y="1.5" width="23" height="19" rx="3" fill="none"
                  stroke={P.accent} strokeWidth="1.6" />
            <path d="m2 3 11 9L24 3" fill="none" stroke={P.accent} strokeWidth="1.6" />
          </svg>
          <span style={{ position: 'absolute', bottom: -4, right: -4, width: 20, height: 20,
                         borderRadius: '50%', background: P.greenBg, border: '2px solid #fff',
                         display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="9" height="9" viewBox="0 0 9 9">
              <path d="m1.5 4.5 2 2 4-4.5" fill="none" stroke={P.green}
                    strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
        </span>
        <h1 style={{ margin: 0, fontSize: 19, fontWeight: 600, color: P.ink,
                     fontFamily: FONT, textAlign: 'center' }}>
          Verify your email
        </h1>
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: P.muted,
                    fontFamily: FONT, textAlign: 'center' }}>
          We sent a verification link to{' '}
          <span style={{ fontFamily: MONO }}>dana@acmeretail.com</span>
        </p>
        <p style={{ margin: 0, fontSize: 12.5, color: P.muted, fontFamily: FONT,
                    textAlign: 'center' }}>
          Didn&rsquo;t get it? Check spam, or{' '}
          <span data-testid="verify-resend"
                style={{ fontWeight: 600, color: P.accentHover, cursor: 'pointer' }}>
            Resend email
          </span>
        </p>
      </AuthCard>
    </AuthStage>
  );
}

export function SsoCallback() {
  const navigate = useNavigate();
  const error = new URLSearchParams(window.location.search).get('error');
  useState(() => {
    // demo: the happy path signs straight in after a beat
    if (!error) setTimeout(() => navigate('/app'), 1400);
    return null;
  });
  if (error) {
    return (
      <AuthStage glow="rgba(220,38,38,.05)">
        <AuthCard width={360}>
          <span style={{ width: 56, height: 56, borderRadius: 16, background: P.redBg,
                         display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                         alignSelf: 'center' }}>
            <svg width="20" height="18" viewBox="0 0 20 18">
              <path d="M10 1.5 19 16.5H1L10 1.5Z" fill="none" stroke={P.red}
                    strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M10 7v4M10 13.6v.4" stroke={P.red} strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: P.ink,
                       fontFamily: FONT, textAlign: 'center' }}>
            No workspace access
          </h1>
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: P.muted,
                      fontFamily: FONT, textAlign: 'center' }}>
            Your identity was verified, but{' '}
            <span style={{ fontFamily: MONO }}>jon@acmeretail.com</span> hasn&rsquo;t been
            added to any AnalytIQ workspace yet.
          </p>
          <button data-testid="contact-admin"
                  style={{ height: 38, borderRadius: 9, border: 'none', background: P.accent,
                           color: '#fff', fontSize: 13.5, fontWeight: 600, fontFamily: FONT,
                           cursor: 'pointer' }}>
            Contact your admin
          </button>
          <span style={{ fontFamily: MONO, fontSize: 9.5, color: P.faint, textAlign: 'center' }}>
            Other states: organization not enabled · session expired
          </span>
        </AuthCard>
      </AuthStage>
    );
  }
  return (
    <AuthStage>
      <AuthCard width={360}>
        <span style={{ alignSelf: 'center', width: 44, height: 44, borderRadius: '50%',
                       border: `4px solid ${P.borderRow}`, borderTopColor: P.accent,
                       animation: 'spin 1s linear infinite' }} />
        <h1 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: P.ink,
                     fontFamily: FONT, textAlign: 'center' }}>
          Signing you in…
        </h1>
        <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint, textAlign: 'center' }}>
          okta · acme-retail.okta.com
        </span>
      </AuthCard>
    </AuthStage>
  );
}
