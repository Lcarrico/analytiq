"""R36S3E1 — billing overview, seeded demo invoices, payment methods."""


def test_billing_overview_and_plan_change(client):
    d = client.get('/api/billing/overview').get_json()
    assert set(d) >= {'plan', 'price_usd', 'seats', 'renewal', 'cycle',
                      'stripe_configured'}
    assert d['plan'] in ('starter', 'team', 'business', 'enterprise')
    assert d['seats']['included'] >= 1
    assert d['seats']['used'] >= 1                    # the demo admin holds a seat
    assert d['stripe_configured'] is False            # zero-key local stack
    assert any(li['label'].lower().startswith('base plan') for li in d['cycle'])

    r = client.put('/api/billing/plan', json={'plan': 'business'})
    assert r.status_code == 200
    d2 = client.get('/api/billing/overview').get_json()
    assert d2['plan'] == 'business' and d2['price_usd'] == 499


def test_billing_invoices_and_payment_methods_seed_idempotently(client):
    inv = client.get('/api/billing/invoices').get_json()['invoices']
    assert len(inv) == 3
    assert all(i['status'] == 'paid' and i['amount_usd'] >= 0 for i in inv)
    assert all(i['number'] for i in inv)
    inv2 = client.get('/api/billing/invoices').get_json()['invoices']
    assert [i['number'] for i in inv] == [i['number'] for i in inv2]  # no re-seed

    pm = client.get('/api/billing/payment_methods').get_json()['methods']
    assert len(pm) == 1
    assert pm[0]['brand'] == 'visa' and pm[0]['last4'] == '4242'
