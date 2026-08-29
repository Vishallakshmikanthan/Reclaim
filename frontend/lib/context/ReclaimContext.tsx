"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { 
  Case, 
  AuditEvent, 
  RecoveryDecision, 
  PolicyResult, 
  AuditEventType, 
  AuditLayer,
  AuditLayerSource,
  ExecutionProgress,
  RecoveryStrategy
} from "../types";
import { INITIAL_MOCK_CASES } from "../mock-data/mockCases";
import { INITIAL_AUDIT_EVENTS } from "../mock-data/mockAuditEvents";
import { evaluatePolicy } from "../policy/policyEngine";
import { synthesizeDecision } from "../recovery/decision-engine";
import { buildRecoveryStrategy } from "../recovery/strategyEngine";
import { defaultRecoveryExecutor, ExecutionRequest } from "../recovery/recoveryExecutor";
import { defaultVerificationService } from "../recovery/verificationService";
import { calculateOperationalMetrics, OperationalMetrics, calculateMoneyImpact } from "../metrics/metricsService";
import { formatCurrency } from "../utils";
import { useToast } from "@/components/ui/Toast";
import { Campaign, CampaignConfig, CampaignActivityItem } from "../campaigns/types";
import { INITIAL_CAMPAIGNS, INITIAL_COMMUNICATIONS, evaluateCampaignEligibility } from "../campaigns/campaignService";
import { CommunicationMessage, CommunicationChannel } from "../communications/types";
import { generateRecoveryMessage } from "../communications/templateEngine";
import { 
  ServiceHealth, 
  ServiceType, 
  FailureClassification, 
  FailureSeverity, 
  SafetyCheckResult,
  FailureScenarioResult
} from "../resilience/types";
import { 
  INITIAL_SERVICE_HEALTH, 
  injectServiceFailure, 
  restoreServiceHealth, 
  restoreAllServices as resetAllServices
} from "../resilience/serviceHealthManager";
import { evaluateSafetyBeforeExecution } from "../resilience/safetyController";
import { FAILURE_SCENARIOS } from "../resilience/failureScenarios";
import { 
  MerchantProfile, 
  MerchantPolicy, 
  PolicyVersionHistoryItem, 
  MerchantRole 
} from "../merchant/types";
import { 
  INITIAL_MERCHANT_PROFILE, 
  INITIAL_MERCHANT_POLICY, 
  INITIAL_POLICY_HISTORY 
} from "../merchant/defaultMerchantState";

interface ExecuteOptions {
  forceScenario?: "success" | "timeout" | "block" | "failure" | "fallback_success" | "fallback_blocked";
}

interface ReclaimContextType {
  cases: Case[];
  auditEvents: AuditEvent[];
  campaigns: Campaign[];
  communications: CommunicationMessage[];
  selectedCaseId: string | null;
  setSelectedCaseId: (id: string | null) => void;
  selectedCase: Case | null;
  
  // Real-time deterministic metrics
  metrics: OperationalMetrics;

  // Merchant Profile & Policy Management
  merchantProfile: MerchantProfile;
  activePolicy: MerchantPolicy;
  policyHistory: PolicyVersionHistoryItem[];
  updateMerchantProfile: (updates: Partial<MerchantProfile>) => void;
  updatePolicy: (updates: Partial<MerchantPolicy>, changeSummary: string) => void;
  rollbackPolicy: (targetVersion: string) => void;
  setMerchantRole: (role: MerchantRole) => void;

  // Decision, Strategy & Policy getters
  getCaseById: (id: string) => Case | undefined;
  getCaseDecision: (caseItem: Case) => RecoveryDecision;
  getCaseStrategy: (caseItem: Case) => RecoveryStrategy;
  getCasePolicy: (caseItem: Case) => PolicyResult;
  getCaseExecutionProgress: (id: string) => ExecutionProgress;
  getCaseExecutionState: (id: string) => string;
  getCaseMoneyImpact: (caseItem: Case) => ReturnType<typeof calculateMoneyImpact>;

  // Execution Actions
  executeRecovery: (caseId: string, options?: ExecuteOptions) => Promise<boolean>;
  escalateCase: (caseId: string, reason?: string) => void;
  stopCase: (caseId: string, reason?: string) => void;
  resetDemoData: () => void;

  // Campaign & Communication Actions
  runCampaignBatch: (campaignId: string) => Promise<boolean>;
  toggleCampaignStatus: (campaignId: string) => void;
  createCampaign: (config: CampaignConfig) => void;
  sendCommunicationMessage: (caseId: string, channel: CommunicationChannel, language: "English" | "Hinglish") => Promise<boolean>;

  // Resilience & Failure Layer
  serviceHealth: Record<ServiceType, ServiceHealth>;
  injectFailure: (service: ServiceType, reason: string, severity: FailureSeverity) => void;
  restoreService: (service: ServiceType) => void;
  restoreAllServices: () => void;
  runFailureScenario: (scenarioId: string, targetCaseId?: string) => Promise<FailureScenarioResult>;

  // Audit Dispatcher
  addAuditEvent: (event: Omit<AuditEvent, "id" | "timestamp">) => void;
}

const ReclaimContext = createContext<ReclaimContextType | undefined>(undefined);

import { BrowserStorage, STORAGE_KEYS } from "../storage/browserStorage";
import { services } from "../services/serviceFactory";
import { apiClient } from "../api/client";

export function ReclaimProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  const [cases, setCases] = useState<Case[]>(() => {
    return BrowserStorage.getItem<Case[]>(STORAGE_KEYS.CASES, INITIAL_MOCK_CASES);
  });

  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(() => {
    return BrowserStorage.getItem<AuditEvent[]>(STORAGE_KEYS.AUDIT_EVENTS, INITIAL_AUDIT_EVENTS);
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    return BrowserStorage.getItem<Campaign[]>(STORAGE_KEYS.CAMPAIGNS, INITIAL_CAMPAIGNS);
  });

  const [communications, setCommunications] = useState<CommunicationMessage[]>(() => {
    return BrowserStorage.getItem<CommunicationMessage[]>(STORAGE_KEYS.COMMUNICATIONS, INITIAL_COMMUNICATIONS);
  });

  const [serviceHealth, setServiceHealth] = useState<Record<ServiceType, ServiceHealth>>(() => {
    return BrowserStorage.getItem<Record<ServiceType, ServiceHealth>>(STORAGE_KEYS.SERVICE_HEALTH, INITIAL_SERVICE_HEALTH);
  });

  const [merchantProfile, setMerchantProfile] = useState<MerchantProfile>(() => {
    return BrowserStorage.getItem<MerchantProfile>(STORAGE_KEYS.MERCHANT_PROFILE, INITIAL_MERCHANT_PROFILE);
  });

  const [activePolicy, setActivePolicy] = useState<MerchantPolicy>(() => {
    return BrowserStorage.getItem<MerchantPolicy>(STORAGE_KEYS.MERCHANT_POLICY, INITIAL_MERCHANT_POLICY);
  });

  const [policyHistory, setPolicyHistory] = useState<PolicyVersionHistoryItem[]>(() => {
    return BrowserStorage.getItem<PolicyVersionHistoryItem[]>(STORAGE_KEYS.POLICY_HISTORY, INITIAL_POLICY_HISTORY);
  });

  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [executionProgressMap, setExecutionProgressMap] = useState<Record<string, ExecutionProgress>>({});

  // API Initialization
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
            services.auditRepo.getAllEvents(),
            services.campaignRepo.getAllCampaigns(),
            services.communicationRepo.getAllCommunications(),
            services.policyRepo.getActivePolicy(),
            services.policyRepo.getPolicyHistory()
          ]);
          setCases(apiCases);
          setAuditEvents(apiAudit);
          setCampaigns(apiCampaigns);
          setCommunications(apiComms);
          setActivePolicy(apiPolicy);
          setPolicyHistory(apiPolicyHistory);
          const healthRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000"}/api/v1/system/health`).catch(() => null);
          if (healthRes && healthRes.ok) {
            const healthData = await healthRes.json();
            // Map backend health to frontend serviceHealth format if needed
            // For now, we'll just set it if format matches, or mock mapping.
            const mappedHealth = Object.keys(INITIAL_SERVICE_HEALTH).reduce((acc, key) => {
              const statusStr = healthData.services[key.toLowerCase()] || "OPERATIONAL";
              acc[key] = {
                service: key,
                status: statusStr === "OPERATIONAL" ? "OPERATIONAL" : "DEGRADED",
                latency: Math.floor(Math.random() * 50) + 10,
                lastChecked: new Date().toISOString()
              };
              return acc;
            }, {} as Record<string, any>);
            setServiceHealth(mappedHealth);
          }

        } catch (e) {
          console.error("Failed to load data from backend API:", e);
          toast({ title: "Backend Unavailable", description: "Failed to connect to the Reclaim API.", type: "error" });
        }
      };
      loadAll();
    }
  }, []);

  // Synchronize with Centralized Storage
  useEffect(() => {
    BrowserStorage.setItem(STORAGE_KEYS.CASES, cases);
  }, [cases]);

  useEffect(() => {
    BrowserStorage.setItem(STORAGE_KEYS.AUDIT_EVENTS, auditEvents);
  }, [auditEvents]);

  useEffect(() => {
    BrowserStorage.setItem(STORAGE_KEYS.CAMPAIGNS, campaigns);
  }, [campaigns]);

  useEffect(() => {
    BrowserStorage.setItem(STORAGE_KEYS.COMMUNICATIONS, communications);
  }, [communications]);

  useEffect(() => {
    BrowserStorage.setItem(STORAGE_KEYS.SERVICE_HEALTH, serviceHealth);
  }, [serviceHealth]);

  useEffect(() => {
    BrowserStorage.setItem(STORAGE_KEYS.MERCHANT_PROFILE, merchantProfile);
  }, [merchantProfile]);

  useEffect(() => {
    BrowserStorage.setItem(STORAGE_KEYS.MERCHANT_POLICY, activePolicy);
  }, [activePolicy]);

  useEffect(() => {
    BrowserStorage.setItem(STORAGE_KEYS.POLICY_HISTORY, policyHistory);
  }, [policyHistory]);

  // Deterministic metrics derived strictly from the dataset
  const metrics = useMemo(() => calculateOperationalMetrics(cases), [cases]);

  // Audit Dispatcher with standard ISO/IST timestamp representation
  const addAuditEvent = useCallback((event: Omit<AuditEvent, "id" | "timestamp">) => {
    const now = new Date();
    const formattedTimestamp = `${now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} ${now.toLocaleTimeString("en-IN", { hour12: false })} IST`;

    const newEvent: AuditEvent = {
      ...event,
      id: `EVT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      timestamp: formattedTimestamp,
    };

    setAuditEvents((prev) => [newEvent, ...prev]);
  }, []);

  const getCaseById = useCallback((id: string) => {
    return cases.find((c) => c.id === id);
  }, [cases]);

  const selectedCase = useMemo(() => {
    return selectedCaseId ? getCaseById(selectedCaseId) || null : null;
  }, [selectedCaseId, getCaseById]);

  const getCaseDecision = useCallback((caseItem: Case): RecoveryDecision => {
    return synthesizeDecision(caseItem);
  }, []);

  const getCaseStrategy = useCallback((caseItem: Case): RecoveryStrategy => {
    return buildRecoveryStrategy(caseItem);
  }, []);

  const getCasePolicy = useCallback((caseItem: Case): PolicyResult => {
    return evaluatePolicy(caseItem, activePolicy);
  }, [activePolicy]);

  const getCaseExecutionProgress = useCallback((id: string): ExecutionProgress => {
    return executionProgressMap[id] || { caseId: id, step: "idle" };
  }, [executionProgressMap]);

  const getCaseExecutionState = useCallback((id: string): string => {
    return executionProgressMap[id]?.step || "idle";
  }, [executionProgressMap]);

  const getCaseMoneyImpact = useCallback((caseItem: Case) => {
    return calculateMoneyImpact(caseItem);
  }, []);

  // Merchant Profile & Policy Actions
  const updateMerchantProfile = useCallback((updates: Partial<MerchantProfile>) => {
    setMerchantProfile((prev) => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
    toast({
      title: "Merchant Profile Updated",
      description: "Saved business preferences.",
      type: "success",
    });
  }, [toast]);

  const setMerchantRole = useCallback((role: MerchantRole) => {
    setMerchantProfile((prev) => ({ ...prev, currentRole: role }));
    toast({
      title: `Role Switched to ${role.replace("_", " ")}`,
      description: role === "VIEWER" ? "Read-only mode active." : "Operational capabilities updated.",
      type: "info",
    });
  }, [toast]);

    const updatePolicy = useCallback(async (updates: Partial<MerchantPolicy>, changeSummary: string) => {
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
  }, [activePolicy, policyHistory, merchantProfile.currentRole, addAuditEvent, toast]);

  // Fault Injection & Resilience Controllers
  const injectFailure = useCallback((service: ServiceType, reason: string, severity: FailureSeverity) => {
    setServiceHealth((prev) => injectServiceFailure(prev, service, reason, severity));
    addAuditEvent({
      layer: "LAYER 5",
      source: "VERIFICATION",
      event: "FAILURE_DETECTED",
      case: service,
      desc: `Injected failure into ${service}: ${reason} (Severity: ${severity}).`,
      status: "BLOCKED",
    });
    toast({
      title: `Service Failure Simulated (${severity})`,
      description: `${service} set to Degraded/Unavailable: ${reason}`,
      type: severity === "CRITICAL" ? "error" : "warning",
    });
  }, [addAuditEvent, toast]);

  const restoreService = useCallback((service: ServiceType) => {
    setServiceHealth((prev) => restoreServiceHealth(prev, service));
    addAuditEvent({
      layer: "LAYER 5",
      source: "VERIFICATION",
      event: "SERVICE_RECOVERED",
      case: service,
      desc: `Service health restored for ${service}. System operational.`,
      status: "SUCCESS",
    });
    toast({
      title: "Service Restored",
      description: `${service} is now fully operational.`,
      type: "success",
    });
  }, [addAuditEvent, toast]);

  const restoreAllServices = useCallback(() => {
    setServiceHealth(resetAllServices());
    addAuditEvent({
      layer: "LAYER 5",
      source: "VERIFICATION",
      event: "SERVICE_RECOVERED",
      case: "ALL_SERVICES",
      desc: "All system services restored to 100% operational health.",
      status: "SUCCESS",
    });
    toast({
      title: "All Services Restored",
      description: "Cleared all injected failure states.",
      type: "success",
    });
  }, [addAuditEvent, toast]);

  /**
   * Multi-Step Intelligent Recovery Strategy Orchestrator Pipeline with Centralized Safety Controller & Dynamic Policy
   */
  const executeRecovery = useCallback(async (caseId: string, options?: ExecuteOptions): Promise<boolean> => {
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
  }, [cases, executionProgressMap, serviceHealth, activePolicy, merchantProfile.currentRole, addAuditEvent, toast]);

  const escalateCase = useCallback((caseId: string, reason?: string) => {
    const targetCase = cases.find((c) => c.id === caseId);
    if (!targetCase) return;

    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? { ...c, status: "escalated", lastError: reason || "Escalated for human review" }
          : c
      )
    );

    addAuditEvent({
      layer: "LAYER 5",
      source: "VERIFICATION",
      event: "CASE_ESCALATED",
      case: targetCase.id,
      desc: reason ? `Escalated: ${reason}` : "Escalated to human operations desk.",
      status: "INFO",
    });

    toast({
      title: "Case Escalated",
      description: `Case ${caseId} routed to Human Operations Desk.`,
      type: "info",
    });
  }, [cases, addAuditEvent, toast]);

  const stopCase = useCallback((caseId: string, reason?: string) => {
    const targetCase = cases.find((c) => c.id === caseId);
    if (!targetCase) return;

    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? { ...c, status: "stopped", lastError: reason || "Stopped by operator" }
          : c
      )
    );

    addAuditEvent({
      layer: "LAYER 5",
      source: "VERIFICATION",
      event: "CASE_STOPPED",
      case: targetCase.id,
      desc: reason ? `Stopped: ${reason}` : "Recovery stopped by operator.",
      status: "INFO",
    });

    toast({
      title: "Recovery Stopped",
      description: `Case ${caseId} marked as stopped.`,
      type: "info",
    });
  }, [cases, addAuditEvent, toast]);

  /**
   * Batch Campaign Execution Orchestrator with Dynamic Policy Enforcement
   */
  const runCampaignBatch = useCallback(async (campaignId: string): Promise<boolean> => {
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) {
      toast({ title: "Campaign Not Found", description: `Campaign ${campaignId} does not exist.`, type: "error" });
      return false;
    }

    if (campaign.status === "RUNNING") {
      toast({ title: "Campaign Already Running", description: `${campaign.config.name} is currently executing.`, type: "warning" });
      return false;
    }

    // Check Campaign Orchestrator Service Health
    if (serviceHealth.CAMPAIGN_ORCHESTRATOR && serviceHealth.CAMPAIGN_ORCHESTRATOR.status !== "OPERATIONAL") {
      addAuditEvent({
        layer: "LAYER 0",
        source: "AGENT",
        event: "ACTION_BLOCKED_FOR_SAFETY",
        case: campaignId,
        desc: `Campaign execution blocked: Campaign Orchestrator is ${serviceHealth.CAMPAIGN_ORCHESTRATOR.status}.`,
        status: "BLOCKED",
      });
      toast({
        title: "Campaign Blocked by Safety Guardrail",
        description: "Campaign Orchestrator is unavailable. Batch paused to protect cohort.",
        type: "error",
      });
      return false;
    }

    // Set Campaign to RUNNING
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, status: "RUNNING" } : c))
    );

    addAuditEvent({
      layer: "LAYER 0",
      source: "AGENT",
      event: "CASE_CREATED",
      case: campaignId,
      desc: `Initiated batch recovery campaign: ${campaign.config.name} under Policy ${activePolicy.version}.`,
      status: "INFO",
    });

    toast({
      title: "Campaign Started 🚀",
      description: `Processing ${campaign.config.name} across eligible cases...`,
      type: "info",
    });

    // Evaluate eligible cases from current live pool
    const { eligibleCases } = evaluateCampaignEligibility(cases, campaign.config);
    const targetCases = eligibleCases.length > 0 ? eligibleCases : cases.slice(0, 3);

    let processedCount = 0;
    let recoveredCount = 0;
    let recoveredRevenuePaise = 0;
    let policyBlockCount = 0;
    let failedCount = 0;
    let escalationCount = 0;

    const newActivity: CampaignActivityItem[] = [];
    const newComms: CommunicationMessage[] = [];

    for (let i = 0; i < targetCases.length; i++) {
      const caseItem = targetCases[i];
      processedCount += 1;

      // Small execution delay to simulate real batch cadence
      await new Promise((res) => setTimeout(res, 500));

      const policy = evaluatePolicy(caseItem, activePolicy);

      if (!policy.allowed) {
        policyBlockCount += 1;
        escalationCount += 1;

        newActivity.unshift({
          id: `act_${Date.now()}_${i}`,
          timestamp: new Date().toLocaleTimeString("en-IN", { hour12: false }),
          caseId: caseItem.id,
          customerName: caseItem.customer,
          action: `Layer 3 Policy Block (${activePolicy.version})`,
          status: "BLOCKED",
          amount: caseItem.amount,
          detail: `Blocked: ${policy.blockedRules[0] || "Policy guardrail failed"}. Escalated to human queue.`,
        });

        addAuditEvent({
          layer: "LAYER 3",
          source: "POLICY_ENGINE",
          event: "POLICY_BLOCKED",
          case: caseItem.id,
          desc: `Campaign ${campaign.config.name} blocked action for ${caseItem.customer} under Policy ${activePolicy.version}: ${policy.blockedRules[0]}`,
          status: "BLOCKED",
        });

        setCases((prev) =>
          prev.map((c) => (c.id === caseItem.id ? { ...c, status: "escalated", lastError: policy.blockedRules[0] } : c))
        );
        continue;
      }

      // Successful or simulated execution
      const channel: CommunicationChannel = campaign.config.allowedChannels[0] || "whatsapp";
      const messageContent = generateRecoveryMessage(caseItem, channel, campaign.config.preferredLanguage, campaign.config.name);
      const commId = `COMM-2026-${String(Date.now()).slice(-4)}-${i}`;
      const txnId = `txn_cmp_${Date.now()}_${i}`;

      const newMsg: CommunicationMessage = {
        id: commId,
        caseId: caseItem.id,
        customerName: caseItem.customer,
        customerPhone: caseItem.customerPhone,
        amount: caseItem.amount,
        channel,
        channelName: channel === "whatsapp" ? "WhatsApp Business" : channel === "sms" ? "Gupshup SMS" : "SendGrid Email",
        language: campaign.config.preferredLanguage,
        templateKey: `tpl_${channel}_${campaign.config.preferredLanguage.toLowerCase()}`,
        content: messageContent,
        status: "DELIVERY_CONFIRMED_SIMULATED",
        contactCount: (caseItem.contactCount24h || 0) + 1,
        maxContacts: activePolicy.communicationRules.maxContacts24h,
        policyStatus: "Approved",
        campaignId: campaign.id,
        campaignName: campaign.config.name,
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        deliveredAt: new Date().toISOString(),
        recoveredAfter: true,
        transactionId: txnId,
      };

      newComms.unshift(newMsg);

      recoveredCount += 1;
      recoveredRevenuePaise += caseItem.amount;

      newActivity.unshift({
        id: `act_${Date.now()}_${i}`,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour12: false }),
        caseId: caseItem.id,
        customerName: caseItem.customer,
        action: `Dispatched ${channel.toUpperCase()} & Recovered`,
        status: "SUCCESS",
        amount: caseItem.amount,
        detail: `Captured ${formatCurrency(caseItem.amount)} via 1-click Razorpay link under Policy ${activePolicy.version}.`,
      });

      addAuditEvent({
        layer: "LAYER 4",
        source: "EXECUTOR",
        event: "ACTION_SUCCEEDED",
        case: caseItem.id,
        desc: `Campaign recovered ${formatCurrency(caseItem.amount)} for ${caseItem.customer} via ${channel}.`,
        status: "SUCCESS",
      });

      addAuditEvent({
        layer: "LAYER 5",
        source: "VERIFICATION",
        event: "CASE_RESOLVED",
        case: caseItem.id,
        desc: `Settled ${formatCurrency(caseItem.amount)} in ledger under Policy ${activePolicy.version}.`,
        status: "SUCCESS",
      });

      setCases((prev) =>
        prev.map((c) =>
          c.id === caseItem.id
            ? {
                ...c,
                status: "recovered",
                retryCount: c.retryCount + 1,
                contactCount24h: c.contactCount24h + 1,
                resolutionDetails: {
                  recoveredAmount: c.amount,
                  channel: `${channel.toUpperCase()} Link`,
                  timestamp: new Date().toISOString(),
                  transactionId: txnId,
                },
              }
            : c
        )
      );
    }

    if (newComms.length > 0) {
      setCommunications((prev) => [...newComms, ...prev]);
    }

    // Mark campaign COMPLETED and update stats
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              status: "COMPLETED",
              stats: {
                ...c.stats,
                processedCases: c.stats.processedCases + processedCount,
                recoveredCases: c.stats.recoveredCases + recoveredCount,
                revenueRecovered: c.stats.revenueRecovered + recoveredRevenuePaise,
                recoveryRate: Number((((c.stats.recoveredCases + recoveredCount) / Math.max(1, c.stats.processedCases + processedCount)) * 100).toFixed(1)),
                policyBlocks: c.stats.policyBlocks + policyBlockCount,
                failedActions: c.stats.failedActions + failedCount,
                escalations: c.stats.escalations + escalationCount,
                communicationsSent: c.stats.communicationsSent + newComms.length,
                communicationsDelivered: c.stats.communicationsDelivered + newComms.length,
              },
              recentActivity: [...newActivity, ...c.recentActivity].slice(0, 20),
            }
          : c
      )
    );

    addAuditEvent({
      layer: "LAYER 5",
      source: "VERIFICATION",
      event: "CASE_RESOLVED",
      case: campaignId,
      desc: `Campaign ${campaign.config.name} completed under Policy ${activePolicy.version}. Processed ${processedCount} cases, recovered ${formatCurrency(recoveredRevenuePaise)}.`,
      status: "SUCCESS",
    });

    toast({
      title: "Campaign Completed! 🎉",
      description: `Recovered ${formatCurrency(recoveredRevenuePaise)} across ${recoveredCount} cases in ${campaign.config.name}.`,
      type: "success",
      duration: 5000,
    });

    return true;
  }, [campaigns, cases, serviceHealth, activePolicy, addAuditEvent, toast]);

  const toggleCampaignStatus = useCallback(async (campaignId: string) => {
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
          res = await services.campaignRepo.pauseCampaign(campaignId);
        } else if (currentStatus === "PAUSED") {
          res = await services.campaignRepo.resumeCampaign(campaignId);
        } else {
          res = await services.campaignRepo.startCampaign(campaignId);
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
  }, [campaigns, toast]);

  const createCampaign = useCallback((config: CampaignConfig) => {
    const newCampaign: Campaign = {
      id: config.id,
      config,
      status: "READY",
      stats: {
        totalEligibleCases: 15,
        processedCases: 0,
        recoveredCases: 0,
        revenueAtRisk: 12500000,
        revenueRecovered: 0,
        recoveryRate: 0,
        policyBlocks: 0,
        failedActions: 0,
        escalations: 0,
        stoppedCases: 0,
        communicationsSent: 0,
        communicationsDelivered: 0,
      },
      caseIds: [],
      recentActivity: [],
    };

    setCampaigns((prev) => [newCampaign, ...prev]);

    addAuditEvent({
      layer: "LAYER 0",
      source: "AGENT",
      event: "CASE_CREATED",
      case: config.id,
      desc: `Created new recovery campaign: ${config.name}.`,
      status: "INFO",
    });

    toast({
      title: "Campaign Created",
      description: `${config.name} configured and ready for execution.`,
      type: "success",
    });
  }, [addAuditEvent, toast]);

  const sendCommunicationMessage = useCallback(async (
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
          recoveredAfter: true,
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
  }, [cases, serviceHealth, activePolicy, addAuditEvent, toast]);

  /**
   * Deterministic Failure Scenario Runner
   */
  const runFailureScenario = useCallback(async (
    scenarioId: string,
    targetCaseId: string = "RC-2024-081"
  ): Promise<FailureScenarioResult> => {
    const config = FAILURE_SCENARIOS.find((s) => s.id === scenarioId) || FAILURE_SCENARIOS[0];

    // 1. Fault injection
    injectFailure(config.targetService, config.simulatedError, config.severity);

    // 2. Execution attempt
    await executeRecovery(targetCaseId);

    // 3. Return structured scenario assessment
    return {
      scenarioId: config.id,
      title: config.title,
      failedComponent: config.targetService,
      severity: config.severity,
      reclaimDid: [
        "Detected failure in real-time",
        "Engaged safety controller to halt unsafe execution",
        "Checked idempotency to prevent duplicate triggers",
        "Logged immutable audit event with layer attribution",
        "Preserved case state without financial leakage",
      ],
      reclaimDidNot: [
        "Record unverified revenue as recovered",
        "Double-debit the customer card / UPI mandate",
        "Bypass deterministic policy constraints",
        "Silently drop the exception",
      ],
      finalCaseState: config.expectedState,
      financialImpact: config.financialImpact,
      auditEventsCreated: ["FAILURE_DETECTED", "ACTION_BLOCKED_FOR_SAFETY", "CASE_ESCALATED"],
      recoveryPath: config.recoveryPath,
    };
  }, [injectFailure, executeRecovery]);

  const resetDemoData = useCallback(() => {
    setCases(INITIAL_MOCK_CASES);
    setAuditEvents(INITIAL_AUDIT_EVENTS);
    setCampaigns(INITIAL_CAMPAIGNS);
    setCommunications(INITIAL_COMMUNICATIONS);
    setServiceHealth(INITIAL_SERVICE_HEALTH);
    setMerchantProfile(INITIAL_MERCHANT_PROFILE);
    setActivePolicy(INITIAL_MERCHANT_POLICY);
    setPolicyHistory(INITIAL_POLICY_HISTORY);
    setExecutionProgressMap({});
    setSelectedCaseId(null);
    BrowserStorage.clearAll();
    toast({
      title: "Demo State Reset",
      description: "Restored initial cases, metrics, policy v1, and audit ledger.",
      type: "info",
    });
  }, [toast]);

  return (
    <ReclaimContext.Provider
      value={{
        cases,
        auditEvents,
        campaigns,
        communications,
        serviceHealth,
        merchantProfile,
        activePolicy,
        policyHistory,
        selectedCaseId,
        setSelectedCaseId,
        selectedCase,
        metrics,
        updateMerchantProfile,
        updatePolicy,
        rollbackPolicy,
        setMerchantRole,
        getCaseById,
        getCaseDecision,
        getCaseStrategy,
        getCasePolicy,
        getCaseExecutionProgress,
        getCaseExecutionState,
        getCaseMoneyImpact,
        executeRecovery,
        escalateCase,
        stopCase,
        resetDemoData,
        runCampaignBatch,
        toggleCampaignStatus,
        createCampaign,
        sendCommunicationMessage,
        injectFailure,
        restoreService,
        restoreAllServices,
        runFailureScenario,
        addAuditEvent,
      }}
    >
      {children}
    </ReclaimContext.Provider>
  );
}

export function useReclaim() {
  const context = useContext(ReclaimContext);
  if (!context) {
    throw new Error("useReclaim must be used within a ReclaimProvider");
  }
  return context;
}
