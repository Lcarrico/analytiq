"""R38S1E2-US1 — multi-metric decomposition (deep-dive F-02, §5B–C).
The plan returns a metric INVENTORY: every named and implied metric with a
role, format, and either a catalog resolution or an explicit unresolved
entry with a reason — never silently dropped. Doc §8 'Metric decomposition'
acceptance: 5 metrics incl. one derived → all 5, dependencies, formats,
unresolved items, component mapping."""
from conftest import wait_until

ASK = ('Forecast net revenue vs revenue target with target gap %, '
       'order count and average order value for the next 14 days')


def _governed(client):
    conn = client.post('/api/connections', json={'type': 'snowflake', 'account': 'p',
                                                 'username': 'p', 'password': 'p'}).get_json()
    rid = client.post('/api/governance/run', json={'connectionId': conn['id']}).get_json()['runId']
    wait_until(lambda: client.get(f'/api/governance/{rid}').get_json().get('status')
               in ('done', 'complete'), timeout=30)
    wait_until(lambda: len(client.get(
        f"/api/integrations/{conn['id']}/manifest/versions").get_json()) >= 1, timeout=10)
    client.post('/api/semantic/default/generate', json={'connectionId': conn['id']})
    return conn['id']


def test_metric_inventory_decomposition(client):
    _governed(client)
    p = client.post('/api/sessions/plan', json={'message': ASK}).get_json()
    assert not p.get('needs_clarification')

    inv = {m['id']: m for m in p['metrics']}
    assert len(inv) >= 5
    assert all(m.get('format') and m.get('role') for m in inv.values())

    # resolved against the governed catalog
    assert inv['net_revenue']['resolved'] is True
    assert inv['net_revenue']['role'] == 'primary'

    # target — represented, honestly unresolved until a target source exists
    tgt = inv['revenue_target']
    assert tgt['role'] == 'target' and tgt['resolved'] is False
    assert tgt['reason']

    # derived expands into dependencies present in the inventory
    gap = inv['target_gap_pct']
    assert gap['role'] == 'derived'
    assert set(gap['dependencies']) == {'net_revenue', 'revenue_target'}
    assert gap['zero_denominator']

    aov = inv['average_order_value']
    assert aov['role'] == 'derived' and 'order_count' in aov['dependencies']

    # unresolved items are a visible checklist with reasons, never dropped
    unresolved_ids = {m['id'] for m in p['metrics'] if not m['resolved']}
    assert 'order_count' in unresolved_ids
    assert all(m.get('reason') for m in p['metrics'] if not m['resolved'])

    # component mapping: every resolved metric appears in at least one
    # proposed component
    mapped = set()
    for c in p['components_intent']:
        mapped |= set(c['metric_refs'])
    assert {m['id'] for m in p['metrics'] if m['resolved']} <= mapped

    # compat: the scalar survives as the first primary
    assert p['target_metric'] == 'Net Revenue'


def test_single_metric_asks_unchanged(client):
    """The classic ask keeps its shape (no clarification regression)."""
    p = client.post('/api/sessions/plan',
                    json={'message': 'Forecast net revenue for the next 14 days'}).get_json()
    assert not p.get('needs_clarification')
    assert p['target_metric']
    assert isinstance(p.get('metrics'), list) and p['metrics']
