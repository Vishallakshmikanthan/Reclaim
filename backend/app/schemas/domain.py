from datetime import datetime, timezone
from enum import Enum
from typing import Any
from uuid import uuid4
from pydantic import BaseModel, ConfigDict, Field

def now() -> datetime: return datetime.now(timezone.utc)
def ident(prefix: str) -> str: return f"{prefix}_{uuid4().hex[:12]}"
class CaseStatus(str, Enum): at_risk="atRisk"; in_progress="inProgress"; recovered="recovered"; escalated="escalated"; stopped="stopped"; failed="failed"; blocked="blocked"; executing="executing"; pending="pending"
class FailureType(str, Enum): upi_timeout="UPI Timeout"; card_decline="Card Decline"; insufficient_funds="Insufficient Funds"; bank_downtime="Bank Downtime"; network_drop="Network Drop"; checkout_abandonment="Checkout Abandonment"; subscription_failure="Subscription Failure"; overdue_invoice="Overdue Invoice"; fraud_signal="Fraud Signal"
class PaymentMethod(str, Enum): upi="UPI"; credit_card="Credit Card"; debit_card="Debit Card"; netbanking="Netbanking"; wallet="Wallet"; subscription_mandate="Subscription Mandate"
class RecoveryChannel(str, Enum): gateway_retry="gateway_retry"; sms_link="sms_link"; whatsapp_link="whatsapp_link"; human_escalation="human_escalation"; no_action="no_action"
class Strategy(str, Enum): retry_payment="retry_payment"; payment_link="payment_link"; customer_reminder="customer_reminder"; subscription_retry="subscription_retry"; human_escalation="human_escalation"; no_action="no_action"
class ActionStatus(str, Enum): approved="approved"; executed="executed"; verification_pending="verification_pending"; verified="verified"; failed="failed"; timeout="timeout"; unknown="unknown"; blocked="blocked"
class CampaignStatus(str, Enum): draft="DRAFT"; ready="READY"; running="RUNNING"; paused="PAUSED"; completed="COMPLETED"; failed="FAILED"
class CommunicationChannel(str, Enum): in_app="in_app"; email="email"; sms="sms"; whatsapp="whatsapp"
class Merchant(BaseModel): id: str; name: str; email: str | None = None
class Payment(BaseModel): payment_id: str; order_id: str; amount: int = Field(gt=0); currency: str = Field(default="INR", min_length=3, max_length=3); method: PaymentMethod; failure_reason: str; created_at: datetime = Field(default_factory=now)
class Case(BaseModel):
    model_config = ConfigDict(use_enum_values=True)
    id: str = Field(default_factory=lambda: ident("case")); payment_id: str; order_id: str; customer_id: str; customer: str; customer_email: str; customer_phone: str
    amount: int = Field(gt=0, description="Integer minor units (paise)"); payment_method: PaymentMethod; failure_type: FailureType; failure_reason: str; prob: float = Field(ge=0, le=1); expected: int = Field(ge=0); status: CaseStatus = CaseStatus.at_risk; age: str = "0 min"; created_at: datetime = Field(default_factory=now); updated_at: datetime | None = None; last_attempt_at: datetime | None = None; retry_count: int = Field(default=0, ge=0, le=10); max_retries: int = Field(default=3, ge=0, le=10); contact_count_24h: int = Field(default=0, ge=0); max_contacts_24h: int = Field(default=2, ge=1); risk_score: float = Field(default=0, ge=0, le=1); strategy: str = ""; bank: str | None = None; demo_scenario: str = "STANDARD"; recovered_amount: int = Field(default=0, ge=0)
class CaseCreateRequest(Case): pass
class CaseUpdateRequest(BaseModel): status: CaseStatus | None = None
class CaseResponse(Case): pass
class CaseListResponse(BaseModel): items: list[CaseResponse]; page: int; page_size: int; total: int
class PolicyConfiguration(BaseModel): max_retries: int = Field(default=3, ge=0, le=10); min_recovery_probability: float = Field(default=.2, ge=0, le=1); max_autonomous_amount: int = Field(default=1_000_000, gt=0); max_contacts_24h: int = Field(default=2, ge=1, le=10); max_risk_score: float = Field(default=.6, ge=0, le=1)
class PolicyVersion(BaseModel): version: str; created_at: datetime = Field(default_factory=now); created_by: str; configuration: PolicyConfiguration; active: bool
class Policy(BaseModel): current: PolicyVersion
class PolicyResponse(PolicyVersion): pass
class PolicyVersionResponse(PolicyVersion): pass
class PolicyUpdateRequest(BaseModel): configuration: PolicyConfiguration; created_by: str = Field(default="system", min_length=1)
class PolicyValidationRequest(BaseModel): case_id: str
class PolicyValidationResponse(BaseModel): allowed: bool; blocked_rules: list[str]; summary: str; policy_version: str
class RecoveryDecision(BaseModel): case_id: str; strategy: Strategy; recovery_probability: float; expected_recovery: int; priority: str; explanation: str; policy_result: PolicyValidationResponse; next_step: str
class RecoveryDecisionResponse(RecoveryDecision): pass
class RecoveryActionRequest(BaseModel): strategy: Strategy | None = None; scenario: str | None = None
class RecoveryAction(BaseModel): action_id: str = Field(default_factory=lambda: ident("action")); case_id: str; strategy: Strategy; status: ActionStatus; policy_version: str; idempotency_key: str; verification_status: str; created_at: datetime = Field(default_factory=now); transaction_id: str | None = None
class RecoveryActionResponse(RecoveryAction): pass
class RecoveryStatusResponse(BaseModel): case_id: str; status: CaseStatus; recovered_amount: int; verification_status: str | None = None
class Campaign(BaseModel): id: str = Field(default_factory=lambda: ident("campaign")); name: str = Field(min_length=1); type: str; description: str = ""; status: CampaignStatus = CampaignStatus.draft; min_probability: float = Field(default=.2, ge=0, le=1); case_ids: list[str] = Field(default_factory=list); created_at: datetime = Field(default_factory=now); updated_at: datetime = Field(default_factory=now)
class CampaignCreateRequest(BaseModel): name: str; type: str; description: str = ""; min_probability: float = Field(default=.2, ge=0, le=1); case_ids: list[str] = Field(default_factory=list)
class CampaignUpdateRequest(BaseModel): name: str | None = None; description: str | None = None; min_probability: float | None = Field(default=None, ge=0, le=1)
class CampaignResponse(Campaign): pass
class CampaignExecutionResponse(BaseModel): campaign_id: str; status: CampaignStatus; message: str
class CampaignStatusResponse(BaseModel): campaign_id: str; status: CampaignStatus
class Communication(BaseModel): id: str = Field(default_factory=lambda: ident("comm")); case_id: str; channel: CommunicationChannel; content: str = Field(min_length=1); status: str = "SENT_SIMULATED"; campaign_id: str | None = None; created_at: datetime = Field(default_factory=now)
class CommunicationRequest(BaseModel): case_id: str; channel: CommunicationChannel; content: str = Field(min_length=1); campaign_id: str | None = None
class CommunicationResponse(Communication): pass
class CommunicationStatusResponse(BaseModel): communication_id: str; status: str
class AuditEvent(BaseModel): event_id: str = Field(default_factory=lambda: ident("audit")); event_type: str; case_id: str | None = None; campaign_id: str | None = None; policy_version: str | None = None; timestamp: datetime = Field(default_factory=now); actor: str = "system"; metadata: dict[str, Any] = Field(default_factory=dict)
class AuditEventResponse(AuditEvent): pass
class AuditEventListResponse(BaseModel): items: list[AuditEventResponse]; total: int
class EvaluationCase(BaseModel): id: str; amount: int = Field(gt=0); failure_type: FailureType; recoverable: bool
class EvaluationMetrics(BaseModel): total_cases: int; recovered_cases: int; recovered_amount: int; policy_blocks: int
class EvaluationRun(BaseModel): run_id: str = Field(default_factory=lambda: ident("eval")); status: str = "COMPLETED"; created_at: datetime = Field(default_factory=now); metrics: EvaluationMetrics
class EvaluationComparison(BaseModel): baseline_recovered_amount: int; reclaim_recovered_amount: int
class EvaluationReport(BaseModel): run: EvaluationRun; comparison: EvaluationComparison
class SystemHealth(BaseModel): status: str; services: dict[str, str]
class FailureEvent(BaseModel): service: str; scenario: str
