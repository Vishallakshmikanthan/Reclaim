import { Case } from "../types";
import { Campaign, CampaignConfig, CampaignActivityItem, CampaignType } from "./types";
import { CommunicationMessage, CommunicationChannel } from "../communications/types";
import { evaluatePolicy } from "../policy/policyEngine";
import { buildRecoveryStrategy } from "../recovery/strategyEngine";
import { generateRecoveryMessage } from "../communications/templateEngine";

/**
 * Initial Deterministic Pre-Configured Operational Campaigns
 */
export const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: "CMP-001",
    config: {
      id: "CMP-001",
      name: "Smart UPI & Gateway Timeout Recovery",
      type: "PAYMENT_RECOVERY",
      description: "Automated instant retry on transient NPCI bank timeouts with WhatsApp 1-click fallback link.",
      eligibleFailureTypes: ["UPI Timeout", "Bank Downtime", "Network Drop"],
      minProbability: 0.40,
      maxInterventionsPerCase: 3,
      allowedChannels: ["sms", "whatsapp"],
      preferredLanguage: "Hinglish",
      operatingWindow: "24/7 Realtime",
      escalationRule: "Escalate after 3 automated attempts",
      stoppingRules: ["Max 3 attempts", "Customer contact cap (2/2)", "Fraud Radar > 70%"],
      createdAt: "2026-08-28T10:00:00Z",
      updatedAt: "2026-08-29T08:30:00Z",
    },
    status: "READY",
    stats: {
      totalEligibleCases: 42,
      processedCases: 0,
      recoveredCases: 0,
      revenueAtRisk: 34850000, // ₹3,48,500
      revenueRecovered: 0,
      recoveryRate: 0,
      policyBlocks: 0,
      failedActions: 0,
      escalations: 0,
      stoppedCases: 0,
      communicationsSent: 0,
      communicationsDelivered: 0,
    },
    caseIds: ["RC-2024-081", "RC-2024-082"],
    recentActivity: [],
  },
  {
    id: "CMP-002",
    config: {
      id: "CMP-002",
      name: "VIP Checkout Abandonment Recovery",
      type: "CHECKOUT_ABANDONMENT",
      description: "Targeted conversational WhatsApp reminders with 1-click Razorpay links for high-intent drops.",
      eligibleFailureTypes: ["Checkout Abandonment"],
      minProbability: 0.20,
      minAmountPaise: 500000, // > ₹5,000
      maxInterventionsPerCase: 2,
      allowedChannels: ["whatsapp", "sms"],
      preferredLanguage: "Hinglish",
      operatingWindow: "09:00 - 21:00 IST",
      escalationRule: "Escalate VIP orders > ₹50,000 to Sales Desk",
      stoppingRules: ["Contact limit 2/2 in 24h", "Probability < 15%"],
      createdAt: "2026-08-28T12:00:00Z",
      updatedAt: "2026-08-29T09:15:00Z",
    },
    status: "READY",
    stats: {
      totalEligibleCases: 18,
      processedCases: 0,
      recoveredCases: 0,
      revenueAtRisk: 18400000, // ₹1,84,000
      revenueRecovered: 0,
      recoveryRate: 0,
      policyBlocks: 0,
      failedActions: 0,
      escalations: 0,
      stoppedCases: 0,
      communicationsSent: 0,
      communicationsDelivered: 0,
    },
    caseIds: ["RC-2024-086"],
    recentActivity: [],
  },
  {
    id: "CMP-003",
    config: {
      id: "CMP-003",
      name: "Failed Subscription Auto-Dunning",
      type: "SUBSCRIPTION_RECOVERY",
      description: "RBI-compliant recurring mandate retries during optimal bank settlement windows.",
      eligibleFailureTypes: ["Subscription Failure"],
      minProbability: 0.50,
      maxInterventionsPerCase: 2,
      allowedChannels: ["email", "whatsapp"],
      preferredLanguage: "English",
      operatingWindow: "04:00 - 08:00 IST Settlement Batch",
      escalationRule: "Route to churn retention desk if unrecovered after 48h",
      stoppingRules: ["RBI 24h cooling window", "Mandate expired"],
      createdAt: "2026-08-28T14:30:00Z",
      updatedAt: "2026-08-29T07:45:00Z",
    },
    status: "READY",
    stats: {
      totalEligibleCases: 24,
      processedCases: 0,
      recoveredCases: 0,
      revenueAtRisk: 14500000, // ₹1,45,000
      revenueRecovered: 0,
      recoveryRate: 0,
      policyBlocks: 0,
      failedActions: 0,
      escalations: 0,
      stoppedCases: 0,
      communicationsSent: 0,
      communicationsDelivered: 0,
    },
    caseIds: ["RC-2024-087"],
    recentActivity: [],
  },
  {
    id: "CMP-004",
    config: {
      id: "CMP-004",
      name: "B2B Receivables & Invoice Recovery",
      type: "RECEIVABLES_RECOVERY",
      description: "Automated GST-compliant invoice payment links sent via verified WhatsApp & Email.",
      eligibleFailureTypes: ["Overdue Invoice"],
      minProbability: 0.35,
      maxInterventionsPerCase: 2,
      allowedChannels: ["email", "whatsapp"],
      preferredLanguage: "English",
      operatingWindow: "10:00 - 18:00 Business Hours",
      escalationRule: "Escalate to Finance Collections Desk",
      stoppingRules: ["Max 2 reminders per invoice"],
      createdAt: "2026-08-28T16:00:00Z",
      updatedAt: "2026-08-29T08:00:00Z",
    },
    status: "READY",
    stats: {
      totalEligibleCases: 12,
      processedCases: 0,
      recoveredCases: 0,
      revenueAtRisk: 28500000, // ₹2,85,000
      revenueRecovered: 0,
      recoveryRate: 0,
      policyBlocks: 0,
      failedActions: 0,
      escalations: 0,
      stoppedCases: 0,
      communicationsSent: 0,
      communicationsDelivered: 0,
    },
    caseIds: ["RC-2024-088"],
    recentActivity: [],
  },
];

/**
 * Deterministic Campaign Eligibility Filter
 */
export function evaluateCampaignEligibility(cases: Case[], config: CampaignConfig) {
  const eligibleCases: Case[] = [];
  const blockedByPolicy: Case[] = [];
  const requireReview: Case[] = [];
  let totalAtRisk = 0;
  let estimatedRecoverable = 0;

  cases.forEach((c) => {
    // 1. Status check: Only unresolved cases
    if (c.status === "recovered" || c.status === "stopped") return;

    // 2. Failure type filter
    const fType = c.failureType || c.failure;
    const matchesFailure = config.eligibleFailureTypes.includes(fType);
    if (!matchesFailure) return;

    // 3. Amount boundaries
    if (config.minAmountPaise && c.amount < config.minAmountPaise) return;
    if (config.maxAmountPaise && c.amount > config.maxAmountPaise) return;

    // 4. Probability threshold
    if (c.prob < config.minProbability) {
      requireReview.push(c);
      return;
    }

    // 5. Policy check (Retry ceiling & Contact limit)
    const retryExceeded = (c.retryCount || 0) >= config.maxInterventionsPerCase;
    const contactExceeded = (c.contactCount24h || 0) >= 2;
    const isFraud = (c.riskScore || 0) >= 0.70;

    if (retryExceeded || contactExceeded || isFraud) {
      blockedByPolicy.push(c);
      return;
    }

    // Passed all deterministic eligibility checks
    eligibleCases.push(c);
    totalAtRisk += c.amount;
    estimatedRecoverable += Math.round(c.amount * (c.prob || 0.60));
  });

  return {
    eligibleCases,
    totalAtRisk,
    estimatedRecoverable,
    blockedByPolicy,
    requireReview,
  };
}

/**
 * Initial Simulated Communication Log
 */
export const INITIAL_COMMUNICATIONS: CommunicationMessage[] = [
  {
    id: "COMM-2026-001",
    caseId: "RC-2024-081",
    customerName: "Rahul Sharma",
    customerPhone: "+91 98765 43210",
    amount: 849900,
    channel: "whatsapp",
    channelName: "WhatsApp Business (Verified)",
    language: "Hinglish",
    templateKey: "tpl_upi_timeout_hinglish",
    content: "Namaste Rahul Sharma, aapki ₹8,499 ki UPI payment network issue ki wajah se complete nahi ho paayi. Aap iss secure Razorpay link se 1-click mein complete kar sakte hain: rzp.io/l/rec_rc2024081. Link 24 ghante valid hai.",
    status: "DELIVERY_CONFIRMED_SIMULATED",
    contactCount: 1,
    maxContacts: 2,
    policyStatus: "Approved",
    campaignId: "CMP-001",
    campaignName: "Smart UPI & Gateway Timeout Recovery",
    createdAt: "2026-08-29T09:42:00Z",
    sentAt: "2026-08-29T09:42:05Z",
    deliveredAt: "2026-08-29T09:42:12Z",
    recoveredAfter: true,
    transactionId: "txn_rz_comm_001",
  },
  {
    id: "COMM-2026-002",
    caseId: "RC-2024-083",
    customerName: "Sneha Patel",
    customerPhone: "+91 98123 45678",
    amount: 1450000,
    channel: "whatsapp",
    channelName: "WhatsApp Business (Verified)",
    language: "Hinglish",
    templateKey: "tpl_insufficient_funds_hinglish",
    content: "Namaste Sneha Patel ji, aapka ₹14,500 ka order pending hai. Aap alternate UPI app ya netbanking se payment complete karein: rzp.io/l/rec_rc2024083",
    status: "DELIVERY_CONFIRMED_SIMULATED",
    contactCount: 1,
    maxContacts: 2,
    policyStatus: "Approved",
    campaignId: "CMP-001",
    campaignName: "Smart UPI & Gateway Timeout Recovery",
    createdAt: "2026-08-29T08:15:00Z",
    sentAt: "2026-08-29T08:15:04Z",
    deliveredAt: "2026-08-29T08:15:10Z",
    recoveredAfter: false,
  },
  {
    id: "COMM-2026-003",
    caseId: "RC-2024-084",
    customerName: "Vikram Malhotra",
    customerPhone: "+91 99887 66554",
    amount: 450000,
    channel: "sms",
    channelName: "Gupshup SMS Gateway",
    language: "English",
    templateKey: "tpl_card_decline_en",
    content: "Hello Vikram Malhotra, your card issuer was unable to process your payment of ₹4,500. Please use an alternate card or UPI to retry: rzp.io/l/rec_rc2024084",
    status: "DELIVERY_CONFIRMED_SIMULATED",
    contactCount: 1,
    maxContacts: 2,
    policyStatus: "Approved",
    campaignId: "CMP-001",
    campaignName: "Smart UPI & Gateway Timeout Recovery",
    createdAt: "2026-08-29T07:30:00Z",
    sentAt: "2026-08-29T07:30:02Z",
    deliveredAt: "2026-08-29T07:30:08Z",
    recoveredAfter: true,
    transactionId: "txn_rz_comm_003",
  },
  {
    id: "COMM-2026-004",
    caseId: "RC-2024-088",
    customerName: "Acme Logistics Pvt Ltd",
    customerPhone: "+91 98220 11223",
    amount: 4200000,
    channel: "email",
    channelName: "SendGrid Verified Email",
    language: "English",
    templateKey: "tpl_invoice_reminder_en",
    content: "Dear Acme Logistics Team, invoice #INV-8821 for ₹42,000 is overdue. Please complete settlement via our secure corporate payment portal: rzp.io/l/inv_8821_rec. GST receipt will be generated instantly.",
    status: "DELIVERY_CONFIRMED_SIMULATED",
    contactCount: 1,
    maxContacts: 2,
    policyStatus: "Approved",
    campaignId: "CMP-004",
    campaignName: "B2B Receivables & Invoice Recovery",
    createdAt: "2026-08-29T06:45:00Z",
    sentAt: "2026-08-29T06:45:04Z",
    deliveredAt: "2026-08-29T06:45:15Z",
    recoveredAfter: true,
    transactionId: "txn_rz_comm_004",
  },
  {
    id: "COMM-2026-005",
    caseId: "RC-2024-087",
    customerName: "Priya Sundaram",
    customerPhone: "+91 97654 32109",
    amount: 249900,
    channel: "in_app",
    channelName: "In-App Push Notification",
    language: "English",
    templateKey: "tpl_inapp_subscription_en",
    content: "Your Pro Subscription renewal of ₹2,499 was declined by your bank. Update your default payment method now to keep active premium access without interruption.",
    status: "DELIVERY_CONFIRMED_SIMULATED",
    contactCount: 1,
    maxContacts: 2,
    policyStatus: "Approved",
    campaignId: "CMP-003",
    campaignName: "Failed Subscription Auto-Dunning",
    createdAt: "2026-08-29T06:10:00Z",
    sentAt: "2026-08-29T06:10:01Z",
    deliveredAt: "2026-08-29T06:10:03Z",
    recoveredAfter: true,
    transactionId: "txn_rz_comm_005",
  },
  {
    id: "COMM-2026-006",
    caseId: "RC-2024-086",
    customerName: "Arjun Verma",
    customerPhone: "+91 98450 99887",
    amount: 2890000,
    channel: "whatsapp",
    channelName: "WhatsApp Business (Verified)",
    language: "English",
    templateKey: "tpl_vip_abandonment_en",
    content: "Hi Arjun, we noticed your checkout for ₹28,900 was interrupted. We have reserved your items for 24 hours. Click here to resume your checkout with 1-click UPI/Card: rzp.io/l/rec_rc2024086",
    status: "DELIVERY_CONFIRMED_SIMULATED",
    contactCount: 1,
    maxContacts: 2,
    policyStatus: "Approved",
    campaignId: "CMP-002",
    campaignName: "VIP Checkout Abandonment Recovery",
    createdAt: "2026-08-29T05:20:00Z",
    sentAt: "2026-08-29T05:20:03Z",
    deliveredAt: "2026-08-29T05:20:09Z",
    recoveredAfter: true,
    transactionId: "txn_rz_comm_006",
  },
  {
    id: "COMM-2026-007",
    caseId: "RC-2024-082",
    customerName: "Kavita Rao",
    customerPhone: "+91 98333 44556",
    amount: 119900,
    channel: "sms",
    channelName: "Gupshup SMS Gateway",
    language: "Hinglish",
    templateKey: "tpl_sms_mandate_failed_hinglish",
    content: "Namaste Kavita ji, aapka ₹1,199 recurring mandate debit bank response timeout hone se hold par hai. Pay link se retry karein: rzp.io/l/rec_rc2024082 - Reclaim Support",
    status: "DELIVERY_CONFIRMED_SIMULATED",
    contactCount: 1,
    maxContacts: 2,
    policyStatus: "Approved",
    campaignId: "CMP-001",
    campaignName: "Smart UPI & Gateway Timeout Recovery",
    createdAt: "2026-08-29T04:45:00Z",
    sentAt: "2026-08-29T04:45:02Z",
    deliveredAt: "2026-08-29T04:45:08Z",
    recoveredAfter: false,
  },
  {
    id: "COMM-2026-008",
    caseId: "RC-2024-085",
    customerName: "Deepak Choudhary",
    customerPhone: "+91 99112 33445",
    amount: 650000,
    channel: "in_app",
    channelName: "In-App Push Notification",
    language: "Hinglish",
    templateKey: "tpl_inapp_bank_downtime_hinglish",
    content: "HDFC Bank server temporary down tha. Aapka ₹6,500 payment pending hai. Tap karein aur Google Pay/PhonePe se retry karein.",
    status: "DELIVERY_CONFIRMED_SIMULATED",
    contactCount: 1,
    maxContacts: 2,
    policyStatus: "Approved",
    campaignId: "CMP-001",
    campaignName: "Smart UPI & Gateway Timeout Recovery",
    createdAt: "2026-08-29T03:30:00Z",
    sentAt: "2026-08-29T03:30:01Z",
    deliveredAt: "2026-08-29T03:30:04Z",
    recoveredAfter: true,
    transactionId: "txn_rz_comm_008",
  },
  {
    id: "COMM-2026-009",
    caseId: "RC-2024-089",
    customerName: "Global Tech Enterprises",
    customerPhone: "+91 98100 88990",
    amount: 8500000,
    channel: "email",
    channelName: "SendGrid Verified Email",
    language: "English",
    templateKey: "tpl_executive_escalation_en",
    content: "Attention Finance Team: Payment authorization for ₹85,000 on Order #GT-992 failed card security checks. A dedicated executive account recovery link is ready: rzp.io/l/rec_gt992",
    status: "DELIVERY_CONFIRMED_SIMULATED",
    contactCount: 1,
    maxContacts: 2,
    policyStatus: "Approved",
    campaignId: "CMP-004",
    campaignName: "B2B Receivables & Invoice Recovery",
    createdAt: "2026-08-29T02:15:00Z",
    sentAt: "2026-08-29T02:15:05Z",
    deliveredAt: "2026-08-29T02:15:18Z",
    recoveredAfter: true,
    transactionId: "txn_rz_comm_009",
  },
  {
    id: "COMM-2026-010",
    caseId: "RC-2024-090",
    customerName: "Rohan Kapoor",
    customerPhone: "+91 98777 66554",
    amount: 999900,
    channel: "whatsapp",
    channelName: "WhatsApp Business",
    language: "Hinglish",
    templateKey: "tpl_contact_cap_blocked",
    content: "Message held for safety: Customer 24h contact policy limit (2/2) reached. Auto-held by SafetyController to prevent spam.",
    status: "BLOCKED",
    contactCount: 2,
    maxContacts: 2,
    policyStatus: "Blocked",
    campaignId: "CMP-001",
    campaignName: "Smart UPI & Gateway Timeout Recovery",
    createdAt: "2026-08-29T01:05:00Z",
    sentAt: "2026-08-29T01:05:00Z",
    deliveredAt: "2026-08-29T01:05:00Z",
    recoveredAfter: false,
  }
];
