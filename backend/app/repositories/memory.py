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
class InMemoryCaseRepository(AppStore): pass
class InMemoryPolicyRepository(AppStore): pass
class InMemoryCampaignRepository(AppStore): pass
class InMemoryAuditRepository(AppStore): pass
class InMemoryCommunicationRepository(AppStore): pass
class InMemoryEvaluationRepository(AppStore): pass
store = AppStore()
