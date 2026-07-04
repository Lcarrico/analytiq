"""
R9S2E5-US1 — Multi-Agent Collaboration Model (Architecture v2.1 §17.2.3)

Agents are addressable and consult one another mid-task instead of failing
into repair cycles. Every consultation is a first-class, auditable event.
"""
import json

import pytest
from conftest import wait_until


def test_consult_answers_records_and_audits(db):
    import agent_bus
    ans = agent_bus.consult(db, 'visualization_agent', 'semantic_layer_agent',
                            {'kind': 'metric_format', 'metric': 'Net Revenue'})
    assert ans['format'] == 'currency'          # heuristic: revenue → currency
    row = db.execute('SELECT * FROM agent_consultations ORDER BY id DESC LIMIT 1').fetchone()
    assert row['from_agent'] == 'visualization_agent'
    assert row['to_agent'] == 'semantic_layer_agent'
    assert json.loads(row['question_json'])['metric'] == 'Net Revenue'
    assert json.loads(row['answer_json'])['format'] == 'currency'
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='agent.consulted'").fetchone()


def test_unknown_agent_is_rejected_and_audited(db):
    import agent_bus
    with pytest.raises(ValueError):
        agent_bus.consult(db, 'visualization_agent', 'no_such_agent', {'kind': 'x'})
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='agent.consult_failed'").fetchone()


def test_semantic_responder_prefers_schema_over_heuristic(db):
    import agent_bus
    schema = {'cubes': [{'name': 'fact_conversion',
                         'measures': [{'name': 'conversion_rate', 'format': 'percent'}],
                         'dimensions': []}]}
    db.execute("INSERT INTO semantic_schemas (workspace_id, version, schema_json) "
               "VALUES ('default', '9.9.9', ?)", (json.dumps(schema),))
    db.commit()
    ans = agent_bus.consult(db, 'visualization_agent', 'semantic_layer_agent',
                            {'kind': 'metric_format', 'metric': 'Conversion Rate'})
    assert ans['format'] == 'percent'           # canonical definition wins
    assert ans['source'] == 'semantic_schema'


def test_consultation_broadcast_is_first_class_event(db):
    import agent_bus
    seen = []
    agent_bus.consult(db, 'visualization_agent', 'semantic_layer_agent',
                      {'kind': 'metric_format', 'metric': 'Net Revenue'},
                      run_id=123, broadcaster=lambda payload: seen.append(payload))
    assert seen and seen[0]['event_type'] == 'agent_consultation'
    assert seen[0]['from_agent'] == 'visualization_agent'
    assert seen[0]['to_agent'] == 'semantic_layer_agent'


def test_viz_node_consults_instead_of_guessing(client, db):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status')
               in ('done', 'failed'), timeout=30)

    row = db.execute("SELECT * FROM agent_consultations WHERE run_id=? AND "
                     "from_agent='visualization_agent'", (rid,)).fetchone()
    assert row is not None                       # consulted mid-task
    # and the consulted format landed in the registered specs (no repair cycle)
    spec = db.execute("SELECT payload_json FROM uas_artifacts WHERE run_id=? "
                      "AND artifact_type='vega_lite_specs' ORDER BY id DESC LIMIT 1",
                      (rid,)).fetchone()
    assert spec is not None
    assert json.loads(spec['payload_json']).get('metric_format') == 'currency'


def test_consultations_endpoint(client, db):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    rid = client.post('/api/pipeline/run', json={'sessionId': sid}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/pipeline/{rid}').get_json().get('status')
               in ('done', 'failed'), timeout=30)
    r = client.get(f'/api/agents/consultations?run_id={rid}')
    assert r.status_code == 200
    rows = r.get_json()['consultations']
    assert rows and {'from_agent', 'to_agent', 'question', 'answer'} <= set(rows[0])
    assert client.get('/api/agents/consultations?run_id=999999').get_json()['consultations'] == []
