import { Campaign, CampaignConfig } from "../campaigns/types";
import { CommunicationMessage } from "../communications/types";
import { BrowserStorage, STORAGE_KEYS } from "../storage/browserStorage";
import { INITIAL_CAMPAIGNS, INITIAL_COMMUNICATIONS } from "../campaigns/campaignService";

export interface ICampaignRepository {
  getAllCampaigns(): Promise<Campaign[]>;
  getCampaignById(id: string): Promise<Campaign | undefined>;
  saveCampaign(campaign: Campaign): Promise<Campaign>;
  resetToInitial(): Promise<Campaign[]>;
}

export class MockCampaignRepository implements ICampaignRepository {
  public async getAllCampaigns(): Promise<Campaign[]> {
    return BrowserStorage.getItem<Campaign[]>(STORAGE_KEYS.CAMPAIGNS, INITIAL_CAMPAIGNS);
  }

  public async getCampaignById(id: string): Promise<Campaign | undefined> {
    const campaigns = await this.getAllCampaigns();
    return campaigns.find((c) => c.id === id);
  }

  public async saveCampaign(campaign: Campaign): Promise<Campaign> {
    const campaigns = await this.getAllCampaigns();
    const index = campaigns.findIndex((c) => c.id === campaign.id);
    let updated: Campaign[];
    if (index >= 0) {
      updated = [...campaigns];
      updated[index] = campaign;
    } else {
      updated = [campaign, ...campaigns];
    }
    BrowserStorage.setItem(STORAGE_KEYS.CAMPAIGNS, updated);
    return campaign;
  }

  public async resetToInitial(): Promise<Campaign[]> {
    BrowserStorage.setItem(STORAGE_KEYS.CAMPAIGNS, INITIAL_CAMPAIGNS);
    return INITIAL_CAMPAIGNS;
  }
}

export interface ICommunicationRepository {
  getAllCommunications(): Promise<CommunicationMessage[]>;
  addCommunication(msg: CommunicationMessage): Promise<CommunicationMessage>;
  resetToInitial(): Promise<CommunicationMessage[]>;
}

export class MockCommunicationRepository implements ICommunicationRepository {
  public async getAllCommunications(): Promise<CommunicationMessage[]> {
    return BrowserStorage.getItem<CommunicationMessage[]>(STORAGE_KEYS.COMMUNICATIONS, INITIAL_COMMUNICATIONS);
  }

  public async addCommunication(msg: CommunicationMessage): Promise<CommunicationMessage> {
    const comms = await this.getAllCommunications();
    const updated = [msg, ...comms];
    BrowserStorage.setItem(STORAGE_KEYS.COMMUNICATIONS, updated);
    return msg;
  }

  public async resetToInitial(): Promise<CommunicationMessage[]> {
    BrowserStorage.setItem(STORAGE_KEYS.COMMUNICATIONS, INITIAL_COMMUNICATIONS);
    return INITIAL_COMMUNICATIONS;
  }
}
