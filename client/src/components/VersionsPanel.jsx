// R30S3E5-US1 (program R30–R36) — Version history panel (`Inspector
// Panels.dc.html` #version-history), opened from the session-topbar Versions
// button. Timeline over the real artifact_files history; human dependency
// chips derived from the provenance chain (spec blue · gold amber · model
// teal) — content hashes never render (PRD §5.1). Restore is append-only
// (restoring vN mints a new top version); Compare opens that version's html.
import { useEffect, useState } from 'react';
import { Avatar, Btn, Drawer, Spinner } from './ui';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

function rel(ts) {
  if (!ts) return 'just now';
  const t = new Date(String(ts).includes('T') ? ts : ts.replace(' ', 'T') + 'Z');
  const s = Math.max(0, (Date.now() - t.getTime()) / 1000);
  if (s < 90) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

const CHIP_STYLES = {
  spec:  { bg: '#eff4ff', fg: '#1d4ed8' },
  gold:  { bg: '#fdf9ef', fg: '#b45309' },
  model: { bg: '#e0f3f8', fg: '#0e7490' },
};

export default function VersionsPanel({ artifact, onClose }) {
  const [versions, setVersions] = useState(null);
  const [chips, setChips] = useState([]);

  const load = () => api.getArtifactVersions(artifact.id).then(setVersions).catch(() => setVersions([]));
  useEffect(() => {
    load();
    api.provenance(artifact.id).then(r => {
      const out = [];
      (r.chain || []).forEach(c => {
        const t = (c.artifact_type || '').toLowerCase();
        if (t.includes('spec')) out.push(['spec', `spec v${c.version}`]);
        else if (t.includes('gold')) out.push(['gold', `gold v${c.version}`]);
        else if (t.includes('model')) out.push(['model', `model v${c.version}`]);
      });
      setChips(out.slice(0, 4));
    }).catch(() => {});
  }, [artifact.id]);

  return (
    <Drawer open onClose={onClose} title="Version history"
            headerExtra={
              <span data-testid="versions-count"
                    style={{ fontFamily: MONO, fontSize: 10, color: P.faint }}>
                {versions == null ? '…' : `${versions.length} version${versions.length === 1 ? '' : 's'}`}
              </span>
            }>
      <div data-testid="versions-panel"
           style={{ display: 'flex', flexDirection: 'column', padding: '4px 2px' }}>
        {versions == null ? <Spinner /> : versions.map((v, i) => (
          <div key={v.version} data-testid={`version-row-${v.version}`}
               style={{ display: 'flex', gap: 10, padding: '10px 0',
                        borderBottom: `1px solid ${P.borderRow}` }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar initials={(artifact.owner || 'an').split('@')[0].slice(0, 2).toUpperCase()}
                      size={26} />
              {i < versions.length - 1 && (
                <span style={{ flex: 1, width: 1, background: P.borderRow, marginTop: 6 }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, fontFamily: FONT, color: P.ink }}>
                  v{v.version}{i === 0 ? ' · current' : ''}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 9.5, color: P.faint }}>
                  {rel(v.created_at)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {chips.map(([kind, label], n) => (
                  <span key={n} data-testid="dep-chip"
                        style={{ display: 'inline-flex', alignItems: 'center', height: 16,
                                 padding: '0 7px', borderRadius: 999, fontFamily: MONO,
                                 fontSize: 8.5, fontWeight: 600,
                                 background: CHIP_STYLES[kind].bg, color: CHIP_STYLES[kind].fg }}>
                    {label}
                  </span>
                ))}
              </div>
              {i > 0 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                  <Btn size="sm" variant="outline" data-testid="version-restore"
                       onClick={async () => {
                         try { await api.restoreArtifactVersion(artifact.id, v.version); load(); }
                         catch { /* noop */ }
                       }}>Restore</Btn>
                  <Btn size="sm" variant="outline" data-testid="version-compare"
                       onClick={() => window.open(`/api/artifacts/${artifact.id}/html?version=${v.version}`, '_blank')}>
                    Compare
                  </Btn>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Drawer>
  );
}
