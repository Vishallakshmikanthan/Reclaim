from ..schemas import *
class PolicyEngine:
    def validate(self, case: Case, policy: PolicyVersion) -> PolicyValidationResponse:
        c, blocked = policy.configuration, []
        if case.status == CaseStatus.recovered: blocked.append("Case is already recovered")
        if case.retry_count >= c.max_retries: blocked.append("Maximum retry count reached")
        if case.contact_count_24h >= c.max_contacts_24h: blocked.append("Customer contact limit reached")
        if case.amount > c.max_autonomous_amount: blocked.append("Amount exceeds autonomous limit")
        if case.risk_score > c.max_risk_score or case.failure_type == FailureType.fraud_signal: blocked.append("Fraud or high-risk signal")
        if case.prob < c.min_recovery_probability: blocked.append("Recovery probability below policy threshold")
        return PolicyValidationResponse(allowed=not blocked, blocked_rules=blocked, summary="Recovery authorized." if not blocked else f"Action blocked: {blocked[0]}", policy_version=policy.version)
class DecisionEngine:
    def decide(self, case: Case, policy: PolicyValidationResponse) -> RecoveryDecision:
        fail_val = case.failure_type.value if hasattr(case.failure_type, "value") else str(case.failure_type)
        if case.failure_type in {FailureType.insufficient_funds, FailureType.checkout_abandonment}:
            strategy = Strategy.payment_link
            recommended_intervention = "CUSTOMER_REMINDER"
            diagnosis = f"Customer payment friction or abandonment: {fail_val}"
            rationale = "Customer has valid credentials but payment stalled. Dispatching a payment link allows alternative payment methods."
        elif case.failure_type == FailureType.subscription_failure:
            strategy = Strategy.subscription_retry
            recommended_intervention = "WAIT_AND_RETRY"
            diagnosis = "Recurring mandate debit declined by issuer switch"
            rationale = "Subscription mandate retry scheduled within optimal banking clearing window."
        elif case.failure_type == FailureType.fraud_signal or case.prob < .2:
            strategy = Strategy.no_action
            recommended_intervention = "NO_ACTION"
            diagnosis = "Fraud anomaly or recovery probability below automated viability floor"
            rationale = "Automated retry on high-risk transactions is blocked to prevent chargebacks."
        else:
            strategy = Strategy.retry_payment
            recommended_intervention = "RETRY_PAYMENT"
            diagnosis = f"Transient provider or network latency for {fail_val}"
            rationale = "Transient decline with retry count within policy limit. Single bounded retry is recommended."

        priority = "Critical" if case.amount > 500000 or case.prob > .8 else "High" if case.prob > .5 else "Medium"
        expected_rec = round(case.amount * case.prob)

        evidence = [
            EvidenceItem(field="failure_type", value=fail_val, reason=f"Deterministic rule for {fail_val}"),
            EvidenceItem(field="retry_count", value=case.retry_count, reason="Evaluated against policy retry ceiling"),
            EvidenceItem(field="amount_minor", value=case.amount, reason="Evaluated against autonomous limit")
        ]

        alternatives = [
            AlternativeIntervention(intervention="ALTERNATIVE_PAYMENT_METHOD", reason_not_preferred="Direct retry preferred if within policy", estimated_confidence=0.5),
            AlternativeIntervention(intervention="MANUAL_REVIEW", reason_not_preferred="Automated rule matched deterministic pattern", estimated_confidence=0.3)
        ]

        do_not_do = [
            "Do not exceed configured max retry limit",
            "Do not initiate double debits if verification is unconfirmed"
        ]

        return RecoveryDecision(
            case_id=case.id,
            strategy=strategy,
            recovery_probability=case.prob,
            expected_recovery=expected_rec,
            priority=priority,
            explanation=rationale,
            policy_result=policy,
            next_step="Execute approved recovery action." if policy.allowed else "Route to human review.",
            decision_source=DecisionSource.deterministic_fallback,
            diagnosis=diagnosis,
            recommended_intervention=recommended_intervention,
            rationale=rationale,
            evidence=evidence,
            confidence=case.prob,
            expected_recovery_minor=expected_rec,
            alternatives=alternatives,
            do_not_do=do_not_do,
            policy_version=policy.policy_version,
            model_id=None
        )

class SafetyController:
    def check(self, case: Case, policy: PolicyValidationResponse, action_exists: bool):
        if action_exists: raise ValueError("duplicate")
        if case.status == CaseStatus.recovered: raise ValueError("recovered")
        if not policy.allowed: raise ValueError("policy")
class MockRecoveryExecutor:
    def execute(self, scenario: str | None) -> str:
        return "unknown" if scenario in {"unknown", "network_timeout"} else "timeout" if scenario == "timeout" else "failed" if scenario == "failure" else "executed"
class MockVerificationService:
    def verify(self, scenario: str | None) -> tuple[str, str | None]:
        if scenario in {"timeout", "verification_timeout"}: return "timeout", None
        if scenario in {"pending"}: return "pending", None
        if scenario in {"unknown", "network_timeout"}: return "unknown", None
        if scenario == "failure": return "failed", None
        return "verified", "txn_demo_verified"
class MetricsEngine:
    def run(self, cases: list[Case]) -> EvaluationMetrics: return EvaluationMetrics(total_cases=len(cases), recovered_cases=sum(c.status == CaseStatus.recovered for c in cases), recovered_amount=sum(c.recovered_amount for c in cases), policy_blocks=0)
