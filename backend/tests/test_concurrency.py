import concurrent.futures
from fastapi.testclient import TestClient
from app.main import app
import uuid

client = TestClient(app)

def payload(case_id=None):
    cid = case_id or str(uuid.uuid4())
    return {"id":cid,"payment_id":f"pay_{cid}","order_id":f"order_{cid}","customer_id":f"cust_{cid}","customer":"Test","customer_email":"test@example.com","customer_phone":"9999999999","amount":100000,"payment_method":"UPI","failure_type":"UPI Timeout","failure_reason":"timeout","prob":.8,"expected":80000}

def test_concurrent_same_idempotency_key():
    cid = str(uuid.uuid4())
    client.post("/api/v1/cases", json=payload(cid))
    
    def attempt_recovery():
        return client.post(f"/api/v1/cases/{cid}/recovery/actions", headers={"Idempotency-Key":f"sync-key-{cid}"}, json={})
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(lambda _: attempt_recovery(), range(10)))
    
    status_codes = [r.status_code for r in results]
    assert all(code == 200 for code in status_codes), f"Status codes: {status_codes}"
    action_ids = {r.json().get("action_id") for r in results}
    assert len(action_ids) == 1, f"Multiple actions created: {action_ids}"

def test_concurrent_different_idempotency_keys():
    cid = str(uuid.uuid4())
    res = client.post("/api/v1/cases", json=payload(cid))
    assert res.status_code in (200, 201), f"Failed to create case: {res.json()}"
    
    def attempt_recovery(idx):
        return client.post(f"/api/v1/cases/{cid}/recovery/actions", headers={"Idempotency-Key":f"diff-key-{cid}-{idx}"}, json={})
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(attempt_recovery, range(10)))
    
    successes = [r for r in results if r.status_code == 200]
    conflicts = [r for r in results if r.status_code in (409, 422)]
    assert len(successes) == 1, f"Expected 1 success, got {len(successes)}"
    assert len(conflicts) == 9, f"Expected 9 conflicts, got {len(conflicts)}"

def test_concurrent_communication_limit():
    cid = str(uuid.uuid4())
    res = client.post("/api/v1/cases", json=payload(cid))
    assert res.status_code in (200, 201), f"Failed to create case: {res.json()}"
    
    def attempt_communication():
        return client.post("/api/v1/communications", json={"case_id": cid, "channel": "email", "content": "Hello"})
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        results = list(executor.map(lambda _: attempt_communication(), range(5)))
    
    successes = [r for r in results if r.status_code == 201]
    blocks = [r for r in results if r.status_code == 422]
    assert len(successes) == 2, f"Expected 2 successful communications, got {len(successes)} successes and {len(blocks)} blocks"
    assert len(blocks) == 3, f"Expected 3 blocks, got {len(blocks)}"

def test_evaluation_isolation():
    first_eval = client.post("/api/v1/evaluation/runs").json()
    baseline = first_eval["metrics"]["recovered_amount"]
    
    cid = str(uuid.uuid4())
    res = client.post("/api/v1/cases", json=payload(cid))
    assert res.status_code in (200, 201), f"Failed to create case: {res.json()}"
    client.post(f"/api/v1/cases/{cid}/recovery/actions", headers={"Idempotency-Key":f"eval-live-key-{cid}"}, json={"scenario": "executed"})
    
    second_eval = client.post("/api/v1/evaluation/runs").json()
    new_metrics = second_eval["metrics"]["recovered_amount"]
    
    assert baseline == new_metrics, f"Evaluation metrics changed! Baseline: {baseline}, New: {new_metrics}"
