"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatCurrency, cn } from "@/lib/utils";
import { Drawer } from "@/components/ui/Drawer";
import { PolicyCheck } from "@/components/ui/PolicyCheck";
import { ProbabilityMeter } from "@/components/ui/ProbabilityMeter";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useReclaim } from "@/lib/context/ReclaimContext";
import { extractRiskSignals } from "@/lib/recovery/decision-engine";
import { ExecutionTimeline } from "@/components/ui/ExecutionTimeline";
import { Case } from "@/lib/types";
import { 
  Play, 
  RotateCcw, 
  ShieldAlert, 
  BrainCircuit, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink,
  Activity,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingUp,
  History,
  Scale,
  PlusCircle,
  MinusCircle
} from "lucide-react";

interface CaseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: Case | null;
}

export function CaseDrawer({ isOpen, onClose, caseItem: initialCase }: CaseDrawerProps) {
  const { toast } = useToast();
  const { 
    getCaseById, 
    getCaseDecision, 
    getCasePolicy, 
    getCaseExecutionProgress,
    getCaseExecutionState, 
    executeRecovery,
    escalateCase 
  } = useReclaim();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  if (!initialCase) return null;

  // Retrieve current live case from context
  const currentCase = getCaseById(initialCase.id) || initialCase;
  const executionState = getCaseExecutionState(currentCase.id);

  // Synthesize dynamic AI recommendation, risk signals, and evaluate deterministic policies
  const aiDecision = getCaseDecision(currentCase);
  const policyResult = getCasePolicy(currentCase);
  const signals = extractRiskSignals(currentCase);

  const handleStartExecute = () => {
    if (!policyResult.allowed) {
      toast({
        title: "Action Blocked by Policy",
        description: policyResult.blockedRules[0] || "Cannot execute. Deterministic rule violated.",
        type: "error",
      });
      return;
    }
    if (aiDecision.recommendedIntervention === "No Action") {
      toast({
        title: "No Automatic Action",
        description: "Recovery probability is below automated threshold. Escalating to human desk.",
        type: "info",
      });
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleConfirmExecute = async () => {
    setIsConfirmOpen(false);
    await executeRecovery(currentCase.id);
  };

  const handleEscalateClick = () => {
    escalateCase(currentCase.id, policyResult.blockedRules[0] || "Manual escalation from Case Drawer");
  };

  const isExecuting = ["authorizing", "executing", "verifying"].includes(executionState);
  const isRecovered = currentCase.status === "recovered";
  const isNoAction = aiDecision.recommendedIntervention === "No Action";

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={`Case ${currentCase.id}`}
        subtitle={`Transaction ${currentCase.paymentId} • ${currentCase.customer}`}
        maxWidth="max-w-xl"
      >
        <div className="space-y-6">
          
          {/* 1. Header Metric Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-elevated border border-slate-200/80 dark:border-border-subtle flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider">
                {isRecovered ? "Revenue Recovered" : "Money at Risk"}
              </span>
              <div className={cn(
                "text-2xl sm:text-3xl font-black tabular-nums mt-0.5",
                isRecovered ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-text-primary"
              )}>
                {formatCurrency(currentCase.amount)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-text-muted mt-0.5">
                Method: <span className="font-semibold text-slate-700 dark:text-text-secondary">{currentCase.paymentMethod}</span> ({currentCase.bank || "Gateway"})
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <StatusBadge status={currentCase.status} />
              <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200/60 dark:border-rose-900/40">
                {currentCase.failure}
              </span>
              <span className="text-[10px] text-slate-400">
                Age: {signals.paymentAge}
              </span>
            </div>
          </div>

          {/* 2. Structured Risk Signals */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-border-subtle bg-white dark:bg-surface space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-border-subtle">
              <span className="text-[11px] font-bold text-slate-700 dark:text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-brand" /> Contextual Risk Signals
              </span>
              <span className="text-[10px] font-mono text-slate-400">Layer 1 ML Triage</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-surface-elevated/60">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Payment Age</span>
                <span className="text-xs font-bold text-slate-800 dark:text-text-primary">{signals.paymentAge}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-surface-elevated/60">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Past Successes</span>
                <span className="text-xs font-bold text-slate-800 dark:text-text-primary">{signals.previousSuccessfulPayments} txns</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-surface-elevated/60">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Retry Ceiling</span>
                <span className="text-xs font-bold text-slate-800 dark:text-text-primary">{signals.retryAttempts}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-surface-elevated/60">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Contact Cap</span>
                <span className="text-xs font-bold text-slate-800 dark:text-text-primary">{signals.contactCount}</span>
              </div>
            </div>
          </div>

          {/* 3. Recovery Probability & Dynamic Expected Recovery Value */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg border border-slate-200/80 dark:border-border-subtle bg-white dark:bg-surface">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Recovery Probability
                </span>
                <span className="text-xs font-bold font-mono text-brand">
                  {(currentCase.prob * 100).toFixed(0)}%
                </span>
              </div>
              <div className="mt-2">
                <ProbabilityMeter probability={currentCase.prob} />
              </div>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-200/80 dark:border-border-subtle bg-white dark:bg-surface">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Expected Recovery Value
              </span>
              <div className="text-base font-bold text-slate-900 dark:text-text-primary tabular-nums mt-1">
                {formatCurrency(aiDecision.expectedRecovery)}
              </div>
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                Formula: {formatCurrency(currentCase.amount)} × {(currentCase.prob * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* 4. Contributing Signals (Positive vs Negative) */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-border-subtle bg-white dark:bg-surface space-y-2">
            <span className="text-[11px] font-bold text-slate-700 dark:text-text-secondary uppercase tracking-wider block pb-1 border-b border-slate-100 dark:border-border-subtle">
              Contributing Signals (Demo Scored)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <PlusCircle className="w-3 h-3" /> Positive Drivers
                </span>
                {aiDecision.contributingSignals.positive.map((pos, i) => (
                  <div key={i} className="text-slate-600 dark:text-text-secondary text-[11px] flex items-start gap-1">
                    <span className="text-emerald-500 font-bold">+</span>
                    <span>{pos}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
                  <MinusCircle className="w-3 h-3" /> Negative Factors
                </span>
                {aiDecision.contributingSignals.negative.length === 0 ? (
                  <div className="text-slate-400 text-[11px]">None identified</div>
                ) : (
                  aiDecision.contributingSignals.negative.map((neg, i) => (
                    <div key={i} className="text-slate-600 dark:text-text-secondary text-[11px] flex items-start gap-1">
                      <span className="text-rose-500 font-bold">−</span>
                      <span>{neg}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 5. Root-Cause Analysis & "Why This Action?" (Layer 2) */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-border-subtle bg-white dark:bg-surface space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand uppercase tracking-wider flex items-center gap-1.5">
                <BrainCircuit className="w-3.5 h-3.5" /> AI Decision Intelligence (Layer 2)
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">Confidence:</span>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded",
                  aiDecision.confidence === "High" && "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40",
                  aiDecision.confidence === "Medium" && "text-amber-700 bg-amber-50 dark:bg-amber-950/40",
                  aiDecision.confidence === "Low" && "text-rose-700 bg-rose-50 dark:bg-rose-950/40"
                )}>
                  {aiDecision.confidence}
                </span>
              </div>
            </div>

            {/* Root Cause Diagnosis */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Likely Root Cause
              </span>
              <p className="text-xs font-medium text-slate-900 dark:text-text-primary">
                {aiDecision.likelyRootCause}
              </p>
              <p className="text-[11px] text-slate-600 dark:text-text-secondary leading-relaxed bg-slate-50 dark:bg-surface-elevated/40 p-2.5 rounded border border-slate-100 dark:border-border-subtle">
                <strong className="text-slate-800 dark:text-text-primary font-semibold">Why this matters: </strong>
                {aiDecision.whyThisMatters}
              </p>
            </div>

            {/* Recommendation & Rationale */}
            <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-border-subtle">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Recommended Intervention
                </span>
                <span className="text-xs font-bold text-brand bg-brand/10 dark:bg-brand-muted px-2 py-0.5 rounded">
                  {aiDecision.recommendedIntervention}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-text-secondary leading-relaxed bg-slate-50 dark:bg-surface-elevated/40 p-2.5 rounded border border-slate-100 dark:border-border-subtle font-medium">
                <strong className="text-slate-900 dark:text-text-primary">Why this action: </strong>
                {aiDecision.whyThisAction}
              </p>
            </div>
          </div>

          {/* 6. Alternative Interventions with Estimated Expected Value */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-border-subtle bg-white dark:bg-surface space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-border-subtle">
              <span className="text-[11px] font-bold text-slate-700 dark:text-text-secondary uppercase tracking-wider">
                Intervention Alternatives (Ranked)
              </span>
              <span className="text-[10px] font-mono text-slate-400">Demo Estimates</span>
            </div>
            <div className="space-y-1.5 text-xs">
              {aiDecision.alternatives.map((alt, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "p-2.5 rounded-lg border flex items-center justify-between gap-2",
                    alt.recommended 
                      ? "bg-brand/5 border-brand/30 dark:bg-brand-muted/20" 
                      : "bg-slate-50/60 dark:bg-surface-elevated/40 border-slate-100 dark:border-border-subtle"
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900 dark:text-text-primary truncate">{alt.name}</span>
                      {alt.recommended && (
                        <span className="text-[9px] font-bold text-brand uppercase bg-brand/10 px-1.5 py-0.2 rounded">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{alt.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-slate-800 dark:text-text-primary font-mono">
                      {formatCurrency(alt.estimatedExpectedRecovery)}
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {(alt.estimatedProbability * 100).toFixed(0)}% yield (Est.)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 7. Deterministic Policy Checks (Layer 3) */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-border-subtle bg-white dark:bg-surface space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-border-subtle">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className={cn("w-4 h-4", policyResult.allowed ? "text-emerald-500" : "text-rose-500")} />
                <h4 className="text-xs font-bold text-slate-900 dark:text-text-primary uppercase tracking-wider">
                  Deterministic Policy Checks (Layer 3)
                </h4>
              </div>
              <span className={cn(
                "text-[10px] font-mono font-bold px-2 py-0.5 rounded",
                policyResult.allowed 
                  ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40" 
                  : "text-rose-700 bg-rose-50 dark:bg-rose-950/40"
              )}>
                {policyResult.allowed ? "ACTION APPROVED" : "ACTION BLOCKED"}
              </span>
            </div>

            <div className="space-y-0.5">
              {policyResult.checks.map((check) => (
                <PolicyCheck
                  key={check.id}
                  name={check.name}
                  value={check.value}
                  status={check.status}
                  description={check.description}
                />
              ))}
            </div>

            {!policyResult.allowed && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300">
                <span className="font-bold">Blocked Reason:</span> {policyResult.blockedRules[0]}
              </div>
            )}
          </div>

          {/* 8. Live Execution Pipeline & Razorpay Test Mode Telemetry */}
          <ExecutionTimeline 
            caseItem={currentCase} 
            progress={getCaseExecutionProgress(currentCase.id)} 
          />

          {/* 9. Action Execution Area */}
          <div className="space-y-3 pt-2">
            
            {/* IDLE / READY */}
            {executionState === "idle" && !isRecovered && (
              <div className="space-y-2">
                {policyResult.allowed && !isNoAction ? (
                  <button
                    onClick={handleStartExecute}
                    className="w-full py-3 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold tracking-wide uppercase flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Execute Recovery Action
                  </button>
                ) : isNoAction ? (
                  <div className="space-y-2">
                    <button
                      disabled
                      className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-surface-elevated text-slate-500 dark:text-text-muted text-xs font-bold tracking-wide uppercase flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                      <Scale className="w-4 h-4 text-slate-400" />
                      No Automatic Recovery • Low Yield
                    </button>
                    <button
                      onClick={handleEscalateClick}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-surface-elevated border border-slate-200 dark:border-border-subtle text-slate-700 dark:text-text-secondary text-xs font-semibold hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      Route to Human Risk Desk
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      disabled
                      className="w-full py-3 px-4 rounded-xl bg-slate-200 dark:bg-surface-elevated text-slate-500 dark:text-text-muted text-xs font-bold tracking-wide uppercase flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                      <XCircle className="w-4 h-4 text-rose-500" />
                      Execution Blocked by Policy
                    </button>
                    <button
                      onClick={handleEscalateClick}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Escalate Case to Human Operations Desk
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* AUTHORIZING (Layer 3) */}
            {executionState === "authorizing" && (
              <button disabled className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-surface-elevated text-slate-600 dark:text-text-muted text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200 dark:border-border-subtle">
                <Activity className="w-4 h-4 animate-spin text-brand" />
                Validating Layer 3 Deterministic Guardrails...
              </button>
            )}

            {/* EXECUTING (Layer 4) */}
            {executionState === "executing" && (
              <button disabled className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-surface-elevated text-slate-600 dark:text-text-muted text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200 dark:border-border-subtle">
                <Activity className="w-4 h-4 animate-spin text-brand" />
                Executing Razorpay Gateway Action (Layer 4)...
              </button>
            )}

            {/* VERIFYING (Layer 5) */}
            {executionState === "verifying" && (
              <button disabled className="w-full py-3 px-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs font-semibold flex items-center justify-center gap-2 border border-amber-200 dark:border-amber-900/40">
                <Activity className="w-4 h-4 animate-pulse" />
                Verifying Gateway Telemetry (Layer 5)...
              </button>
            )}

            {/* SUCCESS / RECOVERED */}
            {(executionState === "success" || isRecovered) && (
              <div className="space-y-2.5">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Recovery Confirmed: {formatCurrency(currentCase.amount)} Captured</span>
                  </span>
                  <span className="font-mono text-[10px] bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">200 OK</span>
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 text-center font-medium">
                  Immutable audit ledger updated. Dashboard metrics refreshed.
                </p>
              </div>
            )}

            {/* TIMEOUT (Scenario C / E) */}
            {executionState === "timeout" && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Verification Timed Out</span>
                </div>
                <p className="text-slate-600 dark:text-text-secondary leading-relaxed">
                  Gateway verification response timed out. RECLAIM bounded safety prevented automatic duplicate retry to avoid double debits. Case transferred to human review.
                </p>
              </div>
            )}

            {/* BLOCKED (Scenario B) */}
            {executionState === "blocked" && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-300">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Action Blocked by Layer 3 Policy</span>
                </div>
                <p className="text-slate-600 dark:text-text-secondary leading-relaxed">
                  {policyResult.blockedRules[0] || "Policy guardrails rejected automated recovery."} Case escalated for human review.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Link
                href={`/cases/${currentCase.id}`}
                onClick={onClose}
                className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1.5"
              >
                Open Deep Lifecycle Workspace <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={onClose}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-text-primary transition-colors font-medium"
              >
                Close Drawer
              </button>
            </div>
          </div>

        </div>
      </Drawer>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Authorize Recovery Action?"
        description="Verify financial details before triggering automated gateway recovery."
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-surface-elevated border border-slate-200/80 dark:border-border-subtle space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Case ID</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-text-primary">{currentCase.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer</span>
              <span className="font-semibold text-slate-900 dark:text-text-primary">{currentCase.customer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount</span>
              <span className="font-bold text-slate-900 dark:text-text-primary">{formatCurrency(currentCase.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Action</span>
              <span className="font-medium text-brand">{aiDecision.recommendedIntervention} ({currentCase.strategy})</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-border-subtle">
              <span className="text-slate-500">Deterministic Policy</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 6/6 Invariants Satisfied
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              onClick={() => setIsConfirmOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-border-subtle bg-white dark:bg-surface text-slate-700 dark:text-text-secondary font-medium hover:bg-slate-50 dark:hover:bg-surface-elevated transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmExecute}
              className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white font-semibold transition-colors shadow-sm"
            >
              Authorize & Execute
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
