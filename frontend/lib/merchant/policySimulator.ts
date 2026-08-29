import { Case, PolicyResult } from "../types";
import { MerchantPolicy, PolicySimulationImpact } from "./types";
import { evaluatePolicy } from "../policy/policyEngine";
import { formatCurrency } from "../utils";

export function simulatePolicyImpact(cases: Case[], policy: MerchantPolicy): PolicySimulationImpact {
  let eligibleCount = 0;
  let expectedRecoverablePaise = 0;
  let blockedCount = 0;
  const conflicts: string[] = [];
  const warnings: string[] = [];

  // Conflict Detection
  if (policy.recoverySettings.automaticRecoveryEnabled && policy.retryRules.maxRetries === 0) {
    conflicts.push("Automatic recovery is enabled, but Maximum Retries is set to 0. No payment retries will execute.");
  }
  if (policy.recoverySettings.customerRemindersEnabled && policy.communicationRules.maxContacts24h === 0) {
    conflicts.push("Customer reminders are enabled, but Maximum Contacts in 24h is set to 0. No messages will be sent.");
  }

  // Dangerous / Aggressive Configuration Warnings
  if (policy.retryRules.maxRetries > 4) {
    warnings.push(`High retry setting (${policy.retryRules.maxRetries} attempts). May trigger bank fraud penalties.`);
  }
  if (policy.communicationRules.maxContacts24h > 3) {
    warnings.push(`High contact ceiling (${policy.communicationRules.maxContacts24h} msgs/24h). High risk of customer fatigue.`);
  }
  if (policy.retryRules.minRecoveryProbability < 0.15) {
    warnings.push(`Low recovery probability floor (${Math.round(policy.retryRules.minRecoveryProbability * 100)}%). May execute low-yield interventions.`);
  }

  // Evaluate each case against proposed policy
  cases.forEach((c) => {
    if (c.status === "recovered" || c.status === "stopped") return;

    const res = evaluatePolicy(c, policy);
    if (res.allowed) {
      eligibleCount += 1;
      expectedRecoverablePaise += Math.round(c.amount * (c.prob || 0.60));
    } else {
      blockedCount += 1;
    }
  });

  return {
    eligibleCasesCount: eligibleCount,
    expectedRecoverablePaise,
    blockedCasesCount: blockedCount,
    conflicts,
    warnings,
  };
}

export function testPolicyOnCase(caseItem: Case, policy: MerchantPolicy) {
  const result: PolicyResult = evaluatePolicy(caseItem, policy);
  return {
    caseId: caseItem.id,
    amountStr: formatCurrency(caseItem.amount),
    failure: caseItem.failureType || caseItem.failure,
    prob: `${Math.round(caseItem.prob * 100)}%`,
    retryCount: caseItem.retryCount,
    isApproved: result.allowed,
    summary: result.summary,
    blockedRules: result.blockedRules,
    checks: result.checks,
    nextAction: result.recommendedNextAction,
  };
}
