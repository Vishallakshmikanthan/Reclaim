import re

def rewrite_case_decision():
    with open('frontend/app/cases/[id]/page.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Add state for aiDecision
    hook_str = """  const [aiDecision, setAiDecision] = useState<any>(null);
  const [strategy, setStrategy] = useState<any>(null);
  
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

  // Loading state if no decision yet
  if (!aiDecision || !strategy) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Synthesizing intelligent decision...</div>;
  }
"""

    content = re.sub(
        r'  const aiDecision = useMemo\(\(\) => getCaseDecision\(currentCase\), \[currentCase, getCaseDecision\]\);\n  const strategy = useMemo\(\(\) => getCaseStrategy\(currentCase\), \[currentCase, getCaseStrategy\]\);',
        hook_str,
        content
    )

    with open('frontend/app/cases/[id]/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    rewrite_case_decision()
