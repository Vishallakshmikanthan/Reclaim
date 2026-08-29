import { ICampaignRepository } from "../campaignRepository";
import { Campaign, CampaignConfig, CampaignStatus } from "../../campaigns/types";
import { INITIAL_CAMPAIGNS } from "../../campaigns/campaignService";
import { apiClient } from "../../api/client";

interface BackendCampaign {
  id: string;
  name: string;
  type: string;
  description: string;
  status: string;
  min_probability: number;
  case_ids: string[];
  created_at: string;
  updated_at: string;
}

export function mapBackendCampaignToFrontend(bc: BackendCampaign): Campaign {
  const matchingInitial = INITIAL_CAMPAIGNS.find((c) => c.id === bc.id);
  const baseConfig = matchingInitial?.config || {
    id: bc.id,
    name: bc.name,
    type: (bc.type as any) || "PAYMENT_RECOVERY",
    description: bc.description || "",
    eligibleFailureTypes: ["UPI Timeout", "Bank Downtime", "Network Drop"],
    minProbability: bc.min_probability ?? 0.2,
    maxInterventionsPerCase: 3,
    allowedChannels: ["sms", "whatsapp"],
    preferredLanguage: "Hinglish",
    operatingWindow: "24/7 Realtime",
    escalationRule: "Escalate after 3 automated attempts",
    stoppingRules: ["Max 3 attempts", "Customer contact cap (2/2)", "Fraud Radar > 70%"],
    createdAt: bc.created_at,
    updatedAt: bc.updated_at,
  };

  const statusMap: Record<string, CampaignStatus> = {
    DRAFT: "DRAFT",
    READY: "READY",
    RUNNING: "RUNNING",
    PAUSED: "PAUSED",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
    draft: "DRAFT",
    ready: "READY",
    running: "RUNNING",
    paused: "PAUSED",
    completed: "COMPLETED",
    failed: "FAILED",
  };

  return {
    id: bc.id,
    config: {
      ...baseConfig,
      id: bc.id,
      name: bc.name,
      description: bc.description || baseConfig.description,
      minProbability: bc.min_probability ?? baseConfig.minProbability,
    },
    status: statusMap[bc.status] || "READY",
    stats: matchingInitial?.stats || {
      totalEligibleCases: bc.case_ids.length,
      processedCases: 0,
      recoveredCases: 0,
      revenueAtRisk: 0,
      revenueRecovered: 0,
      recoveryRate: 0,
      policyBlocks: 0,
      failedActions: 0,
      escalations: 0,
      stoppedCases: 0,
      communicationsSent: 0,
      communicationsDelivered: 0,
    },
    caseIds: bc.case_ids || [],
    recentActivity: matchingInitial?.recentActivity || [],
  };
}

export class HttpCampaignRepository implements ICampaignRepository {
  public async getAllCampaigns(): Promise<Campaign[]> {
    const res = await apiClient.get<BackendCampaign[]>("/api/v1/campaigns");
    return res.map(mapBackendCampaignToFrontend);
  }

  public async getCampaignById(id: string): Promise<Campaign | undefined> {
    try {
      const res = await apiClient.get<BackendCampaign>(`/api/v1/campaigns/${id}`);
      return mapBackendCampaignToFrontend(res);
    } catch (e: any) {
      if (e.code === 'CASE_NOT_FOUND') return undefined;
      throw e;
    }
  }

  public async startCampaign(id: string): Promise<any> {
    return await apiClient.post(`/api/v1/campaigns/${id}/start`);
  }

  public async pauseCampaign(id: string): Promise<any> {
    return await apiClient.post(`/api/v1/campaigns/${id}/pause`);
  }

  public async resumeCampaign(id: string): Promise<any> {
    return await apiClient.post(`/api/v1/campaigns/${id}/resume`);
  }

  public async saveCampaign(campaign: Campaign): Promise<Campaign> {
    const payload = {
      name: campaign.config.name,
      type: campaign.config.type,
      description: campaign.config.description,
      min_probability: campaign.config.minProbability,
      case_ids: campaign.caseIds || [],
    };
    const res = await apiClient.post<BackendCampaign>("/api/v1/campaigns", payload);
    return mapBackendCampaignToFrontend(res);
  }

  public async resetToInitial(): Promise<any> {
    return this.getAllCampaigns();
  }
}
