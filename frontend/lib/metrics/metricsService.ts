import { Case } from "../types";

export interface OperationalMetrics {
  revenueAtRisk: number; // in paise
  revenueRecovered: number; // in paise
  recoveryRate: number; // percentage e.g. 78
  casesResolvedRatio: number; // percentage e.g. 64
  activeAtRiskCount: number;
  inProgressCount: number;
  recoveredCount: number;
  escalatedCount: number;
  stoppedCount: number;
  totalCases: number;
}

/**
 * Deterministically computes operational metrics strictly from the underlying case dataset.
 * Prevents optimistic leaking or disconnected manual increments.
 */
export function calculateOperationalMetrics(cases: Case[]): OperationalMetrics {
  let atRiskTotal = 0;
  let recoveredTotal = 0;

  let atRiskCount = 0;
  let inProgressCount = 0;
  let recoveredCount = 0;
  let escalatedCount = 0;
  let stoppedCount = 0;

  cases.forEach((c) => {
    // 1. REVENUE AT RISK: Sum of eligible unresolved cases
    if (c.status === "atRisk" || c.status === "inProgress" || c.status === "pending") {
      atRiskTotal += c.amount;
    }

    // 2. REVENUE RECOVERED: Sum of verified recovered amounts
    if (c.status === "recovered") {
      const recoveredAmt = c.resolutionDetails?.recoveredAmount ?? c.amount;
      recoveredTotal += recoveredAmt;
      recoveredCount++;
    } else if (c.status === "atRisk") {
      atRiskCount++;
    } else if (c.status === "inProgress") {
      inProgressCount++;
    } else if (c.status === "escalated") {
      escalatedCount++;
    } else if (c.status === "stopped" || c.status === "failed") {
      stoppedCount++;
    }
  });

  // 3. RECOVERY RATE: Ratio of successful recoveries over closed/terminal cases
  const terminalCases = recoveredCount + escalatedCount + stoppedCount;
  const recoveryRate = terminalCases > 0 
    ? Math.round((recoveredCount / terminalCases) * 100) 
    : 0;

  // 4. RESOLVED RATIO: Proportion of total cases resolved
  const casesResolvedRatio = cases.length > 0 
    ? Math.round((recoveredCount / cases.length) * 100) 
    : 0;

  return {
    revenueAtRisk: atRiskTotal,
    revenueRecovered: recoveredTotal,
    recoveryRate,
    casesResolvedRatio,
    activeAtRiskCount: atRiskCount,
    inProgressCount,
    recoveredCount,
    escalatedCount,
    stoppedCount,
    totalCases: cases.length,
  };
}

/**
 * Calculates money impact & variance between Expected and Actual recovery.
 */
export function calculateMoneyImpact(caseItem: Case) {
  const amount = caseItem.amount;
  const prob = caseItem.prob;
  const expectedRecovery = Math.round(amount * prob);
  const isRecovered = caseItem.status === "recovered";
  const actualRecovery = isRecovered 
    ? (caseItem.resolutionDetails?.recoveredAmount ?? amount) 
    : 0;
  
  const variance = actualRecovery - expectedRecovery;
  const outcomeLabel = !isRecovered 
    ? "Pending" 
    : variance >= 0 
    ? "Above expectation" 
    : "Below expectation";

  return {
    amount,
    probability: prob,
    expectedRecovery,
    actualRecovery,
    variance,
    outcomeLabel,
    isRecovered,
  };
}
