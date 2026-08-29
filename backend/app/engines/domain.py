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

class PrioritizationEngine:
    def calculate_priority(
        self, case: Case, policy_result: PolicyValidationResponse | None = None
    ) -> tuple[int, str, list[str]]:
        """Calculates a deterministic 0-100 score, priority tier, and explainable reasons."""
        reasons = []

        # 1. Base yield component (0-40 points)
        yield_score = int(round(40 * case.prob))
        reasons.append(f"Recovery probability {int(case.prob*100)}% gives {yield_score}/40 yield score")

        # 2. Failure type velocity component (0-25 points)
        fail_enum = case.failure_type if isinstance(case.failure_type, FailureType) else FailureType(case.failure_type) if hasattr(FailureType, "_value2member_map_") and case.failure_type in FailureType._value2member_map_ else None
        if fail_enum in {FailureType.upi_timeout, FailureType.bank_downtime, FailureType.network_drop}:
            fail_score = 25
            reasons.append("Transient provider/network failure has high immediate recovery yield (+25)")
        elif fail_enum in {FailureType.insufficient_funds, FailureType.checkout_abandonment, FailureType.card_decline, FailureType.overdue_invoice}:
            fail_score = 15
            reasons.append("Friction/decline failure requires alternative payment link or reminder (+15)")
        elif fail_enum == FailureType.subscription_failure:
            fail_score = 15
            reasons.append("Subscription mandate failure has scheduled retry viability (+15)")
        else:
            fail_score = 0
            reasons.append("High risk or fraud signal reduces priority (+0)")

        # 3. Freshness / Payment age component (0-15 points)
        age_str = (case.age or "").lower()
        if "min" in age_str or age_str in {"0 min", "5 min", "12 min", "15 min"}:
            age_score = 15
            reasons.append("Recent payment failure within optimal recovery window (<15m) (+15)")
        elif "h" in age_str or "hour" in age_str:
            age_score = 10
            reasons.append("Payment failure within 24 hours (+10)")
        else:
            age_score = 5
            reasons.append("Older payment failure (+5)")

        # 4. Retry capacity component (0-20 points)
        if case.retry_count == 0:
            retry_score = 20
            reasons.append("Clean candidate with 0 prior retry attempts (+20)")
        elif case.retry_count == 1:
            retry_score = 12
            reasons.append("1 prior retry attempted (+12)")
        elif case.retry_count == 2:
            retry_score = 5
            reasons.append("2 prior retries near ceiling (+5)")
        else:
            retry_score = 0
            reasons.append(f"{case.retry_count} retries attempted (retry limit reached) (+0)")

        raw_score = yield_score + fail_score + age_score + retry_score
        final_score = max(0, min(100, raw_score))

        # Policy guardrail check
        if policy_result and not policy_result.allowed:
            final_score = min(final_score, 15)
            reasons.insert(0, f"Policy blocked: {policy_result.blocked_rules[0] if policy_result.blocked_rules else 'Not eligible'}")
        elif str(case.status).lower().endswith("recovered"):
            final_score = 0
            reasons.insert(0, "Case is already recovered (0)")

        # Priority tier
        if final_score >= 80:
            tier = "Critical"
        elif final_score >= 60:
            tier = "High"
        elif final_score >= 35:
            tier = "Medium"
        else:
            tier = "Low"

        return final_score, tier, reasons

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

    def analyze_batch(self, batch_context: SanitizedBatchContext) -> AIBatchAnalysis:
        top_failures = sorted(
            batch_context.failure_type_distribution.items(),
            key=lambda x: x[1],
            reverse=True
        )
        patterns = [f"{name} ({count} cases)" for name, count in top_failures[:3]]
        
        summary = (
            f"Evaluated {batch_context.total_cases} at-risk cases totaling "
            f"₹{batch_context.total_amount_minor / 100:,.2f} under deterministic recovery policy. "
            f"Primary failure concentration is in {top_failures[0][0] if top_failures else 'transient switch timeouts'}."
        )
        
        recommended_strategy = (
            "Execute bounded automated retries for transient provider declines within retry limits; "
            "dispatch customer payment reminders for friction declines; block high-risk fraud cases."
        )
        
        priority_reason = (
            "Cases are prioritized by expected recoverable value (Amount × Probability), "
            "failure recency, and remaining retry capacity."
        )
        
        risks = [
            "Do not exceed merchant 24-hour customer contact ceiling",
            "Prevent double debits using server-authoritative idempotency keys"
        ]
        
        do_not_do = [
            "Do not execute automated retry on transactions exceeding autonomous amount limit",
            "Do not execute automated actions on cases with fraud signals"
        ]
        
        return AIBatchAnalysis(
            summary=summary,
            dominant_failure_patterns=patterns,
            recommended_strategy=recommended_strategy,
            priority_reason=priority_reason,
            risks=risks,
            do_not_do=do_not_do,
            decision_source=DecisionSource.deterministic_fallback,
            model_id=None,
            latency_ms=0
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
