// R34S2E2 — Templates gallery (/templates): 250px filter rail (category +
// type, real client-side filtering) + grid header (count + search) + 10
// template cards. Per docs/specs/mockups/Marketing Templates.dc.html.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FONT, MONO, P } from '../tokens';
import MarketingNav from '../components/MarketingNav';
import MarketingFooter from '../components/MarketingFooter';

const CATEGORIES = ['Revenue', 'Churn', 'Operations', 'Sales', 'Marketing', 'Inventory', 'SLA'];
const TYPES = ['Predictive', 'Monitoring', 'Diagnostic'];

const TEMPLATES = [
  { title: 'Revenue Forecast', desc: 'Weekly trend + 8-week forecast vs target.',
    category: 'Revenue', type: 'Predictive',
    art: (
      <svg viewBox="0 0 320 58" style={{ width: '100%', height: 58 }}>
        <polygon points="0,50 0,38 52,34 104,40 156,26 208,30 208,50" fill="rgba(37,99,235,.09)" />
        <polyline points="0,38 52,34 104,40 156,26 208,30" fill="none" stroke="#2563eb" strokeWidth="2" />
        <polyline points="208,30 264,24 320,28" fill="none" stroke="#2563eb" strokeWidth="2" strokeDasharray="5 4" />
      </svg>
    ) },
  { title: 'Location Performance', desc: 'Rank stores vs target; flag laggards.',
    category: 'Revenue', type: 'Diagnostic',
    art: (
      <svg viewBox="0 0 320 58" style={{ width: '100%', height: 58 }}>
        <rect x="6" y="14" width="22" height="36" rx="3" fill="#2563eb" />
        <rect x="38" y="22" width="22" height="28" rx="3" fill="#93c5fd" />
        <rect x="70" y="18" width="22" height="32" rx="3" fill="#93c5fd" />
        <rect x="102" y="30" width="22" height="20" rx="3" fill="#dbeafe" />
        <rect x="134" y="26" width="22" height="24" rx="3" fill="#93c5fd" />
        <rect x="166" y="36" width="22" height="14" rx="3" fill="#fca5a5" />
        <rect x="198" y="22" width="22" height="28" rx="3" fill="#93c5fd" />
        <line x1="4" y1="26" x2="316" y2="26" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="4 4" />
      </svg>
    ) },
  { title: 'Customer Churn Risk', desc: 'Score accounts by 60-day churn probability.',
    category: 'Churn', type: 'Predictive',
    art: (
      <svg viewBox="0 0 320 58" style={{ width: '100%', height: 58 }}>
        <circle cx="34" cy="29" r="21" fill="none" stroke="#eef1f5" strokeWidth="9" />
        <circle cx="34" cy="29" r="21" fill="none" stroke="#dc2626" strokeWidth="9" strokeDasharray="36 96"
                transform="rotate(-90 34 29)" />
        <rect x="74" y="10" width="150" height="8" rx="4" fill="#fdeaea" />
        <rect x="74" y="26" width="220" height="8" rx="4" fill="#eef1f5" />
        <rect x="74" y="42" width="180" height="8" rx="4" fill="#eef1f5" />
      </svg>
    ) },
  { title: 'Operational Risk Monitor', desc: 'Heatmap of drift across sites and lines.',
    category: 'Operations', type: 'Monitoring',
    art: (
      <svg viewBox="0 0 320 58" style={{ width: '100%', height: 58 }}>
        <rect x="6" y="6" width="30" height="21" rx="4" fill="#e8f5ec" />
        <rect x="42" y="6" width="30" height="21" rx="4" fill="#fdf3e3" />
        <rect x="78" y="6" width="30" height="21" rx="4" fill="#e8f5ec" />
        <rect x="6" y="31" width="30" height="21" rx="4" fill="#e8f5ec" />
        <rect x="42" y="31" width="30" height="21" rx="4" fill="#fdeaea" />
        <rect x="78" y="31" width="30" height="21" rx="4" fill="#e8f5ec" />
        <rect x="126" y="10" width="188" height="9" rx="4" fill="#d97706" opacity=".55" />
        <rect x="126" y="26" width="140" height="9" rx="4" fill="#2563eb" opacity=".45" />
        <rect x="126" y="42" width="166" height="9" rx="4" fill="#dc2626" opacity=".5" />
      </svg>
    ) },
  { title: 'Sales Pipeline Health', desc: 'Coverage, stage velocity, stale-deal flags.',
    category: 'Sales', type: 'Diagnostic',
    art: (
      <svg viewBox="0 0 320 58" style={{ width: '100%', height: 58 }}>
        <rect x="6" y="42" width="308" height="10" rx="5" fill="#eff4ff" />
        <rect x="6" y="27" width="238" height="10" rx="5" fill="#dbeafe" />
        <rect x="6" y="12" width="150" height="10" rx="5" fill="#2563eb" />
      </svg>
    ) },
  { title: 'Margin Variance', desc: 'SKU/supplier drivers of gross margin leaks.',
    category: 'Revenue', type: 'Variance',
    art: (
      <svg viewBox="0 0 320 58" style={{ width: '100%', height: 58 }}>
        <rect x="8" y="20" width="20" height="32" rx="3" fill="#cbd5e1" />
        <rect x="36" y="12" width="20" height="40" rx="3" fill="#cbd5e1" />
        <rect x="64" y="26" width="20" height="26" rx="3" fill="#f59e0b" />
        <rect x="92" y="8" width="20" height="44" rx="3" fill="#cbd5e1" />
        <rect x="120" y="30" width="20" height="22" rx="3" fill="#f59e0b" />
        <rect x="148" y="16" width="20" height="36" rx="3" fill="#cbd5e1" />
        <rect x="176" y="34" width="20" height="18" rx="3" fill="#dc2626" />
        <line x1="4" y1="24" x2="316" y2="24" stroke="#94a3b8" strokeWidth="1.4" strokeDasharray="4 4" />
      </svg>
    ) },
  { title: 'Marketing Spend Efficiency', desc: 'Channel ROAS with diminishing-returns curve.',
    category: 'Marketing', type: 'Diagnostic',
    art: (
      <svg viewBox="0 0 320 58" style={{ width: '100%', height: 58 }}>
        <rect x="8" y="36" width="42" height="16" rx="3" fill="#93c5fd" />
        <rect x="58" y="26" width="42" height="26" rx="3" fill="#60a5fa" />
        <rect x="108" y="18" width="42" height="34" rx="3" fill="#3b82f6" />
        <rect x="158" y="10" width="42" height="42" rx="3" fill="#2563eb" />
        <polyline points="220,44 250,36 280,26 312,14" fill="none" stroke="#15803d" strokeWidth="2" />
      </svg>
    ) },
  { title: 'Inventory Demand Forecast', desc: 'Stockout risk by SKU and warehouse.',
    category: 'Inventory', type: 'Predictive',
    art: (
      <svg viewBox="0 0 320 58" style={{ width: '100%', height: 58 }}>
        <polyline points="0,40 40,36 80,42 120,30 160,34 200,24 220,28" fill="none" stroke="#059669" strokeWidth="2" />
        <polyline points="220,28 260,22 300,26 320,20" fill="none" stroke="#059669" strokeWidth="2" strokeDasharray="5 4" />
        <circle cx="120" cy="30" r="4" fill="#fff" stroke="#dc2626" strokeWidth="2" />
        <line x1="220" y1="8" x2="220" y2="52" stroke="#94a3b8" strokeDasharray="3 4" />
      </svg>
    ) },
  { title: 'SLA Breach Predictor', desc: 'Which shipments/tickets will miss SLA next.',
    category: 'SLA', type: 'Predictive',
    art: (
      <svg viewBox="0 0 320 58" style={{ width: '100%', height: 58 }}>
        <rect x="8" y="10" width="120" height="9" rx="4" fill="#e4e8ef" />
        <rect x="8" y="26" width="90" height="9" rx="4" fill="#e4e8ef" />
        <rect x="8" y="42" width="104" height="9" rx="4" fill="#e4e8ef" />
        <circle cx="200" cy="29" r="20" fill="none" stroke="#eef1f5" strokeWidth="8" />
        <circle cx="200" cy="29" r="20" fill="none" stroke="#b45309" strokeWidth="8" strokeDasharray="88 126"
                transform="rotate(-90 200 29)" />
        <text x="188" y="33" fontFamily="IBM Plex Mono" fontSize="10" fill="#0f172a">70%</text>
      </svg>
    ) },
  { title: 'Anomaly Monitor', desc: 'Baseline-aware spikes on any metric.',
    category: 'Operations', type: 'Monitoring',
    art: (
      <svg viewBox="0 0 320 58" style={{ width: '100%', height: 58 }}>
        <polyline points="0,32 30,30 60,34 90,28 120,32 150,30 180,12 210,32 240,30 270,34 300,30 320,32"
                  fill="none" stroke="#2563eb" strokeWidth="2" />
        <circle cx="180" cy="12" r="4.5" fill="#fff" stroke="#dc2626" strokeWidth="2" />
        <text x="168" y="52" fontFamily="IBM Plex Mono" fontSize="8.5" fill="#dc2626">3.2σ</text>
      </svg>
    ) },
];

function Checkbox({ checked, label, bold, onClick }) {
  return (
    <label onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13,
                color: bold ? P.ink : P.body, fontWeight: bold ? 600 : 400, fontFamily: FONT,
                cursor: 'pointer' }}>
      {checked ? (
        <span style={{ width: 15, height: 15, borderRadius: 4, background: P.accent,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="9" height="9" viewBox="0 0 9 9">
            <path d="m2 4.5 2 2 3-3.5" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </span>
      ) : (
        <span style={{ width: 15, height: 15, borderRadius: 4, border: `1.5px solid ${P.grayBar}` }} />
      )}
      {label}
    </label>
  );
}

export default function MarketingTemplates() {
  const [category, setCategory] = useState('All templates');
  const [types, setTypes] = useState(new Set());
  const [search, setSearch] = useState('');

  const toggleType = t => setTypes(prev => {
    const next = new Set(prev);
    next.has(t) ? next.delete(t) : next.add(t);
    return next;
  });

  const filtered = useMemo(() => TEMPLATES.filter(t => {
    if (category !== 'All templates' && t.category !== category) return false;
    if (types.size > 0 && !types.has(t.type)) return false;
    if (search.trim() && !t.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  }), [category, types, search]);

  return (
    <div data-testid="marketing-templates" style={{ minHeight: '100vh', background: '#fff' }}>
      <MarketingNav />
      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr' }}>
        <div style={{ borderRight: `1px solid ${P.border}`, padding: '30px 26px', display: 'flex',
                      flexDirection: 'column', gap: 16 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.12em', color: P.faint }}>CATEGORY</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <Checkbox checked={category === 'All templates'} label="All templates" bold
                      onClick={() => setCategory('All templates')} />
            {CATEGORIES.map(c => (
              <Checkbox key={c} checked={category === c} label={c} onClick={() => setCategory(c)} />
            ))}
          </div>
          <div style={{ height: 1, background: P.borderRow }} />
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.12em', color: P.faint }}>TYPE</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {TYPES.map(t => (
              <Checkbox key={t} checked={types.has(t)} label={t} onClick={() => toggleType(t)} />
            ))}
          </div>
        </div>

        <div style={{ padding: '30px 36px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-.015em', color: P.ink,
                        fontFamily: FONT }}>
              Templates{' '}
              <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 500, color: P.faint }}>
                {filtered.length}
              </span>
            </h1>
            <div style={{ width: 300, height: 36, display: 'flex', alignItems: 'center', gap: 9,
                        padding: '0 13px', border: `1px solid ${P.borderStrong}`, borderRadius: 9 }}>
              <svg width="12" height="12" viewBox="0 0 13 13">
                <circle cx="5.5" cy="5.5" r="4" fill="none" stroke={P.faint} strokeWidth="1.4" />
                <path d="m8.5 8.5 3 3" stroke={P.faint} strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)}
                     placeholder="Search templates…" data-testid="templates-search"
                     style={{ border: 'none', outline: 'none', fontSize: 12.5, color: P.ink, flex: 1,
                              fontFamily: FONT }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {filtered.map(t => (
              <Link key={t.title} to="/app" data-testid={`template-card-${t.title.toLowerCase().replace(/\s+/g, '-')}`}
                    style={{ textDecoration: 'none', border: `1px solid ${P.border}`, borderRadius: 12,
                             overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: P.bg, borderBottom: `1px solid ${P.borderRow}`, padding: 13 }}>
                  {t.art}
                </div>
                <div style={{ padding: '13px 15px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: P.ink, fontFamily: FONT }}>{t.title}</span>
                  <span style={{ fontSize: 11.5, lineHeight: 1.5, color: P.muted, fontFamily: FONT }}>{t.desc}</span>
                  <span style={{ fontFamily: MONO, fontSize: 9, color: P.faint, marginTop: 3 }}>
                    {t.category.toUpperCase()} · {t.type.toUpperCase()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
}
