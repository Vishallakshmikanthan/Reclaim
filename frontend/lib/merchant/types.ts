import { FailureType } from "../types";
import { CommunicationChannel } from "../communications/types";

export type MerchantRole = "MERCHANT_ADMIN" | "OPERATOR" | "VIEWER";

export interface MerchantProfile {
  merchantId: string;
  businessName: string;
  industry: string;
  currency: "INR";
  timezone: "Asia/Kolkata";
  defaultLanguage: "Hinglish" | "English";
  currentRole: MerchantRole;
  createdAt: string;
  updatedAt: string;
}

export interface RecoverySettings {
  automaticRecoveryEnabled: boolean; // Master toggle
  paymentRetryEnabled: boolean;
  paymentLinkEnabled: boolean;
  subscriptionRecoveryEnabled: boolean;
  receivablesRecoveryEnabled: boolean;
  customerRemindersEnabled: boolean;
  humanEscalationEnabled: boolean;
}

export interface PaymentRetryConfig {
  maxRetries: number; // 1 to 5, default 3
  minRetryIntervalMins: number; // 15, 30, 60
  minRecoveryProbability: number; // 0.10 to 0.80, default 0.30
  maxAutonomousAmountPaise: number; // e.g. 2500000 (₹25,000)
  eligibleFailureTypes: FailureType[];
}

export interface PaymentLinkConfig {
  maxLinkAttempts: number; // default 2
  minLinkProbability: number; // default 0.20
  maxLinkAmountPaise: number; // default 5000000 (₹50,000)
}

export interface CommunicationConfig {
  preferredLanguage: "Hinglish" | "English";
  preferredChannel: CommunicationChannel;
  maxContacts24h: number; // 1 to 3, default 2
  cooldownHours: number; // default 4
  allowedChannels: CommunicationChannel[];
}

export interface HumanEscalationConfig {
  escalateAfterFailedInterventions: boolean;
  escalateAfterTimeout: boolean;
  escalateAfterPolicyBlock: boolean;
  highValueThresholdPaise: number; // default 5000000 (₹50,000)
}

export interface NotificationPreferences {
  highValueAlerts: boolean;
  policyBlockAlerts: boolean;
  timeoutAlerts: boolean;
  campaignCompleteAlerts: boolean;
  systemDegradedAlerts: boolean;
}

export interface MerchantPolicy {
  version: string; // e.g. "v1", "v2"
  isActive: boolean;
  updatedAt: string;
  updatedBy: string;
  changeSummary: string;
  recoverySettings: RecoverySettings;
  retryRules: PaymentRetryConfig;
  paymentLinkRules: PaymentLinkConfig;
  communicationRules: CommunicationConfig;
  escalationRules: HumanEscalationConfig;
  notificationPreferences: NotificationPreferences;
}

export interface PolicyVersionHistoryItem {
  version: string;
  timestamp: string;
  actor: string;
  summary: string;
  policySnapshot: MerchantPolicy;
}

export interface PolicySimulationImpact {
  eligibleCasesCount: number;
  expectedRecoverablePaise: number;
  blockedCasesCount: number;
  conflicts: string[];
  warnings: string[];
}
