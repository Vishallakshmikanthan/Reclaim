import re

def rewrite_execute():
    with open('frontend/lib/context/ReclaimContext.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    execute_recovery_new = """  const executeRecovery = useCallback(async (caseId: string, options?: ExecuteOptions): Promise<boolean> => {
    setExecutionProgressMap((prev) => ({
      ...prev,
      [caseId]: { caseId, step: "authorizing", idempotencyKey: "temp" }
    }));

    try {
      const caseItem = cases.find(c => c.id === caseId);
      if (!caseItem) throw new Error("Case not found");

      setExecutionProgressMap((prev) => ({
        ...prev,
        [caseId]: { caseId, step: "executing", idempotencyKey: "temp" }
      }));

      const idempotencyKey = `rz_rec_${caseId}_${Date.now()}`;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000"}/api/v1/cases/${caseId}/recovery/actions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
          body: JSON.stringify({ action_type: "RETRY_PAYMENT", amount: caseItem.amount, scheduled_for: new Date().toISOString() })
        }
      );

      const data = await response.json();

      setExecutionProgressMap((prev) => ({
        ...prev,
        [caseId]: { caseId, step: "verifying", idempotencyKey }
      }));

      if (!response.ok) {
        if (data.error?.code === 'POLICY_BLOCKED' || data.error?.code === 'POLICY_VALIDATION_ERROR') {
          setExecutionProgressMap((prev) => ({ ...prev, [caseId]: { caseId, step: "blocked", idempotencyKey } }));
          // Refresh cases & audit
          services.caseRepo.getAllCases().then(setCases);
          services.auditRepo.getAllEvents().then(setAuditEvents);
          return false;
        }
        setExecutionProgressMap((prev) => ({ ...prev, [caseId]: { caseId, step: "failed", idempotencyKey } }));
        return false;
      }

      setExecutionProgressMap((prev) => ({ ...prev, [caseId]: { caseId, step: "recovered", idempotencyKey } }));
      // Refresh cases & audit
      services.caseRepo.getAllCases().then(setCases);
      services.auditRepo.getAllEvents().then(setAuditEvents);
      return true;

    } catch (e) {
      console.error(e);
      setExecutionProgressMap((prev) => ({ ...prev, [caseId]: { caseId, step: "failed", idempotencyKey: "temp" } }));
      return false;
    }
  }, [cases]);"""

    content = re.sub(
        r'  const executeRecovery = useCallback\(async \(caseId: string, options\?: ExecuteOptions\): Promise<boolean> => \{[\s\S]*?^\s*\}, \[.*?\]\);',
        execute_recovery_new,
        content,
        flags=re.MULTILINE
    )

    with open('frontend/lib/context/ReclaimContext.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    rewrite_execute()
