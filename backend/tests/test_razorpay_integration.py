import hmac
import hashlib
import json
import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import Settings
from app.engines.providers import SimulatedRecoveryProvider, RazorpayTestProvider, MockRazorpayTestProvider

client = TestClient(app)

def create_test_case(cid=None, amount=150000, failure_type="UPI Timeout", demo_scenario="STANDARD"):
    case_id = cid or f"case_{uuid.uuid4().hex[:8]}"
    payload = {
        "id": case_id,
        "payment_id": f"pay_{case_id}",
        "order_id": f"order_{case_id}",
        "customer_id": f"cust_{case_id}",
        "customer": "Razorpay Test Customer",
        "customer_email": "test@reclaim-sandbox.in",
        "customer_phone": "9876543210",
        "amount": amount,
        "payment_method": "UPI",
        "failure_type": failure_type,
        "failure_reason": "Test mode failure",
        "prob": 0.85,
        "expected": int(amount * 0.85),
        "demo_scenario": demo_scenario
    }
    res = client.post("/api/v1/cases", json=payload)
    assert res.status_code in (200, 201), f"Create case failed: {res.text}"
    return case_id, payload

def sign_webhook_payload(payload_bytes: bytes, secret: str = "mock_secret_key_123") -> str:
    return hmac.new(secret.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()

def test_live_key_prevention_security():
    """Fail closed: Live Razorpay credentials must raise a validation error."""
    with pytest.raises(ValueError, match="Live Razorpay credentials"):
        Settings(razorpay_key_id="rzp_live_1234567890abcdef")

def test_test_mode_key_format():
    """RazorpayTestProvider must reject non-test keys."""
    with pytest.raises(ValueError, match="Test mode key must start with 'rzp_test_'"):
        RazorpayTestProvider(key_id="rzp_invalid_123", key_secret="secret")

def test_policy_gate_before_provider_call():
    """Cases violating policy (e.g. amount exceeds limit) must fail at policy gate before any provider execution."""
    cid, _ = create_test_case(amount=5_000_000)  # Exceeds default 1,000,000 paise limit
    decision_res = client.post(f"/api/v1/cases/{cid}/recovery/decision")
    assert decision_res.status_code == 200
    assert decision_res.json()["policy_result"]["allowed"] is False
    
    action_res = client.post(
        f"/api/v1/cases/{cid}/recovery/actions",
        headers={"Idempotency-Key": f"key-blocked-{cid}"},
        json={}
    )
    assert action_res.status_code == 422
    assert action_res.json()["error"]["code"] == "POLICY_VALIDATION_FAILED"

def test_successful_recovery_and_revenue_accounting():
    """Standard recovery executes and verifies, updating recovered revenue."""
    cid, _ = create_test_case(amount=200000)
    
    metrics_before = client.get("/api/v1/dashboard/metrics").json()
    rec_before = metrics_before["revenue_recovered"]
    
    action_res = client.post(
        f"/api/v1/cases/{cid}/recovery/actions",
        headers={"Idempotency-Key": f"key-succ-{cid}"},
        json={"scenario": "STANDARD"}
    )
    assert action_res.status_code == 200
    action_data = action_res.json()
    assert action_data["verification_status"] == "verified"
    assert action_data["provider"] in {"simulated", "razorpay_test"}
    
    case_res = client.get(f"/api/v1/cases/{cid}").json()
    assert case_res["status"] == "recovered"
    assert case_res["recovered_amount"] == 200000
    
    metrics_after = client.get("/api/v1/dashboard/metrics").json()
    assert metrics_after["revenue_recovered"] == rec_before + 200000

def test_webhook_signature_verification():
    """Valid webhook signatures are accepted, invalid or missing signatures are rejected with 400."""
    payload = {
        "event": "payment.captured",
        "event_id": f"evt_{uuid.uuid4().hex[:12]}",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_test_webhook_1",
                    "amount": 100000,
                    "currency": "INR",
                    "status": "captured"
                }
            }
        }
    }
    payload_bytes = json.dumps(payload).encode("utf-8")
    valid_sig = sign_webhook_payload(payload_bytes, "mock_secret_key_123")
    
    # 1. Invalid signature
    res_invalid = client.post(
        "/api/v1/webhooks/razorpay",
        content=payload_bytes,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": "invalid_signature_hex"}
    )
    assert res_invalid.status_code == 400
    assert res_invalid.json()["error"]["code"] == "WEBHOOK_VERIFICATION_FAILED"
    
    # 2. Missing signature
    res_missing = client.post(
        "/api/v1/webhooks/razorpay",
        content=payload_bytes,
        headers={"Content-Type": "application/json"}
    )
    assert res_missing.status_code == 400
    
    # 3. Valid signature
    res_valid = client.post(
        "/api/v1/webhooks/razorpay",
        content=payload_bytes,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": valid_sig}
    )
    assert res_valid.status_code == 200
    assert res_valid.json()["status"] == "processed"

def test_webhook_idempotency():
    """Duplicate delivery of the same webhook event ID must be harmless and return duplicate status."""
    evt_id = f"evt_idemp_{uuid.uuid4().hex[:10]}"
    payload = {
        "event": "payment.captured",
        "event_id": evt_id,
        "payload": {
            "payment": {
                "entity": {
                    "id": f"pay_idemp_{uuid.uuid4().hex[:8]}",
                    "amount": 50000,
                    "currency": "INR",
                    "status": "captured"
                }
            }
        }
    }
    payload_bytes = json.dumps(payload).encode("utf-8")
    sig = sign_webhook_payload(payload_bytes, "mock_secret_key_123")
    
    first = client.post("/api/v1/webhooks/razorpay", content=payload_bytes, headers={"Content-Type": "application/json", "X-Razorpay-Signature": sig})
    assert first.status_code == 200
    assert first.json()["status"] == "processed"
    
    second = client.post("/api/v1/webhooks/razorpay", content=payload_bytes, headers={"Content-Type": "application/json", "X-Razorpay-Signature": sig})
    assert second.status_code == 200
    assert second.json()["status"] == "duplicate"

def test_webhook_updates_pending_recovery_action():
    """A webhook with payment.captured transitions pending action and case to recovered."""
    cid, _ = create_test_case(amount=120000, demo_scenario="TIMEOUT")
    
    # Create action in pending/timeout state
    action_res = client.post(
        f"/api/v1/cases/{cid}/recovery/actions",
        headers={"Idempotency-Key": f"key-pending-{cid}"},
        json={"scenario": "timeout"}
    )
    assert action_res.status_code == 200
    action = action_res.json()
    assert action["verification_status"] == "timeout"
    
    order_id = action.get("provider_order_id")
    
    # Send payment.captured webhook matching the order_id and case_id
    payload = {
        "event": "payment.captured",
        "event_id": f"evt_cap_{uuid.uuid4().hex[:8]}",
        "payload": {
            "payment": {
                "entity": {
                    "id": f"pay_cap_{uuid.uuid4().hex[:8]}",
                    "order_id": order_id,
                    "amount": 120000,
                    "currency": "INR",
                    "status": "captured",
                    "notes": {"case_id": cid}
                }
            }
        }
    }
    payload_bytes = json.dumps(payload).encode("utf-8")
    sig = sign_webhook_payload(payload_bytes, "mock_secret_key_123")
    
    webhook_res = client.post(
        "/api/v1/webhooks/razorpay",
        content=payload_bytes,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": sig}
    )
    assert webhook_res.status_code == 200
    
    # Verify case and action are now recovered/verified
    updated_case = client.get(f"/api/v1/cases/{cid}").json()
    assert updated_case["status"] == "recovered"
    assert updated_case["recovered_amount"] == 120000
    
    updated_action = client.get(f"/api/v1/recovery/actions/{action['action_id']}").json()
    assert updated_action["verification_status"] == "verified"

def test_webhook_payment_failed_does_not_recover():
    """A webhook with payment.failed transitions action to failed and does NOT increase recovered revenue."""
    cid, _ = create_test_case(amount=95000, demo_scenario="TIMEOUT")
    
    action_res = client.post(
        f"/api/v1/cases/{cid}/recovery/actions",
        headers={"Idempotency-Key": f"key-failtest-{cid}"},
        json={"scenario": "pending"}
    )
    action = action_res.json()
    order_id = action.get("provider_order_id")
    
    metrics_before = client.get("/api/v1/dashboard/metrics").json()
    rec_before = metrics_before["revenue_recovered"]
    
    payload = {
        "event": "payment.failed",
        "event_id": f"evt_fail_{uuid.uuid4().hex[:8]}",
        "payload": {
            "payment": {
                "entity": {
                    "id": f"pay_fail_{uuid.uuid4().hex[:8]}",
                    "order_id": order_id,
                    "amount": 95000,
                    "currency": "INR",
                    "status": "failed",
                    "error_code": "BAD_REQUEST_ERROR",
                    "error_description": "Insufficient funds in customer account",
                    "notes": {"case_id": cid}
                }
            }
        }
    }
    payload_bytes = json.dumps(payload).encode("utf-8")
    sig = sign_webhook_payload(payload_bytes, "mock_secret_key_123")
    
    client.post(
        "/api/v1/webhooks/razorpay",
        content=payload_bytes,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": sig}
    )
    
    updated_case = client.get(f"/api/v1/cases/{cid}").json()
    assert updated_case["status"] != "recovered"
    assert updated_case["recovered_amount"] == 0
    
    metrics_after = client.get("/api/v1/dashboard/metrics").json()
    assert metrics_after["revenue_recovered"] == rec_before

def test_reconciliation_endpoint():
    """Reconciling an action queries provider status without duplicate order creation."""
    cid, _ = create_test_case(amount=75000)
    action_res = client.post(
        f"/api/v1/cases/{cid}/recovery/actions",
        headers={"Idempotency-Key": f"key-reconcile-{cid}"},
        json={"scenario": "pending"}
    )
    action = action_res.json()
    action_id = action["action_id"]
    
    rec_res = client.post(f"/api/v1/recovery/actions/{action_id}/reconcile")
    assert rec_res.status_code == 200
    assert rec_res.json()["action_id"] == action_id
