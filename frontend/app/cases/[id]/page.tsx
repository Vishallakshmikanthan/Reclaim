"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { PolicyCheck } from "@/components/ui/PolicyCheck";
import { ProbabilityMeter } from "@/components/ui/ProbabilityMeter";
import { 
  ArrowLeft, BrainCircuit, ShieldAlert, Activity, 
  CheckCircle2, XCircle, Clock, ChevronRight, Play
} from "lucide-react";
import Link from "next/link";

const LIFECYCLE_STEPS = ["DETECT", "ANALYZE", "DECIDE", "POLICY", "ACT", "VERIFY", "RECOVER"];

export default function CaseDecisionPage({ params }: { params: { id: string } }) {
  const [executionState, setExecutionState] = useState<"idle" | "executing" | "verifying" | "success" | "blocked" | "timeout">("idle");
  const [lifecycleProgress, setLifecycleProgress] = useState(3); // DETECT, ANALYZE, DECIDE, POLICY completed
  
  const handleExecute = () => {
    setExecutionState("executing");
    setLifecycleProgress(4); // ACT
    
    setTimeout(() => {
      // Simulate Razorpay Execution taking time
      setExecutionState("verifying");
      setLifecycleProgress(5); // VERIFY
      
      setTimeout(() => {
        // Here we could randomly fail to simulate demo states, but we'll succeed for happy path
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
    }, 2500);
  };

  const handlePolicyBlockDemo = () => {
    setExecutionState("blocked");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/at-risk" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-surface-elevated transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-500 dark:text-text-secondary" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-text-primary flex items-center gap-3">
            Recovery Decision
            <span className="text-sm font-normal text-slate-500 bg-slate-100 dark:bg-surface-elevated px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-border-subtle">
              {params.id || "RC-2024-001"}
            </span>
          </h1>
        </div>
      </div>

      {/* Signature Interaction Lifecycle */}
      <div className="bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-xl p-6 shadow-sm overflow-hidden relative">
        <div className="flex items-center justify-between relative z-10">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const isCompleted = idx <= lifecycleProgress && executionState !== "idle";
            const isCurrent = idx === lifecycleProgress && (executionState === "executing" || executionState === "verifying");
            const isIdleCompleted = executionState === "idle" && idx <= 3;
            
            let statusIcon = <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />;
            if (isIdleCompleted || (isCompleted && !isCurrent)) statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            if (isCurrent) statusIcon = <div className="w-2 h-2 rounded-full bg-brand animate-ping" />;
            if (executionState === "timeout" && idx === 4) statusIcon = <Clock className="w-4 h-4 text-amber-500" />;
            if (executionState === "blocked" && idx === 3) statusIcon = <XCircle className="w-4 h-4 text-rose-500" />;

            return (
              <div key={step} className="flex flex-col items-center gap-2 relative">
                <div className={cn(
                  "text-xs font-semibold tracking-wider",
                  isIdleCompleted || isCompleted || isCurrent ? "text-slate-900 dark:text-text-primary" : "text-slate-400 dark:text-text-muted"
                )}>
                  {step}
                </div>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white dark:bg-surface z-10 transition-colors duration-500",
                  isIdleCompleted || isCompleted || isCurrent ? "border-brand shadow-[0_0_15px_rgba(99,102,241,0.2)]" : "border-slate-200 dark:border-border-subtle",
                  executionState === "blocked" && idx === 3 ? "border-rose-500 shadow-[0_0_15px_rgba(244,63,99,0.2)]" : "",
                  executionState === "success" && idx === 6 ? "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : ""
                )}>
                  {statusIcon}
                </div>
              </div>
            );
          })}
        </div>
        {/* Connecting line */}
        <div className="absolute top-[49px] left-12 right-12 h-[2px] bg-slate-100 dark:bg-surface-elevated -z-0">
          <div 
            className="h-full bg-brand transition-all duration-1000 ease-in-out"
            style={{ width: `${Math.max(0, (executionState === "idle" ? 3 : lifecycleProgress) / 6) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Payment & AI Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary mb-4 flex items-center gap-2">
                Payment Summary
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-3xl font-semibold tabular-nums text-slate-900 dark:text-text-primary">₹8,499</div>
                  <div className="text-sm font-medium text-rose-500 mt-1">Failed: UPI Timeout</div>
                </div>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div className="text-slate-500 dark:text-text-muted">Payment ID</div>
                  <div className="text-slate-900 dark:text-text-primary font-mono">pay_P4qX92vLmK0</div>
                  <div className="text-slate-500 dark:text-text-muted">Customer</div>
                  <div className="text-slate-900 dark:text-text-primary">Priya Sharma</div>
                  <div className="text-slate-500 dark:text-text-muted">Timestamp</div>
                  <div className="text-slate-900 dark:text-text-primary">Oct 24, 14:32 IST</div>
                  <div className="text-slate-500 dark:text-text-muted">Recovery Prob</div>
                  <div className="flex items-center"><ProbabilityMeter probability={0.81} /></div>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50/50 dark:bg-brand-muted/30 border border-indigo-100 dark:border-brand/20 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-indigo-900 dark:text-brand flex items-center gap-2 mb-3">
                <BrainCircuit className="w-4 h-4" /> AI Analysis
              </h3>
              <div className="bg-white/80 dark:bg-surface/80 rounded-lg p-4 border border-indigo-50 dark:border-border-subtle text-sm leading-relaxed text-slate-700 dark:text-text-secondary shadow-sm">
                "UPI timeout appears temporary. Similar failures from this issuing bank have historically shown strong recovery potential after 30 minutes. The customer has not exceeded communication limits and the retry window is satisfied."
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs font-medium text-indigo-700 dark:text-brand">
                <div className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Root cause identified</div>
                <div className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> 94% Confidence</div>
              </div>
            </div>
          </div>

          {/* Recovery Plan */}
          <div className="bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary mb-4">Recovery Plan</h3>
            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              <div className="flex-1 bg-slate-50 dark:bg-surface-elevated border border-slate-200 dark:border-border-subtle rounded-lg p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                <div className="text-xs font-semibold text-slate-500 dark:text-text-muted mb-1 uppercase tracking-wider">Primary Action</div>
                <div className="text-base font-medium text-slate-900 dark:text-text-primary">Retry Payment</div>
                <div className="text-sm text-slate-500 dark:text-text-muted mt-2">Execute immediate Razorpay test-mode retry</div>
              </div>
              <div className="hidden sm:flex items-center justify-center text-slate-300 dark:text-border-subtle">
                <ChevronRight className="w-6 h-6" />
              </div>
              <div className="flex-1 bg-slate-50 dark:bg-surface-elevated border border-slate-200 dark:border-border-subtle rounded-lg p-4 opacity-75">
                <div className="text-xs font-semibold text-slate-500 dark:text-text-muted mb-1 uppercase tracking-wider">Fallback 1</div>
                <div className="text-base font-medium text-slate-900 dark:text-text-primary">Send Payment Link</div>
                <div className="text-sm text-slate-500 dark:text-text-muted mt-2">Hinglish SMS with link</div>
              </div>
              <div className="hidden sm:flex items-center justify-center text-slate-300 dark:text-border-subtle">
                <ChevronRight className="w-6 h-6" />
              </div>
              <div className="flex-1 bg-slate-50 dark:bg-surface-elevated border border-slate-200 dark:border-border-subtle rounded-lg p-4 opacity-50">
                <div className="text-xs font-semibold text-slate-500 dark:text-text-muted mb-1 uppercase tracking-wider">Fallback 2</div>
                <div className="text-base font-medium text-slate-900 dark:text-text-primary">Escalate</div>
                <div className="text-sm text-slate-500 dark:text-text-muted mt-2">Human review required</div>
              </div>
            </div>
          </div>
          
          {/* Audit Timeline */}
          <div className="bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary mb-4 flex items-center justify-between">
              Audit Timeline
              <span className="text-xs font-normal text-slate-500 dark:text-text-muted">Immutable Ledger</span>
            </h3>
            <div className="space-y-0">
              <div className="relative pl-6 pb-6 border-l-2 border-slate-200 dark:border-border-subtle last:border-0 last:pb-0">
                <div className="absolute left-[-5px] top-0.5 w-2 h-2 rounded-full bg-slate-400 ring-4 ring-white dark:ring-surface" />
                <div className="text-xs text-slate-500 dark:text-text-muted mb-0.5">14:32:01 IST • LAYER 0</div>
                <div className="text-sm font-medium text-slate-900 dark:text-text-primary">Case Created</div>
                <div className="text-sm text-slate-600 dark:text-text-secondary mt-1">Payment failure webhook received from Razorpay</div>
              </div>
              <div className="relative pl-6 pb-6 border-l-2 border-slate-200 dark:border-border-subtle last:border-0 last:pb-0">
                <div className="absolute left-[-5px] top-0.5 w-2 h-2 rounded-full bg-slate-400 ring-4 ring-white dark:ring-surface" />
                <div className="text-xs text-slate-500 dark:text-text-muted mb-0.5">14:32:02 IST • LAYER 1</div>
                <div className="text-sm font-medium text-slate-900 dark:text-text-primary">Risk Scored</div>
                <div className="text-sm text-slate-600 dark:text-text-secondary mt-1">Probability 0.81, Expected ₹6,884. Passed triage.</div>
              </div>
              <div className="relative pl-6 pb-6 border-l-2 border-slate-200 dark:border-border-subtle last:border-0 last:pb-0">
                <div className="absolute left-[-5px] top-0.5 w-2 h-2 rounded-full bg-slate-400 ring-4 ring-white dark:ring-surface" />
                <div className="text-xs text-slate-500 dark:text-text-muted mb-0.5">14:32:05 IST • LAYER 2</div>
                <div className="text-sm font-medium text-slate-900 dark:text-text-primary">AI Decision</div>
                <div className="text-sm text-slate-600 dark:text-text-secondary mt-1">Recovery plan generated: Retry → Payment Link</div>
              </div>
              
              {executionState === "success" && (
                <>
                  <div className="relative pl-6 pb-6 border-l-2 border-emerald-200 dark:border-emerald-900/30 last:border-0 last:pb-0">
                    <div className="absolute left-[-5px] top-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-surface" />
                    <div className="text-xs text-emerald-600 dark:text-emerald-500 mb-0.5">Just now • LAYER 4</div>
                    <div className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Action Executed</div>
                    <div className="text-sm text-emerald-600/80 dark:text-emerald-500/80 mt-1">Razorpay POST /payments/pay_P4qX92vLmK0/retry succeeded</div>
                  </div>
                  <div className="relative pl-6 last:border-0 last:pb-0">
                    <div className="absolute left-[-5px] top-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-surface" />
                    <div className="text-xs text-emerald-600 dark:text-emerald-500 mb-0.5">Just now • LAYER 5</div>
                    <div className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Case Resolved</div>
                    <div className="text-sm text-emerald-600/80 dark:text-emerald-500/80 mt-1">₹8,499 recovered successfully</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Policy & Action */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-surface border border-slate-200 dark:border-border-subtle rounded-xl p-6 shadow-sm sticky top-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-text-primary flex items-center gap-2 mb-6">
              <ShieldAlert className="w-5 h-5 text-emerald-500" /> Policy & Guardrails
            </h2>
            
            <div className="space-y-1 mb-6">
              <PolicyCheck name="Retry limit" value="1 / 3 attempts" status="pass" />
              <PolicyCheck name="Retry interval" value="45m elapsed" status="pass" description="Minimum 30m required" />
              <PolicyCheck name="Customer contact limit" value="0 / 2" status="pass" />
              <PolicyCheck name="Auto-action threshold" value="₹8,499 < ₹10k" status="pass" />
              {executionState === "blocked" && (
                <PolicyCheck name="Cooling Period" value="Violated" status="fail" description="Case escalated previously" />
              )}
            </div>

            <div className={cn(
              "rounded-lg p-4 mb-6 flex items-center justify-center font-semibold text-sm tracking-widest uppercase border",
              executionState === "blocked" ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30"
            )}>
              {executionState === "blocked" ? "POLICY BLOCKED" : "POLICY APPROVED"}
            </div>

            {/* Action Area */}
            <div className="space-y-3">
              {executionState === "idle" && (
                <>
                  <button 
                    onClick={handleExecute}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-brand dark:hover:bg-brand-hover text-white py-3 px-4 rounded-lg font-medium transition-colors shadow-sm"
                  >
                    <Play className="w-4 h-4 fill-current" /> Execute Recovery
                  </button>
                  <button 
                    className="w-full bg-white dark:bg-surface hover:bg-slate-50 dark:hover:bg-surface-elevated text-slate-700 dark:text-text-secondary border border-slate-200 dark:border-border-subtle py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Review Plan
                  </button>
                  
                  {/* Demo Controls hidden slightly for demo operator */}
                  <div className="flex gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-border-subtle">
                    <button onClick={handleTimeoutDemo} className="text-[10px] text-slate-400 hover:text-amber-500 uppercase">Demo: Timeout</button>
                    <button onClick={handlePolicyBlockDemo} className="text-[10px] text-slate-400 hover:text-rose-500 uppercase">Demo: Block</button>
                  </div>
                </>
              )}

              {executionState === "executing" && (
                <button disabled className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-surface-elevated text-slate-500 dark:text-text-muted py-3 px-4 rounded-lg font-medium border border-slate-200 dark:border-border-subtle">
                  <Activity className="w-4 h-4 animate-spin" /> Executing Action...
                </button>
              )}
              
              {executionState === "verifying" && (
                <button disabled className="w-full flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 py-3 px-4 rounded-lg font-medium border border-amber-200 dark:border-amber-800/30">
                  <Activity className="w-4 h-4 animate-pulse" /> Verifying Outcome...
                </button>
              )}

              {executionState === "success" && (
                <button disabled className="w-full flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 py-3 px-4 rounded-lg font-medium border border-emerald-200 dark:border-emerald-800/30">
                  <CheckCircle2 className="w-4 h-4" /> Recovered ₹8,499
                </button>
              )}

              {executionState === "timeout" && (
                <div className="text-center space-y-3">
                  <div className="text-amber-600 dark:text-amber-400 text-sm font-medium bg-amber-50 dark:bg-amber-900/20 py-2 rounded border border-amber-200 dark:border-amber-800/30">
                    Recovery action timed out.
                  </div>
                  <div className="text-slate-500 dark:text-text-muted text-xs">
                    Verifying payment status... Action not confirmed — duplicate action prevented.
                  </div>
                </div>
              )}
              
              {executionState === "blocked" && (
                <div className="text-center space-y-3">
                  <div className="text-rose-600 dark:text-rose-400 text-sm font-medium bg-rose-50 dark:bg-rose-900/20 py-2 rounded border border-rose-200 dark:border-rose-800/30">
                    Action Blocked
                  </div>
                  <div className="text-slate-500 dark:text-text-muted text-xs">
                    Recovery recommendation blocked. Case escalated to human review.
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
