import re

def update_context_metrics():
    with open('frontend/lib/context/ReclaimContext.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add serverMetrics state
    state_decl = """  const [serverMetrics, setServerMetrics] = useState<OperationalMetrics | null>(null);
  const [executionProgressMap, setExecutionProgressMap] = useState<Record<string, ExecutionProgress>>({});"""
    content = content.replace('  const [executionProgressMap, setExecutionProgressMap] = useState<Record<string, ExecutionProgress>>({});', state_decl)

    # 2. Update loadAll to fetch serverMetrics
    old_load = """          const [
            apiCases, 
            apiAudit, 
            apiCampaigns, 
            apiComms, 
            apiPolicy, 
            apiPolicyHistory
          ] = await Promise.all([
            services.caseRepo.getAllCases(),
            services.auditRepo.getAllEvents(),
            services.campaignRepo.getAllCampaigns(),
            services.communicationRepo.getAllCommunications(),
            services.policyRepo.getActivePolicy(),
            services.policyRepo.getPolicyHistory()
          ]);
          setCases(apiCases);
          setAuditEvents(apiAudit);
          setCampaigns(apiCampaigns);
          setCommunications(apiComms);
          setActivePolicy(apiPolicy);
          setPolicyHistory(apiPolicyHistory);"""

    new_load = """          const [
            apiCases, 
            apiAudit, 
            apiCampaigns, 
            apiComms, 
            apiPolicy, 
            apiPolicyHistory,
            apiMetrics
          ] = await Promise.all([
            services.caseRepo.getAllCases(),
            services.auditRepo.getAllEvents(),
            services.campaignRepo.getAllCampaigns(),
            services.communicationRepo.getAllCommunications(),
            services.policyRepo.getActivePolicy(),
            services.policyRepo.getPolicyHistory(),
            services.caseRepo.getDashboardMetrics()
          ]);
          setCases(apiCases);
          setAuditEvents(apiAudit);
          setCampaigns(apiCampaigns);
          setCommunications(apiComms);
          setActivePolicy(apiPolicy);
          setPolicyHistory(apiPolicyHistory);
          setServerMetrics(apiMetrics);"""

    content = content.replace(old_load, new_load)

    # 3. Update metrics useMemo
    old_memo = "  // Deterministic metrics derived strictly from the dataset\n  const metrics = useMemo(() => calculateOperationalMetrics(cases), [cases]);"
    new_memo = """  // Server-authoritative metrics from PostgreSQL with fallback to dataset calculation
  const metrics = useMemo(() => {
    if (process.env.NEXT_PUBLIC_USE_MOCKS !== 'true' && serverMetrics) {
      return serverMetrics;
    }
    return calculateOperationalMetrics(cases);
  }, [cases, serverMetrics]);"""
    content = content.replace(old_memo, new_memo)

    # 4. Update executeRecovery refresh
    content = content.replace(
        """        await Promise.all([
          services.caseRepo.getAllCases().then(setCases),
          services.auditRepo.getAllEvents().then(setAuditEvents)
        ]);""",
        """        await Promise.all([
          services.caseRepo.getAllCases().then(setCases),
          services.auditRepo.getAllEvents().then(setAuditEvents),
          services.caseRepo.getDashboardMetrics().then(setServerMetrics)
        ]);"""
    )

    with open('frontend/lib/context/ReclaimContext.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    update_context_metrics()
