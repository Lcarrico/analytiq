// R36S3E1-US1 (program R30–R36) — billing at parity (`Billing.dc.html` frames
// 01–04 / ch16): plan & seats with live seat math, current-cycle line items,
// the four-plan grid with real local plan changes (PUT /api/billing/plan;
// card checkout activates only when Stripe keys exist — stated, not faked),
// seeded demo invoices, and the card on file. The R20S1E1 token meter and
// capability consumption rows keep their contract (spec r20s1_billing).
import { useEffect, useState } from 'react';
import { Btn, PageHeader, Spinner, StatusBadge } from '../components/ui';
import { useRole } from '../components/roles';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const label = { fontFamily: MONO, fontSize: 9.5, fontWeight: 700,
                letterSpacing: '.07em', color: P.muted };
const card = { background: '#fff', border: `1px solid ${P.border}`,
               borderRadius: 10, padding: 16 };

const PLAN_CARDS = [
  ['starter', '$0', ['3 seats · 1 source', '100K tokens/mo', '5 artifacts']],
  ['team', '$149', ['10 seats · 3 sources', '1M tokens/mo', 'Predictive models']],
  ['business', '$499', ['25 seats · 10 sources', '5M tokens/mo', 'RLS + SSO + audit log']],
  ['enterprise', 'Custom', ['Unlimited seats & sources', 'Custom token pools', 'Dedicated support']],
];

export default function Billing() {
  const role = useRole();
  const [usage, setUsage] = useState(null);
  const [ov, setOv] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [methods, setMethods] = useState([]);
  const [msg, setMsg] = useState('');

  const load = () => Promise.all([
    api.billingUsage().then(setUsage),
    api.billingOverview().then(setOv),
    api.billingInvoices().then(d => setInvoices(d.invoices)),
    api.billingPayments().then(d => setMethods(d.methods)),
  ]).catch(() => {});
  useEffect(() => { load(); }, []);

  if (!usage || !ov) {
    return (
      <div data-testid="billing-page"
           style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={24} />
      </div>
    );
  }

  const pct = Math.min(100, usage.cycle.pct);
  const changePlan = async plan => {
    try {
      await api.putBillingPlan(plan);
      setMsg(`Plan changed to ${plan} — takes effect immediately on the local stack.`);
      setTimeout(() => setMsg(''), 5000);
      load();
    } catch { /* noop */ }
  };

  return (
    <div data-testid="billing-page" style={{ maxWidth: 1000 }}>
      <div style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint, marginBottom: 6 }}>
        workspace / billing
      </div>
      <PageHeader title="Billing & usage"
                  sub="Plan, seats, token pool, invoices, and the card on file." />
      {msg && (
        <div style={{ background: P.greenBg, color: P.green, borderRadius: 8,
                      padding: '8px 14px', fontSize: 12.5, fontWeight: 600,
                      fontFamily: FONT, marginBottom: 12 }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12,
                    marginBottom: 12 }}>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div data-testid="plan-name"
                 style={{ fontSize: 24, fontWeight: 700, fontFamily: FONT,
                          color: P.ink, textTransform: 'capitalize' }}>
              {ov.plan}
            </div>
            <StatusBadge status="green">active</StatusBadge>
            <span data-testid="bp-price"
                  style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 18,
                           fontWeight: 700, color: P.ink }}>
              {ov.price_usd == null ? 'Custom' : `$${ov.price_usd}`}
              {ov.price_usd != null && (
                <span style={{ fontSize: 11, color: P.faint, fontWeight: 500 }}>/mo</span>
              )}
            </span>
          </div>
          <div data-testid="bp-renewal"
               style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint, marginTop: 4 }}>
            renews {ov.renewal}
          </div>
          <div data-testid="bp-seats"
               style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginTop: 14 }}>
            <span style={label}>SEATS</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: P.ink, fontFamily: FONT }}>
              {ov.seats.used} of {ov.seats.included} used
            </span>
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint }}>
              {ov.seats.members} member(s) · {ov.seats.invited} pending invite(s)
              {ov.seats.extra_rate_usd ? ` · $${ov.seats.extra_rate_usd}/extra seat` : ''}
            </span>
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span style={label}>INCLUDED TOKENS</span>
              <div data-testid="token-meter"
                   style={{ fontFamily: MONO, fontSize: 14, fontWeight: 600, color: P.ink }}>
                {usage.cycle.tokens_used.toLocaleString()} / {usage.cycle.included.toLocaleString()}
              </div>
              <StatusBadge status={usage.thresholds.status === 'ok' ? 'green' : 'amber'}>
                {usage.thresholds.status}
              </StatusBadge>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: P.grayBg,
                          overflow: 'hidden', marginTop: 6 }}>
              <div style={{ width: `${pct}%`, height: '100%',
                            background: pct > 90 ? P.red : P.accent }} />
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: P.muted, marginTop: 4 }}>
              soft alerts at 50 / 75 / 90% · overage $8 per 100K
            </div>
          </div>
        </div>

        <div data-testid="bp-cycle" style={card}>
          <div style={{ ...label, marginBottom: 8 }}>CURRENT CYCLE</div>
          {ov.cycle.map(li => (
            <div key={li.label}
                 style={{ display: 'flex', padding: '6px 0', fontSize: 12.5,
                          fontFamily: FONT, color: P.body,
                          borderBottom: `1px solid ${P.borderRow}` }}>
              <span>{li.label}</span>
              <span style={{ marginLeft: 'auto', fontFamily: MONO, fontWeight: 600 }}>
                ${li.amount_usd.toFixed(2)}
              </span>
            </div>
          ))}
          <div style={{ display: 'flex', paddingTop: 10 }}>
            <span style={label}>ESTIMATED TOTAL · {ov.renewal}</span>
            <span data-testid="bp-total"
                  style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 14,
                           fontWeight: 700, color: P.ink }}>
              ${ov.estimated_total_usd.toFixed(2)}
            </span>
          </div>
          {!ov.stripe_configured && (
            <div style={{ fontFamily: MONO, fontSize: 9.5, color: P.faint, marginTop: 10 }}>
              local stack — plan changes apply instantly; card checkout activates
              when billing keys are configured
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
                    marginBottom: 12 }}>
        {PLAN_CARDS.map(([plan, price, feats]) => {
          const current = plan === ov.plan;
          return (
            <div key={plan} data-testid={`bp-card-${plan}`}
                 style={{ ...card, border: current
                            ? `2px solid ${P.accent}` : `1px solid ${P.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: P.ink,
                               fontFamily: FONT, textTransform: 'capitalize' }}>
                  {plan}
                </span>
                {current && (
                  <span data-testid="bp-current"
                        style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 8.5,
                                 fontWeight: 700, color: P.accentHover,
                                 background: P.accentSoft, borderRadius: 8,
                                 padding: '2px 7px' }}>
                    CURRENT
                  </span>
                )}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700,
                            color: P.ink, margin: '6px 0' }}>
                {price}{price.startsWith('$') && (
                  <span style={{ fontSize: 10, color: P.faint, fontWeight: 500 }}>/mo</span>
                )}
              </div>
              {feats.map(f => (
                <div key={f} style={{ fontSize: 11.5, color: P.body, fontFamily: FONT,
                                      padding: '2px 0' }}>
                  ✓ {f}
                </div>
              ))}
              <div style={{ marginTop: 10 }}>
                {current ? (
                  <span style={{ fontSize: 11.5, color: P.faint, fontFamily: FONT }}>
                    Your plan
                  </span>
                ) : plan === 'enterprise' ? (
                  <a href="mailto:sales@analytiq.example"
                     style={{ fontSize: 11.5, fontWeight: 600, color: P.accentHover,
                              textDecoration: 'none', fontFamily: FONT }}>
                    Talk to sales
                  </a>
                ) : (
                  <Btn data-testid={`bp-choose-${plan}`} size="sm" variant="outline"
                       disabled={role !== 'admin'}
                       title={role !== 'admin' ? 'Only admins can change the plan' : undefined}
                       onClick={() => changePlan(plan)}>
                    Change plan
                  </Btn>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12,
                    marginBottom: 12 }}>
        <div style={card}>
          <div style={{ ...label, marginBottom: 8 }}>INVOICES</div>
          {invoices.map((inv, i) => (
            <div key={inv.id} data-testid={`bi-row-${i}`}
                 style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.6fr .8fr .6fr',
                          gap: 10, padding: '7px 0', alignItems: 'center',
                          borderBottom: `1px solid ${P.borderRow}` }}>
              <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600,
                             color: P.ink }}>
                {inv.number}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint }}>
                {inv.period_start} → {inv.period_end}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 11.5, color: P.body }}>
                ${inv.amount_usd.toFixed(2)}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700,
                             color: P.green }}>
                {inv.status.toUpperCase()}
              </span>
            </div>
          ))}
          {invoices.length === 0 && (
            <div style={{ padding: 10, fontSize: 12, color: P.muted, fontFamily: FONT }}>
              No invoices yet.
            </div>
          )}
        </div>

        <div style={card}>
          <div style={{ ...label, marginBottom: 8 }}>PAYMENT METHODS</div>
          {methods.map(m => (
            <div key={m.id} data-testid="pm-row"
                 style={{ display: 'flex', gap: 10, alignItems: 'center',
                          padding: '7px 0', borderBottom: `1px solid ${P.borderRow}` }}>
              <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700,
                             color: '#fff', background: P.ink, borderRadius: 4,
                             padding: '3px 7px', textTransform: 'uppercase' }}>
                {m.brand}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 12, color: P.body }}>
                •••• {m.last4}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint }}>
                exp {m.exp}
              </span>
              {m.is_default ? (
                <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 8.5,
                               fontWeight: 700, color: P.accentHover }}>
                  DEFAULT
                </span>
              ) : null}
            </div>
          ))}
          <div style={{ marginTop: 10 }}>
            <Btn size="sm" variant="outline" disabled={!ov.stripe_configured}
                 title={ov.stripe_configured ? undefined
                   : 'Card management opens the Stripe portal once billing keys are configured'}>
              Manage
            </Btn>
          </div>
        </div>
      </div>

      <div style={{ ...card }}>
        <div style={{ ...label, marginBottom: 8 }}>CONSUMPTION BY CAPABILITY</div>
        {usage.by_capability.map(c => (
          <div key={c.capability}
               style={{ display: 'flex', gap: 10, padding: '4px 0', fontSize: 12.5,
                        fontFamily: MONO, color: P.body }}>
            <span style={{ width: 200 }}>{c.capability}</span>
            <span>{(c.tokens || 0).toLocaleString()} tokens</span>
            <span style={{ marginLeft: 'auto', color: P.muted }}>{c.calls} calls</span>
          </div>
        ))}
        {usage.by_capability.length === 0 && (
          <div style={{ padding: 8, fontSize: 12, color: P.muted, fontFamily: FONT }}>
            No metered calls yet this cycle.
          </div>
        )}
      </div>
    </div>
  );
}
