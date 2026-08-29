import re

def fix_context():
    with open('frontend/lib/context/ReclaimContext.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the executeRecovery function block and replace it
    pattern = re.compile(r'const executeRecovery = useCallback\(async \(caseId: string, options\?: ExecuteOptions\): Promise<boolean> => \{.*?\n  \}, \[cases, toast\]\);', re.DOTALL)
    
    new_execute = """const executeRecovery = useCallback(async (caseId: string, options?: ExecuteOptions): Promise<boolean> => {
    // Check RBAC Permissions
    if (merchantProfile.currentRole === "VIEWER") {
      toast({
        title: "Permission Denied",
        description: "Viewer role has read-only access. Cannot execute financial recovery.",
        type: "error",
      });
      return false;
    }

    const targetCase = cases.find((c) => c.id === caseId);
    if (!targetCase) {
      toast({ title: "Case Not Found", description: `Case ${caseId} does not exist.`, type: "error" });
      return false;
    }

    const activeExecutingCaseIds = Object.keys(executionProgressMap).filter(
      (k) => ["authorizing", "executing", "verifying"].includes(executionProgressMap[k]?.step)
    );

    // --- STEP 0: CENTRALIZED SAFETY CONTROLLER PRE-CHECK ---
    const safetyCheck = evaluateSafetyBeforeExecution(targetCase, serviceHealth, activeExecutingCaseIds);
    if (!safetyCheck.allowed) {
      addAuditEvent({
        layer: "LAYER 3",
        source: "POLICY_ENGINE",
        event: "ACTION_BLOCKED_FOR_SAFETY",
        case: targetCase.id,
        desc: safetyCheck.reason,
        status: "BLOCKED",
        details: { policyRule: "SAFETY_CONTROLLER", reason: safetyCheck.reason }
      });
      toast({ title: "Execution Blocked", description: safetyCheck.reason, type: "error" });
      setExecutionProgressMap(prev => ({ ...prev, [caseId]: { caseId, step: "blocked", idempotencyKey: "safety_block" } }));
      return false;
    }

    setExecutionProgressMap((prev) => ({
      ...prev,
      [caseId]: { caseId, step: "authorizing", idempotencyKey: "temp" }
    }));

    const decision = synthesizeDecision(targetCase);
    const strategy = buildRecoveryStrategy(targetCase);
    const policy = evaluatePolicy(targetCase, activePolicy);
    const effectiveScenario = options?.forceScenario || targetCase.demoScenario || "A_SUCCESS";
    const idempotencyKey = `rz_rec_${targetCase.id}_${Date.now()}`;

    // Step 17B: DO NOT IMPLEMENT RECOVERY EXECUTION. 
    // Fall back to local strategy executor for read-only frontend test.
    const req = {
      caseId: targetCase.id,
      amount: targetCase.amount,
      strategy: strategy.primaryAction.type,
      idempotencyKey,
      simulateScenario: effectiveScenario
    };

    setExecutionProgressMap((prev) => ({
      ...prev,
      [caseId]: { caseId, step: "executing", idempotencyKey }
    }));

    const result = await services.recoveryExecutor.execute(req);

    if (result.status === "FAILED") {
      setExecutionProgressMap((prev) => ({ ...prev, [caseId]: { caseId, step: "failed", idempotencyKey } }));
      return false;
    }

    setExecutionProgressMap((prev) => ({ ...prev, [caseId]: { caseId, step: "success", idempotencyKey } }));
    return true;
  }, [cases, executionProgressMap, serviceHealth, activePolicy, merchantProfile.currentRole, addAuditEvent, toast]);"""

    content = re.sub(pattern, new_execute, content)
    
    with open('frontend/lib/context/ReclaimContext.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    fix_context()
