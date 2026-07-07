// R21S1E3 — 15px stroke SVG icon set, paths extracted from
// `App Home.dc.html` (aside + topbar). stroke=currentColor so tint follows
// text color; no emoji glyphs anywhere (enforced by r21s1_icons.spec.js).
import { FONT } from '../tokens';

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4 };
const SR = { ...S, strokeLinecap: 'round' };
const SJ = { ...S, strokeLinejoin: 'round' };
const SRJ = { ...SR, strokeLinejoin: 'round' };

export const ICONS = {
  Home:       <path d="M2.5 6.5 7.5 2l5 4.5V13h-10V6.5Z" {...SJ} />,
  Create:     <><rect x="2" y="2" width="11" height="11" rx="3" {...S} /><path d="M7.5 5v5M5 7.5h5" {...SR} /></>,
  Artifacts:  <><rect x="2" y="4.5" width="8.5" height="8.5" rx="2" {...S} /><path d="M5 2h8v8" {...SJ} /></>,
  Data:       <><ellipse cx="7.5" cy="3.8" rx="5" ry="2" {...S} /><path d="M2.5 3.8v7.4c0 1.1 2.2 2 5 2s5-.9 5-2V3.8" {...S} /><path d="M2.5 7.5c0 1.1 2.2 2 5 2s5-.9 5-2" {...S} /></>,
  Semantic:   <><circle cx="4" cy="7.5" r="1.8" {...S} /><circle cx="11" cy="3.5" r="1.8" {...S} /><circle cx="11" cy="11.5" r="1.8" {...S} /><path d="m5.6 6.6 3.8-2.2M5.6 8.4l3.8 2.2" {...S} /></>,
  Gold:       <path d="M7.5 1.5 13.5 7.5 7.5 13.5 1.5 7.5Z" {...SJ} />,
  Models:     <><polyline points="1.5,11.5 5,7.5 8,9.5 13.5,3.5" {...SRJ} /><circle cx="13.5" cy="3.5" r="1.3" fill="currentColor" stroke="none" /></>,
  Alerts:     <><path d="M7.5 2a4 4 0 0 1 4 4v2.5l1 2H2.5l1-2V6a4 4 0 0 1 4-4Z" {...SJ} /><path d="M6.2 12.5a1.4 1.4 0 0 0 2.6 0" {...S} /></>,
  Governance: <><path d="M7.5 1.5 12.5 3.5v3.7c0 3-2.1 4.8-5 5.8-2.9-1-5-2.8-5-5.8V3.5l5-2Z" {...SJ} /><path d="m5.3 7.3 1.6 1.6 2.8-3" {...SRJ} /></>,
  Team:       <><circle cx="5.5" cy="5" r="2.3" {...S} /><path d="M1.8 13c.3-2.3 1.8-3.6 3.7-3.6s3.4 1.3 3.7 3.6" {...SR} /><circle cx="10.8" cy="4.5" r="1.8" {...S} /><path d="M10.6 8.9c1.6.1 2.6 1.2 2.8 3" {...SR} /></>,
  Admin:      <><circle cx="7.5" cy="7.5" r="2.2" {...S} /><path d="M7.5 1.5v2M7.5 11.5v2M1.5 7.5h2M11.5 7.5h2M3.3 3.3l1.4 1.4M10.3 10.3l1.4 1.4M11.7 3.3l-1.4 1.4M4.7 10.3 3.3 11.7" {...SR} /></>,
  Billing:    <><rect x="1.5" y="3" width="12" height="9" rx="2" {...S} /><path d="M1.5 6h12" {...S} /><path d="M4 9.5h3" {...SR} /></>,
  Settings:   <><path d="M2 4.5h7M11.5 4.5H13M2 10.5h3M7.5 10.5H13" {...SR} /><circle cx="10" cy="4.5" r="1.6" {...S} /><circle cx="6" cy="10.5" r="1.6" {...S} /></>,
  Search:     <><circle cx="5.5" cy="5.5" r="4" {...S} /><path d="m8.5 8.5 3 3" {...SR} /></>,
  Bell:       <><path d="M7.5 2a4 4 0 0 1 4 4v2.5l1 2H2.5l1-2V6a4 4 0 0 1 4-4Z" {...SJ} /><path d="M6.2 12.5a1.4 1.4 0 0 0 2.6 0" {...S} /></>,
  Sparkle:    <path d="M8 1.5 9.7 6.3 14.5 8l-4.8 1.7L8 14.5 6.3 9.7 1.5 8l4.8-1.7L8 1.5Z" fill="currentColor" stroke="none" />,
  Help:       <><circle cx="7.5" cy="7.5" r="6" {...S} /><path d="M5.8 5.8a1.8 1.8 0 1 1 2.6 1.7c-.6.3-.9.7-.9 1.3" {...SR} /><circle cx="7.5" cy="11" r=".9" fill="currentColor" stroke="none" /></>,
  Caret:      <path d="m4.5 6.5 3 3 3-3" {...SRJ} />,
  Collapse:   <><path d="m8.5 4-3.5 3.5L8.5 11" {...SRJ} /><path d="M12 4 8.5 7.5 12 11" {...SRJ} opacity=".45" /></>,
  Close:      <path d="M3.5 3.5l8 8M11.5 3.5l-8 8" {...SR} />,
  Check:      <path d="m3 8 3 3 6-7" {...SRJ} />,
  Warning:    <><path d="M7.5 2 14 13H1L7.5 2Z" {...SJ} /><path d="M7.5 6v3.4" {...SR} /><circle cx="7.5" cy="11.2" r=".8" fill="currentColor" stroke="none" /></>,
  Info:       <><circle cx="7.5" cy="7.5" r="6" {...S} /><path d="M7.5 7v3.6" {...SR} /><circle cx="7.5" cy="4.6" r=".8" fill="currentColor" stroke="none" /></>,
  Lock:       <><rect x="3" y="6.5" width="9" height="6.5" rx="1.6" {...S} /><path d="M5 6.5V5a2.5 2.5 0 0 1 5 0v1.5" {...S} /></>,
  External:   <><path d="M6 3H3v9h9V9" {...SRJ} /><path d="M8.5 2.5h4v4M12.3 2.7 7.5 7.5" {...SRJ} /></>,
  Copy:       <><rect x="5" y="5" width="8" height="8" rx="1.6" {...S} /><path d="M3.5 10H3a1.5 1.5 0 0 1-1.5-1.5v-6A1.5 1.5 0 0 1 3 1h6a1.5 1.5 0 0 1 1.5 1.5V3" {...S} /></>,
  Eye:        <><path d="M1.5 7.5C3 4.7 5 3.2 7.5 3.2s4.5 1.5 6 4.3c-1.5 2.8-3.5 4.3-6 4.3s-4.5-1.5-6-4.3Z" {...SJ} /><circle cx="7.5" cy="7.5" r="1.9" {...S} /></>,
  Filter:     <path d="M2 3.5h11L9 8.2V12l-3 1.5V8.2L2 3.5Z" {...SJ} />,
  GridView:   <><rect x="2" y="2" width="4.6" height="4.6" rx="1" fill="currentColor" stroke="none" /><rect x="8.4" y="2" width="4.6" height="4.6" rx="1" fill="currentColor" stroke="none" /><rect x="2" y="8.4" width="4.6" height="4.6" rx="1" fill="currentColor" stroke="none" /><rect x="8.4" y="8.4" width="4.6" height="4.6" rx="1" fill="currentColor" stroke="none" /></>,
  ListView:   <path d="M2 3.5h11M2 7.5h11M2 11.5h11" {...SR} />,
  Mic:        <><rect x="5.6" y="1.8" width="3.8" height="7" rx="1.9" {...S} /><path d="M3.5 7.5a4 4 0 0 0 8 0M7.5 11.5v2" {...SR} /></>,
  Plus:       <path d="M7.5 3v9M3 7.5h9" {...SR} />,
  Bolt:       <path d="M8.2 1.5 3.5 8.5h3L6.8 13.5 11.5 6.5h-3l-.3-5Z" fill="currentColor" stroke="none" />,
  Star:       <path d="m7.5 1.8 1.8 3.7 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4L1.7 6.1l4-.6L7.5 1.8Z" {...SJ} />,
  StarFill:   <path d="m7.5 1.8 1.8 3.7 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4L1.7 6.1l4-.6L7.5 1.8Z" fill="currentColor" stroke="none" />,
};

export function Icon({ name, size = 15, style, ...rest }) {
  const glyph = ICONS[name];
  if (!glyph) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 15 15" aria-hidden="true"
         style={{ flexShrink: 0, display: 'block', ...style }} {...rest}>
      {glyph}
    </svg>
  );
}

// Shared logo — 22px shell · 24px marketing · 30px hub (§0.2 row 2).
// markFill/iqColor let a darker host surface (e.g. the marketing footer, R34S1E1)
// request the mockup's slightly lighter mark/accent without a second component.
export function Logo({ size = 22, withWordmark = true, wordmarkSize = 14.5, dark = false,
                       markFill = '#0f172a', iqColor = '#2563eb' }) {
  const u = size / 24;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(size * 0.41) }}>
      <svg width={size} height={size} viewBox="0 0 24 24" aria-label="AnalytIQ">
        <rect width="24" height="24" rx="6" fill={markFill} />
        <rect x="5.5" y="12" width="3.2" height="6.5" rx="1.2" fill="#60a5fa" />
        <rect x="10.4" y="8.5" width="3.2" height="10" rx="1.2" fill="#3b82f6" />
        <rect x="15.3" y="5" width="3.2" height="13.5" rx="1.2" fill="#2563eb" />
      </svg>
      {withWordmark && (
        <span style={{ fontSize: wordmarkSize, fontWeight: 700, fontFamily: FONT,
                       color: dark ? '#e2e8f0' : '#0f172a' }}>
          Analyt<span style={{ color: iqColor }}>IQ</span>
        </span>
      )}
    </span>
  );
}
