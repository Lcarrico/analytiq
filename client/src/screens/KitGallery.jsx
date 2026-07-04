// R21S1E2-US1/US2 — /app/__kit: every primitive rendered beside its §0.2 spec
// (dev gallery; the parity screenshot pair is captured from this page).
import { useState } from 'react';
import { FONT, MONO, P } from '../tokens';
import {
  Avatar, AvatarStack, Badge, BarRow, Btn, Card, Checkbox, CodeBlock, DataTable,
  Donut, FieldLabel, FilterChips, Input, KpiCard, LogLine, Modal, PageHeader,
  ProgressBar, RadioCard, SectionLabel, Select, Sparkline, StatusBadge, Tabs,
  Toggle, ViewToggle,
} from '../components/ui';

function Spec({ children }) {
  return <div style={{ fontFamily: MONO, fontSize: 9.5, color: P.faint, margin: '6px 0 10px' }}>{children}</div>;
}
function Block({ title, spec, children }) {
  return (
    <Card style={{ breakInside: 'avoid' }}>
      <div style={{ fontSize: 13, fontWeight: 600, fontFamily: FONT, color: P.ink }}>{title}</div>
      <Spec>{spec}</Spec>
      {children}
    </Card>
  );
}

export default function KitGallery() {
  const [tab, setTab] = useState('Dashboard');
  const [chip, setChip] = useState('All');
  const [tOn, setTOn] = useState(true);
  const [check, setCheck] = useState(true);
  const [radio, setRadio] = useState('public');
  const [view, setView] = useState('cards');
  const [modal, setModal] = useState(false);

  return (
    <div data-testid="kit-gallery">
      <PageHeader crumb="acme-retail / __kit" title="Primitive kit" count={22}
                  actions={<Btn data-testid="kit-open-modal" onClick={() => setModal(true)}>Open modal</Btn>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <Block title="Badge" spec="pill h20 r999 mono 10/600 upper ls.04em · 6 tints + dot">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Badge data-testid="kit-badge-green" tint="green" dot>Healthy</Badge>
            <Badge tint="amber" dot>2 warnings</Badge>
            <Badge tint="red">Blocked</Badge>
            <Badge tint="purple">Predictive</Badge>
            <Badge tint="blue">v14</Badge>
            <Badge tint="gray">n/a</Badge>
          </div>
        </Block>
        <Block title="Btn" spec="h34 r8 13/600 · primary #2563eb · secondary #fff+#d4d9e1 · ghost · destructive">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Btn data-testid="kit-btn-primary">Share</Btn>
            <Btn data-testid="kit-btn-secondary" variant="secondary">Duplicate</Btn>
            <Btn variant="ghost">Ghost</Btn>
            <Btn variant="destructive">Revoke link</Btn>
            <Btn size="lg">Hero h40</Btn>
            <Btn size="sm" variant="secondary">Inline h28</Btn>
          </div>
        </Block>
        <Block title="StatusBadge / GateDot" spec="R15 API kept; dot always">
          <div style={{ display: 'flex', gap: 6 }}>
            <StatusBadge status="green">Connected</StatusBadge>
            <StatusBadge status="amber">At risk</StatusBadge>
            <StatusBadge status="red">Failing</StatusBadge>
          </div>
        </Block>
        <Block title="Card / KpiCard" spec="r10 border #e4e8ef p20 · KPI: micro label → mono 26 → sub">
          <Card data-testid="kit-card" style={{ marginBottom: 10 }}>Plain card</Card>
          <KpiCard label="Tables blocked" value={<span data-testid="kit-kpi-value">3</span>} sub="2 need review" />
        </Block>
        <Block title="Tabs" spec="12.5px · active 600 #1d4ed8 + 2px #2563eb underline">
          <div data-testid="kit-tabs">
            <Tabs tabs={['Dashboard', 'Insights', 'Pipeline']} active={tab} onChange={setTab} />
          </div>
        </Block>
        <Block title="FilterChips" spec="h26 pills · count sub-pill (review-queue)">
          <FilterChips options={[{ label: 'All', count: 12 }, { label: 'PII', count: 3 }, 'Drift']}
                       active={chip} onChange={setChip} />
        </Block>
        <Block title="Form controls" spec="h36 r8 border #d4d9e1 13px · label 11.5/600 · mono variant">
          <FieldLabel>Table name</FieldLabel>
          <Input data-testid="kit-input" mono defaultValue="RAW.ORDERS_2026" />
          <div style={{ height: 10 }} />
          <Select mono defaultValue="ANALYTICS"><option>ANALYTICS</option><option>RAW</option></Select>
        </Block>
        <Block title="Toggle / Checkbox" spec="34×20 pill on #2563eb off #cbd5e1 · box 15 r4">
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <Toggle testid="kit-toggle-on" on={tOn} onChange={setTOn} />
            <Toggle testid="kit-toggle-off" on={!tOn ? true : false} onChange={() => {}} />
            <Checkbox checked={check} onChange={setCheck} label="Allow export" />
          </div>
        </Block>
        <Block title="RadioCard" spec="selected 2px #2563eb + #f8faff (share visibility)">
          <div style={{ display: 'grid', gap: 8 }}>
            <RadioCard testid="kit-radiocard-selected" selected={radio === 'public'}
                       onSelect={() => setRadio('public')}>
              <b style={{ fontSize: 12.5 }}>Public signed link</b>
            </RadioCard>
            <RadioCard selected={radio === 'private'} onSelect={() => setRadio('private')}>
              <span style={{ fontSize: 12.5 }}>Private</span>
            </RadioCard>
          </div>
        </Block>
        <Block title="Avatar / AvatarStack" spec="24–34 circles · DK #0e7490 PS #b45309 MO #7c3aed">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Avatar data-testid="kit-avatar-dk" initials="DK" size={34} />
            <Avatar initials="PS" size={26} />
            <Avatar initials="MO" size={26} />
            <AvatarStack people={['DK', 'PS', 'MO']} />
          </div>
        </Block>
        <Block title="ProgressBar / Meter" spec="h5–10 track #eef1f5 r999 · stacked used+projected">
          <ProgressBar value={62} h={8} />
          <div style={{ height: 8 }} />
          <ProgressBar segments={[{ value: 48, color: P.accent }, { value: 22, color: P.accentBorder }]} h={8} />
          <div style={{ height: 10 }} />
          <BarRow label="promo_depth" value={0.82} mono />
          <BarRow label="weather_idx" value={0.34} mono />
        </Block>
        <Block title="Charts" spec="geometric SVG only · donut 86 · sparkline">
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <span data-testid="kit-donut"><Donut value={92} label="92" sub="/100" /></span>
            <Sparkline data={[4, 6, 5, 8, 7, 10, 9, 12]} w={110} h={34} />
          </div>
        </Block>
        <Block title="CodeBlock / LogLine" spec="bg #0b1220 r9 mono 10.5 lh1.7 · #93c5fd/#f472b6/#4ade80/#f87171">
          <CodeBlock testid="kit-codeblock">
            <LogLine ts="14:02:11" kind="keyword">SELECT date_trunc(week, order_ts)</LogLine>
            <LogLine ts="14:02:11" kind="string">'GOLD.REV_LOC_WK_V1'</LogLine>
            <LogLine ts="14:02:12" kind="ok">✓ contract passed — 1,284 rows</LogLine>
            <LogLine ts="14:02:12" kind="error">✗ dropped feature: leak_risk_col</LogLine>
          </CodeBlock>
        </Block>
        <Block title="SectionLabel" spec="mono 9.5/600 ls .08em uppercase #94a3b8">
          <SectionLabel data-testid="kit-sectionlabel">Visibility</SectionLabel>
        </Block>
        <Block title="ViewToggle" spec="segmented · active #0f172a white · SVG glyphs">
          <ViewToggle view={view} onChange={setView} />
        </Block>
        <Block title="DataTable" spec="fr-template per frame · head h38 #fafbfc mono 10/600 ls.06em · row h44 hover #f8fafc">
          <div style={{ margin: '0 -20px -20px' }}>
            <DataTable testid="kit-table"
              columns={[
                { key: 'name', label: 'Connection', width: '1.8fr' },
                { key: 'status', label: 'Status', width: '1fr',
                  render: r => <StatusBadge status={r.ok ? 'green' : 'red'}>{r.status}</StatusBadge> },
                { key: 'health', label: 'Health', width: '.8fr', mono: true },
              ]}
              rows={[
                { id: 1, name: 'snowflake_prod', status: 'Connected', ok: true, health: 96 },
                { id: 2, name: 'wms_events', status: 'Failing', ok: false, health: 61 },
              ]}
              rowKey="id"
              tinted={r => (r.ok ? null : P.anomalyAmber)} />
          </div>
        </Block>
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="Share “Q3 Revenue Target Risk”"
             testid="kit-modal"
             footer={<><Btn variant="secondary" onClick={() => setModal(false)}>Cancel</Btn>
                      <Btn onClick={() => setModal(false)}>Done</Btn></>}>
        <SectionLabel style={{ marginBottom: 8 }}>Visibility</SectionLabel>
        <div style={{ fontSize: 12.5, fontFamily: FONT, color: P.body }}>
          Modal body per Inspector Panels #share-panel — r14, title bar 16/20, footer #fafbfc.
        </div>
      </Modal>
    </div>
  );
}
