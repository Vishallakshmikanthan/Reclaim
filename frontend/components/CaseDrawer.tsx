"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency, cn } from "@/lib/utils";
import { Drawer } from "@/components/ui/Drawer";
import { PolicyCheck } from "@/components/ui/PolicyCheck";
import { ProbabilityMeter } from "@/components/ui/ProbabilityMeter";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useReclaim } from "@/lib/context/ReclaimContext";
import { apiClient } from "@/lib/api/client";
import { extractRiskSignals } from "@/lib/recovery/decision-engine";
import { ExecutionTimeline } from "@/components/ui/ExecutionTimeline";
import { RecoveryStrategyTimeline } from "@/components/ui/RecoveryStrategyTimeline";
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
    getCaseStrategy,
    getCasePolicy, 
    getCaseExecutionProgress,
    getCaseExecutionState, 
    executeRecovery,
    escalateCase 
  } = useReclaim();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Retrieve current live case from context
  const currentCase = initialCase ? (getCaseById(initialCase.id) || initialCase) : null;
  const executionState = currentCase ? getCaseExecutionState(currentCase.id) : "idle";

  // Synthesize dynamic AI recommendation, risk signals, intelligent strategy, and deterministic policies
  const localDecision = currentCase ? getCaseDecision(currentCase) : null;
  const [decisionData, setDecisionData] = useState<any>(localDecision);

  useEffect(() => {
    if (currentCase && isOpen) {
      if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
        setDecisionData(getCaseDecision(currentCase));
      } else {
        const fetchDecision = async () => {
          try {
            const res = await apiClient.post<any>(`/api/v1/cases/${currentCase.id}/recovery/decision`);
            const locDec = getCaseDecision(currentCase);
            const decisionSource = res.decision_source || "DETERMINISTIC_FALLBACK";
            const sourceLabel = 
              decisionSource === "AI_NEMOTRON" ? "AI — NVIDIA Nemotron" :
              decisionSource === "MOCK_AI" ? "Mock AI Provider" :
              "Deterministic fallback";

            const recommendedIntervention = res.recommended_intervention 
              ? res.recommended_intervention.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
              : locDec.recommendedIntervention;

            const confTier = (res.confidence !== undefined && res.confidence !== null)
              ? (res.confidence >= 0.8 ? "High" : res.confidence >= 0.5 ? "Medium" : "Low")
              : locDec.confidence;

            setDecisionData({
              ...locDec,
              caseId: res.case_id,
              decisionSource,
              sourceLabel,
              modelId: res.model_id,
              latencyMs: res.latency_ms,
              likelyRootCause: res.diagnosis || locDec.likelyRootCause,
              recoveryProbability: res.recovery_probability,
              expectedRecovery: res.expected_recovery,
              recommendedIntervention,
              whyThisAction: res.rationale || res.explanation || locDec.whyThisAction,
              whyThisMatters: res.diagnosis ? `Risk Diagnosis: ${res.diagnosis}. Grounded in telemetry and merchant policy guardrails.` : locDec.whyThisMatters,
              confidence: confTier,
              confidenceScore: res.confidence !== undefined ? res.confidence : locDec.recoveryProbability,
              evidence: res.evidence || [],
              doNotDo: res.do_not_do || [],
              alternatives: (res.alternatives && res.alternatives.length > 0)
                ? res.alternatives.map((alt: any) => ({
                    name: alt.intervention ? alt.intervention.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "Alternative Action",
                    description: alt.reason_not_preferred || "Secondary recovery strategy",
                    estimatedExpectedRecovery: Math.round((currentCase.amount || 0) * (alt.estimated_confidence || 0.4)),
                    estimatedProbability: alt.estimated_confidence || 0.4,
                    recommended: false,
                  }))
                : locDec.alternatives,
            });
          } catch {
            setDecisionData(getCaseDecision(currentCase));
          }
        };
        fetchDecision();
      }
    }
  }, [currentCase, isOpen, getCaseDecision]);

  if (!initialCase || !currentCase) return null;

  const aiDecision = decisionData || getCaseDecision(currentCase);
  const strategy = getCaseStrategy(currentCase);
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
                {aiDecision.contributingSignals?.positive?.map((pos: any, i: number) => (
                  <div key={i} className="text-slate-600 dark:text-text-secondary text-[11px] flex items-start gap-1">
                    <span className="text-emerald-500 font-bold">+</span>
                    <span>{pos}</span>
                  </div>
                )) || <div className="text-slate-400 text-[11px]">None identified</div>}
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
                  <MinusCircle className="w-3 h-3" /> Negative Factors
                </span>
                {(!aiDecision.contributingSignals?.negative || aiDecision.contributingSignals.negative.length === 0) ? (
                  <div className="text-slate-400 text-[11px]">None identified</div>
                ) : (
                  aiDecision.contributingSignals.negative.map((neg: any, i: number) => (
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
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-brand uppercase tracking-wider flex items-center gap-1.5">
                  <BrainCircuit className="w-3.5 h-3.5" /> AI Decision Intelligence (Layer 2)
                </span>
                <span className={cn(
                  "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border",
                  aiDecision.decisionSource === "AI_NEMOTRON" && "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300",
                  aiDecision.decisionSource === "MOCK_AI" && "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300",
                  (!aiDecision.decisionSource || aiDecision.decisionSource === "DETERMINISTIC_FALLBACK") && "bg-slate-100 text-slate-700 border-slate-200 dark:bg-surface-elevated dark:text-text-secondary"
                )}>
                  {aiDecision.sourceLabel || "Deterministic fallback"}
                </span>
              </div>
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
              <span className="text-[11px] font-bold text-slate-700 dark:text-text-secondary uppercase tracking-wider block">
                Why This Case Is At Risk (Diagnosis)
              </span>
              <p className="text-xs font-semibold text-slate-900 dark:text-text-primary">
                {aiDecision.likelyRootCause}
              </p>
              <p className="text-[11px] text-slate-600 dark:text-text-secondary leading-relaxed bg-slate-50 dark:bg-surface-elevated/40 p-2.5 rounded border border-slate-100 dark:border-border-subtle">
                <strong className="text-slate-800 dark:text-text-primary font-semibold">Operational Context: </strong>
                {aiDecision.whyThisMatters}
              </p>
            </div>

            {/* Grounded Evidence List */}
            {aiDecision.evidence && aiDecision.evidence.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-border-subtle">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Grounded Evidence Signals
                </span>
                <div className="space-y-1 text-xs">
                  {aiDecision.evidence.map((ev: any, i: number) => (
                    <div key={i} className="p-2 rounded bg-slate-50 dark:bg-surface-elevated/50 border border-slate-100 dark:border-border-subtle flex items-baseline justify-between gap-1 text-[11px]">
                      <span className="font-mono font-bold text-[10px] text-brand">[{ev.field}]</span>
                      <span className="text-slate-600 dark:text-text-secondary truncate">{ev.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            {/* Do Not Do Guardrails */}
            {aiDecision.doNotDo && aiDecision.doNotDo.length > 0 && (
              <div className="p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-[11px] space-y-1">
                <span className="font-bold text-amber-800 dark:text-amber-300 uppercase text-[10px] flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-amber-600" /> Bounded Operational Guardrails
                </span>
                <ul className="pl-3 list-disc text-slate-700 dark:text-text-secondary space-y-0.5">
                  {aiDecision.doNotDo.map((rule: string, i: number) => (
                    <li key={i}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}
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
              {aiDecision.alternatives?.map((alt: any, i: number) => (
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

          {/* Intelligent Recovery Strategy & Multi-Step Fallback Chain */}
          <RecoveryStrategyTimeline 
            strategy={strategy} 
            currentExecutionStep={executionState} 
          />

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
              <div className="flex items-center gap-3">
                <Link
                  href={`/cases/${currentCase.id}`}
                  onClick={onClose}
                  className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1.5"
                >
                  Deep Workspace <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <span className="text-slate-300 dark:text-border-subtle">•</span>
                <Link
                  href={`/audit?case=${currentCase.id}`}
                  onClick={onClose}
                  className="text-xs font-semibold text-slate-600 dark:text-text-secondary hover:text-brand hover:underline inline-flex items-center gap-1"
                >
                  Audit Ledger <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
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
