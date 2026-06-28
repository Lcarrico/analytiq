import { useState } from 'react';
import { useApp } from '../context';
import { Btn, Card, PageHeader, Sparkline } from '../components/ui';
import { C, FONT, MONO } from '../tokens';

const METRICS = [
  { name: 'Net Revenue',       def: 'Daily revenue after refunds, per location',  fresh: '2h ago',  spark: [620,640,590,685,715,665,725,700,745,765,720,782,768,812,795,828,860,838,872,862,895,915,882,928,945,965,935,985,1005,975] },
  { name: 'Conversion Rate',   def: '% of sessions converting to purchase',       fresh: '1h ago',  spark: [32,31,34,30,33,35,37,34,36,38,35,40,39,41,43,40,44,42,45,43,46,48,45,49,51,48,52,50,53,55] },
  { name: 'Active Locations',  def: 'Locations with ≥1 transaction today',        fresh: '6h ago',  spark: [1200,1210,1205,1225,1215,1233,1228,1242,1237,1252,1247,1262,1257,1272,1267,1282,1277,1292,1287,1302,1297,1312,1307,1322,1317,1332,1327,1342,1337,1352] },
];

const CHIPS = [
  'Predict net revenue per location',
  'What drives conversion rate?',
  'Show location performance trends',
  'Forecast revenue for Q2',
];

export default function Screen06() {
  const { update, nav } = useApp();
  const [msgs,         setMsgs]         = useState([{ r: 'ai', t: 'Semantic layer loaded. I know about Net Revenue, Conversion Rate, Active Locations, and 180+ other metrics. What would you like to understand or predict?' }]);
  const [inp,          setInp]          = useState('');
  const [metricsShown, setMetricsShown] = useState(false);
  const [selMetric,    setSelMetric]    = useState(null);

  const send = (msg) => {
    const txt = msg || inp;
    if (!txt.trim()) return;
    setMsgs(p => [...p, { r: 'user', t: txt }]);
    setInp('');
    setTimeout(() => {
      setMsgs(p => [...p, { r: 'ai', t: `I mapped that to predict Net Revenue per Location. Select the target metric in the panel → to confirm before building the spec.` }]);
      setMetricsShown(true);
    }, 700);
  };

  const handleConfirm = () => {
    update({ selectedMetric: selMetric?.name || 'Net Revenue' });
    nav(7);
  };

  return (
    <div style={{ maxWidth: 860 }}>
      <PageHeader title="Conversational analysis" sub="Ask in plain English. I'll map your intent to the semantic layer — no SQL." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

        {/* Chat panel */}
        <Card p={0} style={{ display: 'flex', flexDirection: 'column', height: 520 }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.r === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '88%', background: m.r === 'user' ? C.primary : C.bg,
                color: m.r === 'user' ? '#fff' : C.text,
                padding: '10px 14px', borderRadius: m.r === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                fontSize: 14, lineHeight: 1.5, fontFamily: FONT,
              }}>{m.t}</div>
            ))}
          </div>
          {msgs.length === 1 && (
            <div style={{ padding: '0 16px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CHIPS.map((c, i) => (
                <button key={i} onClick={() => send(c)} style={{
                  padding: '5px 12px', borderRadius: 14, border: `1px solid ${C.border}`,
                  background: C.surface, color: C.primary, fontSize: 12, cursor: 'pointer', fontFamily: FONT,
                }}>{c}</button>
              ))}
            </div>
          )}
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8 }}>
            <input
              value={inp}
              onChange={e => setInp(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask a business question..."
              style={{ flex: 1, padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 14, outline: 'none', fontFamily: FONT }}
            />
            <Btn onClick={() => send()}>Send</Btn>
          </div>
        </Card>

        {/* Metrics panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: MONO }}>
            Available metrics
          </div>
          {METRICS.map((m, i) => (
            <button key={i} onClick={() => metricsShown && setSelMetric(m)} style={{
              textAlign: 'left', padding: 14, borderRadius: 8,
              border: `2px solid ${selMetric?.name === m.name ? C.primary : C.border}`,
              background: selMetric?.name === m.name ? C.primaryLight : C.surface,
              cursor: metricsShown ? 'pointer' : 'default',
              opacity: metricsShown ? 1 : 0.45, transition: 'all 0.15s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: FONT }}>{m.name}</div>
                <span style={{ fontSize: 10, color: C.textTer, fontFamily: FONT }}>🟢 {m.fresh}</span>
              </div>
              <div style={{ fontSize: 11, color: C.textSec, marginBottom: 8, fontFamily: FONT }}>{m.def}</div>
              <Sparkline data={m.spark} color={selMetric?.name === m.name ? C.primary : C.textTer} />
            </button>
          ))}
          {selMetric && (
            <Btn full onClick={handleConfirm}>Confirm: {selMetric.name} →</Btn>
          )}
        </div>
      </div>
    </div>
  );
}
