from ..core.errors import CaseNotFoundError, DuplicateActionError, PolicyValidationError, RecoveryExecutionError, ServiceUnavailableError
from ..engines import *
from ..repositories import store
from ..schemas import *

class Services:
    policy_engine, decision_engine, safety, executor, verifier, metrics = PolicyEngine(), DecisionEngine(), SafetyController(), MockRecoveryExecutor(), MockVerificationService(), MetricsEngine()
    def audit(self, event_type: str, **kwargs) -> AuditEvent:
        event = AuditEvent(event_type=event_type, **kwargs); store.events.append(event); return event
    def case(self, case_id: str) -> Case:
        case = store.get(case_id)
        if not case: raise CaseNotFoundError()
        return case
    def policy(self) -> PolicyVersion: return next(item for item in store.policies if item.active)
    def validate(self, case_id: str) -> PolicyValidationResponse:
        if store.failures.get("policy") == "unavailable": raise ServiceUnavailableError("Policy engine is unavailable.")
        result = self.policy_engine.validate(self.case(case_id), self.policy()); self.audit("POLICY_APPROVED" if result.allowed else "POLICY_BLOCKED", case_id=case_id, policy_version=result.policy_version, metadata={"blocked_rules": result.blocked_rules}); return result
    def decision(self, case_id: str) -> RecoveryDecision: return self.decision_engine.decide(self.case(case_id), self.validate(case_id))
    def action(self, case_id: str, request: RecoveryActionRequest, key: str) -> RecoveryAction:
        if not key: raise RecoveryExecutionError("Idempotency-Key header is required.")
        if key in store.idempotency: return store.actions[store.idempotency[key]]
        case, policy = self.case(case_id), self.validate(case_id)
        if not policy.allowed: raise PolicyValidationError(details={"blocked_rules": policy.blocked_rules})
        if any(a.case_id == case_id and a.status in {ActionStatus.executed, ActionStatus.verification_pending, ActionStatus.verified, ActionStatus.timeout, ActionStatus.unknown} for a in store.actions.values()): raise DuplicateActionError()
        decision = self.decision_engine.decide(case, policy); strategy = request.strategy or decision.strategy
        if strategy == Strategy.no_action: raise RecoveryExecutionError("No automated action is permitted for this case.")
        scenario = request.scenario or case.demo_scenario.lower().replace("c_", "")
        outcome = self.executor.execute(scenario)
        status, tx = self.verifier.verify(scenario if outcome == "executed" else outcome)
        action_status = ActionStatus(status) if status in ActionStatus._value2member_map_ else ActionStatus.executed
        action = RecoveryAction(case_id=case_id, strategy=strategy, status=action_status, policy_version=policy.policy_version, idempotency_key=key, verification_status=status, transaction_id=tx)
        store.actions[action.action_id] = action; store.idempotency[key] = action.action_id
        if status == "verified": case.status, case.recovered_amount = CaseStatus.recovered, case.amount
        elif status in {"timeout", "unknown", "pending"}: case.status = CaseStatus.pending
        else: case.status = CaseStatus.failed
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
services = Services()
