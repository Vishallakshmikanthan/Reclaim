import { IPolicyRepository, IMerchantRepository } from "../policyRepository";
import { MerchantPolicy, MerchantProfile, PolicyVersionHistoryItem } from "../../merchant/types";
import { apiClient } from "../../api/client";

export class HttpPolicyRepository implements IPolicyRepository {
  public async getActivePolicy(): Promise<MerchantPolicy> {
    return await apiClient.get<MerchantPolicy>("/api/v1/policies/current");
  }

  public async getPolicyHistory(): Promise<PolicyVersionHistoryItem[]> {
    return await apiClient.get<PolicyVersionHistoryItem[]>("/api/v1/policies/versions");
  }

  public async updatePolicy(updates: Partial<MerchantPolicy>, changeSummary: string, actor: string = "Admin"): Promise<MerchantPolicy> {
    const current = await this.getActivePolicy();
    const newPolicy = { ...current, ...updates, changeSummary, updatedBy: actor, updatedAt: new Date().toISOString() };
    return await apiClient.put<MerchantPolicy>("/api/v1/policies/current", newPolicy);
  }

  public async saveActivePolicy(policy: MerchantPolicy): Promise<MerchantPolicy> {
    return await apiClient.put<MerchantPolicy>("/api/v1/policies/current", policy);
  }

  public async addHistoryItem(item: PolicyVersionHistoryItem): Promise<void> {
    return;
  }

  public async resetToInitial(): Promise<any> {
    return this.getActivePolicy();
  }
}
