import re

def rewrite_policy_campaign_comm():
    with open('frontend/lib/context/ReclaimContext.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Rewrite updatePolicy
    update_policy_new = """  const updatePolicy = useCallback(async (updates: Partial<MerchantPolicy>, changeSummary: string) => {
    try {
      await services.policyRepo.updatePolicy(updates, changeSummary);
      const [newPolicy, newHistory] = await Promise.all([
        services.policyRepo.getActivePolicy(),
        services.policyRepo.getPolicyHistory()
      ]);
      setActivePolicy(newPolicy);
      setPolicyHistory(newHistory);
      toast({ title: "Policy Updated", description: "Policy rules have been updated and persisted to the backend.", type: "success" });
    } catch (e) {
      toast({ title: "Update Failed", description: "Could not update policy on the backend.", type: "error" });
    }
  }, []);"""
    
    content = re.sub(
        r'  const updatePolicy = useCallback\(\(updates: Partial<MerchantPolicy>, changeSummary: string\) => \{[\s\S]*?^\s*\}, \[activePolicy, policyHistory, addAuditEvent\]\);',
        update_policy_new,
        content,
        flags=re.MULTILINE
    )

    # Rewrite toggleCampaignStatus
    toggle_campaign_new = """  const toggleCampaignStatus = useCallback(async (campaignId: string) => {
    try {
      const c = campaigns.find(x => x.id === campaignId);
      if (!c) return;
      const newStatus = c.status === "running" ? "paused" : "running";
      await services.campaignRepo.updateCampaign(campaignId, { status: newStatus });
      const newCampaigns = await services.campaignRepo.getCampaigns();
      setCampaigns(newCampaigns);
      toast({ title: "Campaign Updated", description: `Campaign status changed to ${newStatus}.`, type: "success" });
    } catch (e) {
      toast({ title: "Update Failed", description: "Could not update campaign.", type: "error" });
    }
  }, [campaigns]);"""

    content = re.sub(
        r'  const toggleCampaignStatus = useCallback\(\(campaignId: string\) => \{[\s\S]*?^\s*\}, \[campaigns, addAuditEvent\]\);',
        toggle_campaign_new,
        content,
        flags=re.MULTILINE
    )

    with open('frontend/lib/context/ReclaimContext.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    rewrite_policy_campaign_comm()
