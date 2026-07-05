// R21S1E2 — primitive kit rebuilt to GAP_ANALYSIS_DESIGN_PARITY_CHECKLIST §0.2
// frame specs. Every export keeps its pre-R21 signature (legacy call sites
// compile unchanged and render the NEW visuals — R21S1E2-US3 compat).
// Frame refs are cited per primitive; UI_MOCKUP_ANALYSIS §2 carries dims.
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FONT, MONO, P, T } from '../tokens';

// ── Status tints (§0.2 status-badge row) ──────────────────
const TINTS = {
  green:  { bg: P.greenBg,  fg: P.green },
  amber:  { bg: P.amberBg,  fg: P.amber },
  red:    { bg: P.redBg,    fg: P.red },
  purple: { bg: P.purpleBg, fg: P.purple },
  blue:   { bg: P.accentSoft, fg: P.accentHover },
  cyan:   { bg: P.cyanBg,   fg: P.cyan },
  gray:   { bg: P.grayBg,   fg: P.gray },
};
// legacy variant names → tints (compat, R21S1E2-US3)
const LEGACY_TINT = {
  default: 'gray', primary: 'blue', success: 'green',
  warning: 'amber', error: 'red', purple: 'purple',
};

// ── Badge — pill h20 r999 mono 10/600 upper ls.04em, optional 5px dot
//    (Artifacts Library #artifact-detail header badges) ────
export function Badge({ children, variant = 'default', tint, dot, xs, style, ...rest }) {
  const t = TINTS[tint || LEGACY_TINT[variant] || 'gray'];
  return (
    <span {...rest} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, height: 20,
      padding: xs ? '0 8px' : '0 10px', borderRadius: 999,
      background: t.bg, color: t.fg, fontFamily: MONO, fontSize: 10,
      fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase',
      whiteSpace: 'nowrap', ...style,
    }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: 3, background: t.fg, flexShrink: 0 }} />}
      {children}
    </span>
  );
}

// ── Btn — h34 (sm28 · wiz36 · lg/hero40) r8 13/600
//    (Artifacts Library #artifact-detail action row) ───────
const BTN_V = {
  primary:     { bg: P.accent, color: '#fff', border: '1px solid transparent' },
  secondary:   { bg: '#fff', color: P.body, border: `1px solid ${P.borderStrong}` },
  ghost:       { bg: 'transparent', color: P.accentHover, border: '1px solid transparent' },
  destructive: { bg: '#fff', color: P.red, border: `1px solid ${P.borderStrong}` },
};
BTN_V.outline = BTN_V.secondary;   // legacy alias
BTN_V.danger  = BTN_V.destructive; // legacy alias
const BTN_H = { sm: 28, md: 34, wiz: 36, lg: 40 };

export function Btn({ children, variant = 'primary', size = 'md', onClick, disabled,
                      icon, full, style: extraStyle, ...rest }) {
  const v = BTN_V[variant] || BTN_V.primary;
  return (
    <button {...rest} onClick={disabled ? undefined : onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: 7, height: BTN_H[size] || 34, padding: size === 'sm' ? '0 10px' : '0 14px',
        width: full ? '100%' : 'auto', borderRadius: 8, border: v.border,
        background: v.bg, color: v.color, fontFamily: FONT,
        fontSize: size === 'sm' ? 12 : 13, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1, transition: 'opacity .15s', ...extraStyle,
      }}>
      {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
      {children}
    </button>
  );
}

// ── Card r10 border #e4e8ef p20 (App Home #home widget grid) ──
export function Card({ children, p = 20, style = {}, ...rest }) {
  return (
    <div style={{ background: P.surface, borderRadius: 10,
                  border: `1px solid ${P.border}`, padding: p, ...style }} {...rest}>
      {children}
    </div>
  );
}

// ── KpiCard — p 14 16: micro label → mono 26 value → 12 sub
//    (Governance #gov-overview tiles) ─────────────────────
export function KpiCard({ label, value, sub, style, ...rest }) {
  return (
    <Card p={'14px 16px'} style={style} {...rest}>
      <div style={{ ...T.microLabel, color: P.faint, marginBottom: 6 }}>{label}</div>
      <div data-testid="kpi-value" style={{ ...T.kpi, color: P.ink }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: P.muted, fontFamily: FONT, marginTop: 4 }}>{sub}</div>}
    </Card>
  );
}

// ── SectionLabel — mono micro-label (Inspector Panels #share-panel) ──
export function SectionLabel({ children, style, ...rest }) {
  return (
    <div {...rest} style={{ ...T.microLabel, color: P.faint, ...style }}>{children}</div>
  );
}

// ── PageHeader — crumb → h1 21/600 → actions (every full-shell frame).
//    Legacy props {sub, badge, action} still render (compat). ──
export function PageHeader({ crumb, title, count, sub, badge, action, actions }) {
  // R21S2E3 — default crumb per frame: `acme-retail / <area>[ / <sub>]`
  const { pathname } = useLocation();
  const segs = pathname.replace(/^\/app\/?/, '').split('/').filter(Boolean);
  const autoCrumb = `acme-retail / ${segs.length ? segs.join(' / ') : 'home'}`;
  const crumbText = crumb === false ? null : (crumb || autoCrumb);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'flex-start', marginBottom: 22 }}>
      <div>
        {crumbText && (
          <div data-testid="breadcrumbs"
               style={{ ...T.crumb, color: P.faint, marginBottom: 6 }}>{crumbText}</div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ margin: 0, ...T.pageTitle, color: P.ink }}>{title}</h1>
          {count != null && (
            <span style={{ fontFamily: MONO, fontSize: 13, color: P.faint }}>{count}</span>
          )}
          {badge && <Badge variant={badge.v}>{badge.label}</Badge>}
        </div>
        {sub && <p style={{ margin: '4px 0 0', fontSize: 12.5, color: P.muted, fontFamily: FONT }}>{sub}</p>}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{actions || action}</div>
    </div>
  );
}

// ── Steps (legacy wizard; retires with S06–S09 per Appendix B) ──
export function Steps({ steps, current }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {steps.map((step, i) => {
        const done = i < current, active = i === current;
        return (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0',
                                borderBottom: i < steps.length - 1 ? `1px solid ${P.borderRow}` : 'none' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700,
                          background: done ? P.green : active ? P.accent : P.grayBg,
                          color: done || active ? '#fff' : P.faint }}>
              {done ? '✓' : i + 1}
            </div>
            <div style={{ flex: 1, paddingTop: 2 }}>
              <div style={{ fontSize: 14, fontWeight: active || done ? 600 : 400,
                            color: active || done ? P.ink : P.faint, fontFamily: FONT }}>
                {step.title}
              </div>
              <div style={{ fontSize: 12, color: P.muted, marginTop: 2, fontFamily: FONT }}>
                {active ? step.active : done ? step.done : step.pending}
              </div>
            </div>
            <div style={{ paddingTop: 2 }}>
              {active && <Badge tint="blue" xs>running</Badge>}
              {done   && <Badge tint="green" xs>done</Badge>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── SVG helpers — geometric only, no chart lib (§0.1) ─────
export function Sparkline({ data, color = P.accent, w = 76, h = 28 }) {
  if (!data?.length) return null;
  const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / rng) * h}`).join(' ');
  return (
    <svg width={w} height={h}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5}
                strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Donut — dasharray ring, 86px (App Home #home data-health widget)
export function Donut({ value = 0, max = 100, size = 86, stroke = 9,
                        color = P.green, label, sub, ...rest }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, value / max));
  return (
    <div {...rest} style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={P.borderRow} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={`${c * frac} ${c * (1 - frac)}`} strokeDashoffset={c / 4}
                strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: MONO, fontSize: 17, fontWeight: 600, color: P.ink }}>
          {label ?? value}
        </span>
        {sub && <span style={{ fontFamily: MONO, fontSize: 8.5, color: P.faint }}>{sub}</span>}
      </div>
    </div>
  );
}

// BarRow — meter row w/ mono right label (Models #model-card importance)
export function BarRow({ label, value, max = 1, color = P.accent, mono }) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
      <span style={{ fontSize: 12, fontFamily: mono ? MONO : FONT, color: P.body,
                     width: 130, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis',
                     whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: P.borderRow, borderRadius: 999 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999 }} />
      </div>
      <span style={{ fontFamily: MONO, fontSize: 11.5, color: P.muted, width: 44, textAlign: 'right' }}>
        {typeof value === 'number' && value <= 1 && max === 1 ? value.toFixed(2) : value}
      </span>
    </div>
  );
}

export function Spinner({ size = 20, color = P.accent }) {
  return (
    <div style={{ width: size, height: size, border: `2px solid ${color}33`,
                  borderTopColor: color, borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
  );
}

const GATE_MAP = { pass: ['green', '✓'], warn: ['amber', '!'], fail: ['red', '✗'], flag: ['purple', 'PII'] };
export function GateDot({ s }) {
  const [tint, label] = GATE_MAP[s] || ['gray', s];
  return <Badge tint={tint} xs>{label}</Badge>;
}

export function HealthBar({ v }) {
  const color = v >= 90 ? P.green : v >= 70 ? P.amber : P.red;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <div style={{ width: 56, height: 5, background: P.borderRow, borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${v}%`, height: '100%', background: color, borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, fontFamily: MONO }}>{v}</span>
    </div>
  );
}

// ── StatusBadge (R15S2E3 API kept: status → tint, dot always) ──
export function StatusBadge({ status = 'gray', children, ...rest }) {
  const t = TINTS[status] || TINTS.gray;
  return (
    <span data-testid="status-badge" {...rest}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 20,
                   padding: '0 9px', borderRadius: 999, background: t.bg, color: t.fg,
                   fontFamily: MONO, fontSize: 10, fontWeight: 600,
                   textTransform: 'uppercase', letterSpacing: '.04em' }}>
      <span data-testid="badge-dot" style={{ width: 5, height: 5, borderRadius: 3, background: t.fg }} />
      {children}
    </span>
  );
}

// ── Tabs — underline 12.5px, active 600 #1d4ed8 + 2px #2563eb
//    (Artifacts Library #artifact-detail 8-tab strip) ──────
export function Tabs({ tabs, active, onChange, dense = false }) {
  // dense (R30S2E4): the workbench inspector fits 7 tabs in a 340px strip —
  // frame spec padding 7/8, 11px; overflow stays clipped, never past the edge
  return (
    <div role="tablist" style={{ display: 'flex', gap: 2, borderBottom: `1px solid ${P.border}`,
                                 overflow: 'hidden' }}>
      {tabs.map(t => (
        <button key={t} role="tab" aria-selected={active === t} onClick={() => onChange(t)}
                style={{ border: 'none', borderBottom: `2px solid ${active === t ? P.accent : 'transparent'}`,
                         background: 'none', cursor: 'pointer',
                         padding: dense ? '7px 5px' : '9px 13px',   // frame: 10px/5px
                         fontSize: dense ? 10 : 12.5, fontFamily: FONT, whiteSpace: 'nowrap',
                         fontWeight: active === t ? 600 : 500,
                         color: active === t ? P.accentHover : P.muted, marginBottom: -1 }}>
          {t}
        </button>
      ))}
    </div>
  );
}

// ── FilterChips — count-pill chips (Governance #review-queue) ──
export function FilterChips({ options, active, onChange, testid = 'filter-chips' }) {
  return (
    <div data-testid={testid} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map(o => {
        const label = typeof o === 'string' ? o : o.label;
        const count = typeof o === 'string' ? null : o.count;
        const on = active === label;
        return (
          <button key={label} onClick={() => onChange(label)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 26,
                           padding: '0 11px', borderRadius: 999, cursor: 'pointer',
                           border: `1px solid ${on ? P.accentBorder : P.borderStrong}`,
                           background: on ? P.accentSoft : '#fff',
                           color: on ? P.accentHover : P.body,
                           fontSize: 12, fontWeight: on ? 600 : 500, fontFamily: FONT }}>
            {label}
            {count != null && (
              <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 600,
                             background: on ? '#fff' : P.grayBg, borderRadius: 999,
                             padding: '1px 6px', color: P.muted }}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Drawer — right 420px (App Home #notifications) ────────
export function Drawer({ open, onClose, title, children, width = 420, headerExtra }) {
  if (!open) return null;
  return (
    <div onClick={onClose}
         style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.28)', zIndex: 70 }}>
      <div data-testid="drawer" onClick={e => e.stopPropagation()}
           style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width,
                    background: '#fff', boxShadow: '-16px 0 48px rgba(15,23,42,.18)',
                    display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 18px', borderBottom: `1px solid ${P.border}` }}>
          <span style={{ fontSize: 14, fontWeight: 600, fontFamily: FONT, color: P.ink }}>{title}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {headerExtra}
            <button onClick={onClose} aria-label="Close"
                    style={{ border: 'none', background: 'none', cursor: 'pointer',
                             fontSize: 16, color: P.muted, lineHeight: 1 }}>✕</button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

export function KpiNumber({ children }) {
  return <span style={{ ...T.kpi, color: P.ink }}>{children}</span>;
}

// ── ViewToggle — segmented, active #0f172a/white
//    (Artifacts Library #library header) ──────────────────
const GlyphGrid = ({ c }) => (
  <svg width="13" height="13" viewBox="0 0 13 13">
    <rect x="1" y="1" width="4.6" height="4.6" rx="1" fill={c} />
    <rect x="7.4" y="1" width="4.6" height="4.6" rx="1" fill={c} />
    <rect x="1" y="7.4" width="4.6" height="4.6" rx="1" fill={c} />
    <rect x="7.4" y="7.4" width="4.6" height="4.6" rx="1" fill={c} />
  </svg>
);
const GlyphList = ({ c }) => (
  <svg width="13" height="13" viewBox="0 0 13 13">
    {[2, 6.5, 11].map(y => <rect key={y} x="1" y={y - 1} width="11" height="2" rx="1" fill={c} />)}
  </svg>
);
export function ViewToggle({ view, onChange }) {
  const btn = (id, label, Glyph) => {
    const on = view === id;
    return (
      <button data-testid={`view-toggle-${id}`} onClick={() => onChange(id)}
              style={{ height: 30, padding: '0 12px', fontSize: 12, fontWeight: 600,
                       fontFamily: FONT, cursor: 'pointer', display: 'inline-flex',
                       alignItems: 'center', gap: 6, border: 'none',
                       background: on ? P.ink : '#fff', color: on ? '#fff' : P.muted }}>
        <Glyph c={on ? '#fff' : P.muted} />{label}
      </button>
    );
  };
  return (
    <span style={{ display: 'inline-flex', borderRadius: 8, overflow: 'hidden',
                   border: `1px solid ${P.borderStrong}` }}>
      {btn('cards', 'Cards', GlyphGrid)}{btn('table', 'Table', GlyphList)}
    </span>
  );
}

// ── DataTable — CSS-grid recipe (Data Sources #sources) ───
export function DataTable({ columns, rows, rowKey, testid = 'data-table',
                            filterBar = null, tinted, rowH = 44, onRowClick }) {
  const [sort, setSort] = useState(null);
  const sorted = [...rows];
  if (sort) {
    const col = columns.find(c => c.key === sort.key);
    sorted.sort((a, b) => {
      const va = col.sortValue ? col.sortValue(a) : a[sort.key];
      const vb = col.sortValue ? col.sortValue(b) : b[sort.key];
      const cmp = typeof va === 'number' ? va - vb : String(va ?? '').localeCompare(String(vb ?? ''));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }
  const grid = columns.map(c => c.width || '1fr').join(' ');
  return (
    <div data-testid={testid} style={{ border: `1px solid ${P.border}`, borderRadius: 10,
                                       background: '#fff', overflow: 'hidden' }}>
      {filterBar && <div style={{ padding: '10px 14px', borderBottom: `1px solid ${P.border}` }}>{filterBar}</div>}
      <div data-testid={`${testid}-head`}
           style={{ display: 'grid', gridTemplateColumns: grid, background: P.tableHeadBg,
                    borderBottom: `1px solid ${P.border}`, position: 'sticky', top: 0 }}>
        {columns.map(c => (
          <button key={c.key} disabled={!c.sortable}
                  onClick={() => c.sortable && setSort(s =>
                    s && s.key === c.key ? { key: c.key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
                                         : { key: c.key, dir: 'asc' })}
                  style={{ border: 'none', background: 'none', textAlign: 'left',
                           padding: '12px 14px', ...T.tableHeader, color: P.muted,
                           cursor: c.sortable ? 'pointer' : 'default' }}>
            {c.label}{sort && sort.key === c.key ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ''}
          </button>
        ))}
      </div>
      {sorted.map(r => {
        const wash = tinted ? (tinted(r) || 'transparent') : 'transparent';
        return (
          <div key={r[rowKey]} data-testid={`table-row-${r[rowKey]}`}
               onClick={onRowClick ? () => onRowClick(r) : undefined}
               style={{ display: 'grid', gridTemplateColumns: grid, alignItems: 'center',
                        minHeight: rowH, borderBottom: `1px solid ${P.borderRow}`,
                        fontSize: 13, fontFamily: FONT, color: P.body, background: wash,
                        cursor: onRowClick ? 'pointer' : 'default' }}
               onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
               onMouseLeave={e => e.currentTarget.style.background = wash}>
            {columns.map(c => (
              <div key={c.key} style={{ padding: '8px 14px',
                                        fontFamily: c.mono ? MONO : FONT,
                                        fontSize: c.mono ? 12.5 : 13 }}>
                {c.render ? c.render(r) : r[c.key]}
              </div>
            ))}
          </div>
        );
      })}
      {sorted.length === 0 && (
        <div style={{ padding: 18, fontSize: 12, color: P.muted, fontFamily: FONT }}>No rows</div>
      )}
    </div>
  );
}

// ── Form controls — h36 r8 border #d4d9e1 (Data Import #rest-api) ──
const FIELD = {
  height: 36, borderRadius: 8, border: `1px solid ${P.borderStrong}`,
  padding: '0 11px', fontSize: 13, fontFamily: FONT, color: P.ink,
  background: '#fff', outline: 'none', width: '100%',
};
export function FieldLabel({ children, style }) {
  return <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600,
                         color: P.body, fontFamily: FONT, marginBottom: 6, ...style }}>{children}</label>;
}
export function Input({ mono, style, ...rest }) {
  return <input {...rest} style={{ ...FIELD, fontFamily: mono ? MONO : FONT,
                                   fontSize: mono ? 12.5 : 13, ...style }} />;
}
export function Select({ mono, children, style, ...rest }) {
  return (
    <select {...rest} style={{ ...FIELD, fontFamily: mono ? MONO : FONT,
                               fontSize: mono ? 12.5 : 13, ...style }}>{children}</select>
  );
}
export function Textarea({ mono, style, rows = 4, ...rest }) {
  return <textarea rows={rows} {...rest}
                   style={{ ...FIELD, height: 'auto', padding: '9px 11px', lineHeight: 1.5,
                            fontFamily: mono ? MONO : FONT, resize: 'vertical', ...style }} />;
}

// ── Toggle 34×20 (Alerts #create-alert mute card) ─────────
export function Toggle({ on, onChange, testid = 'toggle', disabled }) {
  return (
    <button type="button" role="switch" aria-checked={!!on} data-testid={testid}
            onClick={disabled ? undefined : () => onChange(!on)}
            style={{ width: 34, height: 20, borderRadius: 999, border: 'none', padding: 2,
                     background: on ? P.accent : P.grayBar, cursor: disabled ? 'not-allowed' : 'pointer',
                     display: 'inline-flex', justifyContent: on ? 'flex-end' : 'flex-start',
                     transition: 'background .15s', opacity: disabled ? .5 : 1 }}>
      <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff',
                     boxShadow: '0 1px 2px rgba(15,23,42,.25)' }} />
    </button>
  );
}

// ── Checkbox 14.5 r4 (Inspector Panels #share-panel advanced) ──
export function Checkbox({ checked, onChange, label, testid, disabled }) {
  return (
    <label data-testid={testid}
           style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
                    cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 12.5,
                    fontFamily: FONT, color: P.body, opacity: disabled ? .5 : 1 }}>
      <span role="checkbox" aria-checked={!!checked}
            onClick={disabled ? undefined : () => onChange(!checked)}
            style={{ width: 15, height: 15, borderRadius: 4, flexShrink: 0,
                     border: `1px solid ${checked ? P.accent : P.borderStrong}`,
                     background: checked ? P.accent : '#fff', display: 'inline-flex',
                     alignItems: 'center', justifyContent: 'center' }}>
        {checked && (
          <svg width="9" height="9" viewBox="0 0 9 9">
            <path d="M1.5 4.5 3.7 6.7 7.5 2.4" fill="none" stroke="#fff" strokeWidth="1.6"
                  strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </label>
  );
}

// ── RadioCard — selected 2px accent + #f8faff (share-panel visibility) ──
export function RadioCard({ selected, onSelect, children, testid, style }) {
  return (
    <div data-testid={testid} onClick={onSelect} role="radio" aria-checked={!!selected}
         style={{ border: selected ? `2px solid ${P.accent}` : `1px solid ${P.border}`,
                  background: selected ? P.selectedRow : '#fff', borderRadius: 10,
                  padding: selected ? 13 : 14, cursor: 'pointer', ...style }}>
      {children}
    </div>
  );
}

// ── Avatar — initials circles 24–34 (§2 demo cast) ────────
const AVATAR_COLORS = { DK: P.cyan, PS: '#b45309', MO: P.purple, SYS: P.gray };
const AVATAR_POOL = [P.cyan, '#b45309', P.purple, P.accent, P.green];
export function Avatar({ initials = '?', size = 26, color, style, ...rest }) {
  const bg = color || AVATAR_COLORS[initials]
    || AVATAR_POOL[(initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % AVATAR_POOL.length];
  return (
    <span {...rest} style={{ width: size, height: size, borderRadius: '50%', background: bg,
                             color: '#fff', display: 'inline-flex', alignItems: 'center',
                             justifyContent: 'center', fontFamily: FONT, flexShrink: 0,
                             fontSize: size >= 32 ? 12 : size >= 26 ? 10.5 : 9,
                             fontWeight: 700, ...style }}>
      {initials}
    </span>
  );
}
export function AvatarStack({ people, size = 24 }) {
  return (
    <span style={{ display: 'inline-flex' }}>
      {people.map((p, i) => (
        <Avatar key={p + i} initials={p} size={size}
                style={{ marginLeft: i ? -6 : 0, boxShadow: '0 0 0 2px #fff' }} />
      ))}
    </span>
  );
}

// ── ProgressBar h5–10 + stacked variant (Billing #usage) ──
export function ProgressBar({ value = 0, max = 100, h = 6, color = P.accent,
                              segments, testid }) {
  return (
    <div data-testid={testid}
         style={{ height: h, background: P.borderRow, borderRadius: 999, overflow: 'hidden',
                  display: 'flex' }}>
      {segments
        ? segments.map((s, i) => (
            <div key={i} style={{ width: `${(s.value / max) * 100}%`, background: s.color,
                                  height: '100%' }} />
          ))
        : <div style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color,
                        height: '100%', borderRadius: 999 }} />}
    </div>
  );
}
export const Meter = BarRow; // frame vocabulary alias

// ── CodeBlock dark + LogLine (§0.2 dark code row) ─────────
const LOG_COLORS = { keyword: P.codePink, string: P.codeGreen, error: P.codeRed,
                     ts: P.muted, ok: P.codeGreen, default: P.codeBlue };
export function CodeBlock({ children, style, testid, maxHeight }) {
  return (
    <pre data-testid={testid}
         style={{ background: P.darkBg, borderRadius: 9, padding: '12px 14px',
                  fontFamily: MONO, fontSize: 10.5, lineHeight: 1.7, color: P.codeBlue,
                  overflow: 'auto', margin: 0, maxHeight, ...style }}>{children}</pre>
  );
}
export function LogLine({ kind = 'default', ts, children }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: 10.5, lineHeight: 1.7 }}>
      {ts && <span style={{ color: P.muted }}>{ts} </span>}
      <span style={{ color: LOG_COLORS[kind] || LOG_COLORS.default }}>{children}</span>
    </div>
  );
}

// ── Modal — r14, shadow spec, footer #fafbfc (share-panel) ──
export function Modal({ open, onClose, title, children, footer, width = 520, testid = 'modal' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = e => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div onClick={onClose}
         style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.28)', zIndex: 80,
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                  paddingTop: 84 }}>
      <div data-testid={testid} onClick={e => e.stopPropagation()}
           style={{ width, maxWidth: '94vw', maxHeight: '82vh', display: 'flex',
                    flexDirection: 'column', background: '#fff', borderRadius: 14,
                    boxShadow: '0 24px 64px rgba(15,23,42,.18)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '16px 20px', borderBottom: `1px solid ${P.border}` }}>
          <span style={{ fontSize: 14.5, fontWeight: 600, fontFamily: FONT, color: P.ink }}>{title}</span>
          <button onClick={onClose} aria-label="Close"
                  style={{ border: 'none', background: 'none', cursor: 'pointer',
                           fontSize: 16, color: P.muted, lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>{children}</div>
        {footer && (
          <div data-testid="modal-footer"
               style={{ padding: '13px 20px', background: P.tableHeadBg,
                        borderTop: `1px solid ${P.border}`, display: 'flex',
                        justifyContent: 'flex-end', gap: 8 }}>{footer}</div>
        )}
      </div>
    </div>
  );
}
