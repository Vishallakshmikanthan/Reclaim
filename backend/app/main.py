from fastapi import Depends, FastAPI, Header, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, OperationalError
from .core.config import get_settings
from .core.errors import AppError, app_error_handler, CaseNotFoundError, ServiceUnavailableError, DuplicateActionError, PolicyValidationError, WebhookVerificationError
from .repositories.factory import repository_context
from .schemas import *
from .services.application import Services

get_settings.cache_clear()
settings=get_settings()
app=FastAPI(title=settings.app_name,description="Revenue recovery orchestration API",version=settings.app_version)
app.add_middleware(CORSMiddleware,allow_origins=settings.origins,allow_credentials=True,allow_methods=["GET","POST","PUT","OPTIONS"],allow_headers=["Content-Type","Idempotency-Key","X-Razorpay-Signature"])
app.add_exception_handler(AppError,app_error_handler)
@app.exception_handler(RequestValidationError)
async def validation_error(_,exc): return JSONResponse(status_code=422,content={"error":{"code":"VALIDATION_ERROR","message":"Request validation failed.","details":{"errors":exc.errors()}}})
@app.exception_handler(OperationalError)
async def database_error(_,__): return JSONResponse(status_code=503,content={"error":{"code":"DATABASE_UNAVAILABLE","message":"Database is unavailable.","details":{}}})
def get_services(x_merchant_id: str | None = Header(None, alias="X-Merchant-Id")):
    with repository_context(merchant_id=x_merchant_id) as repo: yield Services(repo)
@app.get("/health")
def health(): return {"status":"ok","service":"reclaim-api","version":settings.app_version}
@app.get("/ready")
def ready():
    try:
        with repository_context() as repo: repo.ensure_merchant()
        return {"status":"ready"}
    except OperationalError: return JSONResponse(status_code=503,content={"status":"not_ready"})

@app.get("/api/v1/cases",response_model=CaseListResponse)
def list_cases(status:CaseStatus|None=None,failure_type:FailureType|None=None,priority:str|None=None,page:int=Query(1,ge=1),page_size:int=Query(25,ge=1,le=100),svc:Services=Depends(get_services)):
    items,total=svc.repo.list_cases(status,failure_type,priority,page=page,page_size=page_size); return CaseListResponse(items=items,page=page,page_size=page_size,total=total)
@app.post("/api/v1/cases",response_model=CaseResponse,status_code=201)
def create_case(payload:CaseCreateRequest,svc:Services=Depends(get_services)):
    try: result=svc.repo.create_case(payload); svc.audit("CASE_CREATED",case_id=payload.id); return result
    except IntegrityError: raise DuplicateActionError("Case or payment already exists.")
@app.get("/api/v1/cases/{case_id}",response_model=CaseResponse)
def get_case(case_id:str,svc:Services=Depends(get_services)): return svc.case(case_id)
@app.post("/api/v1/cases/{case_id}/recovery/decision",response_model=RecoveryDecisionResponse)
def decision(case_id:str,svc:Services=Depends(get_services)): return svc.decision(case_id)
@app.post("/api/v1/cases/{case_id}/recovery/actions",response_model=RecoveryActionResponse)
def action(case_id:str,payload:RecoveryActionRequest,idempotency_key:str=Header(...,alias="Idempotency-Key"),svc:Services=Depends(get_services)):
    try: return svc.action(case_id,payload,idempotency_key)
    except IntegrityError: svc.repo.session.rollback(); existing=svc.repo.action_for_key(idempotency_key); return existing if existing else (_ for _ in ()).throw(DuplicateActionError())
@app.get("/api/v1/recovery/actions/{action_id}",response_model=RecoveryActionResponse)
def get_action(action_id:str,svc:Services=Depends(get_services)):
    action_item=svc.repo.get_action(action_id)
    if not action_item: raise CaseNotFoundError("Recovery action not found.")
    return action_item
@app.post("/api/v1/recovery/actions/{action_id}/reconcile",response_model=ReconciliationResponse)
def reconcile_action(action_id:str,svc:Services=Depends(get_services)):
    return svc.reconcile_action(action_id)
@app.post("/api/v1/webhooks/razorpay",response_model=WebhookResponse)
async def razorpay_webhook(request:Request,x_razorpay_signature:str|None=Header(None,alias="X-Razorpay-Signature"),svc:Services=Depends(get_services)):
    body=await request.body()
    return svc.process_razorpay_webhook(raw_body=body,signature_header=x_razorpay_signature)
@app.get("/api/v1/cases/{case_id}/audit",response_model=AuditEventListResponse)
def case_audit(case_id:str,page:int=Query(1,ge=1),page_size:int=Query(100,ge=1,le=200),svc:Services=Depends(get_services)):
    svc.case(case_id);items,total=svc.repo.events(case_id=case_id,page=page,page_size=page_size);return AuditEventListResponse(items=items,total=total)

# ============================================================
# STEP 20 RECOVERY QUEUE & BATCH ORCHESTRATION ENDPOINTS
# ============================================================

@app.get("/api/v1/recovery/queue",response_model=RecoveryQueueResponse)
def recovery_queue(
    status:CaseStatus|None=None,
    failure_type:FailureType|None=None,
    priority:str|None=None,
    min_amount:int|None=None,
    max_amount:int|None=None,
    eligible_only:bool=Query(False),
    page:int=Query(1,ge=1),
    page_size:int=Query(25,ge=1,le=200),
    svc:Services=Depends(get_services)
):
    return svc.get_recovery_queue(
        status=status,
        failure_type=failure_type,
        priority=priority,
        min_amount=min_amount,
        max_amount=max_amount,
        eligible_only=eligible_only,
        page=page,
        page_size=page_size
    )

@app.post("/api/v1/recovery/batches/preview",response_model=BatchPreviewResponse)
def preview_recovery_batch(payload:BatchPreviewRequest,svc:Services=Depends(get_services)):
    return svc.preview_batch(payload)

@app.post("/api/v1/recovery/batches",response_model=BatchExecutionResponse,status_code=201)
def execute_recovery_batch(
    payload:BatchExecutionRequest,
    idempotency_key:str=Header(...,alias="Idempotency-Key"),
    svc:Services=Depends(get_services)
):
    try:
        return svc.execute_batch(payload, idempotency_key=idempotency_key)
    except IntegrityError:
        svc.repo.session.rollback()
        existing = svc.repo.get_batch_by_idempotency_key(idempotency_key)
        if existing:
            return svc.get_batch(existing.id)
        raise DuplicateActionError("Duplicate batch execution detected.")

@app.get("/api/v1/recovery/batches",response_model=list[BatchExecutionResponse])
def list_batches(page:int=Query(1,ge=1),page_size:int=Query(25,ge=1,le=100),svc:Services=Depends(get_services)):
    batches, _ = svc.repo.list_batches(page=page, page_size=page_size)
    return [svc.get_batch(b.id) for b in batches]

@app.get("/api/v1/recovery/batches/{batch_id}",response_model=BatchExecutionResponse)
def get_batch(batch_id:str,svc:Services=Depends(get_services)):
    return svc.get_batch(batch_id)

@app.post("/api/v1/recovery/batches/{batch_id}/cancel",response_model=BatchExecutionResponse)
def cancel_batch(batch_id:str,svc:Services=Depends(get_services)):
    return svc.cancel_batch(batch_id)

@app.get("/api/v1/policies/current",response_model=PolicyResponse)
def policy(svc:Services=Depends(get_services)): return svc.policy()
@app.get("/api/v1/policies/versions",response_model=list[PolicyVersionResponse])
def policies(svc:Services=Depends(get_services)): return svc.repo.policy_versions()
@app.post("/api/v1/policies/validate",response_model=PolicyValidationResponse)
def validate(payload:PolicyValidationRequest,svc:Services=Depends(get_services)): return svc.validate(payload.case_id)
@app.put("/api/v1/policies/current",response_model=PolicyResponse)
def update_policy(payload:PolicyUpdateRequest,svc:Services=Depends(get_services)):
    version=PolicyVersion(version=f"v{len(svc.repo.policy_versions())+1}",created_by=payload.created_by,configuration=payload.configuration,active=True); svc.repo.create_policy(version);svc.audit("POLICY_UPDATED",policy_version=version.version,actor=payload.created_by);return version

@app.get("/api/v1/audit/events",response_model=AuditEventListResponse)
def audit(page:int=Query(1,ge=1),page_size:int=Query(100,ge=1,le=200),svc:Services=Depends(get_services)):
    items,total=svc.repo.events(page=page,page_size=page_size);return AuditEventListResponse(items=items,total=total)
@app.get("/api/v1/campaigns",response_model=list[CampaignResponse])
def campaigns(svc:Services=Depends(get_services)):return svc.repo.campaigns()
@app.post("/api/v1/campaigns",response_model=CampaignResponse,status_code=201)
def create_campaign(payload:CampaignCreateRequest,svc:Services=Depends(get_services)):
    c=Campaign(**payload.model_dump());svc.repo.create_campaign(c);svc.audit("CAMPAIGN_CREATED",campaign_id=c.id);return c
@app.get("/api/v1/campaigns/{campaign_id}",response_model=CampaignResponse)
def campaign(campaign_id:str,svc:Services=Depends(get_services)):
    c=svc.repo.campaign(campaign_id)
    if not c:raise CaseNotFoundError("Campaign not found.")
    return c
def transition(id,status,message,svc):
    c=campaign(id,svc);c.status=status;svc.repo.save_campaign(c);st_val=status.value if hasattr(status,"value") else str(status);svc.audit("CAMPAIGN_"+st_val,campaign_id=id);return CampaignExecutionResponse(campaign_id=id,status=status,message=message)
@app.post("/api/v1/campaigns/{campaign_id}/start",response_model=CampaignExecutionResponse)
def start(campaign_id:str,svc:Services=Depends(get_services)):return transition(campaign_id,CampaignStatus.running,"Campaign started in simulation mode.",svc)
@app.post("/api/v1/campaigns/{campaign_id}/pause",response_model=CampaignExecutionResponse)
def pause(campaign_id:str,svc:Services=Depends(get_services)):return transition(campaign_id,CampaignStatus.paused,"Campaign paused.",svc)
@app.post("/api/v1/campaigns/{campaign_id}/resume",response_model=CampaignExecutionResponse)
def resume(campaign_id:str,svc:Services=Depends(get_services)):return transition(campaign_id,CampaignStatus.running,"Campaign resumed.",svc)
@app.get("/api/v1/campaigns/{campaign_id}/audit",response_model=AuditEventListResponse)
def campaign_audit(campaign_id:str,svc:Services=Depends(get_services)):
    campaign(campaign_id,svc);items,total=svc.repo.events(campaign_id=campaign_id);return AuditEventListResponse(items=items,total=total)

@app.post("/api/v1/communications",response_model=CommunicationResponse,status_code=201)
def communicate(payload:CommunicationRequest,svc:Services=Depends(get_services)):
    case = svc.repo.get_case_for_update(payload.case_id)
    if not case: raise CaseNotFoundError()
    policy = svc.policy()
    if case.contact_count_24h >= policy.configuration.max_contacts_24h:
        raise PolicyValidationError(details={"blocked_rules": ["Customer contact limit reached"]})
    case.contact_count_24h += 1
    svc.repo.save_case(case)
    c=Communication(**payload.model_dump());svc.repo.create_communication(c);svc.audit("COMMUNICATION_SENT_SIMULATED",case_id=c.case_id,campaign_id=c.campaign_id,metadata={"communication_id":c.id});return c
@app.get("/api/v1/communications",response_model=list[CommunicationResponse])
def communications(svc:Services=Depends(get_services)):return svc.repo.communications()
@app.get("/api/v1/communications/{communication_id}",response_model=CommunicationResponse)
def communication(communication_id:str,svc:Services=Depends(get_services)):
    c=svc.repo.communication(communication_id)
    if not c:raise CaseNotFoundError("Communication not found.")
    return c
@app.post("/api/v1/evaluation/runs",response_model=EvaluationRun,status_code=201)
def evaluation(svc:Services=Depends(get_services)):
    cases=svc.repo.get_evaluation_cases();run=EvaluationRun(metrics=svc.metrics.run(cases));svc.repo.create_evaluation(run);svc.audit("EVALUATION_RUN_COMPLETED",metadata={"run_id":run.run_id});return run
@app.get("/api/v1/evaluation/runs",response_model=list[EvaluationRun])
def evaluations(svc:Services=Depends(get_services)):return svc.repo.evaluations()
@app.get("/api/v1/evaluation/runs/{run_id}",response_model=EvaluationRun)
def evaluation_detail(run_id:str,svc:Services=Depends(get_services)):
    run=svc.repo.evaluation(run_id)
    if not run:raise CaseNotFoundError("Evaluation run not found.")
    return run

# ============================================================
# STEP 21 MEASUREMENT & EVIDENCE ENDPOINTS
# ============================================================

@app.get("/api/v1/metrics/funnel", response_model=RecoveryFunnelResponse)
def recovery_funnel(svc: Services = Depends(get_services)):
    return svc.get_recovery_funnel()

@app.get("/api/v1/cases/{case_id}/trace", response_model=CaseEvidenceTrace)
def case_evidence_trace(case_id: str, svc: Services = Depends(get_services)):
    return svc.get_case_evidence_trace(case_id)

@app.get("/api/v1/recovery/batches/{batch_id}/trace", response_model=BatchEvidenceTrace)
def batch_evidence_trace(batch_id: str, svc: Services = Depends(get_services)):
    return svc.get_batch_evidence_trace(batch_id)

@app.get("/api/v1/evaluation/recovery", response_model=ControlledEvaluationResponse)
def controlled_evaluation(svc: Services = Depends(get_services)):
    return svc.get_controlled_evaluation()

@app.get("/api/v1/dashboard/metrics",response_model=DashboardMetricsResponse)
def dashboard_metrics(svc:Services=Depends(get_services)):
    return svc.repo.dashboard_metrics()
@app.get("/api/v1/system/health",response_model=SystemHealth)
def system_health(): return SystemHealth(status="ok",services={name:"ready" for name in ["Decision Engine","Policy Engine","Recovery Executor","Verification","Audit","Communication","Campaign Orchestrator"]})

@app.get("/api/v1/system/preflight", response_model=PreflightResponse)
def system_preflight(svc: Services = Depends(get_services)):
    return svc.preflight_check()

@app.post("/api/v1/system/demo/reset", response_model=DemoResetResponse)
def system_demo_reset(svc: Services = Depends(get_services)):
    return svc.reset_demo_state()


