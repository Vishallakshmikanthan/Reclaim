import { 
  Case, 
  RecoveryStrategy, 
  StrategyStep, 
  InterventionType, 
  StrategyUrgency, 
  StrategyStatus, 
  StoppingRuleType 
} from "../types";
import { formatCurrency } from "../utils";

/**
 * Intelligent Recovery Strategy Orchestrator
 * Diagnoses failure root cause, maps multi-step fallback chains, evaluates bounded budgets,
 * sets explicit stopping rules, and computes deterministic urgency.
 */
export function buildRecoveryStrategy(caseItem: Case): RecoveryStrategy {
  const isRecovered = caseItem.status === "recovered";
  const isEscalated = caseItem.status === "escalated";
  const isStopped = caseItem.status === "stopped";
  const isExecuting = caseItem.status === "executing";

  // 1. Determine Urgency
  const amountRupees = Math.round(caseItem.amount / 100);
  const isFresh = caseItem.age.includes("m ago") || caseItem.age.includes("Just");
  
  let urgency: StrategyUrgency = "MEDIUM";
  let urgencyReason = "Standard recovery window active.";

  if (caseItem.prob < 0.15 || (caseItem.riskScore || 0) >= 0.70) {
    urgency = "LOW";
    urgencyReason = "Low recovery expectation or risk radar flag. Restraint engaged.";
  } else if (isFresh && amountRupees >= 15000) {
    urgency = "CRITICAL";
    urgencyReason = "High-value failure within prime 15-minute recovery window.";
  } else if (isFresh || (caseItem.expected && caseItem.expected >= 500000)) {
    urgency = "HIGH";
    urgencyReason = "Fresh timeout window approaching issuer session expiry (< 30m).";
  } else if (caseItem.age.includes("h ago") || caseItem.age.includes("d ago")) {
    urgency = "LOW";
    urgencyReason = "Extended failure age. Multi-channel async fallback recommended.";
  }

  // 2. Build Failure-Specific Multi-Step Fallback Chain
  const steps: StrategyStep[] = [];
  const fType = caseItem.failureType || caseItem.failure;

  if (caseItem.prob < 0.15 || (caseItem.riskScore || 0) >= 0.80 || fType === "Fraud Signal") {
    // SCENARIO: LOW PROBABILITY / FRAUD RESTRICTION (INTENTIONAL RESTRAINT)
    steps.push({
      stepIndex: 1,
      type: "PRIMARY",
      intervention: "NO_ACTION",
      label: "Intentional Restraint (No Automatic Action)",
      channel: "no_action",
      status: isStopped ? "SUCCEEDED" : "READY",
      expectedRecovery: 0,
      recoveryProbability: caseItem.prob,
      policyCheckRequired: true,
      policySummary: "Auto-execution blocked by Fraud/Low-Probability guardrail.",
      rationale: "Recovery expectation is below minimum viable threshold (15%) or proxy radar flagged suspicious activity. Automated retries prohibited to protect merchant reputation.",
    });

    steps.push({
      stepIndex: 2,
      type: "ESCALATION",
      intervention: "HUMAN_ESCALATION",
      label: "Route to Manual Risk Desk",
      channel: "human_escalation",
      status: isEscalated ? "SUCCEEDED" : "READY",
      expectedRecovery: 0,
      recoveryProbability: 0.10,
      policyCheckRequired: false,
      rationale: "Flagged entity transferred to human compliance queue for manual KYC/BIN review.",
    });
  } else if (fType === "UPI Timeout") {
    // SCENARIO: UPI TIMEOUT (PRIMARY RETRY -> FALLBACK WHATSAPP LINK -> ESCALATION)
    steps.push({
      stepIndex: 1,
      type: "PRIMARY",
      intervention: "RETRY_PAYMENT",
      label: "Razorpay Instant Retry (NPCI Auto-Requery)",
      channel: "gateway_retry",
      status: isRecovered ? "SUCCEEDED" : caseItem.retryCount > 0 ? "FAILED" : "READY",
      expectedRecovery: Math.round(caseItem.amount * 0.81),
      recoveryProbability: 0.81,
      policyCheckRequired: true,
      policySummary: "Retry interval and 3-attempt ceiling verified.",
      rationale: "Temporary VPA network timeout with high historical payment success (88%). Instant gateway retry has an 81% probability of success.",
    });

    steps.push({
      stepIndex: 2,
      type: "FALLBACK",
      intervention: "SEND_PAYMENT_LINK",
      label: "WhatsApp 1-Click Dynamic Payment Link",
      channel: "whatsapp_link",
      status: caseItem.retryCount >= 1 && !isRecovered ? "READY" : "PENDING",
      expectedRecovery: Math.round(caseItem.amount * 0.58),
      recoveryProbability: 0.58,
      policyCheckRequired: true,
      policySummary: "Contact frequency limit (max 2/24h) re-evaluated before dispatch.",
      rationale: "If instant gateway retry fails, bypass NPCI timeout by delivering an instant checkout link directly to customer WhatsApp.",
    });

    steps.push({
      stepIndex: 3,
      type: "FALLBACK",
      intervention: "SEND_CUSTOMER_REMINDER",
      label: "Hinglish SMS Reminder with Pay Link",
      channel: "sms_link",
      status: caseItem.retryCount >= 2 && !isRecovered ? "READY" : "PENDING",
      expectedRecovery: Math.round(caseItem.amount * 0.35),
      recoveryProbability: 0.35,
      policyCheckRequired: true,
      rationale: "Secondary asynchronous SMS nudge with localized Hinglish copy to capture delayed conversion.",
    });

    steps.push({
      stepIndex: 4,
      type: "ESCALATION",
      intervention: "HUMAN_ESCALATION",
      label: "Escalate to Customer Success Team",
      channel: "human_escalation",
      status: isEscalated ? "SUCCEEDED" : "PENDING",
      expectedRecovery: 0,
      recoveryProbability: 0.20,
      policyCheckRequired: false,
      rationale: "Automated retry budget exhausted. Hand off to high-touch VIP operations.",
    });
  } else if (fType === "Card Decline" || fType === "Insufficient Funds") {
    // SCENARIO: CARD DECLINE / INSUFFICIENT FUNDS (PRIMARY WHATSAPP LINK -> FALLBACK SMS -> ESCALATION)
    steps.push({
      stepIndex: 1,
      type: "PRIMARY",
      intervention: "SEND_PAYMENT_LINK",
      label: "WhatsApp 1-Click Alternate Card / UPI Link",
      channel: "whatsapp_link",
      status: isRecovered ? "SUCCEEDED" : "READY",
      expectedRecovery: Math.round(caseItem.amount * 0.55),
      recoveryProbability: 0.55,
      policyCheckRequired: true,
      policySummary: "Customer contact limit and amount threshold validated.",
      rationale: "Issuing bank declined previous card attempt. Rather than blindly retrying the same declined instrument, prompt user to complete via alternate Card or UPI.",
    });

    steps.push({
      stepIndex: 2,
      type: "FALLBACK",
      intervention: "SEND_CUSTOMER_REMINDER",
      label: "SMS Nudge with Direct Razorpay Checkout",
      channel: "sms_link",
      status: "PENDING",
      expectedRecovery: Math.round(caseItem.amount * 0.38),
      recoveryProbability: 0.38,
      policyCheckRequired: true,
      rationale: "If WhatsApp message is unread after 15 minutes, send transactional SMS reminder.",
    });

    steps.push({
      stepIndex: 3,
      type: "ESCALATION",
      intervention: "HUMAN_ESCALATION",
      label: "Operations Desk Manual Call Queue",
      channel: "human_escalation",
      status: isEscalated ? "SUCCEEDED" : "PENDING",
      expectedRecovery: 0,
      recoveryProbability: 0.25,
      policyCheckRequired: false,
      rationale: "Autonomous fallback path complete. Route to phone support for manual resolution.",
    });
  } else if (fType === "Subscription Failure") {
    // SCENARIO: SUBSCRIPTION / MANDATE RECURRING FAILURE
    steps.push({
      stepIndex: 1,
      type: "PRIMARY",
      intervention: "RETRY_SUBSCRIPTION",
      label: "Smart Dunning Auto-Retry (E-Mandate)",
      channel: "gateway_retry",
      status: isRecovered ? "SUCCEEDED" : "READY",
      expectedRecovery: Math.round(caseItem.amount * 0.72),
      recoveryProbability: 0.72,
      policyCheckRequired: true,
      policySummary: "RBI E-Mandate cooling interval (24h) verified.",
      rationale: "Scheduled mandate execution during optimal bank settlement batch (04:00 - 07:00 IST).",
    });

    steps.push({
      stepIndex: 2,
      type: "FALLBACK",
      intervention: "SEND_CUSTOMER_REMINDER",
      label: "WhatsApp Subscription Update Link",
      channel: "whatsapp_link",
      status: "PENDING",
      expectedRecovery: Math.round(caseItem.amount * 0.48),
      recoveryProbability: 0.48,
      policyCheckRequired: true,
      rationale: "Prompt customer to update expired card or switch to UPI AutoPay.",
    });

    steps.push({
      stepIndex: 3,
      type: "ESCALATION",
      intervention: "HUMAN_ESCALATION",
      label: "Subscription Churn Retention Queue",
      channel: "human_escalation",
      status: isEscalated ? "SUCCEEDED" : "PENDING",
      expectedRecovery: 0,
      recoveryProbability: 0.20,
      policyCheckRequired: false,
      rationale: "Prevent subscriber churn by assigning to account manager.",
    });
  } else {
    // DEFAULT STANDARD STRATEGY
    steps.push({
      stepIndex: 1,
      type: "PRIMARY",
      intervention: "RETRY_PAYMENT",
      label: "Intelligent Gateway Retry",
      channel: "gateway_retry",
      status: isRecovered ? "SUCCEEDED" : "READY",
      expectedRecovery: Math.round(caseItem.amount * (caseItem.prob || 0.65)),
      recoveryProbability: caseItem.prob || 0.65,
      policyCheckRequired: true,
      rationale: "Primary automated retry evaluated against deterministic policy guardrails.",
    });

    steps.push({
      stepIndex: 2,
      type: "FALLBACK",
      intervention: "SEND_PAYMENT_LINK",
      label: "Multi-Channel Conversational Payment Link",
      channel: "whatsapp_link",
      status: "PENDING",
      expectedRecovery: Math.round(caseItem.amount * 0.45),
      recoveryProbability: 0.45,
      policyCheckRequired: true,
      rationale: "Conversational backup intervention if primary gateway retry does not succeed.",
    });

    steps.push({
      stepIndex: 3,
      type: "ESCALATION",
      intervention: "HUMAN_ESCALATION",
      label: "Human Operations Escalation",
      channel: "human_escalation",
      status: isEscalated ? "SUCCEEDED" : "PENDING",
      expectedRecovery: 0,
      recoveryProbability: 0.20,
      policyCheckRequired: false,
      rationale: "Safety backstop routing to human review.",
    });
  }

  // 3. Explicit Stopping Rules Evaluation
  const maxRetriesReached = (caseItem.retryCount || 0) >= (caseItem.maxRetries || 3);
  const contactLimitReached = (caseItem.contactCount24h || 0) >= (caseItem.maxContacts24h || 2);
  const probTooLow = caseItem.prob < 0.10;
  const expectedValueTooLow = caseItem.expected < 10000; // < ₹100
  const riskRadarEngaged = (caseItem.riskScore || 0) >= 0.70;

  const stoppingRules = [
    {
      rule: "MAX_RETRIES_REACHED" as StoppingRuleType,
      description: `Maximum retry ceiling (${caseItem.retryCount || 0}/${caseItem.maxRetries || 3} attempts)`,
      triggered: maxRetriesReached,
    },
    {
      rule: "CONTACT_LIMIT_REACHED" as StoppingRuleType,
      description: `Customer contact limit (${caseItem.contactCount24h || 0}/${caseItem.maxContacts24h || 2} in 24h)`,
      triggered: contactLimitReached,
    },
    {
      rule: "PROBABILITY_BELOW_THRESHOLD" as StoppingRuleType,
      description: `Recovery probability floor (< 10%)`,
      triggered: probTooLow,
    },
    {
      rule: "RISK_RADAR_FLAG" as StoppingRuleType,
      description: `Fraud / Security risk score threshold (> 70%)`,
      triggered: riskRadarEngaged,
    },
    {
      rule: "ALREADY_RECOVERED" as StoppingRuleType,
      description: `Case settled in immutable ledger`,
      triggered: isRecovered,
    },
  ];

  // 4. Derive Strategy Status
  let strategyStatus: StrategyStatus = "READY";
  if (isRecovered) {
    strategyStatus = "RECOVERED";
  } else if (isStopped) {
    strategyStatus = "STOPPED";
  } else if (isEscalated) {
    strategyStatus = "ESCALATED";
  } else if (isExecuting) {
    strategyStatus = "EXECUTING";
  } else if (caseItem.retryCount > 0 && steps.length > 1) {
    strategyStatus = "FALLBACK_AVAILABLE";
  }

  const primaryStep = steps.find((s) => s.type === "PRIMARY") || steps[0];
  const fallbackSteps = steps.filter((s) => s.type === "FALLBACK");
  const escalationStep = steps.find((s) => s.type === "ESCALATION") || steps[steps.length - 1];

  let priority: "Critical" | "High" | "Medium" | "Low" = "Medium";
  if (urgency === "CRITICAL" || (caseItem.expected && caseItem.expected >= 800000)) {
    priority = "Critical";
  } else if (urgency === "HIGH" || caseItem.prob >= 0.70) {
    priority = "High";
  } else if (caseItem.prob < 0.20) {
    priority = "Low";
  }

  const explanation = primaryStep.rationale;
  const fallbackExplanation = fallbackSteps.length > 0
    ? `If ${primaryStep.label} is unsuccessful, RECLAIM will re-evaluate Layer 3 policy and initiate ${fallbackSteps[0].label}.`
    : "No further automated fallback; will escalate directly to human queue.";

  return {
    caseId: caseItem.id,
    status: strategyStatus,
    priority,
    urgency,
    urgencyReason,
    currentStepIndex: 1,
    steps,
    primaryAction: primaryStep,
    fallbackActions: fallbackSteps,
    escalationAction: escalationStep,
    budget: {
      maxInterventions: caseItem.maxRetries || 3,
      currentInterventions: caseItem.retryCount || 0,
    },
    stoppingRules,
    explanation,
    fallbackExplanation,
    noActionReason: primaryStep.intervention === "NO_ACTION" ? primaryStep.rationale : undefined,
  };
}
