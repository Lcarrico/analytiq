"""
R6S2E1-US1 — Unified filter state, click-to-drill cross-filtering, drill drawer
with grain rows + CSV export (all inline — artifact stays self-contained)
"""


def _html():
    import artifact_gen as ag
    rows = [{'day_index': i, 'date': f'Jan {i+1}', 'actual': 600 + i if i < 20 else None,
             'predicted': 590 + i, 'ci_low': 560 + i, 'ci_high': 640 + i,
             'is_forecast': 1 if i >= 20 else 0} for i in range(30)]
    return ag.generate_artifact_html({'id': 9, 'title': 'Interactive'}, rows,
                                     {'avgActual': 610, 'mape': 8.9, 'forecast14Avg': 615}), ag


def test_artifact_embeds_data_and_filter_state():
    html, ag = _html()
    assert 'window.__DATA__' in html                      # inline grain data
    assert 'window.__FILTER__' in html                    # unified filter state
    assert 'function applyFilter' in html
    assert 'data-dim=' in html                            # clickable dimension cells
    assert 'id="drill-drawer"' in html
    assert 'function exportDrillCsv' in html              # Blob-based CSV export
    assert 'function onDimClick' in html                  # first click filter, second drill
    # still self-contained + valid
    res = ag.validate_artifact(html)
    assert res['status'] == 'PASS'


def test_drill_payload_contains_grain_rows():
    html, _ = _html()
    import json as j
    start = html.index('window.__DATA__ = ') + len('window.__DATA__ = ')
    end = html.index(';\n', start)
    data = j.loads(html[start:end])
    assert len(data) == 30
    assert {'date', 'actual', 'predicted'} <= set(data[0])
