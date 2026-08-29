import re

def update_case_decision_page():
    with open('frontend/app/cases/[id]/page.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Add apiClient import if not present
    if 'import { apiClient } from "@/lib/api/client";' not in content:
        content = content.replace('import { services } from "@/lib/services/serviceFactory";', 'import { services } from "@/lib/services/serviceFactory";\nimport { apiClient } from "@/lib/api/client";')

    old_block = """  // Dynamic AI synthesis, risk signals, deterministic policy check, and intelligent recovery strategy
  const [aiDecision, setAiDecision] = useState<any>(null);
  const [strategy, setStrategy] = useState<any>(null);
  
  useEffect(() => {
    if (currentCase) {
      // Step 17B: Read-Only Integration (No mutations like POST /decision yet). Use local decision for now.
      setAiDecision(getCaseDecision(currentCase));
      setStrategy(getCaseStrategy(currentCase));
    }
  }, [currentCase, getCaseDecision, getCaseStrategy]);"""

    new_block = """  // Dynamic AI synthesis, risk signals, deterministic policy check, and intelligent recovery strategy
  const [aiDecision, setAiDecision] = useState<any>(null);
  const [strategy, setStrategy] = useState<any>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  
  useEffect(() => {
    if (currentCase) {
      if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
        setAiDecision(getCaseDecision(currentCase));
        setStrategy(getCaseStrategy(currentCase));
      } else {
        const fetchBackendDecision = async () => {
          try {
            const res = await apiClient.post<any>(`/api/v1/cases/${currentCase.id}/recovery/decision`);
            const localDecision = getCaseDecision(currentCase);
            const localStrategy = getCaseStrategy(currentCase);

            setAiDecision({
              ...localDecision,
              caseId: res.case_id,
              recoveryProbability: res.recovery_probability,
              expectedRecovery: res.expected_recovery,
              recommendedIntervention: res.strategy,
              whyThisAction: res.explanation || localDecision.whyThisAction,
              whyThisMatters: res.explanation || localDecision.whyThisMatters,
            });

            setStrategy({
              ...localStrategy,
              caseId: res.case_id,
              priority: (res.priority.charAt(0).toUpperCase() + res.priority.slice(1).toLowerCase()),
              explanation: res.explanation || localStrategy.explanation,
              primaryAction: {
                ...localStrategy.primaryAction,
                label: res.next_step || localStrategy.primaryAction.label,
                expectedRecovery: res.expected_recovery,
                recoveryProbability: res.recovery_probability,
              },
            });
          } catch (err: any) {
            setAiDecision(getCaseDecision(currentCase));
            setStrategy(getCaseStrategy(currentCase));
            setDecisionError(err.message || "Failed to fetch authoritative decision");
          }
        };
        fetchBackendDecision();
      }
    }
  }, [currentCase, getCaseDecision, getCaseStrategy]);"""

    content = content.replace(old_block, new_block)

    with open('frontend/app/cases/[id]/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    update_case_decision_page()
