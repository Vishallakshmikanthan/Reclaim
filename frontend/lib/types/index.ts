export type CaseStatus = 
  | "atRisk" 
  | "inProgress" 
  | "recovered" 
  | "escalated" 
  | "stopped" 
  | "failed" 
  | "blocked" 
  | "executing" 
  | "pending";

export type FailureType = 
  | "UPI Timeout" 
  | "Card Decline" 
  | "Insufficient Funds" 
  | "Bank Downtime" 
  | "Network Drop" 
  | "Checkout Abandonment" 
  | "Subscription Failure" 
  | "Overdue Invoice" 
  | "Fraud Signal";

export type PaymentMethod = 
  | "UPI" 
  | "Credit Card" 
  | "Debit Card" 
  | "Netbanking" 
  | "Wallet" 
  | "Subscription Mandate";

export type RecoveryChannel = 
  | "gateway_retry" 
  | "sms_link" 
  | "whatsapp_link" 
  | "human_escalation" 
  | "no_action";

export type DecisionConfidence = "High" | "Medium" | "Low";

export type RecommendedInterventionType = 
  | "Retry Payment" 
  | "Payment Link" 
  | "Customer Reminder" 
  | "Subscription Retry" 
  | "Receivables Reminder" 
  | "Human Escalation" 
  | "No Action";

export type InterventionType = 
  | "RETRY_PAYMENT" 
  | "SEND_PAYMENT_LINK" 
  | "SEND_CUSTOMER_REMINDER" 
  | "RETRY_SUBSCRIPTION" 
  | "SEND_RECEIVABLES_REMINDER" 
  | "HUMAN_ESCALATION" 
  | "NO_ACTION";

export type StrategyUrgency = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type StrategyStatus = 
  | "READY" 
  | "EXECUTING" 
  | "WAITING" 
  | "FALLBACK_AVAILABLE" 
  | "ESCALATED" 
  | "STOPPED" 
  | "RECOVERED";

export type StoppingRuleType = 
  | "MAX_RETRIES_REACHED" 
  | "CONTACT_LIMIT_REACHED" 
  | "PROBABILITY_BELOW_THRESHOLD" 
  | "EXPECTED_VALUE_BELOW_MINIMUM" 
  | "COOLING_PERIOD_ACTIVE" 
  | "POLICY_VIOLATION" 
  | "ALREADY_RECOVERED" 
  | "VERIFICATION_UNRESOLVED" 
  | "RISK_RADAR_FLAG";

export interface StrategyStep {
  stepIndex: number;
  type: "PRIMARY" | "FALLBACK" | "ESCALATION";
  intervention: InterventionType;
  label: string;
  channel: RecoveryChannel;
  status: "READY" | "APPROVED" | "BLOCKED" | "EXECUTING" | "EXECUTED" | "SUCCEEDED" | "FAILED" | "SKIPPED" | "PENDING";
  expectedRecovery: number; // in paise
  recoveryProbability: number; // 0.0 to 1.0
  policyCheckRequired: boolean;
  policySummary?: string;
  rationale: string;
}

export interface RecoveryStrategy {
  caseId: string;
  status: StrategyStatus;
  priority: "Critical" | "High" | "Medium" | "Low";
  urgency: StrategyUrgency;
  urgencyReason: string;
  currentStepIndex: number;
  steps: StrategyStep[];
  primaryAction: StrategyStep;
  fallbackActions: StrategyStep[];
  escalationAction: StrategyStep;
  budget: {
    maxInterventions: number;
    currentInterventions: number;
  };
  stoppingRules: {
    rule: StoppingRuleType;
    description: string;
    triggered: boolean;
  }[];
  explanation: string;
  fallbackExplanation: string;
  noActionReason?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  contactCount24h: number;
  maxContacts24h: number;
  languagePref: "Hinglish" | "English" | "Hindi";
  riskTier: "LOW" | "MEDIUM" | "HIGH";
}

export interface Payment {
  paymentId: string;
  orderId: string;
  amount: number; // in paise
  currency: string;
  method: PaymentMethod;
  bank?: string;
  cardNetwork?: string;
  failureCode?: string;
  failureReason: string;
  createdAt: string;
}

export interface RiskSignals {
  paymentAge: string;
  previousSuccessfulPayments: number;
  previousFailedAttempts: number;
  historicalRecoveryRate: number; // e.g. 74 for 74%
  customerRiskTier: "LOW" | "MEDIUM" | "HIGH";
  retryAttempts: string;
  contactCount: string;
}

export interface Case {
  id: string;
  paymentId: string;
  orderId: string;
  customerId: string;
  customer: string;
  customerEmail: string;
  customerPhone: string;
  amount: number; // in paise (e.g. 849900 = ₹8,499)
  paymentMethod: PaymentMethod;
  failure: FailureType;
  failureType: FailureType;
  failureReason: string;
  prob: number; // 0.0 to 1.0 (e.g. 0.81)
  expected: number; // in paise
  status: CaseStatus;
  age: string;
  createdAt: string;
  updatedAt?: string;
  lastAttemptAt?: string;
  retryCount: number;
  maxRetries: number;
  contactCount24h: number;
  maxContacts24h: number;
  riskScore: number; // 0.0 to 1.0
  strategy: string;
  bank?: string;
  demoScenario?: "A_SUCCESS" | "B_POLICY_BLOCK" | "C_TIMEOUT" | "D_LOW_PROB" | "E_MEDIUM_LINK" | "STANDARD";
  lastError?: string;
  
  previousSuccessfulPayments?: number;
  previousFailedAttempts?: number;
  historicalRecoveryRate?: number;
  customerRiskTier?: "LOW" | "MEDIUM" | "HIGH";

  resolutionDetails?: {
    recoveredAmount: number;
    channel: string;
    timestamp: string;
    transactionId?: string;
  };
}

export interface PolicyCheckItem {
  id: string;
  name: string;
  description: string;
  value: string;
  threshold: string;
  status: "pass" | "fail" | "warn";
  passed: boolean;
}

export interface PolicyResult {
  allowed: boolean;
  checks: PolicyCheckItem[];
  blockedRules: string[];
  summary: string;
  recommendedNextAction: string;
}

export interface ExecutionProgress {
  caseId: string;
  step: "idle" | "authorizing" | "executing" | "verifying" | "success" | "timeout" | "failed" | "blocked";
  idempotencyKey?: string;
  gateway?: string;
  transactionId?: string;
  latency?: string;
  currentIntervention?: string;
  isFallback?: boolean;
}

export interface AlternativeAction {
  name: string;
  channel: string;
  estimatedExpectedRecovery: number;
  estimatedProbability: number;
  description: string;
  recommended?: boolean;
}

export interface DecisionTimelineEvent {
  time: string;
  step: string;
  detail: string;
  layer: string;
  source?: AuditLayerSource;
}

export interface RecoveryDecision {
  caseId: string;
  likelyRootCause: string;
  confidence: DecisionConfidence;
  whyThisMatters: string;
  recoveryProbability: number;
  contributingSignals: {
    positive: string[];
    negative: string[];
  };
  expectedRecovery: number;
  recommendedIntervention: RecommendedInterventionType;
  whyThisAction: string;
  alternatives: AlternativeAction[];
  decisionTimeline: DecisionTimelineEvent[];
  policyStatus: "Approved" | "Blocked";
  nextAction: string;
  recommendedAction: string;
  strategy: string;
  channel: RecoveryChannel;
  conciseReason: string;
  rootCause: string;
  fallbackPlan: string;
  escalationPlan: string;
  suggestedPayload?: Record<string, any>;
}

export type AuditLayer = 
  | "LAYER 0" 
  | "LAYER 1" 
  | "LAYER 2" 
  | "LAYER 3" 
  | "LAYER 4" 
  | "LAYER 5";

export type AuditLayerSource = 
  | "RISK_ENGINE" 
  | "AGENT" 
  | "POLICY_ENGINE" 
  | "EXECUTOR" 
  | "VERIFICATION" 
  | "AUDIT";

export type AuditEventType = 
  | "CASE_CREATED" 
  | "RISK_SCORED" 
  | "AGENT_DECISION" 
  | "STRATEGY_CREATED"
  | "INTERVENTION_SELECTED"
  | "POLICY_CHECKED" 
  | "POLICY_APPROVED" 
  | "POLICY_BLOCKED" 
  | "POLICY_RECHECKED"
  | "ACTION_CREATED"
  | "ACTION_EXECUTED" 
  | "VERIFICATION_STARTED"
  | "ACTION_SUCCEEDED" 
  | "ACTION_FAILED" 
  | "FALLBACK_SELECTED"
  | "FALLBACK_BLOCKED"
  | "STOPPING_RULE_TRIGGERED"
  | "VERIFICATION_TIMEOUT" 
  | "CASE_RESOLVED" 
  | "CASE_ESCALATED" 
  | "CASE_STOPPED"
  | "RECOVERY_VERIFIED"
  | "FAILURE_DETECTED"
  | "SERVICE_DEGRADED"
  | "ACTION_BLOCKED_FOR_SAFETY"
  | "RECOVERY_ATTEMPTED"
  | "RECOVERY_SUCCEEDED"
  | "RECOVERY_FAILED"
  | "OUTCOME_UNKNOWN"
  | "DUPLICATE_PREVENTED"
  | "ESCALATION_CREATED"
  | "SERVICE_RECOVERED"
  | "CAMPAIGN_PAUSED"
  | "CAMPAIGN_RESUMED"
  | "COMMUNICATION_SENT_SIMULATED"
  | "CAMPAIGN_CREATED"
  | "CAMPAIGN_RUNNING"
  | "RECOVERY_ACTION_EXECUTED"
  | "POLICY_UPDATED"
  | "POLICY_ROLLBACK"
  | "POLICY_CREATED"
  | "POLICY_ACTIVATED"
  | "POLICY_DEACTIVATED"
  | "BATCH_CREATED"
  | "BATCH_AUTHORIZED"
  | "BATCH_STARTED"
  | "BATCH_CASE_ATTEMPTED"
  | "BATCH_CASE_RECOVERED"
  | "BATCH_CASE_BLOCKED"
  | "BATCH_CASE_FAILED"
  | "BATCH_CASE_PENDING"
  | "BATCH_COMPLETED"
  | "BATCH_PARTIALLY_COMPLETED"
  | "BATCH_CANCELLED";

export interface AuditEventDetails {
  policyRule?: string;
  threshold?: string;
  actualValue?: string;
  idempotencyKey?: string;
  gateway?: string;
  transactionId?: string;
  amount?: number;
  customer?: string;
  paymentMethod?: string;
  reason?: string;
  nextAction?: string;
  strategyStep?: string;
  isFallback?: boolean;
  failureType?: string;
  requiredAction?: string;
  severity?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  layer: AuditLayer;
  source?: AuditLayerSource;
  event: AuditEventType;
  case: string;
  desc: string;
  latency?: string;
  status?: "SUCCESS" | "BLOCKED" | "TIMEOUT" | "FAILED" | "INFO";
  details?: AuditEventDetails;
}

export interface EvaluationMetric {
  id: string;
  caseId: string;
  paymentMethod: string;
  amount: number;
  failureType: string;
  naiveAction: string;
  naiveOutcome: "RECOVERED" | "FAILED" | "WASTED_RETRY" | "POLICY_VIOLATION";
  reclaimAction: string;
  reclaimOutcome: "RECOVERED" | "SAFELY_STOPPED" | "PREVENTED_BREACH" | "TIMED_OUT";
  upliftInr: number;
}

// ============================================================
// STEP 20 RECOVERY QUEUE & BATCH ORCHESTRATION TYPES
// ============================================================

export type PriorityTier = "Critical" | "High" | "Medium" | "Low";

export type RecoveryBatchStatus = 
  | "PREVIEW" 
  | "AUTHORIZED" 
  | "RUNNING" 
  | "COMPLETED" 
  | "PARTIALLY_COMPLETED" 
  | "FAILED" 
  | "CANCELLED";

export interface AIBatchAnalysis {
  summary: string;
  dominant_failure_patterns: string[];
  recommended_strategy: string;
  priority_reason: string;
  risks: string[];
  do_not_do: string[];
  decision_source?: string;
  model_id?: string | null;
  latency_ms?: number;
}

export interface QueueItem {
  case_id: string;
  payment_id: string;
  customer_id: string;
  customer: string;
  amount: number;
  currency: string;
  payment_method: string;
  failure_type: string;
  failure_reason: string;
  age: string;
  retry_count: number;
  contact_count_24h: number;
  status: string;
  priority_score: number;
  priority_tier: PriorityTier;
  priority_reasons: string[];
  expected_recovery_minor: number;
  policy_allowed: boolean;
  policy_blocked_rules: string[];
  policy_summary: string;
  recommended_intervention: string;
  strategy: string;
  decision_source: string;
  ai_diagnosis?: string | null;
}

export interface RecoveryQueueSummary {
  total_at_risk_minor: number;
  total_expected_recovery_minor: number;
  eligible_count: number;
  blocked_count: number;
}

export interface RecoveryQueueResponse {
  items: QueueItem[];
  page: number;
  page_size: number;
  total: number;
  summary: RecoveryQueueSummary;
}

export interface BatchPreviewRequest {
  case_ids?: string[];
  status?: string;
  failure_type?: string;
  priority?: string;
  min_amount?: number;
  max_amount?: number;
  eligible_only?: boolean;
  max_batch_size?: number;
  max_monetary_exposure_minor?: number;
}

export interface BatchPreviewResponse {
  selected_count: number;
  total_revenue_at_risk_minor: number;
  estimated_recoverable_minor: number;
  eligible_count: number;
  eligible_revenue_minor: number;
  blocked_count: number;
  blocked_revenue_minor: number;
  manual_review_count: number;
  recommended_interventions: Record<string, number>;
  cases: QueueItem[];
  ai_analysis?: AIBatchAnalysis | null;
}

export interface BatchExecutionRequest {
  case_ids?: string[];
  status?: string;
  failure_type?: string;
  priority?: string;
  min_amount?: number;
  max_amount?: number;
  eligible_only?: boolean;
  max_batch_size?: number;
  max_monetary_exposure_minor?: number;
  scenario?: string;
}

export interface BatchItemOutcome {
  case_id: string;
  amount: number;
  status: string;
  priority_score: number;
  priority_tier: string;
  strategy: string;
  action_id?: string | null;
  verification_status?: string | null;
  policy_allowed: boolean;
  blocked_rules: string[];
  error?: string | null;
}

export interface BatchExecutionResponse {
  batch_id: string;
  status: RecoveryBatchStatus;
  batch_size: number;
  cases_selected: number;
  cases_eligible: number;
  cases_blocked: number;
  cases_attempted: number;
  cases_recovered: number;
  cases_failed: number;
  cases_pending: number;
  total_revenue_at_risk_minor: number;
  eligible_revenue_minor: number;
  blocked_revenue_minor: number;
  attempted_recovery_minor: number;
  recovered_revenue_minor: number;
  failed_recovery_minor: number;
  pending_recovery_minor: number;
  recovery_rate: number;
  policy_block_rate: number;
  ai_fallback_count: number;
  communication_count: number;
  items: BatchItemOutcome[];
  ai_analysis?: AIBatchAnalysis | null;
  created_at: string;
  completed_at?: string | null;
}

// ============================================================
// STEP 21 RECOVERY EFFECTIVENESS & EVIDENCE TYPES
// ============================================================

export interface RecoveryFunnelStage {
  stage_name: string;
  case_count: number;
  amount_minor: number;
  percentage_of_total_revenue: number;
  description: string;
}

export interface InterventionPerformance {
  intervention: string;
  sample_size: number;
  attempts: number;
  successes: number;
  failures: number;
  pending: number;
  revenue_attempted_minor: number;
  revenue_recovered_minor: number;
  recovery_rate: number;
  recovery_rate_label: string;
}

export interface RecoveryFunnelResponse {
  total_cases: number;
  revenue_at_risk_minor: number;
  eligible_cases: number;
  eligible_revenue_minor: number;
  policy_blocked_cases: number;
  policy_blocked_revenue_minor: number;
  attempted_cases: number;
  attempted_revenue_minor: number;
  recovered_cases: number;
  recovered_revenue_minor: number;
  failed_cases: number;
  failed_revenue_minor: number;
  pending_cases: number;
  pending_revenue_minor: number;
  remaining_revenue_at_risk_minor: number;
  case_recovery_rate: number;
  case_recovery_rate_denominator: string;
  revenue_recovery_rate: number;
  revenue_recovery_rate_denominator: string;
  stages: RecoveryFunnelStage[];
  interventions: InterventionPerformance[];
}

export interface CaseEvidenceTrace {
  case_id: string;
  amount_minor: number;
  failure_type: string;
  status: string;
  action_id?: string | null;
  strategy?: string | null;
  provider?: string | null;
  provider_order_id?: string | null;
  provider_payment_id?: string | null;
  provider_status?: string | null;
  verification_status?: string | null;
  transaction_id?: string | null;
  recovered_amount_minor: number;
  policy_version?: string | null;
  policy_allowed: boolean;
  audit_events: AuditEvent[];
  created_at: string;
  resolved_at?: string | null;
}

export interface BatchEvidenceTrace {
  batch_id: string;
  status: string;
  created_at: string;
  completed_at?: string | null;
  cases_selected: number;
  cases_eligible: number;
  cases_blocked: number;
  cases_attempted: number;
  cases_recovered: number;
  cases_failed: number;
  cases_pending: number;
  total_revenue_at_risk_minor: number;
  recovered_revenue_minor: number;
  remaining_revenue_at_risk_minor: number;
  items: BatchItemOutcome[];
  audit_events: AuditEvent[];
  reconciliation_status: "RECONCILED" | "DISCREPANCY";
}

export interface EvaluationStrategyResult {
  strategy_name: string;
  sample_size: number;
  cases_attempted: number;
  cases_recovered: number;
  cases_blocked: number;
  cases_failed: number;
  recovered_revenue_minor: number;
  attempted_revenue_minor: number;
  recovery_rate: number;
  revenue_recovery_rate: number;
  policy_violations: number;
  manual_review_count: number;
  ai_fallback_count: number;
  average_confidence: number;
}

export interface ControlledEvaluationResponse {
  dataset_name: string;
  sample_size: number;
  dataset_total_revenue_minor: number;
  deterministic_baseline: EvaluationStrategyResult;
  nemotron_assisted: EvaluationStrategyResult;
  absolute_revenue_lift_minor: number;
  relative_revenue_lift_pct: number;
  absolute_case_lift: number;
  policy_violations: number;
  evaluation_mode: string;
  limitations: string[];
  generated_at: string;
}
