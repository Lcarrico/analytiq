"""
R11S1E1-US1 — Explainability Engine (Architecture v2.1 §17.5.1)

Every number a dashboard shows carries an "explain" affordance composing
lineage, generated SQL, semantic definitions, and field bindings — plus model
card, gates, and top features for predictions. Composition over data the
system already produces: no new computation.
"""
import json

from conftest import wait_until


def _artifact(client, metric='Net Revenue'):
    sid = client.post('/api/sessions', json={'metric': metric}).get_json()['id']
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status') == 'done',
               timeout=30)
    art = client.post(f'/api/sessions/{sid}/save_artifact', json={'title': 'Explain Me'}).get_json()
    return sid, rid, art


def test_explain_composes_all_core_sections(client, db):
    sid, rid, art = _artifact(client)
    r = client.get(f"/api/artifacts/{art['id']}/explain")
    assert r.status_code == 200
    body = r.get_json()
    assert {'lineage', 'sql', 'semantic', 'field_bindings'} <= set(body)
    assert body['lineage']['run_id'] == rid
    assert 'gold_predictions' in body['lineage']['gold_tables']
    assert body['lineage']['provenance_chain']          # UAS chain included
    assert body['field_bindings']['metric_format'] == 'currency'   # from consultation
    assert any(p['panel'] == 'forecast' for p in body['field_bindings']['panels'])


def test_explain_includes_generated_sql_when_modeler_ran(client, db):
    sid, rid, art = _artifact(client)
    db.execute("INSERT INTO gold_tables (session_id, table_name, physical_table, version, "
               "ddl, insert_sql, status) VALUES (?, 'gold_net_revenue_location_day_v1', 'g', 1, "
               "'CREATE TABLE g (day TEXT)', 'INSERT INTO g SELECT day FROM fact_revenue', "
               "'generated')", (sid,))
    db.commit()
    body = client.get(f"/api/artifacts/{art['id']}/explain").get_json()
    assert 'CREATE TABLE' in body['sql']['ddl']
    assert 'INSERT INTO' in body['sql']['insert_sql']


def test_explain_adds_model_section_for_predictions(client, db):
    sid, rid, art = _artifact(client)
    db.execute("INSERT INTO model_cards (session_id, algorithm, gold_table_name, "
               "metrics_json, gates_json, status) VALUES (?, 'seasonal_trend', 'g', "
               "'{\"validation_mape\": 8.9}', "
               "'{\"stability\": \"PASS\", \"concentration\": \"PASS\"}', 'promoted')", (sid,))
    db.commit()
    body = client.get(f"/api/artifacts/{art['id']}/explain").get_json()
    assert body['model'] is not None
    assert body['model']['algorithm'] == 'seasonal_trend'
    assert body['model']['gates']['stability'] == 'PASS'
    assert body['model']['metrics']['validation_mape'] == 8.9


def test_explain_without_model_reports_descriptive(client, db):
    sid, rid, art = _artifact(client)
    body = client.get(f"/api/artifacts/{art['id']}/explain").get_json()
    assert body['model'] is None


def test_component_filter_and_404(client, db):
    sid, rid, art = _artifact(client)
    body = client.get(f"/api/artifacts/{art['id']}/explain?component=forecast").get_json()
    assert [p['panel'] for p in body['field_bindings']['panels']] == ['forecast']
    assert client.get('/api/artifacts/999999/explain').status_code == 404


def test_explain_is_pure_composition_no_new_computation(client, db):
    sid, rid, art = _artifact(client)
    counts = lambda: tuple(db.execute(f'SELECT COUNT(*) c FROM {t}').fetchone()['c']
                           for t in ('chart_data', 'gold_predictions', 'uas_artifacts',
                                     'dag_nodes'))
    before = counts()
    client.get(f"/api/artifacts/{art['id']}/explain")
    assert counts() == before                            # reads only
