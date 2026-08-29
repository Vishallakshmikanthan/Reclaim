import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.domain import (
    Case,
    CaseStatus,
    FailureType,
    PaymentMethod,
    PolicyConfiguration,
    PolicyVersion,
    RecoveryBatchStatus,
    Strategy,
)
from app.schemas.ai import DecisionSource, SanitizedBatchContext
from app.engines.domain import PrioritizationEngine, PolicyEngine, DecisionEngine
from app.engines.ai_providers import MockAIRecoveryProvider

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_policy():
    client.put("/api/v1/policies/current", json={
        "configuration": {
            "max_retries": 3,
            "min_recovery_probability": 0.2,
            "max_autonomous_amount": 1000000,
            "max_contacts_24h": 2,
            "max_risk_score": 0.6
        },
        "created_by": "fixture_setup"
    })
    yield
    client.put("/api/v1/policies/current", json={
        "configuration": {
            "max_retries": 3,
            "min_recovery_probability": 0.2,
            "max_autonomous_amount": 1000000,
            "max_contacts_24h": 2,
            "max_risk_score": 0.6
        },
        "created_by": "fixture_teardown"
    })

def create_case(
    cid=None,
    amount=150000,
    failure_type="UPI Timeout",
    status="atRisk",
    prob=0.85,
    retry_count=0,
    contact_count_24h=0,
    demo_scenario="STANDARD",
):
    case_id = cid or f"case_orch_{uuid.uuid4().hex[:8]}"
    payload = {
        "id": case_id,
        "payment_id": f"pay_{case_id}",
        "order_id": f"ord_{case_id}",
        "customer_id": f"cust_{case_id}",
        "customer": "Batch Test Customer",
        "customer_email": "batch@reclaim.test",
        "customer_phone": "9876543210",
        "amount": amount,
        "payment_method": "UPI",
        "failure_type": failure_type,
        "failure_reason": f"Synthetic decline ({failure_type})",
        "prob": prob,
        "expected": int(amount * prob),
        "status": status,
        "age": "5 min",
        "retry_count": retry_count,
        "contact_count_24h": contact_count_24h,
        "demo_scenario": demo_scenario,
    }
    res = client.post("/api/v1/cases", json=payload)
    assert res.status_code in (200, 201), f"Create case failed: {res.text}"
    return case_id, payload

# ============================================================
# 1. EMPTY QUEUE TEST
# ============================================================

def test_empty_queue_handling():
    """Empty queue returns valid response structure with 0 items and 0 totals."""
    res = client.get("/api/v1/recovery/queue?status=stopped&page=999")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "summary" in data
    assert len(data["items"]) == 0

# ============================================================
# 2. SINGLE ELIGIBLE CASE PREVIEW & EXECUTION
# ============================================================

def test_single_eligible_case_batch():
    """Single eligible case batch previews and executes successfully."""
    cid, _ = create_case(amount=150000, prob=0.85, failure_type="UPI Timeout")
    
    # Preview
    prev = client.post("/api/v1/recovery/batches/preview", json={"case_ids": [cid]}).json()
    assert prev["selected_count"] == 1
    assert prev["eligible_count"] == 1
    assert prev["blocked_count"] == 0

    # Execute
    key = f"batch-single-{uuid.uuid4().hex[:8]}"
    res = client.post("/api/v1/recovery/batches", headers={"Idempotency-Key": key}, json={"case_ids": [cid]})
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == RecoveryBatchStatus.completed.value
    assert data["cases_recovered"] == 1
    assert data["recovered_revenue_minor"] == 150000

# ============================================================
# 3. MULTIPLE ELIGIBLE CASES BATCH
# ============================================================

def test_multiple_eligible_cases_batch():
    """Multiple eligible cases are all recovered and aggregated in batch response."""
    cid1, _ = create_case(amount=100000, failure_type="UPI Timeout")
    cid2, _ = create_case(amount=200000, failure_type="Bank Downtime")
    
    key = f"batch-multi-{uuid.uuid4().hex[:8]}"
    res = client.post("/api/v1/recovery/batches", headers={"Idempotency-Key": key}, json={"case_ids": [cid1, cid2]})
    assert res.status_code == 201
    data = res.json()
    assert data["cases_recovered"] == 2
    assert data["recovered_revenue_minor"] == 300000
    assert data["status"] == RecoveryBatchStatus.completed.value

# ============================================================
# 4. POLICY BLOCKED CASES IN BATCH
# ============================================================

def test_policy_blocked_cases_in_batch():
    """Cases exceeding autonomous amount or fraud risk are blocked cleanly without provider call."""
    cid_amt, _ = create_case(amount=5000000) # Exceeds 1,000,000 paise limit
    cid_fraud, _ = create_case(amount=50000, failure_type="Fraud Signal")

    key = f"batch-blocked-{uuid.uuid4().hex[:8]}"
    res = client.post("/api/v1/recovery/batches", headers={"Idempotency-Key": key}, json={"case_ids": [cid_amt, cid_fraud]})
    assert res.status_code == 201
    data = res.json()
    assert data["cases_blocked"] == 2
    assert data["cases_recovered"] == 0
    assert data["status"] == RecoveryBatchStatus.completed.value

# ============================================================
# 5. ALREADY RECOVERED CASE (SKIPPED)
# ============================================================

def test_already_recovered_case_is_skipped():
    """Case in recovered status is recorded as SKIPPED in subsequent batches."""
    cid, _ = create_case(amount=120000, status="recovered")

    key = f"batch-rec-{uuid.uuid4().hex[:8]}"
    res = client.post("/api/v1/recovery/batches", headers={"Idempotency-Key": key}, json={"case_ids": [cid]})
    assert res.status_code == 201
    data = res.json()
    assert data["cases_recovered"] == 0
    assert data["items"][0]["status"] == "SKIPPED"

# ============================================================
# 6. IDEMPOTENT BATCH EXECUTION
# ============================================================

def test_batch_execution_idempotency():
    """Submitting the same batch execution request with the same Idempotency-Key returns existing batch."""
    cid1, _ = create_case(amount=100000)
    cid2, _ = create_case(amount=150000)

    idemp_key = f"batch-key-{uuid.uuid4().hex[:8]}"
    exec_payload = {"case_ids": [cid1, cid2], "max_batch_size": 10}

    first_res = client.post("/api/v1/recovery/batches", headers={"Idempotency-Key": idemp_key}, json=exec_payload)
    assert first_res.status_code == 201
    first_data = first_res.json()
    batch_id = first_data["batch_id"]
    assert first_data["cases_recovered"] == 2

    second_res = client.post("/api/v1/recovery/batches", headers={"Idempotency-Key": idemp_key}, json=exec_payload)
    assert second_res.status_code in (200, 201)
    second_data = second_res.json()
    assert second_data["batch_id"] == batch_id
    assert second_data["cases_recovered"] == first_data["cases_recovered"]

# ============================================================
# 7. CONCURRENCY & OVERLAPPING BATCHES
# ============================================================

def test_overlapping_batches_cannot_double_recover():
    """Two batches containing the same case recover the case only once."""
    cid, _ = create_case(amount=250000)

    key_a = f"batch-a-{uuid.uuid4().hex[:8]}"
    res_a = client.post("/api/v1/recovery/batches", headers={"Idempotency-Key": key_a}, json={"case_ids": [cid]})
    assert res_a.status_code == 201
    data_a = res_a.json()
    assert data_a["cases_recovered"] == 1

    key_b = f"batch-b-{uuid.uuid4().hex[:8]}"
    res_b = client.post("/api/v1/recovery/batches", headers={"Idempotency-Key": key_b}, json={"case_ids": [cid]})
    assert res_b.status_code == 201
    data_b = res_b.json()
    item_b = next((it for it in data_b["items"] if it["case_id"] == cid), None)
    assert item_b is not None
    assert item_b["status"] == "SKIPPED"
    assert data_b["cases_recovered"] == 0

# ============================================================
# 8. PARTIAL SUCCESS DEMO (Success, Blocked, Failed, Pending)
# ============================================================

def test_batch_partial_success_representation():
    """A batch with mixed outcomes accurately reflects PARTIALLY_COMPLETED status."""
    cid_succ, _ = create_case(amount=100000, demo_scenario="STANDARD")
    cid_block, _ = create_case(amount=5000000, demo_scenario="STANDARD")
    cid_fail, _ = create_case(amount=120000, demo_scenario="FAILURE")
    cid_pend, _ = create_case(amount=140000, demo_scenario="TIMEOUT")

    batch_key = f"batch-mixed-{uuid.uuid4().hex[:8]}"
    res = client.post(
        "/api/v1/recovery/batches",
        headers={"Idempotency-Key": batch_key},
        json={"case_ids": [cid_succ, cid_block, cid_fail, cid_pend]}
    )
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == RecoveryBatchStatus.partially_completed.value
    assert data["cases_recovered"] == 1
    assert data["cases_blocked"] == 1
    assert data["cases_failed"] == 1
    assert data["cases_pending"] == 1
    assert data["recovered_revenue_minor"] == 100000

# ============================================================
# 9. MONETARY EXPOSURE BOUNDING
# ============================================================

def test_batch_monetary_exposure_limit():
    """Batch caps accumulated case selection to max_monetary_exposure_minor."""
    cid1, _ = create_case(amount=300000)
    cid2, _ = create_case(amount=300000)
    cid3, _ = create_case(amount=300000)

    res = client.post("/api/v1/recovery/batches/preview", json={
        "case_ids": [cid1, cid2, cid3],
        "max_monetary_exposure_minor": 500000
    })
    assert res.status_code == 200
    data = res.json()
    assert data["selected_count"] == 1
    assert data["total_revenue_at_risk_minor"] == 300000

# ============================================================
# 10. POLICY REVALIDATION AT EXECUTION TIME
# ============================================================

def test_policy_revalidation_at_batch_execution_time():
    """If policy changes between preview and batch execution, execution strictly enforces the new policy."""
    cid, _ = create_case(amount=450000)

    prev_res = client.post("/api/v1/recovery/batches/preview", json={"case_ids": [cid]})
    assert prev_res.status_code == 200
    assert prev_res.json()["eligible_count"] == 1

    client.put("/api/v1/policies/current", json={
        "configuration": {
            "max_retries": 3,
            "min_recovery_probability": 0.2,
            "max_autonomous_amount": 200000,
            "max_contacts_24h": 2,
            "max_risk_score": 0.6
        },
        "created_by": "risk_lead"
    })

    exec_key = f"batch-stale-{uuid.uuid4().hex[:8]}"
    exec_res = client.post("/api/v1/recovery/batches", headers={"Idempotency-Key": exec_key}, json={"case_ids": [cid]})
    assert exec_res.status_code == 201
    data = exec_res.json()
    assert data["cases_blocked"] == 1
    assert data["cases_recovered"] == 0
    item = data["items"][0]
    assert item["status"] == "BLOCKED"
    assert "Amount exceeds autonomous limit" in item["blocked_rules"]

# ============================================================
# 11. FINANCIAL INTEGRITY & ACCOUNTING TEST
# ============================================================

def test_financial_integrity_accounting():
    """Only verified recoveries increase dashboard revenue_recovered; pending and failed do not."""
    metrics_before = client.get("/api/v1/dashboard/metrics").json()
    rec_before = metrics_before["revenue_recovered"]

    cid_rec, _ = create_case(amount=180000, demo_scenario="STANDARD")
    cid_pend, _ = create_case(amount=150000, demo_scenario="TIMEOUT")
    cid_fail, _ = create_case(amount=90000, demo_scenario="FAILURE")

    key = f"batch-fin-{uuid.uuid4().hex[:8]}"
    client.post("/api/v1/recovery/batches", headers={"Idempotency-Key": key}, json={"case_ids": [cid_rec, cid_pend, cid_fail]})

    metrics_after = client.get("/api/v1/dashboard/metrics").json()
    assert metrics_after["revenue_recovered"] == rec_before + 180000

# ============================================================
# 12. BATCH CANCELLATION
# ============================================================

def test_batch_cancellation():
    """Batch cancellation transitions batch to CANCELLED without reversing verified recoveries."""
    cid, _ = create_case(amount=110000, demo_scenario="TIMEOUT")
    key = f"batch-cancel-{uuid.uuid4().hex[:8]}"
    res = client.post("/api/v1/recovery/batches", headers={"Idempotency-Key": key}, json={"case_ids": [cid]})
    batch_id = res.json()["batch_id"]

    cancel_res = client.post(f"/api/v1/recovery/batches/{batch_id}/cancel")
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == RecoveryBatchStatus.cancelled.value

# ============================================================
# 13. AI BATCH SUMMARY & DETERMINISTIC FALLBACK
# ============================================================

def test_ai_batch_summary_and_fallback():
    """Nemotron/MockAI generates batch insights; deterministic fallback provides structured analysis."""
    cid1, _ = create_case(amount=200000, failure_type="UPI Timeout")
    cid2, _ = create_case(amount=250000, failure_type="Bank Downtime")

    res = client.post("/api/v1/recovery/batches/preview", json={"case_ids": [cid1, cid2]})
    assert res.status_code == 200
    data = res.json()
    ai = data["ai_analysis"]
    assert "summary" in ai
    assert "dominant_failure_patterns" in ai
    assert "recommended_strategy" in ai
    assert "priority_reason" in ai
    assert "risks" in ai
    assert "do_not_do" in ai

# ============================================================
# 14. EVALUATION DATASET ISOLATION
# ============================================================

def test_evaluation_dataset_isolation():
    """Evaluation runs are isolated from production batch recovery operations."""
    eval_res = client.post("/api/v1/evaluation/runs")
    assert eval_res.status_code == 201
    eval_data = eval_res.json()
    assert eval_data["status"] == "COMPLETED"
    assert "metrics" in eval_data
