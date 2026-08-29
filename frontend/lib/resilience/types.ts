export type SystemState = 
  | "OPERATIONAL" 
  | "DEGRADED" 
  | "UNAVAILABLE" 
  | "RECOVERING" 
  | "PAUSED" 
  | "FAILED";

export type ServiceType = 
  | "RISK_ENGINE" 
  | "DECISION_ENGINE" 
  | "POLICY_ENGINE" 
  | "RECOVERY_EXECUTOR" 
  | "VERIFICATION_SERVICE" 
  | "AUDIT_SERVICE" 
  | "COMMUNICATION_SERVICE" 
  | "CAMPAIGN_ORCHESTRATOR";

export type FailureClassification = 
  | "POLICY_FAILURE" 
  | "EXECUTION_FAILURE" 
  | "VERIFICATION_FAILURE" 
  | "VERIFICATION_TIMEOUT" 
  | "COMMUNICATION_FAILURE" 
  | "AUDIT_FAILURE" 
  | "NETWORK_TIMEOUT" 
  | "DUPLICATE_REQUEST" 
  | "CAMPAIGN_FAILURE" 
  | "UNKNOWN_FAILURE";

export type FailureSeverity = 
  | "LOW" 
  | "MEDIUM" 
  | "HIGH" 
  | "CRITICAL";

export interface ServiceHealth {
  service: ServiceType;
  name: string;
  layer: string;
  status: SystemState;
  failureReason?: string;
  recoverable: boolean;
  affectedOperations: string[];
  safeOperations: string[];
  lastUpdated: string;
  latencyMs: number;
}

export interface SafetyCheckResult {
  allowed: boolean;
  blockingService?: ServiceType;
  failureType?: FailureClassification;
  reason: string;
  requiredAction?: string;
  severity?: FailureSeverity;
  userFacingMessage: string;
}

export interface FailureScenarioResult {
  scenarioId: string;
  title: string;
  failedComponent: string;
  severity: FailureSeverity;
  reclaimDid: string[];
  reclaimDidNot: string[];
  finalCaseState: string;
  financialImpact: string;
  auditEventsCreated: string[];
  recoveryPath: string;
}

export interface FailureScenarioConfig {
  id: string;
  title: string;
  description: string;
  failureType: FailureClassification;
  severity: FailureSeverity;
  targetService: ServiceType;
  simulatedError: string;
  expectedState: string;
  financialImpact: string;
  recoveryPath: string;
}
