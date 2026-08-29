import json
from datetime import datetime, timezone
from ..core.config import get_settings
from ..core.errors import (
    AppError,
    CaseNotFoundError,
    DuplicateActionError,
    PolicyValidationError,
    RecoveryExecutionError,
    ServiceUnavailableError,
    WebhookVerificationError,
)
from ..engines import *
from ..schemas import *

def utcnow():
    return datetime.now(timezone.utc)

class Services:
    policy_engine, decision_engine, safety, executor, verifier, metrics = (
        PolicyEngine(),
        DecisionEngine(),
        SafetyController(),
        MockRecoveryExecutor(),
        MockVerificationService(),
        MetricsEngine(),
    )

    def __init__(
        self,
        repo,
        provider: RecoveryProvider | None = None,
        ai_provider: AIRecoveryProvider | None = None,
    ):
        self.repo = repo
        self.failures = {}
        self.settings = get_settings()
        if provider:
            self.provider = provider
        elif self.settings.recovery_provider == "razorpay_test":
            if self.settings.razorpay_key_id and self.settings.razorpay_key_secret:
                self.provider = RazorpayTestProvider(
                    key_id=self.settings.razorpay_key_id,
                    key_secret=self.settings.razorpay_key_secret,
                    webhook_secret=self.settings.razorpay_webhook_secret or self.settings.razorpay_key_secret,
                )
            else:
                self.provider = MockRazorpayTestProvider()
        else:
            self.provider = SimulatedRecoveryProvider()

        if ai_provider is not None:
            self.ai_provider = ai_provider
        elif self.settings.ai_provider == "mock":
            self.ai_provider = MockAIRecoveryProvider()
        elif self.settings.ai_provider == "nemotron" and self.settings.nvidia_api_key:
            self.ai_provider = NemotronRecoveryProvider(
                api_key=self.settings.nvidia_api_key,
                model=self.settings.nvidia_nemotron_model,
                base_url=self.settings.nvidia_api_base_url,
                timeout_seconds=self.settings.ai_request_timeout_seconds,
            )
        else:
            self.ai_provider = None

    def audit(self, event_type: str, **kwargs) -> AuditEvent:
        return self.repo.audit(AuditEvent(event_type=event_type, **kwargs))

    def case(self, case_id: str) -> Case:
        case = self.repo.get_case(case_id)
        if not case:
            raise CaseNotFoundError()
        return case

    def policy(self) -> PolicyVersion:
        policy = self.repo.active_policy()
        if not policy:
            raise ServiceUnavailableError("No active policy is configured.")
        return policy

    def validate(self, case_id: str) -> PolicyValidationResponse:
        if self.failures.get("policy") == "unavailable":
            raise ServiceUnavailableError("Policy engine is unavailable.")
        result = self.policy_engine.validate(self.case(case_id), self.policy())
        self.audit(
            "POLICY_APPROVED" if result.allowed else "POLICY_BLOCKED",
            case_id=case_id,
            policy_version=result.policy_version,
            metadata={"blocked_rules": result.blocked_rules},
        )
        return result

    def decision(self, case_id: str) -> RecoveryDecision:
        import time
        case = self.case(case_id)
        policy_val = self.validate(case_id)
        active_policy = self.policy()

        if self.ai_provider:
            start_time = time.perf_counter()
            ai_telemetry.record_invocation()
            try:
                sanitized_ctx = ContextSanitizer.sanitize(case, active_policy)
                ai_rec = self.ai_provider.generate_recommendation(
                    sanitized_ctx, scenario=case.demo_scenario
                )
                latency_ms = int((time.perf_counter() - start_time) * 1000)

                # Strategy mapping
                interv = ai_rec.recommended_intervention
                if interv in {InterventionEnum.RETRY_PAYMENT, InterventionEnum.WAIT_AND_RETRY}:
                    strat = Strategy.retry_payment
                elif interv == InterventionEnum.CUSTOMER_REMINDER:
                    strat = Strategy.customer_reminder
                elif interv == InterventionEnum.ALTERNATIVE_PAYMENT_METHOD:
                    strat = Strategy.payment_link
                elif interv == InterventionEnum.MANUAL_REVIEW:
                    strat = Strategy.human_escalation
                elif interv == InterventionEnum.NO_ACTION:
                    strat = Strategy.no_action
                else:
                    strat = Strategy.retry_payment

                exp_rec = min(ai_rec.expected_recovery_minor, case.amount)
                priority = "Critical" if case.amount > 500000 or ai_rec.confidence > 0.8 else "High" if ai_rec.confidence > 0.5 else "Medium"
                
                decision_src = (
                    DecisionSource.ai_nemotron
                    if isinstance(self.ai_provider, NemotronRecoveryProvider)
                    else DecisionSource.mock_ai
                )
                model_name = getattr(self.ai_provider, "model", getattr(self.ai_provider, "model_id", "nemotron"))

                ai_telemetry.record_success(latency_ms)
                if not policy_val.allowed and strat not in {Strategy.no_action, Strategy.human_escalation}:
                    ai_telemetry.record_policy_override()

                self.audit(
                    "AI_RECOMMENDATION_GENERATED",
                    case_id=case.id,
                    policy_version=policy_val.policy_version,
                    metadata={
                        "decision_source": decision_src.value,
                        "model": model_name,
                        "confidence": ai_rec.confidence,
                        "recommended_intervention": interv.value,
                        "policy_allowed": policy_val.allowed,
                        "latency_ms": latency_ms,
                    },
                )

                return RecoveryDecision(
                    case_id=case.id,
                    strategy=strat,
                    recovery_probability=ai_rec.confidence,
                    expected_recovery=exp_rec,
                    priority=priority,
                    explanation=ai_rec.rationale,
                    policy_result=policy_val,
                    next_step="Execute approved recovery action." if (policy_val.allowed and strat != Strategy.no_action) else "Route to human review.",
                    decision_source=decision_src,
                    diagnosis=ai_rec.diagnosis,
                    recommended_intervention=interv.value,
                    rationale=ai_rec.rationale,
                    evidence=ai_rec.evidence,
                    confidence=ai_rec.confidence,
                    expected_recovery_minor=exp_rec,
                    alternatives=ai_rec.alternatives,
                    do_not_do=ai_rec.do_not_do,
                    policy_version=policy_val.policy_version,
                    model_id=model_name,
                    latency_ms=latency_ms,
                )
            except Exception as e:
                reason = "timeout" if isinstance(e, AITimeoutError) else "validation_failure" if isinstance(e, AIValidationFailure) else "general"
                ai_telemetry.record_fallback(reason)
                self.audit(
                    "AI_FALLBACK_TRIGGERED",
                    case_id=case.id,
                    policy_version=policy_val.policy_version,
                    metadata={"error_type": type(e).__name__, "decision_source": DecisionSource.deterministic_fallback.value},
                )
                fallback = self.decision_engine.decide(case, policy_val)
                fallback.decision_source = DecisionSource.deterministic_fallback
                return fallback

        # Default when no AI provider is configured or key is absent
        fallback = self.decision_engine.decide(case, policy_val)
        fallback.decision_source = DecisionSource.deterministic_fallback
        return fallback


    def action(self, case_id: str, request: RecoveryActionRequest, key: str) -> RecoveryAction:
        if not key:
            raise RecoveryExecutionError("Idempotency-Key header is required.")
        existing = self.repo.action_for_key(key)
        if existing:
            return existing
        case = self.repo.get_case_for_update(case_id)
        if not case:
            raise CaseNotFoundError()
        existing_again = self.repo.action_for_key(key)
        if existing_again:
            return existing_again
        policy = self.validate(case_id)
        if not policy.allowed:
            raise PolicyValidationError(details={"blocked_rules": policy.blocked_rules})
        if self.repo.action_exists_for_case(case_id):
            raise DuplicateActionError()
        decision = self.decision_engine.decide(case, policy)
        strategy = request.strategy or decision.strategy
        if strategy == Strategy.no_action:
            raise RecoveryExecutionError("No automated action is permitted for this case.")
        
        # Policy validation is enforced in validate() above
        self.audit("RECOVERY_REQUESTED", case_id=case_id, policy_version=policy.policy_version, metadata={"strategy": str(strategy), "amount": case.amount})


        scenario = request.scenario or case.demo_scenario.lower().replace("c_", "")
        
        # Execute provider operation
        exec_res = self.provider.execute_recovery(
            case=case,
            strategy=strategy,
            amount_minor=case.amount,
            idempotency_key=key,
            scenario=scenario
        )

        status_val = ActionStatus(exec_res.status) if exec_res.status in ActionStatus._value2member_map_ else ActionStatus.executed
        action = RecoveryAction(
            case_id=case_id,
            strategy=strategy,
            status=status_val,
            policy_version=policy.policy_version,
            idempotency_key=key,
            verification_status=exec_res.verification_status,
            transaction_id=exec_res.transaction_id,
            provider=exec_res.provider,
            provider_order_id=exec_res.provider_order_id,
            provider_payment_id=exec_res.provider_payment_id,
            provider_status=exec_res.provider_status,
            provider_reference=exec_res.provider_reference
        )
        self.repo.create_action(action, case.amount)

        if exec_res.provider_order_id:
            self.audit(
                "RAZORPAY_ORDER_CREATED" if "razorpay" in exec_res.provider else "RECOVERY_ORDER_CREATED",
                case_id=case_id,
                policy_version=policy.policy_version,
                recovery_action_id=action.action_id,
                metadata={"order_id": exec_res.provider_order_id, "amount": case.amount, "provider": exec_res.provider}
            )

        if exec_res.verification_status == "verified":
            case.status = CaseStatus.recovered
            case.recovered_amount = case.amount
            case.resolved_at = utcnow()
            self.repo.save_case(case)
            self.audit("RAZORPAY_PAYMENT_VERIFIED" if "razorpay" in exec_res.provider else "PAYMENT_VERIFIED", case_id=case_id, recovery_action_id=action.action_id, metadata={"transaction_id": exec_res.transaction_id})
            self.audit("RECOVERY_VERIFIED", case_id=case_id, policy_version=policy.policy_version, recovery_action_id=action.action_id, metadata={"action_id": action.action_id, "verification": "verified"})
        elif exec_res.verification_status in {"timeout", "unknown", "pending"}:
            case.status = CaseStatus.pending
            self.repo.save_case(case)
            event_name = "VERIFICATION_TIMEOUT" if exec_res.verification_status == "timeout" else "RAZORPAY_PAYMENT_PENDING" if "razorpay" in exec_res.provider else "PAYMENT_PENDING"
            self.audit(event_name, case_id=case_id, policy_version=policy.policy_version, recovery_action_id=action.action_id, metadata={"action_id": action.action_id, "verification": exec_res.verification_status})
        else:
            case.status = CaseStatus.failed
            self.repo.save_case(case)
            self.audit("RECOVERY_FAILED", case_id=case_id, policy_version=policy.policy_version, recovery_action_id=action.action_id, metadata={"action_id": action.action_id, "verification": exec_res.verification_status, "reason": exec_res.failure_reason})

        return action

    def process_razorpay_webhook(self, raw_body: bytes, signature_header: str | None) -> WebhookResponse:
        secret = self.settings.razorpay_webhook_secret or self.settings.razorpay_key_secret or "mock_secret_key_123"
        if not signature_header or not self.provider.verify_webhook_signature(raw_body, signature_header, secret):
            self.audit("RAZORPAY_WEBHOOK_REJECTED", metadata={"reason": "Invalid signature or missing header"})
            raise WebhookVerificationError("Webhook signature validation failed.")

        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except Exception:
            raise WebhookVerificationError("Malformed JSON payload.")

        event_name = payload.get("event", "unknown")
        event_id = payload.get("event_id") or payload.get("id") or f"evt_{abs(hash(raw_body))}"

        # Idempotency check: duplicate webhooks are harmless and must not duplicate financial outcomes
        if self.repo.is_webhook_event_processed(event_id):
            return WebhookResponse(status="duplicate", event_id=event_id, message="Webhook event already processed.")

        # Extract payment / order entities
        payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        order_entity = payload.get("payload", {}).get("order", {}).get("entity", {})
        
        order_id = payment_entity.get("order_id") or order_entity.get("id")
        payment_id = payment_entity.get("id")
        notes = payment_entity.get("notes", {}) or order_entity.get("notes", {})
        case_id = notes.get("case_id")

        action = None
        if order_id:
            action = self.repo.action_by_order_id(order_id)
        if not action and payment_id:
            action = self.repo.action_by_payment_id(payment_id)

        target_case_id = action.case_id if action else case_id
        case = self.repo.get_case(target_case_id) if target_case_id else None

        if event_name in {"payment.captured", "order.paid"}:
            if action and action.verification_status != "verified":
                action.status = ActionStatus.executed
                action.verification_status = "verified"
                action.provider_payment_id = payment_id or action.provider_payment_id
                action.provider_status = "captured"
                action.transaction_id = payment_id or action.transaction_id or "txn_rzp_verified"
                self.repo.save_action(action)
            
            if case and case.status != CaseStatus.recovered:
                case.status = CaseStatus.recovered
                case.recovered_amount = case.amount
                self.repo.save_case(case)
                self.audit("RAZORPAY_PAYMENT_VERIFIED", case_id=case.id, recovery_action_id=action.action_id if action else None, metadata={"payment_id": payment_id, "amount": case.amount})
                self.audit("RECOVERY_VERIFIED", case_id=case.id, recovery_action_id=action.action_id if action else None, metadata={"event": event_name})

            self.audit("RAZORPAY_WEBHOOK_RECEIVED", case_id=target_case_id, recovery_action_id=action.action_id if action else None, metadata={"event": event_name, "event_id": event_id, "status": "verified"})

        elif event_name == "payment.failed":
            error_code = payment_entity.get("error_code", "PAYMENT_FAILED")
            error_desc = payment_entity.get("error_description", "Payment attempt failed")
            if action and action.verification_status != "verified":
                action.status = ActionStatus.failed
                action.verification_status = "failed"
                action.provider_payment_id = payment_id
                action.provider_status = "failed"
                action.failure_code = error_code
                action.failure_reason = error_desc
                self.repo.save_action(action)

            if case and case.status != CaseStatus.recovered:
                case.status = CaseStatus.failed
                self.repo.save_case(case)

            self.audit("RAZORPAY_WEBHOOK_RECEIVED", case_id=target_case_id, recovery_action_id=action.action_id if action else None, metadata={"event": event_name, "event_id": event_id, "status": "failed"})
            self.audit("RECOVERY_FAILED", case_id=target_case_id, recovery_action_id=action.action_id if action else None, metadata={"reason": error_desc})

        else:
            self.audit("RAZORPAY_WEBHOOK_RECEIVED", case_id=target_case_id, recovery_action_id=action.action_id if action else None, metadata={"event": event_name, "event_id": event_id})

        self.repo.record_webhook_event(event_id=event_id, event_type=event_name, payload=payload, provider="razorpay")
        return WebhookResponse(status="processed", event_id=event_id, message=f"Event {event_name} processed.")

    def reconcile_action(self, action_id: str) -> ReconciliationResponse:
        action = self.repo.get_action(action_id)
        if not action:
            raise CaseNotFoundError(f"Recovery action {action_id} not found.")

        if action.verification_status in {"verified", "failed"}:
            return ReconciliationResponse(
                action_id=action.action_id,
                case_id=action.case_id,
                provider=action.provider,
                status=action.status,
                verification_status=action.verification_status,
                message=f"Action is already in terminal state ({action.verification_status})."
            )

        case = self.repo.get_case(action.case_id)
        order_id = action.provider_order_id
        
        if order_id:
            order_status = self.provider.get_order_status(order_id)
            st = order_status.get("status")
            if st in {"paid", "captured"}:
                action.status = ActionStatus.executed
                action.verification_status = "verified"
                action.provider_status = st
                action.transaction_id = action.transaction_id or f"txn_reconciled_{order_id[-8:]}"
                self.repo.save_action(action)
                if case:
                    case.status = CaseStatus.recovered
                    case.recovered_amount = case.amount
                    self.repo.save_case(case)
                self.audit("RECOVERY_RECONCILED", case_id=action.case_id, recovery_action_id=action.action_id, metadata={"order_id": order_id, "status": "verified"})
                self.audit("RECOVERY_VERIFIED", case_id=action.case_id, recovery_action_id=action.action_id, metadata={"reconciliation": True})
                return ReconciliationResponse(
                    action_id=action.action_id,
                    case_id=action.case_id,
                    provider=action.provider,
                    status=action.status,
                    verification_status=action.verification_status,
                    message="Reconciled to verified successfully."
                )

        return ReconciliationResponse(
            action_id=action.action_id,
            case_id=action.case_id,
            provider=action.provider,
            status=action.status,
            verification_status=action.verification_status,
            message="Status remains pending/unknown after reconciliation check."
        )

class CaseService(Services): pass
class RecoveryService(Services): pass
class PolicyService(Services): pass
class CampaignService(Services): pass
class CommunicationService(Services): pass
class AuditService(Services): pass
class EvaluationService(Services): pass
class SystemHealthService(Services): pass

