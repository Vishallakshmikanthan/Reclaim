import { Case, RecoveryDecision } from "../types";
import { synthesizeDecision, extractRiskSignals } from "./decision-engine";

export { extractRiskSignals };

export function getRecoveryDecision(caseItem: Case): RecoveryDecision {
  return synthesizeDecision(caseItem);
}
