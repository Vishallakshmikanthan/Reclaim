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
import { ExecutionTimeline } from "@/components/ui/ExecutionTimeline";
import { useReclaim } from "@/lib/context/ReclaimContext";
import { extractRiskSignals } from "@/lib/recovery/decision-engine";
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
  Terminal,
  Scale,
  PlusCircle,
  MinusCircle,
  TrendingUp,
  Layers,
  History
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
    getCaseExecutionProgress,
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

  // Dynamic AI synthesis, risk signals, & deterministic policy check
  const aiDecision = useMemo(() => getCaseDecision(currentCase), [currentCase, getCaseDecision]);
  const policyResult = useMemo(() => getCasePolicy(currentCase), [currentCase, getCasePolicy]);
  const signals = useMemo(() => extractRiskSignals(currentCase), [currentCase]);

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
    if (aiDecision.recommendedIntervention === "No Action") {
      toast({
        title: "No Automatic Action",
        description: "Recovery probability is below automated viability threshold. Escalating to human desk.",
        type: "info",
      });
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleConfirmExecute = async () => {
    setIsConfirmModalOpen(false);
    await executeRecovery(currentCase.id);
  };

  const handleRunScenario = async (scenario: "success" | "timeout" | "block" | "failure") => {
    if (scenario === "block") {
      await executeRecovery(currentCase.id, { forceScenario: "block" });
    } else if (scenario === "timeout") {
      await executeRecovery(currentCase.id, { forceScenario: "timeout" });
    } else if (scenario === "failure") {
      await executeRecovery(currentCase.id, { forceScenario: "failure" });
    } else {
      await executeRecovery(currentCase.id, { forceScenario: "success" });
    }
  };

  const isNoAction = aiDecision.recommendedIntervention === "No Action";

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
                Recovery Decision Intelligence
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
            Test Scenarios:
          </span>
          <button 
            onClick={() => handleRunScenario("success")}
            disabled={isRecovered}
            className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-100 transition-colors disabled:opacity-50"
            title="Scenario A: High probability, policy approved, executes & recovers"
          >
            A (Success)
          </button>
          <button 
            onClick={() => handleRunScenario("block")}
            className="px-2.5 py-1 rounded text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 transition-colors"
            title="Scenario B: Policy rule fails, halts automated action & escalates"
          >
            B (Block)
          </button>
          <button 
            onClick={() => handleRunScenario("timeout")}
            className="px-2.5 py-1 rounded text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 hover:bg-amber-100 transition-colors"
            title="Scenario C: Gateway verification times out, halts duplicate retry & escalates"
          >
            C (Timeout)
          </button>
          <button 
            onClick={() => handleRunScenario("failure")}
            className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 dark:bg-surface-elevated text-slate-700 dark:text-text-secondary border border-slate-200 dark:border-border-subtle hover:bg-slate-200 transition-colors"
            title="Scenario D: Action failure / issuer decline, no recovery, escalates"
          >
            D (Failure)
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

      {/* 2. Compact 20-Second Decision Summary Digest (Judge Hero Card) */}
      <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 dark:bg-brand-muted text-brand flex items-center justify-center flex-shrink-0">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-text-muted block">
                Autonomous Synthesis
              </span>
              <div className="text-base font-bold text-slate-900 dark:text-text-primary flex items-center gap-2">
                <span>{aiDecision.recommendedIntervention}</span>
                <span className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded",
                  aiDecision.confidence === "High" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
                  aiDecision.confidence === "Medium" && "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
                  aiDecision.confidence === "Low" && "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                )}>
                  {aiDecision.confidence} Confidence
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-slate-100 dark:border-border-subtle pt-3 md:pt-0 md:pl-6 text-xs">
            <div>
              <span className="text-[10px] font-semibold uppercase text-slate-400 block">Expected Recovery</span>
              <span className="font-bold text-slate-900 dark:text-text-primary text-sm">
                {formatCurrency(aiDecision.expectedRecovery)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase text-slate-400 block">Policy Engine</span>
              <span className={cn(
                "font-bold text-xs inline-flex items-center gap-1 mt-0.5",
                policyResult.allowed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}>
                {policyResult.allowed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                {policyResult.allowed ? "Approved" : "Blocked"}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase text-slate-400 block">Next Action</span>
              <span className="font-medium text-slate-700 dark:text-text-secondary truncate block max-w-[140px] mt-0.5">
                {aiDecision.nextAction}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Lifecycle Progress Stepper (0 to 6) */}
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

      {/* 4. Main Operational Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left 2 Columns: Payment, Risk Signals, AI Intelligence, Alternatives, Timeline */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Top Row: Payment Summary & Risk Signals Grid */}
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
                  <span className="font-mono font-bold text-slate-900 dark:text-text-primary">{formatCurrency(aiDecision.expectedRecovery)}</span>
                </div>
              </div>
            </div>

            {/* Contextual Risk Signals Card */}
            <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-text-secondary flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-brand" /> Contextual Risk Signals
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Layer 1 ML</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-text-muted mt-1">
                  Key multi-dimensional features influencing triage & recovery yield
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-3">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-surface-elevated/70 border border-slate-100 dark:border-border-subtle">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">Payment Age</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-text-primary">{signals.paymentAge}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-surface-elevated/70 border border-slate-100 dark:border-border-subtle">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">Past Successes</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-text-primary">{signals.previousSuccessfulPayments} txns</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-surface-elevated/70 border border-slate-100 dark:border-border-subtle">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">Retry Ceiling</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-text-primary">{signals.retryAttempts} attempts</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-surface-elevated/70 border border-slate-100 dark:border-border-subtle">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">Customer Contact</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-text-primary">{signals.contactCount} today</span>
                </div>
              </div>
            </div>

          </div>

          {/* Root-Cause & Contributing Signals Deep Dive */}
          <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-border-subtle">
              <span className="text-xs font-bold text-brand uppercase tracking-wider flex items-center gap-1.5">
                <BrainCircuit className="w-4 h-4" /> Root-Cause Analysis & Decision Logic (Layer 2)
              </span>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded",
                aiDecision.confidence === "High" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
                aiDecision.confidence === "Medium" && "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
                aiDecision.confidence === "Low" && "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
              )}>
                {aiDecision.confidence} Confidence Indicator
              </span>
            </div>

            {/* Root Cause & Why this matters */}
            <div className="space-y-2">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Likely Root Cause
                </span>
                <p className="text-xs font-semibold text-slate-900 dark:text-text-primary mt-0.5">
                  {aiDecision.likelyRootCause}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-surface-elevated/50 rounded-lg border border-slate-100 dark:border-border-subtle text-xs text-slate-700 dark:text-text-secondary leading-relaxed">
                <strong className="font-semibold text-slate-900 dark:text-text-primary">Why this matters: </strong>
                {aiDecision.whyThisMatters}
              </div>
            </div>

            {/* Contributing Drivers Grid */}
            <div className="pt-2 border-t border-slate-100 dark:border-border-subtle">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Contributing Decision Signals
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1.5">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <PlusCircle className="w-3 h-3" /> Positive Drivers
                  </span>
                  {aiDecision.contributingSignals.positive.map((pos, i) => (
                    <div key={i} className="text-slate-700 dark:text-text-secondary text-[11px] flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold">+</span>
                      <span>{pos}</span>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-surface-elevated/40 border border-slate-100 dark:border-border-subtle space-y-1.5">
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
                    <MinusCircle className="w-3 h-3" /> Negative Factors
                  </span>
                  {aiDecision.contributingSignals.negative.length === 0 ? (
                    <div className="text-slate-400 text-[11px]">None identified</div>
                  ) : (
                    aiDecision.contributingSignals.negative.map((neg, i) => (
                      <div key={i} className="text-slate-700 dark:text-text-secondary text-[11px] flex items-start gap-1.5">
                        <span className="text-rose-600 font-bold">−</span>
                        <span>{neg}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Why This Action */}
            <div className="p-3 rounded-lg bg-brand/5 dark:bg-brand-muted/20 border border-brand/20 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-brand uppercase text-[10px] tracking-wider">
                  Recommended Action: {aiDecision.recommendedIntervention}
                </span>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-text-primary">
                  Yield: {formatCurrency(aiDecision.expectedRecovery)}
                </span>
              </div>
              <p className="text-slate-700 dark:text-text-secondary text-xs leading-relaxed font-medium">
                <strong className="text-slate-900 dark:text-text-primary font-bold">Why this action: </strong>
                {aiDecision.whyThisAction}
              </p>
            </div>
          </div>

          {/* Alternative Interventions (Ranked) */}
          <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-border-subtle">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
                  Ranked Intervention Alternatives
                </h3>
                <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
                  Comparative yield modeling against candidate recovery modalities
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-surface-elevated px-2 py-0.5 rounded">
                Demo Estimates
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {aiDecision.alternatives.map((alt, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                    alt.recommended 
                      ? "bg-brand/5 border-brand/40 dark:bg-brand-muted/20" 
                      : "bg-slate-50/50 dark:bg-surface-elevated/40 border-slate-200/70 dark:border-border-subtle"
                  )}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-text-primary text-xs">
                        {alt.name}
                      </span>
                      {alt.recommended && (
                        <span className="text-[9px] font-bold text-brand uppercase bg-brand/10 px-1.5 py-0.2 rounded border border-brand/20">
                          Selected Strategy
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">{alt.description}</p>
                  </div>
                  <div className="sm:text-right flex-shrink-0">
                    <div className="font-bold text-slate-900 dark:text-text-primary text-xs font-mono">
                      {formatCurrency(alt.estimatedExpectedRecovery)}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {(alt.estimatedProbability * 100).toFixed(0)}% estimated yield
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Decision Timeline */}
          <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-border-subtle">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
                  Decision Processing Timeline
                </h3>
                <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
                  Deterministic progression from ingest to authorization
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Layer 0 $\to$ Layer 5
              </span>
            </div>

            <div className="space-y-0 pl-2">
              {aiDecision.decisionTimeline.map((item, idx) => (
                <div key={idx} className="relative pl-6 pb-3.5 border-l border-slate-200 dark:border-border-subtle last:border-0 last:pb-0">
                  <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400 ring-4 ring-white dark:ring-surface" />
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-text-primary">
                      {item.layer}: {item.step}
                    </span>
                    <span className="font-mono text-slate-400 text-[10px]">{item.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-text-secondary mt-0.5 leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Timeline / Execution Ledger for this case */}
          <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
                  Case Execution Audit Trail
                </h3>
                <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
                  Cryptographically verifiable execution trail for {currentCase.id}
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
              "rounded-lg p-3.5 mb-5 flex items-center justify-center font-bold text-xs tracking-wider uppercase border text-center transition-colors",
              policyResult.allowed 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40"
                : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40"
            )}>
              {policyResult.allowed ? "✓ POLICY APPROVED FOR EXECUTION" : "✕ POLICY BLOCKED • HUMAN REVIEW REQUIRED"}
            </div>

            {/* Live Execution Timeline & Razorpay Telemetry */}
            <div className="mb-5">
              <ExecutionTimeline 
                caseItem={currentCase} 
                progress={getCaseExecutionProgress(currentCase.id)} 
              />
            </div>

            {/* Primary Action Button Area */}
            <div className="space-y-2.5">
              {executionState === "idle" && !isRecovered && (
                <>
                  {policyResult.allowed && !isNoAction ? (
                    <button 
                      onClick={handleStartExecute}
                      className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white py-3 px-4 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-[0.98]"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Execute {aiDecision.recommendedIntervention}
                    </button>
                  ) : isNoAction ? (
                    <div className="space-y-2">
                      <button 
                        disabled
                        className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-surface-elevated text-slate-500 dark:text-text-muted py-3 px-4 rounded-lg text-xs font-bold uppercase cursor-not-allowed border border-slate-200 dark:border-border-subtle"
                      >
                        <Scale className="w-4 h-4 text-slate-400" />
                        No Automatic Action • Low Yield
                      </button>
                      <button 
                        onClick={() => escalateCase(currentCase.id, "Expected recovery below automated threshold")}
                        className="w-full flex items-center justify-center gap-2 bg-slate-50 dark:bg-surface-elevated hover:bg-slate-100 text-slate-700 dark:text-text-secondary py-2.5 px-4 rounded-lg text-xs font-semibold border border-slate-200 dark:border-border-subtle transition-colors"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        Route to Risk & Compliance Desk
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button 
                        disabled
                        className="w-full flex items-center justify-center gap-2 bg-slate-200 dark:bg-surface-elevated text-slate-500 dark:text-text-muted py-3 px-4 rounded-lg text-xs font-bold uppercase cursor-not-allowed"
                      >
                        <XCircle className="w-4 h-4 text-rose-500" />
                        Action Blocked by Policy
                      </button>
                      <button 
                        onClick={() => escalateCase(currentCase.id, policyResult.blockedRules[0])}
                        className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white py-2.5 px-4 rounded-lg text-xs font-semibold transition-all shadow-sm"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Escalate to Human Operations Desk
                      </button>
                    </div>
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
                  Triggering {aiDecision.recommendedIntervention} (Layer 4)...
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
              <span className="font-medium text-brand">{aiDecision.recommendedIntervention} ({currentCase.strategy})</span>
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
