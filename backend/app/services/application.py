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

    def __init__(self, repo, provider: RecoveryProvider | None = None):
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
        return self.decision_engine.decide(self.case(case_id), self.validate(case_id))

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

