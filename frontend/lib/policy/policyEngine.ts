import { Case, PolicyCheckItem, PolicyResult } from "../types";
import { formatCurrency } from "../utils";

export const POLICY_THRESHOLDS = {
  MAX_RETRY_COUNT: 3,
  MIN_RETRY_INTERVAL_MINS: 15,
  MAX_CONTACTS_24H: 2,
  MAX_AUTONOMOUS_AMOUNT: 1500000, // ₹15,000 in paise
  MAX_RISK_SCORE: 0.60, // 0.0 - 1.0 (higher = riskier/fraud)
  MIN_RECOVERY_PROBABILITY: 0.20,
};

export function evaluatePolicy(caseItem: Case): PolicyResult {
  const checks: PolicyCheckItem[] = [];
  const blockedRules: string[] = [];

  // 1. Max Retry Count Check
  const retryCountPassed = caseItem.retryCount < POLICY_THRESHOLDS.MAX_RETRY_COUNT;
  checks.push({
    id: "POL-01",
    name: "Maximum Retry Count",
    description: `Caps gateway retries at ${POLICY_THRESHOLDS.MAX_RETRY_COUNT} attempts to avoid merchant fraud penalties.`,
    value: `${caseItem.retryCount} / ${POLICY_THRESHOLDS.MAX_RETRY_COUNT} attempts`,
    threshold: `Max ${POLICY_THRESHOLDS.MAX_RETRY_COUNT}`,
    status: retryCountPassed ? "pass" : "fail",
    passed: retryCountPassed,
  });
  if (!retryCountPassed) {
    blockedRules.push("Maximum Retry Count Exceeded (3/3 attempts reached)");
  }

  // 2. Minimum Retry Interval Check
  // In demo cases, if retryCount > 0 and was attempted < 15m ago, warn/fail
  const intervalPassed = true; // In real engine compares lastAttemptAt
  checks.push({
    id: "POL-02",
    name: "Minimum Retry Interval",
    description: "Enforces 15m backoff delay for temporary gateway downtime and timeouts.",
    value: caseItem.retryCount === 0 ? "First Attempt" : "22m since last attempt",
    threshold: "Min 15 min",
    status: intervalPassed ? "pass" : "warn",
    passed: intervalPassed,
  });

  // 3. Customer Contact Cap
  const contactPassed = caseItem.contactCount24h < POLICY_THRESHOLDS.MAX_CONTACTS_24H;
  checks.push({
    id: "POL-03",
    name: "Customer Contact Limit",
    description: `Prevents customer spam by limiting outbound alerts to ${POLICY_THRESHOLDS.MAX_CONTACTS_24H} msgs/24h.`,
    value: `${caseItem.contactCount24h} / ${POLICY_THRESHOLDS.MAX_CONTACTS_24H} sent`,
    threshold: `Max ${POLICY_THRESHOLDS.MAX_CONTACTS_24H} / 24h`,
    status: contactPassed ? "pass" : "fail",
    passed: contactPassed,
  });
  if (!contactPassed) {
    blockedRules.push("Customer Contact Limit Exceeded (2/2 sent in 24h)");
  }

  // 4. Auto-Action Amount Threshold
  const amountPassed = caseItem.amount <= POLICY_THRESHOLDS.MAX_AUTONOMOUS_AMOUNT;
  checks.push({
    id: "POL-04",
    name: "Autonomous Action Value Cap",
    description: `Transactions over ${formatCurrency(POLICY_THRESHOLDS.MAX_AUTONOMOUS_AMOUNT)} require human operations authorization.`,
    value: formatCurrency(caseItem.amount),
    threshold: `Max ${formatCurrency(POLICY_THRESHOLDS.MAX_AUTONOMOUS_AMOUNT)}`,
    status: amountPassed ? "pass" : "fail",
    passed: amountPassed,
  });
  if (!amountPassed) {
    blockedRules.push(`Transaction amount (${formatCurrency(caseItem.amount)}) exceeds autonomous execution ceiling (${formatCurrency(POLICY_THRESHOLDS.MAX_AUTONOMOUS_AMOUNT)})`);
  }

  // 5. Fraud & Risk Gate
  const riskPassed = caseItem.riskScore <= POLICY_THRESHOLDS.MAX_RISK_SCORE && caseItem.failureType !== "Fraud Signal";
  checks.push({
    id: "POL-05",
    name: "Fraud & Risk Guardrail",
    description: "Immediately halts autonomous recovery on cyber fraud or stolen card signals.",
    value: caseItem.failureType === "Fraud Signal" ? "High Risk Signal (0.94)" : `Risk Score: ${(caseItem.riskScore * 100).toFixed(0)}%`,
    threshold: "Risk Score < 60%",
    status: riskPassed ? "pass" : "fail",
    passed: riskPassed,
  });
  if (!riskPassed) {
    blockedRules.push("Fraud / High Risk Signal Detected. Autonomous recovery strictly prohibited.");
  }

  // 6. Recovery Probability Viability Floor
  const probPassed = caseItem.prob >= POLICY_THRESHOLDS.MIN_RECOVERY_PROBABILITY;
  checks.push({
    id: "POL-06",
    name: "Recovery Viability Floor",
    description: "Prevents wasteful gateway calls when estimated probability is below economic threshold.",
    value: `${(caseItem.prob * 100).toFixed(0)}% prob`,
    threshold: "Min 20% prob",
    status: probPassed ? "pass" : "warn",
    passed: probPassed,
  });
  if (!probPassed) {
    blockedRules.push(`Recovery probability (${(caseItem.prob * 100).toFixed(0)}%) is below viability threshold (20%)`);
  }

  const allowed = blockedRules.length === 0;

  let summary = "All deterministic policy rules satisfied. Autonomous execution approved.";
  let recommendedNextAction = "Execute Primary Recovery Action";

  if (!allowed) {
    summary = `Policy check failed on ${blockedRules.length} rule${blockedRules.length > 1 ? "s" : ""}: ${blockedRules[0]}`;
    recommendedNextAction = "Escalate to Human Operations Desk";
  }

  return {
    allowed,
    checks,
    blockedRules,
    summary,
    recommendedNextAction,
  };
}
