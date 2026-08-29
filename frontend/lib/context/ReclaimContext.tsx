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

interface ExecuteOptions {
  forceScenario?: "success" | "timeout" | "block" | "failure" | "fallback_success" | "fallback_blocked";
}

interface ReclaimContextType {
  cases: Case[];
  auditEvents: AuditEvent[];
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

  // Audit Dispatcher
  addAuditEvent: (event: Omit<AuditEvent, "id" | "timestamp">) => void;
}

const ReclaimContext = createContext<ReclaimContextType | undefined>(undefined);

const STORAGE_CASES_KEY = "reclaim_v1_cases";
const STORAGE_AUDIT_KEY = "reclaim_v1_audit";

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
   * Supports Primary Execution, Dynamic Policy Recheck, Fallback Chains, and Verification Safety.
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
      // Primary failed -> Trigger Fallback Chain
      addAuditEvent({
        layer: "LAYER 4",
        source: "EXECUTOR",
        event: "ACTION_FAILED",
        case: targetCase.id,
        desc: `Primary retry timed out. Triggering autonomous fallback sequence.`,
        status: "FAILED",
        details: {
          reason: "Primary gateway retry unacknowledged.",
          nextAction: "Select Fallback Intervention & Recheck Policy",
        },
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
        details: {
          isFallback: true,
          strategyStep: "FALLBACK_1",
          nextAction: "Recheck Customer Contact Limit & Policy",
        },
      });

      // POLICY RECHECK
      addAuditEvent({
        layer: "LAYER 3",
        source: "POLICY_ENGINE",
        event: "POLICY_RECHECKED",
        case: targetCase.id,
        desc: `Policy recheck: Customer contact frequency (1/2 in 24h) and link amount within limits. Authorized.`,
        status: "SUCCESS",
        details: {
          isFallback: true,
          policyRule: "CUSTOMER_CONTACT_LIMIT",
          threshold: "Max 2 contacts in 24h",
          actualValue: "1 contact recorded",
          nextAction: `Dispatch ${fallbackStep.label}`,
        },
      });

      const fallbackIdempotencyKey = `rz_rec_fb_${targetCase.id}_${Date.now()}`;

      addAuditEvent({
        layer: "LAYER 4",
        source: "EXECUTOR",
        event: "ACTION_EXECUTED",
        case: targetCase.id,
        desc: `Dispatched ${fallbackStep.label} via Gupshup/Razorpay Link API with key ${fallbackIdempotencyKey}.`,
        status: "INFO",
        details: {
          isFallback: true,
          gateway: "Razorpay Test Links (v1/payment_links)",
          idempotencyKey: fallbackIdempotencyKey,
          amount: targetCase.amount,
        },
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
        details: {
          isFallback: true,
          transactionId: fallbackTxnId,
          amount: targetCase.amount,
        },
      });

      addAuditEvent({
        layer: "LAYER 5",
        source: "VERIFICATION",
        event: "RECOVERY_VERIFIED",
        case: targetCase.id,
        desc: `Fallback recovery verified by webhook telemetry. Settled ${formatCurrency(targetCase.amount)} in ledger.`,
        status: "SUCCESS",
        details: {
          isFallback: true,
          amount: targetCase.amount,
          transactionId: fallbackTxnId,
        },
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
      // Primary failed -> Fallback selected -> Blocked by Policy
      addAuditEvent({
        layer: "LAYER 4",
        source: "EXECUTOR",
        event: "ACTION_FAILED",
        case: targetCase.id,
        desc: `Primary retry declined by bank. Evaluating fallback intervention.`,
        status: "FAILED",
      });

      addAuditEvent({
        layer: "LAYER 2",
        source: "AGENT",
        event: "FALLBACK_SELECTED",
        case: targetCase.id,
        desc: `Selected Fallback: WhatsApp Payment Link. Re-evaluating policy guardrails.`,
        status: "INFO",
      });

      addAuditEvent({
        layer: "LAYER 3",
        source: "POLICY_ENGINE",
        event: "FALLBACK_BLOCKED",
        case: targetCase.id,
        desc: `Fallback blocked: Customer contact limit exceeded (2/2 allowed contacts in 24h already reached).`,
        status: "BLOCKED",
        details: {
          policyRule: "CUSTOMER_CONTACT_LIMIT",
          threshold: "Max 2 contacts in 24h",
          actualValue: "2 contacts recorded",
          reason: "Customer spam prevention policy engaged.",
          nextAction: "Escalate to Human Queue",
        },
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
        details: {
          gateway: "Razorpay Test Webhook / Polling",
          idempotencyKey,
          reason: "Gateway response unconfirmed after 30s.",
          nextAction: "Halt automatic retry • Escalate to human reconciliation",
        },
      });

      addAuditEvent({
        layer: "LAYER 5",
        source: "VERIFICATION",
        event: "CASE_ESCALATED",
        case: targetCase.id,
        desc: "Case escalated for manual reconciliation. Settlement status remains unconfirmed.",
        status: "TIMEOUT",
        details: {
          reason: "Ambiguous gateway response.",
          nextAction: "Route to Manual Finance Reconciliation Queue",
        },
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
        details: {
          gateway: "Razorpay Test Gateway",
          idempotencyKey,
          reason: verificationOutcome.message,
          nextAction: "Escalate to Customer Success Desk",
        },
      });

      addAuditEvent({
        layer: "LAYER 5",
        source: "VERIFICATION",
        event: "CASE_ESCALATED",
        case: targetCase.id,
        desc: "Automated retry path exhausted. Case escalated to customer success desk.",
        status: "FAILED",
        details: {
          reason: "Issuer hard decline on automated retry.",
          nextAction: "Assigned to VIP Customer Success Desk",
        },
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
      details: {
        gateway: "Razorpay Test Mode Gateway",
        transactionId: txnId,
        idempotencyKey,
        amount: targetCase.amount,
      },
    });

    addAuditEvent({
      layer: "LAYER 5",
      source: "VERIFICATION",
      event: "RECOVERY_VERIFIED",
      case: targetCase.id,
      desc: `Primary recovery verified by webhook telemetry. Settled ${formatCurrency(targetCase.amount)} in ledger.`,
      status: "SUCCESS",
      details: {
        amount: targetCase.amount,
        transactionId: txnId,
      },
    });

    addAuditEvent({
      layer: "LAYER 5",
      source: "VERIFICATION",
      event: "CASE_RESOLVED",
      case: targetCase.id,
      desc: `Settled ${formatCurrency(targetCase.amount)} in ledger. Revenue at Risk reduced.`,
      status: "SUCCESS",
      details: {
        amount: targetCase.amount,
        transactionId: txnId,
        customer: targetCase.customer,
        nextAction: "Case marked settled • No further action required",
      },
    });

    // Update case state to RECOVERED and record settlement details
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
      details: {
        reason: reason || "Manual escalation from Case Drawer",
        nextAction: "Routed to Human Review Queue",
      },
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
      details: {
        reason: reason || "Operator manual intervention",
        nextAction: "Permanent stop on autonomous retry",
      },
    });

    toast({
      title: "Recovery Stopped",
      description: `Case ${caseId} marked as stopped.`,
      type: "info",
    });
  }, [cases, addAuditEvent, toast]);

  const resetDemoData = useCallback(() => {
    setCases(INITIAL_MOCK_CASES);
    setAuditEvents(INITIAL_AUDIT_EVENTS);
    setExecutionProgressMap({});
    setSelectedCaseId(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_CASES_KEY);
      localStorage.removeItem(STORAGE_AUDIT_KEY);
    }
    toast({
      title: "Demo State Reset",
      description: "Restored initial cases, metrics, and audit ledger.",
      type: "info",
    });
  }, [toast]);

  return (
    <ReclaimContext.Provider
      value={{
        cases,
        auditEvents,
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
