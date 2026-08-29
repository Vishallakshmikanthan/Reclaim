import { MerchantPolicy, PolicyVersionHistoryItem, MerchantProfile } from "../merchant/types";
import { BrowserStorage, STORAGE_KEYS } from "../storage/browserStorage";
import { 
  INITIAL_MERCHANT_POLICY, 
  INITIAL_POLICY_HISTORY, 
  INITIAL_MERCHANT_PROFILE 
} from "../merchant/defaultMerchantState";

export interface IPolicyRepository {
  getActivePolicy(): Promise<MerchantPolicy>;
  saveActivePolicy(policy: MerchantPolicy): Promise<MerchantPolicy>;
  updatePolicy(updates: Partial<MerchantPolicy>, changeSummary: string, actor?: string): Promise<MerchantPolicy>;
  getPolicyHistory(): Promise<PolicyVersionHistoryItem[]>;
  addHistoryItem(item: PolicyVersionHistoryItem): Promise<void>;
  resetToInitial(): Promise<{ activePolicy: MerchantPolicy; history: PolicyVersionHistoryItem[] }>;
}

export class MockPolicyRepository implements IPolicyRepository {
  public async getActivePolicy(): Promise<MerchantPolicy> {
    return BrowserStorage.getItem<MerchantPolicy>(STORAGE_KEYS.MERCHANT_POLICY, INITIAL_MERCHANT_POLICY);
  }

  public async saveActivePolicy(policy: MerchantPolicy): Promise<MerchantPolicy> {
    BrowserStorage.setItem(STORAGE_KEYS.MERCHANT_POLICY, policy);
    return policy;
  }

  public async updatePolicy(updates: Partial<MerchantPolicy>, changeSummary: string, actor: string = "Merchant Admin"): Promise<MerchantPolicy> {
    const current = await this.getActivePolicy();
    const merged = { ...current, ...updates, changeSummary, updatedBy: actor };
    return this.saveActivePolicy(merged);
  }

  public async getPolicyHistory(): Promise<PolicyVersionHistoryItem[]> {
    return BrowserStorage.getItem<PolicyVersionHistoryItem[]>(STORAGE_KEYS.POLICY_HISTORY, INITIAL_POLICY_HISTORY);
  }

  public async addHistoryItem(item: PolicyVersionHistoryItem): Promise<void> {
    const history = await this.getPolicyHistory();
    const updated = [item, ...history];
    BrowserStorage.setItem(STORAGE_KEYS.POLICY_HISTORY, updated);
  }

  public async resetToInitial(): Promise<{ activePolicy: MerchantPolicy; history: PolicyVersionHistoryItem[] }> {
    BrowserStorage.setItem(STORAGE_KEYS.MERCHANT_POLICY, INITIAL_MERCHANT_POLICY);
    BrowserStorage.setItem(STORAGE_KEYS.POLICY_HISTORY, INITIAL_POLICY_HISTORY);
    return {
      activePolicy: INITIAL_MERCHANT_POLICY,
      history: INITIAL_POLICY_HISTORY,
    };
  }
}

export interface IMerchantRepository {
  getProfile(): Promise<MerchantProfile>;
  saveProfile(profile: MerchantProfile): Promise<MerchantProfile>;
  resetToInitial(): Promise<MerchantProfile>;
}

export class MockMerchantRepository implements IMerchantRepository {
  public async getProfile(): Promise<MerchantProfile> {
    return BrowserStorage.getItem<MerchantProfile>(STORAGE_KEYS.MERCHANT_PROFILE, INITIAL_MERCHANT_PROFILE);
  }

  public async saveProfile(profile: MerchantProfile): Promise<MerchantProfile> {
    BrowserStorage.setItem(STORAGE_KEYS.MERCHANT_PROFILE, profile);
    return profile;
  }

  public async resetToInitial(): Promise<MerchantProfile> {
    BrowserStorage.setItem(STORAGE_KEYS.MERCHANT_PROFILE, INITIAL_MERCHANT_PROFILE);
    return INITIAL_MERCHANT_PROFILE;
  }
}
