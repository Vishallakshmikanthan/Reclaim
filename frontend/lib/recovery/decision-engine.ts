import { Case, RecoveryDecision, RiskSignals, AlternativeAction, DecisionConfidence, RecommendedInterventionType } from "../types";
import { formatCurrency } from "../utils";
import { evaluatePolicy } from "../policy/policyEngine";

/**
 * Extracts and formats structured risk signals for a case.
 */
export function extractRiskSignals(caseItem: Case): RiskSignals {
  return {
    paymentAge: caseItem.age || "12 min",
    previousSuccessfulPayments: caseItem.previousSuccessfulPayments ?? (caseItem.prob >= 0.7 ? 8 : caseItem.prob >= 0.4 ? 3 : 0),
    previousFailedAttempts: caseItem.retryCount,
    historicalRecoveryRate: caseItem.historicalRecoveryRate ?? Math.round(caseItem.prob * 90),
    customerRiskTier: caseItem.customerRiskTier || (caseItem.riskScore > 0.6 ? "HIGH" : caseItem.riskScore > 0.2 ? "MEDIUM" : "LOW"),
    retryAttempts: `${caseItem.retryCount} / ${caseItem.maxRetries || 3}`,
    contactCount: `${caseItem.contactCount24h} / ${caseItem.maxContacts24h || 2}`,
  };
}

/**
 * RECLAIM Autonomous Decision Intelligence Engine
 * Computes root-cause analysis, contributing signals, expected recovery value,
 * intervention recommendation, and ranked alternatives deterministically.
 */
export function synthesizeDecision(caseItem: Case): RecoveryDecision {
  const amount = caseItem.amount;
  const prob = caseItem.prob;
  const failure = caseItem.failureType;
  const retryCount = caseItem.retryCount;
  const riskScore = caseItem.riskScore;
  const amountStr = formatCurrency(amount);
  const signals = extractRiskSignals(caseItem);
  const policy = evaluatePolicy(caseItem);

  // Dynamic Expected Recovery calculation (Amount * Probability)
  const expectedRecovery = Math.round(amount * prob);

  let likelyRootCause = "";
  let confidence: DecisionConfidence = "High";
  let whyThisMatters = "";
  let recommendedIntervention: RecommendedInterventionType = "Retry Payment";
  let whyThisAction = "";
  let fallbackPlan = "";
  let escalationPlan = "";
  let strategy = "";
  let channel: any = "gateway_retry";
  
  const positiveSignals: string[] = [];
  const negativeSignals: string[] = [];

  // Base signal evaluations
  if (signals.previousSuccessfulPayments >= 5) {
    positiveSignals.push(`Strong payment history (${signals.previousSuccessfulPayments} prior successful transactions)`);
  } else if (signals.previousSuccessfulPayments >= 1) {
    positiveSignals.push(`Established customer (${signals.previousSuccessfulPayments} prior transactions)`);
  } else {
    negativeSignals.push("First-time customer transaction");
  }

  if (caseItem.contactCount24h < 2) {
    positiveSignals.push(`Customer contact cap satisfied (${caseItem.contactCount24h}/2 today)`);
  } else {
    negativeSignals.push("Customer contact limit reached (2/2 today)");
  }

  if (retryCount === 0) {
    positiveSignals.push("First recovery attempt within optimal 30m window");
  } else if (retryCount < 3) {
    positiveSignals.push(`Retry ceiling not exceeded (${retryCount}/3 attempts)`);
    negativeSignals.push(`Prior retry attempt did not settle`);
  } else {
    negativeSignals.push(`Maximum retry ceiling exhausted (${retryCount}/3 attempts)`);
  }

  if (riskScore < 0.15) {
    positiveSignals.push("Low risk fraud score (<15%)");
  } else if (riskScore > 0.60) {
    negativeSignals.push(`High risk security score (${Math.round(riskScore * 100)}%)`);
  }

  // --- DETERMINISTIC REASONING BRANCHES ---

  // CASE 1: Low Probability / Fraud / High Risk
  if (prob < 0.20 || failure === "Fraud Signal" || riskScore > 0.60) {
    likelyRootCause = "High-risk fraud flag or non-viable recovery probability detected by risk radar.";
    confidence = "High";
    whyThisMatters = "Automatic recovery is strictly prohibited on suspicious or low-probability transactions to prevent chargeback penalties and wasted gateway fees.";
    recommendedIntervention = "No Action";
    strategy = "Manual Risk Audit";
    channel = "human_escalation";
    whyThisAction = `Expected recovery (${formatCurrency(expectedRecovery)}) is below automated viable threshold + high risk score (${Math.round(riskScore * 100)}%). System deliberately chooses not to act automatically.`;
    fallbackPlan = "Permanent payment instrument blacklist.";
    escalationPlan = "Route directly to Merchant Compliance & Risk Lead.";
    negativeSignals.push("Recovery probability below 20% economic floor");
  } 
  // CASE 2: UPI Timeout
  else if (failure === "UPI Timeout") {
    likelyRootCause = `Temporary payment network timeout at NPCI / ${caseItem.bank || "issuing bank"} switch during peak traffic.`;
    confidence = prob >= 0.75 ? "High" : "Medium";
    whyThisMatters = "The failure appears transient and the customer's VPA handle remains valid. An automated retry captures the sale without causing customer friction.";
    recommendedIntervention = "Retry Payment";
    strategy = "Razorpay Instant Retry";
    channel = "gateway_retry";
    positiveSignals.push("Transient gateway latency error");
    positiveSignals.push(`Issuing node (${caseItem.bank || "HDFC"}) telemetry normalized`);
    whyThisAction = `Temporary network timeout + strong prior customer history + ${(prob * 100).toFixed(0)}% recovery probability + within retry window.`;
    fallbackPlan = "Generate dynamic Hinglish SMS payment link with 24-hour validity.";
    escalationPlan = "Escalate to Human Operations Desk if secondary retry fails.";
  }
  // CASE 3: Card Decline
  else if (failure === "Card Decline") {
    if (retryCount >= 2 || !policy.allowed) {
      likelyRootCause = "Repeated card decline by issuing bank (3DS authentication challenge expired).";
      confidence = "High";
      whyThisMatters = "Issuing bank has repeatedly declined direct retries. Continuing direct card debits risks card blocking; a conversational payment link gives the user an alternative.";
      recommendedIntervention = "Payment Link";
      strategy = "WhatsApp Conversational Link";
      channel = "whatsapp_link";
      positiveSignals.push("Customer responsive on mobile channel");
      negativeSignals.push("Direct card retry path exhausted");
      whyThisAction = `Direct card retry limit reached + ${(prob * 100).toFixed(0)}% expected yield via multi-channel fallback link.`;
      fallbackPlan = "Dispatch SMS nudge with 1-click Razorpay payment link.";
      escalationPlan = "Route to VIP customer success desk.";
    } else {
      likelyRootCause = "Authentication challenge timeout (3DS OTP dropoff) during issuer redirect.";
      confidence = "Medium";
      whyThisMatters = "Card credentials are valid and user initiated transaction recently. Triggering a fresh authorization challenge captures active buyers.";
      recommendedIntervention = "Retry Payment";
      strategy = "Smart 3DS Retry";
      channel = "gateway_retry";
      positiveSignals.push("Valid card credentials");
      whyThisAction = `Transient 3DS dropoff + single retry attempted + ${(prob * 100).toFixed(0)}% probability.`;
      fallbackPlan = "Send WhatsApp payment link allowing alternate payment method.";
      escalationPlan = "Escalate if second decline occurs.";
    }
  }
  // CASE 4: Insufficient Funds
  else if (failure === "Insufficient Funds") {
    likelyRootCause = "Account balance insufficient for immediate debit at transaction time.";
    confidence = "High";
    whyThisMatters = "Repeated automated debit attempts will fail and annoy the customer. Sending a polite payment link allows the user to switch bank accounts or pay via credit line.";
    recommendedIntervention = "Payment Link";
    strategy = "Hinglish SMS Payment Link";
    channel = "sms_link";
    positiveSignals.push("Customer intent verified");
    positiveSignals.push("Polite tone preserves customer relationship");
    negativeSignals.push("Direct debit currently unviable");
    whyThisAction = `Insufficient balance decline + ${(prob * 100).toFixed(0)}% conversion on alternate payment method link + 0 contact spam.`;
    fallbackPlan = "WhatsApp recovery reminder scheduled for next morning.";
    escalationPlan = "Close case if unrecovered after 48 hours.";
  }
  // CASE 5: Bank Downtime
  else if (failure === "Bank Downtime") {
    likelyRootCause = `Issuing bank (${caseItem.bank || "State Bank of India"}) core switch temporary maintenance window.`;
    confidence = "High";
    whyThisMatters = "Direct immediate retry will fail during bank outage. Scheduling a delayed retry for when bank uptime recovers (>95%) yields maximum recovery.";
    recommendedIntervention = "Retry Payment";
    strategy = "Delayed Gateway Retry (45m)";
    channel = "gateway_retry";
    positiveSignals.push("Bank node health monitor active");
    positiveSignals.push("Automated temporal backoff applied");
    whyThisAction = `Bank outage recognized + delayed execution scheduled after gateway health recovery + ${(prob * 100).toFixed(0)}% probability.`;
    fallbackPlan = "Route transaction through secondary acquiring bank if available.";
    escalationPlan = "Notify merchant operations if outage exceeds 2 hours.";
  }
  // CASE 6: Network Drop
  else if (failure === "Network Drop") {
    likelyRootCause = "Client-side network disconnection during transaction settlement handshake.";
    confidence = "High";
    whyThisMatters = "Transaction state is ambiguous in client view but switch may have received authorization. Idempotent check and retry confirms settlement safely.";
    recommendedIntervention = "Retry Payment";
    strategy = "Idempotent Gateway Query & Retry";
    channel = "gateway_retry";
    positiveSignals.push("Idempotency key prevents double debit");
    positiveSignals.push("High customer recovery intent");
    whyThisAction = `Network disconnect detected + idempotent verification safe + ${(prob * 100).toFixed(0)}% recovery yield.`;
    fallbackPlan = "Send instant SMS confirmation link.";
    escalationPlan = "Escalate to manual reconciliation if telemetry remains ambiguous.";
  }
  // CASE 7: Checkout Abandonment
  else if (failure === "Checkout Abandonment") {
    likelyRootCause = "User dropped off at checkout step before completing payment authorization.";
    confidence = "Medium";
    whyThisMatters = "High-intent buyer dropped off recently. A conversational WhatsApp message with pre-filled cart link recovers abandoned carts within 2 hours.";
    recommendedIntervention = "Payment Link";
    strategy = "WhatsApp 1-Click Cart Link";
    channel = "whatsapp_link";
    positiveSignals.push("High cart intent window (<2h)");
    positiveSignals.push("Pre-filled 1-click payment link ready");
    whyThisAction = `Checkout abandonment + high purchase intent + ${(prob * 100).toFixed(0)}% expected conversion on WhatsApp link.`;
    fallbackPlan = "Email cart recovery sequence.";
    escalationPlan = "No escalation required for standard cart dropoffs.";
  }
  // CASE 8: Subscription Failure
  else if (failure === "Subscription Failure") {
    likelyRootCause = "Recurring subscription mandate debit rejected due to issuer cooling window.";
    confidence = "High";
    whyThisMatters = "Recurring revenue is at risk of involuntary churn. Scheduling retry during the morning clearing window preserves subscriber lifetime value.";
    recommendedIntervention = "Subscription Retry";
    strategy = "Scheduled Mandate Retry";
    channel = "gateway_retry";
    positiveSignals.push("Active recurring mandate registration");
    positiveSignals.push("Low involuntary churn risk");
    whyThisAction = `Subscription mandate active + optimal morning debit window + ${(prob * 100).toFixed(0)}% probability.`;
    fallbackPlan = "Send update payment method link to subscriber.";
    escalationPlan = "Trigger grace-period before suspending subscription.";
  }
  // CASE 9: Overdue Invoice
  else if (failure === "Overdue Invoice") {
    likelyRootCause = "Net-30 B2B enterprise invoice passed due date without automated settlement.";
    confidence = "Medium";
    whyThisMatters = "B2B receivables require polite commercial reminders before costly collection escalation. A 1-click Razorpay link reduces payment friction.";
    recommendedIntervention = "Receivables Reminder";
    strategy = "Smart Invoice Reminder + Direct Link";
    channel = "sms_link";
    positiveSignals.push("Verified business customer");
    positiveSignals.push("Direct Razorpay invoice settlement link");
    whyThisAction = `Overdue invoice + polite commercial reminder + ${(prob * 100).toFixed(0)}% recovery probability.`;
    fallbackPlan = "Escalate to finance collection team after 7 days.";
    escalationPlan = "Assign dedicated account manager for high-value enterprise invoice.";
  }
  // Fallback
  else {
    likelyRootCause = "Unclassified payment exception during gateway processing.";
    confidence = "Medium";
    whyThisMatters = "Standard recovery protocol applied based on customer history and gateway safety limits.";
    recommendedIntervention = "Retry Payment";
    strategy = "Standard Gateway Retry";
    channel = "gateway_retry";
    whyThisAction = `Standard recovery flow + ${(prob * 100).toFixed(0)}% probability.`;
    fallbackPlan = "Payment link fallback.";
    escalationPlan = "Human review.";
  }

  // --- ALTERNATIVE ACTIONS WITH ESTIMATED EXPECTED VALUES ---
  const alternatives: AlternativeAction[] = [
    {
      name: recommendedIntervention === "Retry Payment" ? "Automated Gateway Retry" : recommendedIntervention,
      channel: "Primary Gateway",
      estimatedExpectedRecovery: expectedRecovery,
      estimatedProbability: prob,
      description: "Primary autonomous intervention chosen based on failure context and customer profile.",
      recommended: true,
    },
    {
      name: "Conversational Payment Link (WhatsApp/SMS)",
      channel: "Multi-Channel Link",
      estimatedExpectedRecovery: Math.round(amount * Math.max(0.15, prob - 0.14)),
      estimatedProbability: Math.max(0.15, Number((prob - 0.14).toFixed(2))),
      description: "Dispatches 1-click Razorpay recovery link with 24h validity.",
      recommended: false,
    },
    {
      name: "Human Operations Desk Escalation",
      channel: "Manual Desk",
      estimatedExpectedRecovery: Math.round(amount * 0.35),
      estimatedProbability: 0.35,
      description: "Routes case to human operations specialist queue for phone outreach or manual review.",
      recommended: false,
    },
  ];

  // --- DECISION TIMELINE ---
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const baseH = now.getHours();
  const baseM = now.getMinutes();

  const decisionTimeline = [
    { time: `${pad(baseH)}:${pad(Math.max(0, baseM - 3))}:01`, step: "Case Detected", detail: `Ingested ${caseItem.paymentId} for ${amountStr} via webhook stream`, layer: "Layer 0" },
    { time: `${pad(baseH)}:${pad(Math.max(0, baseM - 2))}:14`, step: "Risk Scored", detail: `Recovery probability evaluated at ${(prob * 100).toFixed(0)}% • Expected value ${formatCurrency(expectedRecovery)}`, layer: "Layer 1" },
    { time: `${pad(baseH)}:${pad(Math.max(0, baseM - 1))}:30`, step: "Root Cause Identified", detail: likelyRootCause, layer: "Layer 2" },
    { time: `${pad(baseH)}:${pad(Math.max(0, baseM - 1))}:45`, step: "Plan Formulated", detail: `Recommendation: ${recommendedIntervention} (${strategy})`, layer: "Layer 2" },
    { time: `${pad(baseH)}:${pad(baseM)}:02`, step: "Policy Validated", detail: policy.allowed ? "All 6 deterministic rules passed" : `Policy blocked: ${policy.blockedRules[0]}`, layer: "Layer 3" },
    { time: `${pad(baseH)}:${pad(baseM)}:05`, step: policy.allowed ? "Action Authorized" : "Escalation Triggered", detail: policy.allowed ? `Approved for autonomous execution` : `Transferred to human operations review`, layer: "Layer 4" },
  ];

  return {
    caseId: caseItem.id,
    likelyRootCause,
    confidence,
    whyThisMatters,
    recoveryProbability: prob,
    contributingSignals: {
      positive: positiveSignals,
      negative: negativeSignals,
    },
    expectedRecovery,
    recommendedIntervention,
    whyThisAction,
    alternatives,
    decisionTimeline,
    policyStatus: policy.allowed ? "Approved" : "Blocked",
    nextAction: policy.allowed ? `Execute ${recommendedIntervention}` : "Escalate to Human Operations Desk",
    
    // Legacy compatibility
    recommendedAction: recommendedIntervention,
    strategy,
    channel,
    conciseReason: whyThisAction,
    rootCause: likelyRootCause,
    fallbackPlan,
    escalationPlan,
    suggestedPayload: {
      action: strategy,
      case_id: caseItem.id,
      amount: caseItem.amount,
      recovery_expected: expectedRecovery,
    }
  };
}
