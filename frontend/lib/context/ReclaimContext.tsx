"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { Case, AuditEvent, PolicyResult, RecoveryDecision } from "../types";
import { INITIAL_MOCK_CASES } from "../mock-data/mockCases";
import { INITIAL_AUDIT_EVENTS } from "../mock-data/mockAuditEvents";
import { evaluatePolicy } from "../policy/policyEngine";
import { getRecoveryDecision } from "../recovery/aiDecisionEngine";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency } from "../utils";

export type ExecutionState = 
  | "idle" 
  | "authorizing" 
  | "executing" 
  | "verifying" 
  | "success" 
  | "blocked" 
  | "timeout" 
  | "failed";

export interface ReclaimMetrics {
  revenueAtRisk: number; // in paise
  revenueRecovered: number; // in paise
  recoveryRate: number; // 0 to 100
  casesResolvedCount: number;
  totalCasesCount: number;
  casesResolvedRatio: string;
  activeAtRiskCount: number;
  recoveredCount: number;
}

export interface ReclaimContextType {
  cases: Case[];
  auditEvents: AuditEvent[];
  selectedCaseId: string | null;
  selectedCase: Case | null;
  setSelectedCaseId: (id: string | null) => void;
  getCaseById: (id: string) => Case | undefined;
  metrics: ReclaimMetrics;
  executionState: Record<string, ExecutionState>;
  getCaseExecutionState: (caseId: string) => ExecutionState;
  executeRecovery: (caseId: string, options?: { forceScenario?: "success" | "timeout" | "block" }) => Promise<boolean>;
  escalateCase: (caseId: string, reason?: string) => void;
  stopCase: (caseId: string, reason?: string) => void;
  resetDemoData: () => void;
  getCasePolicy: (caseItem: Case) => PolicyResult;
  getCaseDecision: (caseItem: Case) => RecoveryDecision;
  addAuditEvent: (event: Omit<AuditEvent, "id" | "timestamp">) => void;
}

const ReclaimContext = createContext<ReclaimContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_CASES = "reclaim_demo_cases_v1";
const LOCAL_STORAGE_KEY_AUDIT = "reclaim_demo_audit_v1";

export function ReclaimProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  
  const [cases, setCases] = useState<Case[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY_CASES);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load saved cases from localStorage", e);
      }
    }
    return INITIAL_MOCK_CASES;
  });

  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY_AUDIT);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load saved audit events from localStorage", e);
      }
    }
    return INITIAL_AUDIT_EVENTS;
  });

  const [selectedCaseId, setSelectedCaseId] = useState<string | null>("RC-2024-081");
  const [executionState, setExecutionState] = useState<Record<string, ExecutionState>>({});

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_CASES, JSON.stringify(cases));
    } catch (e) {}
  }, [cases]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_AUDIT, JSON.stringify(auditEvents));
    } catch (e) {}
  }, [auditEvents]);

  const selectedCase = useMemo(() => {
    if (!selectedCaseId) return null;
    return cases.find((c) => c.id === selectedCaseId) || null;
  }, [cases, selectedCaseId]);

  const getCaseById = useCallback((id: string) => {
    return cases.find((c) => c.id === id);
  }, [cases]);

  const getCaseExecutionState = useCallback((caseId: string): ExecutionState => {
    return executionState[caseId] || "idle";
  }, [executionState]);

  // Derived live metrics directly from the cases dataset
  const metrics = useMemo<ReclaimMetrics>(() => {
    let atRiskSum = 0;
    let recoveredSum = 0;
    let recoveredCount = 0;
    let resolvedCount = 0;
    let activeAtRiskCount = 0;

    cases.forEach((c) => {
      if (c.status === "recovered") {
        recoveredSum += c.resolutionDetails?.recoveredAmount || c.amount;
        recoveredCount += 1;
        resolvedCount += 1;
      } else if (c.status === "stopped" || c.status === "escalated") {
        resolvedCount += 1;
      } else {
        // atRisk, inProgress, pending, failed, blocked
        atRiskSum += c.amount;
        activeAtRiskCount += 1;
      }
    });

    const totalCasesCount = cases.length;
    // Recovery rate: recovered cases out of total eligible cases
    const recoveryRate = totalCasesCount > 0 
      ? Number(((recoveredCount / totalCasesCount) * 100).toFixed(1)) 
      : 0;

    return {
      revenueAtRisk: atRiskSum,
      revenueRecovered: recoveredSum,
      recoveryRate,
      casesResolvedCount: resolvedCount,
      totalCasesCount,
      casesResolvedRatio: `${resolvedCount} / ${totalCasesCount}`,
      activeAtRiskCount,
      recoveredCount,
    };
  }, [cases]);

  const addAuditEvent = useCallback((eventData: Omit<AuditEvent, "id" | "timestamp">) => {
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
    const newEvent: AuditEvent = {
      id: `EV-${Math.floor(10000 + Math.random() * 90000)}`,
      timestamp: `Just now (${timeString})`,
      latency: `${Math.floor(2 + Math.random() * 18)}ms`,
      ...eventData,
    };

    setAuditEvents((prev) => [newEvent, ...prev]);
  }, []);

  const getCasePolicy = useCallback((caseItem: Case) => {
    return evaluatePolicy(caseItem);
  }, []);

  const getCaseDecision = useCallback((caseItem: Case) => {
    return getRecoveryDecision(caseItem);
  }, []);

  const executeRecovery = useCallback(async (caseId: string, options?: { forceScenario?: "success" | "timeout" | "block" }): Promise<boolean> => {
    const targetCase = cases.find((c) => c.id === caseId);
    if (!targetCase) {
      toast({
        title: "Case Not Found",
        description: `Could not find case ${caseId}.`,
        type: "error",
      });
      return false;
    }

    // Phase 11: Idempotency Protection
    const currentState = executionState[caseId] || "idle";
    if (["authorizing", "executing", "verifying"].includes(currentState)) {
      toast({
        title: "Execution In Progress",
        description: `Recovery for case ${caseId} is already executing. Duplicate action prevented.`,
        type: "warning",
      });
      return false;
    }

    if (targetCase.status === "recovered") {
      toast({
        title: "Already Recovered",
        description: `Case ${caseId} is already successfully recovered (${formatCurrency(targetCase.amount)}).`,
        type: "info",
      });
      return false;
    }

    // Determine effective scenario
    const effectiveScenario = options?.forceScenario || targetCase.demoScenario;

    // STEP 1: LAYER 3 POLICY CHECK (AUTHORIZING)
    setExecutionState((prev) => ({ ...prev, [caseId]: "authorizing" }));

    toast({
      title: "Authorizing Action (Layer 3)",
      description: `Evaluating deterministic policies for ${targetCase.id}...`,
      type: "info",
      duration: 1800,
    });

    // Small delay to simulate evaluation
    await new Promise((res) => setTimeout(res, 600));

    const policy = evaluatePolicy(targetCase);

    // If policy is blocked (Scenario B or real policy failure)
    if (!policy.allowed || effectiveScenario === "block" || effectiveScenario === "B_POLICY_BLOCK") {
      setExecutionState((prev) => ({ ...prev, [caseId]: "blocked" }));

      addAuditEvent({
        layer: "LAYER 3",
        event: "POLICY_BLOCKED",
        case: targetCase.id,
        desc: `Action blocked by policy: ${policy.blockedRules[0] || "Policy threshold exceeded"}.`,
      });

      addAuditEvent({
        layer: "LAYER 5",
        event: "CASE_ESCALATED",
        case: targetCase.id,
        desc: `Case escalated to manual operations desk due to deterministic policy lockout.`,
      });

      setCases((prev) =>
        prev.map((c) =>
          c.id === caseId
            ? { ...c, status: "escalated", lastError: policy.blockedRules[0] }
            : c
        )
      );

      toast({
        title: "Policy Blocked ✕",
        description: policy.blockedRules[0] || "Policy guardrail failed. Escalated to operations.",
        type: "error",
        duration: 4000,
      });

      return false;
    }

    // Policy Approved
    addAuditEvent({
      layer: "LAYER 3",
      event: "POLICY_APPROVED",
      case: targetCase.id,
      desc: `All 6 deterministic policy rules passed. Amount (${formatCurrency(targetCase.amount)}) and limits approved for auto-recovery.`,
    });

    // STEP 2: LAYER 4 ACTION EXECUTION (EXECUTING)
    setExecutionState((prev) => ({ ...prev, [caseId]: "executing" }));

    addAuditEvent({
      layer: "LAYER 4",
      event: "ACTION_EXECUTED",
      case: targetCase.id,
      desc: `Executing Primary Action: ${targetCase.strategy} for ${formatCurrency(targetCase.amount)} with idempotency key rz_rec_${targetCase.id}_${Date.now()}.`,
    });

    toast({
      title: "Executing Recovery (Layer 4)",
      description: `Sending idempotent action to Razorpay gateway for ${formatCurrency(targetCase.amount)}...`,
      type: "info",
      duration: 2000,
    });

    await new Promise((res) => setTimeout(res, 1200));

    // STEP 3: LAYER 5 VERIFICATION (VERIFYING)
    setExecutionState((prev) => ({ ...prev, [caseId]: "verifying" }));

    await new Promise((res) => setTimeout(res, 1000));

    // Scenario C: VERIFICATION TIMEOUT
    if (effectiveScenario === "timeout" || effectiveScenario === "C_TIMEOUT") {
      setExecutionState((prev) => ({ ...prev, [caseId]: "timeout" }));

      addAuditEvent({
        layer: "LAYER 4",
        event: "VERIFICATION_TIMEOUT",
        case: targetCase.id,
        desc: "Gateway verification response timed out after 30s. Bounded safety engaged: NO automatic duplicate retry.",
      });

      addAuditEvent({
        layer: "LAYER 5",
        event: "CASE_ESCALATED",
        case: targetCase.id,
        desc: "Case escalated for manual review. Settlement status remains unconfirmed.",
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
        description: "Response ambiguous. Stopped duplicate retries to prevent double debits. Escalated.",
        type: "warning",
        duration: 5000,
      });

      return false;
    }

    // STEP 4: SUCCESSFUL RECOVERY
    setExecutionState((prev) => ({ ...prev, [caseId]: "success" }));

    addAuditEvent({
      layer: "LAYER 4",
      event: "ACTION_SUCCEEDED",
      case: targetCase.id,
      desc: `Razorpay response 200 OK captured for payment ${targetCase.paymentId}.`,
    });

    addAuditEvent({
      layer: "LAYER 5",
      event: "CASE_RESOLVED",
      case: targetCase.id,
      desc: `${formatCurrency(targetCase.amount)} recovered successfully via ${targetCase.strategy}. Immutable ledger settled.`,
    });

    const nowStr = new Date().toLocaleTimeString();

    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              status: "recovered",
              retryCount: c.retryCount + 1,
              resolutionDetails: {
                recoveredAmount: c.amount,
                channel: c.strategy,
                timestamp: `Just now (${nowStr})`,
                transactionId: `${c.paymentId}_rec_${Date.now().toString().slice(-6)}`,
              },
            }
          : c
      )
    );

    toast({
      title: "Recovery Successful ✓",
      description: `${formatCurrency(targetCase.amount)} recovered. Case marked resolved.`,
      type: "success",
      duration: 4000,
    });

    return true;
  }, [cases, executionState, addAuditEvent, toast]);

  const escalateCase = useCallback((caseId: string, reason = "Manual operations escalation") => {
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, status: "escalated", lastError: reason } : c))
    );

    addAuditEvent({
      layer: "LAYER 5",
      event: "CASE_ESCALATED",
      case: caseId,
      desc: `Case escalated by operator: ${reason}.`,
    });

    toast({
      title: "Case Escalated",
      description: `Case ${caseId} transferred to human review desk.`,
      type: "info",
    });
  }, [addAuditEvent, toast]);

  const stopCase = useCallback((caseId: string, reason = "Manual stop command") => {
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, status: "stopped", lastError: reason } : c))
    );

    addAuditEvent({
      layer: "LAYER 5",
      event: "CASE_STOPPED",
      case: caseId,
      desc: `Autonomous recovery stopped: ${reason}.`,
    });

    toast({
      title: "Recovery Stopped",
      description: `Case ${caseId} halted. No further actions will execute.`,
      type: "info",
    });
  }, [addAuditEvent, toast]);

  const resetDemoData = useCallback(() => {
    setCases(INITIAL_MOCK_CASES);
    setAuditEvents(INITIAL_AUDIT_EVENTS);
    setSelectedCaseId("RC-2024-081");
    setExecutionState({});
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY_CASES);
      localStorage.removeItem(LOCAL_STORAGE_KEY_AUDIT);
    } catch (e) {}

    toast({
      title: "Demo State Reset",
      description: "Dataset reset to pristine demo scenarios with 27 cases.",
      type: "success",
    });
  }, [toast]);

  return (
    <ReclaimContext.Provider
      value={{
        cases,
        auditEvents,
        selectedCaseId,
        selectedCase,
        setSelectedCaseId,
        getCaseById,
        metrics,
        executionState,
        getCaseExecutionState,
        executeRecovery,
        escalateCase,
        stopCase,
        resetDemoData,
        getCasePolicy,
        getCaseDecision,
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
