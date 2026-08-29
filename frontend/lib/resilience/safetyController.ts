import { Case } from "../types";
import { ServiceHealth, ServiceType, SafetyCheckResult, FailureClassification } from "./types";

/**
 * Deterministic Safety Controller
 * Validates service health, idempotency, and state machine transitions before any financial action.
 */
export function evaluateSafetyBeforeExecution(
  caseItem: Case,
  serviceHealth: Record<ServiceType, ServiceHealth>,
  activeExecutionIds: string[]
): SafetyCheckResult {
  
  // 1. Idempotency Lock Check
  if (activeExecutionIds.includes(caseItem.id)) {
    return {
      allowed: false,
      failureType: "DUPLICATE_REQUEST",
      reason: "Recovery action is already in progress for this incident. Concurrent duplicate suppressed.",
      severity: "LOW",
      requiredAction: "Await completion of active execution",
      userFacingMessage: "Duplicate recovery request prevented. Action already executing in background.",
    };
  }

  // 2. Terminal State Validation
  if (caseItem.status === "recovered") {
    return {
      allowed: false,
      failureType: "DUPLICATE_REQUEST",
      reason: `Case ${caseItem.id} is already settled. Duplicate debit prohibited.`,
      severity: "LOW",
      requiredAction: "None (Case already settled)",
      userFacingMessage: "This incident is already settled. Further payment actions are blocked.",
    };
  }

  // 3. Policy Engine Health Check (CRITICAL)
  const policyHealth = serviceHealth.POLICY_ENGINE;
  if (policyHealth && policyHealth.status !== "OPERATIONAL") {
    return {
      allowed: false,
      blockingService: "POLICY_ENGINE",
      failureType: "POLICY_FAILURE",
      reason: `Policy Engine is ${policyHealth.status}: ${policyHealth.failureReason || "Service offline"}. Financial action blocked.`,
      severity: "CRITICAL",
      requiredAction: "Retry Policy Check or Restore Policy Engine",
      userFacingMessage: "Recovery paused. Policy validation is unavailable. Financial actions require deterministic authorization.",
    };
  }

  // 4. Audit Service Health Check (CRITICAL)
  const auditHealth = serviceHealth.AUDIT_SERVICE;
  if (auditHealth && auditHealth.status !== "OPERATIONAL") {
    return {
      allowed: false,
      blockingService: "AUDIT_SERVICE",
      failureType: "AUDIT_FAILURE",
      reason: `Audit Service is ${auditHealth.status}: ${auditHealth.failureReason || "Service offline"}. Financial action blocked.`,
      severity: "CRITICAL",
      requiredAction: "Restore Audit Service before attempting recovery",
      userFacingMessage: "Recovery paused. Audit recording is unavailable. Financial actions require an immutable audit trail.",
    };
  }

  // 5. Verification Service Health Check (HIGH)
  const verifyHealth = serviceHealth.VERIFICATION_SERVICE;
  if (verifyHealth && verifyHealth.status === "UNAVAILABLE") {
    return {
      allowed: false,
      blockingService: "VERIFICATION_SERVICE",
      failureType: "VERIFICATION_FAILURE",
      reason: `Verification Service is UNAVAILABLE: ${verifyHealth.failureReason || "Gateway telemetry offline"}.`,
      severity: "HIGH",
      requiredAction: "Restore Verification Service or Escalate to Human Reconciliation",
      userFacingMessage: "Verification service is unavailable. Settlement status cannot be confirmed, so automated execution is paused.",
    };
  }

  // 6. Recovery Executor Health Check
  const executorHealth = serviceHealth.RECOVERY_EXECUTOR;
  if (executorHealth && executorHealth.status === "UNAVAILABLE") {
    return {
      allowed: false,
      blockingService: "RECOVERY_EXECUTOR",
      failureType: "EXECUTION_FAILURE",
      reason: `Recovery Executor is UNAVAILABLE: ${executorHealth.failureReason || "Gateway connection failed"}.`,
      severity: "HIGH",
      requiredAction: "Fallback to Multi-Channel Link or Escalate",
      userFacingMessage: "Gateway execution service is currently unavailable. Primary retry cannot be dispatched.",
    };
  }

  // All safety checks passed
  return {
    allowed: true,
    reason: "All 6 safety guardrails and critical dependencies verified.",
    userFacingMessage: "Safety validated. Proceeding to recovery execution.",
  };
}
