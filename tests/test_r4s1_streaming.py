"""
R4S1E2-US1 — Streaming session messages (SSE event sequence + replay store)
"""
import json

from conftest import wait_until


def test_session_message_streams_prd_event_sequence(client):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    resp = client.post(f'/api/sessions/{sid}/message',
                       json={'message': 'Predict net revenue for the next 14 days by location'})
    assert resp.status_code == 200
    assert resp.content_type.startswith('text/event-stream')
    events = [json.loads(line[6:]) for line in
              resp.get_data(as_text=True).splitlines() if line.startswith('data: ')]
    types = [e['type'] for e in events]
    assert types[0] == 'planning'
    assert 'agent_start' in types
    assert types[-1] in ('agent_complete', 'human_required', 'error')
    plan_evt = next(e for e in events if e['type'] == 'agent_complete')
    assert plan_evt['payload']['intent'] == 'predictive'

    # events persisted for replay
    stored = client.get(f'/api/sessions/{sid}/events').get_json()
    assert [e['type'] for e in stored] == types


def test_ambiguous_message_emits_human_required(client):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    resp = client.post(f'/api/sessions/{sid}/message', json={'message': 'revenue?'})
    events = [json.loads(line[6:]) for line in
              resp.get_data(as_text=True).splitlines() if line.startswith('data: ')]
    hr = next(e for e in events if e['type'] == 'human_required')
    assert hr['payload']['question']
    assert 3 <= len(hr['payload']['options']) <= 5


def test_message_validation(client):
    sid = client.post('/api/sessions', json={'metric': 'Net Revenue'}).get_json()['id']
    assert client.post(f'/api/sessions/{sid}/message', json={}).status_code == 400
    assert client.post('/api/sessions/9999/message',
                       json={'message': 'x'}).status_code == 404
