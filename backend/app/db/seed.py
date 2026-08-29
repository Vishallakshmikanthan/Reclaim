"""Deterministic synthetic demo seed; evaluation data is intentionally separate."""
from ..repositories.factory import repository_context
from ..schemas import Case, FailureType, PaymentMethod, PolicyVersion, PolicyConfiguration
def seed_demo():
    with repository_context() as repo:
        repo.ensure_merchant()
        if not repo.active_policy(): repo.create_policy(PolicyVersion(version="v1",created_by="demo-seed",active=True,configuration=PolicyConfiguration()))
        if repo.get_case("case_demo_upi"): return
        case=Case(id="case_demo_upi",payment_id="payment_demo_upi",order_id="order_demo_001",customer_id="customer_demo_001",customer="Demo Customer",customer_email="demo@example.test",customer_phone="9000000000",amount=849900,payment_method=PaymentMethod.upi,failure_type=FailureType.upi_timeout,failure_reason="Synthetic timeout",prob=.81,expected=688419)
        repo.create_case(case); repo.audit(__import__("app.schemas",fromlist=["AuditEvent"]).AuditEvent(event_type="CASE_CREATED",case_id=case.id,actor="demo-seed"))
if __name__ == "__main__": seed_demo()
