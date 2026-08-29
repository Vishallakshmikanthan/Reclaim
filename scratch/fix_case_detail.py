import re

def rewrite_page():
    with open('frontend/app/cases/[id]/page.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Import ServiceFactory
    if 'from "@/lib/services/serviceFactory"' not in content:
        content = content.replace(
            'import { useReclaim } from "@/lib/context/ReclaimContext";',
            'import { useReclaim } from "@/lib/context/ReclaimContext";\nimport { services } from "@/lib/services/serviceFactory";'
        )
    
    # Replace the fetchCase effect
    old_effect = """
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      setCurrentCase(getCaseById(caseId) || cases[0]);
    } else {
      const fetchCase = async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000"}/api/v1/cases/${caseId}`);
          if (res.ok) {
            const data = await res.json();
            setCurrentCase(data);
          } else {
             setCurrentCase(getCaseById(caseId) || cases[0]);
          }
        } catch (e) {
          setCurrentCase(getCaseById(caseId) || cases[0]);
        }
      };
      fetchCase();
    }
  }, [caseId, getCaseById, cases]);
"""
    new_effect = """
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCase = async () => {
      try {
        const data = await services.caseRepo.getCaseById(caseId);
        if (data) {
          setCurrentCase(data);
        } else {
          setError("CASE_NOT_FOUND");
        }
      } catch (e) {
        setError("SERVER_ERROR");
      }
    };
    fetchCase();
  }, [caseId]);
"""
    
    content = content.replace(old_effect.strip(), new_effect.strip())

    # Replace the fetchDecision effect
    old_decision = """
  useEffect(() => {
    if (currentCase) {
      if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
        setAiDecision(getCaseDecision(currentCase));
        setStrategy(getCaseStrategy(currentCase));
      } else {
        const fetchDecision = async () => {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000"}/api/v1/cases/${currentCase.id}/recovery/decision`, { method: "POST" });
            const data = await res.json();
            if (res.ok) {
              setAiDecision(data);
              // The backend decision is usually the strategy as well, or we mock strategy from decision.
              // We'll mock strategy using getCaseStrategy for now as backend might just return decision.
              setStrategy(getCaseStrategy(currentCase));
            } else {
              setAiDecision(getCaseDecision(currentCase));
              setStrategy(getCaseStrategy(currentCase));
            }
          } catch (e) {
             setAiDecision(getCaseDecision(currentCase));
             setStrategy(getCaseStrategy(currentCase));
          }
        };
        fetchDecision();
      }
    }
  }, [currentCase, getCaseDecision, getCaseStrategy]);
"""
    new_decision = """
  useEffect(() => {
    if (currentCase) {
      // Step 17B: Read-Only Integration (No mutations like POST /decision yet). Use local decision for now.
      setAiDecision(getCaseDecision(currentCase));
      setStrategy(getCaseStrategy(currentCase));
    }
  }, [currentCase, getCaseDecision, getCaseStrategy]);
"""

    content = content.replace(old_decision.strip(), new_decision.strip())

    # Add error handling
    if 'return <div className="p-8 text-center text-slate-500 animate-pulse">Loading case details...</div>;' in content:
        content = content.replace(
            'return <div className="p-8 text-center text-slate-500 animate-pulse">Loading case details...</div>;',
            'if (error === "CASE_NOT_FOUND") return <div className="p-8 text-center text-slate-500">Case not found.</div>;\n    if (error) return <div className="p-8 text-center text-red-500">An error occurred loading the case.</div>;\n    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading case details...</div>;'
        )

    with open('frontend/app/cases/[id]/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    rewrite_page()
