import json
from datetime import datetime, timezone
from ..core.config import get_settings
settings = get_settings()
from ..core.errors import (
    AppError,
    CaseNotFoundError,
    DuplicateActionError,
    PolicyValidationError,
    RecoveryExecutionError,
    ServiceUnavailableError,
    WebhookVerificationError,
)
from ..db.models import RecoveryBatchModel, RecoveryBatchItemModel
from ..engines import *
from ..schemas import *

def utcnow():
    return datetime.now(timezone.utc)

def uid():
    import uuid
    return str(uuid.uuid4())

class Services:
    policy_engine, decision_engine, prioritization_engine, safety, executor, verifier, metrics = (
        PolicyEngine(),
        DecisionEngine(),
        PrioritizationEngine(),
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
        elif self.settings.ai_provider == "nemotron":
            if self.settings.nvidia_api_key:
                self.ai_provider = NemotronRecoveryProvider(
                    api_key=self.settings.nvidia_api_key,
                    model=self.settings.nvidia_nemotron_model,
                    base_url=self.settings.nvidia_api_base_url,
                    timeout_seconds=self.settings.ai_request_timeout_seconds,
                )
            else:
                self.ai_provider = MockAIRecoveryProvider()
        else:
            self.ai_provider = MockAIRecoveryProvider()

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

        if self.repo.is_webhook_event_processed(event_id):
            return WebhookResponse(status="duplicate", event_id=event_id, message="Webhook event already processed.")

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

    # ============================================================
    # STEP 20 RECOVERY QUEUE & BATCH ORCHESTRATION SERVICES
    # ============================================================

    def get_recovery_queue(
        self,
        status: CaseStatus | None = None,
        failure_type: FailureType | None = None,
        priority: str | None = None,
        min_amount: int | None = None,
        max_amount: int | None = None,
        eligible_only: bool = False,
        page: int = 1,
        page_size: int = 25,
    ) -> RecoveryQueueResponse:
        active_policy = self.policy()
        raw_cases, _ = self.repo.list_cases(
            status=status,
            failure_type=failure_type,
            priority=priority,
            min_amount=min_amount,
            max_amount=max_amount,
            page=1,
            page_size=5000,
        )

        queue_items: list[QueueItem] = []
        total_at_risk = 0
        total_expected = 0
        eligible_cnt = 0
        blocked_cnt = 0

        for c in raw_cases:
            pol_res = self.policy_engine.validate(c, active_policy)
            score, tier, reasons = self.prioritization_engine.calculate_priority(c, pol_res)
            dec = self.decision_engine.decide(c, pol_res)

            if eligible_only and not pol_res.allowed:
                continue

            if pol_res.allowed:
                eligible_cnt += 1
            else:
                blocked_cnt += 1

            if c.status in {CaseStatus.at_risk, CaseStatus.in_progress, CaseStatus.pending, CaseStatus.executing}:
                total_at_risk += c.amount
                total_expected += round(c.amount * c.prob)

            queue_items.append(
                QueueItem(
                    case_id=c.id,
                    payment_id=c.payment_id,
                    customer_id=c.customer_id,
                    customer=c.customer,
                    amount=c.amount,
                    currency="INR",
                    payment_method=c.payment_method.value if hasattr(c.payment_method, "value") else str(c.payment_method),
                    failure_type=c.failure_type.value if hasattr(c.failure_type, "value") else str(c.failure_type),
                    failure_reason=c.failure_reason,
                    age=c.age,
                    retry_count=c.retry_count,
                    contact_count_24h=c.contact_count_24h,
                    status=c.status,
                    priority_score=score,
                    priority_tier=tier,
                    priority_reasons=reasons,
                    expected_recovery_minor=round(c.amount * c.prob),
                    policy_allowed=pol_res.allowed,
                    policy_blocked_rules=pol_res.blocked_rules,
                    policy_summary=pol_res.summary,
                    recommended_intervention=dec.recommended_intervention or "RETRY_PAYMENT",
                    strategy=dec.strategy.value if hasattr(dec.strategy, "value") else str(dec.strategy),
                    decision_source=DecisionSource.deterministic_fallback,
                    ai_diagnosis=dec.diagnosis,
                )
            )

        queue_items.sort(key=lambda x: (x.priority_score, x.expected_recovery_minor), reverse=True)
        total_items = len(queue_items)

        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_items = queue_items[start_idx:end_idx]

        summary = RecoveryQueueSummary(
            total_at_risk_minor=total_at_risk,
            total_expected_recovery_minor=total_expected,
            eligible_count=eligible_cnt,
            blocked_count=blocked_cnt,
        )

        return RecoveryQueueResponse(
            items=paginated_items,
            page=page,
            page_size=page_size,
            total=total_items,
            summary=summary,
        )

    def preview_batch(self, request: BatchPreviewRequest) -> BatchPreviewResponse:
        active_policy = self.policy()
        if request.case_ids:
            cases = self.repo.get_cases_by_ids(request.case_ids)
        else:
            cases, _ = self.repo.list_cases(
                status=request.status,
                failure_type=request.failure_type,
                priority=request.priority,
                min_amount=request.min_amount,
                max_amount=request.max_amount,
                page=1,
                page_size=request.max_batch_size,
            )

        selected_cases = []
        accumulated_exposure = 0
        for c in cases:
            if len(selected_cases) >= request.max_batch_size:
                break
            if request.max_monetary_exposure_minor and (accumulated_exposure + c.amount > request.max_monetary_exposure_minor):
                continue
            selected_cases.append(c)
            accumulated_exposure += c.amount

        queue_items = []
        total_at_risk = 0
        total_expected = 0
        eligible_cnt = 0
        eligible_rev = 0
        blocked_cnt = 0
        blocked_rev = 0
        manual_review_cnt = 0
        interventions: dict[str, int] = {}

        for c in selected_cases:
            pol_res = self.policy_engine.validate(c, active_policy)
            score, tier, reasons = self.prioritization_engine.calculate_priority(c, pol_res)
            dec = self.decision_engine.decide(c, pol_res)

            if request.eligible_only and not pol_res.allowed:
                continue

            total_at_risk += c.amount
            exp_val = round(c.amount * c.prob)
            total_expected += exp_val

            if pol_res.allowed:
                eligible_cnt += 1
                eligible_rev += c.amount
            else:
                blocked_cnt += 1
                blocked_rev += c.amount

            interv = dec.recommended_intervention or "RETRY_PAYMENT"
            if interv in {"MANUAL_REVIEW", "NO_ACTION"}:
                manual_review_cnt += 1
            interventions[interv] = interventions.get(interv, 0) + 1

            queue_items.append(
                QueueItem(
                    case_id=c.id,
                    payment_id=c.payment_id,
                    customer_id=c.customer_id,
                    customer=c.customer,
                    amount=c.amount,
                    currency="INR",
                    payment_method=c.payment_method.value if hasattr(c.payment_method, "value") else str(c.payment_method),
                    failure_type=c.failure_type.value if hasattr(c.failure_type, "value") else str(c.failure_type),
                    failure_reason=c.failure_reason,
                    age=c.age,
                    retry_count=c.retry_count,
                    contact_count_24h=c.contact_count_24h,
                    status=c.status,
                    priority_score=score,
                    priority_tier=tier,
                    priority_reasons=reasons,
                    expected_recovery_minor=exp_val,
                    policy_allowed=pol_res.allowed,
                    policy_blocked_rules=pol_res.blocked_rules,
                    policy_summary=pol_res.summary,
                    recommended_intervention=interv,
                    strategy=dec.strategy.value if hasattr(dec.strategy, "value") else str(dec.strategy),
                    decision_source=DecisionSource.deterministic_fallback,
                    ai_diagnosis=dec.diagnosis,
                )
            )

        queue_items.sort(key=lambda x: (x.priority_score, x.expected_recovery_minor), reverse=True)

        sanitized_batch_ctx = ContextSanitizer.sanitize_batch(selected_cases, active_policy)
        ai_analysis = None
        if self.ai_provider:
            try:
                ai_analysis = self.ai_provider.generate_batch_analysis(sanitized_batch_ctx)
            except Exception:
                ai_analysis = self.decision_engine.analyze_batch(sanitized_batch_ctx)
        else:
            ai_analysis = self.decision_engine.analyze_batch(sanitized_batch_ctx)

        return BatchPreviewResponse(
            selected_count=len(queue_items),
            total_revenue_at_risk_minor=total_at_risk,
            estimated_recoverable_minor=total_expected,
            eligible_count=eligible_cnt,
            eligible_revenue_minor=eligible_rev,
            blocked_count=blocked_cnt,
            blocked_revenue_minor=blocked_rev,
            manual_review_count=manual_review_cnt,
            recommended_interventions=interventions,
            cases=queue_items,
            ai_analysis=ai_analysis,
        )

    def execute_batch(self, request: BatchExecutionRequest, idempotency_key: str) -> BatchExecutionResponse:
        if not idempotency_key:
            raise RecoveryExecutionError("Idempotency-Key header is required for batch execution.")

        existing_batch = self.repo.get_batch_by_idempotency_key(idempotency_key)
        if existing_batch:
            items = self.repo.get_batch_items(existing_batch.id)
            item_outcomes = [
                BatchItemOutcome(
                    case_id=it.case_id,
                    amount=it.amount_minor,
                    status=it.status,
                    priority_score=it.priority_score,
                    priority_tier=it.priority_tier,
                    strategy=it.strategy,
                    action_id=it.recovery_action_id,
                    verification_status="verified" if it.status == "RECOVERED" else it.status.lower(),
                    policy_allowed=it.policy_allowed,
                    blocked_rules=it.blocked_rules if isinstance(it.blocked_rules, list) else [],
                    error=it.execution_error,
                )
                for it in items
            ]
            rate = float(round((existing_batch.cases_recovered / existing_batch.cases_selected * 100), 1)) if existing_batch.cases_selected > 0 else 0.0
            block_rate = float(round((existing_batch.cases_blocked / existing_batch.cases_selected * 100), 1)) if existing_batch.cases_selected > 0 else 0.0
            return BatchExecutionResponse(
                batch_id=existing_batch.id,
                status=RecoveryBatchStatus(existing_batch.status),
                batch_size=existing_batch.batch_size,
                cases_selected=existing_batch.cases_selected,
                cases_eligible=existing_batch.cases_eligible,
                cases_blocked=existing_batch.cases_blocked,
                cases_attempted=existing_batch.cases_attempted,
                cases_recovered=existing_batch.cases_recovered,
                cases_failed=existing_batch.cases_failed,
                cases_pending=existing_batch.cases_pending,
                total_revenue_at_risk_minor=existing_batch.total_revenue_at_risk_minor,
                eligible_revenue_minor=existing_batch.eligible_revenue_minor,
                blocked_revenue_minor=existing_batch.blocked_revenue_minor,
                attempted_recovery_minor=existing_batch.attempted_recovery_minor,
                recovered_revenue_minor=existing_batch.recovered_revenue_minor,
                failed_recovery_minor=existing_batch.failed_recovery_minor,
                pending_recovery_minor=existing_batch.pending_recovery_minor,
                recovery_rate=rate,
                policy_block_rate=block_rate,
                ai_fallback_count=0,
                communication_count=0,
                items=item_outcomes,
                ai_analysis=AIBatchAnalysis.model_validate(existing_batch.ai_analysis) if existing_batch.ai_analysis else None,
                created_at=existing_batch.created_at,
                completed_at=existing_batch.completed_at,
            )

        active_policy = self.policy()

        if request.case_ids:
            candidates = self.repo.get_cases_by_ids(request.case_ids)
        else:
            candidates, _ = self.repo.list_cases(
                status=request.status,
                failure_type=request.failure_type,
                priority=request.priority,
                min_amount=request.min_amount,
                max_amount=request.max_amount,
                page=1,
                page_size=request.max_batch_size,
            )

        scored_candidates = []
        for c in candidates:
            pol_res = self.policy_engine.validate(c, active_policy)
            score, tier, _ = self.prioritization_engine.calculate_priority(c, pol_res)
            scored_candidates.append((score, c))
        
        scored_candidates.sort(key=lambda x: x[0], reverse=True)

        selected_cases = []
        accumulated_exposure = 0
        for score, c in scored_candidates:
            if len(selected_cases) >= request.max_batch_size:
                break
            if request.max_monetary_exposure_minor and (accumulated_exposure + c.amount > request.max_monetary_exposure_minor):
                continue
            selected_cases.append(c)
            accumulated_exposure += c.amount

        batch_id = ident("batch")
        
        sanitized_batch_ctx = ContextSanitizer.sanitize_batch(selected_cases, active_policy)
        ai_analysis = None
        if self.ai_provider:
            try:
                ai_analysis = self.ai_provider.generate_batch_analysis(sanitized_batch_ctx)
            except Exception:
                ai_analysis = self.decision_engine.analyze_batch(sanitized_batch_ctx)
        else:
            ai_analysis = self.decision_engine.analyze_batch(sanitized_batch_ctx)

        batch = RecoveryBatchModel(
            id=batch_id,
            merchant_id=self.repo.merchant_id,
            status="RUNNING",
            idempotency_key=idempotency_key,
            selection_criteria=request.model_dump(mode="json", exclude_none=True),
            batch_size=len(selected_cases),
            total_revenue_at_risk_minor=sum(c.amount for c in selected_cases),
            cases_selected=len(selected_cases),
            ai_analysis=ai_analysis.model_dump(mode="json") if ai_analysis else None,
            created_at=utcnow(),
            started_at=utcnow(),
        )

        batch_items: list[RecoveryBatchItemModel] = []
        item_outcomes: list[BatchItemOutcome] = []

        self.audit("BATCH_CREATED", metadata={"batch_id": batch_id, "size": len(selected_cases), "idempotency_key": idempotency_key})
        self.audit("BATCH_AUTHORIZED", metadata={"batch_id": batch_id, "amount_minor": batch.total_revenue_at_risk_minor})
        self.audit("BATCH_STARTED", metadata={"batch_id": batch_id})

        cases_eligible = 0
        cases_blocked = 0
        cases_attempted = 0
        cases_recovered = 0
        cases_failed = 0
        cases_pending = 0

        eligible_rev = 0
        blocked_rev = 0
        attempted_rev = 0
        recovered_rev = 0
        failed_rev = 0
        pending_rev = 0

        for c_item in selected_cases:
            case = self.repo.get_case_for_update(c_item.id)
            if not case:
                continue

            current_policy = self.policy()
            pol_res = self.policy_engine.validate(case, current_policy)
            score, tier, _ = self.prioritization_engine.calculate_priority(case, pol_res)
            dec = self.decision_engine.decide(case, pol_res)
            strat = dec.strategy

            if case.status == CaseStatus.recovered:
                item_model = RecoveryBatchItemModel(
                    id=uid(),
                    batch_id=batch_id,
                    case_id=case.id,
                    merchant_id=self.repo.merchant_id,
                    priority_score=score,
                    priority_tier=tier,
                    amount_minor=case.amount,
                    expected_recovery_minor=0,
                    policy_allowed=False,
                    blocked_rules=["Case is already recovered"],
                    recommended_intervention="NO_ACTION",
                    strategy="no_action",
                    decision_source=DecisionSource.deterministic_fallback.value,
                    status="SKIPPED",
                    created_at=utcnow(),
                    executed_at=utcnow(),
                )
                batch_items.append(item_model)
                item_outcomes.append(
                    BatchItemOutcome(
                        case_id=case.id,
                        amount=case.amount,
                        status="SKIPPED",
                        priority_score=score,
                        priority_tier=tier,
                        strategy="no_action",
                        policy_allowed=False,
                        blocked_rules=["Case is already recovered"],
                    )
                )
                continue

            if not pol_res.allowed or strat == Strategy.no_action:
                cases_blocked += 1
                blocked_rev += case.amount
                item_model = RecoveryBatchItemModel(
                    id=uid(),
                    batch_id=batch_id,
                    case_id=case.id,
                    merchant_id=self.repo.merchant_id,
                    priority_score=score,
                    priority_tier=tier,
                    amount_minor=case.amount,
                    expected_recovery_minor=round(case.amount * case.prob),
                    policy_allowed=False,
                    blocked_rules=pol_res.blocked_rules,
                    recommended_intervention=dec.recommended_intervention or "NO_ACTION",
                    strategy=strat.value if hasattr(strat, "value") else str(strat),
                    decision_source=dec.decision_source.value if hasattr(dec.decision_source, "value") else str(dec.decision_source),
                    status="BLOCKED",
                    created_at=utcnow(),
                    executed_at=utcnow(),
                )
                batch_items.append(item_model)
                item_outcomes.append(
                    BatchItemOutcome(
                        case_id=case.id,
                        amount=case.amount,
                        status="BLOCKED",
                        priority_score=score,
                        priority_tier=tier,
                        strategy=strat.value if hasattr(strat, "value") else str(strat),
                        policy_allowed=False,
                        blocked_rules=pol_res.blocked_rules,
                    )
                )
                self.audit("BATCH_CASE_BLOCKED", case_id=case.id, policy_version=pol_res.policy_version, metadata={"batch_id": batch_id, "rules": pol_res.blocked_rules})
                continue

            cases_eligible += 1
            eligible_rev += case.amount
            cases_attempted += 1
            attempted_rev += case.amount

            case_key = f"{idempotency_key}_{case.id}"
            scenario = request.scenario or case.demo_scenario.lower().replace("c_", "")
            self.audit("BATCH_CASE_ATTEMPTED", case_id=case.id, policy_version=pol_res.policy_version, metadata={"batch_id": batch_id, "strategy": str(strat)})

            action = None
            exec_err = None
            try:
                action = self.action(case.id, RecoveryActionRequest(strategy=strat, scenario=scenario), key=case_key)
            except Exception as e:
                exec_err = str(e)

            if action and action.verification_status == "verified":
                cases_recovered += 1
                recovered_rev += case.amount
                item_status = "RECOVERED"
                self.audit("BATCH_CASE_RECOVERED", case_id=case.id, recovery_action_id=action.action_id, metadata={"batch_id": batch_id, "amount": case.amount})
            elif action and action.verification_status in {"timeout", "pending", "unknown"}:
                cases_pending += 1
                pending_rev += case.amount
                item_status = "PENDING"
                self.audit("BATCH_CASE_PENDING", case_id=case.id, recovery_action_id=action.action_id, metadata={"batch_id": batch_id, "status": action.verification_status})
            else:
                cases_failed += 1
                failed_rev += case.amount
                item_status = "FAILED"
                self.audit("BATCH_CASE_FAILED", case_id=case.id, recovery_action_id=action.action_id if action else None, metadata={"batch_id": batch_id, "error": exec_err})

            item_model = RecoveryBatchItemModel(
                id=uid(),
                batch_id=batch_id,
                case_id=case.id,
                merchant_id=self.repo.merchant_id,
                priority_score=score,
                priority_tier=tier,
                amount_minor=case.amount,
                expected_recovery_minor=round(case.amount * case.prob),
                policy_allowed=True,
                blocked_rules=[],
                recommended_intervention=dec.recommended_intervention or "RETRY_PAYMENT",
                strategy=strat.value if hasattr(strat, "value") else str(strat),
                decision_source=dec.decision_source.value if hasattr(dec.decision_source, "value") else str(dec.decision_source),
                status=item_status,
                recovery_action_id=action.action_id if action else None,
                execution_error=exec_err,
                created_at=utcnow(),
                executed_at=utcnow(),
            )
            batch_items.append(item_model)
            item_outcomes.append(
                BatchItemOutcome(
                    case_id=case.id,
                    amount=case.amount,
                    status=item_status,
                    priority_score=score,
                    priority_tier=tier,
                    strategy=strat.value if hasattr(strat, "value") else str(strat),
                    action_id=action.action_id if action else None,
                    verification_status=action.verification_status if action else "failed",
                    policy_allowed=True,
                    blocked_rules=[],
                    error=exec_err,
                )
            )

        if cases_attempted > 0 and cases_recovered == cases_attempted and cases_failed == 0 and cases_pending == 0:
            final_status = "COMPLETED"
        elif cases_recovered > 0 or cases_pending > 0 or (cases_attempted > 0 and cases_failed > 0 and cases_recovered > 0):
            final_status = "PARTIALLY_COMPLETED"
        elif cases_attempted > 0 and cases_recovered == 0 and cases_pending == 0:
            final_status = "FAILED"
        else:
            final_status = "COMPLETED"

        batch.status = final_status
        batch.eligible_revenue_minor = eligible_rev
        batch.blocked_revenue_minor = blocked_rev
        batch.attempted_recovery_minor = attempted_rev
        batch.recovered_revenue_minor = recovered_rev
        batch.failed_recovery_minor = failed_rev
        batch.pending_recovery_minor = pending_rev
        batch.cases_eligible = cases_eligible
        batch.cases_blocked = cases_blocked
        batch.cases_attempted = cases_attempted
        batch.cases_recovered = cases_recovered
        batch.cases_failed = cases_failed
        batch.cases_pending = cases_pending
        batch.completed_at = utcnow()

        self.repo.create_batch(batch, batch_items)

        self.audit(
            f"BATCH_{final_status}",
            metadata={
                "batch_id": batch_id,
                "recovered_minor": recovered_rev,
                "cases_recovered": cases_recovered,
                "cases_blocked": cases_blocked,
                "cases_failed": cases_failed,
                "cases_pending": cases_pending,
            }
        )

        rate = float(round((cases_recovered / len(selected_cases) * 100), 1)) if len(selected_cases) > 0 else 0.0
        block_rate = float(round((cases_blocked / len(selected_cases) * 100), 1)) if len(selected_cases) > 0 else 0.0

        return BatchExecutionResponse(
            batch_id=batch_id,
            status=RecoveryBatchStatus(final_status),
            batch_size=len(selected_cases),
            cases_selected=len(selected_cases),
            cases_eligible=cases_eligible,
            cases_blocked=cases_blocked,
            cases_attempted=cases_attempted,
            cases_recovered=cases_recovered,
            cases_failed=cases_failed,
            cases_pending=cases_pending,
            total_revenue_at_risk_minor=batch.total_revenue_at_risk_minor,
            eligible_revenue_minor=eligible_rev,
            blocked_revenue_minor=blocked_rev,
            attempted_recovery_minor=attempted_rev,
            recovered_revenue_minor=recovered_rev,
            failed_recovery_minor=failed_rev,
            pending_recovery_minor=pending_rev,
            recovery_rate=rate,
            policy_block_rate=block_rate,
            ai_fallback_count=0,
            communication_count=0,
            items=item_outcomes,
            ai_analysis=ai_analysis,
            created_at=batch.created_at,
            completed_at=batch.completed_at,
        )

    def get_batch(self, batch_id: str) -> BatchExecutionResponse:
        b = self.repo.get_batch(batch_id)
        if not b:
            raise CaseNotFoundError(f"Recovery batch {batch_id} not found.")
        items = self.repo.get_batch_items(batch_id)
        item_outcomes = [
            BatchItemOutcome(
                case_id=it.case_id,
                amount=it.amount_minor,
                status=it.status,
                priority_score=it.priority_score,
                priority_tier=it.priority_tier,
                strategy=it.strategy,
                action_id=it.recovery_action_id,
                verification_status="verified" if it.status == "RECOVERED" else it.status.lower(),
                policy_allowed=it.policy_allowed,
                blocked_rules=it.blocked_rules if isinstance(it.blocked_rules, list) else [],
                error=it.execution_error,
            )
            for it in items
        ]
        rate = float(round((b.cases_recovered / b.cases_selected * 100), 1)) if b.cases_selected > 0 else 0.0
        block_rate = float(round((b.cases_blocked / b.cases_selected * 100), 1)) if b.cases_selected > 0 else 0.0
        return BatchExecutionResponse(
            batch_id=b.id,
            status=RecoveryBatchStatus(b.status),
            batch_size=b.batch_size,
            cases_selected=b.cases_selected,
            cases_eligible=b.cases_eligible,
            cases_blocked=b.cases_blocked,
            cases_attempted=b.cases_attempted,
            cases_recovered=b.cases_recovered,
            cases_failed=b.cases_failed,
            cases_pending=b.cases_pending,
            total_revenue_at_risk_minor=b.total_revenue_at_risk_minor,
            eligible_revenue_minor=b.eligible_revenue_minor,
            blocked_revenue_minor=b.blocked_revenue_minor,
            attempted_recovery_minor=b.attempted_recovery_minor,
            recovered_revenue_minor=b.recovered_revenue_minor,
            failed_recovery_minor=b.failed_recovery_minor,
            pending_recovery_minor=b.pending_recovery_minor,
            recovery_rate=rate,
            policy_block_rate=block_rate,
            ai_fallback_count=0,
            communication_count=0,
            items=item_outcomes,
            ai_analysis=AIBatchAnalysis.model_validate(b.ai_analysis) if b.ai_analysis else None,
            created_at=b.created_at,
            completed_at=b.completed_at,
        )

    def cancel_batch(self, batch_id: str) -> BatchExecutionResponse:
        b = self.repo.get_batch(batch_id)
        if not b:
            raise CaseNotFoundError(f"Recovery batch {batch_id} not found.")
        if b.status not in {"COMPLETED", "FAILED", "CANCELLED"}:
            b.status = "CANCELLED"
            b.cancelled_at = utcnow()
            self.repo.save_batch(b)
            self.audit("BATCH_CANCELLED", metadata={"batch_id": batch_id})
        return self.get_batch(batch_id)

    # ============================================================
    # STEP 21 MEASUREMENT & EVIDENCE SERVICES
    # ============================================================

    def get_recovery_funnel(self) -> RecoveryFunnelResponse:
        return self.repo.get_recovery_funnel(self.policy())

    def get_case_evidence_trace(self, case_id: str) -> CaseEvidenceTrace:
        return self.repo.get_case_evidence_trace(case_id)

    def get_batch_evidence_trace(self, batch_id: str) -> BatchEvidenceTrace:
        return self.repo.get_batch_evidence_trace(batch_id)

    def get_controlled_evaluation(self) -> ControlledEvaluationResponse:
        eval_engine = EvaluationExperimentEngine()
        return eval_engine.run_controlled_experiment(self.policy())

    def reset_demo_state(self) -> DemoResetResponse:
        count = self.repo.reset_demo()
        return DemoResetResponse(
            status="SUCCESS",
            message=f"Deterministic demo environment reset successfully with {count} cases.",
            cases_seeded=count,
            policy_version="v1"
        )

    def preflight_check(self) -> PreflightResponse:
        checks: list[PreflightCheckItem] = []
        is_ready = True
        db_connected = False

        # 1. PostgreSQL & Schema verification
        try:
            self.repo.ensure_merchant()
            db_connected = True
            checks.append(PreflightCheckItem(
                name="PostgreSQL Database",
                status="READY",
                details="PostgreSQL connection verified and operational."
            ))
        except Exception as e:
            is_ready = False
            checks.append(PreflightCheckItem(
                name="PostgreSQL Database",
                status="NOT_READY",
                details=f"Database unreachable: {str(e)}"
            ))

        # 2. Migration & Schema Check
        try:
            pol = self.policy()
            checks.append(PreflightCheckItem(
                name="Database Migrations & Policies",
                status="READY",
                details=f"Active policy version: {pol.version}."
            ))
        except Exception as e:
            is_ready = False
            checks.append(PreflightCheckItem(
                name="Database Migrations & Policies",
                status="NOT_READY",
                details=f"Schema / Policy error: {str(e)}"
            ))

        # 3. Seed Data Check
        try:
            demo_case = self.repo.get_case("case_demo_upi") or self.repo.get_case("case_demo_high_value")
            if demo_case:
                checks.append(PreflightCheckItem(
                    name="Deterministic Seed Dataset",
                    status="READY",
                    details="Deterministic demo dataset is loaded."
                ))
            else:
                checks.append(PreflightCheckItem(
                    name="Deterministic Seed Dataset",
                    status="WARNING",
                    details="Seed dataset not yet initialized. Use demo reset to populate."
                ))
        except Exception as e:
            checks.append(PreflightCheckItem(
                name="Deterministic Seed Dataset",
                status="WARNING",
                details=f"Could not verify seed data: {str(e)}"
            ))

        # 4. Recovery Provider Configuration
        provider_mode = settings.recovery_provider.upper()
        if settings.recovery_provider == "razorpay_test":
            if settings.razorpay_key_id and settings.razorpay_key_id.startswith("rzp_test_"):
                checks.append(PreflightCheckItem(
                    name="Payment Recovery Provider",
                    status="READY",
                    details="Razorpay Test Mode credentials configured."
                ))
            else:
                checks.append(PreflightCheckItem(
                    name="Payment Recovery Provider",
                    status="WARNING",
                    details="Razorpay Test Mode selected but test keys are incomplete."
                ))
        else:
            checks.append(PreflightCheckItem(
                name="Payment Recovery Provider",
                status="READY",
                details="Simulated recovery sandbox active (deterministic execution)."
            ))

        # 5. AI Provider & Fallback Configuration
        ai_mode = "NEMOTRON" if (settings.ai_provider == "nemotron" and settings.nvidia_api_key) else "DETERMINISTIC_FALLBACK"
        if settings.ai_provider == "nemotron" and settings.nvidia_api_key:
            checks.append(PreflightCheckItem(
                name="AI Intelligence Layer",
                status="READY",
                details=f"NVIDIA Nemotron connected ({settings.nvidia_nemotron_model}) with automatic deterministic fallback."
            ))
        else:
            checks.append(PreflightCheckItem(
                name="AI Intelligence Layer",
                status="READY",
                details="Deterministic rule-based AI fallback active (no external network dependency required)."
            ))

        summary = "All systems operational and ready for judge presentation." if is_ready else "Infrastructure issue detected. Check database status."
        return PreflightResponse(
            status="READY" if is_ready else "NOT_READY",
            checks=checks,
            summary=summary,
            provider_mode=provider_mode,
            ai_mode=ai_mode,
            database_connected=db_connected
        )


class CaseService(Services): pass
class RecoveryService(Services): pass
class PolicyService(Services): pass
class CampaignService(Services): pass
class CommunicationService(Services): pass
class AuditService(Services): pass
class EvaluationService(Services): pass
class SystemHealthService(Services): pass
