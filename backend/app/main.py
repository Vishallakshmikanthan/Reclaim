from fastapi import FastAPI, Header, Query
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .core.config import get_settings
from .core.errors import AppError, app_error_handler, CaseNotFoundError, ServiceUnavailableError
from .repositories import store
from .schemas import *
from .services import services

settings = get_settings()
app = FastAPI(title=settings.app_name, description="Revenue recovery orchestration API", version=settings.app_version)
app.add_middleware(CORSMiddleware, allow_origins=settings.origins, allow_credentials=True, allow_methods=["GET", "POST", "PUT", "OPTIONS"], allow_headers=["Content-Type", "Idempotency-Key"])
app.add_exception_handler(AppError, app_error_handler)
@app.exception_handler(RequestValidationError)
async def validation_error(_, exc): return JSONResponse(status_code=422, content={"error": {"code": "VALIDATION_ERROR", "message": "Request validation failed.", "details": {"errors": exc.errors()}}})
@app.get("/health")
def health(): return {"status": "ok", "service": "reclaim-api", "version": settings.app_version}
@app.get("/ready")
def ready(): return {"status": "ready"}

@app.get("/api/v1/cases", response_model=CaseListResponse)
def list_cases(status: CaseStatus | None = None, failure_type: FailureType | None = None, priority: str | None = None, page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=100)):
    items = list(store.cases.values())
    if status: items = [item for item in items if item.status == status]
    if failure_type: items = [item for item in items if item.failure_type == failure_type]
    if priority: items = [item for item in items if ("Critical" if item.amount > 500000 else "High" if item.prob > .5 else "Medium").lower() == priority.lower()]
    start = (page - 1) * page_size; return CaseListResponse(items=items[start:start+page_size], page=page, page_size=page_size, total=len(items))
@app.post("/api/v1/cases", response_model=CaseResponse, status_code=201)
def create_case(payload: CaseCreateRequest):
    if payload.id in store.cases: return JSONResponse(status_code=409, content={"error": {"code":"CASE_EXISTS", "message":"Case already exists.", "details":{}}})
    store.cases[payload.id] = payload; services.audit("CASE_CREATED", case_id=payload.id); return payload
@app.get("/api/v1/cases/{case_id}", response_model=CaseResponse)
def get_case(case_id: str): return services.case(case_id)
@app.post("/api/v1/cases/{case_id}/recovery/decision", response_model=RecoveryDecisionResponse)
def recovery_decision(case_id: str): return services.decision(case_id)
@app.post("/api/v1/cases/{case_id}/recovery/actions", response_model=RecoveryActionResponse)
def recovery_action(case_id: str, payload: RecoveryActionRequest, idempotency_key: str = Header(..., alias="Idempotency-Key")): return services.action(case_id, payload, idempotency_key)
@app.get("/api/v1/cases/{case_id}/audit", response_model=AuditEventListResponse)
def case_audit(case_id: str):
    services.case(case_id); items = [event for event in store.events if event.case_id == case_id]; return AuditEventListResponse(items=items, total=len(items))

@app.get("/api/v1/policies/current", response_model=PolicyResponse)
def current_policy(): return services.policy()
@app.get("/api/v1/policies/versions", response_model=list[PolicyVersionResponse])
def policy_versions(): return store.policies
@app.post("/api/v1/policies/validate", response_model=PolicyValidationResponse)
def validate_policy(payload: PolicyValidationRequest): return services.validate(payload.case_id)
@app.put("/api/v1/policies/current", response_model=PolicyResponse)
def update_policy(payload: PolicyUpdateRequest):
    current = services.policy(); current.active = False; version = PolicyVersion(version=f"v{len(store.policies)+1}", created_by=payload.created_by, configuration=payload.configuration, active=True); store.policies.append(version); services.audit("POLICY_UPDATED", policy_version=version.version, actor=payload.created_by); return version

@app.get("/api/v1/audit/events", response_model=AuditEventListResponse)
def audit_events(): return AuditEventListResponse(items=store.events, total=len(store.events))
@app.get("/api/v1/campaigns", response_model=list[CampaignResponse])
def campaigns(): return list(store.campaigns.values())
@app.post("/api/v1/campaigns", response_model=CampaignResponse, status_code=201)
def create_campaign(payload: CampaignCreateRequest):
    campaign = Campaign(**payload.model_dump()); store.campaigns[campaign.id] = campaign; services.audit("CAMPAIGN_CREATED", campaign_id=campaign.id); return campaign
@app.get("/api/v1/campaigns/{campaign_id}", response_model=CampaignResponse)
def get_campaign(campaign_id: str):
    if campaign_id not in store.campaigns: raise CaseNotFoundError("Campaign not found.")
    return store.campaigns[campaign_id]
def campaign_transition(campaign_id: str, status: CampaignStatus, message: str):
    campaign = get_campaign(campaign_id); campaign.status = status; services.audit("CAMPAIGN_" + status.value, campaign_id=campaign_id); return CampaignExecutionResponse(campaign_id=campaign_id, status=status, message=message)
@app.post("/api/v1/campaigns/{campaign_id}/start", response_model=CampaignExecutionResponse)
def start_campaign(campaign_id: str): return campaign_transition(campaign_id, CampaignStatus.running, "Campaign started in simulation mode.")
@app.post("/api/v1/campaigns/{campaign_id}/pause", response_model=CampaignExecutionResponse)
def pause_campaign(campaign_id: str): return campaign_transition(campaign_id, CampaignStatus.paused, "Campaign paused.")
@app.post("/api/v1/campaigns/{campaign_id}/resume", response_model=CampaignExecutionResponse)
def resume_campaign(campaign_id: str): return campaign_transition(campaign_id, CampaignStatus.running, "Campaign resumed.")
@app.get("/api/v1/campaigns/{campaign_id}/audit", response_model=AuditEventListResponse)
def campaign_audit(campaign_id: str):
    get_campaign(campaign_id); items = [event for event in store.events if event.campaign_id == campaign_id]; return AuditEventListResponse(items=items, total=len(items))

@app.post("/api/v1/communications", response_model=CommunicationResponse, status_code=201)
def communicate(payload: CommunicationRequest):
    services.case(payload.case_id); message = Communication(**payload.model_dump()); store.communications[message.id] = message; services.audit("COMMUNICATION_SENT_SIMULATED", case_id=message.case_id, campaign_id=message.campaign_id, metadata={"communication_id":message.id}); return message
@app.get("/api/v1/communications", response_model=list[CommunicationResponse])
def communications(): return list(store.communications.values())
@app.get("/api/v1/communications/{communication_id}", response_model=CommunicationResponse)
def get_communication(communication_id: str):
    if communication_id not in store.communications: raise CaseNotFoundError("Communication not found.")
    return store.communications[communication_id]

@app.post("/api/v1/evaluation/runs", response_model=EvaluationRun, status_code=201)
def evaluation_run():
    run = EvaluationRun(metrics=services.metrics.run(list(store.cases.values()))); store.evaluations[run.run_id] = run; services.audit("EVALUATION_RUN_COMPLETED", metadata={"run_id":run.run_id}); return run
@app.get("/api/v1/evaluation/runs", response_model=list[EvaluationRun])
def evaluation_runs(): return list(store.evaluations.values())
@app.get("/api/v1/evaluation/runs/{run_id}", response_model=EvaluationRun)
def get_evaluation(run_id: str):
    if run_id not in store.evaluations: raise CaseNotFoundError("Evaluation run not found.")
    return store.evaluations[run_id]
@app.get("/api/v1/system/health", response_model=SystemHealth)
def system_health(): return SystemHealth(status="ok", services={name: "unavailable" if store.failures.get(key) == "unavailable" else "ready" for name, key in {"Decision Engine":"decision", "Policy Engine":"policy", "Recovery Executor":"executor", "Verification":"verification", "Audit":"audit", "Communication":"communication", "Campaign Orchestrator":"campaign"}.items()})
@app.post("/api/v1/development/failures", response_model=FailureEvent)
def simulate_failure(payload: FailureEvent):
    if settings.environment not in {"development", "demo"}: raise ServiceUnavailableError("Failure simulation is disabled outside development/demo.")
    if payload.scenario not in {"unavailable", "failure", "timeout", "duplicate", "unknown", "clear"}: return JSONResponse(status_code=422, content={"error":{"code":"VALIDATION_ERROR","message":"Unsupported simulation scenario.","details":{}}})
    if payload.scenario == "clear": store.failures.pop(payload.service, None)
    else: store.failures[payload.service] = payload.scenario
    services.audit("FAILURE_SIMULATED", metadata=payload.model_dump()); return payload
