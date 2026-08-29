import { ICaseRepository, MockCaseRepository } from "./caseRepository";
import { IPolicyRepository, MockPolicyRepository, IMerchantRepository, MockMerchantRepository } from "./policyRepository";
import { IAuditRepository, MockAuditRepository } from "./auditRepository";
import { ICampaignRepository, MockCampaignRepository, ICommunicationRepository, MockCommunicationRepository } from "./campaignRepository";
import { defaultRecoveryExecutor, RecoveryExecutor } from "../recovery/recoveryExecutor";
import { defaultVerificationService, VerificationService } from "../recovery/verificationService";

export interface AppServices {
  caseRepo: ICaseRepository;
  policyRepo: IPolicyRepository;
  merchantRepo: IMerchantRepository;
  auditRepo: IAuditRepository;
  campaignRepo: ICampaignRepository;
  communicationRepo: ICommunicationRepository;
  recoveryExecutor: RecoveryExecutor;
  verificationService: VerificationService;
}

class ServiceFactory {
  private static instance: AppServices;

  public static getServices(): AppServices {
    if (!this.instance) {
      this.instance = {
        caseRepo: new MockCaseRepository(),
        policyRepo: new MockPolicyRepository(),
        merchantRepo: new MockMerchantRepository(),
        auditRepo: new MockAuditRepository(),
        campaignRepo: new MockCampaignRepository(),
        communicationRepo: new MockCommunicationRepository(),
        recoveryExecutor: defaultRecoveryExecutor,
        verificationService: defaultVerificationService,
      };
    }
    return this.instance;
  }
}

export const services = ServiceFactory.getServices();
