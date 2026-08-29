import { ServiceHealth, ServiceType, SystemState, FailureSeverity } from "./types";

export const INITIAL_SERVICE_HEALTH: Record<ServiceType, ServiceHealth> = {
  RISK_ENGINE: {
    service: "RISK_ENGINE",
    name: "Risk & ML Scorer",
    layer: "Layer 1",
    status: "OPERATIONAL",
    recoverable: true,
    affectedOperations: ["ML probability calculation", "Fraud score calibration"],
    safeOperations: ["Historical audit inspection", "Manual triage", "Static policy checks"],
    lastUpdated: "Just now",
    latencyMs: 14,
  },
  DECISION_ENGINE: {
    service: "DECISION_ENGINE",
    name: "AI Decision Intelligence",
    layer: "Layer 2",
    status: "OPERATIONAL",
    recoverable: true,
    affectedOperations: ["Dynamic intervention synthesis", "Multi-step strategy generation"],
    safeOperations: ["Deterministic fallback retries", "Policy evaluation", "Audit browsing"],
    lastUpdated: "Just now",
    latencyMs: 420,
  },
  POLICY_ENGINE: {
    service: "POLICY_ENGINE",
    name: "Deterministic Policy Guardrails",
    layer: "Layer 3",
    status: "OPERATIONAL",
    recoverable: true,
    affectedOperations: ["All autonomous recovery executions", "Customer communication dispatch"],
    safeOperations: ["Case inspection", "Historical analytics", "Audit ledger review"],
    lastUpdated: "Just now",
    latencyMs: 3,
  },
  RECOVERY_EXECUTOR: {
    service: "RECOVERY_EXECUTOR",
    name: "Razorpay Test Recovery Executor",
    layer: "Layer 4",
    status: "OPERATIONAL",
    recoverable: true,
    affectedOperations: ["Instant payment retries", "Mandate debit dispatches"],
    safeOperations: ["Case triage", "Policy validation", "Communication preview"],
    lastUpdated: "Just now",
    latencyMs: 180,
  },
  VERIFICATION_SERVICE: {
    service: "VERIFICATION_SERVICE",
    name: "Gateway Verification & Webhook Telemetry",
    layer: "Layer 5",
    status: "OPERATIONAL",
    recoverable: true,
    affectedOperations: ["Recovery confirmation", "Revenue settlement ledger updating"],
    safeOperations: ["Case diagnosis", "Strategy planning", "Policy evaluation"],
    lastUpdated: "Just now",
    latencyMs: 95,
  },
  AUDIT_SERVICE: {
    service: "AUDIT_SERVICE",
    name: "Immutable Audit Ledger",
    layer: "Layer 5",
    status: "OPERATIONAL",
    recoverable: true,
    affectedOperations: ["All state-modifying actions", "Financial settlement recordings"],
    safeOperations: ["Read-only case browsing"],
    lastUpdated: "Just now",
    latencyMs: 8,
  },
  COMMUNICATION_SERVICE: {
    service: "COMMUNICATION_SERVICE",
    name: "Multi-Channel Communication Dispatcher",
    layer: "Layer 4",
    status: "OPERATIONAL",
    recoverable: true,
    affectedOperations: ["WhatsApp recovery links", "SMS payment nudges", "Email dunning"],
    safeOperations: ["In-app dashboard", "Gateway auto-retries", "Audit inspection"],
    lastUpdated: "Just now",
    latencyMs: 64,
  },
  CAMPAIGN_ORCHESTRATOR: {
    service: "CAMPAIGN_ORCHESTRATOR",
    name: "Batch Recovery Campaign Engine",
    layer: "Orchestration",
    status: "OPERATIONAL",
    recoverable: true,
    affectedOperations: ["Batch execution loops", "Cohort progression"],
    safeOperations: ["Individual case triage", "Single-case recovery", "Policy checks"],
    lastUpdated: "Just now",
    latencyMs: 32,
  },
};

export function injectServiceFailure(
  current: Record<ServiceType, ServiceHealth>,
  service: ServiceType,
  reason: string,
  severity: FailureSeverity
): Record<ServiceType, ServiceHealth> {
  return {
    ...current,
    [service]: {
      ...current[service],
      status: severity === "CRITICAL" ? "UNAVAILABLE" : "DEGRADED",
      failureReason: reason,
      lastUpdated: "Just now (Simulated Failure)",
    },
  };
}

export function restoreServiceHealth(
  current: Record<ServiceType, ServiceHealth>,
  service: ServiceType
): Record<ServiceType, ServiceHealth> {
  return {
    ...current,
    [service]: {
      ...current[service],
      status: "OPERATIONAL",
      failureReason: undefined,
      lastUpdated: "Restored just now",
    },
  };
}

export function restoreAllServices(): Record<ServiceType, ServiceHealth> {
  return INITIAL_SERVICE_HEALTH;
}
