import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.schemas import *

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_policy_and_data():
    client.put("/api/v1/policies/current", json={
        "configuration": {
            "max_retries": 3,
            "min_recovery_probability": 0.2,
            "max_autonomous_amount": 1000000,
            "max_contacts_24h": 2,
            "max_risk_score": 0.6
        },
        "created_by": "measurement_fixture"
    })

def create_case_payload(case_id=None, payment_id=None, amount=150000, prob=0.8, status=CaseStatus.at_risk):
    c_id = case_id or f"case_{uuid.uuid4().hex[:8]}"
    p_id = payment_id or f"pay_{uuid.uuid4().hex[:8]}"
    return {
        "id": c_id,
        "payment_id": p_id,
        "order_id": f"ord_{p_id}",
        "customer_id": f"cust_{c_id}",
        "customer": "Measurement Test User",
        "customer_email": "meas@example.com",
        "customer_phone": "9876543210",
        "amount": amount,
        "payment_method": PaymentMethod.upi.value,
        "failure_type": FailureType.upi_timeout.value,
        "failure_reason": "UPI switch timeout",
        "prob": prob,
        "expected": int(amount * prob),
        "status": status.value if hasattr(status, "value") else str(status),
        "retry_count": 0,
        "max_retries": 3,
        "contact_count_24h": 0,
        "max_contacts_24h": 2,
        "risk_score": 0.1,
    }

def test_recovery_funnel_metrics():
    merchant_hdr = {"X-Merchant-Id": f"merch_funnel_{uuid.uuid4().hex[:6]}"}
    
    # Initialize policy for this merchant
    client.put("/api/v1/policies/current", json={
        "configuration": {
            "max_retries": 3,
            "min_recovery_probability": 0.2,
            "max_autonomous_amount": 1000000,
            "max_contacts_24h": 2,
            "max_risk_score": 0.6
        },
        "created_by": "measurement_fixture"
    }, headers=merchant_hdr)
    
    # Create 3 cases: 1 eligible (to be recovered), 1 eligible (atRisk), 1 blocked (exceeds autonomous limit)
    c1 = f"c_fn_1_{uuid.uuid4().hex[:4]}"
    c2 = f"c_fn_2_{uuid.uuid4().hex[:4]}"
    c3 = f"c_fn_3_{uuid.uuid4().hex[:4]}"
    
    client.post("/api/v1/cases", json=create_case_payload(c1, amount=200000, prob=0.85), headers=merchant_hdr)
    client.post("/api/v1/cases", json=create_case_payload(c2, amount=150000, prob=0.75), headers=merchant_hdr)
    client.post("/api/v1/cases", json=create_case_payload(c3, amount=2500000, prob=0.90), headers=merchant_hdr) # Exceeds 10,000 INR

    # Recover case 1
    rec_res = client.post(
        f"/api/v1/cases/{c1}/recovery/actions", 
        json={"strategy": "retry_payment", "scenario": "STANDARD"}, 
        headers={"Idempotency-Key": f"idem_meas_{uuid.uuid4().hex[:6]}", **merchant_hdr}
    )
    assert rec_res.status_code == 200

    # Fetch Recovery Funnel
    funnel_res = client.get("/api/v1/metrics/funnel", headers=merchant_hdr)
    assert funnel_res.status_code == 200
    funnel = funnel_res.json()

    assert funnel["total_cases"] == 3
    assert funnel["revenue_at_risk_minor"] == 200000 + 150000 + 2500000
    assert funnel["eligible_cases"] == 1  # c2 remains eligible
    assert funnel["eligible_revenue_minor"] == 150000
    assert funnel["policy_blocked_cases"] == 1  # c3 blocked by amount ceiling
    assert funnel["policy_blocked_revenue_minor"] == 2500000
    assert funnel["recovered_cases"] == 1  # c1 recovered
    assert funnel["recovered_revenue_minor"] == 200000
    assert funnel["remaining_revenue_at_risk_minor"] == (200000 + 150000 + 2500000) - 200000

    # Explicit Denominators check
    assert funnel["case_recovery_rate_denominator"] == "recovered_cases / attempted_cases"
    assert funnel["revenue_recovery_rate_denominator"] == "recovered_revenue_minor / attempted_revenue_minor"
    assert funnel["case_recovery_rate"] == 100.0  # 1 recovered / 1 attempted
    assert funnel["revenue_recovery_rate"] == 100.0  # 200000 / 200000

    # Verify stage breakdown
    stage_names = [s["stage_name"] for s in funnel["stages"]]
    assert "Revenue At Risk" in stage_names
    assert "Policy Eligible" in stage_names
    assert "Verified Recovered" in stage_names
    assert "Policy Blocked" in stage_names

def test_revenue_reconciliation_exactness():
    merchant_hdr = {"X-Merchant-Id": f"merch_rec_{uuid.uuid4().hex[:6]}"}
    
    # Initialize policy for this merchant
    client.put("/api/v1/policies/current", json={
        "configuration": {
            "max_retries": 3,
            "min_recovery_probability": 0.2,
            "max_autonomous_amount": 1000000,
            "max_contacts_24h": 2,
            "max_risk_score": 0.6
        },
        "created_by": "measurement_fixture"
    }, headers=merchant_hdr)

    # Setup 4 transactions
    c1 = f"c_rc_1_{uuid.uuid4().hex[:4]}"
    c2 = f"c_rc_2_{uuid.uuid4().hex[:4]}"
    c3 = f"c_rc_3_{uuid.uuid4().hex[:4]}"
    c4 = f"c_rc_4_{uuid.uuid4().hex[:4]}"
    
    client.post("/api/v1/cases", json=create_case_payload(c1, amount=120000), headers=merchant_hdr)
    client.post("/api/v1/cases", json=create_case_payload(c2, amount=180000), headers=merchant_hdr)
    client.post("/api/v1/cases", json=create_case_payload(c3, amount=240000), headers=merchant_hdr)
    client.post("/api/v1/cases", json=create_case_payload(c4, amount=300000), headers=merchant_hdr)

    # Recover c1 and c3
    client.post(f"/api/v1/cases/{c1}/recovery/actions", json={}, headers={"Idempotency-Key": f"key_1_{uuid.uuid4().hex[:6]}", **merchant_hdr})
    client.post(f"/api/v1/cases/{c3}/recovery/actions", json={}, headers={"Idempotency-Key": f"key_3_{uuid.uuid4().hex[:6]}", **merchant_hdr})

    # Check dashboard metrics
    dash_res = client.get("/api/v1/dashboard/metrics", headers=merchant_hdr)
    assert dash_res.status_code == 200
    dash = dash_res.json()

    # Reconcile sum of verified cases vs dashboard revenue_recovered
    expected_recovered = 120000 + 240000
    assert dash["revenue_recovered"] == expected_recovered
    assert dash["recovered_count"] == 2

    # Check funnel reconciliation
    funnel = client.get("/api/v1/metrics/funnel", headers=merchant_hdr).json()
    assert funnel["recovered_revenue_minor"] == dash["revenue_recovered"]

def test_batch_reconciliation_exactness():
    merchant_hdr = {"X-Merchant-Id": f"merch_batch_rec_{uuid.uuid4().hex[:6]}"}
    
    # Initialize policy for this merchant
    client.put("/api/v1/policies/current", json={
        "configuration": {
            "max_retries": 3,
            "min_recovery_probability": 0.2,
            "max_autonomous_amount": 1000000,
            "max_contacts_24h": 2,
            "max_risk_score": 0.6
        },
        "created_by": "measurement_fixture"
    }, headers=merchant_hdr)

    c1 = f"b_case_1_{uuid.uuid4().hex[:4]}"
    c2 = f"b_case_2_{uuid.uuid4().hex[:4]}"
    
    client.post("/api/v1/cases", json=create_case_payload(c1, amount=100000), headers=merchant_hdr)
    client.post("/api/v1/cases", json=create_case_payload(c2, amount=200000), headers=merchant_hdr)

    exec_res = client.post(
        "/api/v1/recovery/batches",
        json={"case_ids": [c1, c2]},
        headers={"Idempotency-Key": f"batch_recon_key_{uuid.uuid4().hex[:6]}", **merchant_hdr}
    )
    assert exec_res.status_code == 201
    batch_data = exec_res.json()
    batch_id = batch_data["batch_id"]

    assert batch_data["recovered_revenue_minor"] == 300000

    # Get Batch Evidence Trace
    trace_res = client.get(f"/api/v1/recovery/batches/{batch_id}/trace", headers=merchant_hdr)
    assert trace_res.status_code == 200
    trace = trace_res.json()

    assert trace["batch_id"] == batch_id
    assert trace["reconciliation_status"] == "RECONCILED"
    assert trace["recovered_revenue_minor"] == 300000
    assert len(trace["items"]) == 2

def test_duplicate_events_cannot_inflate_revenue():
    merchant_hdr = {"X-Merchant-Id": f"merch_dup_{uuid.uuid4().hex[:6]}"}
    
    # Initialize policy
    client.put("/api/v1/policies/current", json={
        "configuration": {
            "max_retries": 3,
            "min_recovery_probability": 0.2,
            "max_autonomous_amount": 1000000,
            "max_contacts_24h": 2,
            "max_risk_score": 0.6
        },
        "created_by": "measurement_fixture"
    }, headers=merchant_hdr)

    c1 = f"dup_case_1_{uuid.uuid4().hex[:4]}"
    client.post("/api/v1/cases", json=create_case_payload(c1, amount=150000), headers=merchant_hdr)

    # First recovery action
    res1 = client.post(f"/api/v1/cases/{c1}/recovery/actions", json={}, headers={"Idempotency-Key": "dup_key_1", **merchant_hdr})
    assert res1.status_code == 200

    dash1 = client.get("/api/v1/dashboard/metrics", headers=merchant_hdr).json()
    assert dash1["revenue_recovered"] == 150000

    # Attempt second recovery with duplicate idempotency key (idempotent result)
    res2 = client.post(f"/api/v1/cases/{c1}/recovery/actions", json={}, headers={"Idempotency-Key": "dup_key_1", **merchant_hdr})
    assert res2.status_code == 200

    # Attempt second recovery with different key on already recovered case (blocked by policy engine)
    res3 = client.post(f"/api/v1/cases/{c1}/recovery/actions", json={}, headers={"Idempotency-Key": "dup_key_2", **merchant_hdr})
    assert res3.status_code in {400, 422}

    # Verify revenue recovered has NOT increased
    dash2 = client.get("/api/v1/dashboard/metrics", headers=merchant_hdr).json()
    assert dash2["revenue_recovered"] == 150000

def test_intervention_performance_metrics_sample_size():
    merchant_hdr = {"X-Merchant-Id": f"merch_interv_{uuid.uuid4().hex[:6]}"}
    
    # Initialize policy
    client.put("/api/v1/policies/current", json={
        "configuration": {
            "max_retries": 3,
            "min_recovery_probability": 0.2,
            "max_autonomous_amount": 1000000,
            "max_contacts_24h": 2,
            "max_risk_score": 0.6
        },
        "created_by": "measurement_fixture"
    }, headers=merchant_hdr)

    c1 = f"c_int_1_{uuid.uuid4().hex[:4]}"
    c2 = f"c_int_2_{uuid.uuid4().hex[:4]}"
    
    client.post("/api/v1/cases", json=create_case_payload(c1, amount=100000), headers=merchant_hdr)
    client.post("/api/v1/cases", json=create_case_payload(c2, amount=150000), headers=merchant_hdr)

    # Execute retry_payment
    client.post(f"/api/v1/cases/{c1}/recovery/actions", json={"strategy": "retry_payment"}, headers={"Idempotency-Key": f"k_1_{uuid.uuid4().hex[:4]}", **merchant_hdr})
    
    funnel = client.get("/api/v1/metrics/funnel", headers=merchant_hdr).json()
    interventions = funnel["interventions"]
    assert len(interventions) >= 1

    retry_perf = next(i for i in interventions if i["intervention"] == "retry_payment")
    assert retry_perf["sample_size"] == 1
    assert retry_perf["attempts"] == 1
    assert retry_perf["successes"] == 1
    assert "n=1" in retry_perf["recovery_rate_label"]

def test_case_evidence_trace():
    merchant_hdr = {"X-Merchant-Id": f"merch_trace_{uuid.uuid4().hex[:6]}"}
    
    # Initialize policy
    client.put("/api/v1/policies/current", json={
        "configuration": {
            "max_retries": 3,
            "min_recovery_probability": 0.2,
            "max_autonomous_amount": 1000000,
            "max_contacts_24h": 2,
            "max_risk_score": 0.6
        },
        "created_by": "measurement_fixture"
    }, headers=merchant_hdr)

    c1 = f"c_trace_1_{uuid.uuid4().hex[:4]}"
    client.post("/api/v1/cases", json=create_case_payload(c1, amount=180000), headers=merchant_hdr)
    client.post(f"/api/v1/cases/{c1}/recovery/actions", json={}, headers={"Idempotency-Key": f"trace_key_1_{uuid.uuid4().hex[:4]}", **merchant_hdr})

    trace_res = client.get(f"/api/v1/cases/{c1}/trace", headers=merchant_hdr)
    assert trace_res.status_code == 200
    trace = trace_res.json()

    assert trace["case_id"] == c1
    assert trace["recovered_amount_minor"] == 180000
    assert trace["verification_status"] == "verified"
    assert trace["action_id"] is not None
    assert len(trace["audit_events"]) >= 1

def test_controlled_evaluation_deterministic_vs_nemotron():
    eval_res = client.get("/api/v1/evaluation/recovery")
    assert eval_res.status_code == 200
    eval_data = eval_res.json()

    assert eval_data["sample_size"] == 50
    assert eval_data["policy_violations"] == 0
    assert eval_data["evaluation_mode"] == "OFFLINE_HELD_OUT_SYNTHETIC"

    base = eval_data["deterministic_baseline"]
    nemotron = eval_data["nemotron_assisted"]

    assert base["sample_size"] == 50
    assert base["policy_violations"] == 0
    assert nemotron["sample_size"] == 50
    assert nemotron["policy_violations"] == 0

    # Ensure lift calculations are mathematically exact
    assert eval_data["absolute_revenue_lift_minor"] == nemotron["recovered_revenue_minor"] - base["recovered_revenue_minor"]
    assert eval_data["absolute_case_lift"] == nemotron["cases_recovered"] - base["cases_recovered"]
    assert len(eval_data["limitations"]) >= 2

def test_merchant_isolation_in_funnel():
    merch_a = f"merch_a_{uuid.uuid4().hex[:6]}"
    merch_b = f"merch_b_{uuid.uuid4().hex[:6]}"
    
    # Initialize policy for merchant A
    client.put("/api/v1/policies/current", json={
        "configuration": {
            "max_retries": 3,
            "min_recovery_probability": 0.2,
            "max_autonomous_amount": 1000000,
            "max_contacts_24h": 2,
            "max_risk_score": 0.6
        },
        "created_by": "measurement_fixture"
    }, headers={"X-Merchant-Id": merch_a})

    # Initialize policy for merchant B
    client.put("/api/v1/policies/current", json={
        "configuration": {
            "max_retries": 3,
            "min_recovery_probability": 0.2,
            "max_autonomous_amount": 1000000,
            "max_contacts_24h": 2,
            "max_risk_score": 0.6
        },
        "created_by": "measurement_fixture"
    }, headers={"X-Merchant-Id": merch_b})
    
    # Merchant A creates and recovers case
    c1 = f"c_m1_{uuid.uuid4().hex[:4]}"
    client.post("/api/v1/cases", json=create_case_payload(c1, amount=500000), headers={"X-Merchant-Id": merch_a})
    client.post(f"/api/v1/cases/{c1}/recovery/actions", json={}, headers={"X-Merchant-Id": merch_a, "Idempotency-Key": "alpha_key_1"})

    # Merchant B checks funnel
    funnel_b = client.get("/api/v1/metrics/funnel", headers={"X-Merchant-Id": merch_b}).json()
    assert funnel_b["total_cases"] == 0
    assert funnel_b["recovered_revenue_minor"] == 0

    # Merchant A checks funnel
    funnel_a = client.get("/api/v1/metrics/funnel", headers={"X-Merchant-Id": merch_a}).json()
    assert funnel_a["total_cases"] == 1
    assert funnel_a["recovered_revenue_minor"] == 500000
