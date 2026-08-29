import re

def modify_context():
    with open('frontend/lib/context/ReclaimContext.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Add services import
    if 'import { services } from "../services/serviceFactory";' not in content:
        content = content.replace(
            'import { BrowserStorage, STORAGE_KEYS } from "../storage/browserStorage";',
            'import { BrowserStorage, STORAGE_KEYS } from "../storage/browserStorage";\nimport { services } from "../services/serviceFactory";'
        )
    
    # 2. Add useEffect for initialization
    init_hook = """  // API Initialization
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_USE_MOCKS !== 'true') {
      const loadAll = async () => {
        try {
          const [
            apiCases, 
            apiAudit, 
            apiCampaigns, 
            apiComms, 
            apiPolicy, 
            apiPolicyHistory
          ] = await Promise.all([
            services.caseRepo.getAllCases(),
            services.auditRepo.getEvents(),
            services.campaignRepo.getCampaigns(),
            services.communicationRepo.getCommunications(),
            services.policyRepo.getActivePolicy(),
            services.policyRepo.getPolicyHistory()
          ]);
          setCases(apiCases);
          setAuditEvents(apiAudit);
          setCampaigns(apiCampaigns);
          setCommunications(apiComms);
          setActivePolicy(apiPolicy);
          setPolicyHistory(apiPolicyHistory);
        } catch (e) {
          console.error("Failed to load data from backend API:", e);
          toast({ title: "Backend Unavailable", description: "Failed to connect to the Reclaim API.", type: "error" });
        }
      };
      loadAll();
    }
  }, []);
"""
    if '// API Initialization' not in content:
        content = content.replace(
            '  // Synchronize with Centralized Storage',
            init_hook + '\n  // Synchronize with Centralized Storage'
        )
    
    # 3. Prevent overwriting backend state with local state initially.
    # Currently, `useState(() => BrowserStorage.getItem(...))` sets state immediately,
    # then `useEffect` overwrites it in LocalStorage!
    # Wait, if we use real API, we should NOT sync back to BrowserStorage or at least we don't care.
    # But to prevent flashing mock data, we can change the useState initializers.
    
    with open('frontend/lib/context/ReclaimContext.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    modify_context()
