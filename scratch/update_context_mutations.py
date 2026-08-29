import re

def update_reclaim_context():
    with open('frontend/lib/context/ReclaimContext.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Replace updatePolicy and rollbackPolicy
    policy_pattern = re.compile(r'const updatePolicy = useCallback\(.*?const rollbackPolicy = useCallback\(.*?\n  \}, \[activePolicy, policyHistory, merchantProfile\.currentRole, addAuditEvent, toast\]\);', re.DOTALL)

    new_policy_code = """  const updatePolicy = useCallback(async (updates: Partial<MerchantPolicy>, changeSummary: string) => {
    if (merchantProfile.currentRole === "VIEWER") {
      toast({
        title: "Permission Denied",
        description: "Viewer role cannot modify merchant policy configurations.",
        type: "error",
      });
      return;
    }

    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      const currentVerNum = parseInt(activePolicy.version.replace("v", "")) || 1;
      const nextVersion = `v${currentVerNum + 1}`;
      const nowStr = `${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} ${new Date().toLocaleTimeString("en-IN", { hour12: false })} IST`;

      const updatedPolicy: MerchantPolicy = {
        ...activePolicy,
        ...updates,
        version: nextVersion,
        isActive: true,
        updatedAt: new Date().toISOString(),
        updatedBy: merchantProfile.currentRole === "MERCHANT_ADMIN" ? "Merchant Admin" : "Operator",
        changeSummary,
        recoverySettings: { ...activePolicy.recoverySettings, ...updates.recoverySettings },
        retryRules: { ...activePolicy.retryRules, ...updates.retryRules },
        paymentLinkRules: { ...activePolicy.paymentLinkRules, ...updates.paymentLinkRules },
        communicationRules: { ...activePolicy.communicationRules, ...updates.communicationRules },
        escalationRules: { ...activePolicy.escalationRules, ...updates.escalationRules },
        notificationPreferences: { ...activePolicy.notificationPreferences, ...updates.notificationPreferences },
      };

      setActivePolicy(updatedPolicy);

      const historyItem: PolicyVersionHistoryItem = {
        version: nextVersion,
        timestamp: nowStr,
        actor: merchantProfile.currentRole === "MERCHANT_ADMIN" ? "Merchant Admin" : "Operator",
        summary: changeSummary,
        policySnapshot: updatedPolicy,
      };

      setPolicyHistory((prev) => [historyItem, ...prev]);

      addAuditEvent({
        layer: "LAYER 3",
        source: "POLICY_ENGINE",
        event: "POLICY_UPDATED",
        case: nextVersion,
        desc: `Policy updated from ${activePolicy.version} to ${nextVersion}: ${changeSummary}`,
        status: "INFO",
        details: {
          policyRule: "CONFIG_CHANGE",
          actualValue: nextVersion,
          reason: changeSummary,
        },
      });

      toast({
        title: `Policy Updated to ${nextVersion} 🛡️`,
        description: changeSummary,
        type: "success",
      });
    } else {
      try {
        const actor = merchantProfile.currentRole === "MERCHANT_ADMIN" ? "Merchant Admin" : "Operator";
        const res = await services.policyRepo.updatePolicy(updates, changeSummary, actor);
        const [latestPolicy, history, audit] = await Promise.all([
          services.policyRepo.getActivePolicy(),
          services.policyRepo.getPolicyHistory(),
          services.auditRepo.getAllEvents()
        ]);
        setActivePolicy(latestPolicy);
        setPolicyHistory(history);
        setAuditEvents(audit);
        toast({
          title: `Policy Updated to ${res.version} 🛡️`,
          description: changeSummary,
          type: "success",
        });
      } catch (err: any) {
        toast({
          title: "Policy Update Rejected",
          description: err.message || "The policy update violated validation invariants.",
          type: "error",
        });
      }
    }
  }, [activePolicy, merchantProfile.currentRole, addAuditEvent, toast]);

  const rollbackPolicy = useCallback(async (targetVersion: string) => {
    if (merchantProfile.currentRole !== "MERCHANT_ADMIN") {
      toast({
        title: "Permission Denied",
        description: "Only Merchant Admin can execute policy rollbacks.",
        type: "error",
      });
      return;
    }

    const targetHistory = policyHistory.find((h) => h.version === targetVersion);
    if (!targetHistory) {
      toast({ title: "Version Not Found", description: `Policy ${targetVersion} does not exist in history.`, type: "error" });
      return;
    }

    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      const currentVerNum = parseInt(activePolicy.version.replace("v", "")) || 1;
      const nextVersion = `v${currentVerNum + 1}`;
      const nowStr = `${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} ${new Date().toLocaleTimeString("en-IN", { hour12: false })} IST`;

      const rolledBackPolicy: MerchantPolicy = {
        ...targetHistory.policySnapshot,
        version: nextVersion,
        isActive: true,
        updatedAt: new Date().toISOString(),
        updatedBy: "Merchant Admin",
        changeSummary: `Rollback: Restored configuration state from ${targetVersion}`,
      };

      setActivePolicy(rolledBackPolicy);

      const historyItem: PolicyVersionHistoryItem = {
        version: nextVersion,
        timestamp: nowStr,
        actor: "Merchant Admin",
        summary: `Rollback to ${targetVersion}`,
        policySnapshot: rolledBackPolicy,
      };

      setPolicyHistory((prev) => [historyItem, ...prev]);

      addAuditEvent({
        layer: "LAYER 3",
        source: "POLICY_ENGINE",
        event: "POLICY_UPDATED",
        case: nextVersion,
        desc: `Policy rolled back from ${activePolicy.version} to snapshot of ${targetVersion}`,
        status: "INFO",
        details: {
          policyRule: "POLICY_ROLLBACK",
          actualValue: nextVersion,
          reason: `Restored snapshot from ${targetVersion}`,
        },
      });

      toast({
        title: `Policy Rolled Back to ${nextVersion} 🔄`,
        description: `Successfully restored state from ${targetVersion}.`,
        type: "success",
      });
    } else {
      try {
        const res = await services.policyRepo.saveActivePolicy({
          ...targetHistory.policySnapshot,
          updatedBy: "Merchant Admin",
          changeSummary: `Rollback: Restored configuration state from ${targetVersion}`
        });
        const [latestPolicy, history, audit] = await Promise.all([
          services.policyRepo.getActivePolicy(),
          services.policyRepo.getPolicyHistory(),
          services.auditRepo.getAllEvents()
        ]);
        setActivePolicy(latestPolicy);
        setPolicyHistory(history);
        setAuditEvents(audit);
        toast({
          title: `Policy Rolled Back to ${res.version} 🔄`,
          description: `Successfully restored state from ${targetVersion}.`,
          type: "success",
        });
      } catch (err: any) {
        toast({
          title: "Rollback Failed",
          description: err.message || "Failed to persist rollback policy version.",
          type: "error",
        });
      }
    }
  }, [activePolicy, policyHistory, merchantProfile.currentRole, addAuditEvent, toast]);"""

    content = re.sub(policy_pattern, new_policy_code, content)

    # 2. Replace executeRecovery
    exec_pattern = re.compile(r'const executeRecovery = useCallback\(async \(caseId: string, options\?: ExecuteOptions\): Promise<boolean> => \{.*?\n  \}, \[cases.*?\]\);', re.DOTALL)

    new_exec_code = """const executeRecovery = useCallback(async (caseId: string, options?: ExecuteOptions): Promise<boolean> => {
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

    const idempotencyKey = `rz_rec_${caseId}_${Date.now()}`;

    setExecutionProgressMap((prev) => ({
      ...prev,
      [caseId]: { caseId, step: "authorizing", idempotencyKey }
    }));

    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      const decision = synthesizeDecision(targetCase);
      const strategy = buildRecoveryStrategy(targetCase);
      const effectiveScenario = options?.forceScenario || targetCase.demoScenario || "A_SUCCESS";

      setExecutionProgressMap((prev) => ({
        ...prev,
        [caseId]: { caseId, step: "executing", idempotencyKey }
      }));

      const req = {
        caseId: targetCase.id,
        amount: targetCase.amount,
        paymentMethod: targetCase.paymentMethod,
        intervention: strategy.primaryAction.intervention,
        strategy: strategy.primaryAction.type,
        idempotencyKey,
        isTestMode: true,
      };

      const result = await services.recoveryExecutor.execute(req);
      if (result.status === "FAILED") {
        setExecutionProgressMap((prev) => ({ ...prev, [caseId]: { caseId, step: "failed", idempotencyKey } }));
        return false;
      }
      setExecutionProgressMap((prev) => ({ ...prev, [caseId]: { caseId, step: "success", idempotencyKey } }));
      return true;
    } else {
      try {
        setExecutionProgressMap((prev) => ({
          ...prev,
          [caseId]: { caseId, step: "executing", idempotencyKey }
        }));

        const result = await services.recoveryExecutor.execute({
          caseId: targetCase.id,
          amount: targetCase.amount,
          paymentMethod: targetCase.paymentMethod,
          intervention: targetCase.strategy || "RETRY_PAYMENT",
          strategy: targetCase.strategy || "RETRY_PAYMENT",
          idempotencyKey,
          isTestMode: true,
        });

        setExecutionProgressMap((prev) => ({
          ...prev,
          [caseId]: { caseId, step: "verifying", idempotencyKey }
        }));

        if (result.status === "FAILED") {
          const isPolicyBlock = result.payloadSent?.code === 'POLICY_BLOCKED' || result.payloadSent?.code === 'POLICY_VALIDATION_ERROR';
          const nextStep = isPolicyBlock ? "blocked" : "failed";
          setExecutionProgressMap((prev) => ({ ...prev, [caseId]: { caseId, step: nextStep, idempotencyKey } }));
          
          await Promise.all([
            services.caseRepo.getAllCases().then(setCases),
            services.auditRepo.getAllEvents().then(setAuditEvents)
          ]);
          return false;
        }

        setExecutionProgressMap((prev) => ({ ...prev, [caseId]: { caseId, step: "success", idempotencyKey } }));
        await Promise.all([
          services.caseRepo.getAllCases().then(setCases),
          services.auditRepo.getAllEvents().then(setAuditEvents)
        ]);
        return true;
      } catch (err: any) {
        setExecutionProgressMap((prev) => ({ ...prev, [caseId]: { caseId, step: "failed", idempotencyKey } }));
        return false;
      }
    }
  }, [cases, executionProgressMap, serviceHealth, activePolicy, merchantProfile.currentRole, addAuditEvent, toast]);"""

    content = re.sub(exec_pattern, new_exec_code, content)

    # 3. Replace toggleCampaignStatus
    campaign_pattern = re.compile(r'const toggleCampaignStatus = useCallback\(.*?toast\(\{\s+title: nextStatus === "PAUSED".*?\n  \}, \[toast\]\);', re.DOTALL)

    new_campaign_code = """const toggleCampaignStatus = useCallback(async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      setCampaigns((prev) =>
        prev.map((c) => {
          if (c.id === campaignId) {
            const nextStatus = c.status === "RUNNING" ? "PAUSED" : c.status === "PAUSED" ? "READY" : "PAUSED";
            toast({
              title: nextStatus === "PAUSED" ? "Campaign Paused" : "Campaign Ready",
              description: `${c.config.name} status updated to ${nextStatus}.`,
              type: "info",
            });
            return { ...c, status: nextStatus };
          }
          return c;
        })
      );
    } else {
      try {
        let res: any;
        const currentStatus = campaign.status;
        if (currentStatus === "RUNNING") {
          res = await services.campaignRepo.pauseCampaign?.(campaignId) || await apiClient.post(`/api/v1/campaigns/${campaignId}/pause`);
        } else if (currentStatus === "PAUSED") {
          res = await services.campaignRepo.resumeCampaign?.(campaignId) || await apiClient.post(`/api/v1/campaigns/${campaignId}/resume`);
        } else {
          res = await services.campaignRepo.startCampaign?.(campaignId) || await apiClient.post(`/api/v1/campaigns/${campaignId}/start`);
        }

        const [updatedCampaigns, audit] = await Promise.all([
          services.campaignRepo.getAllCampaigns(),
          services.auditRepo.getAllEvents()
        ]);
        setCampaigns(updatedCampaigns);
        setAuditEvents(audit);

        toast({
          title: `Campaign Status: ${res.status || "Updated"}`,
          description: res.message || `${campaign.config.name} status transition completed.`,
          type: "info",
        });
      } catch (err: any) {
        toast({
          title: "Campaign Action Failed",
          description: err.message || "Invalid state transition or campaign not found.",
          type: "error",
        });
      }
    }
  }, [campaigns, toast]);"""

    content = re.sub(campaign_pattern, new_campaign_code, content)

    # 4. Replace sendCommunicationMessage
    comm_pattern = re.compile(r'const sendCommunicationMessage = useCallback\(async \(\s+caseId: string,.*?\n  \}, \[cases, serviceHealth, activePolicy, addAuditEvent, toast\]\);', re.DOTALL)

    new_comm_code = """const sendCommunicationMessage = useCallback(async (
    caseId: string, 
    channel: CommunicationChannel, 
    language: "English" | "Hinglish"
  ): Promise<boolean> => {
    const targetCase = cases.find((c) => c.id === caseId);
    if (!targetCase) return false;

    if (serviceHealth.COMMUNICATION_SERVICE && serviceHealth.COMMUNICATION_SERVICE.status !== "OPERATIONAL") {
      addAuditEvent({
        layer: "LAYER 4",
        source: "EXECUTOR",
        event: "ACTION_BLOCKED_FOR_SAFETY",
        case: targetCase.id,
        desc: `Communication blocked: Communication Service is ${serviceHealth.COMMUNICATION_SERVICE.status}.`,
        status: "BLOCKED",
      });
      toast({
        title: "Communication Blocked",
        description: "Communication dispatcher is currently unavailable. No message sent.",
        type: "error",
      });
      return false;
    }

    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      if ((targetCase.contactCount24h || 0) >= activePolicy.communicationRules.maxContacts24h) {
        toast({
          title: "Communication Blocked by Policy",
          description: `Customer contact limit (${activePolicy.communicationRules.maxContacts24h}/${activePolicy.communicationRules.maxContacts24h} in 24h) reached for ${targetCase.customer}. Prevented customer spam.`,
          type: "warning",
        });
        return false;
      }

      const content = generateRecoveryMessage(targetCase, channel, language);
      const commId = `COMM-2026-${String(Date.now()).slice(-4)}`;

      const newMsg: CommunicationMessage = {
        id: commId,
        caseId: targetCase.id,
        customerName: targetCase.customer,
        customerPhone: targetCase.customerPhone,
        amount: targetCase.amount,
        channel,
        channelName: channel === "whatsapp" ? "WhatsApp Business (Verified)" : channel === "sms" ? "Gupshup SMS Gateway" : "SendGrid Email",
        language,
        templateKey: `tpl_${channel}_${language.toLowerCase()}`,
        content,
        status: "DELIVERY_CONFIRMED_SIMULATED",
        contactCount: (targetCase.contactCount24h || 0) + 1,
        maxContacts: activePolicy.communicationRules.maxContacts24h,
        policyStatus: "Approved",
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        deliveredAt: new Date().toISOString(),
        recoveredAfter: true,
        transactionId: `txn_comm_${Date.now()}`,
      };

      setCommunications((prev) => [newMsg, ...prev]);

      setCases((prev) =>
        prev.map((c) =>
          c.id === caseId
            ? { ...c, contactCount24h: (c.contactCount24h || 0) + 1 }
            : c
        )
      );

      addAuditEvent({
        layer: "LAYER 4",
        source: "EXECUTOR",
        event: "COMMUNICATION_SENT_SIMULATED",
        case: targetCase.id,
        desc: `Dispatched ${channel.toUpperCase()} message in ${language} to ${targetCase.customer}.`,
        status: "SUCCESS",
        details: {
          customer: targetCase.customer,
          paymentMethod: channel.toUpperCase(),
          reason: `Attempt ${(targetCase.contactCount24h || 0) + 1} of ${activePolicy.communicationRules.maxContacts24h}`,
        },
      });

      toast({
        title: `${channel.toUpperCase()} Message Dispatched (Simulated)`,
        description: `Sent recovery link to ${targetCase.customer} (${targetCase.customerPhone || targetCase.customerEmail}).`,
        type: "success",
      });

      return true;
    } else {
      try {
        const content = generateRecoveryMessage(targetCase, channel, language);
        const newMsg: CommunicationMessage = {
          id: `temp_${Date.now()}`,
          caseId: targetCase.id,
          customerName: targetCase.customer,
          amount: targetCase.amount,
          channel,
          channelName: channel === "whatsapp" ? "WhatsApp Business (Verified)" : channel === "sms" ? "Gupshup SMS Gateway" : "SendGrid Email",
          language,
          templateKey: `tpl_${channel}_${language.toLowerCase()}`,
          content,
          status: "SENT_SIMULATED",
          contactCount: (targetCase.contactCount24h || 0) + 1,
          maxContacts: activePolicy.communicationRules.maxContacts24h,
          policyStatus: "Approved",
          createdAt: new Date().toISOString(),
        };

        await services.communicationRepo.addCommunication(newMsg);

        const [comms, updatedCases, audit] = await Promise.all([
          services.communicationRepo.getAllCommunications(),
          services.caseRepo.getAllCases(),
          services.auditRepo.getAllEvents()
        ]);
        setCommunications(comms);
        setCases(updatedCases);
        setAuditEvents(audit);

        toast({
          title: `${channel.toUpperCase()} Message Dispatched (Simulated)`,
          description: `Sent recovery link to ${targetCase.customer}.`,
          type: "success",
        });
        return true;
      } catch (err: any) {
        toast({
          title: "Communication Blocked",
          description: err.message || "Customer contact limit reached or policy restriction in effect.",
          type: "error",
        });
        return false;
      }
    }
  }, [cases, serviceHealth, activePolicy, addAuditEvent, toast]);"""

    content = re.sub(comm_pattern, new_comm_code, content)

    # Ensure apiClient is imported if needed
    if 'import { apiClient } from "../api/client";' not in content:
        content = content.replace('import { services } from "../services/serviceFactory";', 'import { services } from "../services/serviceFactory";\nimport { apiClient } from "../api/client";')

    with open('frontend/lib/context/ReclaimContext.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    update_reclaim_context()
