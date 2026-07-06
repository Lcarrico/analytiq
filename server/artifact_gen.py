"""
Self-contained HTML artifact generator + deterministic validator (Sprint 9).

Single-file output: inline CSS, inline SVG (KPI row + primary time series with
confidence-interval ribbon). No external resources — artifacts must render
offline. The validator enforces meta tags, aria labels, self-containment and
a maximum file size.
"""
from __future__ import annotations

import html as html_mod
import json
import re
from datetime import datetime, timezone

MAX_BYTES = 900_000

METRIC_FORMATS = ('currency', 'percent', 'duration', 'count')


def format_value(value, fmt: str | None) -> str:
    """R3S2E3: metric format specification applied at render time."""
    if value is None:
        return '—'
    if fmt == 'currency':
        return f'${value:,.2f}'
    if fmt == 'percent':
        return f'{value * 100:.2f}%'
    if fmt == 'duration':
        secs = int(value)
        h, m = secs // 3600, (secs % 3600) // 60
        return f'{h}h {m}m' if h else f'{m}m {secs % 60}s'
    if fmt == 'count':
        return f'{int(value):,}'
    return f'{value:,}' if isinstance(value, (int, float)) and value >= 1000 else str(value)
VALIDATOR_VERSION = '1.0'

_W, _H, _PAD = 860, 300, 40


def _scale(rows):
    xs = list(range(len(rows)))
    vals = [v for r in rows for v in (r.get('actual'), r.get('predicted'),
                                      r.get('ci_low'), r.get('ci_high')) if v is not None]
    lo, hi = (min(vals), max(vals)) if vals else (0, 1)
    span = (hi - lo) or 1

    def sx(i):
        return round(_PAD + i * (_W - 2 * _PAD) / max(len(xs) - 1, 1), 2)

    def sy(v):
        return round(_H - _PAD - (v - lo) * (_H - 2 * _PAD) / span, 2)

    return sx, sy


def _path(rows, key, sx, sy):
    pts = [(i, r[key]) for i, r in enumerate(rows) if r.get(key) is not None]
    if not pts:
        return ''
    return 'M ' + ' L '.join(f'{sx(i)} {sy(v)}' for i, v in pts)


def _ribbon(rows, sx, sy):
    upper = [(i, r['ci_high']) for i, r in enumerate(rows) if r.get('ci_high') is not None]
    lower = [(i, r['ci_low']) for i, r in enumerate(rows) if r.get('ci_low') is not None]
    if not upper or not lower:
        return ''
    pts = [f'{sx(i)},{sy(v)}' for i, v in upper] + \
          [f'{sx(i)},{sy(v)}' for i, v in reversed(lower)]
    return ' '.join(pts)


def _importance_panel(top_features):
    if not top_features:
        return ('<div class="panel" data-panel="feature-importance">'
                '<h2>Feature importance</h2>'
                '<p class="empty">Train a model to see SHAP-style importances.</p></div>')
    max_imp = max(f.get('importance') or 0 for f in top_features) or 1
    bars = ''.join(
        f'<div class="imp-row"><span class="imp-name">{html_mod.escape(str(f["name"]))}</span>'
        f'<span class="imp-bar {"pos" if (f.get("shap_mean") or 0) >= 0 else "neg"}" '
        f'style="width:{max(2, round((f.get("importance") or 0) / max_imp * 100))}%"></span>'
        f'<span class="imp-val">{round(f.get("importance") or 0, 3)}</span></div>'
        for f in top_features[:10])
    return (f'<div class="panel" data-panel="feature-importance">'
            f'<h2>Feature importance (top {min(10, len(top_features))})</h2>{bars}</div>')


def _breakdown_panel(rows):
    buckets = {}
    for r in rows:
        if r.get('actual') is None:
            continue
        wd = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][r.get('day_index', 0) % 7]
        buckets.setdefault(wd, []).append(r['actual'])
    if not buckets:
        return ('<div class="panel" data-panel="dimension-breakdown">'
                '<h2>Dimension breakdown</h2><p class="empty">No data yet.</p></div>')
    mx = max(sum(v) / len(v) for v in buckets.values()) or 1
    cells = ''.join(
        f'<div class="bd-cell" data-dim="{wd}" onclick="onDimClick(\'{wd}\')">'
        f'<div class="bd-bar" style="height:{round(sum(v) / len(v) / mx * 60)}px"></div>'
        f'<div class="bd-lbl">{wd}</div></div>'
        for wd, v in buckets.items())
    return (f'<div class="panel" data-panel="dimension-breakdown">'
            f'<h2>Dimension breakdown · weekday</h2>'
            f'<div class="bd-grid" role="img" aria-label="Average by weekday">{cells}</div></div>')


def _forecast_panel(rows, fmt=None):
    fc = [r for r in rows if r.get('is_forecast')]
    if not fc:
        return ('<div class="panel" data-panel="forecast">'
                '<h2>Forecast</h2><p class="empty">No forward window generated.</p></div>')
    pts = ''.join(
        f'<div class="forecast-point"><span>{html_mod.escape(str(r.get("date", "")))}</span>'
        f'<strong>{format_value(r.get("predicted"), fmt)}</strong>'
        f'<em>±{round(((r.get("ci_high") or 0) - (r.get("ci_low") or 0)) / 2)}</em></div>'
        for r in fc[:14])
    return (f'<div class="panel" data-panel="forecast">'
            f'<h2>Forecast · next {len(fc[:14])} days</h2>'
            f'<div class="forecast-strip">{pts}</div></div>')


def _leaderboard_panel(trials):
    if not trials:
        return ('<div class="panel" data-panel="leaderboard">'
                '<h2>Model trials</h2><p class="empty">No trials recorded.</p></div>')
    rows_html = ''.join(
        f'<div class="trial-row"><span>{html_mod.escape(str((t.get("params") or {}).get("family", "seasonal-trend")))}</span>'
        f'<span>{t.get("mape")}% MAPE</span>'
        f'<span>{html_mod.escape(_tradeoff(t))}</span></div>'
        for t in trials[:8])
    return (f'<div class="panel" data-panel="leaderboard">'
            f'<h2>Model trial leaderboard</h2>{rows_html}</div>')


def _tradeoff(t):
    fam = (t.get('params') or {}).get('family', 'seasonal-trend')
    return {'ridge-lite': 'fast + interpretable, weaker on regime shifts',
            'baseline-naive': 'trivial baseline — beats nothing but noise',
            'ensemble': 'blends the top two candidates',
            'seasonal-trend': 'captures weekday cycle + trend'}.get(fam, 'candidate model')


def _versions_panel(versions):
    if not versions:
        return ('<div class="panel" data-panel="versions"><h2>Version history'
                '<button class="panel-export" onclick="exportPanelJson(\'versions\')">JSON'
                '</button></h2><p class="empty">First version.</p></div>')
    rows_html = ''.join(
        f'<div class="version-row"><strong>v{v.get("version")}</strong>'
        f'<span>{html_mod.escape(str(v.get("created_at") or ""))}</span></div>'
        for v in versions[:10])
    return (f'<div class="panel" data-panel="versions"><h2>Version history'
            f'<button class="panel-export" onclick="exportPanelJson(\'versions\')">JSON'
            f'</button></h2>{rows_html}</div>')


def _dq_footer(artifact, model_card, generated_at):
    mc = model_card or {}
    lineage = mc.get('lineage') if isinstance(mc.get('lineage'), dict) else {}
    return (f'<div class="panel footer" data-panel="dq-footer">'
            f'<span>DQ: {html_mod.escape(str(artifact.get("dq_status", "pass")).upper())}</span>'
            f'<span>model: {html_mod.escape(str(mc.get("algorithm") or "—"))}</span>'
            f'<span>manifest: {html_mod.escape(str(mc.get("feature_manifest_version") or "—"))}</span>'
            f'<span>lineage: {html_mod.escape(", ".join(lineage.get("source_tables") or []) or "—")}</span>'
            f'<span>refreshed: {generated_at}</span></div>')


def _annotations_block(annotations):
    if not annotations:
        return ''
    items = ''.join(
        f'<div class="annotation-overlay" data-ts="{html_mod.escape(str(a.get("timestamp") or ""))}" '
        f'title="{html_mod.escape(str(a.get("text") or ""))}">📌 '
        f'<span>{html_mod.escape(str(a.get("grain_value") or a.get("timestamp") or ""))}</span> '
        f'{html_mod.escape(str(a.get("text") or ""))}</div>'
        for a in annotations[:20])
    return f'<div class="annotations" aria-label="Viewer annotations">{items}</div>'


def _titled(section, inner):
    t = html_mod.escape(str(section.get('title') or ''))
    head = f'<div class="sec-title">{t}</div>' if t else ''
    return head + inner


def _generic_panel(section, comp_rows):
    """R39S1E3: authored components render from their own executed rows."""
    sid = html_mod.escape(str(section.get('id')))
    rows = comp_rows or []
    if not rows:
        return (f'<div class="panel" data-panel="{sid}">'
                '<div class="empty">No data in range</div></div>')
    vals = [abs(float(r[1]) if len(r) > 1 and r[1] is not None else 0) for r in rows]
    mx = max(vals) or 1
    bars = ''.join(
        f'<div class="gbar" title="{html_mod.escape(str(r[0]))}" '
        f'style="height:{max(4, round(v / mx * 90))}px"></div>'
        for r, v in zip(rows[:12], vals[:12]))
    return (f'<div class="panel" data-panel="{sid}">'
            f'{_titled(section, "")}<div class="gbars">{bars}</div></div>')


def _timeseries_panel(rows, sx, sy, ribbon, actual_path, predicted_path, cut_x,
                      forecast_start):
    return f"""<div class="panel" data-panel="timeseries">
    <svg viewBox="0 0 {_W} {_H}" width="100%" role="img"
         aria-label="Actual versus predicted time series with confidence interval ribbon">
      <polygon class="ci-ribbon" points="{ribbon}"></polygon>
      {f'<line class="cut" x1="{cut_x}" y1="{_PAD}" x2="{cut_x}" y2="{_H - _PAD}"></line>' if cut_x else ''}
      <path class="series-actual" d="{actual_path}"></path>
      <path class="series-predicted" d="{predicted_path}"></path>
    </svg>
    <div class="legend">— actual &nbsp;· · · predicted &nbsp;▦ 95% confidence interval
      {f"&nbsp;| forecast starts at {html_mod.escape(str(rows[forecast_start].get('date', '')))}" if forecast_start is not None else ''}</div>
  </div>"""


def _layout_panels(layout, rows, metric_format, top_features, model_card,
                   component_rows, ts_args):
    """Sections in layout order — the same spec the canvas edits (F-08)."""
    out = []
    for s in sorted(layout.get('sections', []), key=lambda x: x.get('position', 0)):
        sid = s.get('id')
        if sid == 'timeseries_ci':
            out.append(_titled(s, _timeseries_panel(rows, *ts_args)))
        elif sid == 'forecast':
            out.append(_titled(s, _forecast_panel(rows, metric_format)))
        elif sid == 'dimension_breakdown':
            out.append(_titled(s, _breakdown_panel(rows)))
        elif sid == 'feature_importance':
            out.append(_titled(s, _importance_panel(
                top_features or (model_card or {}).get('top_features'))))
        else:
            out.append(_generic_panel(s, (component_rows or {}).get(sid)))
    return '\n  '.join(out)


def generate_artifact_html(artifact: dict, rows: list[dict], kpis: dict,
                           model_card: dict | None = None,
                           trials: list | None = None,
                           top_features: list | None = None,
                           metric_format: str | None = None,
                           annotations: list | None = None,
                           versions: list | None = None,
                           branding: dict | None = None,
                           generated_at: str | None = None,
                           layout: dict | None = None,
                           component_rows: dict | None = None) -> str:
    generated_at = generated_at or datetime.now(timezone.utc).isoformat()
    branding = branding or {}
    primary = branding.get('primary_color') or '#4f7cff'
    font = branding.get('font_family') or "-apple-system, 'Segoe UI', sans-serif"
    logo_text = branding.get('logo_text')
    title = html_mod.escape(str(artifact.get('title') or 'AnalytIQ Artifact'))
    sx, sy = _scale(rows)
    ribbon = _ribbon(rows, sx, sy)
    actual_path = _path(rows, 'actual', sx, sy)
    predicted_path = _path(rows, 'predicted', sx, sy)
    forecast_start = next((i for i, r in enumerate(rows) if r.get('is_forecast')), None)
    cut_x = sx(forecast_start) if forecast_start is not None else None

    mape = kpis.get('mape', 0)
    mape_class = 'good' if mape < 10 else 'warn' if mape < 15 else 'bad'

    model_meta = ''
    if model_card:
        model_meta = (f'<meta name="analytiq:model-id" '
                      f'content="{html_mod.escape(str(model_card.get("id", "")))}">\n')

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="analytiq:artifact-id" content="{artifact.get('id', '')}">
<meta name="analytiq:generated-at" content="{generated_at}">
<meta name="analytiq:validator" content="{VALIDATOR_VERSION}">
<meta name="analytiq:artifact-type" content="{html_mod.escape(str(artifact.get('type') or 'Predictive'))}">
{model_meta}<title>{title}</title>
<style>
  :root {{
    --primary: {primary};
    --bg: #f7f8fa; --surface: #fff; --text: #1a202c; --muted: #64748b;
    --border: #e2e8f0;
  }}
  .sec-title {{ font: 600 13px {font}; color: var(--text); margin: 14px 0 6px; }}
  .gbars {{ display: flex; align-items: flex-end; gap: 5px; height: 96px; }}
  .gbar {{ flex: 1; background: var(--primary); opacity: .85;
           border-radius: 3px 3px 0 0; }}
  .empty {{ color: var(--muted); font: 12px {font}; padding: 12px; }}
  @media (prefers-color-scheme: dark) {{
    :root {{ --bg: #101418; --surface: #1a2027; --text: #e8edf3;
             --muted: #93a3b5; --border: #2a3441; }}
  }}
  body {{ font-family: {font}; margin: 0; background: var(--bg); color: var(--text); }}
  .wrap {{ max-width: 920px; margin: 24px auto; padding: 0 16px; }}
  h1 {{ font-size: 20px; margin: 0 0 4px; }}
  .sub {{ color: #64748b; font-size: 12px; margin-bottom: 18px; }}
  .kpis {{ display: flex; gap: 12px; margin-bottom: 18px; }}
  .kpi {{ flex: 1; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; }}
  .kpi .v {{ font-size: 24px; font-weight: 700; font-variant-numeric: tabular-nums; }}
  .kpi .l {{ font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: .05em; margin-top: 2px; }}
  .badge {{ display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 700; }}
  .badge.good {{ background: #e8f5ec; color: #1e7d3c; }}
  .badge.warn {{ background: #fdf3e2; color: #946300; }}
  .badge.bad  {{ background: #fdeaea; color: #b3261e; }}
  .panel {{ background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }}
  .legend {{ font-size: 11px; color: #64748b; margin-top: 8px; }}
  .ci-ribbon {{ fill: #4f7cff22; stroke: none; }}
  .series-actual {{ fill: none; stroke: #1a202c; stroke-width: 1.6; }}
  .series-predicted {{ fill: none; stroke: #4f7cff; stroke-width: 1.6; stroke-dasharray: 4 3; }}
  .cut {{ stroke: #94a3b8; stroke-dasharray: 2 3; stroke-width: 1; }}
  .hdr {{ display: flex; gap: 12px; align-items: baseline; margin-bottom: 14px; }}
  .hdr-title {{ font-size: 18px; font-weight: 700; }}
  .hdr-meta {{ color: #64748b; font-size: 11px; flex: 1; }}
  .hdr-actions {{ font-size: 11px; color: #4f7cff; }}
  .panel h2 {{ font-size: 13px; margin: 0 0 10px; }}
  .panel + .panel {{ margin-top: 14px; }}
  .empty {{ color: #94a3b8; font-size: 12px; }}
  .imp-row {{ display: flex; align-items: center; gap: 8px; margin: 4px 0; font-size: 11px; }}
  .imp-name {{ width: 180px; overflow: hidden; text-overflow: ellipsis; }}
  .imp-bar {{ height: 10px; border-radius: 3px; display: inline-block; }}
  .imp-bar.pos {{ background: #4f7cff; }} .imp-bar.neg {{ background: #e8618c; }}
  .bd-grid {{ display: flex; gap: 10px; align-items: flex-end; height: 80px; }}
  .bd-cell {{ text-align: center; font-size: 10px; }}
  .bd-bar {{ width: 26px; background: #4f7cff55; border-radius: 3px 3px 0 0; }}
  .forecast-strip {{ display: flex; gap: 8px; overflow-x: auto; font-size: 10px; }}
  .forecast-point {{ display: flex; flex-direction: column; gap: 2px; padding: 6px;
                     background: #f1f5ff; border-radius: 5px; min-width: 52px; }}
  .trial-row {{ display: flex; gap: 12px; font-size: 11px; padding: 5px 0;
                border-bottom: 1px solid #eef2f7; }}
  .trial-row span:first-child {{ width: 120px; font-weight: 600; }}
  .footer {{ display: flex; gap: 16px; font-size: 10px; color: #64748b; }}
  .hdr-logo {{ font-weight: 800; color: var(--primary); }}
  .panel {{ background: var(--surface); border-color: var(--border); }}
  .version-row {{ font-size: 11px; display: flex; gap: 10px; padding: 3px 0; }}
  .panel-export {{ float: right; font-size: 10px; color: var(--primary);
                   background: none; border: none; cursor: pointer; }}
  @media (max-width: 768px) {{
    .kpis {{ flex-direction: column; }}
    .bd-grid {{ flex-wrap: wrap; }}
    .drawer {{ width: 100%; }}
  }}
  @media print {{
    .hdr-actions, .drawer, .panel-export {{ display: none !important; }}
    .panel {{ break-inside: avoid; border: none; }}
    body {{ background: #fff; }}
  }}
  .bd-cell {{ cursor: pointer; }} .bd-cell.active .bd-bar {{ background: #4f7cff; }}
  .drawer {{ position: fixed; right: 0; top: 0; bottom: 0; width: 320px; background: #fff;
             border-left: 1px solid #e2e8f0; padding: 14px; overflow-y: auto; }}
  .drawer-head {{ display: flex; gap: 8px; justify-content: space-between; }}
  .drill-row {{ display: flex; justify-content: space-between; font-size: 11px;
                padding: 3px 0; border-bottom: 1px solid #f1f5f9; }}
  .drill-row.head {{ font-weight: 700; }}
  .annotation-overlay {{ font-size: 11px; background: #fff9e6; border: 1px solid #f5e2a5;
                         border-radius: 5px; padding: 4px 8px; margin-top: 8px; }}
</style>
</head>
<body>
<div class="wrap">
  <h1>{title}</h1>
  <div class="sub">Generated {generated_at} · AnalytIQ self-contained artifact</div>

  <div class="hdr" data-panel="header" role="banner">
    {f'<span class="hdr-logo">{html_mod.escape(logo_text)}</span>' if logo_text else ''}
    <span class="hdr-title">{title}</span>
    <span class="hdr-meta">{html_mod.escape(str(artifact.get('type') or 'Predictive'))} ·
      last refreshed {generated_at}</span>
    <span class="hdr-actions" aria-label="Share and export">⤴ share · ⬇ export</span>
  </div>

  <div class="kpis" data-panel="kpi-row" role="group" aria-label="Key performance indicators">
    <div class="kpi" data-kpi="avg-actual"><div class="v">{kpis.get('avgActual', 0):,}</div>
      <div class="l">Avg daily actual</div></div>
    <div class="kpi" data-kpi="forecast-avg"><div class="v">{kpis.get('forecast14Avg', 0):,}</div>
      <div class="l">Forecast avg (next window)</div></div>
    <div class="kpi" data-kpi="mape"><div class="v">{mape}%
      <span class="badge {mape_class}">MAPE</span></div>
      <div class="l">Validation error</div></div>
  </div>

  {_layout_panels(layout, rows, metric_format, top_features, model_card,
                  component_rows,
                  (sx, sy, ribbon, actual_path, predicted_path, cut_x, forecast_start))
   if layout and layout.get('sections') else
   _timeseries_panel(rows, sx, sy, ribbon, actual_path, predicted_path, cut_x,
                     forecast_start)
   + _annotations_block(annotations)
   + _importance_panel(top_features or (model_card or {}).get('top_features'))
   + _breakdown_panel(rows)
   + _forecast_panel(rows, metric_format)}
  {_annotations_block(annotations) if layout and layout.get('sections') else ''}
  {_leaderboard_panel(trials or [])}
  {_versions_panel(versions)}
  {_dq_footer(artifact, model_card, generated_at)}

  <div id="drill-drawer" class="drawer" hidden aria-label="Drill-through rows">
    <div class="drawer-head"><strong id="drill-title">Drill-through</strong>
      <button onclick="exportDrillCsv()">Export CSV</button>
      <button onclick="closeDrawer()">×</button></div>
    <div id="drill-body"></div>
  </div>
</div>
<script>
/* R6S2E1 — unified filter state + click-to-drill (fully inline, offline) */
window.__DATA__ = {json.dumps(rows)};
window.__FILTER__ = {{ weekday: null }};
var WEEKDAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
function rowsFor(wd) {{
  return window.__DATA__.filter(function (r) {{
    return wd == null || WEEKDAYS[r.day_index % 7] === wd;
  }});
}}
function applyFilter(wd) {{
  window.__FILTER__.weekday = wd;
  var rows = rowsFor(wd).filter(function (r) {{ return r.actual != null; }});
  var avg = rows.length ? Math.round(rows.reduce(function (a, r) {{
    return a + r.actual; }}, 0) / rows.length) : 0;
  var el = document.querySelector('[data-kpi="avg-actual"] .v');
  if (el) el.textContent = avg.toLocaleString();
  document.querySelectorAll('.bd-cell').forEach(function (c) {{
    c.classList.toggle('active', c.getAttribute('data-dim') === wd);
  }});
}}
function onDimClick(wd) {{
  if (window.__FILTER__.weekday === wd) {{ openDrawer(wd); return; }}
  applyFilter(wd);
}}
function openDrawer(wd) {{
  var rows = rowsFor(wd);
  var body = rows.map(function (r) {{
    return '<div class="drill-row"><span>' + r.date + '</span><span>' +
      (r.actual == null ? '—' : r.actual) + '</span><span>' + r.predicted + '</span></div>';
  }}).join('');
  document.getElementById('drill-title').textContent = 'Drill-through · ' + wd;
  document.getElementById('drill-body').innerHTML =
    '<div class="drill-row head"><span>date</span><span>actual</span><span>predicted</span></div>' + body;
  document.getElementById('drill-drawer').hidden = false;
  window.__DRILL__ = rows;
}}
function closeDrawer() {{ document.getElementById('drill-drawer').hidden = true; }}
function exportPanelJson(panel) {{
  var blob = new Blob([JSON.stringify(window.__DATA__, null, 2)],
                      {{ type: 'application/json' }});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (panel || 'panel') + '_data.json';
  a.click();
}}
function exportPanelCsv(panel) {{ exportDrillCsv(); }}
function exportDrillCsv() {{
  var rows = window.__DRILL__ || window.__DATA__;
  var csv = 'date,actual,predicted\n' + rows.map(function (r) {{
    return [r.date, r.actual, r.predicted].join(','); }}).join('\n');
  var blob = new Blob([csv], {{ type: 'text/csv' }});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'drill_export.csv';
  a.click();
}}
</script>
</body>
</html>'''


def validate_artifact(html: str) -> dict:
    """Deterministic checks; returns {'status': PASS|FAIL, 'checks': [...]}."""
    checks = []

    def check(code, ok, detail):
        checks.append({'code': code, 'ok': bool(ok), 'detail': detail})

    for meta in ('analytiq:artifact-id', 'analytiq:generated-at', 'analytiq:validator'):
        check('missing_meta', f'name="{meta}"' in html, f'meta {meta}')
    check('title', bool(re.search(r'<title>[^<]+</title>', html)), '<title> present')
    check('aria', 'aria-label' in html, 'aria labels present')
    external = bool(re.search(r'<script[^>]+src=|<link[^>]+href=|url\(https?://', html)) or \
        'http://' in html or 'https://' in html
    check('external_resource', not external, 'no external resources (self-contained)')
    size = len(html.encode())
    check('max_size', size <= MAX_BYTES, f'{size} bytes ≤ {MAX_BYTES}')
    check('kpi_panel', 'data-panel="kpi-row"' in html, 'KPI row panel present')
    check('timeseries_panel', 'data-panel="timeseries"' in html and 'ci-ribbon' in html,
          'time series panel with CI ribbon present')
    required_panels = ('header', 'kpi-row', 'timeseries', 'feature-importance',
                       'dimension-breakdown', 'forecast', 'leaderboard', 'dq-footer')
    missing = [p for p in required_panels if f'data-panel="{p}"' not in html]
    check('panel_set', not missing,
          'all eight standard panels present' if not missing else f'missing: {missing}')

    status = 'PASS' if all(c['ok'] for c in checks) else 'FAIL'
    return {'status': status, 'checks': checks, 'size_bytes': size,
            'validator_version': VALIDATOR_VERSION}


def validate_and_repair(html: str, max_cycles: int = 2, attempt_log: list | None = None):
    """R6S2E3: deterministic post-generation repair — targeted fixes, not
    regeneration. Returns (html, cycles_used, final_validation).
    R11S2E3: when attempt_log is supplied, every repair cycle (including ones
    that ultimately failed) is appended for the replay debugger."""
    import re as _re2
    cycles = 0
    validation = validate_artifact(html)
    while validation['status'] != 'PASS' and cycles < max_cycles:
        cycles += 1
        failing = {c['code'] for c in validation['checks'] if not c['ok']}
        if attempt_log is not None:
            attempt_log.append({'cycle': cycles, 'failed_checks': sorted(failing)})
        if 'external_resource' in failing:
            html = _re2.sub(r'<script[^>]+src=[^>]*>\s*</script>', '', html)
            html = _re2.sub(r'<link[^>]+href=[^>]*>', '', html)
            html = html.replace('http://', '').replace('https://', '')
        if 'aria' in failing and 'aria-label' not in html:
            html = html.replace('<body>', '<body aria-label="AnalytIQ artifact">', 1)
        if 'max_size' in failing:
            html = _re2.sub(r'<!--.*?-->', '', html, flags=_re2.S)
        validation = validate_artifact(html)
    return html, cycles, validation
