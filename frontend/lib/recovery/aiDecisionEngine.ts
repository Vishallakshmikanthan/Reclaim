import { Case, RecoveryDecision } from "../types";
import { formatCurrency } from "../utils";

export function getRecoveryDecision(caseItem: Case): RecoveryDecision {
  const failure = caseItem.failureType;
  const prob = caseItem.prob;
  const amountStr = formatCurrency(caseItem.amount);

  switch (failure) {
    case "UPI Timeout":
      return {
        caseId: caseItem.id,
        recommendedAction: "Execute Razorpay Payment Retry",
        strategy: "Razorpay Instant Retry",
        channel: "gateway_retry",
        confidence: prob >= 0.7 ? "High Confidence" : "Medium Confidence",
        probability: prob,
        expectedRecovery: Math.round(caseItem.amount * prob),
        rootCause: `NPCI / Issuing Bank (${caseItem.bank || "HDFC Bank"}) timeout during peak processing. VPA handle remains valid.`,
        conciseReason: `Temporary UPI network timeout detected for ${amountStr}. Immediate gateway retry is recommended because the issuing bank latency has stabilized and retry limits are within policy.`,
        fallbackPlan: "Generate dynamic Hinglish SMS payment link with 24-hour validity.",
        escalationPlan: "Escalate to Human Operations Desk if secondary retry fails.",
        suggestedPayload: {
          action: "rzp_payment_retry",
          payment_id: caseItem.paymentId,
          idempotency_key: `reclaim_${caseItem.id}_retry_${caseItem.retryCount + 1}`,
          amount: caseItem.amount,
        },
      };

    case "Card Decline":
      if (caseItem.retryCount >= 2) {
        return {
          caseId: caseItem.id,
          recommendedAction: "Send WhatsApp Alternate Payment Link",
          strategy: "WhatsApp Conversational Link",
          channel: "whatsapp_link",
          confidence: "Medium Confidence",
          probability: prob,
          expectedRecovery: Math.round(caseItem.amount * prob),
          rootCause: `Card declined by issuing bank with generic decline code. Previous retry attempts exhausted.`,
          conciseReason: `Card declined on multiple attempts. Recommended action is sending a multi-channel WhatsApp payment link allowing the customer to switch to UPI or netbanking.`,
          fallbackPlan: "Dispatch SMS fallback nudge with 1-click Razorpay link.",
          escalationPlan: "Route to merchant success team for high-value customer outreach.",
        };
      }
      return {
        caseId: caseItem.id,
        recommendedAction: "Smart Retry with 3DS Verification",
        strategy: "Smart Card Retry",
        channel: "gateway_retry",
        confidence: "Medium Confidence",
        probability: prob,
        expectedRecovery: Math.round(caseItem.amount * prob),
        rootCause: `Issuer authentication challenge failure (3DS timeout). Card credentials remain valid.`,
        conciseReason: `Authentication handshake interrupted for ${amountStr}. Re-triggering authorization with fresh OTP challenge prompt.`,
        fallbackPlan: "Send SMS payment link with UPI alternative.",
        escalationPlan: "Escalate to human review if second decline occurs.",
      };

    case "Insufficient Funds":
      return {
        caseId: caseItem.id,
        recommendedAction: "Send Hinglish SMS Payment Link with UPI QR",
        strategy: "Hinglish SMS Link",
        channel: "sms_link",
        confidence: "High Confidence",
        probability: prob,
        expectedRecovery: Math.round(caseItem.amount * prob),
        rootCause: "Customer account balance check failed during transaction settlement.",
        conciseReason: `Transaction declined due to insufficient balance. Sending a polite Hinglish SMS recovery link so the customer can pay from an alternate account or credit line.`,
        fallbackPlan: "Automated WhatsApp nudge scheduled after 24 hours.",
        escalationPlan: "Close case if unrecovered after 48 hours without spamming customer.",
      };

    case "Bank Downtime":
      return {
        caseId: caseItem.id,
        recommendedAction: "Delayed Scheduled Retry",
        strategy: "Delayed Gateway Retry",
        channel: "gateway_retry",
        confidence: "High Confidence",
        probability: prob,
        expectedRecovery: Math.round(caseItem.amount * prob),
        rootCause: `Issuer gateway (${caseItem.bank || "State Bank of India"}) reported temporary maintenance outage.`,
        conciseReason: `Issuing bank gateway downtime detected. Engine will execute a delayed retry once gateway telemetry reports health recovery (>95% success rate).`,
        fallbackPlan: "Switch transaction route to alternate bank acquiring channel if available.",
        escalationPlan: "Notify operations if downtime exceeds 2 hours.",
      };

    case "Network Drop":
      return {
        caseId: caseItem.id,
        recommendedAction: "Immediate Gateway Retry & Polling",
        strategy: "Idempotent Gateway Retry",
        channel: "gateway_retry",
        confidence: "High Confidence",
        probability: prob,
        expectedRecovery: Math.round(caseItem.amount * prob),
        rootCause: "Client network disconnection before response receipt from Razorpay switch.",
        conciseReason: `Network dropped during client-side verification. An idempotent query and retry is recommended to capture settlement without creating duplicate debits.`,
        fallbackPlan: "Send instant SMS confirmation link.",
        escalationPlan: "Escalate to manual reconciliation if telemetry remains ambiguous.",
      };

    case "Checkout Abandonment":
      return {
        caseId: caseItem.id,
        recommendedAction: "Send WhatsApp 1-Click Checkout Link",
        strategy: "WhatsApp Cart Link",
        channel: "whatsapp_link",
        confidence: "Medium Confidence",
        probability: prob,
        expectedRecovery: Math.round(caseItem.amount * prob),
        rootCause: "Customer exited checkout funnel at payment method selection stage.",
        conciseReason: `Checkout session for ${amountStr} was abandoned. A conversational WhatsApp message with pre-filled cart link is recommended within the 2-hour high-intent window.`,
        fallbackPlan: "Email recovery sequence with 5% limited-time incentive.",
        escalationPlan: "No escalation required for unrecovered cart abandonments.",
      };

    case "Subscription Failure":
      return {
        caseId: caseItem.id,
        recommendedAction: "Scheduled Mandate Execution Retry",
        strategy: "Auto-Debit Mandate Retry",
        channel: "gateway_retry",
        confidence: "High Confidence",
        probability: prob,
        expectedRecovery: Math.round(caseItem.amount * prob),
        rootCause: "Recurring e-mandate debit rejected due to issuer cooling window.",
        conciseReason: `Recurring subscription mandate debit failed. Automatic retry is scheduled at optimal morning clearing window with customer pre-notification.`,
        fallbackPlan: "Send update payment method link to subscriber.",
        escalationPlan: "Trigger grace-period workflow before suspending subscription access.",
      };

    case "Overdue Invoice":
      return {
        caseId: caseItem.id,
        recommendedAction: "Send Multi-Channel Invoice Reminder with Direct UPI Link",
        strategy: "Smart Invoice Reminder",
        channel: "sms_link",
        confidence: "Medium Confidence",
        probability: prob,
        expectedRecovery: Math.round(caseItem.amount * prob),
        rootCause: "B2B / Net-30 invoice passed due date without payment capture.",
        conciseReason: `Invoice for ${amountStr} is overdue. Automated polite reminder with embedded 1-click Razorpay payment link recommended.`,
        fallbackPlan: "Escalate to finance collection team after 7 days.",
        escalationPlan: "Assign account manager for high-value enterprise invoice.",
      };

    case "Fraud Signal":
    default:
      return {
        caseId: caseItem.id,
        recommendedAction: "Halt Recovery & Escalate to Risk Desk",
        strategy: "Manual Risk Audit",
        channel: "human_escalation",
        confidence: "High Confidence",
        probability: prob,
        expectedRecovery: 0,
        rootCause: "High-risk fraud score / stolen card indicator flagged by gateway risk radar.",
        conciseReason: `Suspicious payment pattern or fraud flag detected. Automatic recovery is strictly prohibited by policy to prevent chargeback penalties. Escalate immediately to human risk team.`,
        fallbackPlan: "Permanent block on customer entity and payment instrument.",
        escalationPlan: "Direct escalation to Merchant Risk & Compliance Lead.",
      };
  }
}
