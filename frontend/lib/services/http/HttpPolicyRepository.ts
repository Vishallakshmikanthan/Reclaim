import { IPolicyRepository } from "../policyRepository";
import { MerchantPolicy, PolicyVersionHistoryItem } from "../../merchant/types";
import { INITIAL_MERCHANT_POLICY } from "../../merchant/defaultMerchantState";
import { apiClient } from "../../api/client";

export interface BackendPolicyConfiguration {
  max_retries: number;
  min_recovery_probability: number;
  max_autonomous_amount: number;
  max_contacts_24h: number;
  max_risk_score: number;
}

export interface BackendPolicyVersion {
  version: string;
  created_at: string;
  created_by: string;
  configuration: BackendPolicyConfiguration;
  active: boolean;
}

export interface BackendPolicyUpdateRequest {
  configuration: BackendPolicyConfiguration;
  created_by: string;
}

export function mapBackendPolicyToFrontend(pv: BackendPolicyVersion): MerchantPolicy {
  return {
    ...INITIAL_MERCHANT_POLICY,
    version: pv.version,
    isActive: pv.active,
    updatedAt: pv.created_at,
    updatedBy: pv.created_by,
    changeSummary: `Policy ${pv.version} active configuration`,
    retryRules: {
      ...INITIAL_MERCHANT_POLICY.retryRules,
      maxRetries: pv.configuration.max_retries,
      minRecoveryProbability: pv.configuration.min_recovery_probability,
      maxAutonomousAmountPaise: pv.configuration.max_autonomous_amount,
    },
    communicationRules: {
      ...INITIAL_MERCHANT_POLICY.communicationRules,
      maxContacts24h: pv.configuration.max_contacts_24h,
    },
  };
}

export function mapFrontendPolicyToBackendRequest(policy: MerchantPolicy, actor: string = "Merchant Admin"): BackendPolicyUpdateRequest {
  return {
    configuration: {
      max_retries: policy.retryRules?.maxRetries ?? 3,
      min_recovery_probability: policy.retryRules?.minRecoveryProbability ?? 0.2,
      max_autonomous_amount: policy.retryRules?.maxAutonomousAmountPaise ?? 1000000,
      max_contacts_24h: policy.communicationRules?.maxContacts24h ?? 2,
      max_risk_score: 0.6,
    },
    created_by: actor,
  };
}

export class HttpPolicyRepository implements IPolicyRepository {
  public async getActivePolicy(): Promise<MerchantPolicy> {
    const res = await apiClient.get<BackendPolicyVersion>("/api/v1/policies/current");
    return mapBackendPolicyToFrontend(res);
  }

  public async getPolicyHistory(): Promise<PolicyVersionHistoryItem[]> {
    const res = await apiClient.get<BackendPolicyVersion[]>("/api/v1/policies/versions");
    return res.map((pv) => ({
      version: pv.version,
      timestamp: pv.created_at,
      actor: pv.created_by,
      summary: `Policy ${pv.version} created by ${pv.created_by}`,
      policySnapshot: mapBackendPolicyToFrontend(pv),
    }));
  }

  public async updatePolicy(updates: Partial<MerchantPolicy>, changeSummary: string, actor: string = "Merchant Admin"): Promise<MerchantPolicy> {
    const current = await this.getActivePolicy();
    const merged: MerchantPolicy = {
      ...current,
      ...updates,
      retryRules: { ...current.retryRules, ...(updates.retryRules || {}) },
      communicationRules: { ...current.communicationRules, ...(updates.communicationRules || {}) },
    };
    const req = mapFrontendPolicyToBackendRequest(merged, actor);
    const res = await apiClient.put<BackendPolicyVersion>("/api/v1/policies/current", req);
    return mapBackendPolicyToFrontend(res);
  }

  public async saveActivePolicy(policy: MerchantPolicy): Promise<MerchantPolicy> {
    const req = mapFrontendPolicyToBackendRequest(policy, policy.updatedBy || "Merchant Admin");
    const res = await apiClient.put<BackendPolicyVersion>("/api/v1/policies/current", req);
    return mapBackendPolicyToFrontend(res);
  }

  public async addHistoryItem(_item: PolicyVersionHistoryItem): Promise<void> {
    // History is persisted automatically in PostgreSQL on PUT /api/v1/policies/current
  }

  public async resetToInitial(): Promise<any> {
    return this.getActivePolicy();
  }
}
