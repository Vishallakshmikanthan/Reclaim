import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.schemas import *

client = TestClient(app)

@pytest.fixture(autouse=True)
def ensure_clean_demo_state():
    res = client.post("/api/v1/system/demo/reset")
    assert res.status_code == 200

def test_preflight_check():
    """Verify preflight reports operational readiness."""
    res = client.get("/api/v1/system/preflight")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "READY"
    assert data["database_connected"] is True
    assert len(data["checks"]) >= 4

def test_deterministic_seed_dataset():
    """Verify all 8 deterministic demo cases are seeded with exact attributes."""
    res = client.get("/api/v1/cases")
    assert res.status_code == 200
    cases = res.json()["items"]
    assert len(cases) >= 8
    
    case_map = {c["id"]: c for c in cases}
    assert "case_demo_high_value" in case_map
    assert "case_demo_upi" in case_map
    assert "case_demo_policy_block" in case_map
    assert "case_demo_pending" in case_map
    assert "case_demo_failure" in case_map
    assert "case_demo_manual" in case_map
    assert "case_demo_subscription" in case_map
    assert "case_demo_network" in case_map
    
    # Check amounts and properties
    assert case_map["case_demo_high_value"]["amount"] == 980000
    assert case_map["case_demo_policy_block"]["retry_count"] == 3
    assert case_map["case_demo_manual"]["risk_score"] == 0.85

def test_policy_block_demo_flow():
    """Verify policy block demo case: AI recommends, Policy Engine blocks, No money moves."""
    # 1. Inspect decision
    dec_res = client.post("/api/v1/cases/case_demo_policy_block/recovery/decision")
    assert dec_res.status_code == 200
    dec = dec_res.json()
    assert dec["policy_result"]["allowed"] is False
    assert len(dec["policy_result"]["blocked_rules"]) > 0

    # 2. Attempt direct execution -> Must be rejected with 422
    act_res = client.post(
        "/api/v1/cases/case_demo_policy_block/recovery/actions",
        json={"strategy": "retry_payment"},
        headers={"Idempotency-Key": "key_demo_block_test"}
    )
    assert act_res.status_code == 422
    assert "POLICY_VALIDATION_FAILED" in act_res.json()["error"]["code"]

    # 3. Verify case remains at_risk with 0 recovered revenue
    case_res = client.get("/api/v1/cases/case_demo_policy_block")
    assert case_res.json()["status"] in {"atRisk", "at_risk"}
    assert case_res.json()["recovered_amount"] == 0

def test_successful_recovery_demo_flow():
    """Verify end-to-end success flow: AI -> Policy -> Execute -> Verified -> Revenue credited."""
    # 1. Initial dashboard metrics
    m1 = client.get("/api/v1/dashboard/metrics").json()
    initial_recovered = m1["revenue_recovered"]

    # 2. Execute recovery
    act_res = client.post(
        "/api/v1/cases/case_demo_high_value/recovery/actions",
        json={"strategy": "retry_payment"},
        headers={"Idempotency-Key": "key_demo_success_test"}
    )
    assert act_res.status_code == 200
    act = act_res.json()
    assert act["verification_status"] == "verified"

    # 3. Verify case updated
    case_res = client.get("/api/v1/cases/case_demo_high_value")
    assert case_res.json()["status"] == "recovered"
    assert case_res.json()["recovered_amount"] == 980000

    # 4. Verify dashboard metrics authoritatively incremented by exactly ₹9,800.00
    m2 = client.get("/api/v1/dashboard/metrics").json()
    assert m2["revenue_recovered"] == initial_recovered + 980000

    # 5. Verify evidence trace
    trace_res = client.get("/api/v1/cases/case_demo_high_value/trace")
    assert trace_res.status_code == 200
    trace = trace_res.json()
    assert trace["recovered_amount_minor"] == 980000
    assert trace["verification_status"] == "verified"
    assert len(trace["audit_events"]) >= 2

def test_provider_failure_demo_flow():
    """Verify provider failure flow: execution returns failure, 0 revenue credited."""
    m1 = client.get("/api/v1/dashboard/metrics").json()
    initial_recovered = m1["revenue_recovered"]

    act_res = client.post(
        "/api/v1/cases/case_demo_failure/recovery/actions",
        json={"strategy": "retry_payment"},
        headers={"Idempotency-Key": "key_demo_fail_test"}
    )
    assert act_res.status_code == 200
    act = act_res.json()
    assert act["verification_status"] == "failed"

    # Verify no revenue credited
    m2 = client.get("/api/v1/dashboard/metrics").json()
    assert m2["revenue_recovered"] == initial_recovered

    case_res = client.get("/api/v1/cases/case_demo_failure")
    assert case_res.json()["status"] != "recovered"
    assert case_res.json()["recovered_amount"] == 0

def test_pending_demo_flow():
    """Verify pending flow: execution leaves verification pending, 0 revenue credited."""
    m1 = client.get("/api/v1/dashboard/metrics").json()
    initial_recovered = m1["revenue_recovered"]

    act_res = client.post(
        "/api/v1/cases/case_demo_pending/recovery/actions",
        json={"strategy": "retry_payment"},
        headers={"Idempotency-Key": "key_demo_pending_test"}
    )
    assert act_res.status_code == 200
    act = act_res.json()
    assert act["verification_status"] == "pending"

    # Financial check: NO premature revenue credited
    m2 = client.get("/api/v1/dashboard/metrics").json()
    assert m2["revenue_recovered"] == initial_recovered

    case_res = client.get("/api/v1/cases/case_demo_pending")
    assert case_res.json()["status"] == "pending"
    assert case_res.json()["recovered_amount"] == 0

def test_mixed_outcome_batch_demo():
    """Verify realistic mixed outcome batch execution: Recovered + Blocked + Failed + Pending."""
    m1 = client.get("/api/v1/dashboard/metrics").json()
    initial_recovered = m1["revenue_recovered"]

    target_case_ids = [
        "case_demo_high_value",     # Recoverable -> RECOVERED (₹9,800)
        "case_demo_policy_block",   # Exceeds max retries -> BLOCKED
        "case_demo_failure",        # Provider decline -> FAILED
        "case_demo_pending",        # Gateway delay -> PENDING
    ]

    # 1. Preview Batch
    prev_res = client.post(
        "/api/v1/recovery/batches/preview",
        json={"case_ids": target_case_ids}
    )
    assert prev_res.status_code == 200
    prev = prev_res.json()
    assert prev["selected_count"] == 4
    assert prev["blocked_count"] == 1
    assert prev["eligible_count"] == 3

    # 2. Execute Batch
    batch_res = client.post(
        "/api/v1/recovery/batches",
        json={"case_ids": target_case_ids},
        headers={"Idempotency-Key": "key_mixed_demo_batch_1"}
    )
    assert batch_res.status_code == 201
    batch = batch_res.json()
    assert batch["status"] == "PARTIALLY_COMPLETED"
    assert batch["cases_selected"] == 4
    assert batch["cases_eligible"] == 3
    assert batch["cases_blocked"] == 1
    assert batch["cases_attempted"] == 3
    assert batch["cases_recovered"] == 1
    assert batch["cases_failed"] == 1
    assert batch["cases_pending"] == 1
    assert batch["recovered_revenue_minor"] == 980000

    # 3. Verify Authoritative Metrics: Only ₹9,800 credited
    m2 = client.get("/api/v1/dashboard/metrics").json()
    assert m2["revenue_recovered"] == initial_recovered + 980000

    # 4. Batch Evidence Trace
    trace_res = client.get(f"/api/v1/recovery/batches/{batch['batch_id']}/trace")
    assert trace_res.status_code == 200
    trace = trace_res.json()
    assert trace["reconciliation_status"] == "RECONCILED"
    assert trace["recovered_revenue_minor"] == 980000

def test_idempotency_and_double_execution_protection():
    """Verify double click / rapid execution does not double revenue or create duplicate actions."""
    m1 = client.get("/api/v1/dashboard/metrics").json()
    initial_recovered = m1["revenue_recovered"]

    # First call
    res1 = client.post(
        "/api/v1/cases/case_demo_upi/recovery/actions",
        json={"strategy": "retry_payment"},
        headers={"Idempotency-Key": "double_click_key_1"}
    )
    assert res1.status_code == 200
    
    # Second call with identical key
    res2 = client.post(
        "/api/v1/cases/case_demo_upi/recovery/actions",
        json={"strategy": "retry_payment"},
        headers={"Idempotency-Key": "double_click_key_1"}
    )
    assert res2.status_code == 200
    assert res1.json()["action_id"] == res2.json()["action_id"]

    # Revenue only increased once
    m2 = client.get("/api/v1/dashboard/metrics").json()
    assert m2["revenue_recovered"] == initial_recovered + 849900

def test_three_run_determinism():
    """Verify running the demo reset and batch sequence 3 times yields identical results."""
    for run_idx in range(1, 4):
        # 1. Reset
        reset_res = client.post("/api/v1/system/demo/reset")
        assert reset_res.status_code == 200
        assert reset_res.json()["cases_seeded"] == 8

        # 2. Execute standard demo batch
        batch_res = client.post(
            "/api/v1/recovery/batches",
            json={"case_ids": ["case_demo_high_value", "case_demo_policy_block", "case_demo_failure", "case_demo_pending"]},
            headers={"Idempotency-Key": f"determinism_run_{run_idx}"}
        )
        assert batch_res.status_code == 201
        b = batch_res.json()
        assert b["status"] == "PARTIALLY_COMPLETED"
        assert b["cases_recovered"] == 1
        assert b["cases_blocked"] == 1
        assert b["cases_failed"] == 1
        assert b["cases_pending"] == 1
        assert b["recovered_revenue_minor"] == 980000
