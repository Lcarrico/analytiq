// R36S2E2-US1 (program R30–R36) — Admin overview + roles matrix
// (`Admin.dc.html` frames 01–02 / PRD §8 audit-first, admin-gated).
// Overview: nine KPI cards over the live admin aggregate. Roles: the
// permissions matrix over the roles kv DEP — every cell change applies
// immediately and is written to the audit log; the owner column is locked.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Spinner } from '../components/ui';
import { Forbidden, useRole } from '../components/roles';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const label = { fontFamily: MONO, fontSize: 9.5, fontWeight: 600,
                letterSpacing: '.07em', color: P.muted };
const card = { background: '#fff', border: `1px solid ${P.border}`, borderRadius: 10 };

export function AdminOverview() {
  const role = useRole();
  const navigate = useNavigate();
  const [d, setD] = useState(null);

  useEffect(() => {
    api.adminOverview().then(setD).catch(() => setD(false));
  }, []);

  if (role !== 'admin') return <Forbidden />;
  if (!d) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={24} />
      </div>
    );
  }
  const cards = [
    ['users', 'USERS', d.users.total,
     `${d.users.active} active · ${d.users.invited} invites pending`, '/app/team'],
    ['roles', 'ROLES', d.roles.total,
     `${d.roles.overrides} customized · matrix live`, '/app/admin/roles'],
    ['integrations', 'INTEGRATIONS', d.integrations.total,
     `${d.integrations.healthy} healthy`, '/app/data/sources'],
    ['backlog', 'GOVERNANCE BACKLOG', d.governance_backlog.total,
     Object.entries(d.governance_backlog.by_type)
       .map(([k, v]) => `${v} ${k.toLowerCase()}`).join(' · ') || 'clear',
     '/app/governance/review'],
    ['audit', 'AUDIT EVENTS · 24H', d.audit_24h.total,
     `${d.audit_24h.flagged} flagged · export ready`, '/app/admin/security'],
    ['tokens', 'TOKEN USAGE', `${d.token_usage.pct}%`,
     `${d.token_usage.used.toLocaleString('en-US')} / ${d.token_usage.cap.toLocaleString('en-US')}`,
     '/app/admin/usage'],
    ['security', 'SECURITY WARNINGS', d.security_warnings.total,
     d.security_warnings.notes[0] || 'nothing flagged', '/app/admin/security'],
    ['links', 'ACTIVE SHARE LINKS', d.share_links.total, 'all scoped + expiring', '/app/admin/security'],
    ['sso', 'SSO', d.sso.status,
     d.sso.status === 'LOCAL' ? 'password sign-in · configure SAML'
       : 'identity provider connected', '/app/admin/sso'],
  ];

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint, marginBottom: 6 }}>
        workspace / admin
      </div>
      <PageHeader title="Workspace administration"
                  sub="The control plane — people, access, integrations, and the audit trail behind all of it." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {cards.map(([key, name, v, sub, to]) => (
          <div key={key} data-testid={`ao-card-${key}`}
               onClick={() => to && navigate(to)}
               style={{ ...card, padding: '14px 16px',
                        cursor: to ? 'pointer' : 'default' }}>
            <div style={label}>{name}</div>
            <div style={{ fontSize: 23, fontWeight: 700, color: P.ink, fontFamily: FONT,
                          margin: '5px 0 3px' }}>
              {v}
            </div>
            <div style={{ fontSize: 11, color: P.faint, fontFamily: FONT }}>{sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RolesMatrix() {
  const role = useRole();
  const [d, setD] = useState(null);

  const load = () => api.rolesMatrix().then(setD).catch(() => setD(false));
  useEffect(() => { load(); }, []);

  if (role !== 'admin') return <Forbidden />;
  if (!d) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={24} />
      </div>
    );
  }
  const toggle = async (perm, r_, granted) => {
    try {
      await api.patchRolesMatrix({ permission: perm, role: r_, granted: !granted });
      load();
    } catch { /* owner locked server-side too */ }
  };

  return (
    <div style={{ maxWidth: 940 }}>
      <PageHeader title="Roles & permissions"
                  sub="Changes apply immediately and are written to the audit log." />
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ display: 'grid',
                      gridTemplateColumns: `2fr repeat(${d.roles.length}, 1fr)`,
                      gap: 6, padding: '0 16px', height: 36, alignItems: 'center',
                      background: P.tableHeadBg, borderBottom: `1px solid ${P.border}`,
                      ...label }}>
          <span>PERMISSION</span>
          {d.roles.map(r_ => <span key={r_}>{r_.toUpperCase()}</span>)}
        </div>
        {d.permissions.map(perm => (
          <div key={perm} data-testid={`perm-row-${perm.replace(/\s+/g, '-')}`}
               style={{ display: 'grid',
                        gridTemplateColumns: `2fr repeat(${d.roles.length}, 1fr)`,
                        gap: 6, padding: '8px 16px', alignItems: 'center',
                        borderBottom: `1px solid ${P.borderRow}` }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 12.5, color: P.ink, fontFamily: FONT }}>
                {perm}
              </span>
              {d.sensitive.includes(perm) && (
                <span data-testid="perm-sensitive"
                      style={{ display: 'inline-flex', alignItems: 'center', height: 15,
                               padding: '0 6px', borderRadius: 999,
                               background: P.amberBg, color: P.amber, fontFamily: MONO,
                               fontSize: 7.5, fontWeight: 700 }}>
                  SENSITIVE
                </span>
              )}
            </span>
            {d.roles.map(r_ => (
              <input key={r_}
                     data-testid={`cell-${perm.replace(/\s+/g, '-')}-${r_}`}
                     type="checkbox" checked={d.matrix[perm][r_]}
                     disabled={r_ === 'owner'}
                     onChange={() => toggle(perm, r_, d.matrix[perm][r_])} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
