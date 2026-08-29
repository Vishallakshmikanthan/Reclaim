import re

def fix_case_fetch():
    with open('frontend/app/cases/[id]/page.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # We need to replace the currentCase initialization to use the API directly!
    # Let's see how currentCase is currently set:
    # const currentCase = useMemo(() => {
    #   return getCaseById(caseId) || cases[0];
    # }, [caseId, getCaseById, cases]);
    
    hook_str = """  const [currentCase, setCurrentCase] = useState<any>(null);

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

  // Loading state if no currentCase yet
  if (!currentCase) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading case details...</div>;
  }
"""

    content = re.sub(
        r'  // Retrieve current live case\n  const currentCase = useMemo\(\(\) => \{\n    return getCaseById\(caseId\) \|\| cases\[0\];\n  \}, \[caseId, getCaseById, cases\]\);',
        hook_str,
        content,
        flags=re.MULTILINE
    )

    with open('frontend/app/cases/[id]/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    fix_case_fetch()
