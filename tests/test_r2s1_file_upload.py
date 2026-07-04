"""
R2S1E1-US1 — File upload ingestion (CSV/XLSX auto-profiled into workspace schema)
"""
import io


CSV = (b'order_id,amount,status,created_at\n'
       b'1,10.5,new,2024-01-01\n'
       b'2,20.0,shipped,2024-01-02\n'
       b'3,15.25,new,2024-01-03\n'
       b'4,,returned,2024-01-04\n')


def test_csv_upload_profiles_and_registers(client, db):
    r = client.post('/api/uploads', data={
        'file': (io.BytesIO(CSV), 'orders_2024.csv')},
        content_type='multipart/form-data')
    assert r.status_code == 201
    out = r.get_json()
    assert out['table'] == 'src_upload_orders_2024'
    assert out['row_count'] == 4
    cols = {c['name']: c for c in out['profile']['columns']}
    assert cols['order_id']['semantic_type'] == 'id'
    assert cols['amount']['null_pct'] == 25.0
    assert cols['created_at']['semantic_type'] == 'date'

    # physical table written
    n = db.execute('SELECT COUNT(*) c FROM src_upload_orders_2024').fetchone()['c']
    assert n == 4
    # numeric typing preserved
    v = db.execute('SELECT amount FROM src_upload_orders_2024 WHERE order_id=1').fetchone()[0]
    assert v == 10.5

    # registered as a file connection + ingestion profile persisted
    conn_row = db.execute("SELECT * FROM connections WHERE type='file'").fetchone()
    assert conn_row is not None and out['connection_id'] == conn_row['id']
    assert db.execute('SELECT 1 FROM ingestion_profiles WHERE connection_id=?',
                      (conn_row['id'],)).fetchone()
    assert db.execute("SELECT 1 FROM audit_logs WHERE action='upload.ingested'").fetchone()


def test_upload_validation(client):
    assert client.post('/api/uploads').status_code == 400              # no file
    r = client.post('/api/uploads', data={'file': (io.BytesIO(b''), 'x.csv')},
                    content_type='multipart/form-data')
    assert r.status_code == 400                                        # empty
    r = client.post('/api/uploads', data={'file': (io.BytesIO(b'binary'), 'x.parquet')},
                    content_type='multipart/form-data')
    assert r.status_code == 415                                        # unsupported here


def test_xlsx_upload_depends_on_openpyxl(client):
    r = client.post('/api/uploads', data={'file': (io.BytesIO(b'PK\x03\x04junk'), 'd.xlsx')},
                    content_type='multipart/form-data')
    try:
        import openpyxl  # noqa
        assert r.status_code == 400   # installed but junk content → parse error
    except ImportError:
        assert r.status_code == 415   # not installed → clear unsupported response
