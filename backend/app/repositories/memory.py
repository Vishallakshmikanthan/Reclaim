"""Repository boundary; replace this store with PostgreSQL repositories in Step 16."""
from abc import ABC, abstractmethod
from ..schemas import *

class CaseRepository(ABC):
    @abstractmethod
    def get(self, case_id: str) -> Case | None: ...
class PolicyRepository(ABC): pass
class CampaignRepository(ABC): pass
class AuditRepository(ABC): pass
class CommunicationRepository(ABC): pass
class EvaluationRepository(ABC): pass
class AppStore(CaseRepository, PolicyRepository, CampaignRepository, AuditRepository, CommunicationRepository, EvaluationRepository):
    def __init__(self):
        self.cases: dict[str, Case] = {}
        self.actions: dict[str, RecoveryAction] = {}
        self.idempotency: dict[str, str] = {}
        self.campaigns: dict[str, Campaign] = {}
        self.communications: dict[str, Communication] = {}
        self.events: list[AuditEvent] = []
        self.evaluations: dict[str, EvaluationRun] = {}
        self.failures: dict[str, str] = {}
        self.policies: list[PolicyVersion] = [PolicyVersion(version="v1", created_by="system", active=True, configuration=PolicyConfiguration())]
    def get(self, case_id: str) -> Case | None: return self.cases.get(case_id)
    def dashboard_metrics(self) -> DashboardMetrics:
        cases = list(self.cases.values())
        total = len(cases)
        rec_cases = [c for c in cases if str(c.status).lower().endswith("recovered")]
        rec_revenue = sum(c.recovered_amount or c.amount for c in rec_cases)
        at_risk = sum(c.amount for c in cases if not str(c.status).lower().endswith("recovered"))
        rate = float(round((len(rec_cases)/total * 100), 1)) if total > 0 else 0.0
        return DashboardMetrics(
            revenue_at_risk=at_risk,
            revenue_recovered=rec_revenue,
            unrecovered_revenue=at_risk,
            recovery_rate=rate,
            cases_resolved_ratio=rate,
            average_recovered_amount=int(rec_revenue // len(rec_cases)) if rec_cases else 0,
            active_at_risk_count=len([c for c in cases if str(c.status).lower().endswith("at_risk")]),
            in_progress_count=len([c for c in cases if str(c.status).lower().endswith("in_progress")]),
            recovered_count=len(rec_cases),
            escalated_count=len([c for c in cases if str(c.status).lower().endswith("escalated")]),
            stopped_count=len([c for c in cases if str(c.status).lower().endswith("stopped")]),
            total_cases=total,
            policy_blocks=0,
            failed_payments=total,
            recovery_actions=len(self.actions)
        )
class InMemoryCaseRepository(AppStore): pass
class InMemoryPolicyRepository(AppStore): pass
class InMemoryCampaignRepository(AppStore): pass
class InMemoryAuditRepository(AppStore): pass
class InMemoryCommunicationRepository(AppStore): pass
class InMemoryEvaluationRepository(AppStore): pass
store = AppStore()
