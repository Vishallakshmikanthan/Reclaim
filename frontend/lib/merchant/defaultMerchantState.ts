import { MerchantProfile, MerchantPolicy, PolicyVersionHistoryItem } from "./types";

export const INITIAL_MERCHANT_PROFILE: MerchantProfile = {
  merchantId: "merchant_demo",
  businessName: "Acme Commerce India Pvt Ltd",

  industry: "E-Commerce & Digital Goods",
  currency: "INR",
  timezone: "Asia/Kolkata",
  defaultLanguage: "Hinglish",
  currentRole: "MERCHANT_ADMIN",
  createdAt: "2026-08-28T09:00:00Z",
  updatedAt: "2026-08-29T08:00:00Z",
};

export const INITIAL_MERCHANT_POLICY: MerchantPolicy = {
  version: "v1",
  isActive: true,
  updatedAt: "2026-08-29T08:00:00Z",
  updatedBy: "Merchant Admin",
  changeSummary: "Initial baseline recovery policy with standard safety invariants",
  recoverySettings: {
    automaticRecoveryEnabled: true,
    paymentRetryEnabled: true,
    paymentLinkEnabled: true,
    subscriptionRecoveryEnabled: true,
    receivablesRecoveryEnabled: true,
    customerRemindersEnabled: true,
    humanEscalationEnabled: true,
  },
  retryRules: {
    maxRetries: 3,
    minRetryIntervalMins: 15,
    minRecoveryProbability: 0.20,
    maxAutonomousAmountPaise: 2500000, // ₹25,000
    eligibleFailureTypes: [
      "UPI Timeout",
      "Card Decline",
      "Bank Downtime",
      "Network Drop",
      "Insufficient Funds",
      "Checkout Abandonment",
      "Subscription Failure",
      "Overdue Invoice",
    ],
  },
  paymentLinkRules: {
    maxLinkAttempts: 2,
    minLinkProbability: 0.15,
    maxLinkAmountPaise: 5000000, // ₹50,000
  },
  communicationRules: {
    preferredLanguage: "Hinglish",
    preferredChannel: "whatsapp",
    maxContacts24h: 2,
    cooldownHours: 4,
    allowedChannels: ["whatsapp", "sms", "email", "in_app"],
  },
  escalationRules: {
    escalateAfterFailedInterventions: true,
    escalateAfterTimeout: true,
    escalateAfterPolicyBlock: true,
    highValueThresholdPaise: 5000000, // ₹50,000
  },
  notificationPreferences: {
    highValueAlerts: true,
    policyBlockAlerts: true,
    timeoutAlerts: true,
    campaignCompleteAlerts: true,
    systemDegradedAlerts: true,
  },
};

export const INITIAL_POLICY_HISTORY: PolicyVersionHistoryItem[] = [
  {
    version: "v1",
    timestamp: "2026-08-29 08:00 IST",
    actor: "Merchant Admin",
    summary: "System initialization: Baseline policy activated with 6 deterministic invariants",
    policySnapshot: INITIAL_MERCHANT_POLICY,
  },
];
