// R32S1E4-US1 (program R30–R36) — Data Quality Rules master-detail
// (`Governance.dc.html` frame 04 / ch15): rules table with typed pills,
// live thresholds and ON toggles over the merged /api/dq/rules catalog;
// editor panel with rule-type dropdown, target/threshold, admin-only
// custom SQL (compiled read-only server-side), and block-on-failure —
// every setting persists through the real rules API and is audited.
// Replaces the S13 raw-config strip 1:1 for DQ configuration.
import { useEffect, useState } from 'react';
import { Btn, PageHeader, Spinner } from '../components/ui';
import { Forbidden, useRole } from '../components/roles';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const TYPE_LABEL = {
  pk_uniqueness: 'primary key', null_rate_for_key_columns: 'null threshold',
  freshness_sla: 'freshness SLA', row_count_minimum: 'row count',
  distribution_shift: 'drift (3σ)', pii_detection: 'PII',
  schema_fingerprint: 'schema', custom: 'custom test',
};

const SEV_TINT = {
  critical: [P.redBg, P.red], warning: [P.amberBg, P.amber],
  custom: [P.accentSoft, P.accentHover],
};

function Toggle({ on, onFlip }) {
  return (
    <span data-testid="rule-toggle" data-on={String(on)} onClick={onFlip}
          style={{ display: 'inline-flex', alignItems: 'center', width: 34, height: 19,
                   borderRadius: 999, cursor: 'pointer', padding: 2, boxSizing: 'border-box',
                   background: on ? P.green : P.borderStrong, transition: 'background .15s' }}>
      <span style={{ width: 15, height: 15, borderRadius: '50%', background: '#fff',
                     transform: on ? 'translateX(15px)' : 'none', transition: 'transform .15s' }} />
    </span>
  );
}

export default function GovernanceRules() {
  const role = useRole();
  const [cid, setCid] = useState(null);
  const [rules, setRules] = useState(null);
  const [sel, setSel] = useState(null);       // rule_id | 'new' | null
  const [block, setBlock] = useState(false);
  const [type, setType] = useState('pk_uniqueness');
  const [target, setTarget] = useState('');
  const [sqlExpr, setSqlExpr] = useState('');
  const [err, setErr] = useState('');

  const load = async (connId) => {
    try {
      const r = await api.getDqRules(connId);
      setRules(r.rules || []);
    } catch { setRules([]); }
  };
  useEffect(() => {
    (async () => {
      try {
        const latest = await api.governanceLatest();
        const connId = latest.connection_id;
        setCid(connId);
        if (connId) await load(connId); else setRules([]);
      } catch { setRules([]); }
    })();
  }, []);

  if (role !== 'admin') return <Forbidden />;

  const selected = (rules || []).find(r => r.rule_id === sel);
  const openRule = r => {
    setSel(r.rule_id);
    setType(r.kind === 'custom' ? 'custom' : r.rule_id);
    setBlock(!!r.block_on_failure);
    setTarget(r.kind === 'custom' ? (r.table || '') : 'all cataloged tables');
    setSqlExpr(r.kind === 'custom' ? r.rule_name : '');
    setErr('');
  };
  const openNew = () => {
    setSel('new'); setType('custom'); setBlock(false);
    setTarget(''); setSqlExpr(''); setErr('');
  };
  const flip = async r => {
    try {
      await api.putDqRule(r.rule_id, { connectionId: cid, enabled: !r.enabled });
      load(cid);
    } catch { /* keep view */ }
  };
  const save = async () => {
    setErr('');
    try {
      if (sel === 'new') {
        if (type !== 'custom') { setErr('System rules already exist — pick one from the list to tune it.'); return; }
        if (!target || !sqlExpr) { setErr('Custom tests need a target table and an expression.'); return; }
        await api.createDqTest({ connectionId: cid, table: target, expression: sqlExpr });
      } else if (selected) {
        await api.putDqRule(selected.rule_id,
          { connectionId: cid, enabled: selected.enabled, block_on_failure: block });
      }
      setSel(null);
      load(cid);
    } catch (e) {
      let m = e.message; try { m = JSON.parse(e.message)?.error || m; } catch { /* raw */ }
      setErr(m);
    }
  };

  const editorOpen = sel !== null && (sel === 'new' || selected);

  return (
    <div style={{ maxWidth: 1100 }}>
      <PageHeader title="Data quality rules"
                  sub="What the gate engine enforces before anything ships — tune, disable, or add read-only custom tests." />
      <div style={{ display: 'grid',
                    gridTemplateColumns: editorOpen ? '1.5fr 1fr' : '1fr', gap: 14 }}>
        <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 10,
                      overflow: 'hidden', alignSelf: 'start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px',
                        borderBottom: `1px solid ${P.border}` }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: P.ink, fontFamily: FONT }}>
              Quality rules
            </span>
            <span data-testid="rules-count"
                  style={{ display: 'inline-flex', alignItems: 'center', height: 18,
                           padding: '0 7px', borderRadius: 999, background: P.tableHeadBg,
                           color: P.muted, fontFamily: MONO, fontSize: 10, fontWeight: 600 }}>
              {(rules || []).length}
            </span>
            <Btn data-testid="add-rule" size="sm" variant="outline"
                 style={{ marginLeft: 'auto' }} onClick={openNew}>
              + Add rule
            </Btn>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 50px', gap: 10,
                        padding: '0 16px', height: 34, alignItems: 'center',
                        background: P.tableHeadBg, borderBottom: `1px solid ${P.border}`,
                        fontFamily: MONO, fontSize: 9.5, fontWeight: 600,
                        letterSpacing: '.06em', color: P.muted }}>
            <span>RULE</span><span>TYPE</span><span>THRESHOLD</span><span>ON</span>
          </div>
          {rules === null ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 26 }}>
              <Spinner size={20} />
            </div>
          ) : rules.length === 0 ? (
            <div style={{ padding: 16, fontSize: 12.5, color: P.muted, fontFamily: FONT }}>
              Run governance on a connection first — the gate rules attach to it.
            </div>
          ) : rules.map(r => {
            const [bg, fg] = SEV_TINT[r.severity] || [P.tableHeadBg, P.muted];
            return (
              <div key={r.rule_id} data-testid={`rule-row-${r.rule_id}`}
                   style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 50px',
                            gap: 10, padding: '9px 16px', alignItems: 'center',
                            borderBottom: `1px solid ${P.borderRow}`,
                            background: sel === r.rule_id ? '#f8faff' : '#fff' }}>
                <span data-testid="rule-name" onClick={() => openRule(r)}
                      style={{ fontSize: 12.5, fontWeight: 600, color: P.ink, fontFamily: FONT,
                               cursor: 'pointer', overflow: 'hidden',
                               textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.kind === 'custom' ? `${r.table} · custom test` : r.rule_name}
                </span>
                <span data-testid="rule-type-pill"
                      style={{ display: 'inline-flex', alignItems: 'center', height: 18,
                               padding: '0 8px', borderRadius: 999, background: bg, color: fg,
                               fontFamily: MONO, fontSize: 8.5, fontWeight: 600,
                               letterSpacing: '.04em', justifySelf: 'start',
                               whiteSpace: 'nowrap' }}>
                  {TYPE_LABEL[r.kind === 'custom' ? 'custom' : r.rule_id] || r.rule_id}
                </span>
                <span data-testid="rule-threshold"
                      style={{ fontFamily: MONO, fontSize: 10.5, color: P.body }}>
                  {r.threshold}
                </span>
                <Toggle on={r.enabled} onFlip={() => flip(r)} />
              </div>
            );
          })}
        </div>

        {editorOpen && (
          <div data-testid="rule-editor"
               style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 10,
                        padding: 16, alignSelf: 'start' }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: P.ink, fontFamily: FONT,
                          marginBottom: 12 }}>
              {sel === 'new' ? 'Add rule' : 'Edit rule'}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 600, color: P.muted,
                          letterSpacing: '.06em', marginBottom: 5 }}>RULE TYPE</div>
            <select data-testid="rule-type-select" value={type}
                    disabled={sel !== 'new'}
                    onChange={e => setType(e.target.value)}
                    style={{ width: '100%', height: 32, borderRadius: 7, marginBottom: 12,
                             border: `1px solid ${P.borderStrong}`, padding: '0 8px',
                             fontSize: 12, fontFamily: FONT, background: '#fff' }}>
              {['pk_uniqueness', 'null_rate_for_key_columns', 'freshness_sla',
                'row_count_minimum', 'distribution_shift', 'pii_detection',
                'schema_fingerprint', 'custom'].map(t => (
                <option key={t} value={t}>
                  {(TYPE_LABEL[t] || t).charAt(0).toUpperCase() + (TYPE_LABEL[t] || t).slice(1)}
                </option>
              ))}
            </select>
            <div style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 600, color: P.muted,
                          letterSpacing: '.06em', marginBottom: 5 }}>TARGET</div>
            <input data-testid="rule-target-input" value={target}
                   disabled={type !== 'custom'}
                   title={type !== 'custom' ? 'System gates evaluate every cataloged table' : undefined}
                   placeholder="physical table"
                   onChange={e => setTarget(e.target.value)}
                   style={{ width: '100%', height: 32, borderRadius: 7, marginBottom: 12,
                            boxSizing: 'border-box', border: `1px solid ${P.borderStrong}`,
                            padding: '0 10px', fontSize: 12, fontFamily: MONO,
                            color: P.ink, outline: 'none',
                            background: type !== 'custom' ? P.tableHeadBg : '#fff' }} />
            <div style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 600, color: P.muted,
                          letterSpacing: '.06em', marginBottom: 5 }}>THRESHOLD</div>
            <input data-testid="rule-threshold-input"
                   value={sel === 'new' ? '0 violations' : (selected?.threshold || '')}
                   disabled readOnly
                   title="Fixed by the gate engine — per-table SLAs and contracts tune the inputs"
                   style={{ width: '100%', height: 32, borderRadius: 7, marginBottom: 12,
                            boxSizing: 'border-box', border: `1px solid ${P.borderStrong}`,
                            padding: '0 10px', fontSize: 12, fontFamily: MONO,
                            color: P.muted, background: P.tableHeadBg, outline: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 5 }}>
              <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 600, color: P.muted,
                             letterSpacing: '.06em' }}>CUSTOM TEST</span>
              <span style={{ fontSize: 10.5, color: P.faint, fontFamily: FONT }}>(optional)</span>
            </div>
            <textarea data-testid="custom-sql-input" value={sqlExpr}
                      disabled={type !== 'custom'}
                      placeholder="amount > 0 · col IS NOT NULL"
                      onChange={e => setSqlExpr(e.target.value)}
                      style={{ width: '100%', minHeight: 64, boxSizing: 'border-box',
                               borderRadius: 8, border: 'none', background: P.ink,
                               color: type === 'custom' ? '#e2e8f0' : P.faint,
                               padding: '9px 11px', fontSize: 11.5, lineHeight: 1.6,
                               fontFamily: MONO, resize: 'vertical', outline: 'none',
                               opacity: type === 'custom' ? 1 : 0.75 }} />
            <div data-testid="custom-sql-note"
                 style={{ fontFamily: MONO, fontSize: 9.5, color: P.faint, margin: '5px 0 12px' }}>
              admin only · runs read-only
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
                            fontSize: 12.5, color: P.body, fontFamily: FONT,
                            cursor: 'pointer' }}>
              <input data-testid="block-on-failure" type="checkbox" checked={block}
                     disabled={sel === 'new'}
                     onChange={e => setBlock(e.target.checked)} />
              Block artifacts on failure
            </label>
            {err && (
              <div style={{ fontSize: 11.5, color: P.red, fontFamily: FONT, marginBottom: 10 }}>
                {err}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn data-testid="rule-save" size="sm" onClick={save}>Save rule</Btn>
              <Btn size="sm" variant="ghost" onClick={() => setSel(null)}>Cancel</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
