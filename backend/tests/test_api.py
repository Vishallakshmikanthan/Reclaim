from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
def payload(case_id="case_test"):
    return {"id":case_id,"payment_id":"pay_1","order_id":"order_1","customer_id":"cust_1","customer":"Test","customer_email":"test@example.com","customer_phone":"9999999999","amount":849900,"payment_method":"UPI","failure_type":"UPI Timeout","failure_reason":"timeout","prob":.8,"expected":679920}
def test_health_and_ready():
    assert client.get("/health").json()["status"] == "ok"; assert client.get("/ready").json()["status"] == "ready"
def test_case_and_recovery_idempotency():
    client.post("/api/v1/cases", json=payload())
    assert client.get("/api/v1/cases/case_test").status_code == 200
    assert client.post("/api/v1/cases/case_test/recovery/decision").status_code == 200
    first = client.post("/api/v1/cases/case_test/recovery/actions", headers={"Idempotency-Key":"test-key"}, json={})
    second = client.post("/api/v1/cases/case_test/recovery/actions", headers={"Idempotency-Key":"test-key"}, json={})
    assert first.status_code == second.status_code == 200; assert first.json()["action_id"] == second.json()["action_id"]
def test_missing_case_is_structured():
    response = client.get("/api/v1/cases/missing")
    assert response.status_code == 404 and response.json()["error"]["code"] == "CASE_NOT_FOUND"
