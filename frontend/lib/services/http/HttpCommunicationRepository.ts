import { ICommunicationRepository } from "../campaignRepository";
import { CommunicationMessage } from "../../communications/types";
import { apiClient } from "../../api/client";

export class HttpCommunicationRepository implements ICommunicationRepository {
  public async getAllCommunications(): Promise<CommunicationMessage[]> {
    return await apiClient.get<CommunicationMessage[]>("/api/v1/communications");
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
    // The backend uses snake_case, frontend might use camelCase. We'll adapt if necessary,
    // but assuming types map closely.
    const payload = {
      case_id: comm.caseId,
      campaign_id: comm.campaignId,
      channel: comm.channel,
      language: comm.language,
      content: comm.content,
      status: comm.status
    };
    return await apiClient.post<CommunicationMessage>("/api/v1/communications", payload);
  }


  public async resetToInitial(): Promise<any> {
    return this.getAllCommunications();
  }

}
