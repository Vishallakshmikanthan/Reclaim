import { ICampaignRepository } from "../campaignRepository";
import { Campaign, CampaignConfig } from "../../campaigns/types";
import { apiClient } from "../../api/client";

export class HttpCampaignRepository implements ICampaignRepository {
  public async getAllCampaigns(): Promise<Campaign[]> {
    return await apiClient.get<Campaign[]>("/api/v1/campaigns");
  }

  public async getCampaignById(id: string): Promise<Campaign | undefined> {
    try {
      return await apiClient.get<Campaign>(`/api/v1/campaigns/${id}`);
    } catch (e: any) {
      if (e.code === 'CASE_NOT_FOUND') return undefined;
      throw e;
    }
  }

  public async saveCampaign(campaign: Campaign): Promise<Campaign> {
    // If it has an ID that exists and we are trying to update, we can't easily do it via API unless we use start/pause.
    // For simplicity, assume create if no status provided, otherwise start/pause
    if (campaign.status === 'RUNNING') {
      await apiClient.post(`/api/v1/campaigns/${campaign.id}/resume`).catch(() => {});
    } else if (campaign.status === 'PAUSED') {
      await apiClient.post(`/api/v1/campaigns/${campaign.id}/pause`).catch(() => {});
    }
    
    try {
      return await apiClient.post<Campaign>("/api/v1/campaigns", campaign);
    } catch (e) {
      return campaign; // already exists
    }
  }

  public async resetToInitial(): Promise<any> {
    return this.getAllCampaigns();
  }
}
