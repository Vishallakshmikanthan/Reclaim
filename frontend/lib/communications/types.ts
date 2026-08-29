export type CommunicationChannel = "in_app" | "email" | "sms" | "whatsapp";

export type CommunicationStatus = 
  | "DRAFT" 
  | "POLICY_CHECKING" 
  | "APPROVED" 
  | "BLOCKED" 
  | "QUEUED" 
  | "SENT_SIMULATED" 
  | "DELIVERY_CONFIRMED_SIMULATED" 
  | "FAILED" 
  | "STOPPED";

export interface CommunicationMessage {
  id: string;
  caseId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  amount: number; // in paise
  channel: CommunicationChannel;
  channelName: string;
  language: "English" | "Hinglish";
  templateKey: string;
  content: string;
  status: CommunicationStatus;
  contactCount: number;
  maxContacts: number;
  policyStatus: "Approved" | "Blocked";
  policyReason?: string;
  campaignId?: string;
  campaignName?: string;
  createdAt: string;
  sentAt?: string;
  deliveredAt?: string;
  recoveredAfter: boolean;
  transactionId?: string;
  auditEventId?: string;
}

export interface CommunicationAnalytics {
  totalMessages: number;
  sentSimulated: number;
  deliveredSimulated: number;
  blockedByPolicy: number;
  failedDelivery: number;
  associatedRecoveries: number;
  recoveredRevenue: number; // in paise
  observedRecoveryRate: number; // %
  englishCount: number;
  hinglishCount: number;
}
