"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { formatCurrency, cn } from "@/lib/utils";
import { PolicyCheck } from "@/components/ui/PolicyCheck";
import { ProbabilityMeter } from "@/components/ui/ProbabilityMeter";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { Tooltip } from "@/components/ui/Tooltip";
import { useToast } from "@/components/ui/Toast";
import { useReclaim } from "@/lib/context/ReclaimContext";
import { Case } from "@/lib/types";
import { 
  ArrowLeft, 
  BrainCircuit, 
  ShieldAlert, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronRight, 
  Play,
  RotateCcw,
  AlertTriangle,
  Send,
  FileCheck2,
  ExternalLink,
  Info,
  ShieldCheck,
  Zap,
  Terminal
} from "lucide-react";

const LIFECYCLE_STEPS = [
  { key: "DETECT", label: "0. Detect", desc: "Webhook Ingestion" },
  { key: "ANALYZE", label: "1. Analyze", desc: "ML Triage & Scoring" },
  { key: "DECIDE", label: "2. Decide", desc: "AI Plan Formulation" },
  { key: "POLICY", label: "3. Policy", desc: "Deterministic Check" },
  { key: "ACT", label: "4. Act", desc: "Razorpay Gateway Call" },
  { key: "VERIFY", label: "5. Verify", desc: "Telemetry Confirm" },
  { key: "RECOVER", label: "6. Recover", desc: "Ledger Settlement" }
];

export default function CaseDecisionPage({ params }: { params: { id: string } }) {
  const caseId = params.id || "RC-2024-081";
  const { toast } = useToast();
  const { 
    cases, 
    getCaseById, 
    getCaseDecision, 
    getCasePolicy, 
    getCaseExecutionState, 
    executeRecovery,
    escalateCase,
    auditEvents,
    resetDemoData
  } = useReclaim();
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Retrieve current live case
  const currentCase = useMemo(() => {
    return getCaseById(caseId) || cases[0];
  }, [caseId, getCaseById, cases]);

  const executionState = getCaseExecutionState(currentCase.id);
  const isRecovered = currentCase.status === "recovered";

  // Dynamic AI synthesis & deterministic policy check
  const aiDecision = useMemo(() => getCaseDecision(currentCase), [currentCase, getCaseDecision]);
  const policyResult = useMemo(() => getCasePolicy(currentCase), [currentCase, getCasePolicy]);

  // Compute lifecycle progress step (0 to 6)
  const lifecycleProgress = useMemo(() => {
    if (isRecovered || executionState === "success") return 6;
    if (executionState === "verifying") return 5;
    if (executionState === "executing") return 4;
    if (executionState === "authorizing") return 3;
    if (executionState === "blocked") return 3;
    if (executionState === "timeout") return 4;
    return 3; // Ready after detect, analyze, decide, policy
  }, [executionState, isRecovered]);

  // Filter audit events specific to this case
  const caseAuditEvents = useMemo(() => {
    return auditEvents.filter((e) => e.case === currentCase.id);
  }, [auditEvents, currentCase.id]);

  const handleStartExecute = () => {
    if (!policyResult.allowed) {
      toast({
        title: "Action Blocked by Policy",
        description: policyResult.blockedRules[0] || "Deterministic rule failed. Cannot execute.",
        type: "error",
      });
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleConfirmExecute = async () => {
    setIsConfirmModalOpen(false);
    await executeRecovery(currentCase.id);
  };

  const handleRunScenario = async (scenario: "success" | "timeout" | "block") => {
    if (scenario === "block") {
      await executeRecovery(currentCase.id, { forceScenario: "block" });
    } else if (scenario === "timeout") {
      await executeRecovery(currentCase.id, { forceScenario: "timeout" });
    } else {
      await executeRecovery(currentCase.id, { forceScenario: "success" });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* 1. Case Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-border-subtle">
        <div className="flex items-center gap-3">
          <Link 
            href="/at-risk" 
            className="p-2 rounded-lg border border-slate-200 dark:border-border-subtle hover:bg-slate-100 dark:hover:bg-surface-elevated text-slate-600 dark:text-text-secondary transition-colors"
            title="Back to At-Risk Cases"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-text-primary">
                Recovery Decision
              </h1>
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-100 dark:bg-surface-elevated text-slate-700 dark:text-text-secondary border border-slate-200 dark:border-border-subtle">
                {currentCase.id}
              </span>
              <StatusBadge status={currentCase.status} size="sm" />
            </div>
            <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
              Payment Stream: <span className="font-mono text-slate-700 dark:text-text-secondary">{currentCase.paymentId}</span> • Customer: <span className="font-medium text-slate-800 dark:text-text-primary">{currentCase.customer}</span> ({currentCase.customerPhone})
            </p>
          </div>
        </div>

        {/* Demo Scenario Selectors */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 dark:text-text-muted hidden sm:inline mr-1 text-[11px] font-semibold uppercase">
            Test Flow:
          </span>
          <button 
            onClick={() => handleRunScenario("success")}
            disabled={isRecovered}
            className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-100 transition-colors disabled:opacity-50"
            title="Scenario A: High probability, policy approved, executes & recovers"
          >
            Scenario A (Success)
          </button>
          <button 
            onClick={() => handleRunScenario("block")}
            className="px-2.5 py-1 rounded text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 transition-colors"
            title="Scenario B: Policy rule fails, halts automated action & escalates"
          >
            Scenario B (Policy Block)
          </button>
          <button 
            onClick={() => handleRunScenario("timeout")}
            className="px-2.5 py-1 rounded text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 hover:bg-amber-100 transition-colors"
            title="Scenario C: Gateway verification times out, halts duplicate retry & escalates"
          >
            Scenario C (Timeout)
          </button>
          <button
            onClick={resetDemoData}
            className="p-1 rounded text-slate-500 hover:text-brand transition-colors"
            title="Reset demo data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Lifecycle Progress Stepper (0 to 6) */}
      <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const isCompleted = idx <= lifecycleProgress && executionState !== "idle";
            const isCurrent = idx === lifecycleProgress && (executionState === "executing" || executionState === "verifying");
            const isIdlePassed = executionState === "idle" && idx <= 3;
            
            let icon = <span className="text-[10px] font-bold text-slate-400 dark:text-text-muted">{idx}</span>;
            if (isRecovered || (isCompleted && !isCurrent)) icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
            if (isCurrent) icon = <div className="w-2 h-2 rounded-full bg-brand animate-ping" />;
            if (executionState === "timeout" && idx === 4) icon = <Clock className="w-3.5 h-3.5 text-amber-500" />;
            if (executionState === "blocked" && idx === 3) icon = <XCircle className="w-3.5 h-3.5 text-rose-500" />;

            return (
              <div key={step.key} className="flex flex-col items-center gap-2 relative">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center border-2 bg-white dark:bg-surface transition-all duration-300",
                  isIdlePassed || isCompleted || isCurrent 
                    ? "border-brand shadow-sm bg-brand/5 dark:bg-brand-muted" 
                    : "border-slate-200 dark:border-border-subtle",
                  executionState === "blocked" && idx === 3 ? "border-rose-500 bg-rose-50 dark:bg-rose-950/40" : "",
                  (executionState === "success" || isRecovered) && idx === 6 ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40" : ""
                )}>
                  {icon}
                </div>
                <span className={cn(
                  "text-[11px] font-semibold tracking-tight hidden sm:block whitespace-nowrap",
                  isIdlePassed || isCompleted || isCurrent ? "text-slate-900 dark:text-text-primary" : "text-slate-400 dark:text-text-muted"
                )}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
        {/* Progress Line */}
        <div className="absolute top-[31px] sm:top-[35px] left-8 right-8 h-[2px] bg-slate-100 dark:bg-surface-elevated -z-0">
          <div 
            className="h-full bg-brand transition-all duration-500 ease-out"
            style={{ width: `${Math.max(0, (lifecycleProgress / 6)) * 100}%` }}
          />
        </div>
      </div>

      {/* 3. Main Operational Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left 2 Columns: Payment, AI Root Cause, Recovery Plan, Audit Timeline */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Top Row: Payment Overview & AI Recommendation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            {/* Payment Summary Card */}
            <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-text-muted">
                  {isRecovered ? "Revenue Recovered" : "Transaction at Risk"}
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className={cn(
                    "text-3xl font-bold tabular-nums tracking-tight",
                    isRecovered ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-text-primary"
                  )}>
                    {formatCurrency(currentCase.amount)}
                  </span>
                  <span className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200/60 dark:border-rose-900/40">
                    {currentCase.failure}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-border-subtle space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-text-muted">Payment ID</span>
                  <span className="font-mono text-slate-800 dark:text-text-primary font-medium">{currentCase.paymentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-text-muted">Payment Method</span>
                  <span className="text-slate-800 dark:text-text-primary font-medium">{currentCase.paymentMethod} ({currentCase.bank || "Gateway"})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-text-muted">Customer</span>
                  <span className="text-slate-800 dark:text-text-primary font-medium">{currentCase.customer}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-text-muted">Recovery Probability</span>
                  <ProbabilityMeter probability={currentCase.prob} />
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-text-muted">Expected Recovery</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-text-primary">{formatCurrency(currentCase.expected)}</span>
                </div>
              </div>
            </div>

            {/* AI Intelligence Card */}
            <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-brand flex items-center gap-1.5">
                    <BrainCircuit className="w-3.5 h-3.5" /> AI Recommendation (Layer 2)
                  </span>
                  <span className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded",
                    aiDecision.confidence === "High Confidence" && "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
                    aiDecision.confidence === "Medium Confidence" && "text-amber-600 bg-amber-50 dark:bg-amber-950/40",
                    aiDecision.confidence === "Low Confidence" && "text-rose-600 bg-rose-50 dark:bg-rose-950/40"
                  )}>
                    {aiDecision.confidence}
                  </span>
                </div>
                <div className="mt-3 p-3.5 bg-slate-50 dark:bg-surface-elevated/70 border border-slate-200/60 dark:border-border-subtle rounded-lg text-xs leading-relaxed text-slate-700 dark:text-text-secondary">
                  <p className="font-semibold text-slate-900 dark:text-text-primary mb-1">
                    Strategy: {aiDecision.recommendedAction}
                  </p>
                  <p>{aiDecision.conciseReason}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-border-subtle flex items-center justify-between text-xs text-slate-500 dark:text-text-muted">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Triage synthesized
                </span>
                <span className="font-mono text-[11px]">Root Cause: {currentCase.failure}</span>
              </div>
            </div>

          </div>

          {/* Recovery Plan Sequence Flow */}
          <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
                  Multi-Stage Recovery Sequence
                </h3>
                <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
                  Ordered bounded fallback hierarchy
                </p>
              </div>
              <span className="text-[11px] font-mono font-medium text-slate-500">
                Action: {currentCase.strategy}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Step 1 */}
              <div className="p-4 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 relative">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    Primary Action
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-text-primary">
                  {currentCase.strategy}
                </div>
                <p className="text-xs text-slate-600 dark:text-text-muted mt-1 leading-snug">
                  Idempotent intervention via {currentCase.paymentMethod} gateway endpoint.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-surface-elevated border border-slate-200/80 dark:border-border-subtle">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-text-muted uppercase tracking-wider">
                    Fallback 1
                  </span>
                  <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-text-primary">
                  Payment Link Nudge
                </div>
                <p className="text-xs text-slate-500 dark:text-text-muted mt-1 leading-snug">
                  {aiDecision.fallbackPlan}
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-surface-elevated border border-slate-200/80 dark:border-border-subtle">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-text-muted uppercase tracking-wider">
                    Fallback 2
                  </span>
                  <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-text-primary">
                  Human Escalation
                </div>
                <p className="text-xs text-slate-500 dark:text-text-muted mt-1 leading-snug">
                  {aiDecision.escalationPlan}
                </p>
              </div>
            </div>
          </div>

          {/* Audit Timeline / Execution Ledger for this case */}
          <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
                  Case Execution Audit Ledger
                </h3>
                <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
                  Real-time events recorded for case {currentCase.id}
                </p>
              </div>
              <Link 
                href="/audit" 
                className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1"
              >
                View Global Ledger <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-0 pl-2">
              {caseAuditEvents.length === 0 ? (
                <div className="text-xs text-slate-500 py-3">
                  Initial intake recorded. Awaiting recovery execution.
                </div>
              ) : (
                caseAuditEvents.map((evt, idx) => {
                  const isLast = idx === caseAuditEvents.length - 1;
                  const isSuccess = evt.event === "CASE_RESOLVED" || evt.event === "ACTION_SUCCEEDED";
                  const isBlocked = evt.event === "POLICY_BLOCKED";
                  const isTimeout = evt.event === "VERIFICATION_TIMEOUT";

                  return (
                    <div 
                      key={evt.id} 
                      className={cn(
                        "relative pl-6 pb-4 border-l",
                        isSuccess ? "border-emerald-300 dark:border-emerald-800" :
                        isBlocked ? "border-rose-300 dark:border-rose-800" :
                        isTimeout ? "border-amber-300 dark:border-amber-800" :
                        "border-slate-200 dark:border-border-subtle"
                      )}
                    >
                      <div className={cn(
                        "absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-surface",
                        isSuccess ? "bg-emerald-500" :
                        isBlocked ? "bg-rose-500" :
                        isTimeout ? "bg-amber-500" :
                        "bg-slate-400"
                      )} />
                      <div className="flex items-baseline justify-between text-xs">
                        <span className={cn(
                          "font-semibold",
                          isSuccess ? "text-emerald-700 dark:text-emerald-400" :
                          isBlocked ? "text-rose-700 dark:text-rose-400" :
                          isTimeout ? "text-amber-700 dark:text-amber-400" :
                          "text-slate-900 dark:text-text-primary"
                        )}>
                          {evt.layer}: {evt.event}
                        </span>
                        <span className="font-mono text-slate-400 dark:text-text-muted text-[11px]">{evt.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-text-secondary mt-0.5 leading-relaxed">
                        {evt.desc}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right 1 Column: Sticky Policy Verification & Execution Panel */}
        <div className="space-y-6 lg:sticky lg:top-24">
          <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-border-subtle">
              <div className="flex items-center gap-2">
                <ShieldAlert className={cn(
                  "w-4 h-4",
                  policyResult.allowed ? "text-emerald-500" : "text-rose-500"
                )} />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
                  Policy Guardrails (Layer 3)
                </h3>
              </div>
              <span className="text-[10px] font-mono uppercase font-semibold text-slate-400">
                Deterministic
              </span>
            </div>

            {/* Policy Checklist */}
            <div className="space-y-1 mb-6">
              {policyResult.checks.map((chk) => (
                <PolicyCheck
                  key={chk.id}
                  name={chk.name}
                  value={chk.value}
                  status={chk.status}
                  description={chk.description}
                />
              ))}
            </div>

            {/* Prominent Policy Verdict Banner */}
            <div className={cn(
              "rounded-lg p-3.5 mb-6 flex items-center justify-center font-bold text-xs tracking-wider uppercase border text-center transition-colors",
              policyResult.allowed 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40"
                : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40"
            )}>
              {policyResult.allowed ? "✓ POLICY APPROVED FOR EXECUTION" : "✕ POLICY BLOCKED • HUMAN REVIEW REQUIRED"}
            </div>

            {/* Primary Action Button Area */}
            <div className="space-y-2.5">
              {executionState === "idle" && !isRecovered && (
                <>
                  {policyResult.allowed ? (
                    <button 
                      onClick={handleStartExecute}
                      className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white py-3 px-4 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-[0.98]"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Execute Recovery Action
                    </button>
                  ) : (
                    <button 
                      onClick={() => escalateCase(currentCase.id, policyResult.blockedRules[0])}
                      className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white py-3 px-4 rounded-lg text-sm font-semibold transition-all shadow-sm"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Escalate to Operations Desk
                    </button>
                  )}
                </>
              )}

              {executionState === "authorizing" && (
                <button disabled className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-surface-elevated text-slate-600 dark:text-text-muted py-3 px-4 rounded-lg text-xs font-semibold border border-slate-200 dark:border-border-subtle">
                  <Activity className="w-4 h-4 animate-spin text-brand" />
                  Validating Deterministic Policy (Layer 3)...
                </button>
              )}

              {executionState === "executing" && (
                <button disabled className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-surface-elevated text-slate-600 dark:text-text-muted py-3 px-4 rounded-lg text-xs font-semibold border border-slate-200 dark:border-border-subtle">
                  <Activity className="w-4 h-4 animate-spin text-brand" />
                  Triggering Razorpay Retry (Layer 4)...
                </button>
              )}
              
              {executionState === "verifying" && (
                <button disabled className="w-full flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 py-3 px-4 rounded-lg text-xs font-semibold border border-amber-200 dark:border-amber-900/40">
                  <Activity className="w-4 h-4 animate-pulse" />
                  Verifying Gateway Outcome (Layer 5)...
                </button>
              )}

              {(executionState === "success" || isRecovered) && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="w-full flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-900/40">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Recovered {formatCurrency(currentCase.amount)} • Case Resolved
                    </span>
                    <span className="font-mono text-[10px]">200 OK</span>
                  </div>
                </div>
              )}

              {executionState === "timeout" && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-lg text-xs text-amber-800 dark:text-amber-300">
                    <div className="font-semibold flex items-center gap-1.5 mb-1">
                      <Clock className="w-3.5 h-3.5" /> Recovery Action Unconfirmed
                    </div>
                    Gateway response latency exceeded 30s. Bounded safety: duplicate execution halted. Case escalated to operations desk.
                  </div>
                </div>
              )}
              
              {executionState === "blocked" && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-lg text-xs text-rose-800 dark:text-rose-300">
                    <div className="font-semibold flex items-center gap-1.5 mb-1">
                      <XCircle className="w-3.5 h-3.5" /> Action Blocked by Layer 3 Policy
                    </div>
                    <strong>Reason:</strong> {policyResult.blockedRules[0] || "Policy guardrail failed."}<br />
                    <strong>Recommended Next Action:</strong> Case escalated to human operations desk.
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Execute Recovery Action?"
        description="Verify the financial consequence and policy approval status before triggering execution."
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-surface-elevated border border-slate-200/80 dark:border-border-subtle space-y-2.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Case Identifier</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-text-primary">{currentCase.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer</span>
              <span className="font-semibold text-slate-900 dark:text-text-primary">{currentCase.customer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Transaction Amount</span>
              <span className="font-bold text-slate-900 dark:text-text-primary text-sm">{formatCurrency(currentCase.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Selected Action</span>
              <span className="font-medium text-brand">{currentCase.strategy}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-border-subtle">
              <span className="text-slate-500">Deterministic Policy</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 6/6 Invariants Approved
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-border-subtle bg-white dark:bg-surface text-slate-700 dark:text-text-secondary font-medium hover:bg-slate-50 dark:hover:bg-surface-elevated transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmExecute}
              className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white font-semibold transition-all shadow-sm active:scale-[0.98]"
            >
              Authorize & Execute
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
