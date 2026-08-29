"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { 
  Case, 
  AuditEvent, 
  RecoveryDecision, 
  PolicyResult, 
  AuditEventType, 
  AuditLayer,
  ExecutionProgress
} from "../types";
import { INITIAL_MOCK_CASES } from "../mock-data/mockCases";
import { INITIAL_AUDIT_EVENTS } from "../mock-data/mockAuditEvents";
import { evaluatePolicy } from "../policy/policyEngine";
import { synthesizeDecision } from "../recovery/decision-engine";
import { defaultRecoveryExecutor, ExecutionRequest } from "../recovery/recoveryExecutor";
import { defaultVerificationService } from "../recovery/verificationService";
import { calculateOperationalMetrics, OperationalMetrics, calculateMoneyImpact } from "../metrics/metricsService";
import { formatCurrency } from "../utils";
import { useToast } from "@/components/ui/Toast";

interface ExecuteOptions {
  forceScenario?: "success" | "timeout" | "block" | "failure";
}

interface ReclaimContextType {
  cases: Case[];
  auditEvents: AuditEvent[];
  selectedCaseId: string | null;
  setSelectedCaseId: (id: string | null) => void;
  selectedCase: Case | null;
  
  // Real-time deterministic metrics
  metrics: OperationalMetrics;

  // Decision & Policy getters
  getCaseById: (id: string) => Case | undefined;
  getCaseDecision: (caseItem: Case) => RecoveryDecision;
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

  // Audit Dispatcher
  const addAuditEvent = useCallback((event: Omit<AuditEvent, "id" | "timestamp">) => {
    const newEvent: AuditEvent = {
      ...event,
      id: `EVT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour12: false }),
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
   * Complete End-to-End Revenue Recovery Loop Execution Pipeline
   * DETECT -> ANALYZE -> DECIDE -> POLICY CHECK -> ACT (Razorpay Test Mode) -> VERIFY -> RECOVER / FAIL / ESCALATE -> AUDIT
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
    const policy = evaluatePolicy(targetCase);
    const effectiveScenario = options?.forceScenario || targetCase.demoScenario || "A_SUCCESS";
    const idempotencyKey = `rz_rec_${targetCase.id}_${Date.now()}`;

    // --- STEP 1: LAYER 3 POLICY CHECK (AUTHORIZING) ---
    setExecutionProgressMap((prev) => ({
      ...prev,
      [caseId]: { caseId, step: "authorizing", idempotencyKey }
    }));

    addAuditEvent({
      layer: "LAYER 3",
      event: "POLICY_CHECKED",
      case: targetCase.id,
      desc: `Evaluating 6 deterministic rules for ${decision.recommendedIntervention}.`,
    });

    await new Promise((res) => setTimeout(res, 600));

    // Check if Scenario B or policy fails
    if (!policy.allowed || effectiveScenario === "block" || effectiveScenario === "B_POLICY_BLOCK") {
      setExecutionProgressMap((prev) => ({
        ...prev,
        [caseId]: { caseId, step: "blocked", idempotencyKey }
      }));

      const blockReason = policy.blockedRules[0] || "Maximum retry ceiling (3/3) exceeded.";

      addAuditEvent({
        layer: "LAYER 3",
        event: "POLICY_BLOCKED",
        case: targetCase.id,
        desc: `Action blocked: ${blockReason}. Autonomous execution prohibited.`,
      });

      addAuditEvent({
        layer: "LAYER 5",
        event: "CASE_ESCALATED",
        case: targetCase.id,
        desc: `Transferred to human operations desk due to policy block: ${blockReason}`,
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
      event: "POLICY_APPROVED",
      case: targetCase.id,
      desc: `All 6 deterministic rules satisfied. Action authorized for ${formatCurrency(targetCase.amount)}.`,
    });

    // --- STEP 2: LAYER 4 RAZORPAY TEST MODE EXECUTION (EXECUTING) ---
    setExecutionProgressMap((prev) => ({
      ...prev,
      [caseId]: { caseId, step: "executing", idempotencyKey, gateway: "Razorpay Test Gateway" }
    }));

    addAuditEvent({
      layer: "LAYER 4",
      event: "ACTION_EXECUTED",
      case: targetCase.id,
      desc: `Dispatched Razorpay Test Mode ${decision.recommendedIntervention} (${targetCase.strategy}) with idempotency key ${idempotencyKey}.`,
    });

    toast({
      title: "Executing Recovery (Layer 4)",
      description: `Sending idempotent action to Razorpay Test Mode for ${formatCurrency(targetCase.amount)}...`,
      type: "info",
      duration: 2000,
    });

    const executionRequest: ExecutionRequest = {
      caseId: targetCase.id,
      amount: targetCase.amount,
      paymentMethod: targetCase.paymentMethod,
      intervention: decision.recommendedIntervention,
      strategy: targetCase.strategy,
      idempotencyKey,
      isTestMode: true,
    };

    const executionResult = await defaultRecoveryExecutor.execute(executionRequest);

    // --- STEP 3: LAYER 5 GATEWAY TELEMETRY VERIFICATION (VERIFYING) ---
    setExecutionProgressMap((prev) => ({
      ...prev,
      [caseId]: { 
        caseId, 
        step: "verifying", 
        idempotencyKey, 
        gateway: executionResult.gateway 
      }
    }));

    const verificationOutcome = await defaultVerificationService.verify(
      executionResult, 
      effectiveScenario
    );

    // --- STEP 4: RESOLUTION / FAILURE HANDLING ---

    // SCENARIO C: VERIFICATION TIMEOUT
    if (verificationOutcome.status === "TIMEOUT") {
      setExecutionProgressMap((prev) => ({
        ...prev,
        [caseId]: { caseId, step: "timeout", idempotencyKey }
      }));

      addAuditEvent({
        layer: "LAYER 4",
        event: "VERIFICATION_TIMEOUT",
        case: targetCase.id,
        desc: "Gateway verification response timed out after 30s. Bounded safety: NO automatic duplicate retry.",
      });

      addAuditEvent({
        layer: "LAYER 5",
        event: "CASE_ESCALATED",
        case: targetCase.id,
        desc: "Case escalated for manual reconciliation. Settlement status remains unconfirmed.",
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
        event: "ACTION_FAILED",
        case: targetCase.id,
        desc: `Razorpay retry declined by issuing bank: ${verificationOutcome.message}`,
      });

      addAuditEvent({
        layer: "LAYER 5",
        event: "CASE_ESCALATED",
        case: targetCase.id,
        desc: "Automated retry path exhausted. Case escalated to customer success desk.",
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

    // SCENARIO A: SUCCESSFUL RECOVERY & REVENUE SETTLEMENT
    const txnId = verificationOutcome.transactionId || `txn_rz_${Date.now()}`;

    setExecutionProgressMap((prev) => ({
      ...prev,
      [caseId]: { 
        caseId, 
        step: "success", 
        idempotencyKey, 
        transactionId: txnId,
        latency: `${verificationOutcome.telemetryLatencyMs}ms`
      }
    }));

    addAuditEvent({
      layer: "LAYER 4",
      event: "ACTION_SUCCEEDED",
      case: targetCase.id,
      desc: `Razorpay Test Mode captured ${formatCurrency(targetCase.amount)}. Ref: ${txnId}`,
    });

    addAuditEvent({
      layer: "LAYER 5",
      event: "CASE_RESOLVED",
      case: targetCase.id,
      desc: `Settled ${formatCurrency(targetCase.amount)} in ledger. Revenue at Risk reduced.`,
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
                channel: decision.recommendedIntervention,
                timestamp: new Date().toISOString(),
                transactionId: txnId,
              },
            }
          : c
      )
    );

    toast({
      title: "Money Recovered! 🎉",
      description: `Successfully captured ${formatCurrency(targetCase.amount)} via ${decision.recommendedIntervention}. Dashboard updated.`,
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
      event: "CASE_ESCALATED",
      case: targetCase.id,
      desc: reason ? `Escalated: ${reason}` : "Escalated to human operations desk.",
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
      event: "CASE_STOPPED",
      case: targetCase.id,
      desc: reason ? `Stopped: ${reason}` : "Recovery stopped by operator.",
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
