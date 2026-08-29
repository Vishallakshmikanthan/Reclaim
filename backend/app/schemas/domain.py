from datetime import datetime, timezone
from enum import Enum
from typing import Any
from uuid import uuid4
from pydantic import BaseModel, ConfigDict, Field

def now() -> datetime: return datetime.now(timezone.utc)
def ident(prefix: str) -> str: return f"{prefix}_{uuid4().hex[:12]}"

class CaseStatus(str, Enum):
    at_risk = "atRisk"
    in_progress = "inProgress"
    recovered = "recovered"
    escalated = "escalated"
    stopped = "stopped"
    failed = "failed"
    blocked = "blocked"
    executing = "executing"
    pending = "pending"

class FailureType(str, Enum):
    upi_timeout = "UPI Timeout"
    card_decline = "Card Decline"
    insufficient_funds = "Insufficient Funds"
    bank_downtime = "Bank Downtime"
    network_drop = "Network Drop"
    checkout_abandonment = "Checkout Abandonment"
    subscription_failure = "Subscription Failure"
    overdue_invoice = "Overdue Invoice"
    fraud_signal = "Fraud Signal"

class PaymentMethod(str, Enum):
    upi = "UPI"
    credit_card = "Credit Card"
    debit_card = "Debit Card"
    netbanking = "Netbanking"
    wallet = "Wallet"
    subscription_mandate = "Subscription Mandate"

class RecoveryChannel(str, Enum):
    gateway_retry = "gateway_retry"
    sms_link = "sms_link"
    whatsapp_link = "whatsapp_link"
    human_escalation = "human_escalation"
    no_action = "no_action"

class Strategy(str, Enum):
    retry_payment = "retry_payment"
    payment_link = "payment_link"
    customer_reminder = "customer_reminder"
    subscription_retry = "subscription_retry"
    human_escalation = "human_escalation"
    no_action = "no_action"

class ActionStatus(str, Enum):
    approved = "approved"
    executed = "executed"
    verification_pending = "verification_pending"
    verified = "verified"
    failed = "failed"
    timeout = "timeout"
    unknown = "unknown"
    blocked = "blocked"

class CampaignStatus(str, Enum):
    draft = "DRAFT"
    ready = "READY"
    running = "RUNNING"
    paused = "PAUSED"
    completed = "COMPLETED"
    failed = "FAILED"

class RecoveryBatchStatus(str, Enum):
    preview = "PREVIEW"
    authorized = "AUTHORIZED"
    running = "RUNNING"
    completed = "COMPLETED"
    partially_completed = "PARTIALLY_COMPLETED"
    failed = "FAILED"
    cancelled = "CANCELLED"

class PriorityTier(str, Enum):
    critical = "Critical"
    high = "High"
    medium = "Medium"
    low = "Low"

class CommunicationChannel(str, Enum):
    in_app = "in_app"
    email = "email"
    sms = "sms"
    whatsapp = "whatsapp"

class Merchant(BaseModel):
    id: str
    name: str
    email: str | None = None

class Payment(BaseModel):
    payment_id: str
    order_id: str
    amount: int = Field(gt=0)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    method: PaymentMethod
    failure_reason: str
    created_at: datetime = Field(default_factory=now)

class Case(BaseModel):
    model_config = ConfigDict(use_enum_values=True)
    id: str = Field(default_factory=lambda: ident("case"))
    payment_id: str
    order_id: str
    customer_id: str
    customer: str
    customer_email: str
    customer_phone: str
    amount: int = Field(gt=0, description="Integer minor units (paise)")
    payment_method: PaymentMethod
    failure_type: FailureType
    failure_reason: str
    prob: float = Field(ge=0, le=1)
    expected: int = Field(ge=0)
    status: CaseStatus = CaseStatus.at_risk
    age: str = "0 min"
    created_at: datetime = Field(default_factory=now)
    updated_at: datetime | None = None
    last_attempt_at: datetime | None = None
    resolved_at: datetime | None = None
    retry_count: int = Field(default=0, ge=0, le=10)
    max_retries: int = Field(default=3, ge=0, le=10)
    contact_count_24h: int = Field(default=0, ge=0)
    max_contacts_24h: int = Field(default=2, ge=1)
    risk_score: float = Field(default=0, ge=0, le=1)
    strategy: str = ""
    bank: str | None = None
    demo_scenario: str = "STANDARD"
    recovered_amount: int = Field(default=0, ge=0)
    customer_message: str | None = None

class CaseCreateRequest(Case): pass
class CaseUpdateRequest(BaseModel): status: CaseStatus | None = None
CaseResponse = Case
class CaseListResponse(BaseModel): items: list[Case]; page: int; page_size: int; total: int

class PolicyConfiguration(BaseModel):
    max_retries: int = Field(default=3, ge=0, le=10)
    min_recovery_probability: float = Field(default=.2, ge=0, le=1)
    max_autonomous_amount: int = Field(default=1_000_000, gt=0)
    max_contacts_24h: int = Field(default=2, ge=1, le=10)
    max_risk_score: float = Field(default=.6, ge=0, le=1)

class PolicyVersion(BaseModel):
    version: str
    created_at: datetime = Field(default_factory=now)
    created_by: str
    configuration: PolicyConfiguration
    active: bool

class Policy(BaseModel): current: PolicyVersion
PolicyResponse = PolicyVersion
PolicyVersionResponse = PolicyVersion
class PolicyUpdateRequest(BaseModel): configuration: PolicyConfiguration; created_by: str = Field(default="system", min_length=1)

from .ai import *

class PolicyValidationRequest(BaseModel): case_id: str
class PolicyValidationResponse(BaseModel): allowed: bool; blocked_rules: list[str]; summary: str; policy_version: str

class RecoveryDecision(BaseModel):
    case_id: str
    strategy: Strategy
    recovery_probability: float
    expected_recovery: int
    priority: str
    explanation: str
    policy_result: PolicyValidationResponse
    next_step: str
    decision_source: DecisionSource = DecisionSource.deterministic_fallback
    diagnosis: str | None = None
    recommended_intervention: str | None = None
    rationale: str | None = None
    evidence: list[EvidenceItem] = Field(default_factory=list)
    confidence: float | None = None
    expected_recovery_minor: int | None = None
    alternatives: list[AlternativeIntervention] = Field(default_factory=list)
    do_not_do: list[str] = Field(default_factory=list)
    policy_version: str | None = None
    recommendation_timestamp: datetime = Field(default_factory=now)
    model_id: str | None = None
    latency_ms: int | None = None

RecoveryDecisionResponse = RecoveryDecision

class RecoveryActionRequest(BaseModel): strategy: Strategy | None = None; scenario: str | None = None
class RecoveryAction(BaseModel):
    action_id: str = Field(default_factory=lambda: ident("action"))
    case_id: str
    strategy: Strategy
    status: ActionStatus
    policy_version: str
    idempotency_key: str
    verification_status: str
    created_at: datetime = Field(default_factory=now)
    transaction_id: str | None = None
    provider: str = "simulated"
    provider_order_id: str | None = None
    provider_payment_id: str | None = None
    provider_status: str | None = None
    provider_reference: str | None = None
    failure_code: str | None = None
    failure_reason: str | None = None
RecoveryActionResponse = RecoveryAction

class RecoveryStatusResponse(BaseModel): case_id: str; status: CaseStatus; recovered_amount: int; verification_status: str | None = None
class WebhookResponse(BaseModel): status: str; event_id: str | None = None; message: str
class ReconciliationResponse(BaseModel): action_id: str; case_id: str; provider: str; status: ActionStatus; verification_status: str; message: str

class Campaign(BaseModel): id: str = Field(default_factory=lambda: ident("campaign")); name: str = Field(min_length=1); type: str; description: str = ""; status: CampaignStatus = CampaignStatus.draft; min_probability: float = Field(default=.2, ge=0, le=1); case_ids: list[str] = Field(default_factory=list); created_at: datetime = Field(default_factory=now); updated_at: datetime = Field(default_factory=now)
class CampaignCreateRequest(BaseModel): name: str; type: str; description: str = ""; min_probability: float = Field(default=.2, ge=0, le=1); case_ids: list[str] = Field(default_factory=list)
class CampaignUpdateRequest(BaseModel): name: str | None = None; description: str | None = None; min_probability: float | None = Field(default=None, ge=0, le=1)
CampaignResponse = Campaign
class CampaignExecutionResponse(BaseModel): campaign_id: str; status: CampaignStatus; message: str
class CampaignStatusResponse(BaseModel): campaign_id: str; status: CampaignStatus
class Communication(BaseModel): id: str = Field(default_factory=lambda: ident("comm")); case_id: str; channel: CommunicationChannel; content: str = Field(min_length=1); status: str = "SENT_SIMULATED"; campaign_id: str | None = None; created_at: datetime = Field(default_factory=now)
class CommunicationRequest(BaseModel): case_id: str; channel: CommunicationChannel; content: str = Field(min_length=1); campaign_id: str | None = None
CommunicationResponse = Communication
class CommunicationStatusResponse(BaseModel): communication_id: str; status: str
class AuditEvent(BaseModel): event_id: str = Field(default_factory=lambda: ident("audit")); event_type: str; case_id: str | None = None; campaign_id: str | None = None; policy_version: str | None = None; timestamp: datetime = Field(default_factory=now); actor: str = "system"; metadata: dict[str, Any] = Field(default_factory=dict)
AuditEventResponse = AuditEvent
class AuditEventListResponse(BaseModel): items: list[AuditEvent]; total: int
class EvaluationCase(BaseModel): id: str; amount: int = Field(gt=0); failure_type: FailureType; recoverable: bool
class EvaluationMetrics(BaseModel): total_cases: int; recovered_cases: int; recovered_amount: int; policy_blocks: int
class EvaluationRun(BaseModel): run_id: str = Field(default_factory=lambda: ident("eval")); status: str = "COMPLETED"; created_at: datetime = Field(default_factory=now); metrics: EvaluationMetrics
class EvaluationComparison(BaseModel): baseline_recovered_amount: int; reclaim_recovered_amount: int
class EvaluationReport(BaseModel): run: EvaluationRun; comparison: EvaluationComparison
class SystemHealth(BaseModel): status: str; services: dict[str, str]
class FailureEvent(BaseModel): service: str; scenario: str
class DashboardMetrics(BaseModel):
    revenue_at_risk: int = 0
    revenue_recovered: int = 0
    unrecovered_revenue: int = 0
    recovery_rate: float = 0.0
    cases_resolved_ratio: float = 0.0
    average_recovered_amount: int = 0
    average_time_to_recovery_min: int = 14
    median_time_to_recovery_min: int = 12
    active_at_risk_count: int = 0
    in_progress_count: int = 0
    recovered_count: int = 0
    escalated_count: int = 0
    stopped_count: int = 0
    total_cases: int = 0
    policy_blocks: int = 0
    failed_payments: int = 0
    recovery_actions: int = 0

DashboardMetricsResponse = DashboardMetrics

# ============================================================
# RECOVERY QUEUE & BATCH ORCHESTRATION SCHEMAS (STEP 20)
# ============================================================

class QueueItem(BaseModel):
    case_id: str
    payment_id: str
    customer_id: str
    customer: str
    amount: int = Field(gt=0, description="paise")
    currency: str = "INR"
    payment_method: str
    failure_type: str
    failure_reason: str
    age: str
    retry_count: int
    contact_count_24h: int
    status: CaseStatus
    priority_score: int = Field(ge=0, le=100, description="0-100 deterministic priority score")
    priority_tier: str = Field(default="Medium", description="Critical, High, Medium, Low")
    priority_reasons: list[str] = Field(default_factory=list)
    expected_recovery_minor: int = Field(ge=0)
    policy_allowed: bool = True
    policy_blocked_rules: list[str] = Field(default_factory=list)
    policy_summary: str = "Recovery authorized."
    recommended_intervention: str = "RETRY_PAYMENT"
    strategy: str = "retry_payment"
    decision_source: DecisionSource = DecisionSource.deterministic_fallback
    ai_diagnosis: str | None = None

class RecoveryQueueSummary(BaseModel):
    total_at_risk_minor: int = 0
    total_expected_recovery_minor: int = 0
    eligible_count: int = 0
    blocked_count: int = 0

class RecoveryQueueResponse(BaseModel):
    items: list[QueueItem]
    page: int
    page_size: int
    total: int
    summary: RecoveryQueueSummary

class BatchPreviewRequest(BaseModel):
    case_ids: list[str] | None = None
    status: CaseStatus | None = None
    failure_type: FailureType | None = None
    priority: str | None = None
    min_amount: int | None = None
    max_amount: int | None = None
    eligible_only: bool = False
    max_batch_size: int = Field(default=50, ge=1, le=100)
    max_monetary_exposure_minor: int | None = None

class BatchPreviewResponse(BaseModel):
    preview_id: str = Field(default_factory=lambda: ident("preview"))
    selected_count: int
    total_revenue_at_risk_minor: int
    estimated_recoverable_minor: int
    eligible_count: int
    eligible_revenue_minor: int
    blocked_count: int
    blocked_revenue_minor: int
    manual_review_count: int
    recommended_interventions: dict[str, int] = Field(default_factory=dict)
    cases: list[QueueItem]
    ai_analysis: AIBatchAnalysis

class BatchExecutionRequest(BaseModel):
    case_ids: list[str] | None = None
    status: CaseStatus | None = None
    failure_type: FailureType | None = None
    priority: str | None = None
    min_amount: int | None = None
    max_amount: int | None = None
    eligible_only: bool = False
    max_batch_size: int = Field(default=50, ge=1, le=100)
    max_monetary_exposure_minor: int | None = None
    scenario: str | None = None

class BatchItemOutcome(BaseModel):
    case_id: str
    amount: int
    status: str
    priority_score: int
    priority_tier: str
    strategy: str
    action_id: str | None = None
    verification_status: str | None = None
    policy_allowed: bool = True
    blocked_rules: list[str] = Field(default_factory=list)
    error: str | None = None

class BatchExecutionResponse(BaseModel):
    batch_id: str
    status: RecoveryBatchStatus
    batch_size: int
    cases_selected: int
    cases_eligible: int
    cases_blocked: int
    cases_attempted: int
    cases_recovered: int
    cases_failed: int
    cases_pending: int
    total_revenue_at_risk_minor: int
    eligible_revenue_minor: int
    blocked_revenue_minor: int
    attempted_recovery_minor: int
    recovered_revenue_minor: int
    failed_recovery_minor: int
    pending_recovery_minor: int
    recovery_rate: float
    policy_block_rate: float
    ai_fallback_count: int
    communication_count: int
    items: list[BatchItemOutcome]
    ai_analysis: AIBatchAnalysis | None = None
    created_at: datetime = Field(default_factory=now)
    completed_at: datetime | None = None
