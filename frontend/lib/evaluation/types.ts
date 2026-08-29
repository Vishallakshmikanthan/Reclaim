import { FailureType, PaymentMethod, RecommendedInterventionType, InterventionType } from "../types";

export interface EvaluationGroundTruth {
  recoverable: boolean; // Ground truth: was recovery realistically possible?
  actualMaxRecoverableAmount: number; // in paise
  idealChannel: string; // The optimal real-world channel
  failureRootCause: string;
  isFraudOrDispute: boolean;
  customerWillPayOnLink: boolean;
  gatewayRetryWillSucceed: boolean;
  actualSettlementTimeSeconds?: number; // Ground truth latency to settlement
}

export interface EvaluationCase {
  id: string;
  paymentId: string;
  orderId: string;
  customerId: string;
  customerName: string;
  amount: number; // in paise (e.g. 849900 = ₹8,499)
  paymentMethod: PaymentMethod;
  failureType: FailureType;
  failureReason: string;
  paymentAge: string;
  previousAttempts: number;
  contactCount24h: number;
  customerRiskScore: number; // 0.0 to 1.0
  historicalRecoveryRate: number; // e.g. 78 for 78%
  groundTruth: EvaluationGroundTruth;
}

export interface BaselineCaseOutcome {
  caseId: string;
  actionTaken: string;
  attempted: boolean;
  recovered: boolean;
  recoveredAmount: number; // in paise
  policyBreach: boolean;
  policyBreachReason?: string;
  executionCostEstimated: number; // in paise
  timeToRecoverySeconds?: number;
}

export interface ReclaimCaseOutcome {
  caseId: string;
  strategyStep: "PRIMARY" | "FALLBACK" | "ESCALATED" | "STOPPED";
  recommendedIntervention: RecommendedInterventionType | string;
  actionTaken: string;
  attempted: boolean;
  recovered: boolean;
  recoveredAmount: number; // in paise
  policyChecked: boolean;
  policyAllowed: boolean;
  blockedReason?: string;
  isFalseIntervention: boolean; // Intervened on an unrecoverable/fraud case
  isMissedOpportunity: boolean; // Failed to recover a recoverable case
  isSafeRestraint: boolean; // Deliberately stopped an unrecoverable/fraud case
  escalated: boolean;
  stopped: boolean;
  timeToRecoverySeconds?: number;
  auditEventsGenerated: number;
  auditEventsRecorded: number;
}

export interface ConfusionMatrix {
  truePositive: number;  // Predicted Recoverable & Actually Recovered
  falsePositive: number; // Predicted Recoverable but Actually Unrecoverable (False Intervention)
  trueNegative: number;  // Predicted Unrecoverable & Safely Restrained/Stopped
  falseNegative: number; // Predicted Unrecoverable or Failed but Actually Recoverable (Missed Opportunity)
  precision: number;     // TP / (TP + FP)
  recall: number;        // TP / (TP + FN)
  f1Score: number;       // 2 * (Precision * Recall) / (Precision + Recall)
}

export interface InterventionPerformance {
  intervention: string;
  attempts: number;
  successes: number;
  failures: number;
  recoveredAmount: number; // in paise
  observedRecoveryRate: number; // percentage (0 - 100)
}

export interface FailureTypePerformance {
  failureType: FailureType;
  totalCases: number;
  revenueAtRisk: number; // in paise
  reclaimRecovered: number; // in paise
  baselineRecovered: number; // in paise
  reclaimRecoveryRate: number; // %
  baselineRecoveryRate: number; // %
  falseInterventions: number;
  missedRevenue: number; // in paise
}

export interface AmountBucketPerformance {
  bucketLabel: string;
  minAmount: number; // in paise
  maxAmount: number; // in paise
  totalCases: number;
  revenueAtRisk: number; // in paise
  recoveredAmount: number; // in paise
  recoveryRate: number; // %
  recoveryValueRate: number; // %
  falseInterventionRate: number; // %
}

export interface BatchMetrics {
  totalCases: number;
  totalRevenueAtRisk: number; // in paise
  totalRecoverableRevenue: number; // in paise (ground truth sum)

  // Baseline Metrics
  baselineRecoveredRevenue: number; // in paise
  baselineRecoveredCases: number;
  baselineRecoveryRate: number; // percentage (0 - 100)
  baselineRecoveryValueRate: number; // percentage (0 - 100)
  baselineInterventions: number;
  baselinePolicyBreaches: number;

  // RECLAIM Metrics
  reclaimRecoveredRevenue: number; // in paise
  reclaimRecoveredCases: number;
  reclaimRecoveryRate: number; // percentage (0 - 100)
  reclaimRecoveryValueRate: number; // percentage (0 - 100)
  reclaimInterventions: number;
  reclaimInterventionRate: number; // percentage (0 - 100)
  reclaimEscalations: number;
  reclaimEscalationRate: number; // percentage (0 - 100)
  reclaimStoppedCases: number;
  reclaimStopRate: number; // percentage (0 - 100)
  reclaimPolicyBlocks: number;
  reclaimFailedActions: number;

  // Comparison & Uplift
  netRevenueUplift: number; // in paise (RECLAIM - Baseline)
  percentageUplift: number; // %
  unrecoveredRevenue: number; // in paise (Revenue At Risk - RECLAIM Recovered)

  // Quality & Errors
  falseInterventions: number;
  falseInterventionRate: number; // % of total interventions that were unnecessary
  missedOpportunities: number;
  missedRecoverableRevenue: number; // in paise
  safeRestraints: number; // Intentionally avoided unrecoverable/risky transactions

  // Compliance & Governance
  policyComplianceRate: number; // %
  totalExpectedAuditEvents: number;
  totalRecordedAuditEvents: number;
  auditCoverageRate: number; // %

  // Latency / Recovery Time
  avgTimeToRecoverySeconds: number;
  medianTimeToRecoverySeconds: number;

  // Deep Breakdowns
  confusionMatrix: ConfusionMatrix;
  interventionBreakdown: InterventionPerformance[];
  failureBreakdown: FailureTypePerformance[];
  amountBucketBreakdown: AmountBucketPerformance[];
}

export interface EvaluationRunReport {
  runId: string;
  timestamp: string;
  datasetVersion: string;
  datasetSize: number;
  engineVersion: string;
  policyVersion: string;
  deterministicSeed: string;
  metrics: BatchMetrics;
  caseOutcomes: {
    evaluationCase: EvaluationCase;
    baselineOutcome: BaselineCaseOutcome;
    reclaimOutcome: ReclaimCaseOutcome;
  }[];
}
