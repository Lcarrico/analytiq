import { C, FONT, MONO } from '../tokens';

// ── Badge ─────────────────────────────────────────────────
const BADGE = {
  default: { bg: C.borderLight, color: '#374151' },
  primary: { bg: C.primaryLight, color: C.primary },
  success: { bg: C.successBg,   color: C.success },
  warning: { bg: C.warningBg,   color: C.warning },
  error:   { bg: C.errorBg,     color: C.error   },
  purple:  { bg: C.purpleBg,    color: C.purple   },
};

export function Badge({ children, variant = 'default', xs }) {
  const s = BADGE[variant] || BADGE.default;
  return (
    <span style={{
      display: 'inline-block', background: s.bg, color: s.color,
      borderRadius: 4, padding: xs ? '2px 6px' : '3px 8px',
      fontSize: xs ? 10 : 11, fontWeight: 600, fontFamily: MONO,
      letterSpacing: '0.03em', textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

// ── Button ────────────────────────────────────────────────
const BTN_VARIANTS = {
  primary:   { bg: C.primary,     color: '#fff', border: 'none' },
  secondary: { bg: C.borderLight, color: C.text, border: 'none' },
  ghost:     { bg: 'transparent', color: C.textSec, border: 'none' },
  outline:   { bg: 'transparent', color: C.primary, border: `1px solid ${C.primary}` },
  danger:    { bg: C.error,       color: '#fff', border: 'none' },
};
const BTN_SIZES = {
  sm: { padding: '6px 12px', fontSize: 13 },
  md: { padding: '9px 16px', fontSize: 14 },
  lg: { padding: '12px 22px', fontSize: 15 },
};

export function Btn({ children, variant = 'primary', size = 'md', onClick, disabled, icon, full, style: extraStyle }) {
  const v = BTN_VARIANTS[variant] || BTN_VARIANTS.primary;
  const sz = BTN_SIZES[size];
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        justifyContent: full ? 'center' : 'flex-start',
        width: full ? '100%' : 'auto',
        ...sz, borderRadius: 6, border: v.border || 'none',
        background: v.bg, color: v.color,
        fontFamily: FONT, fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1, transition: 'opacity 0.15s',
        ...extraStyle,
      }}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}

// ── Card ──────────────────────────────────────────────────
export function Card({ children, p = 20, style = {} }) {
  return (
    <div style={{
      background: C.surface, borderRadius: 8,
      border: `1px solid ${C.border}`, padding: p, ...style,
    }}>{children}</div>
  );
}

// ── Page header ───────────────────────────────────────────
export function PageHeader({ title, sub, badge, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text, fontFamily: FONT, letterSpacing: '-0.3px' }}>
            {title}
          </h1>
          {badge && <Badge variant={badge.v}>{badge.label}</Badge>}
        </div>
        {sub && <p style={{ margin: 0, fontSize: 13, color: C.textSec, fontFamily: FONT }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Step list ─────────────────────────────────────────────
export function Steps({ steps, current }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {steps.map((step, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={i} style={{
            display: 'flex', gap: 12, padding: '12px 0',
            borderBottom: i < steps.length - 1 ? `1px solid ${C.borderLight}` : 'none',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700,
              background: done ? C.success : active ? C.primary : C.borderLight,
              color: done || active ? '#fff' : C.textTer,
            }}>
              {done ? '✓' : i + 1}
            </div>
            <div style={{ flex: 1, paddingTop: 2 }}>
              <div style={{ fontSize: 14, fontWeight: active || done ? 600 : 400, color: active || done ? C.text : C.textTer, fontFamily: FONT }}>
                {step.title}
              </div>
              <div style={{ fontSize: 12, color: C.textSec, marginTop: 2, fontFamily: FONT }}>
                {active ? step.active : done ? step.done : step.pending}
              </div>
            </div>
            <div style={{ paddingTop: 2 }}>
              {active && <Badge variant="primary" xs>running</Badge>}
              {done   && <Badge variant="success" xs>done</Badge>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Inline sparkline ──────────────────────────────────────
export function Sparkline({ data, color = C.primary, w = 76, h = 28 }) {
  if (!data?.length) return null;
  const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / rng) * h}`).join(' ');
  return (
    <svg width={w} height={h}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Loading spinner ───────────────────────────────────────
export function Spinner({ size = 20, color = C.primary }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid ${color}33`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      display: 'inline-block',
    }} />
  );
}

// ── Gate badge ────────────────────────────────────────────
const GATE_MAP = {
  pass: ['success', '✓'],
  warn: ['warning', '!'],
  fail: ['error',   '✗'],
  flag: ['purple',  'PII'],
};
export function GateDot({ s }) {
  const [variant, label] = GATE_MAP[s] || ['default', s];
  return <Badge variant={variant} xs>{label}</Badge>;
}

// ── Health bar ────────────────────────────────────────────
export function HealthBar({ v }) {
  const color = v >= 90 ? C.success : v >= 70 ? C.warning : C.error;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <div style={{ width: 56, height: 5, background: C.borderLight, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${v}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: MONO }}>{v}</span>
    </div>
  );
}
