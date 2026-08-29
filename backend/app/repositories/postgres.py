from datetime import datetime, timezone
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from ..db.models import *
from ..schemas import *

def _val(x):
    if x is None:
        return None
    return x.value if hasattr(x, "value") else str(x)

class PostgresRepositories:
    """Merchant-scoped SQLAlchemy repositories; API models never expose ORM rows."""
    def __init__(self, session, merchant_id: str): self.session, self.merchant_id = session, merchant_id
    def ensure_merchant(self):
        if not self.session.get(MerchantModel, self.merchant_id): self.session.add(MerchantModel(id=self.merchant_id, business_name="RECLAIM Demo Merchant", industry="Demo")); self.session.flush()
    def to_case(self, row): return Case.model_validate(row.payload)
    def get_case(self, case_id):
        row=self.session.scalar(select(CaseModel).where(CaseModel.id==case_id,CaseModel.merchant_id==self.merchant_id)); return self.to_case(row) if row else None

    def get_case_for_update(self, case_id):
        row=self.session.scalar(select(CaseModel).where(CaseModel.id==case_id,CaseModel.merchant_id==self.merchant_id).with_for_update())
        return self.to_case(row) if row else None

    def get_cases_by_ids(self, case_ids: list[str]) -> list[Case]:
        if not case_ids: return []
        rows = self.session.scalars(select(CaseModel).where(CaseModel.merchant_id==self.merchant_id, CaseModel.id.in_(case_ids))).all()
        return [self.to_case(x) for x in rows]

    def get_evaluation_cases(self):
        from ..schemas import Case, FailureType, PaymentMethod, CaseStatus
        return [
            Case(id="eval_1", payment_id="pay_e1", order_id="ord_e1", customer_id="cust_e1", customer="Eval 1", customer_email="e1@test.com", customer_phone="999", amount=150000, payment_method=PaymentMethod.upi, failure_type=FailureType.upi_timeout, failure_reason="Timeout", prob=0.85, expected=127500, status=CaseStatus.at_risk, demo_scenario="EVAL"),
            Case(id="eval_2", payment_id="pay_e2", order_id="ord_e2", customer_id="cust_e2", customer="Eval 2", customer_email="e2@test.com", customer_phone="999", amount=250000, payment_method=PaymentMethod.credit_card, failure_type=FailureType.card_decline, failure_reason="Decline", prob=0.6, expected=150000, status=CaseStatus.at_risk, demo_scenario="EVAL")
        ]

    def list_cases(self,status=None,failure_type=None,priority=None,min_amount=None,max_amount=None,page=1,page_size=25):
        q=select(CaseModel).where(CaseModel.merchant_id==self.merchant_id)
        if min_amount is not None or max_amount is not None:
            q=q.join(PaymentModel, CaseModel.payment_id==PaymentModel.id)
            if min_amount is not None: q=q.where(PaymentModel.amount_minor >= min_amount)
            if max_amount is not None: q=q.where(PaymentModel.amount_minor <= max_amount)
        if status: q=q.where(CaseModel.status==_val(status))
        if failure_type: q=q.where(CaseModel.failure_type==_val(failure_type))
        if priority: q=q.where(CaseModel.priority==priority)
        total=self.session.scalar(select(func.count()).select_from(q.subquery())) or 0
        rows=self.session.scalars(q.order_by(CaseModel.created_at.desc()).offset((page-1)*page_size).limit(page_size)).all()
        return [self.to_case(x) for x in rows], total

    def create_case(self, case):
        self.ensure_merchant(); payload=case.model_dump(mode="json")
        if not self.session.get(PaymentModel, case.payment_id):
            payment=PaymentModel(id=case.payment_id,merchant_id=self.merchant_id,external_reference=case.order_id,amount_minor=case.amount,currency="INR",payment_method=_val(case.payment_method),failure_type=_val(case.failure_type))
            self.session.add(payment); self.session.flush()
        self.session.add(CaseModel(id=case.id,merchant_id=self.merchant_id,payment_id=case.payment_id,status=_val(case.status),priority=self.priority(case),failure_type=_val(case.failure_type),recovery_probability=case.prob,expected_recovery_minor=case.expected,payload=payload,retry_count=case.retry_count,contact_count=case.contact_count_24h))
        self.session.flush(); return case
    def priority(self, case): return "Critical" if case.amount>500000 else "High" if case.prob>.5 else "Medium"
    def save_case(self, case):
        row=self.session.scalar(select(CaseModel).where(CaseModel.id==case.id,CaseModel.merchant_id==self.merchant_id)); row.status=_val(case.status); row.recovered_amount_minor=case.recovered_amount; row.retry_count=case.retry_count; row.contact_count=case.contact_count_24h; row.payload=case.model_dump(mode="json"); row.resolved_at=datetime.now(timezone.utc) if _val(case.status)==CaseStatus.recovered.value else None
    def active_policy(self):
        row=self.session.scalar(select(PolicyModel).where(PolicyModel.merchant_id==self.merchant_id,PolicyModel.active.is_(True))); return self.to_policy(row) if row else None
    def to_policy(self,row): return PolicyVersion(version=row.version,created_at=row.created_at,created_by=row.created_by,configuration=PolicyConfiguration.model_validate(row.configuration),active=row.active)
    def policy_versions(self): return [self.to_policy(x) for x in self.session.scalars(select(PolicyModel).where(PolicyModel.merchant_id==self.merchant_id).order_by(PolicyModel.created_at)).all()]
    def create_policy(self, policy):
        self.ensure_merchant(); self.session.query(PolicyModel).filter_by(merchant_id=self.merchant_id,active=True).update({"active":False}); self.session.add(PolicyModel(merchant_id=self.merchant_id,version=policy.version,created_by=policy.created_by,active=True,configuration=policy.configuration.model_dump())); self.session.flush(); return policy
    def action_for_key(self,key):
        row=self.session.scalar(select(RecoveryActionModel).where(RecoveryActionModel.merchant_id==self.merchant_id,RecoveryActionModel.idempotency_key==key)); return self.to_action(row) if row else None
    def to_action(self,row):
        st = row.status
        if st in {"verified", "VERIFIED", "succeeded", "SUCCEEDED", "success", "SUCCESS"}:
            status_enum = ActionStatus.succeeded
        elif st in {"failed", "FAILED"}:
            status_enum = ActionStatus.failed
        elif st in {"pending", "PENDING"}:
            status_enum = ActionStatus.pending
        elif st in {"blocked", "BLOCKED"}:
            status_enum = ActionStatus.blocked
        elif st in {"ready", "READY"}:
            status_enum = ActionStatus.ready
        elif st in {"approved", "APPROVED"}:
            status_enum = ActionStatus.approved
        elif st in {"skipped", "SKIPPED"}:
            status_enum = ActionStatus.skipped
        else:
            status_enum = ActionStatus.executed

        return RecoveryAction(
            action_id=row.id,
            case_id=row.case_id,
            strategy=row.action_type,
            status=status_enum,
            policy_version=row.policy_version,
            idempotency_key=row.idempotency_key,
            verification_status=row.verification_status,
            created_at=row.created_at,
            transaction_id=row.transaction_id,
            provider=row.provider or "simulated",
            provider_order_id=row.provider_order_id,
            provider_payment_id=row.provider_payment_id,
            provider_status=row.provider_status,
            provider_reference=row.provider_reference,
            failure_code=row.failure_code,
            failure_reason=row.failure_reason
        )
    def get_action(self, action_id: str):
        row = self.session.scalar(select(RecoveryActionModel).where(RecoveryActionModel.id==action_id, RecoveryActionModel.merchant_id==self.merchant_id))
        return self.to_action(row) if row else None
    def action_exists_for_case(self,case_id): return self.session.scalar(select(RecoveryActionModel.id).where(RecoveryActionModel.case_id==case_id,RecoveryActionModel.merchant_id==self.merchant_id)) is not None
    def action_by_order_id(self, order_id: str):
        row = self.session.scalar(select(RecoveryActionModel).where(RecoveryActionModel.provider_order_id==order_id, RecoveryActionModel.merchant_id==self.merchant_id))
        return self.to_action(row) if row else None
    def action_by_payment_id(self, payment_id: str):
        row = self.session.scalar(select(RecoveryActionModel).where(RecoveryActionModel.provider_payment_id==payment_id, RecoveryActionModel.merchant_id==self.merchant_id))
        return self.to_action(row) if row else None
    def create_action(self,action,amount):
        self.session.add(RecoveryActionModel(
            id=action.action_id,
            case_id=action.case_id,
            merchant_id=self.merchant_id,
            action_type=_val(action.strategy),
            status=_val(action.status),
            idempotency_key=action.idempotency_key,
            policy_version=action.policy_version,
            amount_minor=amount,
            verification_status=action.verification_status,
            transaction_id=action.transaction_id,
            failure_code=action.failure_code,
            failure_reason=action.failure_reason,
            provider=action.provider,
            provider_order_id=action.provider_order_id,
            provider_payment_id=action.provider_payment_id,
            provider_status=action.provider_status,
            provider_reference=action.provider_reference,
            started_at=datetime.now(timezone.utc)
        ))
        self.session.flush()
        return action
    def save_action(self, action: RecoveryAction):
        row = self.session.scalar(select(RecoveryActionModel).where(RecoveryActionModel.id==action.action_id, RecoveryActionModel.merchant_id==self.merchant_id))
        if row:
            row.status = _val(action.status)
            row.verification_status = action.verification_status
            row.transaction_id = action.transaction_id
            row.failure_code = action.failure_code
            row.failure_reason = action.failure_reason
            row.provider_order_id = action.provider_order_id
            row.provider_payment_id = action.provider_payment_id
            row.provider_status = action.provider_status
            row.provider_reference = action.provider_reference
            if action.verification_status in {"verified", "failed"}:
                row.completed_at = datetime.now(timezone.utc)
            self.session.flush()

    def is_webhook_event_processed(self, event_id: str) -> bool:
        return self.session.scalar(select(WebhookEventModel.id).where(WebhookEventModel.merchant_id==self.merchant_id, WebhookEventModel.event_id==event_id)) is not None
    def record_webhook_event(self, event_id: str, event_type: str, payload: dict, provider: str = "razorpay"):
        self.session.add(WebhookEventModel(
            merchant_id=self.merchant_id,
            provider=provider,
            event_id=event_id,
            event_type=event_type,
            payload=payload,
            processed=True
        ))
        self.session.flush()

    def get_batch_by_idempotency_key(self, key: str):
        return self.session.scalar(select(RecoveryBatchModel).where(RecoveryBatchModel.merchant_id==self.merchant_id, RecoveryBatchModel.idempotency_key==key))

    def get_batch(self, batch_id: str):
        return self.session.scalar(select(RecoveryBatchModel).where(RecoveryBatchModel.merchant_id==self.merchant_id, RecoveryBatchModel.id==batch_id))

    def create_batch(self, batch: RecoveryBatchModel, items: list[RecoveryBatchItemModel]):
        self.ensure_merchant()
        self.session.add(batch)
        self.session.flush()
        for it in items:
            self.session.add(it)
        self.session.flush()
        return batch

    def save_batch(self, batch: RecoveryBatchModel):
        self.session.flush()

    def save_batch_item(self, item: RecoveryBatchItemModel):
        self.session.flush()

    def get_batch_items(self, batch_id: str) -> list[RecoveryBatchItemModel]:
        return list(self.session.scalars(select(RecoveryBatchItemModel).where(RecoveryBatchItemModel.merchant_id==self.merchant_id, RecoveryBatchItemModel.batch_id==batch_id).order_by(RecoveryBatchItemModel.created_at)).all())

    def list_batches(self, page=1, page_size=25):
        q = select(RecoveryBatchModel).where(RecoveryBatchModel.merchant_id==self.merchant_id)
        total = self.session.scalar(select(func.count()).select_from(q.subquery())) or 0
        rows = self.session.scalars(q.order_by(RecoveryBatchModel.created_at.desc()).offset((page-1)*page_size).limit(page_size)).all()
        return list(rows), total

    def audit(self,event): self.session.add(AuditEventModel(id=event.event_id,merchant_id=self.merchant_id,event_type=event.event_type,case_id=event.case_id,campaign_id=event.campaign_id,policy_version=event.policy_version,actor=event.actor,timestamp=event.timestamp,metadata_json=event.metadata)); self.session.flush(); return event
    def events(self,case_id=None,campaign_id=None,page=1,page_size=100):
        q=select(AuditEventModel).where(AuditEventModel.merchant_id==self.merchant_id)
        if case_id:q=q.where(AuditEventModel.case_id==case_id)
        if campaign_id:q=q.where(AuditEventModel.campaign_id==campaign_id)
        total=self.session.scalar(select(func.count()).select_from(q.subquery())) or 0; rows=self.session.scalars(q.order_by(AuditEventModel.timestamp.desc()).offset((page-1)*page_size).limit(page_size)).all()
        return [AuditEvent(event_id=x.id,event_type=x.event_type,case_id=x.case_id,campaign_id=x.campaign_id,policy_version=x.policy_version,timestamp=x.timestamp,actor=x.actor,metadata=x.metadata_json) for x in rows],total
    def create_campaign(self,c): self.ensure_merchant(); self.session.add(CampaignModel(id=c.id,merchant_id=self.merchant_id,name=c.name,type=c.type,status=_val(c.status),configuration={"description":c.description,"min_probability":c.min_probability,"case_ids":c.case_ids})); self.session.flush(); return c
    def campaigns(self): return [self.to_campaign(x) for x in self.session.scalars(select(CampaignModel).where(CampaignModel.merchant_id==self.merchant_id)).all()]
    def to_campaign(self,x): return Campaign(id=x.id,name=x.name,type=x.type,status=x.status,description=x.configuration.get("description",""),min_probability=x.configuration.get("min_probability",.2),case_ids=x.configuration.get("case_ids",[]),created_at=x.created_at,updated_at=x.updated_at)
    def campaign(self,id):
        x=self.session.scalar(select(CampaignModel).where(CampaignModel.id==id,CampaignModel.merchant_id==self.merchant_id)); return self.to_campaign(x) if x else None
    def save_campaign(self,c): self.session.query(CampaignModel).filter_by(id=c.id,merchant_id=self.merchant_id).update({"status":_val(c.status),"updated_at":datetime.now(timezone.utc)})
    def create_communication(self,c): self.session.add(CommunicationModel(id=c.id,merchant_id=self.merchant_id,case_id=c.case_id,campaign_id=c.campaign_id,channel=_val(c.channel),status=c.status,message=c.content)); self.session.flush(); return c
    def communications(self):
        return [Communication(id=x.id,case_id=x.case_id,campaign_id=x.campaign_id,channel=x.channel,status=x.status,content=x.message,created_at=x.created_at) for x in self.session.scalars(select(CommunicationModel).where(CommunicationModel.merchant_id==self.merchant_id)).all()]
    def communication(self,id): return next((x for x in self.communications() if x.id==id),None)
    def create_evaluation(self,run): self.session.add(EvaluationRunModel(id=run.run_id,merchant_id=self.merchant_id,status=run.status,metrics=run.metrics.model_dump())); self.session.flush(); return run
    def evaluations(self): return [EvaluationRun(run_id=x.id,status=x.status,created_at=x.created_at,metrics=EvaluationMetrics.model_validate(x.metrics)) for x in self.session.scalars(select(EvaluationRunModel).where(EvaluationRunModel.merchant_id==self.merchant_id)).all()]
    def evaluation(self,id): return next((x for x in self.evaluations() if x.run_id==id),None)
    
    def dashboard_metrics(self) -> DashboardMetrics:
        cases = self.session.scalars(select(CaseModel).where(CaseModel.merchant_id==self.merchant_id)).all()
        total_cases = len(cases)
        at_risk_total = 0
        recovered_total = 0
        at_risk_count = 0
        in_progress_count = 0
        recovered_count = 0
        escalated_count = 0
        stopped_count = 0
        
        for c in cases:
            st = c.status
            amount = c.payload.get("amount", 0) if c.payload else 0
            rec_amount = c.recovered_amount_minor or 0
            
            if st in [CaseStatus.at_risk.value, CaseStatus.in_progress.value, CaseStatus.pending.value, CaseStatus.executing.value]:
                at_risk_total += amount
            
            if st == CaseStatus.recovered.value:
                recovered_total += rec_amount or amount
                recovered_count += 1
            elif st == CaseStatus.at_risk.value:
                at_risk_count += 1
            elif st in [CaseStatus.in_progress.value, CaseStatus.executing.value, CaseStatus.pending.value]:
                in_progress_count += 1
            elif st == CaseStatus.escalated.value:
                escalated_count += 1
            elif st in [CaseStatus.stopped.value, CaseStatus.failed.value]:
                stopped_count += 1

        terminal_cases = recovered_count + escalated_count + stopped_count
        recovery_rate = float(round((recovered_count / terminal_cases * 100), 1)) if terminal_cases > 0 else 0.0
        cases_resolved_ratio = float(round((recovered_count / total_cases * 100), 1)) if total_cases > 0 else 0.0
        average_recovered_amount = int(recovered_total // recovered_count) if recovered_count > 0 else 0
        
        policy_blocks = self.session.scalar(select(func.count(AuditEventModel.id)).where(AuditEventModel.merchant_id==self.merchant_id, AuditEventModel.event_type=="POLICY_BLOCKED")) or 0
        failed_payments = self.session.scalar(select(func.count(PaymentModel.id)).where(PaymentModel.merchant_id==self.merchant_id)) or 0
        recovery_actions = self.session.scalar(select(func.count(RecoveryActionModel.id)).where(RecoveryActionModel.merchant_id==self.merchant_id)) or 0

        return DashboardMetrics(
            revenue_at_risk=at_risk_total,
            revenue_recovered=recovered_total,
            unrecovered_revenue=at_risk_total,
            recovery_rate=recovery_rate,
            cases_resolved_ratio=cases_resolved_ratio,
            average_recovered_amount=average_recovered_amount,
            active_at_risk_count=at_risk_count,
            in_progress_count=in_progress_count,
            recovered_count=recovered_count,
            escalated_count=escalated_count,
            stopped_count=stopped_count,
            total_cases=total_cases,
            policy_blocks=policy_blocks,
            failed_payments=failed_payments,
            recovery_actions=recovery_actions
        )

    # ============================================================
    # STEP 21 RECOVERY FUNNEL & EVIDENCE QUERIES
    # ============================================================

    def get_recovery_funnel(self, policy: PolicyVersion) -> RecoveryFunnelResponse:
        cases = self.session.scalars(select(CaseModel).where(CaseModel.merchant_id==self.merchant_id)).all()
        actions = self.session.scalars(select(RecoveryActionModel).where(RecoveryActionModel.merchant_id==self.merchant_id)).all()
        
        from ..engines.domain import PolicyEngine
        policy_engine = PolicyEngine()

        total_cases = len(cases)
        total_at_risk_minor = sum(c.payload.get("amount", 0) for c in cases if c.payload)

        eligible_cases = 0
        eligible_revenue_minor = 0
        policy_blocked_cases = 0
        policy_blocked_revenue_minor = 0

        attempted_cases = 0
        attempted_revenue_minor = 0
        recovered_cases = 0
        recovered_revenue_minor = 0
        failed_cases = 0
        failed_revenue_minor = 0
        pending_cases = 0
        pending_revenue_minor = 0

        case_action_map = {}
        for act in actions:
            case_action_map[act.case_id] = act

        for c in cases:
            c_obj = self.to_case(c)
            amt = c_obj.amount
            st = c.status

            if st == CaseStatus.recovered.value:
                recovered_cases += 1
                recovered_revenue_minor += c.recovered_amount_minor or amt
            else:
                pol_res = policy_engine.validate(c_obj, policy)
                if pol_res.allowed:
                    eligible_cases += 1
                    eligible_revenue_minor += amt
                else:
                    policy_blocked_cases += 1
                    policy_blocked_revenue_minor += amt

            if c.id in case_action_map or c.retry_count > 0 or st in {CaseStatus.in_progress.value, CaseStatus.recovered.value, CaseStatus.executing.value, CaseStatus.pending.value, CaseStatus.failed.value}:
                attempted_cases += 1
                attempted_revenue_minor += amt

            if st in {CaseStatus.failed.value, CaseStatus.stopped.value}:
                failed_cases += 1
                failed_revenue_minor += amt
            elif st in {CaseStatus.pending.value, CaseStatus.in_progress.value, CaseStatus.executing.value}:
                pending_cases += 1
                pending_revenue_minor += amt

        remaining_revenue_at_risk_minor = max(0, total_at_risk_minor - recovered_revenue_minor)

        # Explicit Denominators
        case_recovery_rate = float(round((recovered_cases / attempted_cases * 100), 1)) if attempted_cases > 0 else 0.0
        rev_recovery_rate = float(round((recovered_revenue_minor / attempted_revenue_minor * 100), 1)) if attempted_revenue_minor > 0 else 0.0

        # Stages
        stages = [
            RecoveryFunnelStage(
                stage_name="Revenue At Risk",
                case_count=total_cases,
                amount_minor=total_at_risk_minor,
                percentage_of_total_revenue=100.0,
                description="Total gross transaction declines ingested across payment channels."
            ),
            RecoveryFunnelStage(
                stage_name="Policy Eligible",
                case_count=eligible_cases,
                amount_minor=eligible_revenue_minor,
                percentage_of_total_revenue=float(round((eligible_revenue_minor / total_at_risk_minor * 100), 1)) if total_at_risk_minor > 0 else 0.0,
                description="Transactions passing autonomous risk, retry, and amount limits."
            ),
            RecoveryFunnelStage(
                stage_name="Recovery Attempted",
                case_count=attempted_cases,
                amount_minor=attempted_revenue_minor,
                percentage_of_total_revenue=float(round((attempted_revenue_minor / total_at_risk_minor * 100), 1)) if total_at_risk_minor > 0 else 0.0,
                description="Bounded recovery actions initiated under database row locks."
            ),
            RecoveryFunnelStage(
                stage_name="Verified Recovered",
                case_count=recovered_cases,
                amount_minor=recovered_revenue_minor,
                percentage_of_total_revenue=float(round((recovered_revenue_minor / total_at_risk_minor * 100), 1)) if total_at_risk_minor > 0 else 0.0,
                description="Authoritative funds captured and cryptographically verified."
            ),
            RecoveryFunnelStage(
                stage_name="Policy Blocked",
                case_count=policy_blocked_cases,
                amount_minor=policy_blocked_revenue_minor,
                percentage_of_total_revenue=float(round((policy_blocked_revenue_minor / total_at_risk_minor * 100), 1)) if total_at_risk_minor > 0 else 0.0,
                description="Transactions blocked by max retries, fraud flags, or autonomous ceilings."
            ),
            RecoveryFunnelStage(
                stage_name="Provider Declined",
                case_count=failed_cases,
                amount_minor=failed_revenue_minor,
                percentage_of_total_revenue=float(round((failed_revenue_minor / total_at_risk_minor * 100), 1)) if total_at_risk_minor > 0 else 0.0,
                description="Terminal declines from banking switch or customer refusal."
            ),
            RecoveryFunnelStage(
                stage_name="Pending Settlement",
                case_count=pending_cases,
                amount_minor=pending_revenue_minor,
                percentage_of_total_revenue=float(round((pending_revenue_minor / total_at_risk_minor * 100), 1)) if total_at_risk_minor > 0 else 0.0,
                description="Gateway timeouts or links awaiting webhook confirmation (uncredited)."
            ),
        ]

        # Intervention Performance Breakdown
        interv_stats = {}
        for act in actions:
            itype = act.action_type
            if itype not in interv_stats:
                interv_stats[itype] = {
                    "attempts": 0, "successes": 0, "failures": 0, "pending": 0,
                    "attempted_rev": 0, "recovered_rev": 0
                }
            
            interv_stats[itype]["attempts"] += 1
            interv_stats[itype]["attempted_rev"] += act.amount_minor
            
            if act.verification_status == "verified":
                interv_stats[itype]["successes"] += 1
                interv_stats[itype]["recovered_rev"] += act.amount_minor
            elif act.verification_status in {"timeout", "pending", "unknown"}:
                interv_stats[itype]["pending"] += 1
            else:
                interv_stats[itype]["failures"] += 1

        interventions = []
        for itype, st in interv_stats.items():
            n = st["attempts"]
            rate = float(round((st["successes"] / n * 100), 1)) if n > 0 else 0.0
            interventions.append(
                InterventionPerformance(
                    intervention=itype,
                    sample_size=n,
                    attempts=n,
                    successes=st["successes"],
                    failures=st["failures"],
                    pending=st["pending"],
                    revenue_attempted_minor=st["attempted_rev"],
                    revenue_recovered_minor=st["recovered_rev"],
                    recovery_rate=rate,
                    recovery_rate_label=f"recovered / attempted (n={n})"
                )
            )

        return RecoveryFunnelResponse(
            total_cases=total_cases,
            revenue_at_risk_minor=total_at_risk_minor,
            eligible_cases=eligible_cases,
            eligible_revenue_minor=eligible_revenue_minor,
            policy_blocked_cases=policy_blocked_cases,
            policy_blocked_revenue_minor=policy_blocked_revenue_minor,
            attempted_cases=attempted_cases,
            attempted_revenue_minor=attempted_revenue_minor,
            recovered_cases=recovered_cases,
            recovered_revenue_minor=recovered_revenue_minor,
            failed_cases=failed_cases,
            failed_revenue_minor=failed_revenue_minor,
            pending_cases=pending_cases,
            pending_revenue_minor=pending_revenue_minor,
            remaining_revenue_at_risk_minor=remaining_revenue_at_risk_minor,
            case_recovery_rate=case_recovery_rate,
            case_recovery_rate_denominator="recovered_cases / attempted_cases",
            revenue_recovery_rate=rev_recovery_rate,
            revenue_recovery_rate_denominator="recovered_revenue_minor / attempted_revenue_minor",
            stages=stages,
            interventions=interventions,
        )

    def get_case_evidence_trace(self, case_id: str) -> CaseEvidenceTrace:
        row = self.session.scalar(select(CaseModel).where(CaseModel.id==case_id, CaseModel.merchant_id==self.merchant_id))
        if not row:
            raise CaseNotFoundError(f"Case {case_id} not found.")
        c = self.to_case(row)
        
        act = self.session.scalar(select(RecoveryActionModel).where(RecoveryActionModel.case_id==case_id, RecoveryActionModel.merchant_id==self.merchant_id).order_by(RecoveryActionModel.started_at.desc()))
        audit_events, _ = self.events(case_id=case_id, page_size=50)

        return CaseEvidenceTrace(
            case_id=c.id,
            amount_minor=c.amount,
            failure_type=c.failure_type.value if hasattr(c.failure_type, "value") else str(c.failure_type),
            status=c.status.value if hasattr(c.status, "value") else str(c.status),
            action_id=act.id if act else None,
            strategy=act.action_type if act else None,
            provider=act.provider if act else None,
            provider_order_id=act.provider_order_id if act else None,
            provider_payment_id=act.provider_payment_id if act else None,
            provider_status=act.provider_status if act else None,
            verification_status=act.verification_status if act else None,
            transaction_id=act.transaction_id if act else None,
            recovered_amount_minor=row.recovered_amount_minor or (c.amount if c.status == CaseStatus.recovered else 0),
            policy_version=act.policy_version if act else None,
            policy_allowed=True if (act or c.status == CaseStatus.recovered) else False,
            audit_events=audit_events,
            created_at=row.created_at,
            resolved_at=row.resolved_at
        )

    def get_batch_evidence_trace(self, batch_id: str) -> BatchEvidenceTrace:
        b = self.session.scalar(select(RecoveryBatchModel).where(RecoveryBatchModel.id==batch_id, RecoveryBatchModel.merchant_id==self.merchant_id))
        if not b:
            raise CaseNotFoundError(f"Batch {batch_id} not found.")
        
        items = self.get_batch_items(batch_id)
        audit_events = list(self.session.scalars(select(AuditEventModel).where(AuditEventModel.merchant_id==self.merchant_id, AuditEventModel.metadata_json["batch_id"].as_string()==batch_id).order_by(AuditEventModel.timestamp)).all())
        
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

        verified_sum = sum(it.amount_minor for it in items if it.status == "RECOVERED")
        is_reconciled = (verified_sum == b.recovered_revenue_minor)

        return BatchEvidenceTrace(
            batch_id=b.id,
            status=b.status,
            created_at=b.created_at,
            completed_at=b.completed_at,
            cases_selected=b.cases_selected,
            cases_eligible=b.cases_eligible,
            cases_blocked=b.cases_blocked,
            cases_attempted=b.cases_attempted,
            cases_recovered=b.cases_recovered,
            cases_failed=b.cases_failed,
            cases_pending=b.cases_pending,
            total_revenue_at_risk_minor=b.total_revenue_at_risk_minor,
            recovered_revenue_minor=b.recovered_revenue_minor,
            remaining_revenue_at_risk_minor=max(0, b.total_revenue_at_risk_minor - b.recovered_revenue_minor),
            items=item_outcomes,
            audit_events=[AuditEvent(event_id=x.id, event_type=x.event_type, case_id=x.case_id, campaign_id=x.campaign_id, policy_version=x.policy_version, timestamp=x.timestamp, actor=x.actor, metadata=x.metadata_json) for x in audit_events],
            reconciliation_status="RECONCILED" if is_reconciled else "DISCREPANCY"
        )
