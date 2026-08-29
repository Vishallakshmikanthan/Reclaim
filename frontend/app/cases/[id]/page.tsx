"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatCurrency, cn } from "@/lib/utils";
import { PolicyCheck } from "@/components/ui/PolicyCheck";
import { ProbabilityMeter } from "@/components/ui/ProbabilityMeter";
import { StatusBadge } from "@/components/ui/StatusBadge";
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
  ExternalLink
} from "lucide-react";

const LIFECYCLE_STEPS = [
  { key: "DETECT", label: "0. Detect" },
  { key: "ANALYZE", label: "1. Analyze" },
  { key: "DECIDE", label: "2. Decide" },
  { key: "POLICY", label: "3. Policy" },
  { key: "ACT", label: "4. Act" },
  { key: "VERIFY", label: "5. Verify" },
  { key: "RECOVER", label: "6. Recover" }
];

export default function CaseDecisionPage({ params }: { params: { id: string } }) {
  const caseId = params.id || "RC-2024-081";
  const [executionState, setExecutionState] = useState<"idle" | "executing" | "verifying" | "success" | "blocked" | "timeout">("idle");
  const [lifecycleProgress, setLifecycleProgress] = useState(3); // DETECT, ANALYZE, DECIDE, POLICY evaluated

  const handleExecute = () => {
    setExecutionState("executing");
    setLifecycleProgress(4); // ACT
    
    setTimeout(() => {
      setExecutionState("verifying");
      setLifecycleProgress(5); // VERIFY
      
      setTimeout(() => {
        setExecutionState("success");
        setLifecycleProgress(6); // RECOVER
      }, 1500);
    }, 2000);
  };

  const handleTimeoutDemo = () => {
    setExecutionState("executing");
    setLifecycleProgress(4);
    
    setTimeout(() => {
      setExecutionState("timeout");
    }, 2000);
  };

  const handlePolicyBlockDemo = () => {
    setExecutionState("blocked");
    setLifecycleProgress(3);
  };

  const handleResetDemo = () => {
    setExecutionState("idle");
    setLifecycleProgress(3);
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
                {caseId}
              </span>
              <StatusBadge 
                status={executionState === "success" ? "recovered" : executionState === "blocked" ? "stopped" : "inProgress"} 
                size="sm" 
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
              Payment Stream Event ID: <span className="font-mono text-slate-700 dark:text-text-secondary">evt_rzp_9941a8</span> • Customer: Priya Sharma
            </p>
          </div>
        </div>

        {/* Demo State Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 dark:text-text-muted hidden sm:inline">Scenario:</span>
          <button 
            onClick={handleResetDemo}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-medium border transition-colors",
              executionState === "idle" 
                ? "bg-brand text-white border-brand" 
                : "bg-white dark:bg-surface text-slate-600 dark:text-text-muted border-slate-200 dark:border-border-subtle hover:bg-slate-50"
            )}
          >
            Standard Plan
          </button>
          <button 
            onClick={handlePolicyBlockDemo}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-medium border transition-colors",
              executionState === "blocked" 
                ? "bg-rose-600 text-white border-rose-600" 
                : "bg-white dark:bg-surface text-slate-600 dark:text-text-muted border-slate-200 dark:border-border-subtle hover:bg-slate-50"
            )}
          >
            Policy Block
          </button>
          <button 
            onClick={handleTimeoutDemo}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-medium border transition-colors",
              executionState === "timeout" 
                ? "bg-amber-600 text-white border-amber-600" 
                : "bg-white dark:bg-surface text-slate-600 dark:text-text-muted border-slate-200 dark:border-border-subtle hover:bg-slate-50"
            )}
          >
            Timeout
          </button>
        </div>
      </div>

      {/* 2. Lifecycle Progress Stepper (0 to 6) */}
      <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const isCompleted = idx <= lifecycleProgress && executionState !== "idle";
            const isCurrent = idx === lifecycleProgress && (executionState === "executing" || executionState === "verifying");
            const isIdleCompleted = executionState === "idle" && idx <= 3;
            
            let icon = <span className="text-[10px] font-bold text-slate-400 dark:text-text-muted">{idx}</span>;
            if (isIdleCompleted || (isCompleted && !isCurrent)) icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
            if (isCurrent) icon = <div className="w-2 h-2 rounded-full bg-brand animate-ping" />;
            if (executionState === "timeout" && idx === 4) icon = <Clock className="w-3.5 h-3.5 text-amber-500" />;
            if (executionState === "blocked" && idx === 3) icon = <XCircle className="w-3.5 h-3.5 text-rose-500" />;

            return (
              <div key={step.key} className="flex flex-col items-center gap-2 relative">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center border-2 bg-white dark:bg-surface transition-all duration-300",
                  isIdleCompleted || isCompleted || isCurrent 
                    ? "border-brand shadow-sm bg-brand/5 dark:bg-brand-muted" 
                    : "border-slate-200 dark:border-border-subtle",
                  executionState === "blocked" && idx === 3 ? "border-rose-500 bg-rose-50 dark:bg-rose-950/40" : "",
                  executionState === "success" && idx === 6 ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40" : ""
                )}>
                  {icon}
                </div>
                <span className={cn(
                  "text-[11px] font-semibold tracking-tight hidden sm:block whitespace-nowrap",
                  isIdleCompleted || isCompleted || isCurrent ? "text-slate-900 dark:text-text-primary" : "text-slate-400 dark:text-text-muted"
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
            style={{ width: `${Math.max(0, (executionState === "idle" ? 3 : lifecycleProgress) / 6) * 100}%` }}
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
                  Transaction at Risk
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-text-primary">
                    ₹8,499
                  </span>
                  <span className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200/60 dark:border-rose-900/40">
                    UPI Timeout
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-border-subtle space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-text-muted">Payment ID</span>
                  <span className="font-mono text-slate-800 dark:text-text-primary font-medium">pay_P4qX92vLmK0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-text-muted">Customer</span>
                  <span className="text-slate-800 dark:text-text-primary font-medium">Priya Sharma</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-text-muted">Issuing Gateway</span>
                  <span className="text-slate-800 dark:text-text-primary font-medium">HDFC UPI Stack</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-text-muted">Recovery Probability</span>
                  <ProbabilityMeter probability={0.81} />
                </div>
              </div>
            </div>

            {/* AI Intelligence Card */}
            <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-brand flex items-center gap-1.5">
                    <BrainCircuit className="w-3.5 h-3.5" /> AI Recommendation
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                    94% Confidence
                  </span>
                </div>
                <div className="mt-3 p-3.5 bg-slate-50 dark:bg-surface-elevated/70 border border-slate-200/60 dark:border-border-subtle rounded-lg text-xs leading-relaxed text-slate-700 dark:text-text-secondary">
                  "UPI timeout is classified as temporary infrastructure latency. HDFC node traffic normalized 12 minutes ago. Recommend immediate Razorpay test retry followed by payment link fallback."
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-border-subtle flex items-center justify-between text-xs text-slate-500 dark:text-text-muted">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Triage passed
                </span>
                <span className="font-mono text-[11px]">LangGraph v2.4</span>
              </div>
            </div>

          </div>

          {/* Recovery Plan Sequence Flow */}
          <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
                  Multi-Stage Recovery Plan
                </h3>
                <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
                  Ordered fallback hierarchy with policy bounds
                </p>
              </div>
              <span className="text-[11px] font-mono font-medium text-slate-500">
                Step 1 of 3
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
                  Razorpay Retry
                </div>
                <p className="text-xs text-slate-600 dark:text-text-muted mt-1 leading-snug">
                  Immediate idempotent retry via Razorpay test endpoint.
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
                  Payment Link
                </div>
                <p className="text-xs text-slate-500 dark:text-text-muted mt-1 leading-snug">
                  Send personalized WhatsApp / SMS payment link with 24h validity.
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
                  Route case to recovery agent queue if automated steps fail.
                </p>
              </div>
            </div>
          </div>

          {/* Audit Timeline / Execution Ledger */}
          <div className="bg-white dark:bg-surface border border-slate-200/80 dark:border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
                  Immutable Audit Ledger
                </h3>
                <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
                  Cryptographically verifiable execution trail
                </p>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-surface-elevated text-slate-500 border border-slate-200 dark:border-border-subtle">
                SHA-256 Ledger
              </span>
            </div>

            <div className="space-y-0 pl-2">
              <div className="relative pl-6 pb-5 border-l border-slate-200 dark:border-border-subtle">
                <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400 ring-4 ring-white dark:ring-surface" />
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-semibold text-slate-900 dark:text-text-primary">Layer 0: Webhook Ingested</span>
                  <span className="font-mono text-slate-400 dark:text-text-muted text-[11px]">14:32:01 IST</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-text-secondary mt-0.5">
                  Received payment.failed webhook for <span className="font-mono">pay_P4qX92vLmK0</span> from Razorpay.
                </p>
              </div>

              <div className="relative pl-6 pb-5 border-l border-slate-200 dark:border-border-subtle">
                <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400 ring-4 ring-white dark:ring-surface" />
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-semibold text-slate-900 dark:text-text-primary">Layer 1: Risk Assessment</span>
                  <span className="font-mono text-slate-400 dark:text-text-muted text-[11px]">14:32:02 IST</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-text-secondary mt-0.5">
                  Probability evaluated at 0.81, expected value ₹6,884. Passed priority triage threshold.
                </p>
              </div>

              <div className="relative pl-6 pb-5 border-l border-slate-200 dark:border-border-subtle">
                <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400 ring-4 ring-white dark:ring-surface" />
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-semibold text-slate-900 dark:text-text-primary">Layer 2: AI Plan Synthesized</span>
                  <span className="font-mono text-slate-400 dark:text-text-muted text-[11px]">14:32:05 IST</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-text-secondary mt-0.5">
                  Recovery strategy formulated: Immediate Retry → WhatsApp Payment Link fallback.
                </p>
              </div>

              {executionState === "success" && (
                <>
                  <div className="relative pl-6 pb-5 border-l border-emerald-300 dark:border-emerald-800">
                    <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-surface" />
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">Layer 4: Action Executed</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 text-[11px]">Just now</span>
                    </div>
                    <p className="text-xs text-emerald-600/90 dark:text-emerald-400/90 mt-0.5">
                      POST /v1/payments/pay_P4qX92vLmK0/retry returned 200 OK.
                    </p>
                  </div>
                  <div className="relative pl-6">
                    <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-surface" />
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">Layer 5: Case Resolved</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 text-[11px]">Just now</span>
                    </div>
                    <p className="text-xs text-emerald-600/90 dark:text-emerald-400/90 mt-0.5 font-medium">
                      ₹8,499 recovered successfully. Ledger entry committed.
                    </p>
                  </div>
                </>
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
                  executionState === "blocked" ? "text-rose-500" : "text-emerald-500"
                )} />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">
                  Policy Guardrails
                </h3>
              </div>
              <span className="text-[10px] font-mono uppercase font-semibold text-slate-400">
                Deterministic
              </span>
            </div>

            {/* Policy Checklist */}
            <div className="space-y-1 mb-6">
              <PolicyCheck 
                name="Max Retry Limit" 
                value="1 / 3 attempts" 
                status="pass" 
              />
              <PolicyCheck 
                name="Retry Interval" 
                value="45m elapsed" 
                status="pass" 
                description="Threshold: >= 30m required" 
              />
              <PolicyCheck 
                name="Customer Contact Limit" 
                value="0 / 2 today" 
                status="pass" 
              />
              <PolicyCheck 
                name="Auto-Action Value Cap" 
                value="₹8,499 < ₹10k" 
                status="pass" 
              />
              {executionState === "blocked" && (
                <PolicyCheck 
                  name="Cooldown Enforcement" 
                  value="Triggered" 
                  status="fail" 
                  description="Case has active customer dispute flag" 
                />
              )}
            </div>

            {/* Prominent Policy Verdict Banner */}
            <div className={cn(
              "rounded-lg p-3.5 mb-6 flex items-center justify-center font-bold text-xs tracking-wider uppercase border text-center transition-colors",
              executionState === "blocked" 
                ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40" 
                : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40"
            )}>
              {executionState === "blocked" ? "POLICY BLOCKED • HUMAN REVIEW REQUIRED" : "✓ POLICY APPROVED FOR EXECUTION"}
            </div>

            {/* Primary Action Button Area */}
            <div className="space-y-2.5">
              {executionState === "idle" && (
                <>
                  <button 
                    onClick={handleExecute}
                    className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white py-3 px-4 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-[0.99]"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Execute Recovery Action
                  </button>
                  <button 
                    className="w-full flex items-center justify-center gap-1.5 bg-slate-50 dark:bg-surface-elevated hover:bg-slate-100 dark:hover:bg-surface-highlight text-slate-700 dark:text-text-secondary border border-slate-200 dark:border-border-subtle py-2.5 px-4 rounded-lg text-xs font-medium transition-colors"
                  >
                    Modify Recovery Strategy
                  </button>
                </>
              )}

              {executionState === "executing" && (
                <button disabled className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-surface-elevated text-slate-600 dark:text-text-muted py-3 px-4 rounded-lg text-xs font-semibold border border-slate-200 dark:border-border-subtle">
                  <Activity className="w-4 h-4 animate-spin text-brand" />
                  Triggering Razorpay Retry...
                </button>
              )}
              
              {executionState === "verifying" && (
                <button disabled className="w-full flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 py-3 px-4 rounded-lg text-xs font-semibold border border-amber-200 dark:border-amber-900/40">
                  <Activity className="w-4 h-4 animate-pulse" />
                  Verifying Gateway Outcome...
                </button>
              )}

              {executionState === "success" && (
                <div className="space-y-3">
                  <div className="w-full flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 py-3 px-4 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-900/40">
                    <CheckCircle2 className="w-4 h-4" />
                    Successfully Recovered ₹8,499
                  </div>
                  <button 
                    onClick={handleResetDemo}
                    className="w-full text-xs text-slate-500 hover:text-brand flex items-center justify-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset Demo State
                  </button>
                </div>
              )}

              {executionState === "timeout" && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-lg text-xs text-amber-800 dark:text-amber-300">
                    <div className="font-semibold flex items-center gap-1.5 mb-1">
                      <Clock className="w-3.5 h-3.5" /> Action Timed Out
                    </div>
                    Gateway response unconfirmed. Duplicate execution prevented by idempotency key.
                  </div>
                  <button 
                    onClick={handleResetDemo}
                    className="w-full text-xs text-slate-500 hover:text-brand flex items-center justify-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </button>
                </div>
              )}
              
              {executionState === "blocked" && (
                <div className="space-y-3">
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-lg text-xs text-rose-800 dark:text-rose-300">
                    <div className="font-semibold flex items-center gap-1.5 mb-1">
                      <XCircle className="w-3.5 h-3.5" /> Action Prohibited
                    </div>
                    Deterministic rule violation detected. Automated recovery halted and assigned to operations desk.
                  </div>
                  <button 
                    onClick={handleResetDemo}
                    className="w-full text-xs text-slate-500 hover:text-brand flex items-center justify-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset Demo State
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

