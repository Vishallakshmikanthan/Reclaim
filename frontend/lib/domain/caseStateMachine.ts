import { Case, CaseStatus } from "../types";
import { InvalidStateTransitionError } from "../errors/AppError";

const VALID_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  atRisk: ["executing", "inProgress", "escalated", "stopped", "blocked"],
  inProgress: ["executing", "escalated", "stopped", "blocked", "recovered"],
  executing: ["recovered", "failed", "escalated", "stopped", "inProgress", "blocked"],
  escalated: ["executing", "recovered", "stopped", "inProgress"],
  failed: ["executing", "escalated", "stopped", "inProgress"],
  blocked: ["executing", "escalated", "stopped", "inProgress"],
  recovered: [], // Terminal financial state
  stopped: ["escalated", "inProgress"], // Terminal unless explicitly reopened
  pending: ["atRisk", "executing", "inProgress", "escalated", "stopped"],
};

export function canTransitionCase(currentStatus: CaseStatus, targetStatus: CaseStatus): boolean {
  if (currentStatus === targetStatus) return true;
  const allowed = VALID_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(targetStatus) : false;
}

export function transitionCase(
  caseItem: Case, 
  targetStatus: CaseStatus, 
  updates: Partial<Case> = {}
): Case {
  if (!canTransitionCase(caseItem.status, targetStatus)) {
    throw new InvalidStateTransitionError(caseItem.status, targetStatus);
  }

  return {
    ...caseItem,
    ...updates,
    status: targetStatus,
    updatedAt: new Date().toISOString(),
  };
}
