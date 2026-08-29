import { FailureType, Case } from "../types";
import { CommunicationChannel } from "../communications/types";

export type CampaignType = 
  | "PAYMENT_RECOVERY" 
  | "CHECKOUT_ABANDONMENT" 
  | "SUBSCRIPTION_RECOVERY" 
  | "RECEIVABLES_RECOVERY" 
  | "MIXED_RECOVERY";

export type CampaignStatus = 
  | "DRAFT" 
  | "READY" 
  | "RUNNING" 
  | "PAUSED" 
  | "COMPLETED" 
  | "FAILED";

export interface CampaignConfig {
  id: string;
  name: string;
  type: CampaignType;
  description: string;
  eligibleFailureTypes: FailureType[];
  minProbability: number; // 0.0 to 1.0 (e.g. 0.30)
  maxAmountPaise?: number; // Optional ceiling
  minAmountPaise?: number; // Optional floor
  maxInterventionsPerCase: number; // e.g. 2
  allowedChannels: CommunicationChannel[];
  preferredLanguage: "English" | "Hinglish";
  operatingWindow: string; // e.g. "09:00 - 21:00 IST"
  escalationRule: string; // e.g. "Escalate on 2nd consecutive failure"
  stoppingRules: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CampaignExecutionStats {
  totalEligibleCases: number;
  processedCases: number;
  recoveredCases: number;
  revenueAtRisk: number; // in paise
  revenueRecovered: number; // in paise
  recoveryRate: number; // %
  policyBlocks: number;
  failedActions: number;
  escalations: number;
  stoppedCases: number;
  communicationsSent: number;
  communicationsDelivered: number;
}

export interface CampaignActivityItem {
  id: string;
  timestamp: string;
  caseId: string;
  customerName: string;
  action: string;
  status: "SUCCESS" | "BLOCKED" | "FAILED" | "ESCALATED" | "INFO";
  amount?: number;
  detail: string;
}

export interface Campaign {
  id: string;
  config: CampaignConfig;
  status: CampaignStatus;
  stats: CampaignExecutionStats;
  caseIds: string[];
  recentActivity: CampaignActivityItem[];
}
