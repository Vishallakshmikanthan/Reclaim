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
  
  // Rich intelligence metadata
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
}

export interface AlternativeAction {
  name: string;
  channel: string;
  estimatedExpectedRecovery: number; // in paise
  estimatedProbability: number; // 0.0 to 1.0
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
  
  // 1. Root Cause & Context
  likelyRootCause: string;
  confidence: DecisionConfidence;
  whyThisMatters: string;
  
  // 2. Probability & Signals
  recoveryProbability: number;
  contributingSignals: {
    positive: string[];
    negative: string[];
  };
  
  // 3. Expected Value (Dynamically computed: amount * recoveryProbability)
  expectedRecovery: number; // in paise
  
  // 4. Recommendation & Strategy
  recommendedIntervention: RecommendedInterventionType;
  whyThisAction: string;
  
  // 5. Alternatives
  alternatives: AlternativeAction[];
  
  // 6. Decision Timeline
  decisionTimeline: DecisionTimelineEvent[];

  // 7. Summary
  policyStatus: "Approved" | "Blocked";
  nextAction: string;

  // Legacy/Compatibility fields
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
  | "POLICY_CHECKED" 
  | "POLICY_APPROVED" 
  | "POLICY_BLOCKED" 
  | "ACTION_CREATED"
  | "ACTION_EXECUTED" 
  | "VERIFICATION_STARTED"
  | "ACTION_SUCCEEDED" 
  | "ACTION_FAILED" 
  | "VERIFICATION_TIMEOUT" 
  | "CASE_RESOLVED" 
  | "CASE_ESCALATED" 
  | "CASE_STOPPED";

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
