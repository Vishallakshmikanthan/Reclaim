from ..core.errors import CaseNotFoundError, DuplicateActionError, PolicyValidationError, RecoveryExecutionError, ServiceUnavailableError
from ..engines import *
from ..schemas import *

class Services:
    policy_engine, decision_engine, safety, executor, verifier, metrics = PolicyEngine(), DecisionEngine(), SafetyController(), MockRecoveryExecutor(), MockVerificationService(), MetricsEngine()
    def __init__(self, repo): self.repo=repo; self.failures={}
    def audit(self, event_type: str, **kwargs) -> AuditEvent:
        return self.repo.audit(AuditEvent(event_type=event_type, **kwargs))
    def case(self, case_id: str) -> Case:
        case = self.repo.get_case(case_id)
        if not case: raise CaseNotFoundError()
        return case
    def policy(self) -> PolicyVersion:
        policy=self.repo.active_policy()
        if not policy: raise ServiceUnavailableError("No active policy is configured.")
        return policy
    def validate(self, case_id: str) -> PolicyValidationResponse:
        if self.failures.get("policy") == "unavailable": raise ServiceUnavailableError("Policy engine is unavailable.")
        result = self.policy_engine.validate(self.case(case_id), self.policy()); self.audit("POLICY_APPROVED" if result.allowed else "POLICY_BLOCKED", case_id=case_id, policy_version=result.policy_version, metadata={"blocked_rules": result.blocked_rules}); return result
    def decision(self, case_id: str) -> RecoveryDecision: return self.decision_engine.decide(self.case(case_id), self.validate(case_id))
    def action(self, case_id: str, request: RecoveryActionRequest, key: str) -> RecoveryAction:
        if not key: raise RecoveryExecutionError("Idempotency-Key header is required.")
        existing = self.repo.action_for_key(key)
        if existing: return existing
        case = self.repo.get_case_for_update(case_id)
        if not case: raise CaseNotFoundError()
        existing_again = self.repo.action_for_key(key)
        if existing_again: return existing_again
        policy = self.validate(case_id)
        if not policy.allowed: raise PolicyValidationError(details={"blocked_rules": policy.blocked_rules})
        if self.repo.action_exists_for_case(case_id): raise DuplicateActionError()
        decision = self.decision_engine.decide(case, policy); strategy = request.strategy or decision.strategy
        if strategy == Strategy.no_action: raise RecoveryExecutionError("No automated action is permitted for this case.")
        scenario = request.scenario or case.demo_scenario.lower().replace("c_", "")
        outcome = self.executor.execute(scenario)
        status, tx = self.verifier.verify(scenario if outcome == "executed" else outcome)
        action_status = ActionStatus(status) if status in ActionStatus._value2member_map_ else ActionStatus.executed
        action = RecoveryAction(case_id=case_id, strategy=strategy, status=action_status, policy_version=policy.policy_version, idempotency_key=key, verification_status=status, transaction_id=tx)
        self.repo.create_action(action, case.amount)
        if status == "verified": case.status, case.recovered_amount = CaseStatus.recovered, case.amount
        elif status in {"timeout", "unknown", "pending"}: case.status = CaseStatus.pending
        else: case.status = CaseStatus.failed
        self.repo.save_case(case)
        self.audit("RECOVERY_VERIFIED" if status == "verified" else "VERIFICATION_TIMEOUT" if status == "timeout" else "RECOVERY_FAILED", case_id=case_id, policy_version=policy.policy_version, metadata={"action_id": action.action_id, "verification": status})
        return action
class CaseService(Services): pass
class RecoveryService(Services): pass
class PolicyService(Services): pass
class CampaignService(Services): pass
class CommunicationService(Services): pass
class AuditService(Services): pass
class EvaluationService(Services): pass
class SystemHealthService(Services): pass
