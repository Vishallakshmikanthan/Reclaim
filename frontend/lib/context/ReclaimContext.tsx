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

  // Audit Dispatcher
  addAuditEvent: (event: Omit<AuditEvent, "id" | "timestamp">) => void;
}

const ReclaimContext = createContext<ReclaimContextType | undefined>(undefined);

const STORAGE_CASES_KEY = "reclaim_v1_cases";
const STORAGE_AUDIT_KEY = "reclaim_v1_audit";
const STORAGE_CAMPAIGNS_KEY = "reclaim_v1_campaigns";
const STORAGE_COMMUNICATIONS_KEY = "reclaim_v1_communications";

export function ReclaimProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  const [cases, setCases] = useState<Case[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_CASES_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse cases from localStorage:", e);
        }
      }
    }
    return INITIAL_MOCK_CASES;
  });

  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_AUDIT_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse audit events from localStorage:", e);
        }
      }
    }
    return INITIAL_AUDIT_EVENTS;
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_CAMPAIGNS_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse campaigns from localStorage:", e);
        }
      }
    }
    return INITIAL_CAMPAIGNS;
  });

  const [communications, setCommunications] = useState<CommunicationMessage[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_COMMUNICATIONS_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse communications from localStorage:", e);
        }
      }
    }
    return INITIAL_COMMUNICATIONS;
  });

  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  
  // Execution state & progress tracking per case
  const [executionProgressMap, setExecutionProgressMap] = useState<Record<string, ExecutionProgress>>({});

  // Synchronize with LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_CASES_KEY, JSON.stringify(cases));
    }
  }, [cases]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_AUDIT_KEY, JSON.stringify(auditEvents));
    }
  }, [auditEvents]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_CAMPAIGNS_KEY, JSON.stringify(campaigns));
    }
  }, [campaigns]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_COMMUNICATIONS_KEY, JSON.stringify(communications));
    }
  }, [communications]);

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
    return evaluatePolicy(caseItem);
  }, []);

  const getCaseExecutionProgress = useCallback((id: string): ExecutionProgress => {
    return executionProgressMap[id] || { caseId: id, step: "idle" };
  }, [executionProgressMap]);

  const getCaseExecutionState = useCallback((id: string): string => {
    return executionProgressMap[id]?.step || "idle";
  }, [executionProgressMap]);

  const getCaseMoneyImpact = useCallback((caseItem: Case) => {
    return calculateMoneyImpact(caseItem);
  }, []);

  /**
   * Multi-Step Intelligent Recovery Strategy Orchestrator Pipeline
   */
  const executeRecovery = useCallback(async (caseId: string, options?: ExecuteOptions): Promise<boolean> => {
    const targetCase = cases.find((c) => c.id === caseId);
    if (!targetCase) {
      toast({ title: "Case Not Found", description: `Case ${caseId} does not exist.`, type: "error" });
      return false;
    }

    // 1. IDEMPOTENCY CHECK
    const currentProgress = executionProgressMap[caseId];
    if (currentProgress && ["authorizing", "executing", "verifying"].includes(currentProgress.step)) {
      toast({
        title: "Recovery In Progress",
        description: `Recovery for case ${caseId} is already executing. Duplicate action prevented.`,
        type: "warning",
      });
      return false;
    }

    if (targetCase.status === "recovered") {
      toast({
        title: "Already Recovered",
        description: `Case ${caseId} is already settled for ${formatCurrency(targetCase.amount)}. Duplicate action prevented.`,
        type: "info",
      });
      return false;
    }

    const decision = synthesizeDecision(targetCase);
    const strategy = buildRecoveryStrategy(targetCase);
    const policy = evaluatePolicy(targetCase);
    const effectiveScenario = options?.forceScenario || targetCase.demoScenario || "A_SUCCESS";
    const idempotencyKey = `rz_rec_${targetCase.id}_${Date.now()}`;

    // --- STEP 1: LAYER 3 POLICY CHECK (PRIMARY ACTION) ---
    setExecutionProgressMap((prev) => ({
      ...prev,
      [caseId]: { caseId, step: "authorizing", idempotencyKey, currentIntervention: strategy.primaryAction.label }
    }));

    addAuditEvent({
      layer: "LAYER 2",
      source: "AGENT",
      event: "STRATEGY_CREATED",
      case: targetCase.id,
      desc: `Orchestrated ${strategy.steps.length}-step recovery chain: ${strategy.primaryAction.label} → Fallback: ${strategy.fallbackActions[0]?.label || 'Human Escalation'}.`,
      status: "INFO",
      details: {
        strategyStep: "PRIMARY",
        amount: targetCase.amount,
        nextAction: "Evaluate against Layer 3 Policy Guardrails",
      },
    });

    addAuditEvent({
      layer: "LAYER 3",
      source: "POLICY_ENGINE",
      event: "POLICY_CHECKED",
      case: targetCase.id,
      desc: `Evaluating 6 deterministic rules for primary action: ${strategy.primaryAction.label}.`,
      status: "INFO",
      details: {
        amount: targetCase.amount,
        policyRule: "6_INVARIANTS_CHECK",
        nextAction: "Policy approval or block",
      },
    });

    await new Promise((res) => setTimeout(res, 500));

    // Check if Primary is blocked by policy
    if (!policy.allowed || effectiveScenario === "block" || effectiveScenario === "B_POLICY_BLOCK") {
      setExecutionProgressMap((prev) => ({
        ...prev,
        [caseId]: { caseId, step: "blocked", idempotencyKey }
      }));

      const blockReason = policy.blockedRules[0] || "Maximum retry ceiling (3/3) exceeded.";

      addAuditEvent({
        layer: "LAYER 3",
        source: "POLICY_ENGINE",
        event: "POLICY_BLOCKED",
        case: targetCase.id,
        desc: `Action blocked: ${blockReason}. Autonomous execution prohibited.`,
        status: "BLOCKED",
        details: {
          policyRule: policy.blockedRules[0] || "MAX_RETRY_COUNT",
          threshold: "Max 3 attempts",
          actualValue: `${targetCase.retryCount} retries recorded`,
          reason: blockReason,
          nextAction: "Escalate to Human Operations Desk",
        },
      });

      addAuditEvent({
        layer: "LAYER 5",
        source: "VERIFICATION",
        event: "CASE_ESCALATED",
        case: targetCase.id,
        desc: `Transferred to human operations desk due to policy block: ${blockReason}`,
        status: "BLOCKED",
        details: {
          reason: blockReason,
          nextAction: "Assigned to Human Queue",
        },
      });

      setCases((prev) =>
        prev.map((c) =>
          c.id === caseId
            ? { ...c, status: "escalated", lastError: `Policy blocked: ${blockReason}` }
            : c
        )
      );

      toast({
        title: "Action Blocked by Policy",
        description: blockReason,
        type: "error",
        duration: 4500,
      });

      return false;
    }

    addAuditEvent({
      layer: "LAYER 3",
      source: "POLICY_ENGINE",
      event: "POLICY_APPROVED",
      case: targetCase.id,
      desc: `All 6 deterministic rules satisfied. Action authorized for ${formatCurrency(targetCase.amount)}.`,
      status: "SUCCESS",
      details: {
        policyRule: "ALL_RULES_PASSED",
        threshold: "6/6 Rules",
        actualValue: "Approved",
        nextAction: `Dispatch ${strategy.primaryAction.label} (Layer 4)`,
      },
    });

    // --- STEP 2: LAYER 4 RAZORPAY TEST MODE PRIMARY EXECUTION ---
    setExecutionProgressMap((prev) => ({
      ...prev,
      [caseId]: { caseId, step: "executing", idempotencyKey, gateway: "Razorpay Test Gateway", currentIntervention: strategy.primaryAction.label }
    }));

    addAuditEvent({
      layer: "LAYER 4",
      source: "EXECUTOR",
      event: "ACTION_EXECUTED",
      case: targetCase.id,
      desc: `Dispatched Razorpay Test Mode primary action: ${strategy.primaryAction.label} with idempotency key ${idempotencyKey}.`,
      status: "INFO",
      details: {
        gateway: "Razorpay Test Mode Gateway",
        idempotencyKey,
        amount: targetCase.amount,
        paymentMethod: targetCase.paymentMethod,
        customer: targetCase.customer,
      },
    });

    toast({
      title: "Executing Primary Action (Layer 4)",
      description: `Sending ${strategy.primaryAction.label} for ${formatCurrency(targetCase.amount)}...`,
      type: "info",
      duration: 1800,
    });

    const executionRequest: ExecutionRequest = {
      caseId: targetCase.id,
      amount: targetCase.amount,
      paymentMethod: targetCase.paymentMethod,
      intervention: strategy.primaryAction.label,
      strategy: targetCase.strategy,
      idempotencyKey,
      isTestMode: true,
    };

    const executionResult = await defaultRecoveryExecutor.execute(executionRequest);

    // --- STEP 3: LAYER 5 VERIFICATION OF PRIMARY ACTION ---
    setExecutionProgressMap((prev) => ({
      ...prev,
      [caseId]: { 
        caseId, 
        step: "verifying", 
        idempotencyKey, 
        gateway: executionResult.gateway 
      }
    }));

    // Check special multi-step fallback scenarios
    if (effectiveScenario === "fallback_success") {
      addAuditEvent({
        layer: "LAYER 4",
        source: "EXECUTOR",
        event: "ACTION_FAILED",
        case: targetCase.id,
        desc: `Primary retry timed out. Triggering autonomous fallback sequence.`,
        status: "FAILED",
      });

      const fallbackStep = strategy.fallbackActions[0] || {
        label: "WhatsApp 1-Click Payment Link",
        channel: "whatsapp_link",
      };

      addAuditEvent({
        layer: "LAYER 2",
        source: "AGENT",
        event: "FALLBACK_SELECTED",
        case: targetCase.id,
        desc: `Selected Fallback Step 2: ${fallbackStep.label}. Initiating secondary policy evaluation.`,
        status: "INFO",
      });

      addAuditEvent({
        layer: "LAYER 3",
        source: "POLICY_ENGINE",
        event: "POLICY_RECHECKED",
        case: targetCase.id,
        desc: `Policy recheck: Customer contact frequency (1/2 in 24h) and link amount within limits. Authorized.`,
        status: "SUCCESS",
      });

      const fallbackIdempotencyKey = `rz_rec_fb_${targetCase.id}_${Date.now()}`;

      addAuditEvent({
        layer: "LAYER 4",
        source: "EXECUTOR",
        event: "ACTION_EXECUTED",
        case: targetCase.id,
        desc: `Dispatched ${fallbackStep.label} via Gupshup/Razorpay Link API with key ${fallbackIdempotencyKey}.`,
        status: "INFO",
      });

      await new Promise((res) => setTimeout(res, 600));

      const fallbackTxnId = `txn_rz_fb_${Date.now()}`;

      addAuditEvent({
        layer: "LAYER 4",
        source: "EXECUTOR",
        event: "ACTION_SUCCEEDED",
        case: targetCase.id,
        desc: `Customer completed payment via WhatsApp 1-Click Link. Captured ${formatCurrency(targetCase.amount)}. Ref: ${fallbackTxnId}`,
        status: "SUCCESS",
      });

      addAuditEvent({
        layer: "LAYER 5",
        source: "VERIFICATION",
        event: "RECOVERY_VERIFIED",
        case: targetCase.id,
        desc: `Fallback recovery verified by webhook telemetry. Settled ${formatCurrency(targetCase.amount)} in ledger.`,
        status: "SUCCESS",
      });

      addAuditEvent({
        layer: "LAYER 5",
        source: "VERIFICATION",
        event: "CASE_RESOLVED",
        case: targetCase.id,
        desc: `Case resolved successfully via Fallback Strategy (${fallbackStep.label}).`,
        status: "SUCCESS",
      });

      setCases((prev) =>
        prev.map((c) =>
          c.id === caseId
            ? {
                ...c,
                status: "recovered",
                retryCount: c.retryCount + 2,
                contactCount24h: c.contactCount24h + 1,
                resolutionDetails: {
                  recoveredAmount: c.amount,
                  channel: fallbackStep.label,
                  timestamp: new Date().toISOString(),
                  transactionId: fallbackTxnId,
                },
              }
            : c
        )
      );

      setExecutionProgressMap((prev) => ({
        ...prev,
        [caseId]: { 
          caseId, 
          step: "success", 
          idempotencyKey: fallbackIdempotencyKey, 
          transactionId: fallbackTxnId,
          currentIntervention: fallbackStep.label,
          isFallback: true,
        }
      }));

      toast({
        title: "Fallback Recovery Succeeded! 🎉",
        description: `Primary retry failed, but fallback WhatsApp link successfully recovered ${formatCurrency(targetCase.amount)}.`,
        type: "success",
        duration: 5000,
      });

      return true;
    }

    if (effectiveScenario === "fallback_blocked") {
      addAuditEvent({
        layer: "LAYER 4",
        source: "EXECUTOR",
        event: "ACTION_FAILED",
        case: targetCase.id,
        desc: `Primary retry declined by bank. Evaluating fallback intervention.`,
        status: "FAILED",
      });

      addAuditEvent({
        layer: "LAYER 3",
        source: "POLICY_ENGINE",
        event: "FALLBACK_BLOCKED",
        case: targetCase.id,
        desc: `Fallback blocked: Customer contact limit exceeded (2/2 allowed contacts in 24h already reached).`,
        status: "BLOCKED",
      });

      addAuditEvent({
        layer: "LAYER 5",
        source: "VERIFICATION",
        event: "STOPPING_RULE_TRIGGERED",
        case: targetCase.id,
        desc: `Stopping Rule engaged: CONTACT_LIMIT_REACHED. All further automated communications prohibited.`,
        status: "BLOCKED",
      });

      addAuditEvent({
        layer: "LAYER 5",
        source: "VERIFICATION",
        event: "CASE_ESCALATED",
        case: targetCase.id,
        desc: `Case transferred to human desk. Zero additional automated messages sent.`,
        status: "BLOCKED",
      });

      setCases((prev) =>
        prev.map((c) =>
          c.id === caseId
            ? { ...c, status: "escalated", lastError: "Fallback blocked: Contact limit (2/2) reached." }
            : c
        )
      );

      setExecutionProgressMap((prev) => ({
        ...prev,
        [caseId]: { caseId, step: "blocked", idempotencyKey }
      }));

      toast({
        title: "Fallback Blocked by Guardrail",
        description: "Customer contact limit reached (2/2). Prevented customer spam. Escalated.",
        type: "warning",
        duration: 5000,
      });

      return false;
    }

    const verificationOutcome = await defaultVerificationService.verify(
      executionResult, 
      effectiveScenario
    );

    // SCENARIO C: VERIFICATION TIMEOUT
    if (verificationOutcome.status === "TIMEOUT") {
      setExecutionProgressMap((prev) => ({
        ...prev,
        [caseId]: { caseId, step: "timeout", idempotencyKey }
      }));

      addAuditEvent({
        layer: "LAYER 4",
        source: "EXECUTOR",
        event: "VERIFICATION_TIMEOUT",
        case: targetCase.id,
        desc: "Gateway verification response timed out after 30s. Bounded safety: NO automatic duplicate retry or fallback dispatched.",
        status: "TIMEOUT",
      });

      addAuditEvent({
        layer: "LAYER 5",
        source: "VERIFICATION",
        event: "CASE_ESCALATED",
        case: targetCase.id,
        desc: "Case escalated for manual reconciliation. Settlement status remains unconfirmed.",
        status: "TIMEOUT",
      });

      setCases((prev) =>
        prev.map((c) =>
          c.id === caseId
            ? {
                ...c,
                status: "escalated",
                retryCount: c.retryCount + 1,
                lastError: "Verification timed out. Telemetry unconfirmed.",
              }
            : c
        )
      );

      toast({
        title: "Verification Timed Out ⚠️",
        description: "Gateway response ambiguous. Stopped duplicate retries to prevent double debits. Escalated.",
        type: "warning",
        duration: 5000,
      });

      return false;
    }

    // SCENARIO D: RECOVERY FAILURE
    if (verificationOutcome.status === "FAILED" || effectiveScenario === "failure") {
      setExecutionProgressMap((prev) => ({
        ...prev,
        [caseId]: { caseId, step: "failed", idempotencyKey }
      }));

      addAuditEvent({
        layer: "LAYER 4",
        source: "EXECUTOR",
        event: "ACTION_FAILED",
        case: targetCase.id,
        desc: `Razorpay retry declined by issuing bank: ${verificationOutcome.message}`,
        status: "FAILED",
      });

      addAuditEvent({
        layer: "LAYER 5",
        source: "VERIFICATION",
        event: "CASE_ESCALATED",
        case: targetCase.id,
        desc: "Automated retry path exhausted. Case escalated to customer success desk.",
        status: "FAILED",
      });

      setCases((prev) =>
        prev.map((c) =>
          c.id === caseId
            ? {
                ...c,
                status: "escalated",
                retryCount: c.retryCount + 1,
                lastError: "Issuing bank declined retry authorization.",
              }
            : c
        )
      );

      toast({
        title: "Recovery Action Failed",
        description: "Issuing bank declined the retry challenge. Escalated to operations desk.",
        type: "error",
        duration: 4500,
      });

      return false;
    }

    // SCENARIO A: SUCCESSFUL PRIMARY RECOVERY & REVENUE SETTLEMENT
    const txnId = verificationOutcome.transactionId || `txn_rz_${Date.now()}`;

    setExecutionProgressMap((prev) => ({
      ...prev,
      [caseId]: { 
        caseId, 
        step: "success", 
        idempotencyKey, 
        transactionId: txnId,
        latency: `${verificationOutcome.telemetryLatencyMs}ms`,
        currentIntervention: strategy.primaryAction.label
      }
    }));

    addAuditEvent({
      layer: "LAYER 4",
      source: "EXECUTOR",
      event: "ACTION_SUCCEEDED",
      case: targetCase.id,
      desc: `Razorpay Test Mode captured ${formatCurrency(targetCase.amount)}. Ref: ${txnId}`,
      status: "SUCCESS",
    });

    addAuditEvent({
      layer: "LAYER 5",
      source: "VERIFICATION",
      event: "RECOVERY_VERIFIED",
      case: targetCase.id,
      desc: `Primary recovery verified by webhook telemetry. Settled ${formatCurrency(targetCase.amount)} in ledger.`,
      status: "SUCCESS",
    });

    addAuditEvent({
      layer: "LAYER 5",
      source: "VERIFICATION",
      event: "CASE_RESOLVED",
      case: targetCase.id,
      desc: `Settled ${formatCurrency(targetCase.amount)} in ledger. Revenue at Risk reduced.`,
      status: "SUCCESS",
    });

    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              status: "recovered",
              retryCount: c.retryCount + 1,
              resolutionDetails: {
                recoveredAmount: c.amount,
                channel: strategy.primaryAction.label,
                timestamp: new Date().toISOString(),
                transactionId: txnId,
              },
            }
          : c
      )
    );

    toast({
      title: "Money Recovered! 🎉",
      description: `Successfully captured ${formatCurrency(targetCase.amount)} via ${strategy.primaryAction.label}. Dashboard updated.`,
      type: "success",
      duration: 4000,
    });

    return true;
  }, [cases, executionProgressMap, addAuditEvent, toast]);

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
   * Batch Campaign Execution Orchestrator
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

    // Set Campaign to RUNNING
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, status: "RUNNING" } : c))
    );

    addAuditEvent({
      layer: "LAYER 0",
      source: "AGENT",
      event: "CASE_CREATED",
      case: campaignId,
      desc: `Initiated batch recovery campaign: ${campaign.config.name}.`,
      status: "INFO",
    });

    toast({
      title: "Campaign Started 🚀",
      description: `Processing ${campaign.config.name} across eligible cases...`,
      type: "info",
    });

    // Evaluate eligible cases from current live pool
    const { eligibleCases } = evaluateCampaignEligibility(cases, campaign.config);
    const targetCases = eligibleCases.length > 0 ? eligibleCases : cases.slice(0, 3); // Fallback sample if pool is narrow

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

      const policy = evaluatePolicy(caseItem);
      const isCommunicationAction = campaign.config.allowedChannels.includes("whatsapp") || campaign.config.allowedChannels.includes("sms") || campaign.config.allowedChannels.includes("email");

      if (!policy.allowed) {
        policyBlockCount += 1;
        escalationCount += 1;

        newActivity.unshift({
          id: `act_${Date.now()}_${i}`,
          timestamp: new Date().toLocaleTimeString("en-IN", { hour12: false }),
          caseId: caseItem.id,
          customerName: caseItem.customer,
          action: "Layer 3 Policy Block",
          status: "BLOCKED",
          amount: caseItem.amount,
          detail: `Blocked: ${policy.blockedRules[0] || "Policy guardrail failed"}. Escalated to human queue.`,
        });

        addAuditEvent({
          layer: "LAYER 3",
          source: "POLICY_ENGINE",
          event: "POLICY_BLOCKED",
          case: caseItem.id,
          desc: `Campaign ${campaign.config.name} blocked action for ${caseItem.customer}: ${policy.blockedRules[0]}`,
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
        maxContacts: 2,
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
        detail: `Captured ${formatCurrency(caseItem.amount)} via 1-click Razorpay link.`,
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
        desc: `Settled ${formatCurrency(caseItem.amount)} in ledger.`,
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
      desc: `Campaign ${campaign.config.name} completed. Processed ${processedCount} cases, recovered ${formatCurrency(recoveredRevenuePaise)}.`,
      status: "SUCCESS",
    });

    toast({
      title: "Campaign Completed! 🎉",
      description: `Recovered ${formatCurrency(recoveredRevenuePaise)} across ${recoveredCount} cases in ${campaign.config.name}.`,
      type: "success",
      duration: 5000,
    });

    return true;
  }, [campaigns, cases, addAuditEvent, toast]);

  const toggleCampaignStatus = useCallback((campaignId: string) => {
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
  }, [toast]);

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

    if ((targetCase.contactCount24h || 0) >= 2) {
      toast({
        title: "Communication Blocked by Policy",
        description: `Customer contact limit (2/2 in 24h) reached for ${targetCase.customer}. Prevented customer spam.`,
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
      maxContacts: 2,
      policyStatus: "Approved",
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      deliveredAt: new Date().toISOString(),
      recoveredAfter: true,
      transactionId: `txn_comm_${Date.now()}`,
    };

    setCommunications((prev) => [newMsg, ...prev]);

    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, contactCount24h: (c.contactCount24h || 0) + 1 } : c))
    );

    addAuditEvent({
      layer: "LAYER 4",
      source: "EXECUTOR",
      event: "ACTION_EXECUTED",
      case: targetCase.id,
      desc: `Simulated dispatch of ${channel.toUpperCase()} message in ${language} to ${targetCase.customer}.`,
      status: "INFO",
    });

    toast({
      title: "Message Dispatched (Simulated)",
      description: `Sent ${channel.toUpperCase()} recovery reminder to ${targetCase.customer}.`,
      type: "success",
    });

    return true;
  }, [cases, addAuditEvent, toast]);

  const resetDemoData = useCallback(() => {
    setCases(INITIAL_MOCK_CASES);
    setAuditEvents(INITIAL_AUDIT_EVENTS);
    setCampaigns(INITIAL_CAMPAIGNS);
    setCommunications(INITIAL_COMMUNICATIONS);
    setExecutionProgressMap({});
    setSelectedCaseId(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_CASES_KEY);
      localStorage.removeItem(STORAGE_AUDIT_KEY);
      localStorage.removeItem(STORAGE_CAMPAIGNS_KEY);
      localStorage.removeItem(STORAGE_COMMUNICATIONS_KEY);
    }
    toast({
      title: "Demo State Reset",
      description: "Restored initial campaigns, cases, metrics, and audit ledger.",
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
        selectedCaseId,
        setSelectedCaseId,
        selectedCase,
        metrics,
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
