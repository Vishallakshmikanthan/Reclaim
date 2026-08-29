import re

def modify_at_risk():
    with open('frontend/app/at-risk/page.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Add import
    if 'useCasesApi' not in content:
        content = content.replace(
            'import { useReclaim } from "@/lib/context/ReclaimContext";',
            'import { useReclaim } from "@/lib/context/ReclaimContext";\nimport { useCasesApi } from "@/lib/hooks/useCasesApi";'
        )
    
    # 2. Add useCasesApi hook inside AtRiskContent
    hook_str = """  const { cases, metrics, resetDemoData } = useReclaim();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState("All Cases");
  const [searchTerm, setSearchTerm] = useState("");
  const [failureFilter, setFailureFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"expected_desc" | "amount_desc" | "amount_asc" | "prob_desc" | "newest">("expected_desc");
  
  // Convert tab and filters to API params
  const apiStatus = activeTab === "Recovery Ready" ? "inProgress" : 
                    activeTab === "Human Review" ? "atRisk" : 
                    activeTab === "Escalated" ? "escalated" : 
                    activeTab === "Stopped" ? "stopped" : 
                    activeTab === "Recovered" ? "recovered" : undefined;
                    
  const apiFailure = failureFilter !== "ALL" ? failureFilter : undefined;
  const apiPriority = activeTab === "High Priority" ? "high" : undefined;

  const { items: apiCases, isLoading: isApiLoading } = useCasesApi({
    status: apiStatus,
    failure_type: apiFailure,
    priority: apiPriority,
    page: 1,
    page_size: 100
  });
"""
    
    content = re.sub(
        r'  const { cases, metrics, resetDemoData } = useReclaim\(\);\n  const { toast } = useToast\(\);\n  const searchParams = useSearchParams\(\);[\s\S]*?const \[sortBy, setSortBy\] = useState<[^>]+>\("expected_desc"\);',
        hook_str,
        content
    )
    
    # 3. Modify filteredCases to use apiCases, and keep client-side sorting/search
    content = content.replace(
        'let result = cases.filter((c) => {',
        'let result = apiCases.filter((c) => {'
    )
    content = content.replace(
        '}, [cases, searchTerm, activeTab, failureFilter, sortBy]);',
        '}, [apiCases, searchTerm, activeTab, failureFilter, sortBy]);'
    )
    
    with open('frontend/app/at-risk/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    modify_at_risk()
