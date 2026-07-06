// R33S2E2-US1 (program R30–R36) — Embed preview (`Artifact Sharing.dc.html`
// frame 03 / ch14): fake-browser live preview over a real signed embed
// token, dark iframe-snippet block with Copy, scope checkboxes (read-only
// locked by design — the render route never mutates; drill-through and
// export ship with later gold/export stories), expiry select, allowed-
// domain chips with server-side origin enforcement, and Save persisting
// through the embed-settings DEP. The preview token additionally allows
// this workspace origin so restricted-domain embeds still preview.
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Btn, PageHeader, Spinner } from '../components/ui';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const label = { fontFamily: MONO, fontSize: 9.5, fontWeight: 600,
                letterSpacing: '.07em', color: P.muted };
const card = { background: '#fff', border: `1px solid ${P.border}`, borderRadius: 10 };

export default function EmbedPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [art, setArt] = useState(null);
  const [settings, setSettings] = useState(null);
  const [embedToken, setEmbedToken] = useState(null);
  const [previewToken, setPreviewToken] = useState(null);
  const [domainDraft, setDomainDraft] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const mint = async s => {
    const clean = { scope: s.scope, expires_in_hours: s.expires_in_hours,
                    allowed_origins: s.allowed_origins };
    const [em, pv] = await Promise.all([
      api.createEmbedToken(id, clean),
      api.createEmbedToken(id, { ...clean,
        allowed_origins: [...(s.allowed_origins || []), window.location.origin] }),
    ]);
    setEmbedToken(em.token);
    setPreviewToken(pv.token);
  };

  useEffect(() => {
    (async () => {
      try {
        const [a, s] = await Promise.all([
          api.getArtifact(id), api.getEmbedSettings(id),
        ]);
        setArt(a);
        setSettings(s);
        await mint(s);
      } catch { setArt(false); }
    })();
  }, [id]);

  if (art === null || settings === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={24} />
      </div>
    );
  }
  if (!art) {
    return (
      <div style={{ maxWidth: 700 }}>
        <PageHeader title="Artifact not found" sub="Nothing to embed." />
        <Btn size="sm" variant="outline" onClick={() => navigate('/app/artifacts')}>
          Back to artifacts
        </Btn>
      </div>
    );
  }
  const domains = settings.allowed_origins.filter(d => d !== '*');
  const snippet = `<iframe src="${window.location.origin}/embed/${embedToken || '…'}" `
    + 'width="100%" height="480" frameborder="0"></iframe>';
  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const saved = await api.putEmbedSettings(id, {
        scope: settings.scope, expires_in_hours: settings.expires_in_hours,
        allowed_origins: domains.length ? domains : ['*'], refresh: 'on_load',
      });
      setSettings(saved);
      await mint(saved);
    } catch { /* surfaced by state */ }
    setSaving(false);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(snippet); } catch { /* headless */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div style={{ maxWidth: 1060 }}>
      <div onClick={() => navigate(`/app/artifacts/${id}`)}
           style={{ fontSize: 12, color: P.accent, cursor: 'pointer', marginBottom: 10,
                    fontFamily: FONT }}>
        &larr; {art.title}
      </div>
      <PageHeader title="Embed preview"
                  sub="Exactly what your portal will render — the token enforces scope, expiry, and allowed domains on every request." />
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
        <div>
          <div data-testid="embed-browser"
               style={{ ...card, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8,
                          padding: '8px 12px', background: P.tableHeadBg,
                          borderBottom: `1px solid ${P.border}` }}>
              <span style={{ display: 'flex', gap: 4 }}>
                {['#f87171', '#fbbf24', '#34d399'].map(c => (
                  <span key={c} style={{ width: 9, height: 9, borderRadius: '50%',
                                         background: c }} />
                ))}
              </span>
              <span data-testid="embed-urlbar"
                    style={{ flex: 1, height: 24, borderRadius: 6, background: '#fff',
                             border: `1px solid ${P.border}`, display: 'flex',
                             alignItems: 'center', padding: '0 10px', fontFamily: MONO,
                             fontSize: 10.5, color: P.muted }}>
                {(domains[0] || 'https://your-site.example.com').replace(/^https?:\/\//, '')}
                /analytics
              </span>
              <span style={{ fontFamily: MONO, fontSize: 9, color: P.faint }}>
                16:9 &middot; iframe
              </span>
            </div>
            {previewToken ? (
              <iframe title="embed preview" src={`/embed/${previewToken}`}
                      style={{ width: '100%', height: 420, border: 'none',
                               display: 'block' }} />
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                <Spinner size={20} />
              </div>
            )}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 9.5, color: P.faint, marginTop: 6 }}>
            preview token additionally allows this workspace origin
          </div>
        </div>

        <div style={{ ...card, padding: 16, alignSelf: 'start' }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: P.ink, fontFamily: FONT,
                        marginBottom: 10 }}>
            Embed settings
          </div>
          <div style={{ ...label, marginBottom: 6 }}>EMBED CODE</div>
          <div data-testid="embed-code"
               style={{ background: P.ink, borderRadius: 8, padding: '10px 12px',
                        fontFamily: MONO, fontSize: 10.5, lineHeight: 1.6,
                        color: '#e2e8f0', wordBreak: 'break-all', marginBottom: 8 }}>
            {snippet}
          </div>
          <Btn data-testid="embed-copy" size="sm" variant="outline" onClick={copy}
               style={{ marginBottom: 14 }}>
            {copied ? 'Copied ✓' : 'Copy'}
          </Btn>

          <div style={{ ...label, marginBottom: 7 }}>TOKEN SCOPE</div>
          {[['scope-readonly', 'Read-only data', true, true,
             'Embeds are read-only by design — the render route never mutates'],
            ['scope-filters', 'Viewer filters', settings.scope === 'interactive', false,
             null],
            ['scope-drill', 'Drill-through', false, true,
             'Drill-through embeds ship with the gold-layer release (R36S1)'],
            ['scope-export', 'Data export', false, true,
             'Export ships with the download formats story']].map(
            ([tid, name, checked, locked, title]) => (
            <label key={tid} title={title || undefined}
                   style={{ display: 'flex', alignItems: 'center', gap: 8,
                            padding: '3px 0', fontSize: 12.5, fontFamily: FONT,
                            color: locked && tid !== 'scope-readonly' ? P.faint : P.body }}>
              <input data-testid={tid} type="checkbox" checked={checked} disabled={locked}
                     onChange={e => tid === 'scope-filters' && setSettings(s => ({
                       ...s, scope: e.target.checked ? 'interactive' : 'read_only' }))} />
              {name}
            </label>
          ))}

          <div style={{ display: 'flex', gap: 14, margin: '12px 0' }}>
            <div>
              <div style={{ ...label, marginBottom: 5 }}>EXPIRES</div>
              <select data-testid="embed-expires" value={String(settings.expires_in_hours)}
                      onChange={e => setSettings(s => ({ ...s,
                        expires_in_hours: Number(e.target.value) }))}
                      style={{ height: 28, borderRadius: 7, fontSize: 11.5,
                               border: `1px solid ${P.borderStrong}`, fontFamily: FONT,
                               padding: '0 6px', background: '#fff' }}>
                <option value="24">24 hours</option>
                <option value="168">7 days</option>
                <option value="720">30 days</option>
                <option value="8760">1 year</option>
              </select>
            </div>
            <div>
              <div style={{ ...label, marginBottom: 5 }}>REFRESH</div>
              <select disabled title="Embeds always render the latest snapshot on load"
                      style={{ height: 28, borderRadius: 7, fontSize: 11.5,
                               border: `1px solid ${P.borderStrong}`, fontFamily: FONT,
                               padding: '0 6px', background: P.tableHeadBg,
                               color: P.faint }}>
                <option>On load</option>
              </select>
            </div>
          </div>

          <div style={{ ...label, marginBottom: 6 }}>ALLOWED DOMAINS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {domains.map((d, i) => (
              <span key={d} data-testid={`domain-chip-${i}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 7,
                             height: 24, padding: '0 10px', borderRadius: 999,
                             border: `1px solid ${P.borderStrong}`, background: '#fff',
                             fontFamily: MONO, fontSize: 10.5, color: P.body }}>
                {d.replace(/^https?:\/\//, '')}
                <span data-testid={`domain-remove-${i}`}
                      onClick={() => setSettings(s => ({ ...s,
                        allowed_origins: s.allowed_origins.filter(x => x !== d) }))}
                      style={{ cursor: 'pointer', color: P.muted }}>
                  &#10005;
                </span>
              </span>
            ))}
            {domains.length === 0 && (
              <span style={{ fontFamily: MONO, fontSize: 10, color: P.faint }}>
                any domain (*)
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            <input data-testid="domain-input" value={domainDraft}
                   onChange={e => setDomainDraft(e.target.value)}
                   placeholder="Add domain…"
                   style={{ flex: 1, height: 28, borderRadius: 7,
                            border: `1px solid ${P.borderStrong}`, padding: '0 10px',
                            fontSize: 11.5, fontFamily: MONO, outline: 'none' }} />
            <Btn data-testid="domain-add" size="sm" variant="outline"
                 disabled={!domainDraft}
                 onClick={() => {
                   setSettings(s => ({ ...s,
                     allowed_origins: [...s.allowed_origins.filter(x => x !== '*'),
                                       domainDraft] }));
                   setDomainDraft('');
                 }}>
              Add
            </Btn>
          </div>
          <Btn data-testid="embed-save" full onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save embed settings'}
          </Btn>
        </div>
      </div>
    </div>
  );
}
