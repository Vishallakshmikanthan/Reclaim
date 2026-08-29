"""Deterministic synthetic demo seed; evaluation data is intentionally separate."""
from ..repositories.factory import repository_context
from ..schemas import Case, FailureType, PaymentMethod, PolicyVersion, PolicyConfiguration, CaseStatus, AuditEvent

def get_demo_cases() -> list[Case]:
    return [
        Case(
            id="case_demo_high_value",
            payment_id="pay_demo_high_val",
            order_id="ord_demo_101",
            customer_id="cust_demo_101",
            customer="Enterprise Tech Labs",
            customer_email="billing@enterprisetech.test",
            customer_phone="9876543201",
            amount=980000,  # ₹9,800.00
            payment_method=PaymentMethod.upi,
            failure_type=FailureType.upi_timeout,
            failure_reason="UPI switch timeout during peak traffic",
            prob=0.88,
            expected=862400,
            demo_scenario="STANDARD",
            status=CaseStatus.at_risk,
            retry_count=0,
            contact_count_24h=0,
            risk_score=0.15
        ),
        Case(
            id="case_demo_upi",
            payment_id="payment_demo_upi",
            order_id="order_demo_001",
            customer_id="customer_demo_001",
            customer="Aarav Sharma",
            customer_email="aarav.sharma@example.test",
            customer_phone="9876543202",
            amount=849900,  # ₹8,499.00
            payment_method=PaymentMethod.upi,
            failure_type=FailureType.upi_timeout,
            failure_reason="Synthetic timeout at PSP gateway",
            prob=0.81,
            expected=688419,
            demo_scenario="STANDARD",
            status=CaseStatus.at_risk,
            retry_count=0,
            contact_count_24h=0,
            risk_score=0.12
        ),
        Case(
            id="case_demo_policy_block",
            payment_id="pay_demo_block",
            order_id="ord_demo_102",
            customer_id="cust_demo_102",
            customer="Nexus Global Logistics",
            customer_email="accounts@nexusglobal.test",
            customer_phone="9876543203",
            amount=6500000,  # ₹65,000.00
            payment_method=PaymentMethod.credit_card,
            failure_type=FailureType.card_decline,
            failure_reason="Card limit exceeded / Max retries reached",
            prob=0.45,
            expected=2925000,
            demo_scenario="B_POLICY_BLOCK",
            status=CaseStatus.at_risk,
            retry_count=3,
            contact_count_24h=2,
            risk_score=0.35
        ),
        Case(
            id="case_demo_pending",
            payment_id="pay_demo_pending",
            order_id="ord_demo_103",
            customer_id="cust_demo_103",
            customer="Kavita Mehta",
            customer_email="kavita.m@example.test",
            customer_phone="9876543204",
            amount=420000,  # ₹4,200.00
            payment_method=PaymentMethod.netbanking,
            failure_type=FailureType.bank_downtime,
            failure_reason="Bank gateway deferred verification",
            prob=0.72,
            expected=302400,
            demo_scenario="PENDING",
            status=CaseStatus.at_risk,
            retry_count=0,
            contact_count_24h=0,
            risk_score=0.18
        ),
        Case(
            id="case_demo_failure",
            payment_id="pay_demo_failure",
            order_id="ord_demo_104",
            customer_id="cust_demo_104",
            customer="Rohan Verma",
            customer_email="rohan.v@example.test",
            customer_phone="9876543205",
            amount=350000,  # ₹3,500.00
            payment_method=PaymentMethod.credit_card,
            failure_type=FailureType.card_decline,
            failure_reason="Issuer decline - card stopped",
            prob=0.62,
            expected=217000,
            demo_scenario="FAILURE",
            status=CaseStatus.at_risk,
            retry_count=0,
            contact_count_24h=0,
            risk_score=0.22
        ),
        Case(
            id="case_demo_manual",
            payment_id="pay_demo_manual",
            order_id="ord_demo_105",
            customer_id="cust_demo_105",
            customer="Apex Digital Corp",
            customer_email="security@apexdigital.test",
            customer_phone="9876543206",
            amount=950000,  # ₹9,500.00
            payment_method=PaymentMethod.credit_card,
            failure_type=FailureType.fraud_signal,
            failure_reason="High risk IP velocity / fraud anomaly",
            prob=0.15,
            expected=142500,
            demo_scenario="MANUAL_REVIEW",
            status=CaseStatus.at_risk,
            retry_count=0,
            contact_count_24h=0,
            risk_score=0.85
        ),
        Case(
            id="case_demo_subscription",
            payment_id="pay_demo_sub",
            order_id="ord_demo_106",
            customer_id="cust_demo_106",
            customer="Priya Patel",
            customer_email="priya.p@example.test",
            customer_phone="9876543207",
            amount=199900,  # ₹1,999.00
            payment_method=PaymentMethod.subscription_mandate,
            failure_type=FailureType.subscription_failure,
            failure_reason="Mandate execution window expired",
            prob=0.78,
            expected=155922,
            demo_scenario="STANDARD",
            status=CaseStatus.at_risk,
            retry_count=0,
            contact_count_24h=0,
            risk_score=0.10
        ),
        Case(
            id="case_demo_network",
            payment_id="pay_demo_network",
            order_id="ord_demo_107",
            customer_id="cust_demo_107",
            customer="Suresh Reddy",
            customer_email="suresh.r@example.test",
            customer_phone="9876543208",
            amount=125000,  # ₹1,250.00
            payment_method=PaymentMethod.upi,
            failure_type=FailureType.network_drop,
            failure_reason="Client connection dropped during 3DS callback",
            prob=0.82,
            expected=102500,
            demo_scenario="STANDARD",
            status=CaseStatus.at_risk,
            retry_count=0,
            contact_count_24h=0,
            risk_score=0.10
        ),
    ]

def seed_demo(repo=None):
    if repo is not None:
        _seed_with_repo(repo)
    else:
        with repository_context() as r:
            _seed_with_repo(r)

def _seed_with_repo(repo):
    repo.ensure_merchant()
    if not repo.active_policy():
        repo.create_policy(PolicyVersion(version="v1", created_by="demo-seed", active=True, configuration=PolicyConfiguration()))
    
    demo_cases = get_demo_cases()
    for case in demo_cases:
        if not repo.get_case(case.id):
            repo.create_case(case)
            repo.audit(AuditEvent(event_type="CASE_CREATED", case_id=case.id, actor="demo-seed"))

if __name__ == "__main__":
    seed_demo()
