import { ICommunicationRepository } from "../campaignRepository";
import { CommunicationMessage, CommunicationChannel, CommunicationStatus } from "../../communications/types";
import { apiClient } from "../../api/client";

export interface BackendCommunication {
  id: string;
  case_id: string;
  channel: string;
  content: string;
  status: string;
  campaign_id: string | null;
  created_at: string;
}

export function mapBackendCommunicationToFrontend(bc: BackendCommunication): CommunicationMessage {
  const channelNames: Record<string, string> = {
    whatsapp: "WhatsApp Business (Verified)",
    sms: "Gupshup SMS Gateway",
    email: "SendGrid Email",
    in_app: "In-App Push Notification",
  };

  return {
    id: bc.id,
    caseId: bc.case_id,
    customerName: `Customer (${bc.case_id})`,
    amount: 0,
    channel: bc.channel as CommunicationChannel,
    channelName: channelNames[bc.channel] || "Simulated Channel",
    language: "English",
    templateKey: `tpl_${bc.channel}_default`,
    content: bc.content,
    status: (bc.status as CommunicationStatus) || "SENT_SIMULATED",
    contactCount: 1,
    maxContacts: 2,
    policyStatus: "Approved",
    campaignId: bc.campaign_id || undefined,
    createdAt: bc.created_at,
    sentAt: bc.created_at,
    deliveredAt: bc.created_at,
    recoveredAfter: true,
  };
}

export class HttpCommunicationRepository implements ICommunicationRepository {
  public async getAllCommunications(): Promise<CommunicationMessage[]> {
    const res = await apiClient.get<BackendCommunication[]>("/api/v1/communications");
    return (res || []).map(mapBackendCommunicationToFrontend);
  }

  public async getCommunicationsByCase(caseId: string): Promise<CommunicationMessage[]> {
    const all = await this.getAllCommunications();
    return all.filter(c => c.caseId === caseId);
  }

  public async getCommunicationsByCampaign(campaignId: string): Promise<CommunicationMessage[]> {
    const all = await this.getAllCommunications();
    return all.filter(c => c.campaignId === campaignId);
  }

  public async addCommunication(comm: CommunicationMessage): Promise<CommunicationMessage> {
    const payload = {
      case_id: comm.caseId,
      channel: comm.channel,
      content: comm.content,
      campaign_id: comm.campaignId || null,
    };
    const res = await apiClient.post<BackendCommunication>("/api/v1/communications", payload);
    return mapBackendCommunicationToFrontend(res);
  }

  public async resetToInitial(): Promise<any> {
    return this.getAllCommunications();
  }
}
