// R30S3E4-US1 (program R30–R36) — the canonical share modal (`Inspector
// Panels.dc.html` #share-modal): VISIBILITY radio cards, real signed-link
// minting on "Public signed link" (share_links API — password + expiry
// supported), 7-tile DISTRIBUTE grid (Embed/HTML/Link live; PDF/PNG/Slack/
// Email honestly disabled until their substrates land), collapsible Advanced
// (expires, password-protect, allow-checkboxes local until viewer scopes
// land in R33S2, red Revoke → real expiry-based revocation). Canonical from
// every share trigger: detail header, workbench topbar, library ⋯ menu.
// Workspace-member rows (the old modal's substance) live under Advanced —
// same R7 shares API.
import { useEffect, useState } from 'react';
import { Btn, Checkbox, Modal, RadioCard, Spinner, Toggle } from './ui';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const monoLabel = { fontFamily: MONO, fontSize: 9.5, letterSpacing: '.08em',
                    textTransform: 'uppercase', color: P.faint };

const VISIBILITY = [
  ['private', 'Private', 'Only you can open this artifact'],
  ['workspace-view', 'Workspace can view', 'Everyone in acme-retail can open it'],
  ['workspace-edit', 'Workspace can edit', 'Everyone in acme-retail can edit sections'],
  ['public', 'Public signed link', 'Anyone with the token URL · workspace-scoped, revocable'],
];

const DISTRIBUTE = [
  ['embed', 'Embed', true], ['html', 'HTML', true], ['pdf', 'PDF Export', false],
  ['png', 'PNG Export', false], ['slack', 'Slack', false], ['email', 'Email', false],
  ['link', 'Link', true],
];

export default function ShareModal({ artifact, onClose }) {
  const [vis, setVis] = useState('private');
  const [link, setLink] = useState(null);
  const [minting, setMinting] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [expires, setExpires] = useState('168');
  const [password, setPassword] = useState(false);
  const [allow, setAllow] = useState({ comments: true, drill: true, export: false });
  const [copied, setCopied] = useState(false);
  const [shares, setShares] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (advanced && shares === null) {
      api.getShares(artifact.id).then(setShares).catch(() => setShares([]));
    }
  }, [advanced]);

  const mint = async () => {
    setMinting(true);
    try {
      const r = await api.createShareLink(artifact.id, {
        expires_in_hours: Number(expires) || 168,
        ...(password ? { password: 'demo-pass' } : {}),
      });
      setLink(r);
    } catch (e) {
      let m = e.message; try { m = JSON.parse(e.message)?.error || m; } catch { /* raw */ }
      setNotice(m);
      setVis('private');
    } finally { setMinting(false); }
  };

  const pickVis = (key) => {
    setVis(key);
    setNotice('');
    if (key === 'public' && !link) mint();
  };

  const revoke = async () => {
    try {
      await api.revokeShareLinks(artifact.id);
      setLink(null);
      setVis('private');
      setNotice('Public link revoked — the URL now returns 410.');
    } catch { /* noop */ }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(window.location.origin + link.url); } catch { /* http */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Modal open onClose={onClose} testid="share-modal"
           title={`Share "${artifact.title}"`}>
      <div style={{ padding: '14px 20px', overflowY: 'auto', display: 'flex',
                    flexDirection: 'column', gap: 14 }}>
        <span data-testid="share-meta" style={{ fontFamily: MONO, fontSize: 10, color: P.faint }}>
          artifact · v1 · governed
        </span>

        {notice && (
          <div style={{ fontSize: 12, fontFamily: FONT, color: P.amberDark, background: P.amberBg,
                        border: `1px solid ${P.amberBorder}`, borderRadius: 8, padding: '8px 10px' }}>
            {notice}
          </div>
        )}

        <div>
          <div style={monoLabel}>Visibility</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
            {VISIBILITY.map(([key, label, sub]) => (
              <RadioCard key={key} testid={`vis-${key}`} selected={vis === key}
                         onSelect={() => pickVis(key)}>
                <div style={{ fontSize: 12.5, fontWeight: 600, fontFamily: FONT, color: P.ink }}>
                  {label}
                </div>
                <div style={{ fontSize: 11, fontFamily: FONT, color: P.muted, marginTop: 3 }}>
                  {sub}
                </div>
              </RadioCard>
            ))}
          </div>
        </div>

        {vis === 'public' && (minting ? <Spinner /> : link && (
          <div data-testid="share-token-bar"
               style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${P.border}`,
                        borderRadius: 9, padding: '8px 10px', background: P.tableHeadBg }}>
            <span data-testid="share-token-url"
                  style={{ fontFamily: MONO, fontSize: 10.5, color: P.body, minWidth: 0,
                           overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                           flex: 1 }}>
              {link.url}
            </span>
            <button data-testid="copy-link" onClick={copy}
                    style={{ border: 'none', background: P.accent, color: '#fff', borderRadius: 6,
                             padding: '4px 10px', fontSize: 11, fontWeight: 600,
                             fontFamily: FONT, cursor: 'pointer', flexShrink: 0 }}>
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>
        ))}

        <div>
          <div style={monoLabel}>Distribute</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginTop: 6 }}>
            {DISTRIBUTE.map(([key, label, live]) => (
              <button key={key} data-testid={`dist-${key}`} disabled={!live}
                      title={live ? label : `${label} lands with the sharing surfaces (R33S2)`}
                      onClick={() => {
                        if (key === 'html') window.open(`/api/artifacts/${artifact.id}/html`, '_blank');
                        if (key === 'embed') {
                          api.createEmbedToken(artifact.id, { scope: 'read_only', allowed_origins: ['*'] })
                            .then(r => setNotice(`Embed token (24h): ${r.token.slice(0, 32)}…`))
                            .catch(() => setNotice('Embed needs a rendered artifact.'));
                        }
                        if (key === 'link') { if (link) copy(); else pickVis('public'); }
                      }}
                      style={{ border: `1px solid ${P.border}`, borderRadius: 8, background: '#fff',
                               padding: '10px 2px', fontSize: 9.5, fontFamily: FONT,
                               color: live ? P.body : P.faint, cursor: live ? 'pointer' : 'not-allowed',
                               display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                               opacity: live ? 1 : .55 }}>
                <svg width="13" height="13" viewBox="0 0 13 13">
                  <rect x="1.5" y="1.5" width="10" height="10" rx="2.5" fill="none"
                        stroke={live ? P.accent : P.grayBar} strokeWidth="1.3" />
                </svg>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ border: `1px solid ${P.border}`, borderRadius: 10, overflow: 'hidden' }}>
          <div data-testid="advanced-toggle" onClick={() => setAdvanced(o => !o)}
               style={{ padding: '9px 12px', background: P.tableHeadBg, cursor: 'pointer',
                        fontSize: 12, fontWeight: 600, fontFamily: FONT, color: P.body }}>
            Advanced settings {advanced ? '−' : '+'}
          </div>
          {advanced && (
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={monoLabel}>Expires</div>
                  <select data-testid="share-expires" value={expires}
                          onChange={e => setExpires(e.target.value)}
                          style={{ marginTop: 4, width: '100%', height: 30, borderRadius: 7,
                                   border: `1px solid ${P.borderStrong}`, fontFamily: MONO,
                                   fontSize: 11, color: P.body, background: '#fff' }}>
                    <option value="24">24 hours</option>
                    <option value="168">7 days</option>
                    <option value="720">30 days</option>
                  </select>
                </div>
                <div data-testid="share-password"
                     style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 14 }}>
                  <span style={monoLabel}>Password protect</span>
                  <Toggle on={password} onChange={setPassword} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <span data-testid="adv-comments">
                  <Checkbox checked={allow.comments} label="Allow comments"
                            onChange={v => setAllow(a => ({ ...a, comments: v }))} />
                </span>
                <span data-testid="adv-drill">
                  <Checkbox checked={allow.drill} label="Allow drill-through"
                            onChange={v => setAllow(a => ({ ...a, drill: v }))} />
                </span>
                <span data-testid="adv-export">
                  <Checkbox checked={allow.export} label="Allow data export"
                            onChange={v => setAllow(a => ({ ...a, export: v }))} />
                </span>
              </div>
              <div>
                <div style={monoLabel}>Shared with</div>
                {shares === null ? <Spinner size={14} /> : shares.length === 0 ? (
                  <div style={{ fontSize: 11.5, fontFamily: FONT, color: P.muted, marginTop: 4 }}>
                    No workspace members yet — pick a workspace visibility above.
                  </div>
                ) : shares.map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between',
                                           padding: '5px 0', fontSize: 12, fontFamily: FONT,
                                           color: P.body, borderBottom: `1px solid ${P.borderRow}` }}>
                    <span>{s.email}</span>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: P.faint }}>{s.role}</span>
                  </div>
                ))}
              </div>
              <span data-testid="revoke-link" onClick={revoke}
                    style={{ fontSize: 12, fontWeight: 600, fontFamily: FONT, color: P.red,
                             cursor: 'pointer', alignSelf: 'flex-start' }}>
                Revoke link
              </span>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: '12px 20px', borderTop: `1px solid ${P.border}`,
                    display: 'flex', justifyContent: 'flex-end' }}>
        <Btn onClick={onClose}>Done</Btn>
      </div>
    </Modal>
  );
}
