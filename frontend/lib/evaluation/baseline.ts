import { EvaluationCase, BaselineCaseOutcome } from "./types";

/**
 * Deterministic Baseline Strategy Engine
 * Strategy: NAIVE RETRY
 * Rule: "If payment fails, immediately execute one automated gateway retry whenever technically possible."
 * Ignores: Risk signals, customer fatigue limits, multi-channel links, and root-cause nuances.
 */
export function runBaselineEvaluation(dataset: EvaluationCase[]): BaselineCaseOutcome[] {
  return dataset.map((item) => {
    const fType = item.failureType;
    
    // In naive retry, we blindly attempt a gateway retry if previous attempts < 3
    const canAttemptRetry = item.previousAttempts < 3 && fType !== "Overdue Invoice" && fType !== "Checkout Abandonment";

    if (!canAttemptRetry) {
      return {
        caseId: item.id,
        actionTaken: "NO_ACTION",
        attempted: false,
        recovered: false,
        recoveredAmount: 0,
        policyBreach: false,
        executionCostEstimated: 0,
      };
    }

    // Did the naive retry violate policy (e.g., retrying high fraud or exceeding attempts)?
    const isPolicyBreach = item.groundTruth.isFraudOrDispute || item.previousAttempts >= 2;
    const policyBreachReason = item.groundTruth.isFraudOrDispute 
      ? "Naive retry triggered on high-risk fraud entity (Missing Risk Radar)" 
      : item.previousAttempts >= 2 
      ? "Exceeded attempt ceiling without cooling period" 
      : undefined;

    // Naive retry ONLY succeeds if gateway retry itself is viable (e.g. UPI timeout)
    // It completely fails on Card Decline, Insufficient Funds, Checkout Abandonment, etc.
    const isRecovered = !item.groundTruth.isFraudOrDispute && item.groundTruth.gatewayRetryWillSucceed;

    return {
      caseId: item.id,
      actionTaken: "NAIVE_GATEWAY_RETRY",
      attempted: true,
      recovered: isRecovered,
      recoveredAmount: isRecovered ? item.amount : 0,
      policyBreach: isPolicyBreach,
      policyBreachReason,
      executionCostEstimated: 50, // 50 paise API / processing cost
      timeToRecoverySeconds: isRecovered ? (item.groundTruth.actualSettlementTimeSeconds || 45) : undefined,
    };
  });
}
