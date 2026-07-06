// R35S1E4-US1 (program R30–R36) — Import flows ×4 (`Data Import.dc.html` /
// PRD §8 audit-first) over the real R2 connectors. Upload: multipart POST
// with a live profiler schema preview (types, PII masking, null rates).
// REST: real connection create + poll ingest. Webhook: capability token
// shown once, real test events (payload-schema validation is owned by
// R36S1 — noted in-UI). dbt: manifest -> semantic candidates with
// inherited tests, persisted as a new schema version.
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Btn, PageHeader, Spinner } from '../components/ui';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const label = { fontFamily: MONO, fontSize: 9.5, fontWeight: 600,
                letterSpacing: '.07em', color: P.muted };
const card = { background: '#fff', border: `1px solid ${P.border}`, borderRadius: 10 };
const mono = { fontFamily: MONO, fontSize: 11, color: P.body };

function Upload({ navigate }) {
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState('');

  const onFile = async e => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true); setErr('');
    try {
      const fd = new FormData();
      fd.append('file', f);
      const r = await fetch('/api/uploads', { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Upload failed');
      setRes(d);
    } catch (e2) { setErr(e2.message); }
    setBusy(false);
  };
  const piiCount = res
    ? res.profile.columns.filter(c => c.pii_flags || c.pii).length : 0;

  return (
    <div style={{ maxWidth: 760 }}>
      <PageHeader title="Upload a file"
                  sub="CSV or XLSX — profiled on arrival: types detected, nulls measured, PII flagged and masked." />
      {!res && (
        <div style={{ ...card, padding: 26, textAlign: 'center' }}>
          {busy ? <Spinner size={22} /> : (
            <>
              <input data-testid="upload-input" type="file" accept=".csv,.xlsx"
                     onChange={onFile} />
              <div style={{ fontSize: 11.5, color: P.faint, fontFamily: FONT,
                            marginTop: 10 }}>
                The file lands as a read-only source table in this workspace.
              </div>
            </>
          )}
          {err && (
            <div style={{ fontSize: 12, color: P.red, fontFamily: FONT, marginTop: 10 }}>
              {err}
            </div>
          )}
        </div>
      )}
      {res && (
        <div data-testid="upload-schema" style={{ ...card, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px', borderBottom: `1px solid ${P.border}` }}>
            <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700,
                           color: P.ink }}>
              {res.table}
            </span>
            <span data-testid="upload-rows"
                  style={{ ...label }}>{res.row_count} ROWS</span>
            <span style={{ ...label }}>{res.profile.columns.length} COLUMNS</span>
            <span data-testid="upload-piicount" style={{ ...label, color: P.amber }}>
              {piiCount} PII &middot; MASKED
            </span>
            <Btn data-testid="upload-finish" size="sm" style={{ marginLeft: 'auto' }}
                 onClick={() => navigate('/app/data/sources')}>
              Add to workspace
            </Btn>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1.4fr .7fr',
                        gap: 10, padding: '0 16px', height: 32, alignItems: 'center',
                        background: P.tableHeadBg, ...label }}>
            <span>COLUMN</span><span>DETECTED TYPE</span><span>SAMPLE</span>
            <span>NULLS</span>
          </div>
          {res.profile.columns.map(c => (
            <div key={c.name} data-testid={`upcol-${c.name}`}
                 style={{ display: 'grid',
                          gridTemplateColumns: '1.4fr 1fr 1.4fr .7fr', gap: 10,
                          padding: '8px 16px', alignItems: 'center',
                          borderBottom: `1px solid ${P.borderRow}` }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600,
                               color: P.ink }}>{c.name}</span>
                {(c.pii_flags || c.pii) && (
                  <span data-testid="up-pii"
                        style={{ display: 'inline-flex', alignItems: 'center',
                                 height: 16, padding: '0 7px', borderRadius: 999,
                                 background: P.amberBg, color: P.amber,
                                 fontFamily: MONO, fontSize: 8.5, fontWeight: 700 }}>
                    PII
                  </span>
                )}
              </span>
              <span style={mono}>{(c.semantic_type || c.type || 'text').toUpperCase()}</span>
              <span style={{ ...mono, color: P.muted, overflow: 'hidden',
                             textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {(c.pii_flags || c.pii) ? '•••masked•••'
                  : String((c.samples || [])[0] ?? c.sample ?? '—')}
              </span>
              <span style={mono}>{c.null_pct != null ? `${c.null_pct}%` : '0%'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Rest() {
  const [url, setUrl] = useState('');
  const [interval_, setInterval_] = useState('15');
  const [conn, setConn] = useState(null);
  const [poll, setPoll] = useState(null);
  const [err, setErr] = useState('');

  const save = async () => {
    setErr('');
    try {
      const c = await api.createConnection({ type: 'rest_api', name: url,
        endpoint_url: url, poll_interval_minutes: Number(interval_) || 15 });
      setConn(c);
    } catch (e) {
      let m = e.message; try { m = JSON.parse(e.message)?.error || m; } catch { /* raw */ }
      setErr(m);
    }
  };
  const doPoll = async () => {
    try { setPoll(await api.pollConnection(conn.id)); }
    catch { setErr('Poll failed'); }
  };

  return (
    <div style={{ maxWidth: 620 }}>
      <PageHeader title="REST API connector"
                  sub="Read-only polling on a schedule — every poll lands rows through the same profiler as any other source." />
      <div style={{ ...card, padding: 18 }}>
        <div style={{ ...label, marginBottom: 5 }}>ENDPOINT URL</div>
        <input data-testid="rest-url" value={url} onChange={e => setUrl(e.target.value)}
               placeholder="https://api.shopify.com/admin/orders.json"
               style={{ width: '100%', height: 32, boxSizing: 'border-box',
                        borderRadius: 7, border: `1px solid ${P.borderStrong}`,
                        padding: '0 10px', fontSize: 12, fontFamily: MONO,
                        outline: 'none', marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
          <div>
            <div style={{ ...label, marginBottom: 5 }}>METHOD</div>
            <select disabled title="Read-only sources poll with GET"
                    style={{ height: 28, borderRadius: 7, fontSize: 11.5,
                             border: `1px solid ${P.borderStrong}`,
                             background: P.tableHeadBg, color: P.faint }}>
              <option>GET</option>
            </select>
          </div>
          <div>
            <div style={{ ...label, marginBottom: 5 }}>POLL EVERY</div>
            <select data-testid="rest-interval" value={interval_}
                    onChange={e => setInterval_(e.target.value)}
                    style={{ height: 28, borderRadius: 7, fontSize: 11.5,
                             border: `1px solid ${P.borderStrong}`, fontFamily: FONT,
                             background: '#fff' }}>
              <option value="15">15 min</option>
              <option value="60">1 hour</option>
              <option value="360">6 hours</option>
            </select>
          </div>
          <div>
            <div style={{ ...label, marginBottom: 5 }}>PAGINATION</div>
            <select disabled title="Cursor pagination arrives with live external polling"
                    style={{ height: 28, borderRadius: 7, fontSize: 11.5,
                             border: `1px solid ${P.borderStrong}`,
                             background: P.tableHeadBg, color: P.faint }}>
              <option>Cursor</option>
            </select>
          </div>
        </div>
        {err && (
          <div style={{ fontSize: 11.5, color: P.red, fontFamily: FONT,
                        marginBottom: 10 }}>
            {err}
          </div>
        )}
        {!conn ? (
          <Btn data-testid="rest-save" size="sm" onClick={save} disabled={!url}>
            Save connector
          </Btn>
        ) : (
          <div>
            <div data-testid="rest-saved"
                 style={{ display: 'inline-flex', alignItems: 'center', gap: 7,
                          height: 24, padding: '0 11px', borderRadius: 999,
                          background: P.greenBg, color: P.green, fontFamily: MONO,
                          fontSize: 10, fontWeight: 700, marginBottom: 10 }}>
              Connector saved &middot; polls every {interval_} min
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Btn data-testid="rest-poll" size="sm" onClick={doPoll}>Poll now</Btn>
              {poll && (
                <span data-testid="rest-poll-result"
                      style={{ fontFamily: MONO, fontSize: 11, color: P.body }}>
                  {poll.rows_ingested} records ingested &middot; {poll.mode}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Webhook() {
  const [conn, setConn] = useState(null);
  const [events, setEvents] = useState([]);
  const [err, setErr] = useState('');

  const create = async () => {
    setErr('');
    try { setConn(await api.createConnection({ type: 'webhook', name: 'wms_events' })); }
    catch (e) { setErr('Could not create the endpoint'); }
  };
  const refresh = async id => {
    try { setEvents(await api.webhookEvents(id)); } catch { /* keep */ }
  };
  const sendTest = async () => {
    try {
      await fetch(`/api/ingest/webhook/${conn.webhook_token}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: `e-${Date.now() % 1e5}`, warehouse: 'W1',
                               event_type: 'pick', ts: new Date().toISOString(),
                               qty: 3 }) });
      refresh(conn.id);
    } catch { setErr('Test event failed'); }
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <PageHeader title="Webhook endpoint"
                  sub="Push events to a capability URL — the raw token is shown exactly once and only its hash is stored." />
      <div style={{ ...card, padding: 18 }}>
        {!conn ? (
          <>
            {err && (
              <div style={{ fontSize: 11.5, color: P.red, fontFamily: FONT,
                            marginBottom: 10 }}>
                {err}
              </div>
            )}
            <Btn data-testid="wh-create" size="sm" onClick={create}>
              Create endpoint
            </Btn>
          </>
        ) : (
          <>
            <div style={{ ...label, marginBottom: 5 }}>ENDPOINT URL</div>
            <div data-testid="wh-url"
                 style={{ ...mono, background: P.tableHeadBg, borderRadius: 7,
                          padding: '8px 11px', wordBreak: 'break-all',
                          marginBottom: 10 }}>
              {window.location.origin}{conn.webhook_url}
            </div>
            <div style={{ ...label, marginBottom: 5 }}>SIGNING SECRET</div>
            <div data-testid="wh-secret"
                 style={{ ...mono, background: P.tableHeadBg, borderRadius: 7,
                          padding: '8px 11px', marginBottom: 4 }}>
              {conn.webhook_token.slice(0, 6)}••••••••••••{conn.webhook_token.slice(-4)}
            </div>
            <div data-testid="wh-once-note"
                 style={{ fontFamily: MONO, fontSize: 9.5, color: P.amber,
                          marginBottom: 12 }}>
              shown once — store it now; only a hash stays on our side
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <Btn data-testid="wh-send-test" size="sm" onClick={sendTest}>
                Send test event
              </Btn>
              <span title="Payload-schema validation ships with the alerts + contracts release (R36S1)"
                    style={{ fontSize: 11, color: P.faint, fontFamily: FONT,
                             alignSelf: 'center' }}>
                Expected-schema validation arrives with contracts
              </span>
            </div>
            <div style={{ ...label, marginBottom: 6 }}>RECENT EVENTS</div>
            {events.length === 0 ? (
              <div style={{ fontSize: 11.5, color: P.faint, fontFamily: FONT }}>
                Nothing received yet.
              </div>
            ) : events.slice(0, 8).map(ev => (
              <div key={ev.id} data-testid={`wh-event-${ev.id}`}
                   style={{ display: 'flex', gap: 10, alignItems: 'center',
                            padding: '6px 0',
                            borderBottom: `1px solid ${P.borderRow}` }}>
                <span style={{ ...mono, color: P.faint }}>
                  {(ev.received_at || ev.created_at || '').slice(11, 19)}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center',
                               height: 17, padding: '0 8px', borderRadius: 999,
                               background: P.greenBg, color: P.green,
                               fontFamily: MONO, fontSize: 9, fontWeight: 700 }}>
                  201
                </span>
                <span style={{ ...mono, overflow: 'hidden', textOverflow: 'ellipsis',
                               whiteSpace: 'nowrap' }}>
                  {JSON.stringify(ev.payload).slice(0, 60)}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

const DEMO_MANIFEST = {
  nodes: {
    'model.acme.fct_orders': { resource_type: 'model', name: 'fct_orders',
      columns: { order_id: {}, net_amount: {}, order_date: {} } },
    'model.acme.dim_customers': { resource_type: 'model', name: 'dim_customers',
      columns: { customer_id: {}, segment: {} } },
    'test.acme.not_null_1': { resource_type: 'test',
      test_metadata: { name: 'not_null', kwargs: { model: 'fct_orders', column_name: 'order_id' } } },
    'test.acme.unique_1': { resource_type: 'test',
      test_metadata: { name: 'unique', kwargs: { model: 'fct_orders', column_name: 'order_id' } } },
    'test.acme.not_null_2': { resource_type: 'test',
      test_metadata: { name: 'not_null', kwargs: { model: 'dim_customers', column_name: 'customer_id' } } },
  },
};

function Dbt() {
  const [conns, setConns] = useState([]);
  const [sel, setSel] = useState('');
  const [manifest, setManifest] = useState(null);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.getConnections().then(r => setConns(Array.isArray(r) ? r : [])).catch(() => {});
  }, []);

  const models = manifest
    ? Object.values(manifest.nodes).filter(n => n.resource_type === 'model') : [];
  const testsFor = name => Object.values(manifest?.nodes || {})
    .filter(n => n.resource_type === 'test'
      && n.test_metadata?.kwargs?.model === name).length;

  const doImport = async () => {
    setErr('');
    try {
      const r = await api.dbtImport(sel, manifest);
      setResult(r);
    } catch (e) {
      let m = e.message; try { m = JSON.parse(e.message)?.error || m; } catch { /* raw */ }
      setErr(m);
    }
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <PageHeader title="Import dbt project"
                  sub="Models and docs become semantic-layer candidates; tests are inherited as quality notes." />
      <div style={{ ...card, padding: 18 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end',
                      marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ ...label, marginBottom: 5 }}>TARGET CONNECTION</div>
            <select data-testid="dbt-connection" value={sel}
                    onChange={e => setSel(e.target.value)}
                    style={{ width: '100%', height: 30, borderRadius: 7,
                             border: `1px solid ${P.borderStrong}`, fontSize: 12,
                             fontFamily: FONT, background: '#fff' }}>
              <option value="">Choose a connection…</option>
              {conns.map(c => (
                <option key={c.id} value={c.id}>{c.name || c.account || c.type}</option>
              ))}
            </select>
          </div>
          <Btn data-testid="dbt-demo" size="sm" variant="outline"
               onClick={() => setManifest(DEMO_MANIFEST)}>
            Load demo manifest
          </Btn>
        </div>
        {manifest && (
          <>
            <div style={{ ...label, marginBottom: 6 }}>MODEL MAPPING</div>
            {models.map(m => (
              <div key={m.name} data-testid={`dbt-model-${m.name}`}
                   style={{ display: 'flex', gap: 10, alignItems: 'center',
                            padding: '7px 0',
                            borderBottom: `1px solid ${P.borderRow}` }}>
                <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600,
                               color: P.ink, flex: 1 }}>
                  {m.name}
                </span>
                <span style={{ fontSize: 11.5, color: P.body, fontFamily: FONT }}>
                  semantic candidate
                </span>
                <span data-testid="dbt-tests"
                      style={{ display: 'inline-flex', alignItems: 'center',
                               height: 17, padding: '0 8px', borderRadius: 999,
                               background: P.accentSoft, color: P.accentHover,
                               fontFamily: MONO, fontSize: 8.5, fontWeight: 700 }}>
                  {testsFor(m.name)} INHERITED
                </span>
              </div>
            ))}
            {err && (
              <div style={{ fontSize: 11.5, color: P.red, fontFamily: FONT,
                            margin: '10px 0' }}>
                {err}
              </div>
            )}
            {result ? (
              <div data-testid="dbt-result"
                   style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center',
                            height: 24, padding: '0 11px', borderRadius: 999,
                            background: P.greenBg, color: P.green, fontFamily: MONO,
                            fontSize: 10, fontWeight: 700 }}>
                Imported {result.imported?.length ?? models.length} models &middot;{' '}
                {result.tests_mapped ?? 0} tests inherited &middot; schema v{result.version}
              </div>
            ) : (
              <Btn data-testid="dbt-import" size="sm" style={{ marginTop: 12 }}
                   onClick={doImport} disabled={!sel}>
                Import to semantic layer
              </Btn>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ImportFlows() {
  const { kind } = useParams();
  const navigate = useNavigate();
  if (kind === 'upload') return <Upload navigate={navigate} />;
  if (kind === 'rest') return <Rest />;
  if (kind === 'webhook') return <Webhook />;
  if (kind === 'dbt') return <Dbt />;
  return (
    <div style={{ maxWidth: 600 }}>
      <PageHeader title="Unknown import flow" sub="Pick a connector from the grid." />
      <Btn size="sm" variant="outline" onClick={() => navigate('/app/data/connect')}>
        Back to connectors
      </Btn>
    </div>
  );
}
