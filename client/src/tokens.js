/**
 * @deprecated Legacy palette (pre design-parity). Do NOT import in new code —
 * `npm run lint:tokens` rejects new `C` imports (R21S1E1-US2). Consumers are
 * grandfathered in eslint.config.mjs and retire per checklist Appendix B.
 */
export const C = {
  primary:      '#2d5bd0',
  primaryHover: '#2249b0',
  primaryLight: '#eaeffc',
  sidebar:      '#0d1424',
  sidebarBorder:'rgba(255,255,255,0.07)',
  surface:      '#ffffff',
  bg:           '#f4f6fb',
  text:         '#111827',
  textSec:      '#6b7280',
  textTer:      '#9ca3af',
  border:       '#e5e7eb',
  borderLight:  '#f3f4f6',
  success:      '#059669',
  successBg:    '#ecfdf5',
  warning:      '#d97706',
  warningBg:    '#fffbeb',
  error:        '#dc2626',
  errorBg:      '#fef2f2',
  purple:       '#7c3aed',
  purpleBg:     '#f3e8ff',
};

export const FONT = "'IBM Plex Sans', sans-serif";
export const MONO = "'IBM Plex Mono', monospace";

// R15S2E3 — committed design language (docs/specs/PLAN.md)
export const P = {
  bg: '#f7f8fa', surface: '#ffffff',
  border: '#e4e8ef', borderStrong: '#d4d9e1', borderRow: '#eef1f5',
  ink: '#0f172a', body: '#334155', muted: '#64748b', faint: '#94a3b8',
  accent: '#2563eb', accentHover: '#1d4ed8', accentSoft: '#eff4ff', accentBorder: '#c7d9f8',
  green: '#15803d', greenBg: '#e8f5ec',
  amber: '#b45309', amberBg: '#fdf3e3',
  red: '#dc2626', redBg: '#fdeaea',
  purple: '#7c3aed', purpleBg: '#f3eefe',
  cyan: '#0e7490', cyanBg: '#e0f3f8',
  grayBg: '#f1f5f9', gray: '#64748b',
  chart: ['#2563eb', '#0ea5e9', '#7c3aed', '#d97706', '#059669'],
  darkBg: '#0b1220', darkPanel: '#0f1729', darkBorder: 'rgba(255,255,255,.08)',
  darkText: '#e2e8f0', darkMuted: '#94a3b8',
  // R21S1E1-US1 — remaining frame colors (checklist §0.2 names)
  sidebarBg: '#fbfcfe',      // app shell aside
  itemInk: '#47516b',        // sidebar item / secondary chrome text
  boardLabel: '#5b6478',     // mockup board labels
  rowFaint: '#f3f5f9',       // extra-faint row hairline
  selectedRow: '#f8faff',    // selected/unread row wash
  tableHeadBg: '#fafbfc',    // grid-table header + footer bars
  anomalyAmber: '#fdf9ef',   // anomaly row wash (amber)
  anomalyRed: '#fdf6f6',     // leakage-dropped row wash (red)
  greenBorder: '#b7e0c3', amberBorder: '#f2ddb0', amberDark: '#7a4a10',
  grayBar: '#cbd5e1',        // neutral chart bars
  authStage: '#f2f4f8',      // auth/onboarding stage bg
  darkAccent: '#60a5fa',     // accent link on dark bands
  codeBlue: '#93c5fd', codePink: '#f472b6', codeGreen: '#4ade80', codeRed: '#f87171',
};

// R21S1E1-US1 — typography roles (UI_MOCKUP_ANALYSIS §2). Screens spread these
// instead of hand-typing sizes: style={{ ...T.pageTitle, color: P.ink }}
export const T = {
  pageTitle:   { fontSize: 21,   fontWeight: 600, fontFamily: FONT, letterSpacing: '-0.2px' },
  cardTitle:   { fontSize: 13.5, fontWeight: 600, fontFamily: FONT },
  body:        { fontSize: 12.5, fontWeight: 400, fontFamily: FONT },
  microLabel:  { fontSize: 9.5,  fontWeight: 600, fontFamily: MONO,
                 letterSpacing: '.08em', textTransform: 'uppercase' },
  groupLabel:  { fontSize: 9.5,  fontWeight: 600, fontFamily: MONO,
                 letterSpacing: '.12em', textTransform: 'uppercase' },
  kpi:         { fontSize: 26,   fontWeight: 600, fontFamily: MONO },
  tableHeader: { fontSize: 10,   fontWeight: 600, fontFamily: MONO,
                 letterSpacing: '.06em', textTransform: 'uppercase' },
  monoValue:   { fontSize: 12.5, fontWeight: 500, fontFamily: MONO },
  crumb:       { fontSize: 11,   fontWeight: 400, fontFamily: MONO },
};
