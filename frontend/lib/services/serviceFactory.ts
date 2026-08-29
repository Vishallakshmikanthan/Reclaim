import { ICaseRepository, MockCaseRepository } from "./caseRepository";
import { IPolicyRepository, MockPolicyRepository, IMerchantRepository, MockMerchantRepository } from "./policyRepository";
import { IAuditRepository, MockAuditRepository } from "./auditRepository";
import { ICampaignRepository, MockCampaignRepository, ICommunicationRepository, MockCommunicationRepository } from "./campaignRepository";
import { defaultRecoveryExecutor, RecoveryExecutor } from "../recovery/recoveryExecutor";
import { defaultVerificationService, VerificationService } from "../recovery/verificationService";

import { HttpCaseRepository } from "./http/HttpCaseRepository";
import { HttpPolicyRepository } from "./http/HttpPolicyRepository";
import { HttpAuditRepository } from "./http/HttpAuditRepository";
import { HttpCampaignRepository } from "./http/HttpCampaignRepository";
import { HttpCommunicationRepository } from "./http/HttpCommunicationRepository";
import { HttpRecoveryExecutor } from "./http/HttpRecoveryExecutor";
import { HttpVerificationService } from "./http/HttpVerificationService";

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
      const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

      if (useMocks) {
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
      } else {
        this.instance = {
          caseRepo: new HttpCaseRepository(),
          policyRepo: new HttpPolicyRepository(),
          merchantRepo: new MockMerchantRepository(), // Assuming no backend for merchant yet
          auditRepo: new HttpAuditRepository(),
          campaignRepo: new HttpCampaignRepository(),
          communicationRepo: new HttpCommunicationRepository(),
          recoveryExecutor: defaultRecoveryExecutor, // Enforce no mutation step 17b
          verificationService: new HttpVerificationService(),
        };
      }
    }
    return this.instance;
  }
}

export const services = ServiceFactory.getServices();
